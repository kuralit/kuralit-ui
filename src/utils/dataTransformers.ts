/**
 * Data transformation utilities to convert backend data to UI format
 */

import { Conversation, TimelineItem, MessageType, Metric, SDKConfig } from '../../types';

export interface BackendSession {
  id: string;
  timestamp: string;
  title: string;
  preview: string;
  items: BackendTimelineItem[];
}

export interface BackendTimelineItem {
  id: string;
  type: string;
  content: string;
  details?: string;
  timestamp: string;
  latency?: string;
  status?: 'success' | 'error' | 'info';
  raw?: any;
}

export interface BackendMetric {
  label: string;
  value: number;
}

export interface BackendConfig {
  identity: {
    agentId: string;
    sdkVersion: string;
    environment?: string;
  };
  model: {
    name: string;
    temperature: number;
    topP: number;
  };
  client: {
    platform?: string;
    appState?: 'foreground' | 'background';
    permissions?: 'granted' | 'denied' | 'prompt';
    socketStatus?: 'connected' | 'disconnected';
    lastHeartbeat?: string;
  };
  capabilities: string[];
}

/**
 * Transform backend session to UI Conversation format
 */
export function transformBackendSession(session: BackendSession): Conversation {
  return {
    id: session.id,
    timestamp: session.timestamp,
    title: session.title,
    preview: session.preview,
    items: session.items.map(transformBackendTimelineItem),
  };
}

/**
 * Transform backend timeline item to UI TimelineItem format
 */
export function transformBackendTimelineItem(item: BackendTimelineItem): TimelineItem {
  // Map backend type to UI MessageType
  let type: MessageType;
  switch (item.type) {
    case 'USER':
      type = MessageType.USER;
      break;
    case 'AGENT':
      type = MessageType.AGENT;
      break;
    case 'EVENT':
      type = MessageType.EVENT;
      break;
    default:
      type = MessageType.USER;
  }

  return {
    id: item.id,
    type,
    content: item.content,
    details: item.details,
    timestamp: item.timestamp,
    latency: item.latency,
    status: item.status,
    raw: item.raw,
  };
}

/**
 * Transform backend metrics to UI Metric format
 */
export function transformMetrics(backendMetrics: BackendMetric[]): Metric[] {
  return backendMetrics.map((m) => ({
    label: m.label,
    value: m.value,
  }));
}

/**
 * Transform backend config to UI SDKConfig format
 */
export function transformConfig(backendConfig: BackendConfig): SDKConfig {
  return {
    identity: {
      agentId: backendConfig.identity.agentId,
      sdkVersion: backendConfig.identity.sdkVersion,
      environment: (backendConfig.identity.environment as 'development' | 'staging' | 'production') || 'development',
    },
    model: {
      name: backendConfig.model.name,
      temperature: backendConfig.model.temperature,
      topP: backendConfig.model.topP,
    },
    client: {
      platform: backendConfig.client.platform || 'Unknown',
      appState: backendConfig.client.appState || 'foreground',
      permissions: backendConfig.client.permissions || 'granted',
      socketStatus: backendConfig.client.socketStatus || 'connected',
      lastHeartbeat: backendConfig.client.lastHeartbeat || '0ms ago',
    },
    capabilities: backendConfig.capabilities || [],
  };
}

/**
 * Transform event data to TimelineItem
 */
export function transformEventToTimelineItem(
  eventType: string,
  sessionId: string,
  data: any,
  timestamp: number
): TimelineItem | null {
  const date = new Date(timestamp * 1000);
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  switch (eventType) {
    case 'message_received':
      return {
        id: `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.USER,
        content: data.text || '',
        timestamp: timeStr,
        latency: '+0.00s',
        status: 'info',
        raw: {
          role: 'user',
          content: data.text,
          metadata: data.metadata || {},
        },
      };

    case 'agent_response_complete':
      return {
        id: `msg_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.AGENT,
        content: data.final_text || '',
        timestamp: timeStr,
        latency: `+${(data.total_time_ms / 1000).toFixed(2)}s`,
        status: 'success',
        raw: {
          role: 'assistant',
          content: data.final_text,
        },
      };

    case 'tool_call_start':
      return {
        id: `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.EVENT,
        content: `tool:${data.tool_name}`,
        details: JSON.stringify(data.tool_arguments || {}),
        timestamp: timeStr,
        status: 'success',
        raw: {
          tool_call_id: data.tool_call_id,
          function: {
            name: data.tool_name,
            arguments: JSON.stringify(data.tool_arguments || {}),
          },
        },
      };

    case 'tool_call_complete':
      return {
        id: `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.EVENT,
        content: `tool:${data.tool_name}`,
        details: data.result_preview || 'Success',
        timestamp: timeStr,
        status: 'success',
        raw: {
          tool_call_id: data.tool_call_id,
          function: {
            name: data.tool_name,
          },
          response: data.result_preview,
        },
      };

    case 'tool_call_error':
      return {
        id: `evt_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.EVENT,
        content: `tool:${data.tool_name}`,
        details: `ERROR: ${data.error}`,
        timestamp: timeStr,
        status: 'error',
        raw: {
          tool_call_id: data.tool_call_id,
          function: {
            name: data.tool_name,
          },
          error: {
            message: data.error,
            type: data.error_type,
          },
        },
      };

    case 'error':
      return {
        id: `err_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.EVENT,
        content: 'Error',
        details: data.message || 'Unknown error',
        timestamp: timeStr,
        status: 'error',
        raw: {
          error_type: data.error_type,
          error_code: data.error_code,
          message: data.message,
        },
      };

    default:
      return null;
  }
}

