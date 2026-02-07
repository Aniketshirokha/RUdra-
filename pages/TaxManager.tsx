import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { DailyCharge } from '../types';

const TaxManager: React.FC = () => {
    const { dailyCharges, upsertDailyCharge } = useStore(state => ({
        dailyCharges: state.dailyCharges,
        upsertDailyCharge: state.upsertDailyCharge
    }));
    
    const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [taxAmount, setTaxAmount] = useState('');
    const [note, setNote] = useState('');

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        const existing = dailyCharges.find(dc => dc.date === newDate);
        if (existing) {
            setTaxAmount(existing.taxAmount.toString());
            setNote(existing.note || '');
        } else {
            setTaxAmount('');
            setNote('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (date && taxAmount) {
            upsertDailyCharge(date, parseFloat(taxAmount), note || null);
            // In a real app, show a success toast.
        }
    };
    
    const sortedCharges = useMemo(() => {
        return [...dailyCharges].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dailyCharges]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-textPrimary mb-6">Tax Manager</h1>

            <Card className="mb-8">
                <h2 className="text-xl font-semibold text-textPrimary mb-4">Enter Daily Tax & Charges</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="tax-date" className="block text-sm font-medium text-textSecondary mb-1">Date</label>
                        <input id="tax-date" type="date" value={date} onChange={e => handleDateChange(e.target.value)} className="w-full p-2 border border-border rounded-lg" />
                    </div>
                    <div>
                        <label htmlFor="tax-amount" className="block text-sm font-medium text-textSecondary mb-1">Tax Amount (INR)</label>
                        <input id="tax-amount" type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} required placeholder="e.g., 250.50" className="w-full p-2 border border-border rounded-lg" />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="tax-note" className="block text-sm font-medium text-textSecondary mb-1">Note (Optional)</label>
                        <input id="tax-note" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., F&O Charges" className="w-full p-2 border border-border rounded-lg" />
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg">Save or Update</button>
                    </div>
                </form>
            </Card>

            <Card>
                <h2 className="text-xl font-semibold text-textPrimary mb-4">History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border">
                                {['Date', 'Tax Amount', 'Note', 'Last Updated'].map(h => <th key={h} className="p-3 text-sm font-semibold text-textSecondary">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCharges.map((charge: DailyCharge) => (
                                <tr key={charge.id} className="border-b border-border hover:bg-background">
                                    <td className="p-3 font-semibold text-textPrimary">{formatDate(charge.date)}</td>
                                    <td className="p-3 text-textSecondary">{formatCurrency(charge.taxAmount)}</td>
                                    <td className="p-3 text-textSecondary">{charge.note || '-'}</td>
                                    <td className="p-3 text-textSecondary">{formatDate(charge.updatedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TaxManager;
