import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import dayjs from '../utils/dayjs';

const OwnerPnl: React.FC = () => {
    const { 
        investors, dailyTotals, dailyCharges, dailyAllocations, 
        capitalLedger, weeklyPayouts, addFund, subtractFund, isReady
    } = useStore();
    
    const owner = useMemo(() => investors.find(i => i.isOwner), [investors]);
    const [fundAmount, setFundAmount] = useState('');
    const [fundDate, setFundDate] = useState(dayjs().format('YYYY-MM-DD'));

    const handleAddFund = () => {
        if (owner && fundAmount) addFund(owner.id, parseFloat(fundAmount), fundDate);
        setFundAmount('');
    };

    const handleSubtractFund = () => {
        if (owner && fundAmount) subtractFund(owner.id, parseFloat(fundAmount), fundDate);
        setFundAmount('');
    };

    const stats = useMemo(() => {
        if (!owner || !isReady) return null;

        const today = dayjs();
        const startOfWeek = today.startOf('isoWeek');
        const startOfMonth = today.startOf('month');

        const investedCapital = capitalLedger
            .filter(l => l.investorId === owner.id && l.committed && dayjs(l.effectiveDate).isSameOrBefore(today, 'day'))
            .reduce((sum, l) => sum + (l.txType === 'add' ? l.amount : -l.amount), 0);
            
        const totalWithdrawalsPaid = (weeklyPayouts || [])
            .filter(w => w.investorId === owner.id)
            .reduce((sum, w) => sum + w.amount, 0);

        const dailyStats = dailyTotals.map(dt => {
            const charge = dailyCharges.find(c => c.date === dt.date);
            const allocationsForDay = dailyAllocations.filter(a => a.date === dt.date);
            const ownerAlloc = allocationsForDay.find(a => a.investorId === owner.id);
            const fees = allocationsForDay.reduce((sum, a) => sum + a.performanceFee, 0);

            return {
                date: dt.date,
                dayTotalNet: dt.grossTotal - (charge?.taxAmount || 0),
                dayTax: charge?.taxAmount || 0,
                feesCollected: fees,
                ownerTake: ownerAlloc?.netAlloc || 0
            };
        }).sort((a,b) => b.date.localeCompare(a.date));

        const ownerLifetimeTake = dailyStats.reduce((sum, d) => sum + d.ownerTake, 0);
        const currentBalance = investedCapital + ownerLifetimeTake - totalWithdrawalsPaid;

        return {
            investedCapital,
            currentBalance,
            todayPnL: dailyStats.find(d => d.date === today.format('YYYY-MM-DD'))?.ownerTake || 0,
            weeklyProfit: dailyStats.filter(d => dayjs(d.date).isSameOrAfter(startOfWeek)).reduce((sum, d) => sum + d.ownerTake, 0),
            monthlyProfit: dailyStats.filter(d => dayjs(d.date).isSameOrAfter(startOfMonth)).reduce((sum, d) => sum + d.ownerTake, 0),
            dailyStats
        };
    }, [owner, dailyTotals, dailyCharges, dailyAllocations, capitalLedger, weeklyPayouts, isReady]);

    if (!isReady || !owner) return <div className="p-8 text-center text-textSecondary">Initialising owner dashboard...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-textPrimary">Owner P&amp;L</h1>
                    <p className="text-textSecondary text-sm">Master Trading Account: <strong>{owner.name}</strong></p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                 <KpiBox title="Capital" value={stats?.investedCapital || 0} />
                 <KpiBox title="Current Balance" value={stats?.currentBalance || 0} />
                 <KpiBox title="Today" value={stats?.todayPnL || 0} color={(stats?.todayPnL || 0) >= 0 ? 'text-success' : 'text-danger'} />
                 <KpiBox title="This Week" value={stats?.weeklyProfit || 0} color={(stats?.weeklyProfit || 0) >= 0 ? 'text-success' : 'text-danger'} />
                 <KpiBox title="This Month" value={stats?.monthlyProfit || 0} color={(stats?.monthlyProfit || 0) >= 0 ? 'text-success' : 'text-danger'} />
            </div>

            <Card className="mb-8 bg-primary/5 border-primary/20 border-2">
                 <h3 className="text-lg font-bold text-textPrimary mb-4">Manage Base Capital</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                     <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} placeholder="Amount (₹)" className="p-2 border border-border rounded-lg bg-white"/>
                     <input type="date" value={fundDate} onChange={e => setFundDate(e.target.value)} className="p-2 border border-border rounded-lg bg-white" />
                     <div className="flex gap-2">
                         <button onClick={handleAddFund} disabled={!fundAmount} className="flex-1 bg-primary text-white font-bold py-2 rounded-lg text-sm">Add</button>
                         <button onClick={handleSubtractFund} disabled={!fundAmount} className="flex-1 bg-danger text-white font-bold py-2 rounded-lg text-sm">Withdraw</button>
                     </div>
                 </div>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold mb-4">Daily Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="p-3 text-[10px] uppercase font-bold text-textSecondary">Date</th>
                                <th className="p-3 text-[10px] uppercase font-bold text-textSecondary text-right">Net Total</th>
                                <th className="p-3 text-[10px] uppercase font-bold text-textSecondary text-right">Fees</th>
                                <th className="p-3 text-[10px] uppercase font-bold text-textSecondary text-right">Your Take</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.dailyStats.map(d => (
                                <tr key={d.date} className="border-b border-border hover:bg-gray-50/30">
                                    <td className="p-3 text-sm font-bold text-textSecondary">{formatDate(d.date)}</td>
                                    <td className="p-3 text-sm text-textSecondary text-right">{formatCurrency(d.dayTotalNet)}</td>
                                    <td className="p-3 text-sm text-success text-right font-bold">+{formatCurrency(d.feesCollected)}</td>
                                    <td className={`p-3 text-sm font-black text-right ${d.ownerTake >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(d.ownerTake)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

const KpiBox: React.FC<{title: string, value: number, color?: string}> = ({title, value, color}) => (
    <div className="bg-surface rounded-xl shadow-sm p-4 border border-border">
        <p className="text-[10px] text-textSecondary font-bold uppercase mb-1">{title}</p>
        <p className={`text-lg font-black ${color || 'text-textPrimary'}`}>{formatCurrency(value)}</p>
    </div>
);

export default OwnerPnl;