
// Defining GameMode and other shared types used across the application
export type GameMode = '30s' | '1m' | '3m' | '5m' | 'aviator';
export type BetColor = 'RED' | 'GREEN' | 'VIOLET';
export type BigSmall = 'BIG_SMALL' | 'BIG' | 'SMALL';
export type Language = 'EN' | 'HI';

export interface User {
  id: string;
  name: string;
  mobile: string;
  password?: string; 
  depositBalance: number;   
  withdrawBalance: number;  
  referralEarnings: number; 
  referralCode: string;
  referredBy?: string;
  isBlocked: boolean;
  blockReason?: string;
  hasRecharged: boolean;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  specialNotice?: string; 
  createdAt: number; 
}

export interface Bet {
  id: string;
  userId: string;
  amount: number;
  type: 'COLOR' | 'NUMBER' | 'BIG_SMALL' | 'AVIATOR';
  value: BetColor | number | BigSmall | string;
  periodId: string;
  mode: GameMode;
  status: 'PENDING' | 'WIN' | 'LOSS';
  payout?: number;
  multiplier?: number;
  createdAt: number;
}

export interface GameResult {
  periodId: string;
  number: number;
  color: BetColor[];
  mode: GameMode;
  timestamp: number;
}

// FIX: Added RechargeRequest interface as it was missing and causing errors in App.tsx, Wallet.tsx, and Admin.tsx
export interface RechargeRequest {
  id: string;
  userId: string;
  userMobile: string;
  amount: number;
  utr: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
}

// FIX: Added WithdrawRequest interface as it was missing and causing errors in App.tsx, Wallet.tsx, and Admin.tsx
export interface WithdrawRequest {
  id: string;
  userId: string;
  userMobile: string;
  amount: number;
  type: 'UPI' | 'BANK';
  details: {
    upiId?: string;
    holderName?: string;
    accountNo?: string;
    ifsc?: string;
    bankName?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
}

// FIX: Added HelpRequest interface as it was missing and causing errors in Admin.tsx
export interface HelpRequest {
  id: string;
  userId: string;
  mobile: string;
  name: string;
  message: string;
  status: string;
  createdAt: number;
}

export interface AppConfig {
  minRecharge: number;
  minWithdraw: number;
  houseEdge: number;
  autoResult: boolean;
  emergencyStop: boolean;
  rechargeUpi: string;
  platformProfit: number;
  adminPassword?: string;
  recoveryPin?: string;
  nextResultOverrides: Record<GameMode, number | null>;
}
