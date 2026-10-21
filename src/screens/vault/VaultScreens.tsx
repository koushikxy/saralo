import React, { useEffect, useState } from 'react';
import { pickIcon } from '../../ui/pickIcons';
import { useShallow } from 'zustand/react/shallow';
import { View, Linking, Modal, Pressable } from 'react-native';
import { copySecret } from '../../core/security/copySecret';
import { Plus, FileText, KeyRound, StickyNote, MapPin, Receipt, Copy, Camera, ImageIcon, Pencil, Eye, EyeOff, ExternalLink, Phone, X, Pin, PinOff, Wand2, Search } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty, Form, Field, Pick, Button, T, DateField, PhoneField, SuggestField, Chips, showPhone, callable, digitsOf } from '../../ui/kit';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors } from '../../core/theme';
import * as Crypto from 'expo-crypto';
import { localDate } from '../../core/date';
import { confirmAction } from '../../core/confirm';
import { MediaPickerService } from '../../core/storage/mediaPickerService';
import { SecureImage, sealPhoto, deletePhoto } from '../../core/security/securePhoto';
import { APPS, DOC_RULES, STATES, guessAppType, stateFromPin, lookupPin } from '../../core/india';
import { useProfileStore, DocType, NoteTag, BillTicketCategory, PasswordCategory } from '../../modules/profile/profileStore';
import { VaultGate } from './VaultGate';

export type VaultKind = 'docs' | 'passwords' | 'notes' | 'addresses' | 'bills';

export const VAULT_INFO: Record<VaultKind, { title: string; icon: any; color: string; empty: string; add: string; one: string }> = {
  docs: { title: 'ID documents', icon: FileText, color: '#4F46E5', empty: 'Keep Aadhaar, PAN, passport and licence details and photos here.', add: 'Add document', one: 'document' },
  passwords: { title: 'Passwords', icon: KeyRound, color: '#059669', empty: 'Save logins and Wi-Fi passwords so you never forget them.', add: 'Add password', one: 'password' },
  notes: { title: 'Private notes', icon: StickyNote, color: '#DB2777', empty: 'Locker codes, account numbers or anything private.', add: 'Add note', one: 'note' },
  addresses: { title: 'Addresses', icon: MapPin, color: '#D97706', empty: 'Home, office and family addresses, ready to copy.', add: 'Add address', one: 'address' },
  bills: { title: 'Bills and receipts', icon: Receipt, color: '#0284C7', empty: 'Photos of bills, warranty cards and tickets, so you can find them later.', add: 'Add bill photo', one: 'bill or receipt' },
};

const DOC_TYPES: DocType[] = ['Aadhaar', 'PAN', 'Driving Licence', 'Passport', 'Voter ID', 'Vehicle RC', 'Insurance', 'Degree', 'Other'];
const EXPIRES: DocType[] = ['Driving Licence', 'Passport', 'Vehicle RC', 'Insurance', 'Other'];
const NOTE_TAGS: NoteTag[] = ['Personal', 'Wi-Fi / Codes', 'Medical', 'Work', 'Confidential'];
const BILL_TYPES: BillTicketCategory[] = ['Bill', 'Receipt', 'Warranty', 'Ticket', 'Other'];
const PW_TYPES: PasswordCategory[] = ['Social', 'Finance', 'Work', 'Entertainment', 'Other'];
const ADDRESS_LABELS = ['Home', 'Work', 'Parents', 'Other'] as const;
const POPULAR = ['Instagram', 'Gmail', 'Facebook', 'WhatsApp', 'Netflix', 'Amazon', 'Paytm', 'Wi-Fi'];

const SYMBOLS = '!@#$%&*?';
const POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789' + SYMBOLS;

