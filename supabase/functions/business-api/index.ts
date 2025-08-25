import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { number, message, type = 'text', chip_id } = await req.json();

    if (!number || !message) {
      return new Response(JSON.stringify({ 
        error: 'Número e mensagem são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sistema de múltiplas APIs
    let WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    let WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    // Se um chip_id específico foi fornecido, tenta usar API específica
    if (chip_id) {
      const chipSpecificKey = Deno.env.get(`WHATSAPP_API_KEY_${chip_id}`);
      const chipSpecificPhoneId = Deno.env.get(`WHATSAPP_PHONE_NUMBER_ID_${chip_id}`);
      
      if (chipSpecificKey && chipSpecificPhoneId) {
        WHATSAPP_API_KEY = chipSpecificKey;
        WHATSAPP_PHONE_NUMBER_ID = chipSpecificPhoneId;
        console.log(`Usando API específica para chip ${chip_id}`);
      } else {
        console.log(`API específica não encontrada para chip ${chip_id}, usando API principal`);
      }
    }
    
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WhatsApp Business API credentials not configured');
    }

    console.log(`📤 Enviando mensagem business para ${number} via API ${WHATSAPP_PHONE_NUMBER_ID}: ${message}`);

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: number,
          type: type,
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WhatsApp Business API error:', errorText);
      throw new Error(`WhatsApp Business API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Mensagem business enviada:', result);

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messages?.[0]?.id,
      whatsappId: result.messages?.[0]?.id,
      to: number,
      message,
      type: 'business',
      api_used: chip_id ? `chip_${chip_id}` : 'primary',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no business-api:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});