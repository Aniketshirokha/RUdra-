
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import type { Investor, DailyAllocation, TradeRow, Page } from '../types';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import dayjs from '../utils/dayjs';

const ProfileCard: React.FC<{title: string, value: string, subValue?: string, color?: string}> = ({title, value, subValue, color}) => (
    <Card className="text-center h-full flex flex-col justify-center border border-border">
        <p className="text-[10px] text-textSecondary font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-xl lg:text-2xl font-black ${color || 'text-textPrimary'}`}>{value}</p>
        {subValue && <p className="text-xs text-textSecondary mt-1">{subValue}</p>}
    </Card>
);

interface InvestorProfileProps {
    investor: Investor;
    onNavigate: (page: Page) => void;
}

const InvestorProfile: React.FC<InvestorProfileProps> = ({ investor, onNavigate }) => {
    const { dailyAllocations, trades, capitalLedger, addFund, subtractFund, removeInvestor, updateInvestorEffectiveDate } = useStore();
    const [activeTab, setActiveTab] = useState('summary');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingDate, setIsUpdatingDate] = useState(false);
    
    const [amount, setAmount] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(investor.activationDate || dayjs().format('YYYY-MM-DD'));

    const handleUpdateEffectiveDate = async () => {
        if (!effectiveDate) return;
        if (window.confirm(`Recalculate all results from ${formatDate(effectiveDate)}?`)) {
            setIsUpdatingDate(true);
            try {
                await updateInvestorEffectiveDate(investor.id, effectiveDate);
                alert("Recalculation complete.");
            } catch (err) {
                alert("Failed to update.");
            } finally {
                setIsUpdatingDate(false);
            }
        }
    };
    
    const handleRemoveInvestor = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (window.confirm(`Permanently remove ${investor.name}?`)) {
            setIsDeleting(true);
            try {
                await removeInvestor(investor.id);
                onNavigate('Investors');
            } catch (err) {
                alert("Error deleting investor.");
                setIsDeleting(false);
            }
        }
    };

    const metrics = useMemo(() => {
        const investedCapital = capitalLedger
            .filter(l => l.investorId === investor.id && l.committed)
            .reduce((sum, l) => sum + (l.txType === 'add' ? l.amount : -l.amount), 0);
        
        const invAllocs = dailyAllocations.filter(a => a.investorId === investor.id);
        const lifetimeGrossPnl = invAllocs.reduce((sum, item) => sum + item.grossAlloc, 0);
        const lifetimeTax = invAllocs.reduce((sum, item) => sum + item.taxAlloc, 0);
        const lifetimeFees = invAllocs.reduce((sum, item) => sum + item.performanceFee, 0);
        const lifetimeNetPnl = invAllocs.reduce((sum, item) => sum + item.netAlloc, 0);

        const currentBalance = investedCapital + (lifetimeNetPnl - lifetimeFees);

        return { investedCapital, currentBalance, lifetimeGrossPnl, lifetimeNetPnl, lifetimeTax, lifetimeFees };
    }, [investor.id, capitalLedger, dailyAllocations]);

    const kpis = [
        { title: 'Invested Capital', value: formatCurrency(metrics.investedCapital) },
        { title: 'Current Balance', value: formatCurrency(metrics.currentBalance) },
        { title: 'Total Gross P&L', value: formatCurrency(metrics.lifetimeGrossPnl), color: metrics.lifetimeGrossPnl >= 0 ? 'text-success' : 'text-danger' },
        { title: 'Tax & Charges', value: formatCurrency(metrics.lifetimeTax) },
        { title: 'Net Gain', value: formatCurrency(metrics.lifetimeNetPnl - metrics.lifetimeFees), color: (metrics.lifetimeNetPnl - metrics.lifetimeFees) >= 0 ? 'text-success' : 'text-danger' },
        { title: 'Total Profit Fee Paid', value: formatCurrency(metrics.lifetimeFees), color: 'text-danger' },
    ];

    const affectingTrades = useMemo(() => {
        return trades.filter(t => {
            const alloc = dailyAllocations.find(a => a.investorId === investor.id && a.date === t.tradeDate);
            return !!alloc;
        }).map(t => {
            const dailyAlloc = dailyAllocations.find(a => a.investorId === investor.id && a.date === t.tradeDate)!;
            const dayTotalTradesPnl = trades.filter(tr => tr.tradeDate === t.tradeDate).reduce((sum, tr) => sum + Math.abs(tr.pnl), 0);
            
            const weight = Math.abs(t.pnl) / (dayTotalTradesPnl || 1);
            const isLoss = t.pnl < 0;
            const investorGrossShare = dailyAlloc.grossAlloc * weight * (isLoss ? -1 : 1);
            const investorTaxShare = dailyAlloc.taxAlloc * weight;
            
            return {
                ...t,
                investorGrossShare,
                investorTaxShare,
                investorNetShare: investorGrossShare - investorTaxShare
            };
        }).sort((a, b) => dayjs(b.tradeDate).valueOf() - dayjs(a.tradeDate).valueOf());
    }, [trades, dailyAllocations, investor.id]);
    
    return (
        <div className="pb-10">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-textPrimary mb-1">{investor.name} {investor.isOwner && <span className="text-sm text-primary align-middle">(Owner)</span>}</h1>
                    <p className="text-textSecondary text-sm lg:text-base">{investor.email} &bull; {investor.phone}</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                     <button onClick={() => onNavigate('Investors')} className="justify-center bg-gray-100 text-textPrimary font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors">Back</button>
                    {!investor.isOwner && (
                        <button onClick={handleRemoveInvestor} disabled={isDeleting} className="justify-center bg-danger/10 text-danger font-bold py-2 px-4 rounded-lg hover:bg-danger/20 flex items-center disabled:opacity-50">
                            <TrashIcon /> <span className="ml-2">{isDeleting ? 'Removing...' : 'Remove Investor'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4 mb-6">
                {kpis.map(kpi => <ProfileCard key={kpi.title} {...kpi} />)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold text-textPrimary mb-4">Manage Funds</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                        <label className="text-[10px] text-textSecondary font-bold uppercase">Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full mt-1 p-2 border border-border rounded-lg text-sm"/>
                        </div>
                        <div>
                        <label className="text-[10px] text-textSecondary font-bold uppercase">Transaction Date</label>
                        <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="w-full mt-1 p-2 border border-border rounded-lg text-sm" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => addFund(investor.id, parseFloat(amount), effectiveDate)} disabled={!amount || !effectiveDate} className="flex-1 bg-success/10 text-success font-bold py-2 rounded-lg text-sm">Add</button>
                            <button onClick={() => subtractFund(investor.id, parseFloat(amount), effectiveDate)} disabled={!amount || !effectiveDate} className="flex-1 bg-danger/10 text-danger font-bold py-2 rounded-lg text-sm">Withdraw</button>
                        </div>
                    </div>
                </Card>

                <Card className="border border-primary/20 bg-primary/5">
                    <h3 className="text-lg font-bold text-textPrimary mb-3">Account Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-textSecondary font-bold uppercase block mb-1">Effective Date (IST)</label>
                            <div className="flex gap-2">
                                <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="flex-1 p-2 border border-border rounded-lg text-sm" />
                                <button onClick={handleUpdateEffectiveDate} disabled={isUpdatingDate || effectiveDate === investor.activationDate} className="bg-primary text-white font-bold py-2 px-4 rounded-lg text-xs disabled:opacity-50">
                                    {isUpdatingDate ? 'Updating...' : 'Save & Recompute'}
                                </button>
                            </div>
                            <p className="text-[10px] text-textSecondary mt-2 italic">Participation starts on trading days AFTER activation date.</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="mt-8">
                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-8">
                        {['summary', 'trades'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)} 
                                className={`${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-gray-300'} py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-wider`}
                            >
                                {tab === 'summary' ? 'Daily P&L Log' : 'Trades affecting this investor'}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {activeTab === 'summary' ? (
                        <DailySummaryTab allocations={dailyAllocations.filter(da => da.investorId === investor.id)} />
                    ) : (
                        <TradesTab trades={affectingTrades} />
                    )}
                </div>
            </div>
        </div>
    );
};

const DailySummaryTab: React.FC<{allocations: DailyAllocation[]}> = ({allocations}) => (
    <Card className="!p-0 border border-border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
                <thead className="bg-gray-50/50">
                    <tr className="border-b border-border">
                        {['Date', 'Gross', 'Tax', 'Net', 'Profit Fee (0.126%)', 'Day Gain'].map(h => <th key={h} className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {allocations.sort((a,b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()).map(d => (
                        <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                            <td className="p-4 text-sm text-textSecondary font-bold">{formatDate(d.date)}</td>
                            <td className={`p-4 text-sm font-semibold ${d.grossAlloc >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(d.grossAlloc)}</td>
                            <td className="p-4 text-sm text-textSecondary">{formatCurrency(d.taxAlloc)}</td>
                            <td className={`p-4 text-sm font-bold ${d.netAlloc >= 0 ? 'text-textPrimary' : 'text-danger'}`}>{formatCurrency(d.netAlloc)}</td>
                            <td className="p-4 text-sm text-danger">{d.performanceFee > 0 ? `-${formatCurrency(d.performanceFee)}` : '₹0'}</td>
                            <td className={`p-4 text-sm font-black ${d.netAlloc - d.performanceFee >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(d.netAlloc - d.performanceFee)}</td>
                        </tr>
                    ))}
                    {allocations.length === 0 && <tr><td colSpan={6} className="p-16 text-center text-textSecondary italic text-sm">No activity recorded for this period.</td></tr>}
                </tbody>
            </table>
        </div>
    </Card>
);

const TradesTab: React.FC<{trades: any[]}> = ({trades}) => (
    <Card className="!p-0 border border-border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50/50">
                    <tr className="border-b border-border">
                        {['Trade Date', 'Symbol', 'Total P&L', 'Your Gross Share', 'Your Tax Share', 'Your Net Impact'].map(h => <th key={h} className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {trades.map(t => (
                        <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-gray-50/50">
                            <td className="p-4 text-sm text-textSecondary">{formatDate(t.tradeDate)}</td>
                            <td className="p-4 text-sm font-bold text-textPrimary">{t.symbol}</td>
                            <td className={`p-4 text-sm font-semibold ${t.pnl >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(t.pnl)}</td>
                            <td className={`p-4 text-sm font-bold ${t.investorGrossShare >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(t.investorGrossShare)}</td>
                            <td className="p-4 text-sm text-textSecondary italic">{formatCurrency(t.investorTaxShare)}</td>
                            <td className={`p-4 text-sm font-black ${t.investorNetShare >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(t.investorNetShare)}</td>
                        </tr>
                    ))}
                    {trades.length === 0 && <tr><td colSpan={6} className="p-16 text-center text-textSecondary italic text-sm">No specific trades found in this timeframe.</td></tr>}
                </tbody>
            </table>
        </div>
    </Card>
);

const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;

export default InvestorProfile;
