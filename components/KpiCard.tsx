import React from 'react';
import type { KpiCardProps } from '../types';

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => {
  return (
    <div className="relative p-6 rounded-2xl text-white overflow-hidden bg-gradient-to-br from-[#8A72F4] to-[#6366F1] shadow-lg shadow-primary/30">
       <div className="absolute -right-4 -bottom-4 text-white/20">
        {/* Fix: Cast the icon to a ReactElement that accepts a className prop to resolve the TypeScript error. */}
        {React.cloneElement(icon as React.ReactElement<{ className: string }>, { className: 'w-24 h-24' })}
      </div>
      <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
    </div>
  );
};

export default KpiCard;