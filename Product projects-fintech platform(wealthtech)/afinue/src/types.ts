export type InvestmentClass = 'Asset Leasing' | 'Real Estate' | 'Collectibles' | 'Corporate Debt';

export interface Deal {
  id: string;
  title: string;
  category: InvestmentClass;
  returns: string;
  tenure: string;
  minInvestment: string;
  image: string;
  status: 'Open' | 'Closed' | 'Soon';
  location?: string;
  description?: string;
  irr?: number;
}

export interface UserInvestment {
  id: string;
  dealId: string;
  dealTitle: string;
  category: InvestmentClass;
  amount: number;
  currentValue: number;
  returns: string;
  status: 'Active' | 'Matured';
  dateInvested: string;
  expectedPayouts?: {
    date: string;
    amount: number;
    type: 'Interest' | 'Principal';
  }[];
}

export interface Transaction {
  id: string;
  date: string;
  dealTitle: string;
  type: 'Investment' | 'Payout' | 'Interest' | 'Credit';
  amount: number;
  status: 'Successful' | 'Pending' | 'Failed';
  assetClass: InvestmentClass;
}

export interface KYCData {
  pan: string;
  aadhar: string;
  panFileName?: string;
  aadharFileName?: string;
  isResident: boolean;
  pepExposure: boolean;
  employmentStatus: string;
  salaryRange: string;
  status?: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    accountName: string;
  };
}

export interface RelationshipManager {
  name: string;
  email: string;
  phone: string;
  image: string;
}

export interface ReferralStats {
  code: string;
  totalEarned: number;
  successfulReferrals: number;
  pendingReferrals: number;
  history: {
    id: string;
    userName: string;
    date: string;
    reward: number;
    status: 'Completed' | 'Pending';
  }[];
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  address?: string;
  kyc?: KYCData;
  rm?: RelationshipManager;
}
