import { create } from 'zustand';
import { localDate } from '../../core/date';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../core/storage/persistStorage';

export interface ProfileInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  dob: string;
  profilePhotoUri: string | null;
  passportPhotoUri: string | null;
  passportPhotoDate: string;
}

export type PasswordCategory = 'Social' | 'Finance' | 'Work' | 'Entertainment' | 'Other';

export interface VaultPassword {
  id: string;
  title: string;
  username: string;
  password: string;
  category: PasswordCategory;
  website?: string;
  notes?: string;
  updatedAt: string;
}

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Parents' | 'Other';
  receiverName: string;
  phone: string;
  flatBuilding: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export type NoteTag = 'Confidential' | 'Wi-Fi / Codes' | 'Medical' | 'Personal' | 'Work';

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  tag: NoteTag;
  isPinned: boolean;
  updatedAt: string;
}

export type BillTicketCategory = 'Bill' | 'Ticket' | 'Receipt' | 'Warranty' | 'Other';

export interface VaultBillTicket {
  id: string;
  title: string;
  category: BillTicketCategory;
  imageUri?: string;
  amount?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export type DocType =
  | 'Aadhaar'
  | 'PAN'
  | 'Driving License'
  | 'Passport'
  | 'Voter ID'
  | 'Degree'
  | 'Vehicle RC'
  | 'Insurance'
  | 'Other';

export interface VaultDocument {
  id: string;
  title: string;
  docType: DocType;
  docNumber: string;
  holderName: string;
  issueDate?: string;
  expiryDate?: string;
  frontImageUri?: string | null;
  backImageUri?: string | null;
  isDigiLockerVerified: boolean;
  issuer: string;
  notes?: string;
}

export interface ResumeItem {
  id: string;
  title: string;
  targetRole: string;
  fileUri?: string | null;
  cloudLink?: string;
  updatedDate: string;
  fileFormat: string;
  atsScore?: number;
  summaryBio?: string;
  skills: string[];
  isPrimary?: boolean;
}

export interface EmploymentContract {
  id: string;
  companyName: string;
  roleTitle: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Internship' | 'Contract';
  startDate: string;
  endDate?: string;
  hrContactName: string;
  hrEmail: string;
  hrPhone: string;
  ctcPackage?: string;
  offerLetterLink?: string;
  relievingLetterLink?: string;
  status: 'Active' | 'Relieved' | 'Past';
  notes?: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type TextSize = 'normal' | 'large' | 'xlarge';

export interface ProfileState {
  profile: ProfileInfo;
  passwords: VaultPassword[];
  addresses: SavedAddress[];
  notes: VaultNote[];
  documents: VaultDocument[];
  billsAndTickets: VaultBillTicket[];
  resumes: ResumeItem[];
  contracts: EmploymentContract[];

  vaultPin: string;
  setVaultPin: (pin: string) => void;

  themeMode: ThemeMode;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  requireBiometrics: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setRequireBiometrics: (val: boolean) => void;

  updateProfile: (data: Partial<ProfileInfo>) => void;
  setProfilePhoto: (uri: string | null) => void;
  setPassportPhoto: (uri: string | null, date?: string) => void;

  addResume: (resume: Omit<ResumeItem, 'id' | 'updatedDate'>) => void;
  updateResume: (id: string, resume: Partial<ResumeItem>) => void;
  deleteResume: (id: string) => void;
  setPrimaryResume: (id: string) => void;

  addPassword: (pw: Omit<VaultPassword, 'id' | 'updatedAt'>) => void;
  updatePassword: (id: string, pw: Partial<VaultPassword>) => void;
  deletePassword: (id: string) => void;

  addAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  updateAddress: (id: string, addr: Partial<SavedAddress>) => void;
  deleteAddress: (id: string) => void;

