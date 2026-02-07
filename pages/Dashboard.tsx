import React, { useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import Card from '../components/Card';
import DataAnalyticsCard from '../components/DataAnalyticsCard';
import FinanceFlowCard from '../components/FinanceFlowCard';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { TradeRow, Page } from '../types';

interface DashboardProps {
    onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { trades, dailyTotals } = useStore(state => ({ trades: state.trades, dailyTotals: state.dailyTotals }));

    const summary = useMemo(() => {
        const totalTrades = trades.length;
        const grossPnl = dailyTotals.reduce((acc, t) => acc + t.grossTotal, 0); // From Sheet B
        const netPnl = trades.reduce((acc, t) => acc + t.pnl, 0); // From Sheet A for analytics

        return { totalTrades, grossPnl, netPnl };
    }, [trades, dailyTotals]);
    
    const kpis = [
        { title: 'Day P&L (Allocation Source)', value: formatCurrency(summary.grossPnl), icon: <TrendingUpIcon /> },
        { title: 'Total Trades (Analytics)', value: summary.totalTrades.toString(), icon: <PackageIcon /> },
        { title: 'Net P&L (Analytics)', value: formatCurrency(summary.netPnl), icon: <UsersIcon /> },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-textPrimary">Business Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <button className="w-10 h-10 flex items-center justify-center bg-surface text-textSecondary rounded-lg shadow-sm hover:bg-gray-100"><SearchIcon /></button>
                    <button className="w-10 h-10 flex items-center justify-center bg-surface text-textSecondary rounded-lg shadow-sm hover:bg-gray-100"><CalendarIcon /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>
            
            <h2 className="text-2xl font-bold text-textPrimary my-6">Marketplace</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <DataAnalyticsCard />
                <FinanceFlowCard />
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-textPrimary">Recent Trades (from Sheet A)</h2>
                     <button onClick={() => onNavigate('Trades')} className="text-sm font-semibold text-primary">SEE ALL</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border">
                                {['ID', 'Symbol', 'Date', 'P&L', 'Status'].map(h => <th key={h} className="py-3 px-2 text-sm font-semibold text-textSecondary">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {trades.slice(0, 5).map((trade: TradeRow) => (
                                <tr key={trade.id} className="border-b border-border last:border-b-0">
                                    <td className="py-4 px-2 font-semibold text-textPrimary">{trade.id}</td>
                                    <td className="py-4 px-2 text-textSecondary">{trade.symbol}</td>
                                    <td className="py-4 px-2 text-textSecondary">{formatDate(trade.tradeDate)}</td>
                                    <td className="py-4 px-2 text-textSecondary">{formatCurrency(trade.pnl)}</td>
                                    <td className="py-4 px-2 font-semibold">
                                        <span className={trade.pnl >= 0 ? 'text-success' : 'text-danger'}>
                                            {trade.pnl >= 0 ? 'Profit' : 'Loss'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Icons
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2"/><path d="m7 21 5-3 5 3"/><path d="M12 18v-6"/><path d="M3.29 7 12 12l8.71-5"/><path d="M12 22V12"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;


export default Dashboard;