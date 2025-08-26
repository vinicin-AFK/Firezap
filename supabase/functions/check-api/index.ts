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
    console.log('=== CHECK API ===');

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as APIs ativas
    const { data: apis, error: apisError } = await supabase
      .from('whatsapp_apis')
      .select('*')
      .eq('is_active', true);

    if (apisError) {
      console.error('Erro ao buscar APIs:', apisError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar APIs no banco',
        details: apisError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('APIs encontradas no banco:', apis?.length || 0);

    // Se não há APIs configuradas
    if (!apis || apis.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhuma API do WhatsApp configurada no banco',
        apis_found: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Testar a primeira API encontrada
    const api = apis[0];
    console.log('Testando API:', api.name);

    // Teste da API
    const phoneInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${api.phone_number_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api.api_key}`,
      },
    });

    const phoneInfoData = await phoneInfoResponse.json();
    console.log('Status da API:', phoneInfoResponse.status);

    const success = phoneInfoResponse.ok;

    return new Response(JSON.stringify({
      success,
      message: success ? 'API funcionando corretamente' : 'Erro na API',
      api_info: {
        id: api.id,
        name: api.name,
        phone_number_id: api.phone_number_id,
        status: phoneInfoResponse.status,
        data: phoneInfoData
      },
      apis_found: apis.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
