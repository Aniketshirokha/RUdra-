import React from 'react';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Withdrawal } from '../types';

const statusColorMap = {
    approved: 'bg-success/20 text-success',
    pending: 'bg-warning/20 text-warning',
    rejected: 'bg-danger/20 text-danger',
};

const Withdrawals: React.FC = () => {
    const { withdrawals, investors } = useStore();
    const getInvestorName = (id: string) => investors.find(i => i.id === id)?.name || 'Unknown';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-textPrimary">Withdrawals</h1>
            </div>
            
            <Card>
                <h2 className="text-xl font-semibold text-textPrimary mb-4">Suggested Withdrawals</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border">
                                {['Investor', 'Week Start', 'Suggestion', 'Status', 'Actions'].map(h => <th key={h} className="p-3 text-sm font-semibold text-textSecondary">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {withdrawals.filter(w => w.status === 'pending').map((withdrawal: Withdrawal) => (
                                <tr key={withdrawal.id} className="border-b border-border hover:bg-background">
                                    <td className="p-3 font-semibold text-textPrimary">{getInvestorName(withdrawal.investorId)}</td>
                                    <td className="p-3 text-textSecondary">{formatDate(withdrawal.weekStart)}</td>
                                    <td className="p-3 text-textSecondary">{formatCurrency(withdrawal.suggestion)}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColorMap[withdrawal.status]}`}>{withdrawal.status}</span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button className="bg-success/20 text-success font-bold py-1 px-3 rounded-lg text-sm">Approve</button>
                                            <button className="bg-danger/20 text-danger font-bold py-1 px-3 rounded-lg text-sm">Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-8">
                <Card>
                    <h2 className="text-xl font-semibold text-textPrimary mb-4">History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Investor', 'Week Start', 'Suggestion', 'Status', 'Processed At'].map(h => <th key={h} className="p-3 text-sm font-semibold text-textSecondary">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.filter(w => w.status !== 'pending').map((withdrawal: Withdrawal) => (
                                    <tr key={withdrawal.id} className="border-b border-border hover:bg-background">
                                        <td className="p-3 font-semibold text-textPrimary">{getInvestorName(withdrawal.investorId)}</td>
                                        <td className="p-3 text-textSecondary">{formatDate(withdrawal.weekStart)}</td>
                                        <td className="p-3 text-textSecondary">{formatCurrency(withdrawal.suggestion)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColorMap[withdrawal.status]}`}>{withdrawal.status}</span>
                                        </td>
                                        <td className="p-3 text-textSecondary">{withdrawal.processedAt ? formatDate(withdrawal.processedAt) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Withdrawals;