
import React, { useState } from 'react';
import Card from '../components/Card';
import { useStore } from '../store/useStore';

const SUPABASE_SQL_SCHEMA = `-- STEP 1: CREATE ALL TABLES
CREATE TABLE IF NOT EXISTS investors (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, "kycStatus" TEXT, status TEXT, "capitalCommitted" NUMERIC, "capitalCurrent" NUMERIC, "weeklyWithdrawPref" BOOLEAN, "isOwner" BOOLEAN, "activationDate" TEXT, "createdAt" TEXT, "weeklyReturnRate" NUMERIC, "monthlyReturnRate" NUMERIC);
CREATE TABLE IF NOT EXISTS trades (id TEXT PRIMARY KEY, "tradeDate" TEXT, ts TEXT, symbol TEXT, "strikePrice" NUMERIC, "entryPrice" NUMERIC, "exitPrice" NUMERIC, lots INTEGER, "tradeCapital" NUMERIC, pnl NUMERIC);
CREATE TABLE IF NOT EXISTS daily_allocations (id TEXT PRIMARY KEY, "investorId" TEXT, date TEXT, "capitalDayStart" NUMERIC, "grossAlloc" NUMERIC, "taxAlloc" NUMERIC, "netAlloc" NUMERIC, "performanceFee" NUMERIC, "createdAt" TEXT);
CREATE TABLE IF NOT EXISTS daily_charges (id TEXT PRIMARY KEY, date TEXT UNIQUE, "taxAmount" NUMERIC, note TEXT, "createdAt" TEXT, "updatedAt" TEXT);
CREATE TABLE IF NOT EXISTS fund_transactions (id TEXT PRIMARY KEY, "investorId" TEXT, "txType" TEXT, amount NUMERIC, note TEXT, "effectiveDate" TEXT, committed BOOLEAN, "createdAt" TEXT);
CREATE TABLE IF NOT EXISTS daily_totals (id TEXT PRIMARY KEY, date TEXT UNIQUE, "grossTotal" NUMERIC, source TEXT, "createdAt" TEXT);
CREATE TABLE IF NOT EXISTS weekly_profits (id TEXT PRIMARY KEY, "investorId" TEXT, "weekStartDate" TEXT, "weekEndDate" TEXT, amount NUMERIC, "savedDate" TEXT);
CREATE TABLE IF NOT EXISTS monthly_profits (id TEXT PRIMARY KEY, "investorId" TEXT, month TEXT, amount NUMERIC, "savedDate" TEXT);
CREATE TABLE IF NOT EXISTS owner_daily_pnls (id TEXT PRIMARY KEY, date TEXT UNIQUE, "totalInvestorNetProfit" NUMERIC, "totalPerformanceFees" NUMERIC, "ownerTake" NUMERIC, "savedDate" TEXT);
CREATE TABLE IF NOT EXISTS owner_weekly_profits (id TEXT PRIMARY KEY, "weekStartDate" TEXT, "weekEndDate" TEXT, amount NUMERIC, "savedDate" TEXT);
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, "investorId" TEXT, "oldValue" TEXT, "newValue" TEXT, field TEXT, "changedAt" TEXT);

-- STEP 2: FIX SECURITY ERRORS
ALTER TABLE investors DISABLE ROW LEVEL SECURITY;
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_charges DISABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_totals DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_profits DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_profits DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_daily_pnls DISABLE ROW LEVEL SECURITY;
ALTER TABLE owner_weekly_profits DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- STEP 3: ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE investors;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_allocations;
ALTER PUBLICATION supabase_realtime ADD TABLE fund_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;`;

