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
    // Obter todas as variáveis de ambiente
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    console.log('=== VERIFICAÇÃO DE CREDENCIAIS ===');
    console.log('API Key existe:', !!WHATSAPP_API_KEY);
    console.log('Phone Number ID existe:', !!WHATSAPP_PHONE_NUMBER_ID);
    console.log('API Key primeiros chars:', WHATSAPP_API_KEY?.substring(0, 10) + '...');
    console.log('Phone Number ID:', WHATSAPP_PHONE_NUMBER_ID);
    console.log('Todas as variáveis de ambiente:', Object.keys(Deno.env.toObject()).filter(key => key.includes('WHATSAPP')));

    const results = {
      credentials_exist: {
        api_key: !!WHATSAPP_API_KEY,
        phone_number_id: !!WHATSAPP_PHONE_NUMBER_ID
      },
      api_key_preview: WHATSAPP_API_KEY ? WHATSAPP_API_KEY.substring(0, 10) + '...' : null,
      phone_number_id: WHATSAPP_PHONE_NUMBER_ID,
      all_whatsapp_env_vars: Object.keys(Deno.env.toObject()).filter(key => key.includes('WHATSAPP')),
      tests: {}
    };

    // Se não temos credenciais, retornar erro mas com mais informações
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
      console.error('❌ Credenciais não configuradas:');
      console.error('- WHATSAPP_API_KEY:', !!WHATSAPP_API_KEY);
      console.error('- WHATSAPP_PHONE_NUMBER_ID:', !!WHATSAPP_PHONE_NUMBER_ID);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciais não configuradas',
        results,
        debug_info: {
          api_key_exists: !!WHATSAPP_API_KEY,
          phone_number_id_exists: !!WHATSAPP_PHONE_NUMBER_ID,
          all_env_vars: Object.keys(Deno.env.toObject()).filter(key => key.includes('WHATSAPP'))
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Credenciais encontradas, iniciando testes...');

    // Teste 1: Verificar informações do número
    console.log('--- TESTE 1: Verificando informações do número ---');
    try {
      const phoneInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        },
      });

      const phoneInfoData = await phoneInfoResponse.json();
      console.log('Phone info response status:', phoneInfoResponse.status);
      console.log('Phone info data:', phoneInfoData);

      results.tests.phone_info = {
        success: phoneInfoResponse.ok,
        status: phoneInfoResponse.status,
        data: phoneInfoData
      };
    } catch (error) {
      console.error('Erro no teste phone info:', error);
      results.tests.phone_info = {
        success: false,
        error: error.message
      };
    }

    // Teste 2: Verificar se consegue acessar a API de mensagens
    console.log('--- TESTE 2: Testando acesso à API de mensagens ---');
    try {
      const messagesTestResponse = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: "5511999999999", // número fake para teste
          type: "text",
          text: {
            body: "teste"
          }
        }),
      });

      const messagesTestData = await messagesTestResponse.json();
      console.log('Messages test response status:', messagesTestResponse.status);
      console.log('Messages test data:', messagesTestData);

      results.tests.messages_api = {
        success: messagesTestResponse.status !== 401 && messagesTestResponse.status !== 403,
        status: messagesTestResponse.status,
        data: messagesTestData,
        note: 'Status 400 é esperado (número inválido), 401/403 indica problema de credenciais'
      };
    } catch (error) {
      console.error('Erro no teste messages API:', error);
      results.tests.messages_api = {
        success: false,
        error: error.message
      };
    }

    // Teste 3: Verificar limites e quota
    console.log('--- TESTE 3: Verificando limites da conta ---');
    try {
      const quotaResponse = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}?fields=messaging_limit_tier,account_mode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        },
      });

      const quotaData = await quotaResponse.json();
      console.log('Quota response status:', quotaResponse.status);
      console.log('Quota data:', quotaData);

      results.tests.quota_info = {
        success: quotaResponse.ok,
        status: quotaResponse.status,
        data: quotaData
      };
    } catch (error) {
      console.error('Erro no teste quota:', error);
      results.tests.quota_info = {
        success: false,
        error: error.message
      };
    }

    // Determinar se os testes foram bem-sucedidos
    const allTestsPassed = Object.values(results.tests).every(test => test.success);
    
    console.log('=== RESULTADO FINAL ===');
    console.log('Todos os testes passaram:', allTestsPassed);

    return new Response(JSON.stringify({
      success: allTestsPassed,
      message: allTestsPassed ? 'Credenciais funcionando corretamente' : 'Alguns testes falharam',
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro geral na verificação:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      results: {
        credentials_exist: {
          api_key: !!Deno.env.get('WHATSAPP_API_KEY'),
          phone_number_id: !!Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
        },
        error: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});