const makePassword = (length = 16): string => {
  const bytes = Crypto.getRandomBytes(length * 2);
  let out = '';
  for (let i = 0; out.length < length; i++) out += POOL[bytes[i % bytes.length] % POOL.length];
  return /\d/.test(out) && /[A-Z]/.test(out) && /[a-z]/.test(out) && /[!@#$%&*?]/.test(out) ? out : makePassword(length);
};

export const passwordProblem = (pw: string, all: { password: string }[]) => {
  if (all.filter((x) => x.password === pw).length > 1) return 'Used for more than one login';
  if (pw.length < 8 || /^\d+$/.test(pw) || /^[a-z]+$/i.test(pw) || /^(password|qwerty|123456|admin|welcome|india)/i.test(pw)) return 'Weak password';
  return '';
};

const BADGE_COLORS = ['#E11D48', '#2563EB', '#059669', '#D97706', '#7C3AED', '#0891B2', '#DB2777', '#4F46E5'];

const AppBadge: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const color = BADGE_COLORS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % BADGE_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <T v="h2" color="#FFFFFF" style={{ fontSize: size * 0.42 }}>
        {name.trim()[0]?.toUpperCase() ?? '?'}
      </T>
    </View>
  );
};

const strengthOf = (pw: string) => {
  if (passwordProblem(pw, [{ password: pw }])) return 0;
  return Math.min(3, [pw.length >= 12, pw.length >= 16, /[a-z]/.test(pw) && /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length - 1);
};

const Strength: React.FC<{ value: string }> = ({ value }) => {
  const c = useColors();
  const level = Math.max(0, strengthOf(value));
  const [label, color] = ([['Weak', c.expense], ['Fair', c.warn], ['Good', '#0891B2'], ['Strong', c.income]] as const)[level];
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= level ? color : c.soft }} />
        ))}
      </View>
      <T v="caption" color={color} style={{ marginTop: 6, fontWeight: '700' }}>
        {label}
        {level === 0 ? ' · use 12+ letters with numbers and symbols' : ''}
      </T>
    </View>
  );
};

const expiryText = (date?: string) => {
  if (!date) return '';
  const days = Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86400000);
  return days < 0 ? 'Expired' : days === 0 ? 'Expires today' : days <= 60 ? `Expires in ${days} days` : '';
};

const longDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const addressLine = (a: { flatBuilding: string; streetArea: string; landmark?: string; city: string; state: string; pincode: string }) =>
  [a.flatBuilding, a.streetArea, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ');

export const VaultListScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const kind: VaultKind = route.params?.type ?? 'docs';
  const info = VAULT_INFO[kind];
  const [query, setQuery] = useState('');
  return (
    <VaultGate onCancel={() => navigation.goBack()}>
      <View style={{ flex: 1 }}>
        <Screen>
          <AppBar title={info.title} onBack={() => navigation.goBack()} />
          <VaultItems kind={kind} navigation={navigation} query={query} setQuery={setQuery} />
        </Screen>
        <Fab label={info.add} icon={Plus} onPress={() => navigation.navigate('VaultForm', { type: kind })} />
      </View>
    </VaultGate>
  );
};

const CopyBtn: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const c = useColors();
  return (
    <TouchableOpacity onPress={() => copySecret(text)} accessibilityLabel={label} style={{ padding: 10 }}>
      <Copy size={20} color={c.textMuted} />
    </TouchableOpacity>
  );
};

