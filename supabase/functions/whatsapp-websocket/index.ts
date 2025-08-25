import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  console.log('🔗 Nova conexão WebSocket WhatsApp estabelecida');

  socket.onopen = () => {
    console.log('✅ WebSocket conectado - enviando status inicial');
    
    // Enviar status inicial
    socket.send(JSON.stringify({
      type: 'status',
      message: 'Conectado ao servidor WhatsApp',
      status: 'connecting',
      timestamp: new Date().toISOString()
    }));

    // Gerar QR Code válido após 1 segundo
    setTimeout(() => {
      console.log('📷 Gerando QR Code válido');
      
      // Gerar um QR Code mais realista para demonstração
      const sessionId = `session_${Date.now()}`;
      const qrData = `2@${sessionId},${Math.random().toString(36).substring(7)},${Date.now()}`;
      
      // Usar uma URL mais confiável para QR Code
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&margin=10&ecc=M`;
      
      socket.send(JSON.stringify({
        type: 'qr',
        qr: qrCodeUrl,
        qrCode: qrCodeUrl,
        sessionId: sessionId,
        status: 'qr_ready',
        timestamp: new Date().toISOString()
      }));
    }, 1000);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Mensagem recebida:', data);

      switch (data.type) {
        case 'ping':
          socket.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;

        case 'connect':
          console.log('🔄 Solicitação de conexão recebida para:', data.phoneNumber);
          socket.send(JSON.stringify({
            type: 'status',
            message: 'Iniciando conexão WhatsApp...',
            status: 'connecting',
            timestamp: new Date().toISOString()
          }));
          break;

        case 'scan':
          // Simular que o QR foi escaneado
          console.log('📱 QR Code escaneado - simulando autenticação');
          socket.send(JSON.stringify({
            type: 'status',
            message: 'QR Code escaneado, autenticando...',
            status: 'connecting',
            timestamp: new Date().toISOString()
          }));
          
          // Simular autenticação bem-sucedida após 3 segundos
          setTimeout(() => {
            socket.send(JSON.stringify({
              type: 'ready',
              sessionId: `session_${Date.now()}`,
              message: 'WhatsApp conectado com sucesso!',
              status: 'connected',
              timestamp: new Date().toISOString()
            }));
          }, 3000);
          break;

        default:
          console.log('❓ Tipo de mensagem desconhecido:', data.type);
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Tipo de mensagem não reconhecido',
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Erro ao processar mensagem',
        timestamp: new Date().toISOString()
      }));
    }
  };

  socket.onclose = () => {
    console.log('❌ WebSocket desconectado');
  };

  socket.onerror = (error) => {
    console.error('🚨 Erro no WebSocket:', error);
  };

  return response;
});