export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  allocationGroup?: string | null;
  isPinned?: boolean;
}

export type AllocationAlgorithm = '50-30-20' | '60-20-20' | 'flexible' | 'custom';

export interface CustomAlgorithmGroup {
  id: string;
  name: string;
  percentage: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
  walletId: string;
}

export interface Allocation {
  walletId: string;
  walletName?: string;
  percentage: number;
  amount: number;
}

export interface AllocationProposal {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  suggestAllocation: boolean;
  allocations: Allocation[];
  originalInput: string;
}
