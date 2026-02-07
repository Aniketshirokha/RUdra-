
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import DatePicker from '../components/DatePicker';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import type { TradeRow } from '../types';
import dayjs from '../utils/dayjs';

const Trades: React.FC = () => {
    const { trades } = useStore(state => ({ trades: state.trades }));
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const tradesPerPage = 15;

    const filteredTrades = useMemo(() => {
        let sortedTrades = [...trades].sort((a, b) => dayjs(b.ts).valueOf() - dayjs(a.ts).valueOf());

        if (startDate && endDate) {
            const start = dayjs(startDate).startOf('day');
            const end = dayjs(endDate).endOf('day');
            if (start.isAfter(end)) { // Guard against invalid range
                return [];
            }
            return sortedTrades.filter(trade => {
                const tradeDay = dayjs(trade.tradeDate);
                return tradeDay.isSameOrAfter(start) && tradeDay.isSameOrBefore(end);
            });
        }
        return sortedTrades;
    }, [trades, startDate, endDate]);

    // Pagination logic
    const indexOfLastTrade = currentPage * tradesPerPage;
    const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
    const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
    const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);

    const paginate = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };
    
    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-textPrimary">Trade History</h1>
            </div>

            <Card className="mb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="relative w-full md:w-auto">
                        <label htmlFor="start-date" className="block text-sm font-medium text-textSecondary mb-1">Start Date</label>
                        <div className="relative">
                            <input 
                                id="start-date" 
                                type="text" 
                                readOnly
                                value={startDate ? dayjs(startDate).format('DD MMM YYYY') : ''} 
                                onClick={() => { setShowStartDatePicker(true); setShowEndDatePicker(false); }}
                                placeholder="Select Start Date"
                                className="w-full p-2 pl-10 border border-border rounded-lg bg-surface cursor-pointer" 
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon />
                            </div>
                        </div>
                        {showStartDatePicker && (
                            <DatePicker
                                value={startDate}
                                onChange={setStartDate}
                                onClose={() => setShowStartDatePicker(false)}
                            />
                        )}
                    </div>
                    <div className="relative w-full md:w-auto">
                        <label htmlFor="end-date" className="block text-sm font-medium text-textSecondary mb-1">End Date</label>
                        <div className="relative">
                           <input 
                                id="end-date" 
                                type="text" 
                                readOnly
                                value={endDate ? dayjs(endDate).format('DD MMM YYYY') : ''} 
                                onClick={() => { setShowEndDatePicker(true); setShowStartDatePicker(false); }}
                                placeholder="Select End Date"
                                className="w-full p-2 pl-10 border border-border rounded-lg bg-surface cursor-pointer" 
                            />
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <CalendarIcon />
                            </div>
                        </div>
                         {showEndDatePicker && (
                            <DatePicker
                                value={endDate}
                                onChange={setEndDate}
                                onClose={() => setShowEndDatePicker(false)}
                            />
                        )}
                    </div>
                    <button onClick={handleReset} className="w-full md:w-auto bg-gray-200 text-textPrimary font-bold py-2 px-4 rounded-lg">Reset</button>
                </div>
            </Card>
            
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border">
                                {['Date & Time', 'Symbol', 'Entry Price', 'Exit Price', 'Lots', 'P&L'].map(h => <th key={h} className="p-3 text-sm font-semibold text-textSecondary">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {currentTrades.map((trade: TradeRow) => (
                                <tr key={trade.id} className="border-b border-border last:border-b-0 hover:bg-background">
                                    <td className="p-3 font-semibold text-textPrimary">{formatDateTime(trade.ts)}</td>
                                    <td className="p-3 text-textSecondary">{trade.symbol}</td>
                                    <td className="p-3 text-textSecondary">{formatCurrency(trade.entryPrice)}</td>
                                    <td className="p-3 text-textSecondary">{formatCurrency(trade.exitPrice)}</td>
                                    <td className="p-3 text-textSecondary">{trade.lots}</td>
                                    <td className={`p-3 font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(trade.pnl)}</td>
                                </tr>
                            ))}
                             {filteredTrades.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-textSecondary">
                                        No trades found for the selected date range.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-6">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 mx-1 rounded-lg bg-gray-200 disabled:opacity-50">Prev</button>
                        <span className="text-sm text-textSecondary mx-2">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 mx-1 rounded-lg bg-gray-200 disabled:opacity-50">Next</button>
                    </div>
                )}
            </Card>
        </div>
    );
};

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textSecondary"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

export default Trades;
