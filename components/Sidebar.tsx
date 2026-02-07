
import React from 'react';
import type { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const NavItem: React.FC<{
  label: Page;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <li
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
      isActive
        ? 'text-primary font-bold bg-primary/5'
        : 'text-textSecondary hover:bg-primary/5 hover:text-primary'
    }`}
    onClick={onClick}
  >
    <span className={isActive ? 'text-primary' : 'text-textSecondary'}>{icon}</span>
    <span className="ml-4">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const navItems: { label: Page; icon: React.ReactNode }[] = [
    { label: 'Dashboard', icon: <HomeIcon /> },
    { label: 'Investors', icon: <UsersIcon /> },
    { label: 'Trades', icon: <ListIcon /> },
    { label: 'Withdrawals', icon: <WithdrawalIcon /> },
    { label: 'Tax Manager', icon: <BriefcaseIcon /> },
    { label: 'Messaging', icon: <MessageIcon /> },
    { label: 'Owner PnL', icon: <OwnerIcon /> },
    { label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-sidebar p-6 flex flex-col shadow-lg transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between mb-8 lg:mb-10">
        <div className="flex items-center">
            <div className="bg-primary p-2 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h1 className="ml-3 text-xl font-bold text-textPrimary tracking-tight">Rudra Algo</h1>
        </div>
        <button onClick={onClose} className="lg:hidden text-textSecondary p-1 rounded-md hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto -mx-2 px-2">
        <p className="text-sm text-textSecondary uppercase tracking-wider font-semibold mb-2 pl-2">Menu</p>
        <ul>
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              isActive={currentPage === item.label || (currentPage === 'Investor Profile' && item.label === 'Investors') || (currentPage === 'Investor Profile' && item.label === 'Owner PnL')}
              onClick={() => onNavigate(item.label)}
            />
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-border">
          <div className="flex items-center p-2 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">RP</div>
            <div className="ml-3">
                <p className="font-bold text-textPrimary text-sm">Rudra Patel</p>
                <p className="text-xs text-textSecondary">Admin</p>
            </div>
          </div>
      </div>
    </aside>
  );
};

// SVG Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const WithdrawalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="8"/><rect width="20" height="12" x="2" y="8" rx="2"/><path d="M6 14h.01"/><path d="M10 14h.01"/><path d="M14 14h.01"/><path d="M18 14h.01"/></svg>;
const MessageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const OwnerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-cog"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M12 22v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M21.7 16.4A2.4 2.4 0 0 0 20 16h-2a2.4 2.4 0 0 0-1.7.6"/><path d="M14.3 13.6A2.4 2.4 0 0 0 16 14h2a2.4 2.4 0 0 0 .8-1.8"/><path d="m21.4 17.5.4 1.8-1.8.4-1.8-.4-.4-1.8.4-1.8 1.8-.4 1.8.4.4 1.8Z"/><path d="m14.6 11.5-.4-1.8 1.8-.4 1.8.4.4 1.8-.4 1.8-1.8.4-1.8-.4Z"/></svg>

export default Sidebar;
