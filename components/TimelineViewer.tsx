import React, { useState, useEffect } from 'react';
import { Conversation, MessageType, TimelineItem, SDKConfig } from '../types';

interface TimelineViewerProps {
  conversations: Conversation[];
  sdkConfig: SDKConfig;
  selectedConvId?: string | null;
  onSelectConversation?: (id: string) => void;
}

const TimelineViewer: React.FC<TimelineViewerProps> = ({ 
  conversations, 
  sdkConfig,
  selectedConvId: propSelectedConvId,
  onSelectConversation,
}) => {
  const [internalSelectedConvId, setInternalSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const selectedConvId = propSelectedConvId ?? internalSelectedConvId;
  const setSelectedConvId = onSelectConversation || setInternalSelectedConvId;
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(conversations[0]?.items[0]?.id || null);
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState<'trace' | 'system' | 'llm'>('trace');
  
  // Toggle Filters
  const [showUser, setShowUser] = useState(true);
  const [showAgent, setShowAgent] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Brain / Config State
  const [provider, setProvider] = useState<'google' | 'openai' | 'anthropic'>('google');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid'>('idle');
  const [selectedModel, setSelectedModel] = useState(sdkConfig.model.name);

  const selectedConversation = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const selectedItem = selectedConversation?.items.find(i => i.id === selectedItemId);

  // Update selected item when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.items.length > 0) {
      if (!selectedItemId || !selectedConversation.items.find(i => i.id === selectedItemId)) {
        setSelectedItemId(selectedConversation.items[0].id);
      }
    }
  }, [selectedConvId, selectedConversation, selectedItemId]);

  const filteredItems = selectedConversation?.items.filter(item => {
    // Type Filter
    if (item.type === MessageType.USER && !showUser) return false;
    if (item.type === MessageType.AGENT && !showAgent) return false;
    if (item.type === MessageType.EVENT && !showEvents) return false;
    
    // Text Filter
    if (filterText) {
      const text = (item.content + (item.details || '')).toLowerCase();
      return text.includes(filterText.toLowerCase());
    }
    return true;
  });

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const handleItemClick = (id: string) => {
    setSelectedItemId(id);
    setActiveTab('trace');
  };

  const verifyKey = () => {
    if (!apiKey) return;
    setKeyStatus('verifying');
    setTimeout(() => {
        // Mock validation
        setKeyStatus(apiKey.length > 5 ? 'valid' : 'invalid');
    }, 800);
  };

  const getStatusBadge = (item: TimelineItem) => {
    // USER INPUT: Midnight Blue (Light) / Ice Cyan (Dark) - Cool colors to contrast with Warm Errors
    if (item.type === MessageType.USER) return <span className="text-[10px] bg-midnight-blue/10 text-midnight-blue dark:text-ice-cyan dark:bg-ice-cyan/10 border border-midnight-blue/20 dark:border-ice-cyan/20 px-1.5 py-0.5 rounded font-mono font-bold">INPUT</span>;
    
    // AGENT OUTPUT: Violet (Intelligence)
    if (item.type === MessageType.AGENT) return <span className="text-[10px] bg-violet/10 text-violet border border-violet/20 px-1.5 py-0.5 rounded font-mono font-bold">OUTPUT</span>;
    
    // SUCCESS: Electric Teal (Active/Good)
    if (item.status === 'success') return <span className="text-[10px] bg-electric-teal/10 text-electric-teal border border-electric-teal/20 px-1.5 py-0.5 rounded font-mono font-bold">200 OK</span>;
    
    // ERROR: Sunset Orange (Primary Brand Warning)
    if (item.status === 'error') return <span className="text-[10px] bg-sunset-orange/10 text-sunset-orange border border-sunset-orange/20 px-1.5 py-0.5 rounded font-mono font-bold">ERR</span>;
    
    // INFO: Default Gray
    return <span className="text-[10px] bg-grid-lines text-graphite dark:bg-white/5 dark:text-gray-400 dark:border-white/5 px-1.5 py-0.5 rounded font-mono font-bold border border-grid-lines">INFO</span>;
  };

  const renderTraceTab = () => (
    <div className="flex-1 overflow-y-auto p-5">
      {selectedItem ? (
        <div className="space-y-5">
          {/* Meta Data */}
          <div className="space-y-1.5">
             <div className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-wide">Type</div>
             <div className="text-xs font-mono text-slate-ink dark:text-white bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 px-2 py-1.5 rounded inline-block shadow-sm">
               {selectedItem.type}
             </div>
          </div>
          <div className="space-y-1.5">
             <div className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-wide">Status</div>
             <div className="text-xs font-mono text-slate-ink dark:text-white">{selectedItem.status || 'N/A'}</div>
          </div>

          {/* Raw JSON */}
          <div className="space-y-1.5">
             <div className="flex items-center justify-between">
               <div className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-wide">Payload</div>
               <button 
                 onClick={(e) => handleCopy(e, JSON.stringify(selectedItem.raw, null, 2))}
                 className="text-[10px] text-sunset-orange hover:text-deep-orange hover:underline font-medium"
               >
                 Copy JSON
               </button>
             </div>
             <div className={`bg-paper-white dark:bg-deep-void border rounded-md p-3 overflow-x-auto ${selectedItem.status === 'error' ? 'border-sunset-orange/30' : 'border-grid-lines dark:border-white/10'}`}>
               <pre className={`text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed ${selectedItem.status === 'error' ? 'text-sunset-orange' : 'text-slate-ink dark:text-gray-300'}`}>
                 {selectedItem.raw 
                   ? JSON.stringify(selectedItem.raw, null, 2) 
                   : <span className="text-graphite dark:text-gray-500 italic">No raw data available.</span>}
               </pre>
             </div>
          </div>
        </div>
      ) : (
         <div className="flex h-full items-center justify-center text-graphite dark:text-gray-500 text-sm italic">
           Select an item to inspect
         </div>
      )}
    </div>
  );

  const renderSystemTab = () => (
    <div className="flex-1 overflow-y-auto p-5 space-y-7">
      
      {/* Client Health Status */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-widest border-b border-grid-lines dark:border-white/10 pb-2">Client Health</h4>
        <div className="grid grid-cols-2 gap-3">
          
          {/* Socket Card */}
          <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded shadow-sm flex flex-col gap-1.5">
             <span className="text-[9px] font-bold text-graphite dark:text-gray-500 uppercase">Socket Status</span>
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${sdkConfig.client.socketStatus === 'connected' ? 'bg-electric-teal shadow-[0_0_5px_rgba(18,186,170,0.5)]' : 'bg-sunset-orange'}`}></div>
               <span className={`text-xs font-mono font-bold ${sdkConfig.client.socketStatus === 'connected' ? 'text-electric-teal' : 'text-sunset-orange'}`}>
                 {sdkConfig.client.socketStatus}
               </span>
            </div>
          </div>

          {/* Permissions Card */}
          <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded shadow-sm flex flex-col gap-1.5">
             <span className="text-[9px] font-bold text-graphite dark:text-gray-500 uppercase">Permissions</span>
             <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${sdkConfig.client.permissions === 'granted' ? 'bg-electric-teal/10 text-electric-teal border-electric-teal/20' : 'bg-circuit-yellow/10 text-circuit-yellow border-circuit-yellow/20'}`}>
                    {sdkConfig.client.permissions.toUpperCase()}
                </span>
             </div>
          </div>

          {/* App State Card */}
          <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded shadow-sm flex flex-col gap-1.5">
             <span className="text-[9px] font-bold text-graphite dark:text-gray-500 uppercase">App State</span>
             <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${sdkConfig.client.appState === 'foreground' ? 'bg-midnight-blue/10 text-midnight-blue dark:text-ice-cyan dark:bg-ice-cyan/10 border-midnight-blue/20 dark:border-ice-cyan/20' : 'bg-grid-lines dark:bg-white/5 text-graphite dark:text-gray-400 border-grid-lines dark:border-white/10'}`}>
                   {sdkConfig.client.appState.toUpperCase()}
                </span>
             </div>
          </div>

           {/* Platform Card */}
           <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded shadow-sm flex flex-col gap-1.5">
             <span className="text-[9px] font-bold text-graphite dark:text-gray-500 uppercase">Platform</span>
             <div className="flex items-center gap-1.5 overflow-hidden">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-graphite dark:text-gray-500 shrink-0"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
               <span className="text-slate-ink dark:text-white font-semibold text-[11px] truncate font-mono" title={sdkConfig.client.platform}>
                 {sdkConfig.client.platform}
               </span>
             </div>
          </div>
        </div>
      </section>

      {/* Agent Config */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-widest border-b border-grid-lines dark:border-white/10 pb-2">Agent Config</h4>
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
           <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded shadow-sm">
             <div className="text-graphite dark:text-gray-500 text-[9px] font-bold mb-1 uppercase">Model</div>
             <div className="text-slate-ink dark:text-white font-semibold">{sdkConfig.model.name}</div>
           </div>
           <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded shadow-sm">
             <div className="text-graphite dark:text-gray-500 text-[9px] font-bold mb-1 uppercase">Temp</div>
             <div className="text-slate-ink dark:text-white font-semibold">{sdkConfig.model.temperature}</div>
           </div>
        </div>
        <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded text-xs font-mono shadow-sm">
            <div className="text-graphite dark:text-gray-500 text-[9px] font-bold mb-1 uppercase">Agent ID</div>
            <div className="text-slate-ink dark:text-white font-semibold break-all">{sdkConfig.identity.agentId}</div>
        </div>
         <div className="bg-surface-white dark:bg-obsidian border border-grid-lines dark:border-white/10 p-2.5 rounded text-xs font-mono shadow-sm">
            <div className="text-graphite dark:text-gray-500 text-[9px] font-bold mb-1 uppercase">SDK Version</div>
            <div className="text-slate-ink dark:text-white font-semibold break-all">{sdkConfig.identity.sdkVersion}</div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="space-y-3">
         <h4 className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-widest border-b border-grid-lines dark:border-white/10 pb-2">Tools Active</h4>
         <div className="flex flex-wrap gap-2">
            {sdkConfig.capabilities.map(cap => (
              <span key={cap} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-white dark:bg-obsidian text-slate-ink dark:text-white text-[11px] font-mono font-medium rounded border border-grid-lines dark:border-white/10 shadow-sm select-none hover:border-sunset-orange dark:hover:border-sunset-orange transition-colors cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-electric-teal shadow-[0_0_0_1px_rgba(18,186,170,0.2)]"></span>
                {cap}
              </span>
            ))}
         </div>
      </section>

    </div>
  );

  const renderLLMTab = () => (
    <div className="flex-1 overflow-y-auto p-5 space-y-7">
      <div className="p-3 bg-circuit-yellow/10 border border-circuit-yellow/20 rounded text-xs text-slate-ink dark:text-circuit-yellow leading-relaxed font-medium">
        <strong>Hot Swap Mode:</strong> Changes applied here will restart the active agent session immediately.
      </div>

      {/* Model Selection */}
      <section className="space-y-2">
         <h4 className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-widest">Model Selection</h4>
         <div className="relative">
             <select 
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value)}
               disabled={true}
               className="w-full bg-paper-white dark:bg-charcoal border border-grid-lines dark:border-white/10 rounded px-3 py-2.5 text-xs font-mono outline-none appearance-none shadow-sm text-graphite dark:text-gray-500 opacity-60 cursor-not-allowed"
             >
                 <option value="gemini-2.5-flash" title="Optimized for speed and high-frequency tasks. Best for latency-sensitive applications.">gemini-2.5-flash (Fast)</option>
                 <option value="gemini-1.5-pro" title="Best for complex reasoning, coding tasks, and handling large context windows.">gemini-1.5-pro (Reasoning)</option>
                 <option value="gemini-nano" title="Runs locally on device, no internet required. Ideal for offline capabilities.">gemini-nano (On-Device)</option>
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-graphite dark:text-gray-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
             </div>
         </div>
      </section>

      {/* Action */}
      <div className="pt-5 border-t border-grid-lines dark:border-white/10 mt-auto">
         <button 
           disabled={true}
           className="w-full py-2.5 rounded text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all bg-paper-white dark:bg-charcoal text-graphite dark:text-gray-600 cursor-not-allowed border border-grid-lines dark:border-white/10 relative overflow-hidden group"
         >
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
           <span className="opacity-50">HOT RELOAD AGENT</span>
           <div className="absolute inset-0 bg-paper-white/95 dark:bg-charcoal/95 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[10px] font-bold text-graphite dark:text-gray-400 tracking-tight">COMING SOON</span>
           </div>
         </button>
      </div>

    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden h-full text-slate-ink dark:text-white font-sans">
      
      {/* 1. LEFT COLUMN: HISTORY */}
      <div className="w-64 bg-paper-white dark:bg-charcoal border-r border-grid-lines dark:border-white/10 flex flex-col shrink-0">
        <div className="p-4 border-b border-grid-lines dark:border-white/10 bg-surface-white dark:bg-deep-void">
          <h3 className="text-[10px] font-bold text-graphite dark:text-gray-400 uppercase tracking-widest">History</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-5 text-center text-graphite dark:text-gray-500 text-sm italic">
              No active sessions
            </div>
          ) : (
            conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                setSelectedConvId(conv.id);
                if (conv.items.length > 0) {
                  setSelectedItemId(conv.items[0].id);
                }
              }}
              className={`w-full text-left px-5 py-3 border-b border-paper-white dark:border-white/5 transition-all ${
                selectedConvId === conv.id
                  ? 'bg-surface-white dark:bg-white/5 border-l-4 border-l-sunset-orange shadow-sm'
                  : 'bg-transparent border-l-4 border-l-transparent hover:bg-surface-white dark:hover:bg-white/5 hover:border-l-grid-lines dark:hover:border-l-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${selectedConvId === conv.id ? 'text-slate-ink dark:text-white' : 'text-graphite dark:text-gray-400'}`}>
                  {conv.title}
                </span>
                <span className="text-[10px] font-mono text-graphite dark:text-gray-500">
                  {conv.timestamp.split(' . ')[1]}
                </span>
              </div>
              <p className="text-[11px] text-graphite dark:text-gray-500 truncate font-mono opacity-90">
                {conv.id}
              </p>
            </button>
          )))}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: LOG STREAM */}
      <div className="flex-1 flex flex-col bg-surface-white dark:bg-deep-void min-w-0 z-0">
        
        {/* Stream Toolbar */}
        <div className="h-14 border-b border-grid-lines dark:border-white/10 flex items-center justify-between px-6 bg-surface-white dark:bg-deep-void shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite dark:text-gray-500">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
               </span>
               <input 
                 type="text" 
                 placeholder="Filter logs..." 
                 className="pl-9 pr-3 py-1.5 bg-paper-white dark:bg-charcoal border border-grid-lines dark:border-white/10 rounded text-xs font-mono focus:outline-none focus:border-sunset-orange focus:bg-surface-white dark:focus:bg-obsidian w-56 text-slate-ink dark:text-white placeholder:text-graphite dark:placeholder:text-gray-500 transition-all"
                 value={filterText}
                 onChange={(e) => setFilterText(e.target.value)}
                 title="Search through message content and tool details"
               />
             </div>
             <div className="h-5 w-px bg-grid-lines dark:bg-white/10"></div>
             <div className="flex items-center gap-3">
               <label className="flex items-center gap-2 cursor-pointer select-none group" title="Toggle visibility of User messages">
                 <input type="checkbox" checked={showUser} onChange={e => setShowUser(e.target.checked)} className="rounded border-grid-lines dark:border-white/10 bg-paper-white dark:bg-obsidian text-sunset-orange focus:ring-0 w-3.5 h-3.5" />
                 <span className="text-[11px] font-semibold text-graphite dark:text-gray-400 uppercase group-hover:text-slate-ink dark:group-hover:text-white">User</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer select-none group" title="Toggle visibility of Agent responses">
                 <input type="checkbox" checked={showAgent} onChange={e => setShowAgent(e.target.checked)} className="rounded border-grid-lines dark:border-white/10 bg-paper-white dark:bg-obsidian text-sunset-orange focus:ring-0 w-3.5 h-3.5" />
                 <span className="text-[11px] font-semibold text-graphite dark:text-gray-400 uppercase group-hover:text-slate-ink dark:group-hover:text-white">Agent</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer select-none group" title="Toggle visibility of Tool usage and system events">
                 <input type="checkbox" checked={showEvents} onChange={e => setShowEvents(e.target.checked)} className="rounded border-grid-lines dark:border-white/10 bg-paper-white dark:bg-obsidian text-sunset-orange focus:ring-0 w-3.5 h-3.5" />
                 <span className="text-[11px] font-semibold text-graphite dark:text-gray-400 uppercase group-hover:text-slate-ink dark:group-hover:text-white">Tools</span>
               </label>
             </div>
          </div>
          <button className="p-1.5 hover:bg-paper-white dark:hover:bg-white/5 rounded text-graphite dark:text-gray-400 hover:text-slate-ink dark:hover:text-white transition-colors">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
        </div>

        {/* Stream Rows */}
        <div className="flex-1 overflow-y-auto bg-surface-white dark:bg-deep-void font-mono text-sm">
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center text-graphite dark:text-gray-500 text-sm italic">
              No conversation selected
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            filteredItems.map((item) => {
            const isError = item.status === 'error';
            return (
            <div 
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`group flex items-start py-3 px-6 border-b border-grid-lines dark:border-white/5 cursor-pointer transition-colors ${
                selectedItemId === item.id 
                  ? 'bg-sunset-orange/5 dark:bg-white/5' 
                  : isError 
                      ? 'bg-sunset-orange/5 dark:bg-sunset-orange/5 hover:bg-sunset-orange/10' 
                      : 'hover:bg-paper-white dark:hover:bg-white/5'
              }`}
            >
              {/* Timestamp & Latency */}
              <div className="flex flex-col items-end w-24 flex-shrink-0 mr-5 pt-0.5">
                 <span className="text-[11px] font-medium text-graphite dark:text-gray-500">{item.timestamp}</span>
                 {item.latency && <span className="text-[10px] text-graphite/70 dark:text-gray-600">{item.latency}</span>}
              </div>

              {/* Status Indicator */}
              <div className="w-20 flex-shrink-0 pt-0.5">
                {getStatusBadge(item)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between">
                   <div className={`font-medium mb-1 leading-relaxed ${
                     isError ? 'text-sunset-orange' :
                     item.type === MessageType.EVENT ? 'text-graphite dark:text-gray-400' : 
                     item.type === MessageType.AGENT ? 'text-slate-ink dark:text-white' : 'text-slate-ink dark:text-white'
                   }`}>
                     {item.content}
                   </div>
                   {/* Copy Button (Visible on Hover) */}
                   <button 
                     onClick={(e) => handleCopy(e, item.raw ? JSON.stringify(item.raw, null, 2) : item.content)}
                     className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-graphite hover:text-sunset-orange dark:text-gray-500 dark:hover:text-sunset-orange"
                     title="Copy Raw JSON"
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2 2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                   </button>
                </div>
                {item.details && (
                  <div className={`text-xs break-all border rounded px-2.5 py-1.5 mt-1 inline-block font-medium ${
                      isError 
                        ? 'bg-sunset-orange/5 border-sunset-orange/20 text-sunset-orange' 
                        : 'text-graphite dark:text-gray-400 bg-paper-white dark:bg-charcoal border-grid-lines dark:border-white/10'
                  }`}>
                    {item.details}
                  </div>
                )}
              </div>
            </div>
            );
          })
          ) : (
            <div className="flex h-full items-center justify-center text-graphite dark:text-gray-500 text-sm italic">
              No messages in this conversation
        </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT COLUMN: INSPECTOR */}
      <div className="w-80 bg-paper-white dark:bg-charcoal border-l border-grid-lines dark:border-white/10 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.03)] z-10">
        
        {/* Inspector Tabs */}
        <div className="flex border-b border-grid-lines dark:border-white/10 bg-surface-white dark:bg-deep-void">
          <button 
            onClick={() => setActiveTab('trace')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'trace' ? 'border-sunset-orange text-sunset-orange bg-sunset-orange/5 dark:bg-sunset-orange/10' : 'border-transparent text-graphite dark:text-gray-500 hover:text-slate-ink dark:hover:text-white hover:bg-paper-white dark:hover:bg-white/5'
            }`}
          >
            Trace
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'system' ? 'border-sunset-orange text-sunset-orange bg-sunset-orange/5 dark:bg-sunset-orange/10' : 'border-transparent text-graphite dark:text-gray-500 hover:text-slate-ink dark:hover:text-white hover:bg-paper-white dark:hover:bg-white/5'
            }`}
          >
            System
          </button>
          <button 
            onClick={() => setActiveTab('llm')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'llm' ? 'border-sunset-orange text-sunset-orange bg-sunset-orange/5 dark:bg-sunset-orange/10' : 'border-transparent text-graphite dark:text-gray-500 hover:text-slate-ink dark:hover:text-white hover:bg-paper-white dark:hover:bg-white/5'
            }`}
          >
            LLM
          </button>
        </div>
        
        {activeTab === 'trace' && renderTraceTab()}
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'llm' && renderLLMTab()}

      </div>

    </div>
  );
};

export default TimelineViewer;