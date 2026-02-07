import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { formatCurrency, formatPercent } from '../utils/formatters';
import dayjs from '../utils/dayjs';

const Messaging: React.FC = () => {
    const { investors, dailyAllocations } = useStore();
    const activeInvestors = useMemo(() => investors.filter(i => i.status === 'active'), [investors]);
    const [selectedInvestorId, setSelectedInvestorId] = useState(activeInvestors[0]?.id || '');

    const selectedInvestor = useMemo(() => investors.find(i => i.id === selectedInvestorId), [selectedInvestorId, investors]);

    const allocation = useMemo(() => {
        if (!selectedInvestor) {
            return { dayPnlAlloc: 0, wtdAlloc: 0, weeklyTargetAmt: 0, remainingToTarget: 0, capitalDayStart: 0 };
        }
        
        const startOfWeek = dayjs().tz().startOf('isoWeek');
        const todayStr = dayjs().tz().format('YYYY-MM-DD');

        const dailyAllocationForDate = dailyAllocations.find(da => da.investorId === selectedInvestorId && da.date === todayStr);
        
        const dayPnlAlloc = dailyAllocationForDate?.netAlloc || 0;
        const capitalDayStart = dailyAllocationForDate?.capitalDayStart || selectedInvestor.capitalCurrent;

        const wtdAlloc = dailyAllocations
            .filter(da => da.investorId === selectedInvestorId && dayjs(da.date).tz().isSameOrAfter(startOfWeek))
            .reduce((sum, alloc) => sum + alloc.netAlloc, 0);

        const weeklyTargetAmt = selectedInvestor.capitalCommitted * 0.00625; // 0.625%
        const remainingToTarget = Math.max(0, weeklyTargetAmt - wtdAlloc);

        return { dayPnlAlloc, wtdAlloc, weeklyTargetAmt, remainingToTarget, capitalDayStart };
    }, [dailyAllocations, selectedInvestorId, selectedInvestor]);

    const dailyTemplate = selectedInvestor ? `Hi ${selectedInvestor.name}, daily update:
Today: ${formatCurrency(allocation.dayPnlAlloc)} (${formatPercent(allocation.dayPnlAlloc, allocation.capitalDayStart)})
Week to date: ${formatCurrency(allocation.wtdAlloc)}
Target this week: ${formatCurrency(allocation.weeklyTargetAmt)} which is 0.625 percent
Remaining to target: ${formatCurrency(allocation.remainingToTarget)}` : 'Select an investor to see the template.';

    const weeklyTemplate = selectedInvestor ? `Hi ${selectedInvestor.name}, week-to-date summary:
Your share this week: ${formatCurrency(allocation.wtdAlloc)}
Weekly target: ${formatCurrency(allocation.weeklyTargetAmt)}
Capital base: ${formatCurrency(selectedInvestor.capitalCommitted)}` : 'Select an investor to see the template.';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // In a real app, show a toast notification here
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-textPrimary mb-6">Messaging Center</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-xl font-semibold text-textPrimary mb-4">Daily Message Template</h2>
                    <div className="mb-4">
                        <label htmlFor="investor-select-daily" className="block text-sm font-medium text-textSecondary mb-1">Select Investor</label>
                        <select id="investor-select-daily" value={selectedInvestorId} onChange={e => setSelectedInvestorId(e.target.value)} className="w-full p-2 border border-border rounded-lg bg-surface">
                            <option value="" disabled>-- Select Investor --</option>
                            {activeInvestors.map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                        </select>
                    </div>
                    <textarea 
                        readOnly 
                        value={dailyTemplate} 
                        className="w-full h-48 p-3 bg-background rounded-lg border border-border font-mono text-sm text-textSecondary"
                    />
                    <button onClick={() => copyToClipboard(dailyTemplate)} disabled={!selectedInvestor} className="mt-4 w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-300">
                        Copy to Clipboard
                    </button>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold text-textPrimary mb-4">Friday Close Template</h2>
                     <div className="mb-4">
                        <label htmlFor="investor-select-weekly" className="block text-sm font-medium text-textSecondary mb-1">Select Investor</label>
                        <select id="investor-select-weekly" value={selectedInvestorId} onChange={e => setSelectedInvestorId(e.target.value)} className="w-full p-2 border border-border rounded-lg bg-surface">
                            <option value="" disabled>-- Select Investor --</option>
                             {activeInvestors.map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                        </select>
                    </div>
                    <textarea 
                        readOnly 
                        value={weeklyTemplate} 
                        className="w-full h-48 p-3 bg-background rounded-lg border border-border font-mono text-sm text-textSecondary"
                    />
                    <button onClick={() => copyToClipboard(weeklyTemplate)} disabled={!selectedInvestor} className="mt-4 w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-300">
                        Copy to Clipboard
                    </button>
                </Card>
            </div>
        </div>
    );
};

export default Messaging;