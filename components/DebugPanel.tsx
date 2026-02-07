import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';
import dayjs from '../utils/dayjs';

const Check: React.FC<{ title: string; pass: boolean; details?: string }> = ({ title, pass, details }) => (
    <div className={`p-2 border-l-4 ${pass ? 'border-green-500' : 'border-red-500'} bg-gray-50`}>
        <div className="flex justify-between items-center">
            <span className="font-semibold text-sm text-textPrimary">{title}</span>
            <span className={`font-bold text-xs px-2 py-1 rounded-full ${pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {pass ? 'PASS' : 'FAIL'}
            </span>
        </div>
        {details && <p className="text-xs text-textSecondary mt-1">{details}</p>}
    </div>
);

const DebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { trades, dailyTotals, dailyAllocations, dailyCharges, investors, capitalLedger, warnings, auditLogs, isReady } = useStore();
    
    const healthChecks = useMemo(() => {
        if (!isReady) return null;
        
        const sheetALoaded = trades.length > 0;
        const sheetBLoaded = dailyTotals.length > 0;
        
        const parsingErrors = warnings.filter(w => w.includes('Error')).length;

        const allocationChecks = [...new Set(dailyAllocations.map(a => a.date))].map(date => {
            const dayTotal = dailyTotals.find(d => d.date === date)?.grossTotal ?? 0;
            const dayTax = dailyCharges.find(d => d.date === date)?.taxAmount ?? 0;
            const dayNet = dayTotal - dayTax;

            const allocsForDate = dailyAllocations.filter(a => a.date === date);
            const sumGrossAlloc = allocsForDate.reduce((sum, a) => sum + a.grossAlloc, 0);
            const sumTaxAlloc = allocsForDate.reduce((sum, a) => sum + a.taxAlloc, 0);
            const sumNetAlloc = allocsForDate.reduce((sum, a) => sum + a.netAlloc, 0);

            const grossPass = Math.abs(sumGrossAlloc - dayTotal) < 0.01;
            const taxPass = Math.abs(sumTaxAlloc - dayTax) < 0.01;
            const netPass = Math.abs(sumNetAlloc - dayNet) < 0.01;

            return { date, grossPass, taxPass, netPass, sumNetAlloc, dayNet };
        });

        const activeInvestors = investors.filter(i => i.status === 'active');
        const aum = activeInvestors.reduce((sum, i) => sum + i.capitalCurrent, 0);
        const aumZeroBanner = warnings.some(w => w.includes('AUM was zero'));

        const preActivationAllocations = dailyAllocations.filter(alloc => {
            const investor = investors.find(i => i.id === alloc.investorId);
            return investor?.activationDate && dayjs(alloc.date).isBefore(dayjs(investor.activationDate));
        });

        return {
            sheetALoaded,
            sheetBLoaded,
            parsingErrors,
            allocationChecks,
            aumZero: aum === 0 && aumZeroBanner,
            activationGating: preActivationAllocations.length === 0
        };
    }, [isReady, trades, dailyTotals, dailyAllocations, dailyCharges, investors, warnings]);

    if (!healthChecks) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isOpen && (
                 <div className="w-96 max-h-96 overflow-y-auto bg-white rounded-lg shadow-2xl p-4 border border-gray-200">
                    <h3 className="font-bold text-textPrimary mb-3 text-lg">System Health Checks</h3>
                    <div className="space-y-2">
                        <Check title="Sheet A Loaded" pass={healthChecks.sheetALoaded} details={`${trades.length} trades found.`} />
                        <Check title="Sheet B Loaded" pass={healthChecks.sheetBLoaded} details={`${dailyTotals.length} daily totals found.`} />
                        <Check title="No Parsing Errors" pass={healthChecks.parsingErrors === 0} details={`${healthChecks.parsingErrors} critical errors during load.`} />
                        <Check title="Activation Gating" pass={healthChecks.activationGating} details="Ensures no allocations before activation date." />
                        
                        {healthChecks.allocationChecks.map((check, index) => (
                             <Check 
                                // Fix: Use index as key to resolve "Type 'unknown' is not assignable to type 'Key'" error.
                                key={index}
                                title={`Net Allocation Check: ${dayjs(check.date).format('MMM DD')}`} 
                                pass={check.netPass}
                                details={`Expected: ${formatCurrency(check.dayNet)}, Got: ${formatCurrency(check.sumNetAlloc)}`}
                             />
                        ))}
                    </div>
                 </div>
            )}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="mt-2 w-full flex items-center justify-center bg-primary text-white font-bold rounded-full shadow-lg h-12 w-12 hover:bg-primary/90"
                aria-label="Toggle Debug Panel"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.66 22.49c-1.24.22-2.52.31-3.83.31-6.42 0-10.23-5.22-8.35-11.41 1.95-6.37 8.52-10.51 15.34-8.82 2.19.53 4.13 1.63 5.76 3.08"/><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/><path d="m22 22-2-2"/><path d="M12 12v-2"/><path d="M12 12H9"/></svg>
            </button>
        </div>
    );
};

export default DebugPanel;