const Settings: React.FC = () => {
    const [sheetA, setSheetA] = useState('https://docs.google.com/spreadsheets/d/1rNoVLHtO6HzVsZsyOZs1PG8qFnuj-CXlVoH9et4FKng/edit?usp=sharing');
    const [sheetB, setSheetB] = useState('https://docs.google.com/spreadsheets/d/162OHYQQiQ7dPqwHwbNnS1FtomcVLq2Y8BO9GxWaekik/edit?usp=sharing');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);
    const { loadDataFromSheets, clearWarnings, factoryReset } = useStore();

    const handleLoadData = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);
        clearWarnings();

        try {
            await loadDataFromSheets(sheetA, sheetB);
            setMessage({ type: 'success', text: 'Success! Database is synced and live.' });
        } catch (error: any) {
             const errorMsg = error.message?.toLowerCase() || '';
             if (errorMsg.includes('row-level security') || errorMsg.includes('rls') || errorMsg.includes('42501')) {
                 setMessage({ 
                     type: 'error', 
                     text: "RLS SECURITY ERROR: You must disable security on your Supabase tables. Copy the SQL below, go to Supabase -> SQL Editor, paste it, and click RUN." 
                 });
             } else {
                 setMessage({ type: 'error', text: `Connection Error: ${error.message}` });
             }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopySchema = () => {
        navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
        alert("SQL Copied! Go to Supabase SQL Editor, paste this, and click RUN. This will fix the 'Security Policy' error.");
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-textPrimary mb-6 tracking-tight">System Settings</h1>
            
            <div className="grid grid-cols-1 gap-6 pb-20">
                {message?.type === 'error' && (
                    <Card className="border-2 border-danger bg-danger/5 animate-pulse">
                         <h3 className="text-danger font-bold text-lg mb-2">CRITICAL: Fix Required in Supabase</h3>
                         <p className="text-sm text-textPrimary mb-4">{message.text}</p>
                         <button onClick={handleCopySchema} className="bg-danger text-white font-bold py-2 px-6 rounded-lg text-sm">
                             1. COPY FIX SCRIPT
                         </button>
                         <p className="text-[10px] text-textSecondary mt-4 uppercase font-bold italic">2. Paste this into Supabase SQL Editor & Run</p>
                    </Card>
                )}

                <Card className="border-l-4 border-success bg-success/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-success">Supabase Status</h2>
                            <p className="text-textSecondary text-sm mt-1">Project: <strong>anuwwbdigqwvvqgdflbu</strong></p>
                        </div>
                        <div className="flex items-center text-xs font-bold text-success uppercase">
                            <span className="mr-2">Connected</span>
                            <div className="h-3 w-3 bg-success rounded-full animate-ping"></div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-textPrimary">SQL Setup Script</h2>
                            <p className="text-textSecondary text-sm mt-1">Run this script once to initialize all database features.</p>
                        </div>
                        <button onClick={handleCopySchema} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-6 rounded-lg transition-all shadow-lg">
                            COPY SQL
                        </button>
                    </div>
                    <pre className="p-4 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto max-h-48 border border-white/5">
                        {SUPABASE_SQL_SCHEMA}
                    </pre>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold text-textPrimary mb-4">Sync Data from Sheets</h2>
                    <p className="text-sm text-textSecondary mb-6">This will pull all trades from Google Sheets into your live database.</p>
                    <form onSubmit={handleLoadData} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Sheet A (Trades)</label>
                                <input value={sheetA} onChange={e => setSheetA(e.target.value)} className="w-full p-3 border border-border rounded-lg bg-gray-50 focus:bg-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase mb-1">Sheet B (Daily Totals)</label>
                                <input value={sheetB} onChange={e => setSheetB(e.target.value)} className="w-full p-3 border border-border rounded-lg bg-gray-50 focus:bg-white text-sm" />
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4 pt-2">
                            {message?.type === 'success' && <div className="p-4 rounded-lg bg-success/10 text-success text-sm font-bold border border-success/20">{message.text}</div>}
                            <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl disabled:bg-gray-400 shadow-xl transition-all active:scale-95">
                                {isLoading ? 'Processing...' : 'SYNC GOOGLE SHEETS'}
                            </button>
                        </div>
                    </form>
                </Card>

                <div className="mt-8 border-t border-border pt-8">
                    <Card className="border border-danger/20 bg-danger/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-textPrimary">Factory Reset</h2>
                                <p className="text-sm text-textSecondary">Delete all data from Supabase. Use with caution.</p>
                            </div>
                            <button onClick={() => { if(window.confirm("Delete everything?")) factoryReset(); }} className="bg-danger/10 text-danger hover:bg-danger hover:text-white font-bold py-2 px-6 rounded-lg transition-all text-sm">Reset Database</button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Settings;
