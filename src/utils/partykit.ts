import { useEffect, useRef, useCallback } from 'react';
import type { ServerMessage, ClientMessage } from '../types/network';

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999';

export function getPartyKitUrl(roomCode: string): string {
  const isLocal = PARTYKIT_HOST.startsWith('localhost');
  const protocol = isLocal ? 'ws' : 'wss';
  return `${protocol}://${PARTYKIT_HOST}/party/${roomCode.toLowerCase()}`;
}

interface UsePartyKitOptions {
  roomCode: string | null;
  onMessage: (msg: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
}

export function usePartyKit({ roomCode, onMessage, onOpen, onClose, onError }: UsePartyKitOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    const url = getPartyKitUrl(roomCode);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => onOpen?.();
    ws.onclose = () => onClose?.();
    ws.onerror = (e) => onError?.(e);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerMessage;
        onMessageRef.current(msg);
      } catch {
        // ignore malformed
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  return { send, disconnect };
}
