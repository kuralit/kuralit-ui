import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricsRow from './components/MetricsRow';
import TimelineViewer from './components/TimelineViewer';
import { useDashboardState } from './src/hooks/useDashboardState';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Get dashboard state from WebSocket
  const {
    conversations,
    selectedConversation,
    selectedConvId,
    metrics,
    sdkConfig,
    isConnected,
    error,
    selectConversation,
  } = useDashboardState({
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8000/ws/dashboard',
    apiKey: import.meta.env.VITE_API_KEY,
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auto-select first conversation if available and none selected
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, selectedConvId, selectConversation]);

  return (
    <div className={`flex flex-col h-screen w-full font-sans overflow-hidden transition-colors duration-200 ${isDarkMode ? 'bg-deep-void text-white' : 'bg-paper-white text-slate-ink'}`}>
      {/* Main Application Window */}
      <div className={`flex flex-col h-full w-full shadow-2xl overflow-hidden ${isDarkMode ? 'bg-deep-void border-machine' : 'bg-surface-white'}`}>
        <Header isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
        
        {/* Toolbar / Telemetry Strip */}
        <div className={`flex-shrink-0 border-b z-10 ${isDarkMode ? 'bg-charcoal border-machine' : 'bg-surface-white border-grid-lines'}`}>
          <MetricsRow metrics={metrics} />
          {error && (
            <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {!isConnected && (
            <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm">
              Connecting to server...
            </div>
          )}
        </div>

        {/* Main Workspace */}
        <main className="flex-1 flex overflow-hidden">
          {sdkConfig ? (
            <TimelineViewer
              conversations={conversations}
              sdkConfig={sdkConfig}
              selectedConvId={selectedConvId}
              onSelectConversation={selectConversation}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Connecting to dashboard...</div>
                <div className="text-sm text-gray-500">Waiting for initial state</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;