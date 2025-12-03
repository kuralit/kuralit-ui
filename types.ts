export enum MessageType {
  USER = 'USER',
  AGENT = 'AGENT',
  EVENT = 'EVENT',
}

export interface TimelineItem {
  id: string;
  type: MessageType;
  content: string;
  details?: string; // For tool outputs or secondary info
  timestamp: string; // "18:00:01"
  latency?: string; // "+0.23s"
  status?: 'success' | 'error' | 'info';
  raw?: any; // The raw JSON payload for the inspector
}

export interface Conversation {
  id: string;
  timestamp: string;
  title: string;
  preview: string;
  items: TimelineItem[];
}

export interface Metric {
  label: string;
  value: number;
}

export interface SDKConfig {
  identity: {
    agentId: string;
    sdkVersion: string;
    environment: 'development' | 'staging' | 'production';
  };
  model: {
    name: string;
    temperature: number;
    topP: number;
  };
  client: {
    platform: string;
    appState: 'foreground' | 'background';
    permissions: 'granted' | 'denied' | 'prompt';
    socketStatus: 'connected' | 'disconnected';
    lastHeartbeat: string;
  };
  capabilities: string[];
}