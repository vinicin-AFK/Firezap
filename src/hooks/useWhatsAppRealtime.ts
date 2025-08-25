import { useState, useEffect, useCallback, useRef } from 'react';

interface WhatsAppRealtimeState {
  qrCode: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr_ready' | 'error';
  isConnected: boolean;
  sessionId: string | null;
  error: string | null;
}

export const useWhatsAppRealtime = () => {
  const [state, setState] = useState<WhatsAppRealtimeState>({
    qrCode: null,
    connectionStatus: 'disconnected',
    isConnected: false,
    sessionId: null,
    error: null,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const connectSocketIO = useCallback((sessionId?: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('🔗 WebSocket já está conectado');
      return;
    }

    // Limpar estado anterior
    setState(prev => ({ 
      ...prev, 
      connectionStatus: 'connecting',
      error: null,
      qrCode: null 
    }));

    console.log('🔄 Conectando ao WebSocket do WhatsApp...');

    try {
      const socketUrl = "wss://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/whatsapp-websocket";
      const socket = new WebSocket(socketUrl);

      socketRef.current = socket;

      socket.onopen = () => {
        console.log('✅ Conectado ao servidor WebSocket!');
        setState(prev => ({
          ...prev,
          connectionStatus: 'connecting',
          error: null,
        }));
        reconnectAttempts.current = 0;
      };

      socket.onclose = (event) => {
        console.warn('⚠️ Desconectado do servidor WebSocket:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
          isConnected: false,
          qrCode: null,
        }));
        
        // Só tentar reconectar se não foi um fechamento intencional
        if (event.code !== 1000) {
          attemptReconnect();
        }
      };

      socket.onerror = (error: any) => {
        console.error('❌ Erro de conexão com WebSocket:', error);
        setState(prev => ({
          ...prev,
          connectionStatus: 'error',
          error: 'Erro de conexão com o WebSocket',
        }));
        attemptReconnect();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Mensagem recebida:', data);

          switch (data.type) {
            case 'qr':
              console.log('📷 QR Code recebido');
              setState(prev => ({
                ...prev,
                qrCode: data.qrCode || data.qr,
                connectionStatus: 'qr_ready',
                error: null,
              }));
              break;

            case 'ready':
              console.log('🤖 Sessão WhatsApp pronta');
              setState(prev => ({
                ...prev,
                connectionStatus: 'connected',
                isConnected: true,
                sessionId: data.sessionId,
                qrCode: null,
                error: null,
              }));
              break;

            case 'status':
              console.log('📊 Status recebido:', data.message);
              setState(prev => ({
                ...prev,
                connectionStatus: data.status || 'connecting',
                error: null,
              }));
              break;

            case 'error':
              console.error('🚨 Erro do servidor:', data.message);
              setState(prev => ({
                ...prev,
                connectionStatus: 'error',
                error: data.message,
              }));
              break;

            default:
              console.log('❓ Tipo de mensagem desconhecido:', data.type);
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem:', error);
          setState(prev => ({
            ...prev,
            connectionStatus: 'error',
            error: 'Erro ao processar resposta do servidor',
          }));
        }
      };

    } catch (error: any) {
      console.error('Erro inesperado ao conectar:', error);
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: error.message || 'Erro inesperado',
      }));
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('🚫 Número máximo de tentativas de reconexão atingido.');
      setState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: 'Falha na conexão após múltiplas tentativas',
      }));
      return;
    }

    reconnectAttempts.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000); // Exponential backoff

    console.log(`🔁 Tentando reconectar em ${delay / 1000} segundos... (${reconnectAttempts.current}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connectSocketIO();
    }, delay);
  }, [connectSocketIO]);

  useEffect(() => {
    // Conectar automaticamente quando o hook é montado
    connectSocketIO();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [connectSocketIO]);

  const disconnect = useCallback(() => {
    console.log('🔌 Desconectando WebSocket...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected');
      socketRef.current = null;
    }

    setState({
      qrCode: null,
      connectionStatus: 'disconnected',
      isConnected: false,
      sessionId: null,
      error: null,
    });
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconectando...');
    disconnect();
    
    // Reset reconnect attempts
    reconnectAttempts.current = 0;
    
    // Conectar novamente após um pequeno delay
    setTimeout(() => {
      connectSocketIO();
    }, 500);
  }, [disconnect, connectSocketIO]);

  return {
    ...state,
    connectToWhatsApp: connectSocketIO,
    disconnect,
    reconnect,
  };
};