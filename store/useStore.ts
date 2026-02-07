import { create } from 'zustand';
import type { AppState, Investor, FundTransaction, DailyAllocation, WeeklyProfit, MonthlyProfit, OwnerDailyPnl, OwnerWeeklyProfit, TradeRow, DailyTotal, DailyCharge, Withdrawal, AuditLog } from '../types';
import dayjs from '../utils/dayjs';
import { db } from '../services/supabase';

const DAILY_PROFIT_CAP = 0.00625 / 5; 
const PROFIT_FEE_RATE = 0.00126;

const gSheetUrlToCsvUrl = (url: string): string => {
    try {
        const idMatch = url.match(/\/d\/(.*?)(\/|$)/);
        if (!idMatch) return url;
        const id = idMatch[1];
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
    } catch { return url; }
};

const parseCsvLine = (line: string): string[] => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
        else cur += char;
    }
    result.push(cur.trim());
    return result;
};

const parseCurrency = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/[₹,\s]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};

const smartParseDate = (dateStr: string) => {
    if (!dateStr) return dayjs();
    let d = dayjs(dateStr, 'DD/MM/YYYY HH:mm:ss', true);
    if (d.isValid()) return d;
    d = dayjs(dateStr, 'DD/MM/YYYY', true);
    if (d.isValid()) return d;
    return dayjs(dateStr);
};

const FIXED_OWNER: Investor = {
    id: 'owner-rudra',
    name: 'Rudra Patel',
    phone: '123456789',
    email: 'rudra.patel@algopro.com',
    kycStatus: 'verified',
    status: 'active',
    capitalCommitted: 0,
    capitalCurrent: 0,
    weeklyWithdrawPref: false,
    isOwner: true,
    activationDate: '2023-01-01',
    createdAt: dayjs().toISOString()
};

const getCapitalAtDate = (investorId: string, date: string, state: any, currentDayAllocs: DailyAllocation[]): number => {
    const targetDate = dayjs(date).startOf('day');
    const txs = state.capitalLedger || [];
    const historicalAllocs = state.dailyAllocations || [];

    const capFromTxs = txs
        .filter((l: any) => l.investorId === investorId && l.committed && dayjs(l.effectiveDate).isSameOrBefore(targetDate, 'day'))
        .reduce((sum: number, l: any) => sum + (l.txType === 'add' ? l.amount : -l.amount), 0);

    const pnlFromHistorical = historicalAllocs
        .filter((a: any) => a.investorId === investorId && dayjs(a.date).isBefore(targetDate, 'day'))
        .reduce((sum: number, a: any) => sum + (a.netAlloc - a.performanceFee), 0);

    const pnlFromCurrentBatch = currentDayAllocs
        .filter((a: any) => a.investorId === investorId && dayjs(a.date).isBefore(targetDate, 'day'))
        .reduce((sum: number, a: any) => sum + (a.netAlloc - a.performanceFee), 0);

    return Math.max(0, capFromTxs + pnlFromHistorical + pnlFromCurrentBatch);
};