const VaultItems: React.FC<{ kind: VaultKind; navigation: any; query: string; setQuery: (v: string) => void }> = ({ kind, navigation, query, setQuery }) => {
  const c = useColors();
  const q = query.trim().toLowerCase();
  const hit = (...parts: (string | undefined)[]) => !q || parts.some((x) => x?.toLowerCase().includes(q));
  const p = useProfileStore(useShallow(({ addAddress, addBillTicket, addDocument, addNote, addPassword, addresses, billsAndTickets, deleteAddress, deleteBillTicket, deleteDocument, deleteNote, deletePassword, documents, notes, passwords, togglePinNote, updateAddress, updateDocument, updateNote, updatePassword }) => ({ addAddress, addBillTicket, addDocument, addNote, addPassword, addresses, billsAndTickets, deleteAddress, deleteBillTicket, deleteDocument, deleteNote, deletePassword, documents, notes, passwords, togglePinNote, updateAddress, updateDocument, updateNote, updatePassword })));
  const info = VAULT_INFO[kind];
  const open = (id: string) => navigation.navigate('VaultItem', { type: kind, id });

  const rows: React.ReactElement[] =
    kind === 'docs'
      ? p.documents.filter((d) => hit(d.title, d.docType, d.holderName)).map((d) => <Row key={d.id} icon={info.icon} iconColor={info.color} title={d.docType === 'Other' ? d.title : d.docType} subtitle={[d.holderName || d.docType, `•••• ${d.docNumber.slice(-4)}`, expiryText(d.expiryDate)].filter(Boolean).join(' · ')} danger={expiryText(d.expiryDate) === 'Expired'} onPress={() => open(d.id)} right={<CopyBtn text={d.docNumber.replace(/\s/g, '')} label="Copy number" />} />)
      : kind === 'passwords'
      ? p.passwords.filter((x) => hit(x.title, x.username, x.website)).map((x) => <Row key={x.id} icon={info.icon} iconColor={info.color} title={x.title} subtitle={[x.username, passwordProblem(x.password, p.passwords)].filter(Boolean).join(' · ')} onPress={() => open(x.id)} right={<CopyBtn text={x.password} label="Copy password" />} />)
      : kind === 'notes'
      ? [...p.notes].filter((n) => hit(n.title, n.content, n.tag)).sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).map((n) => <Row key={n.id} icon={n.isPinned ? Pin : info.icon} iconColor={info.color} title={n.title} subtitle={n.content.slice(0, 80)} onPress={() => open(n.id)} />)
      : kind === 'addresses'
      ? p.addresses.filter((a) => hit(a.label, a.receiverName, addressLine(a))).map((a) => <Row key={a.id} icon={info.icon} iconColor={info.color} title={`${a.label} · ${a.receiverName}`} subtitle={addressLine(a)} onPress={() => open(a.id)} right={<CopyBtn text={`${a.receiverName}, ${showPhone(a.phone)}\n${addressLine(a)}`} label="Copy address" />} />)
      : p.billsAndTickets.filter((b) => hit(b.title, b.category, b.notes)).map((b) => (
          <Row
            key={b.id}
            leading={b.imageUri ? <SecureImage uri={b.imageUri} style={{ width: 44, height: 44, borderRadius: 10 }} /> : undefined}
            icon={b.imageUri ? undefined : info.icon}
            iconColor={info.color}
            title={b.title}
            subtitle={[b.category, b.amount && `₹${b.amount}`, longDate(b.date)].filter(Boolean).join(' · ')}
            onPress={() => open(b.id)}
          />
        ));

  const total = { docs: p.documents, passwords: p.passwords, notes: p.notes, addresses: p.addresses, bills: p.billsAndTickets }[kind].length;
  if (total === 0) return <Empty icon={info.icon} title={`No ${info.title.replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())} yet`} text={info.empty} />;
  const weak = kind === 'passwords' ? p.passwords.filter((x) => passwordProblem(x.password, p.passwords)).length : 0;
  return (
    <>
      {total > 5 ? <Field label="Search" value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search" /> : null}
      {weak ? (
        <T v="sub" color={c.warn} style={{ paddingHorizontal: 16, marginBottom: 4 }}>
          {weak} {weak === 1 ? 'password needs' : 'passwords need'} changing. Open {weak === 1 ? 'it' : 'them'} and tap Make a strong password.
        </T>
      ) : null}
      {rows.length === 0 ? (
        <T v="sub" style={{ padding: 16 }}>
          Nothing matches "{query}".
        </T>
      ) : (
        <Section>{rows.map((r, i) => React.cloneElement(r, { last: i === rows.length - 1 } as any))}</Section>
      )}
    </>
  );
};

