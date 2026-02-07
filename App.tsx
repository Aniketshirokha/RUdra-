import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Summary from './components/Summary';
import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import InvestorProfile from './pages/InvestorProfile';
import Withdrawals from './pages/Withdrawals';
import Messaging from './pages/Messaging';
import OwnerPnl from './pages/OwnerPnl';
import Settings from './pages/Settings';
import TaxManager from './pages/TaxManager';
import Trades from './pages/Trades';
import DebugPanel from './components/DebugPanel';
import type { Page } from './types';
import { useStore } from './store/useStore';

const SetupGuide: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="bg-primary/10 p-4 rounded-full text-primary mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-textPrimary">Welcome to Rudra Algo!</h2>
        <p className="text-textSecondary mt-2 max-w-md">
           It looks like this is your first time here, or no data has been loaded. Please go to the settings page to connect your Google Sheets.
        </p>
        <button 
            onClick={() => onNavigate('Settings')}
            className="mt-6 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center"
        >
            Go to Settings
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="m9 18 6-6-6-6"/></svg>
        </button>
    </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { investors, warnings, isReady, loadData, trades } = useStore(state => ({ 
    investors: state.investors, 
    warnings: state.warnings,
    isReady: state.isReady,
    loadData: state.loadData,
    trades: state.trades,
  }));
  const owner = useMemo(() => investors.find(i => i.isOwner), [investors]);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (investors.length > 0 && !selectedInvestorId) {
        setSelectedInvestorId(investors[0]?.id || null);
    }
  }, [investors, selectedInvestorId]);

  const handleNavigate = (page: Page) => {
      setCurrentPage(page);
      setSidebarOpen(false);
  };

  const handleSelectInvestor = (investorId: string) => {
    setSelectedInvestorId(investorId);
    setCurrentPage('Investor Profile');
    setSidebarOpen(false);
  };

  const selectedInvestor = useMemo(
    () => investors.find(inv => inv.id === selectedInvestorId),
    [selectedInvestorId, investors]
  );
  
  const renderPage = () => {
    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-textSecondary font-medium">Initialising secure dashboard...</p>
            </div>
        );
    }

    if (trades.length === 0 && currentPage !== 'Settings') {
       return <SetupGuide onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'Investors':
        return <Investors onSelectInvestor={handleSelectInvestor} />;
      case 'Investor Profile':
        return selectedInvestor ? <InvestorProfile investor={selectedInvestor} onNavigate={handleNavigate} /> : <div className="p-8 text-center text-textSecondary">Please select an investor from the directory.</div>;
      case 'Trades':
        return <Trades />;
      case 'Withdrawals':
        return <Withdrawals />;
      case 'Messaging':
        return <Messaging />;
      case 'Owner PnL':
        return <OwnerPnl />;
      case 'Tax Manager':
        return <TaxManager />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="lg:p-6 h-screen flex flex-col bg-background lg:bg-[#E0E7FF]">
       <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-sm z-20 relative">
          <div className="flex items-center">
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-textPrimary hover:bg-gray-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
             </button>
             <span className="font-bold text-lg ml-2 text-textPrimary uppercase tracking-tighter">Rudra Algo</span>
          </div>
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
              {owner ? owner.name.charAt(0) : 'R'}
          </div>
       </div>

      <div className="flex-1 flex lg:bg-background lg:rounded-2xl lg:shadow-2xl overflow-hidden lg:h-[calc(100vh-3rem)] relative">
        {sidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
                onClick={() => setSidebarOpen(false)}
            />
        )}

        <Sidebar 
            currentPage={currentPage} 
            onNavigate={handleNavigate} 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto w-full bg-[#F8F9FE] relative z-0">
           {warnings.length > 0 && (
                <div className="sticky top-0 z-10 py-3 px-4 lg:px-6 bg-red-600 text-white text-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                        <div className="font-medium">
                            {warnings.map((w, i) => <div key={i}>{w}</div>)}
                        </div>
                    </div>
                    {warnings.some(w => w.includes('DATABASE ERROR')) && (
                        <button 
                            onClick={() => handleNavigate('Settings')}
                            className="bg-white text-red-600 px-4 py-1 rounded-full font-bold text-xs uppercase hover:bg-red-50 transition-colors"
                        >
                            Fix Now
                        </button>
                    )}
                </div>
            )}
          <div className="p-4 lg:p-8 pb-24 lg:pb-8">
            {renderPage()}
          </div>
        </main>
        <Summary />
      </div>
      <DebugPanel />
    </div>
  );
};

export default App;