  addNote: (note: Omit<VaultNote, 'id' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<VaultNote>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  addDocument: (doc: Omit<VaultDocument, 'id'>) => boolean;
  updateDocument: (id: string, doc: Partial<VaultDocument>) => void;
  deleteDocument: (id: string) => void;

  addContract: (contract: Omit<EmploymentContract, 'id'>) => void;
  deleteContract: (id: string) => void;

  addBillTicket: (item: Omit<VaultBillTicket, 'id' | 'createdAt'>) => void;
  deleteBillTicket: (id: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist((set, get) => ({
  profile: {
    name: '',
    title: '',
    email: '',
    phone: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    dob: '',
    profilePhotoUri: null,
    passportPhotoUri: null,
    passportPhotoDate: '',
  },

  vaultPin: '',
  setVaultPin: (pin) => set({ vaultPin: pin }),

  themeMode: 'system',
  textSize: 'normal',
  setTextSize: (size) => set({ textSize: size }),
  requireBiometrics: true,
  setThemeMode: (mode) => set({ themeMode: mode }),
  setRequireBiometrics: (val) => set({ requireBiometrics: val }),

  passwords: [],

  addresses: [],

  notes: [],

  documents: [],

  billsAndTickets: [],

  resumes: [],

  contracts: [],

  updateProfile: (data) =>
    set((state) => ({
      profile: { ...state.profile, ...data },
    })),

  setProfilePhoto: (uri) =>
    set((state) => ({
      profile: { ...state.profile, profilePhotoUri: uri },
    })),

  setPassportPhoto: (uri, date) =>
    set((state) => ({
      profile: {
        ...state.profile,
        passportPhotoUri: uri,
        passportPhotoDate: date || state.profile.passportPhotoDate,
      },
    })),

  addResume: (resume) =>
    set((state) => ({
      resumes: [
        {
          ...resume,
          id: `res-${Date.now()}`,
          updatedDate: localDate(),
        },
        ...state.resumes,
      ],
    })),

  updateResume: (id, resume) =>
    set((state) => ({
      resumes: state.resumes.map((item) =>
        item.id === id
          ? {
              ...item,
              ...resume,
              updatedDate: localDate(),
            }
          : item
      ),
    })),

  deleteResume: (id) =>
    set((state) => ({
      resumes: state.resumes.filter((item) => item.id !== id),
    })),

  setPrimaryResume: (id) =>
    set((state) => ({
      resumes: state.resumes.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      })),
    })),

  addPassword: (pw) =>
    set((state) => ({
      passwords: [
        {
          ...pw,
          id: `pw-${Date.now()}`,
          updatedAt: localDate(),
        },
        ...state.passwords,
      ],
    })),

  updatePassword: (id, pw) =>
    set((state) => ({
      passwords: state.passwords.map((item) =>
        item.id === id
          ? {
              ...item,
              ...pw,
              updatedAt: localDate(),
            }
          : item
      ),
    })),

  deletePassword: (id) =>
    set((state) => ({
      passwords: state.passwords.filter((item) => item.id !== id),
    })),

  addAddress: (addr) =>
    set((state) => ({
      addresses: [
        {
          ...addr,
          id: `addr-${Date.now()}`,
        },
        ...state.addresses,
      ],
    })),

  updateAddress: (id, addr) =>
    set((state) => ({
      addresses: state.addresses.map((item) =>
        item.id === id ? { ...item, ...addr } : item
      ),
    })),

  deleteAddress: (id) =>
    set((state) => ({
      addresses: state.addresses.filter((item) => item.id !== id),
    })),

  addNote: (note) =>
    set((state) => ({
      notes: [
        {
          ...note,
          id: `note-${Date.now()}`,
          updatedAt: localDate(),
        },
        ...state.notes,
      ],
    })),

  updateNote: (id, note) =>
    set((state) => ({
      notes: state.notes.map((item) =>
        item.id === id
          ? {
              ...item,
              ...note,
              updatedAt: localDate(),
            }
          : item
      ),
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((item) => item.id !== id),
    })),

  togglePinNote: (id) =>
    set((state) => ({
      notes: state.notes.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      ),
    })),

  addDocument: (doc) => {
    const UNIQUE_DOC_TYPES: DocType[] = ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID'];
    if (UNIQUE_DOC_TYPES.includes(doc.docType)) {
      const existing = get().documents.find((d) => d.docType === doc.docType);
      if (existing) {
        return false;
      }
    }
    set((state) => ({
      documents: [
        {
          ...doc,
          id: `doc-${Date.now()}`,
        },
        ...state.documents,
      ],
    }));
    return true;
  },

  updateDocument: (id, doc) =>
    set((state) => ({
      documents: state.documents.map((item) =>
        item.id === id ? { ...item, ...doc } : item
      ),
    })),

  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((item) => item.id !== id),
    })),

  addContract: (contract) =>
    set((state) => ({
      contracts: [
        {
          ...contract,
          id: `contract-${Date.now()}`,
        },
        ...state.contracts,
      ],
    })),

  deleteContract: (id) =>
    set((state) => ({
      contracts: state.contracts.filter((c) => c.id !== id),
    })),

  addBillTicket: (item) =>
    set((state) => ({
      billsAndTickets: [
        {
          ...item,
          id: `bt-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...state.billsAndTickets,
      ],
    })),

  deleteBillTicket: (id) =>
    set((state) => ({
      billsAndTickets: state.billsAndTickets.filter((b) => b.id !== id),
    })),
}), { name: 'lifeos-profile', storage: persistStorage })
);
