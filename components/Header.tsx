import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header className={`h-14 flex items-center justify-between px-6 border-b shrink-0 z-20 relative transition-colors duration-200 ${
      isDarkMode ? 'bg-deep-void border-white/10' : 'bg-surface-white border-grid-lines shadow-sm'
    }`}>
      <div className="flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo/kuralit-w.jpeg" 
            alt="Kuralit Logo" 
            className={`h-6 w-auto ${isDarkMode ? 'block' : 'hidden'}`}
          />
          <img 
            src="/logo/kuralit-b.jpeg" 
            alt="Kuralit Logo" 
            className={`h-6 w-auto ${isDarkMode ? 'hidden' : 'block'}`}
          />
          <h1 className={`text-sm font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-slate-ink'
          }`}>Kuralit <span className="opacity-50 font-normal">SDK</span></h1>
        </div>
        
        <span className={isDarkMode ? 'text-machine' : 'text-gray-300'}>/</span>
        
        <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium ${
            isDarkMode ? 'bg-white/5 text-gray-400' : 'text-graphite'
        }`}>
            <span>Local Environment</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={`p-2 rounded-md transition-all ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-white/5' 
              : 'text-graphite hover:text-slate-ink hover:bg-paper-white'
          }`}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          )}
        </button>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          isDarkMode ? 'bg-white/5 border-white/5' : 'bg-paper-white border-grid-lines'
        }`}>
           <div className="relative w-2 h-2">
               <div className="absolute inset-0 bg-electric-teal rounded-full animate-ping opacity-75"></div>
               <div className="relative w-2 h-2 rounded-full bg-electric-teal shadow-[0_0_8px_rgba(18,186,170,0.6)]"></div>
           </div>
           <span className={`text-[11px] font-semibold tracking-wide ${
             isDarkMode ? 'text-gray-200' : 'text-graphite'
           }`}>AGENT ACTIVE</span>
        </div>
      </div>
    </header>
  );
};

export default Header;