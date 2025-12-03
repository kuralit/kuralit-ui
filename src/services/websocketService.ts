/**
 * WebSocket service for connecting to the dashboard endpoint
 */

export interface DashboardEvent {
  type: 'event' | 'initial_state' | 'error' | 'pong' | 'inject_message_response';
  event_type?: string;
  session_id?: string;
  timestamp?: number;
  data?: any;
  sessions?: any[];
  metrics?: any[];
  config?: any;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface SubscriptionFilters {
  session_ids?: string[];
  event_types?: string[];
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Set<(event: DashboardEvent) => void> = new Set();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private isConnected = false;
  private isConnecting = false;

  constructor(url: string, apiKey?: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /**
   * Connect to the dashboard WebSocket endpoint
   */
  async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Build WebSocket URL with optional API key
      let wsUrl = this.url;
      if (this.apiKey) {
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl = `${wsUrl}${separator}api_key=${encodeURIComponent(this.apiKey)}`;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to dashboard');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnectionChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data: DashboardEvent = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data.type, data.event_type || '');
          this.handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error, event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.notifyConnectionChange(false);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyConnectionChange(false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
  }

  /**
   * Subscribe to events with optional filters
   */
  subscribe(filters?: SubscriptionFilters): void {
    if (!this.isConnected || !this.ws) {
      console.warn('[WebSocket] Cannot subscribe: not connected');
      return;
    }

    this.sendMessage({
      type: 'subscribe',
      filters: filters || {},
    });
  }

  /**
   * Send a message to the server
   */
  sendMessage(message: any): void {
    if (!this.isConnected || !this.ws) {
      console.warn('[WebSocket] Cannot send message: not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
    }
  }

  /**
   * Inject a test message (for playground)
   */
  injectMessage(sessionId: string, text: string): void {
    this.sendMessage({
      type: 'inject_message',
      session_id: sessionId,
      text: text,
    });
  }

  /**
   * Register a message handler
   */
  onMessage(callback: (event: DashboardEvent) => void): () => void {
    this.messageHandlers.add(callback);
    return () => {
      this.messageHandlers.delete(callback);
    };
  }

  /**
   * Register a connection state change handler
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(callback);
    return () => {
      this.connectionHandlers.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private handleMessage(data: DashboardEvent): void {
    // Notify all message handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error('[WebSocket] Error in message handler:', error);
      }
    });
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[WebSocket] Error in connection handler:', error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export default WebSocketService;

