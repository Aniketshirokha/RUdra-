import React, { useMemo } from 'react';
import Card from './Card';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency } from '../utils/formatters';
import dayjs from '../utils/dayjs';

const FinanceFlowCard: React.FC = () => {
    const { investors, dailyAllocations } = useStore();

    const { chartData, totalPnl, period } = useMemo(() => {
        const owner = investors.find(i => i.isOwner);
        if (!owner) return { chartData: [], totalPnl: 0, period: '' };
        
        const endDate = dayjs();
        const startDate = endDate.subtract(11, 'days');

        const ownerAllocations = dailyAllocations.filter(a =>
            a.investorId === owner.id &&
            dayjs(a.date).isBetween(startDate, endDate, null, '[]')
        );

        const dataMap = new Map<string, number>();
        ownerAllocations.forEach(a => {
            dataMap.set(a.date, (dataMap.get(a.date) || 0) + a.netAlloc);
        });

        const chartData: {name: string, pnl: number}[] = [];
        let totalPnl = 0;
        for (let d = startDate; d.isSameOrBefore(endDate, 'day'); d = d.add(1, 'day')) {
            const dateStr = d.format('YYYY-MM-DD');
            const pnl = dataMap.get(dateStr) || 0;
            chartData.push({ name: dateStr, pnl });
        }
        
        totalPnl = chartData.reduce((sum, item) => sum + item.pnl, 0);

        return { 
            chartData, 
            totalPnl, 
            period: `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`
        };
    }, [investors, dailyAllocations]);

    return (
        <Card>
            <p className="text-textSecondary font-semibold">Owner's P&amp;L Flow</p>
            <p className={`text-3xl font-bold mt-1 ${totalPnl >= 0 ? 'text-textPrimary' : 'text-danger'}`}>{formatCurrency(totalPnl)}</p>
            <p className="text-textSecondary text-sm">{period}</p>
            <div className="h-24 mt-4 -mx-2">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barCategoryGap="20%">
                            <Bar dataKey="pnl" radius={[10, 10, 10, 10]}>
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#6B62D2' : '#EF4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-textSecondary">No allocation data for this period.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FinanceFlowCard;