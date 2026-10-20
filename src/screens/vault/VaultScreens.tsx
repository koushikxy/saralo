import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { copySecret } from '../../core/security/copySecret';
import { Plus, FileText, KeyRound, StickyNote, MapPin, Receipt, Copy, Camera, ImageIcon } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty, Form, Field, Pick, Button, T, DateField } from '../../ui/kit';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors } from '../../core/theme';
import { localDate } from '../../core/date';
import { confirmAction } from '../../core/confirm';
import { MediaPickerService } from '../../core/storage/mediaPickerService';
import { SecureImage, sealPhoto, deletePhoto } from '../../core/security/securePhoto';
import { useProfileStore, DocType, NoteTag, BillTicketCategory, PasswordCategory } from '../../modules/profile/profileStore';
import { VaultGate, useVaultSession } from './VaultGate';

const pickHeld = async (pick: () => Promise<string | null>) => {
  useVaultSession.getState().setPicking(true);
  try {
    return await pick();
  } finally {
    setTimeout(() => useVaultSession.getState().setPicking(false), 1500);
  }
};

export type VaultKind = 'docs' | 'passwords' | 'notes' | 'addresses' | 'bills';

export const VAULT_INFO: Record<VaultKind, { title: string; icon: any; color: string; empty: string; add: string }> = {
  docs: { title: 'ID documents', icon: FileText, color: '#4F46E5', empty: 'Keep Aadhaar, PAN, passport and licence details and photos here.', add: 'Add document' },
  passwords: { title: 'Passwords', icon: KeyRound, color: '#059669', empty: 'Save logins and Wi-Fi passwords so you never forget them.', add: 'Add password' },
  notes: { title: 'Private notes', icon: StickyNote, color: '#DB2777', empty: 'Locker codes, account numbers or anything private.', add: 'Add note' },
  addresses: { title: 'Addresses', icon: MapPin, color: '#D97706', empty: 'Home, office and family addresses, ready to copy.', add: 'Add address' },
  bills: { title: 'Bills and receipts', icon: Receipt, color: '#0284C7', empty: 'Photos of bills, warranty cards and tickets, so you can find them later.', add: 'Add bill photo' },
};

const DOC_TYPES: DocType[] = ['Aadhaar', 'PAN', 'Driving Licence', 'Passport', 'Voter ID', 'Vehicle RC', 'Insurance', 'Degree', 'Other'];
const NOTE_TAGS: NoteTag[] = ['Personal', 'Wi-Fi / Codes', 'Medical', 'Work', 'Confidential'];
const BILL_TYPES: BillTicketCategory[] = ['Bill', 'Receipt', 'Warranty', 'Ticket', 'Other'];
const PW_TYPES: PasswordCategory[] = ['Social', 'Finance', 'Work', 'Entertainment', 'Other'];
const ADDRESS_LABELS = ['Home', 'Work', 'Parents', 'Other'] as const;

export const VaultListScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const kind: VaultKind = route.params?.type ?? 'docs';
  const info = VAULT_INFO[kind];
  return (
    <VaultGate onCancel={() => navigation.goBack()}>
      <View style={{ flex: 1 }}>
        <Screen>
          <AppBar title={info.title} onBack={() => navigation.goBack()} />
          <VaultItems kind={kind} navigation={navigation} />
        </Screen>
        <Fab label={info.add} icon={Plus} onPress={() => navigation.navigate('VaultForm', { type: kind })} />
      </View>
    </VaultGate>
  );
};