export const useStore = create<AppState>()((set, get) => ({
    isReady: false,
    investors: [],
    capitalLedger: [],
    trades: [],
    dailyTotals: [],
    dailyCharges: [],
    dailyAllocations: [],
    weeklyProfits: [],
    monthlyProfits: [],
    ownerDailyPnls: [],
    ownerWeeklyProfits: [],
    withdrawals: [],
    weeklyPayouts: [],
    warnings: [],
    auditLogs: [],

    addWarning: (msg) => set(s => ({ warnings: [...new Set([...s.warnings, msg])] })),
    clearWarnings: () => set({ warnings: [] }),

    loadData: async () => {
        try {
            const cloudData = await db.loadAll();
            let investors = (cloudData.investors || []).map((i: any) => ({
                ...i,
                capitalCommitted: Number(i.capitalCommitted || 0),
                capitalCurrent: Number(i.capitalCurrent || 0)
            }));
            
            if (!investors.find((i: any) => i.id === 'owner-rudra')) {
                investors.push(FIXED_OWNER);
                await db.upsert('investors', FIXED_OWNER);
            }
            
            set({ 
                investors,
                trades: cloudData.trades || [],
                dailyAllocations: cloudData.daily_allocations || [],
                dailyCharges: cloudData.daily_charges || [],
                capitalLedger: cloudData.fund_transactions || [], 
                ownerDailyPnls: cloudData.owner_daily_pnls || [],
                ownerWeeklyProfits: cloudData.owner_weekly_profits || [],
                weeklyProfits: cloudData.weekly_profits || [],
                monthlyProfits: cloudData.monthly_profits || [],
                dailyTotals: cloudData.daily_totals || [],
                auditLogs: cloudData.audit_logs || [],
                isReady: true 
            });
            get().refreshBalances();
            get().subscribeToChanges();
        } catch (e: any) {
            console.error("Load failed", e);
            get().addWarning("DATABASE ERROR: " + e.message);
            // Crucial: set isReady to true so the app actually shows an error state instead of a blank loader
            set({ investors: [FIXED_OWNER], isReady: true });
        }
    },

    refreshBalances: () => {
        const state = get();
        set(s => ({
            investors: s.investors.map(i => ({ 
                ...i, 
                capitalCurrent: getCapitalAtDate(i.id, dayjs().add(1, 'day').format('YYYY-MM-DD'), state, []) 
            }))
        }));
    },

    subscribeToChanges: () => {
        const tables = ['investors', 'trades', 'daily_allocations', 'daily_charges', 'fund_transactions', 'daily_totals', 'audit_logs'];
        tables.forEach(table => {
            db.subscribe(table, (payload) => {
                const { eventType, new: newRow, old: oldRow } = payload;
                const tableToStateKey: any = {
                    'investors': 'investors', 'trades': 'trades', 'daily_allocations': 'dailyAllocations',
                    'daily_charges': 'dailyCharges', 'fund_transactions': 'capitalLedger',
                    'daily_totals': 'dailyTotals', 'audit_logs': 'auditLogs'
                };
                const key = tableToStateKey[table];
                if (!key) return;
                set((state: any) => {
                    let list = [...state[key]];
                    if (eventType === 'INSERT') { if (!list.find((item: any) => item.id === newRow.id)) list.push(newRow); }
                    else if (eventType === 'UPDATE') { list = list.map((item: any) => item.id === newRow.id ? newRow : item); }
                    else if (eventType === 'DELETE') { list = list.filter((item: any) => item.id !== oldRow.id); }
                    return { [key]: list };
                });
                if (['fund_transactions', 'daily_allocations', 'investors', 'trades'].includes(table)) { get().refreshBalances(); }
            });
        });
    },

    addInvestor: async (data) => {
        const id = `investor-${Date.now()}`;
        const today = dayjs().format('YYYY-MM-DD');
        const inv: Investor = {
            ...data, id, status: 'active', kycStatus: 'none',
            capitalCurrent: 0, createdAt: dayjs().toISOString(),
            activationDate: data.activationDate || today, isOwner: false
        };
        await db.upsert('investors', inv);
        if (inv.capitalCommitted > 0) { await get().addFund(id, inv.capitalCommitted, inv.activationDate || today); }
    },

    removeInvestor: async (id) => {
        if (id === 'owner-rudra') return;
        const txsToDelete = get().capitalLedger.filter(l => l.investorId === id);
        for(const tx of txsToDelete) { await db.delete('fund_transactions', tx.id); }
        await db.delete('investors', id);
        get().refreshBalances();
    },

    updateInvestorEffectiveDate: async (id, newDate) => {
        const state = get();
        const investor = state.investors.find(i => i.id === id);
        if (!investor) return;
        await db.upsert('investors', { ...investor, activationDate: newDate });
        await get().runAllocationForRange(newDate, dayjs().format('YYYY-MM-DD'));
        get().refreshBalances();
    },

    addFund: async (investorId, amount, effectiveDate) => {
        const id = `tx-${Date.now()}`;
        const tx: FundTransaction = { 
            id, investorId, txType: 'add', amount: Number(amount), 
            note: 'Capital Addition', effectiveDate, committed: true, 
            createdAt: dayjs().toISOString() 
        };
        await db.upsert('fund_transactions', tx);
        get().runAllocationForRange(effectiveDate, dayjs().format('YYYY-MM-DD'));
    },

    subtractFund: async (investorId, amount, effectiveDate) => {
        const id = `tx-${Date.now()}`;
        const tx: FundTransaction = { 
            id, investorId, txType: 'subtract', amount: Number(amount), 
            note: 'Capital Withdrawal', effectiveDate, committed: true, 
            createdAt: dayjs().toISOString() 
        };
        await db.upsert('fund_transactions', tx);
        get().runAllocationForRange(effectiveDate, dayjs().format('YYYY-MM-DD'));
    },

    upsertDailyCharge: async (date, taxAmount, note) => {
        const id = `charge-${date}`;
        await db.upsert('daily_charges', { id, date, taxAmount: Number(taxAmount), note, updatedAt: dayjs().toISOString() });
        get().runAllocationForRange(date, dayjs().format('YYYY-MM-DD'));
    },

    loadDataFromSheets: async (urlA, urlB) => {
        try {
            const [resA, resB] = await Promise.all([fetch(gSheetUrlToCsvUrl(urlA)), fetch(gSheetUrlToCsvUrl(urlB))]);
            const [txtA, txtB] = await Promise.all([resA.text(), resB.text()]);
            
            const trades: TradeRow[] = txtA.trim().split('\n').slice(1).map((l, idx) => {
                const v = parseCsvLine(l);
                const ts = smartParseDate(v[0]);
                return { 
                    id: `tr-${idx}-${ts.valueOf()}`, tradeDate: ts.format('YYYY-MM-DD'), ts: ts.toISOString(), 
                    symbol: v[1] || 'Unknown', strikePrice: parseCurrency(v[2]), entryPrice: parseCurrency(v[3]), 
                    exitPrice: parseCurrency(v[4]), lots: parseInt(v[5] || '0'), tradeCapital: parseCurrency(v[6]), pnl: parseCurrency(v[7]) 
                };
            });

            const dailyTotals: DailyTotal[] = txtB.trim().split('\n').slice(1).map(l => {
                const v = parseCsvLine(l);
                const d = smartParseDate(v[0]);
                return { id: `dt-${d.format('YYYY-MM-DD')}`, date: d.format('YYYY-MM-DD'), grossTotal: parseCurrency(v[1]), source: 'SheetB', createdAt: dayjs().toISOString() };
            });

            await Promise.all([db.insertBatch('trades', trades), db.insertBatch('daily_totals', dailyTotals)]);
            if (dailyTotals.length > 0) {
                const dates = dailyTotals.map(t => dayjs(t.date));
                get().runAllocationForRange(dayjs.min(dates).format('YYYY-MM-DD'), dayjs.max(dates).format('YYYY-MM-DD'));
            }
        } catch (err: any) {
            get().addWarning("Sync failed: " + err.message);
            throw err;
        }
    },

    runAllocationForRange: async (start, end) => {
        const state = get();
        const sDate = dayjs(start).startOf('day');
        const eDate = dayjs(end).startOf('day');
        
        let batchAllocs: DailyAllocation[] = [];
        let batchOwnerDaily: OwnerDailyPnl[] = [];

        for (let d = sDate; d.isSameOrBefore(eDate, 'day'); d = d.add(1, 'day')) {
            const dateStr = d.format('YYYY-MM-DD');
            const dayTotal = state.dailyTotals.find(dt => dt.date === dateStr);
            if (!dayTotal) continue;

            const tax = state.dailyCharges.find(c => c.date === dateStr)?.taxAmount || 0;
            const netProfitTotal = dayTotal.grossTotal - tax;
            const isProfitDay = netProfitTotal > 0;

            const dayCapEntries = state.investors.map(i => {
                const isAfterActivation = i.isOwner || (i.activationDate && d.isAfter(dayjs(i.activationDate).startOf('day'), 'day'));
                const cap = isAfterActivation ? getCapitalAtDate(i.id, dateStr, state, batchAllocs) : 0;
                return { id: i.id, isOwner: i.isOwner, cap };
            }).filter(c => c.cap > 0);
            
            const totalAum = dayCapEntries.reduce((sum, c) => sum + c.cap, 0);
            if (totalAum <= 0) continue;

            let ownerSurplus = 0;
            let totalFees = 0;
            let totalInvNet = 0;
            const dailyAllocs: DailyAllocation[] = [];

            dayCapEntries.forEach(c => {
                const weight = c.cap / totalAum;
                const proRataNet = netProfitTotal * weight;
                let netAlloc = proRataNet;
                let fee = 0;

                if (!c.isOwner) {
                    if (isProfitDay) {
                        const cap = c.cap * DAILY_PROFIT_CAP;
                        netAlloc = Math.min(proRataNet, cap);
                        ownerSurplus += (proRataNet - netAlloc);
                        fee = netAlloc * PROFIT_FEE_RATE;
                    }
                    totalInvNet += (netAlloc - fee);
                    totalFees += fee;
                }

                dailyAllocs.push({
                    id: `alloc-${dateStr}-${c.id}`, investorId: c.id, date: dateStr,
                    capitalDayStart: c.cap, grossAlloc: dayTotal.grossTotal * weight,
                    taxAlloc: tax * weight, netAlloc, performanceFee: fee, createdAt: dayjs().toISOString()
                });
            });

            const ownerAlloc = dailyAllocs.find(a => a.investorId === 'owner-rudra');
            if (ownerAlloc) { ownerAlloc.netAlloc += ownerSurplus + totalFees; }

            batchAllocs = batchAllocs.filter(a => a.date !== dateStr).concat(dailyAllocs);
            batchOwnerDaily = batchOwnerDaily.filter(o => o.date !== dateStr).concat([{
                id: `owner-${dateStr}`, date: dateStr, totalInvestorNetProfit: totalInvNet, 
                totalPerformanceFees: totalFees, ownerTake: ownerAlloc?.netAlloc || 0, savedDate: dayjs().toISOString()
            }]);
        }

        await Promise.all([db.insertBatch('daily_allocations', batchAllocs), db.insertBatch('owner_daily_pnls', batchOwnerDaily)]);
        set({ dailyAllocations: [...state.dailyAllocations.filter(a => !batchAllocs.some(ba => ba.id === a.id)), ...batchAllocs], 
              ownerDailyPnls: [...state.ownerDailyPnls.filter(o => !batchOwnerDaily.some(bo => bo.id === o.id)), ...batchOwnerDaily] });
        get().refreshBalances();
    },

    factoryReset: async () => {
        const tables = ['investors', 'trades', 'daily_allocations', 'daily_charges', 'weekly_profits', 'monthly_profits', 'owner_daily_pnls', 'owner_weekly_profits', 'fund_transactions', 'daily_totals', 'audit_logs'];
        await Promise.all(tables.map(t => db.clear(t)));
        await db.upsert('investors', FIXED_OWNER);
        set({ investors: [FIXED_OWNER], capitalLedger: [], trades: [], dailyTotals: [], dailyCharges: [], dailyAllocations: [], weeklyProfits: [], monthlyProfits: [], ownerDailyPnls: [], ownerWeeklyProfits: [], withdrawals: [], weeklyPayouts: [], warnings: [], auditLogs: [] });
    }
}));