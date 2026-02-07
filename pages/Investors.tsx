
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';
import type { Investor } from '../types';
import dayjs from '../utils/dayjs';

const statusColorMap = {
    active: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    disabled: 'bg-danger/10 text-danger',
};

const AddInvestorModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const addInvestor = useStore(state => state.addInvestor);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [capitalCommitted, setCapitalCommitted] = useState('');
    const [weeklyWithdrawPref, setWeeklyWithdrawPref] = useState(false);
    const [weeklyRate, setWeeklyRate] = useState('0.625');
    const [monthlyRate, setMonthlyRate] = useState('2.5');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !phone || !email || !capitalCommitted) return;
        
        addInvestor({
            name, phone, email,
            capitalCommitted: parseFloat(capitalCommitted),
            weeklyWithdrawPref,
            weeklyReturnRate: parseFloat(weeklyRate),
            monthlyReturnRate: parseFloat(monthlyRate)
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-textPrimary">Add New Investor</h2>
                    <button onClick={onClose} className="text-textSecondary hover:text-textPrimary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="text-[10px] font-bold text-textSecondary uppercase mb-1 block">Name</label>
                            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Full Name" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-textSecondary uppercase mb-1 block">Phone</label>
                            <input required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Phone Number" />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[10px] font-bold text-textSecondary uppercase mb-1 block">Email</label>
                            <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full p-2 border border-border rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors" placeholder="Email Address" />
                        </div>
                        <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Profit Targets</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-textSecondary uppercase block">Weekly Target %</label>
                                    <input required type="number" step="0.001" value={weeklyRate} onChange={e => setWeeklyRate(e.target.value)} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-gray-50" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-textSecondary uppercase block">Monthly Target %</label>
                                    <input required type="number" step="0.001" value={monthlyRate} onChange={e => setMonthlyRate(e.target.value)} className="w-full mt-1 p-2 border border-border rounded-lg text-sm bg-gray-50" />
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-2 border-t border-border pt-4 mt-2">
                             <label className="text-[10px] font-bold text-textSecondary uppercase block mb-1">Initial Capital Committed (₹)</label>
                             <input required value={capitalCommitted} onChange={e => setCapitalCommitted(e.target.value)} type="number" className="w-full p-3 border-2 border-primary/20 rounded-xl text-lg font-bold text-primary focus:border-primary outline-none transition-all" placeholder="0.00" />
                        </div>
                        <div className="flex items-center mt-2 col-span-2">
                            <input type="checkbox" id="weekly-pref" checked={weeklyWithdrawPref} onChange={e => setWeeklyWithdrawPref(e.target.checked)} className="mr-2 h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary" />
                            <label htmlFor="weekly-pref" className="text-xs text-textSecondary font-semibold">Automate Weekly Profit Withdrawals</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={onClose} className="bg-gray-100 text-textPrimary font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">Add Investor</button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

type InvestorsProps = {
    onSelectInvestor: (investorId: string) => void;
};

const Investors: React.FC<InvestorsProps> = ({ onSelectInvestor }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { investors, dailyAllocations, capitalLedger } = useStore();

    const investorMetrics = useMemo(() => {
        const metrics: Record<string, { invested: number, gross: number, charges: number, net: number, current: number }> = {};
        
        investors.forEach(inv => {
            const txs = capitalLedger.filter(l => l.investorId === inv.id && l.committed);
            const invested = txs.reduce((sum, l) => sum + (l.txType === 'add' ? l.amount : -l.amount), 0);
            
            const allocs = dailyAllocations.filter(a => a.investorId === inv.id);
            const gross = allocs.reduce((sum, a) => sum + a.grossAlloc, 0);
            const tax = allocs.reduce((sum, a) => sum + a.taxAlloc, 0);
            const fees = allocs.reduce((sum, a) => sum + a.performanceFee, 0);
            
            const charges = tax + fees;
            const net = allocs.reduce((sum, a) => sum + (a.netAlloc - a.performanceFee), 0);
            
            // Current Balance = Invested + Net Gain (which is Gross - Tax - Fees)
            const current = invested + net;

            metrics[inv.id] = { invested, gross, charges, net, current };
        });

        return metrics;
    }, [investors, dailyAllocations, capitalLedger]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-textPrimary tracking-tight">Investor Directory</h1>
                    <p className="text-textSecondary text-sm mt-1">Real-time performance metrics for all participating capital.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center">
                    <PlusIcon /> <span className="ml-2">New Investor</span>
                </button>
            </div>
            
            <Card className="!p-0 border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-border">
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Investor</th>
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Status</th>
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Invested Capital</th>
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Gross Profit</th>
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Tax & Charges</th>
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Net Gain</th>
                                <th className="p-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Current Balance</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {investors.filter(inv => !inv.isOwner).map((investor: Investor) => {
                                const m = investorMetrics[investor.id] || { invested: 0, gross: 0, charges: 0, net: 0, current: 0 };
                                return (
                                    <tr key={investor.id} className="border-b border-border last:border-b-0 hover:bg-primary/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center">
                                                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm mr-3 shadow-sm">
                                                    {investor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-textPrimary text-sm group-hover:text-primary transition-colors">{investor.name}</div>
                                                    <div className="text-[10px] text-textSecondary">{investor.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusColorMap[investor.status]}`}>{investor.status}</span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-textPrimary">{formatCurrency(m.invested)}</td>
                                        <td className={`p-4 text-sm font-bold ${m.gross >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {m.gross >= 0 ? '+' : ''}{formatCurrency(m.gross)}
                                        </td>
                                        <td className="p-4 text-sm text-danger font-medium italic">-{formatCurrency(m.charges)}</td>
                                        <td className={`p-4 text-sm font-bold ${m.net >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {formatCurrency(m.net)}
                                        </td>
                                        <td className="p-4">
                                            <div className="bg-primary/5 px-3 py-1 rounded-lg border border-primary/10 inline-block">
                                                <span className="text-base font-black text-primary">{formatCurrency(m.current)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => onSelectInvestor(investor.id)} 
                                                className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95"
                                            >
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {investors.filter(inv => !inv.isOwner).length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-16 text-center text-textSecondary italic text-sm">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                            No investors onboarded yet.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && <AddInvestorModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

export default Investors;
