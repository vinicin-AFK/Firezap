import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number, chip_id } = await req.json();
    
    if (!phone_number) {
      return new Response(JSON.stringify({ 
        error: 'phone_number is required',
        success: false 
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
      console.warn('WhatsApp API credentials not configured, using fallback QR');
      
      // Fallback: gerar QR code simulado
      const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `firezap://connect/${phone_number}/${Date.now()}`
      )}`;
      
      return new Response(JSON.stringify({
        success: true,
        qr_code_url: fallbackQR,
        qr_code: fallbackQR,
        prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
        note: 'Using fallback QR - configure WhatsApp API credentials for production',
        api_used: 'fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating QR code for phone number: ${phone_number} using API: ${WHATSAPP_PHONE_NUMBER_ID}`);

    // Gerar QR code através da API do WhatsApp Business v19.0
    const qrResponse = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/qr_codes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
        generate_qr_image: "PNG"
      }),
    });

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text();
      console.error('WhatsApp API error:', errorText);
      
      // Fallback em caso de erro da API
      const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `firezap://connect/${phone_number}/${Date.now()}`
      )}`;
      
      return new Response(JSON.stringify({
        success: true,
        qr_code_url: fallbackQR,
        qr_code: fallbackQR,
        prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
        note: 'Using fallback QR due to API error',
        api_used: 'fallback',
        error: errorText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const qrData = await qrResponse.json();
    console.log('QR code generated successfully:', qrData);

    return new Response(JSON.stringify({
      success: true,
      qr_code_url: qrData.qr_image_url,
      qr_code: qrData.code,
      prefilled_message: qrData.prefilled_message,
      api_used: chip_id ? `chip_${chip_id}` : 'primary'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-qr function:', error);
    
    // Fallback em caso de erro geral
    const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `firezap://connect/fallback/${Date.now()}`
    )}`;
    
    return new Response(JSON.stringify({ 
      success: true,
      qr_code_url: fallbackQR,
      qr_code: fallbackQR,
      prefilled_message: 'Conectando ao Fire Zap',
      note: 'Using fallback QR due to error',
      api_used: 'fallback',
      error: error.message
    }), {
      status: 200, // Status 200 para não quebrar o fluxo
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});