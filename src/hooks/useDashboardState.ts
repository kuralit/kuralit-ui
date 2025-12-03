/**
 * Custom hook for managing dashboard state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Metric, SDKConfig, TimelineItem } from '../../types';
import WebSocketService, { DashboardEvent } from '../services/websocketService';
import {
  transformBackendSession,
  transformMetrics,
  transformConfig,
  transformEventToTimelineItem,
} from '../utils/dataTransformers';

interface UseDashboardStateOptions {
  websocketUrl?: string;
  apiKey?: string;
}

export function useDashboardState(options: UseDashboardStateOptions = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [sdkConfig, setSdkConfig] = useState<SDKConfig | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsServiceRef = useRef<WebSocketService | null>(null);
  const conversationsMapRef = useRef<Map<string, Conversation>>(new Map());

  // Initialize WebSocket service
  useEffect(() => {
    const wsUrl = options.websocketUrl || 'ws://localhost:8000/ws/dashboard';
    const apiKey = options.apiKey;

    const wsService = new WebSocketService(wsUrl, apiKey);
    wsServiceRef.current = wsService;

    // Handle connection changes
    const unsubscribeConnection = wsService.onConnectionChange((connected) => {
      console.log('[Dashboard] Connection changed:', connected);
      setIsConnected(connected);
      if (!connected) {
        setError('Disconnected from server');
      } else {
        setError(null);
      }
    });

    // Handle messages - define handlers inside useEffect to avoid stale closures
    const handleDashboardEvent = (event: DashboardEvent) => {
      console.log('[Dashboard] Received event:', event.type, event.event_type);
      
      if (event.type === 'initial_state') {
        console.log('[Dashboard] Initial state received:', {
          sessions: event.sessions?.length || 0,
          metrics: event.metrics?.length || 0,
          hasConfig: !!event.config,
        });
        
        // Handle initial state
        if (event.sessions) {
          const sessions = event.sessions.map(transformBackendSession);
          const map = new Map<string, Conversation>();
          sessions.forEach((conv) => {
            map.set(conv.id, conv);
          });
          conversationsMapRef.current = map;
          setConversations(sessions);

          // Select first conversation if none selected
          setSelectedConvId((prev) => {
            if (!prev && sessions.length > 0) {
              return sessions[0].id;
            }
            return prev;
          });
        }

        if (event.metrics) {
          setMetrics(transformMetrics(event.metrics));
        }

        if (event.config) {
          setSdkConfig(transformConfig(event.config));
        }
      } else if (event.type === 'event' && event.event_type) {
        // Handle real-time events
        handleRealtimeEvent(event);
      } else if (event.type === 'error') {
        setError(event.message || 'Unknown error');
      }
    };

    const handleRealtimeEvent = (event: DashboardEvent) => {
      // Validate required fields
      if (!event.event_type || !event.timestamp) {
        console.warn('[Dashboard] Invalid event (missing required fields):', event);
        return;
      }

      console.log('[Dashboard] Real-time event:', event.event_type, 'session:', event.session_id || 'global');

      // Handle events that don't require a session_id
      const globalEvents = ['dashboard_connected', 'dashboard_test', 'metrics_updated'];
      if (globalEvents.includes(event.event_type)) {
        // Handle global events (no session_id required)
        if (event.event_type === 'dashboard_connected' || event.event_type === 'dashboard_test') {
          console.log(`[Dashboard] ${event.event_type} event received:`, event.data);
          // Just log it, no action needed
          return;
        }
        
        if (event.event_type === 'metrics_updated' && event.data) {
          setMetrics((prev) => {
            const updated = [...prev];
            const data = event.data || {};

            // Update metrics based on server-level totals from event data
            if (typeof data.total_messages === 'number') {
              const msgIndex = updated.findIndex((m) => m.label === 'Messages');
              if (msgIndex >= 0) {
                updated[msgIndex] = { ...updated[msgIndex], value: data.total_messages };
              }
            }

            // Update tool calls count from server-level total
            if (typeof data.total_tool_calls === 'number') {
              const toolIndex = updated.findIndex((m) => m.label === 'Tool Calls');
              if (toolIndex >= 0) {
                updated[toolIndex] = { ...updated[toolIndex], value: data.total_tool_calls };
              }
            }

            if (typeof data.total_errors === 'number') {
              const errIndex = updated.findIndex((m) => m.label === 'Errors');
              if (errIndex >= 0) {
                updated[errIndex] = { ...updated[errIndex], value: data.total_errors };
              }
            }

            if (typeof data.average_latency_ms === 'number') {
              const latIndex = updated.findIndex((m) => m.label === 'Latency (p95)');
              if (latIndex >= 0) {
                updated[latIndex] = { ...updated[latIndex], value: Math.round(data.average_latency_ms) };
              }
            }

            return updated;
          });
          return;
        }
      }

      // Handle session-specific events (require session_id)
      if (!event.session_id) {
        console.warn('[Dashboard] Event requires session_id but none provided:', event.event_type);
        return;
      }

      const sessionId = event.session_id;
      
      const timelineItem = transformEventToTimelineItem(
        event.event_type,
        sessionId,
        event.data || {},
        event.timestamp
      );

      if (!timelineItem) {
        console.log('[Dashboard] Event type not supported for timeline:', event.event_type);
        return; // Event type not supported for timeline
      }

      console.log('[Dashboard] Adding timeline item:', timelineItem.id, 'to session:', sessionId);

      // Update conversation with new timeline item
      setConversations((prev) => {
        const updated = [...prev];
        const convIndex = updated.findIndex((c) => c.id === sessionId);

        if (convIndex >= 0) {
          // Update existing conversation
          const updatedConv = {
            ...updated[convIndex],
            items: [...updated[convIndex].items, timelineItem],
          };
          updated[convIndex] = updatedConv;
          conversationsMapRef.current.set(sessionId, updatedConv);
          console.log('[Dashboard] Updated conversation:', sessionId, 'items:', updatedConv.items.length);
        } else {
          // Create new conversation if session_created event
          if (event.event_type === 'session_created') {
            const newConv: Conversation = {
              id: sessionId,
              timestamp: new Date(event.timestamp * 1000).toLocaleString(),
              title: `Session ${sessionId.substring(0, 8)}`,
              preview: 'New session',
              items: [timelineItem],
            };
            updated.unshift(newConv); // Add to beginning
            conversationsMapRef.current.set(sessionId, newConv);
            console.log('[Dashboard] Created new conversation:', sessionId);

            // Auto-select if no conversation selected
            setSelectedConvId((prev) => {
              if (!prev) {
                return sessionId;
              }
              return prev;
            });
          } else {
            console.warn('[Dashboard] Event for unknown session:', sessionId, event.event_type);
          }
        }

        return updated;
      });
    };

    // Register message handler
    const unsubscribeMessage = wsService.onMessage(handleDashboardEvent);

    // Connect
    wsService.connect();

    return () => {
      unsubscribeConnection();
      unsubscribeMessage();
      wsService.disconnect();
    };
  }, [options.websocketUrl, options.apiKey]);

  const selectConversation = useCallback((id: string) => {
    setSelectedConvId(id);
  }, []);

  const refreshData = useCallback(async () => {
    // Reconnect to get fresh initial state
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      await wsServiceRef.current.connect();
    }
  }, []);

  const clearConversations = useCallback(() => {
    setConversations([]);
    conversationsMapRef.current.clear();
    setSelectedConvId(null);
  }, []);

  const injectMessage = useCallback((sessionId: string, text: string) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.injectMessage(sessionId, text);
    }
  }, []);

  const selectedConversation = conversations.find((c) => c.id === selectedConvId) || null;

  return {
    conversations,
    selectedConversation,
    selectedConvId,
    metrics,
    sdkConfig,
    isConnected,
    error,
    selectConversation,
    refreshData,
    clearConversations,
    injectMessage,
  };
}

