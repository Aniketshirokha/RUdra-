import React from 'react';
import Card from './Card';

const DataAnalyticsCard: React.FC = () => (
    <Card>
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-textPrimary text-lg">Data Analytics Overview</p>
                <p className="text-textSecondary text-sm mt-1">See how your account grow and how you can boost it.</p>
            </div>
            <div className="relative w-24 h-24 flex-shrink-0 ml-4">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-200"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3" />
                    <path className="text-primary"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="75, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <button className="text-xs font-bold text-primary">START</button>
                </div>
            </div>
        </div>
    </Card>
);

export default DataAnalyticsCard;
