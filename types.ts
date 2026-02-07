
import type { ReactElement } from 'react';

export type Page = 'Dashboard' | 'Investors' | 'Investor Profile' | 'Trades' | 'Withdrawals' | 'Messaging' | 'Owner PnL' | 'Settings' | 'Tax Manager';

export type TradeRow = {
  id: string;
  tradeDate: string; 
  ts: string;
  symbol: string;
  strikePrice: number;
  entryPrice: number;
  exitPrice: number;
  lots: number;
  tradeCapital: number;
  pnl: number;
};

export type Investor = {
  id: string;
  name: string;
  phone: string;
  email: string;
  kycStatus: 'none' | 'in_review' | 'verified';
  status: 'pending' | 'active' | 'disabled';
  capitalCommitted: number;
  capitalCurrent: number;
  weeklyWithdrawPref: boolean;
  isOwner: boolean;
  activationDate: string | null;
  createdAt: string;
  weeklyReturnRate?: number;
  monthlyReturnRate?: number;
};

export type AuditLog = {
  id: string;
  investorId: string;
  oldValue: string | null;
  newValue: string;
  field: string;
  changedAt: string;
};

export type DailyAllocation = {
  id: string;
  investorId: string;
  date: string;
  capitalDayStart: number;
  grossAlloc: number;
  taxAlloc: number;
  netAlloc: number;
  performanceFee: number;
  createdAt: string;
};

export type FundTransaction = {
  id: string;
  investorId: string;
  txType: 'add' | 'subtract';
  amount: number;
  note: string | null;
  effectiveDate: string;
  committed: boolean;
  createdAt: string;
};

export type WeeklyProfit = {
  id: string;
  investorId: string;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  savedDate: string;
};

export type MonthlyProfit = {
  id: string;
  investorId: string;
  month: string;
  amount: number;
  savedDate: string;
};

export type OwnerDailyPnl = {
  id: string;
  date: string;
  totalInvestorNetProfit: number;
  totalPerformanceFees: number;
  ownerTake: number;
  savedDate: string;
};

export type OwnerWeeklyProfit = {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  amount: number;
  savedDate: string;
};

export type DailyTotal = {
  id: string;
  date: string;
  grossTotal: number;
  source: 'SheetA' | 'SheetB';
  createdAt: string;
};

export type DailyCharge = {
  id: string;
  date: string;
  taxAmount: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Withdrawal = {
  id: string;
  investorId: string;
  weekStart: string;
  suggestion: number;
  status: 'pending' | 'approved' | 'rejected';
  processedAt: string | null;
};

export type AppState = {
  isReady: boolean;
  investors: Investor[];
  capitalLedger: FundTransaction[];
  trades: TradeRow[];
  dailyTotals: DailyTotal[];
  dailyCharges: DailyCharge[];
  dailyAllocations: DailyAllocation[];
  weeklyProfits: WeeklyProfit[];
  monthlyProfits: MonthlyProfit[];
  ownerDailyPnls: OwnerDailyPnl[];
  ownerWeeklyProfits: OwnerWeeklyProfit[];
  withdrawals: Withdrawal[];
  weeklyPayouts: { investorId: string; amount: number; date: string }[];
  warnings: string[];
  auditLogs: AuditLog[];
  
  loadData: () => Promise<void>;
  addInvestor: (data: any) => void;
  removeInvestor: (id: string) => void;
  updateInvestorEffectiveDate: (id: string, newDate: string) => Promise<void>;
  factoryReset: () => Promise<void>;
  addFund: (id: string, amount: number, date: string) => void;
  subtractFund: (id: string, amount: number, date: string) => void;
  savePendingLedger: (investorId: string, amount: number, date: string) => void;
  confirmPendingLedger: (investorId: string) => void;
  cancelPendingLedger: (investorId: string) => void;
  loadDataFromSheets: (urlA: string, urlB: string) => Promise<void>;
  runAllocationForRange: (start: string, end: string) => void;
  upsertDailyCharge: (date: string, amount: number, note: string | null) => void;
  clearWarnings: () => void;
  addWarning: (msg: string) => void;
};

export type AllocationResult = {
  success: boolean;
  message: string;
  allocations: DailyAllocation[];
};

export type KpiCardProps = {
  title: string;
  value: string;
  icon: ReactElement;
};