const PhotoView: React.FC<{ uri: string }> = ({ uri }) => {
  const c = useColors();
  const [big, setBig] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setBig(true)} accessibilityLabel="Open photo" style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <SecureImage uri={uri} style={{ width: '100%', height: 220, borderRadius: 14, backgroundColor: c.soft }} resizeMode="contain" />
      </TouchableOpacity>
      <Modal visible={big} transparent animationType="fade" onRequestClose={() => setBig(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center' }} onPress={() => setBig(false)}>
          <SecureImage uri={uri} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          <View style={{ position: 'absolute', top: 40, right: 16, padding: 8 }}>
            <X size={28} color="#FFFFFF" />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const Line: React.FC<{ label: string; value?: string; copy?: string; secret?: boolean; action?: React.ReactNode }> = ({ label, value, copy, secret, action }) => {
  const c = useColors();
  const [shown, setShown] = useState(!secret);
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.line }}>
      <View style={{ flex: 1 }}>
        <T v="section">{label}</T>
        <T v="h2" style={{ marginTop: 2, fontWeight: '600' }}>
          {shown ? value : '••••••••'}
        </T>
      </View>
      {secret ? (
        <TouchableOpacity onPress={() => setShown(!shown)} accessibilityLabel={shown ? 'Hide' : 'Show'} style={{ padding: 10 }}>
          {shown ? <EyeOff size={20} color={c.textMuted} /> : <Eye size={20} color={c.textMuted} />}
        </TouchableOpacity>
      ) : null}
      {action}
      {copy ? <CopyBtn text={copy} label={`Copy ${label.toLowerCase()}`} /> : null}
    </View>
  );
};

