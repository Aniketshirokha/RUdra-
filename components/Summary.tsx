import React, { useMemo } from 'react';
import Card from './Card';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import dayjs from '../utils/dayjs';

const ArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
const ArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
const ActivityIcon: React.FC<{bg: string, children: React.ReactNode}> = ({bg, children}) => <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>{children}</div>;

const ArrowUpCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>;
const ArrowDownCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>;

const ActivityItem: React.FC<{icon: React.ReactNode, title: string, time: string, amount: string}> = ({icon, title, time, amount}) => (
    <div className="flex items-center">
        {icon}
        <div className="ml-4">
            <p className="font-bold text-textPrimary text-sm">{title}</p>
            <p className="text-xs text-textSecondary">{time}</p>
        </div>
        <p className={`ml-auto font-bold text-sm text-textPrimary`}>{amount}</p>
    </div>
);


const Summary: React.FC = () => {
    const { investors, dailyAllocations, capitalLedger } = useStore();

    const summaryData = useMemo(() => {
        const owner = investors.find(i => i.isOwner);
        if (!owner) {
            return {
                balance: 0,
                monthlyIncome: 0,
                monthlyExpense: 0,
                recentActivity: []
            };
        }
        
        const startOfMonth = dayjs().startOf('month');
        
        const ownerAllocations = dailyAllocations.filter(a => 
            a.investorId === owner.id && dayjs(a.date).isSameOrAfter(startOfMonth)
        );

        const monthlyIncome = ownerAllocations
            .filter(a => a.netAlloc > 0)
            .reduce((sum, a) => sum + a.netAlloc, 0);
            
        const monthlyExpense = ownerAllocations
            .filter(a => a.netAlloc < 0)
            .reduce((sum, a) => sum + a.netAlloc, 0);
        
        const recentActivity = [...capitalLedger]
            .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
            .slice(0, 2);

        return {
            balance: owner.capitalCurrent,
            monthlyIncome,
            monthlyExpense,
            recentActivity
        };
    }, [investors, dailyAllocations, capitalLedger]);


    return (
        <aside className="w-96 bg-surface p-8 border-l border-border hidden xl:flex flex-col flex-shrink-0">
            <h2 className="text-2xl font-bold text-textPrimary mb-6">Owner's Summary</h2>
            
            <div className="relative">
                <Card className="!p-0 overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-center">
                            <p className="text-textSecondary font-semibold">Your Balance</p>
                        </div>
                        <p className="text-3xl font-bold text-textPrimary mt-2">{formatCurrency(summaryData.balance)}</p>
                        <div className="flex space-x-4 text-sm mt-4">
                            <div className="flex items-center text-success font-semibold">
                                <ArrowUpIcon />
                                <span className="ml-1">{formatCurrency(summaryData.monthlyIncome)}</span>
                            </div>
                            <div className="flex items-center text-danger font-semibold">
                                <ArrowDownIcon />
                                <span className="ml-1">{formatCurrency(Math.abs(summaryData.monthlyExpense))}</span>
                            </div>
                        </div>
                         <p className="text-xs text-textSecondary mt-1">This month's P&amp;L</p>
                    </div>
                </Card>
            </div>


            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-textPrimary">Recent Activity</h3>
                </div>
                {summaryData.recentActivity.length > 0 ? (
                    <div className="space-y-5">
                        {summaryData.recentActivity.map(activity => {
                            const isAdd = activity.txType === 'add';
                            const investor = investors.find(i => i.id === activity.investorId);
                            const title = `${activity.note || 'Transaction'} for ${investor ? investor.name.split(' ')[0] : 'Unknown'}`;
                            return (
                                <ActivityItem 
                                    key={activity.id}
                                    icon={
                                        <ActivityIcon bg={isAdd ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}>
                                            {isAdd ? <ArrowUpCircleIcon /> : <ArrowDownCircleIcon />}
                                        </ActivityIcon>
                                    }
                                    title={title}
                                    time={formatDateTime(activity.createdAt)}
                                    amount={`${isAdd ? '+' : '-'}${formatCurrency(activity.amount)}`}
                                />
                            );
                        })}
                    </div>
                ) : (
                     <p className="text-sm text-textSecondary">No recent capital changes.</p>
                )}
            </div>
        </aside>
    );
};
export default Summary;