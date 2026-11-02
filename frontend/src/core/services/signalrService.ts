import * as signalR from '@microsoft/signalr';
import { apiClient } from '../api/api-client';

export type SignalRConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface ChatMessageDto {
  id?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  content: string;
  sentAt?: string;
  [key: string]: unknown;
}

export interface ChildCheckInOutEvent {
  childId: string;
  childName: string;
  classroomId: string;
  time: string;
}

export type ReceiveMessageListener = (message: ChatMessageDto) => void;
export type ChildCheckInOutListener = (data: ChildCheckInOutEvent) => void;
export type HealthAlertListener = (alert: unknown) => void;
export type StatusChangeListener = (status: SignalRConnectionStatus) => void;

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private status: SignalRConnectionStatus = 'disconnected';
  private statusListeners = new Set<StatusChangeListener>();
  private isStarting = false;

  private receiveMessageListeners = new Set<ReceiveMessageListener>();
  private childCheckedInListeners = new Set<ChildCheckInOutListener>();
  private childCheckedOutListeners = new Set<ChildCheckInOutListener>();
  private genericListeners = new Map<string, Set<(...args: unknown[]) => void>>();

  /**
   * Resolves the full URL for the Daycare SignalR hub
   */
  private getHubUrl(): string {
    const apiBase = apiClient.getBaseUrl();
    if (!apiBase) {
      return '/hubs/daycare';
    }
    // If apiBase ends with /api, replace with /hubs/daycare
    const rootUrl = apiBase.replace(/\/api\/?$/, '');
    return `${rootUrl}/hubs/daycare`;
  }

  /**
   * Initializes or returns the SignalR HubConnection instance
   */
  public getConnection(): signalR.HubConnection {
    if (!this.hubConnection) {
      const hubUrl = this.getHubUrl();

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => apiClient.getToken() || '',
          skipNegotiation: false,
          transport:
            signalR.HttpTransportType.WebSockets |
            signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Lifecycle event handlers
      this.hubConnection.onreconnecting((error) => {
        console.warn('[SignalR] Connection reconnecting...', error);
        this.setStatus('reconnecting');
      });

      this.hubConnection.onreconnected((connectionId) => {
        console.info('[SignalR] Connection re-established. Connection ID:', connectionId);
        this.setStatus('connected');
      });

      this.hubConnection.onclose((error) => {
        console.warn('[SignalR] Connection closed.', error);
        this.setStatus('disconnected');
      });

      // Register primary hub event listeners
      this.hubConnection.on('ReceiveMessage', (message: ChatMessageDto) => {
        this.receiveMessageListeners.forEach((listener) => {
          try {
            listener(message);
          } catch (e) {
            console.error('[SignalR] Error in ReceiveMessage listener:', e);
          }
        });
      });

      this.hubConnection.on(
        'ChildCheckedIn',
        (childId: string, childName: string, classroomId: string, time: string) => {
          const event: ChildCheckInOutEvent = { childId, childName, classroomId, time };
          this.childCheckedInListeners.forEach((listener) => {
            try {
              listener(event);
            } catch (e) {
              console.error('[SignalR] Error in ChildCheckedIn listener:', e);
            }
          });
        }
      );

      this.hubConnection.on(
        'ChildCheckedOut',
        (childId: string, childName: string, classroomId: string, time: string) => {
          const event: ChildCheckInOutEvent = { childId, childName, classroomId, time };
          this.childCheckedOutListeners.forEach((listener) => {
            try {
              listener(event);
            } catch (e) {
              console.error('[SignalR] Error in ChildCheckedOut listener:', e);
            }
          });
        }
      );
    }

    return this.hubConnection;
  }

  private setStatus(newStatus: SignalRConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((l) => l(newStatus));
    }
  }

  /**
   * Connects to the SignalR hub if not already connected
   */
  public async start(): Promise<void> {
    const connection = this.getConnection();

    if (
      connection.state === signalR.HubConnectionState.Connected ||
      connection.state === signalR.HubConnectionState.Connecting ||
      this.isStarting
    ) {
      return;
    }

    this.isStarting = true;
    this.setStatus('connecting');

    try {
      await connection.start();
      this.setStatus('connected');
      console.info('[SignalR] Successfully connected to /hubs/daycare');
    } catch (err) {
      this.setStatus('disconnected');
      console.warn('[SignalR] Failed to start connection to /hubs/daycare:', err);
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Disconnects from the SignalR hub
   */
  public async stop(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.stop();
      } catch (err) {
        console.warn('[SignalR] Error stopping connection:', err);
      } finally {
        this.setStatus('disconnected');
      }
    }
  }

  /**
   * Current connection status
   */
  public getStatus(): SignalRConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Subscribes to status changes (disconnected, connecting, connected, reconnecting)
   */
  public onStatusChange(listener: StatusChangeListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Subscribes to incoming real-time chat messages
   */
  public onReceiveMessage(listener: ReceiveMessageListener): () => void {
    this.receiveMessageListeners.add(listener);
    return () => {
      this.receiveMessageListeners.delete(listener);
    };
  }

  /**
   * Subscribes to ChildCheckedIn real-time events
   */
  public onChildCheckedIn(listener: ChildCheckInOutListener): () => void {
    this.childCheckedInListeners.add(listener);
    return () => {
      this.childCheckedInListeners.delete(listener);
    };
  }

  /**
   * Subscribes to ChildCheckedOut real-time events
   */
  public onChildCheckedOut(listener: ChildCheckInOutListener): () => void {
    this.childCheckedOutListeners.add(listener);
    return () => {
      this.childCheckedOutListeners.delete(listener);
    };
  }

  /**
   * Generic event subscription with auto-cleanup
   */
  public on(eventName: string, callback: (...args: unknown[]) => void): () => void {
    const connection = this.getConnection();

    if (!this.genericListeners.has(eventName)) {
      this.genericListeners.set(eventName, new Set());
      connection.on(eventName, (...args: unknown[]) => {
        const listeners = this.genericListeners.get(eventName);
        if (listeners) {
          listeners.forEach((fn) => {
            try {
              fn(...args);
            } catch (err) {
              console.error(`[SignalR] Error in handler for event "${eventName}":`, err);
            }
          });
        }
      });
    }

    const set = this.genericListeners.get(eventName)!;
    set.add(callback);

    return () => {
      set.delete(callback);
    };
  }

  /**
   * Invokes a Hub method on the server
   */
  public async invoke<T = void>(methodName: string, ...args: unknown[]): Promise<T> {
    const connection = this.getConnection();
    if (connection.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }
    return connection.invoke<T>(methodName, ...args);
  }

  /**
   * Sends a Hub message without waiting for a return value
   */
  public async send(methodName: string, ...args: unknown[]): Promise<void> {
    const connection = this.getConnection();
    if (connection.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }
    return connection.send(methodName, ...args);
  }
}

export const signalrService = new SignalRService();