export const VaultItemScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const kind: VaultKind = route.params?.type ?? 'docs';
  const id: string = route.params?.id;
  const p = useProfileStore(useShallow(({ addAddress, addBillTicket, addDocument, addNote, addPassword, addresses, billsAndTickets, deleteAddress, deleteBillTicket, deleteDocument, deleteNote, deletePassword, documents, notes, passwords, togglePinNote, updateAddress, updateDocument, updateNote, updatePassword }) => ({ addAddress, addBillTicket, addDocument, addNote, addPassword, addresses, billsAndTickets, deleteAddress, deleteBillTicket, deleteDocument, deleteNote, deletePassword, documents, notes, passwords, togglePinNote, updateAddress, updateDocument, updateNote, updatePassword })));
  const doc = p.documents.find((d) => d.id === id);
  const pw = p.passwords.find((x) => x.id === id);
  const note = p.notes.find((n) => n.id === id);
  const addr = p.addresses.find((a) => a.id === id);
  const bill = p.billsAndTickets.find((b) => b.id === id);
  const title = doc ? (doc.docType === 'Other' ? doc.title : doc.docType) : pw?.title ?? note?.title ?? (addr ? `${addr.label} address` : bill?.title ?? '');
  const iconBtn = (icon: any, label: string, onPress: () => void) => {
    const I = icon;
    return (
      <TouchableOpacity onPress={onPress} accessibilityLabel={label} style={{ padding: 10 }}>
        <I size={20} color={c.accent} />
      </TouchableOpacity>
    );
  };

  return (
    <VaultGate onCancel={() => navigation.goBack()}>
      <Screen>
        <AppBar
          title={title}
          onBack={() => navigation.goBack()}
          right={[
            ...(note ? [{ icon: note.isPinned ? PinOff : Pin, label: note.isPinned ? 'Unpin' : 'Pin to top', onPress: () => p.togglePinNote(note.id) }] : []),
            { icon: Pencil, label: 'Edit', onPress: () => navigation.navigate('VaultForm', { type: kind, id }) },
          ]}
        />
        {doc ? (
          <>
            <Line label={`${doc.docType} number`} value={doc.docNumber} copy={doc.docNumber.replace(/\s/g, '')} />
            <Line label="Name on the document" value={doc.holderName} copy={doc.holderName} />
            <Line label="Valid till" value={doc.expiryDate ? [longDate(doc.expiryDate), expiryText(doc.expiryDate)].filter(Boolean).join(' · ') : undefined} />
            {doc.frontImageUri ? <View style={{ marginTop: 16 }}><PhotoView uri={doc.frontImageUri} /></View> : null}
            {doc.backImageUri ? <PhotoView uri={doc.backImageUri} /> : null}
          </>
        ) : null}
        {pw ? (
          <>
            <Line label="Username or email" value={pw.username} copy={pw.username} />
            <Line label="Password" value={pw.password} copy={pw.password} secret />
            {passwordProblem(pw.password, p.passwords) ? (
              <T v="sub" color={c.warn} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                {passwordProblem(pw.password, p.passwords)}. Change it on {pw.title}, then tap edit here and make a strong one.
              </T>
            ) : null}
            <Line label="Type" value={pw.category} />
            {pw.website ? (
              <View style={{ padding: 16 }}>
                <Button title={`Open ${pw.title}`} icon={ExternalLink} variant="secondary" onPress={() => Linking.openURL(/^https?:\/\//.test(pw.website!) ? pw.website! : `https://${pw.website}`).catch(() => {})} />
                <T v="caption" style={{ marginTop: 6 }}>
                  Opens the app if it is on your phone, or the website.
                </T>
              </View>
            ) : null}
          </>
        ) : null}
        {note ? (
          <>
            <T v="body" style={{ paddingHorizontal: 16, paddingVertical: 12, lineHeight: 24 }}>
              {note.content || ' '}
            </T>
            {note.imageUri ? <PhotoView uri={note.imageUri} /> : null}
            <T v="caption" style={{ paddingHorizontal: 16 }}>
              {note.tag} · edited {longDate(note.updatedAt)}
            </T>
            <View style={{ padding: 16 }}>
              <Button title="Copy note" icon={Copy} variant="secondary" onPress={() => copySecret(note.content)} />
            </View>
          </>
        ) : null}
        {addr ? (
          <>
            <Line label="Name" value={addr.receiverName} />
            <Line label="Phone" value={showPhone(addr.phone)} action={callable(addr.phone) ? iconBtn(Phone, 'Call', () => Linking.openURL(`tel:${callable(addr.phone)}`)) : null} />
            <Line label="Address" value={addressLine(addr)} copy={`${addr.receiverName}, ${showPhone(addr.phone)}\n${addressLine(addr)}`} />
          </>
        ) : null}
        {bill ? (
          <>
            {bill.imageUri ? <View style={{ marginTop: 8 }}><PhotoView uri={bill.imageUri} /></View> : null}
            <Line label="Type" value={bill.category} />
            <Line label="Amount" value={bill.amount ? `₹${bill.amount}` : undefined} />
            <Line label="Date" value={longDate(bill.date)} />
            <Line label="Note" value={bill.notes} />
          </>
        ) : null}
      </Screen>
    </VaultGate>
  );
};

const PhotoPicker: React.FC<{ uri?: string | null; onChange: (uri: string) => void; label: string }> = ({ uri, onChange, label }) => {
  const c = useColors();
  const add = async (pick: () => Promise<string | null>) => {
    const u = await pick();
    if (u) onChange(await sealPhoto(u));
  };
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
      <T v="section" style={{ marginBottom: 8 }}>
        {label}
      </T>
      {uri ? <SecureImage uri={uri} style={{ width: '100%', height: 200, borderRadius: 14, marginBottom: 10, backgroundColor: c.soft }} resizeMode="contain" /> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Camera" icon={Camera} variant="secondary" style={{ flex: 1 }} onPress={() => add(() => MediaPickerService.takePhoto())} />
        <Button title="Gallery" icon={ImageIcon} variant="secondary" style={{ flex: 1 }} onPress={() => add(() => MediaPickerService.pickFromGallery())} />
      </View>
    </View>
  );
};

export const VaultFormScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const kind: VaultKind = route.params?.type ?? 'docs';
  const id: string | undefined = route.params?.id;
  const p = useProfileStore(useShallow(({ addAddress, addBillTicket, addDocument, addNote, addPassword, addresses, billsAndTickets, deleteAddress, deleteBillTicket, deleteDocument, deleteNote, deletePassword, documents, notes, passwords, togglePinNote, updateAddress, updateDocument, updateNote, updatePassword }) => ({ addAddress, addBillTicket, addDocument, addNote, addPassword, addresses, billsAndTickets, deleteAddress, deleteBillTicket, deleteDocument, deleteNote, deletePassword, documents, notes, passwords, togglePinNote, updateAddress, updateDocument, updateNote, updatePassword })));
  const done = () => navigation.goBack();

  const doc = p.documents.find((d) => d.id === id);
  const pw = p.passwords.find((x) => x.id === id);
  const note = p.notes.find((n) => n.id === id);
  const addr = p.addresses.find((a) => a.id === id);
  const bill = p.billsAndTickets.find((b) => b.id === id);

  const [a, setA] = useState(doc?.title ?? pw?.title ?? note?.title ?? addr?.receiverName ?? bill?.title ?? '');
  const [b, setB] = useState(doc?.docNumber ?? pw?.username ?? note?.content ?? addr?.phone ?? bill?.amount ?? '');
  const [cField, setC] = useState(doc?.holderName ?? pw?.password ?? addr?.flatBuilding ?? bill?.notes ?? '');
  const [d, setD] = useState(doc?.expiryDate ?? pw?.website ?? addr?.streetArea ?? '');
  const [e, setE] = useState(addr?.city ?? '');
  const [f, setF] = useState(addr?.pincode ?? '');
  const [state, setState] = useState(addr?.state ?? '');
  const [choice, setChoice] = useState<string>(doc?.docType ?? pw?.category ?? note?.tag ?? addr?.label ?? bill?.category ?? ({ docs: 'Aadhaar', passwords: 'Other', notes: 'Personal', addresses: 'Home', bills: 'Bill' } as const)[kind]);
  const [photo, setPhoto] = useState<string | null>(doc?.frontImageUri ?? bill?.imageUri ?? note?.imageUri ?? null);
  const [back, setBack] = useState<string | null>(doc?.backImageUri ?? null);
  const [showPw, setShowPw] = useState(!pw);
  const [error, setError] = useState('');
  const rule = DOC_RULES[choice] ?? DOC_RULES.Other;

  useEffect(() => {
    if (route.params?.scan && kind === 'bills' && !id) MediaPickerService.takePhoto().then(async (u) => u && setPhoto(await sealPhoto(u)));
  }, []);

  const typeDoc = (v: string) => {
    setError('');
    setB(rule.format ? rule.format(v) : v.toUpperCase().replace(choice === 'Insurance' || choice === 'Degree' ? /[^0-9A-Z/-]/g : /[^0-9A-Z]/g, ''));
  };

  const typeApp = (v: string) => {
    setA(v);
    const guess = guessAppType(v);
    if (guess) setChoice(guess);
    const known = APPS.find((x) => x.name.toLowerCase() === v.trim().toLowerCase());
    if (known && !d) setD(known.site);
  };

  const typePin = (v: string) => {
    const pin = digitsOf(v).slice(0, 6);
    setF(pin);
    const guess = stateFromPin(pin);
    if (guess && (!state || state === stateFromPin(f) || !STATES.includes(state))) setState(guess);
    if (pin.length === 6)
      lookupPin(pin).then((found) => {
        if (!found) return;
        if (found.city) setE((city) => city || found.city);
        if (found.state) setState(found.state);
      });
  };

  const save = () => {
    const before = doc?.frontImageUri ?? bill?.imageUri ?? note?.imageUri;
    if (kind === 'docs') {
      const number = b.trim();
      if (!rule.test.test(number.replace(/\s/g, ''))) return setError(`This ${choice} number does not look right. ${rule.hint}`);
      const data = { title: choice === 'Other' ? a.trim() : choice, docType: choice as DocType, docNumber: number, holderName: cField.trim(), expiryDate: EXPIRES.includes(choice as DocType) ? d.trim() || undefined : undefined, frontImageUri: photo, backImageUri: back, issuer: '', isDigiLockerVerified: false };
      if (doc) p.updateDocument(doc.id, data);
      else if (!p.addDocument(data)) return setError(`You already saved a ${choice}. Edit that one instead.`);
    }
    if (kind === 'passwords') {
      const data = { title: a.trim(), username: b.trim(), password: cField, website: d.trim() || undefined, category: choice as PasswordCategory };
      if (pw) p.updatePassword(pw.id, data);
      else p.addPassword(data);
    }
    if (kind === 'notes') {
      const data = { title: a.trim(), content: b, tag: choice as NoteTag, isPinned: note?.isPinned ?? false, imageUri: photo };
      if (note) p.updateNote(note.id, data);
      else p.addNote(data);
    }
    if (kind === 'addresses') {
      if (f && f.length !== 6) return setError('PIN code has 6 digits');
      const data = { receiverName: a.trim(), phone: b, flatBuilding: cField.trim(), streetArea: d.trim(), city: e.trim(), state: state.trim(), pincode: f, label: choice as (typeof ADDRESS_LABELS)[number] };
      if (addr) p.updateAddress(addr.id, data);
      else p.addAddress(data);
    }
    if (kind === 'bills') {
      if (bill) p.deleteBillTicket(bill.id);
      p.addBillTicket({ title: a.trim() || `${choice}, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, category: choice as BillTicketCategory, imageUri: photo ?? undefined, amount: b.trim() || undefined, date: bill?.date ?? localDate(), notes: cField.trim() || undefined });
    }
    if (before && before !== photo) deletePhoto(before);
    if (doc?.backImageUri && doc.backImageUri !== back) deletePhoto(doc.backImageUri);
    done();
  };

  const existing = doc ?? pw ?? note ?? addr ?? bill;
  const title = `${existing ? 'Edit' : 'New'} ${VAULT_INFO[kind].one}`;
  const canSave = kind === 'bills' ? !!photo || !!a.trim() : kind === 'docs' ? !!b.trim() && (choice !== 'Other' || !!a.trim()) : !!a.trim();

  const form = (
    <Form title={title} onCancel={done} onSave={save} canSave={canSave}>
      {kind === 'docs' ? (
        <>
          <Pick label="Document type" options={DOC_TYPES} value={choice} onChange={(v) => { setChoice(v); setB(''); setError(''); }} meta={pickIcon} />
          {choice === 'Other' ? <Field label="Document name" value={a} onChangeText={setA} maxLength={40} hint="For example: Ration card" /> : null}
          <Field
            label={choice === 'Other' ? 'Number' : `${choice} number`}
            value={b}
            onChangeText={typeDoc}
            keyboardType={rule.keyboard(b.replace(/\s/g, ''))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={rule.max}
            hint={rule.hint}
            error={error}
          />
          <Field label="Name on the document" value={cField} onChangeText={setC} autoCapitalize="words" maxLength={50} />
          {EXPIRES.includes(choice as DocType) ? <DateField label="Valid till (optional)" value={d} onChange={setD} /> : null}
          <PhotoPicker uri={photo} onChange={setPhoto} label="Front side photo (optional)" />
          <PhotoPicker uri={back} onChange={setBack} label="Back side photo (optional)" />
        </>
      ) : null}
      {kind === 'passwords' ? (
        <>
          {APPS.some((x) => x.name === a) ? (
            <View style={{ marginHorizontal: 16, marginBottom: 18, padding: 14, borderRadius: 20, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <AppBadge name={a} size={48} />
              <View style={{ flex: 1 }}>
                <T v="h2">{a}</T>
                <T v="caption">{choice}</T>
              </View>
              <TouchableOpacity onPress={() => { setA(''); setD(''); }} style={{ padding: 8 }}>
                <T v="strong" color={c.accent}>
                  Change
                </T>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <SuggestField label="App or website" value={a} onChangeText={typeApp} onPick={typeApp} options={APPS.map((x) => x.name)} maxLength={40} autoFocus={!pw} placeholder="Search or type a name" />
              {!a ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: -6, marginBottom: 14 }}>
                  {POPULAR.map((name) => (
                    <TouchableOpacity key={name} onPress={() => typeApp(name)} style={{ width: '25%', alignItems: 'center', paddingVertical: 8 }} accessibilityLabel={name}>
                      <AppBadge name={name} size={44} />
                      <T v="caption" lines={1} style={{ marginTop: 6 }}>
                        {name}
                      </T>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </>
          )}
          <Field label="Username, email or phone" value={b} onChangeText={setB} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={80} />
          <Field
            label="Password"
            value={cField}
            onChangeText={setC}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showPw}
            maxLength={128}
            suffix={
              <TouchableOpacity onPress={() => setShowPw(!showPw)} accessibilityLabel={showPw ? 'Hide password' : 'Show password'} style={{ padding: 8, marginRight: -6 }}>
                {showPw ? <EyeOff size={22} color={c.textMuted} /> : <Eye size={22} color={c.textMuted} />}
              </TouchableOpacity>
            }
            below={
              <>
                {cField ? <Strength value={cField} /> : null}
                <Button title="Generate strong password" icon={Wand2} variant="secondary" style={{ height: 46, marginTop: 10 }} onPress={() => { setC(makePassword()); setShowPw(true); }} />
              </>
            }
          />
          <Field label="Website (optional)" value={d} onChangeText={setD} autoCapitalize="none" keyboardType="url" maxLength={200} hint={d ? 'Used to open the app or site from the vault' : undefined} />
          <Pick label="Type" options={PW_TYPES} value={choice} onChange={setChoice} meta={pickIcon} />
        </>
      ) : null}
      {kind === 'notes' ? (
        <>
          <Field label="Title" value={a} onChangeText={setA} autoFocus={!note} maxLength={60} />
          <Field label="Note" value={b} onChangeText={setB} multiline tall maxLength={5000} hint={`${b.length} / 5000`} />
          <PhotoPicker uri={photo} onChange={setPhoto} label="Photo (optional)" />
          <Pick label="Type" options={NOTE_TAGS} value={choice} onChange={setChoice} meta={pickIcon} />
        </>
      ) : null}
      {kind === 'addresses' ? (
        <>
          <Pick label="Label" options={ADDRESS_LABELS} value={choice} onChange={setChoice} />
          <Field label="Name" value={a} onChangeText={setA} autoCapitalize="words" maxLength={50} />
          <PhoneField label="Phone" value={b} onChange={setB} />
          <Field label="House, flat, building" value={cField} onChangeText={setC} maxLength={80} />
          <Field label="Street and area" value={d} onChangeText={setD} maxLength={100} />
          <Field label="PIN code" value={f} onChangeText={typePin} keyboardType="number-pad" maxLength={6} error={error} hint="We fill in the city and state from the PIN code" />
          <Field label="City" value={e} onChangeText={setE} autoCapitalize="words" maxLength={40} />
          <SuggestField label="State" value={state} onChangeText={setState} onPick={setState} options={STATES} autoCapitalize="words" maxLength={40} />
        </>
      ) : null}
      {kind === 'bills' ? (
        <>
          <PhotoPicker uri={photo} onChange={setPhoto} label="Photo" />
          <Pick label="Type" options={BILL_TYPES} value={choice} onChange={setChoice} meta={pickIcon} />
          <Field label="Name (optional)" value={a} onChangeText={setA} maxLength={40} hint="For example: TV warranty" />
          <Field label="Amount (optional)" prefix="₹" value={b} onChangeText={(v) => setB(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" maxLength={10} />
          <Field label="Note (optional)" value={cField} onChangeText={setC} multiline maxLength={300} />
        </>
      ) : null}
      {existing ? (
        <Button
          title="Delete"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() =>
            confirmAction('Delete this?', a || title, 'Delete', () => {
              deletePhoto(doc?.frontImageUri ?? bill?.imageUri ?? note?.imageUri);
              deletePhoto(doc?.backImageUri);
              kind === 'docs' ? p.deleteDocument(existing.id) : kind === 'passwords' ? p.deletePassword(existing.id) : kind === 'notes' ? p.deleteNote(existing.id) : kind === 'addresses' ? p.deleteAddress(existing.id) : p.deleteBillTicket(existing.id);
              navigation.pop(2);
            })
          }
        />
      ) : null}
    </Form>
  );

  return existing ? <VaultGate onCancel={done}>{form}</VaultGate> : form;
};
