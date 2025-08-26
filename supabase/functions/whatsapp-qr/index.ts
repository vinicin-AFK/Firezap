import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number } = await req.json();
    
    if (!phone_number) {
      return new Response(JSON.stringify({ 
        error: 'phone_number is required',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('=== GERANDO QR CODE ===');
    console.log('Phone number:', phone_number);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar APIs ativas
    const { data: apis, error: apisError } = await supabase
      .from('whatsapp_apis')
      .select('*')
      .eq('is_active', true);

    if (apisError) {
      console.error('Erro ao buscar APIs:', apisError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao buscar APIs no banco',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('APIs encontradas no banco:', apis?.length || 0);
    
    // Se não há APIs configuradas, usar fallback
    if (!apis || apis.length === 0) {
      console.warn('❌ Nenhuma API configurada, usando fallback QR');
      
      const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `firezap://connect/${phone_number}/${Date.now()}`
      )}`;
      
      return new Response(JSON.stringify({
        success: true,
        qr_code_url: fallbackQR,
        qr_code: fallbackQR,
        prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
        note: 'Using fallback QR - no WhatsApp APIs configured',
        api_used: 'fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Usar a primeira API ativa
    const api = apis[0];
    console.log(`✅ Usando API: ${api.name} (${api.phone_number_id})`);

    // Testar a API
    try {
      const phoneInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${api.phone_number_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api.api_key}`,
        },
      });

      if (phoneInfoResponse.ok) {
        console.log('✅ API funcionando, gerando QR WhatsApp Web');
        
        // Gerar QR code que simula conexão WhatsApp Web
        const whatsappWebQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          `https://wa.me/${phone_number.replace(/\D/g, '')}?text=${encodeURIComponent('Conectando ao Fire Zap')}`
        )}`;
        
        return new Response(JSON.stringify({
          success: true,
          qr_code_url: whatsappWebQR,
          qr_code: whatsappWebQR,
          prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
          note: 'Using WhatsApp Web QR - API credentials are working',
          api_used: 'whatsapp_web',
          api_info: {
            id: api.id,
            name: api.name,
            phone_number_id: api.phone_number_id
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        throw new Error(`API error: ${phoneInfoResponse.status}`);
      }
      
    } catch (apiError) {
      console.error('❌ Erro na API do WhatsApp:', apiError);
      
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
        error: apiError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Erro geral na geração de QR:', error);
    
    const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `firezap://connect/error/${Date.now()}`
    )}`;
    
    return new Response(JSON.stringify({
      success: true,
      qr_code_url: fallbackQR,
      qr_code: fallbackQR,
      prefilled_message: 'Erro na conexão - tente novamente',
      note: 'Using fallback QR due to general error',
      api_used: 'fallback',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});