const VaultItems: React.FC<{ kind: VaultKind; navigation: any }> = ({ kind, navigation }) => {
  const c = useColors();
  const p = useProfileStore();
  const info = VAULT_INFO[kind];
  const open = (id: string) => navigation.navigate('VaultForm', { type: kind, id });
  const copyBtn = (text: string, label: string) => (
    <TouchableOpacity onPress={() => copySecret(text)} accessibilityLabel={label} style={{ padding: 10 }}>
      <Copy size={20} color={c.textMuted} />
    </TouchableOpacity>
  );

  const rows: React.ReactElement[] =
    kind === 'docs'
      ? p.documents.map((d) => <Row key={d.id} icon={info.icon} iconColor={info.color} title={d.title} subtitle={`${d.docType} · •••• ${d.docNumber.slice(-4)}`} onPress={() => open(d.id)} right={copyBtn(d.docNumber, 'Copy number')} />)
      : kind === 'passwords'
      ? p.passwords.map((x) => <Row key={x.id} icon={info.icon} iconColor={info.color} title={x.title} subtitle={x.username} onPress={() => open(x.id)} right={copyBtn(x.password, 'Copy password')} />)
      : kind === 'notes'
      ? [...p.notes].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).map((n) => <Row key={n.id} icon={info.icon} iconColor={info.color} title={n.title} subtitle={n.content.slice(0, 80)} onPress={() => open(n.id)} />)
      : kind === 'addresses'
      ? p.addresses.map((a) => {
          const line = [a.flatBuilding, a.streetArea, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ');
          return <Row key={a.id} icon={info.icon} iconColor={info.color} title={`${a.label} · ${a.receiverName}`} subtitle={line} onPress={() => open(a.id)} right={copyBtn(`${a.receiverName}, ${a.phone}\n${line}`, 'Copy address')} />;
        })
      : p.billsAndTickets.map((b) => (
          <Row
            key={b.id}
            leading={b.imageUri ? <SecureImage uri={b.imageUri} style={{ width: 44, height: 44, borderRadius: 10 }} /> : undefined}
            icon={b.imageUri ? undefined : info.icon}
            iconColor={info.color}
            title={b.title}
            subtitle={[b.category, b.amount, new Date(`${b.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}
            onPress={() => open(b.id)}
          />
        ));

  if (rows.length === 0) return <Empty icon={info.icon} title={`No ${info.title.replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())} yet`} text={info.empty} />;
  return <Section>{rows.map((r, i) => React.cloneElement(r, { last: i === rows.length - 1 } as any))}</Section>;
};

const PhotoPicker: React.FC<{ uri?: string | null; onChange: (uri: string) => void; label: string }> = ({ uri, onChange, label }) => {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
      <T v="section" style={{ marginBottom: 8 }}>
        {label}
      </T>
      {uri ? <SecureImage uri={uri} style={{ width: '100%', height: 200, borderRadius: 14, marginBottom: 10, backgroundColor: c.soft }} resizeMode="contain" /> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Camera" icon={Camera} variant="secondary" style={{ flex: 1 }} onPress={async () => {
          const u = await pickHeld(MediaPickerService.takePhoto);
          if (u) onChange(await sealPhoto(u));
        }} />
        <Button title="Gallery" icon={ImageIcon} variant="secondary" style={{ flex: 1 }} onPress={async () => {
          const u = await pickHeld(MediaPickerService.pickFromGallery);
          if (u) onChange(await sealPhoto(u));
        }} />
      </View>
    </View>
  );
};

export const VaultFormScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const kind: VaultKind = route.params?.type ?? 'docs';
  const id: string | undefined = route.params?.id;
  const p = useProfileStore();
  const done = () => navigation.goBack();
  const remove = (title: string, fn: () => void) => confirmAction('Delete this?', title, 'Delete', () => {
    fn();
    done();
  });

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
  const [choice, setChoice] = useState<string>(doc?.docType ?? pw?.category ?? note?.tag ?? addr?.label ?? bill?.category ?? ({ docs: 'Aadhaar', passwords: 'Other', notes: 'Personal', addresses: 'Home', bills: 'Bill' } as const)[kind]);
  const [photo, setPhoto] = useState<string | null>(doc?.frontImageUri ?? bill?.imageUri ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route.params?.scan && kind === 'bills' && !id) pickHeld(MediaPickerService.takePhoto).then(async (u) => u && setPhoto(await sealPhoto(u)));
  }, []);

  const save = () => {
    const before = doc?.frontImageUri ?? bill?.imageUri;
    if (before && before !== photo) deletePhoto(before);
    if (kind === 'docs') {
      const data = { title: a.trim(), docType: choice as DocType, docNumber: b.trim(), holderName: cField.trim(), expiryDate: d.trim() || undefined, frontImageUri: photo, issuer: '', isDigiLockerVerified: false };
      if (doc) p.updateDocument(doc.id, data);
      else if (!p.addDocument(data)) return setError(`You already saved a ${choice}. Edit that one instead.`);
    }
    if (kind === 'passwords') {
      const data = { title: a.trim(), username: b.trim(), password: cField, website: d.trim() || undefined, category: choice as PasswordCategory };
      if (pw) p.updatePassword(pw.id, data);
      else p.addPassword(data);
    }
    if (kind === 'notes') {
      const data = { title: a.trim(), content: b, tag: choice as NoteTag, isPinned: note?.isPinned ?? false };
      if (note) p.updateNote(note.id, data);
      else p.addNote(data);
    }
    if (kind === 'addresses') {
      const data = { receiverName: a.trim(), phone: b.trim(), flatBuilding: cField.trim(), streetArea: d.trim(), city: e.trim(), state: '', pincode: f.trim(), label: choice as (typeof ADDRESS_LABELS)[number] };
      if (addr) p.updateAddress(addr.id, data);
      else p.addAddress(data);
    }
    if (kind === 'bills') {
      if (bill) p.deleteBillTicket(bill.id);
      p.addBillTicket({ title: a.trim() || `${choice}, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, category: choice as BillTicketCategory, imageUri: photo ?? undefined, amount: b.trim() || undefined, date: bill?.date ?? localDate(), notes: cField.trim() || undefined });
    }
    done();
  };

  const existing = doc ?? pw ?? note ?? addr ?? bill;
  const title = `${existing ? 'Edit' : 'New'} ${({ docs: 'document', passwords: 'password', notes: 'note', addresses: 'address', bills: 'bill or receipt' } as const)[kind]}`;
  const canSave = kind === 'bills' ? !!photo || !!a.trim() : !!a.trim();

  return (
    <VaultGate onCancel={done}>
      <Form title={title} onCancel={done} onSave={save} canSave={canSave}>
        {kind === 'docs' ? (
          <>
            <Pick label="Document type" options={DOC_TYPES} value={choice} onChange={setChoice} />
            <Field label="Name for this document" value={a} onChangeText={setA} hint="For example: My Aadhaar" />
            <Field label="Document number" value={b} onChangeText={setB} autoCapitalize="characters" error={error} />
            <Field label="Name on the document" value={cField} onChangeText={setC} />
            <DateField label="Valid till (optional)" value={d} onChange={setD} />
            <PhotoPicker uri={photo} onChange={setPhoto} label="Photo of the document (optional)" />
          </>
        ) : null}
        {kind === 'passwords' ? (
          <>
            <Field label="Website or app" value={a} onChangeText={setA} autoFocus={!pw} />
            <Field label="Username or email" value={b} onChangeText={setB} autoCapitalize="none" />
            <Field label="Password" value={cField} onChangeText={setC} autoCapitalize="none" secureTextEntry={!!pw} />
            <Field label="Website link (optional)" value={d} onChangeText={setD} autoCapitalize="none" />
            <Pick label="Type" options={PW_TYPES} value={choice} onChange={setChoice} />
          </>
        ) : null}
        {kind === 'notes' ? (
          <>
            <Field label="Title" value={a} onChangeText={setA} autoFocus={!note} />
            <Field label="Note" value={b} onChangeText={setB} multiline />
            <Pick label="Type" options={NOTE_TAGS} value={choice} onChange={setChoice} />
          </>
        ) : null}
        {kind === 'addresses' ? (
          <>
            <Pick label="Label" options={ADDRESS_LABELS} value={choice} onChange={setChoice} />
            <Field label="Name" value={a} onChangeText={setA} />
            <Field label="Phone" value={b} onChangeText={setB} keyboardType="phone-pad" />
            <Field label="House, flat, building" value={cField} onChangeText={setC} />
            <Field label="Street and area" value={d} onChangeText={setD} />
            <Field label="City" value={e} onChangeText={setE} />
            <Field label="PIN code" value={f} onChangeText={setF} keyboardType="number-pad" maxLength={6} />
          </>
        ) : null}
        {kind === 'bills' ? (
          <>
            <PhotoPicker uri={photo} onChange={setPhoto} label="Photo" />
            <Pick label="Type" options={BILL_TYPES} value={choice} onChange={setChoice} />
            <Field label="Name (optional)" value={a} onChangeText={setA} hint="For example: TV warranty" />
            <Field label="Amount (optional)" value={b} onChangeText={setB} />
            <Field label="Note (optional)" value={cField} onChangeText={setC} />
          </>
        ) : null}
        {existing ? (
          <Button
            title="Delete"
            variant="secondary"
            style={{ marginHorizontal: 16 }}
            onPress={() =>
              remove(a, () => {
                deletePhoto(doc?.frontImageUri ?? bill?.imageUri);
                kind === 'docs' ? p.deleteDocument(existing.id) : kind === 'passwords' ? p.deletePassword(existing.id) : kind === 'notes' ? p.deleteNote(existing.id) : kind === 'addresses' ? p.deleteAddress(existing.id) : p.deleteBillTicket(existing.id);
              })
            }
          />
        ) : null}
      </Form>
    </VaultGate>
  );
};
