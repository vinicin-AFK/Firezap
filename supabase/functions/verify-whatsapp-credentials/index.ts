import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter user_id do header de autorização
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Authorization header required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== VERIFICAÇÃO DE CREDENCIAIS ===');
    console.log('User ID:', user.id);

    // Buscar APIs do usuário
    const { data: apis, error: apisError } = await supabase
      .from('whatsapp_apis')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (apisError) {
      console.error('Erro ao buscar APIs:', apisError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao buscar APIs',
        results: {
          apis_found: 0,
          error: apisError.message
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('APIs encontradas:', apis?.length || 0);

    const results = {
      user_id: user.id,
      apis_found: apis?.length || 0,
      apis: apis?.map(api => ({
        id: api.id,
        name: api.name,
        phone_number_id: api.phone_number_id,
        is_active: api.is_active,
        created_at: api.created_at
      })) || [],
      tests: {}
    };

    // Se não há APIs configuradas
    if (!apis || apis.length === 0) {
      console.log('❌ Nenhuma API configurada');
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhuma API do WhatsApp configurada',
        results,
        recommendations: [
          'Adicione uma API do WhatsApp Business',
          'Configure as credenciais no painel de administração',
          'Use a função manage-whatsapp-apis para adicionar APIs'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ APIs encontradas, iniciando testes...');

    // Testar cada API
    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];
      console.log(`--- TESTE ${i + 1}: API "${api.name}" ---`);

      // Teste 1: Verificar informações do número
      try {
        const phoneInfoResponse = await fetch(`https://graph.facebook.com/v19.0/${api.phone_number_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api.api_key}`,
          },
        });

        const phoneInfoData = await phoneInfoResponse.json();
        console.log(`API ${api.name} - Phone info status:`, phoneInfoResponse.status);

        results.tests[`api_${i + 1}`] = {
          api_name: api.name,
          api_id: api.id,
          phone_info: {
            success: phoneInfoResponse.ok,
            status: phoneInfoResponse.status,
            data: phoneInfoData
          }
        };
      } catch (error) {
        console.error(`Erro no teste da API ${api.name}:`, error);
        results.tests[`api_${i + 1}`] = {
          api_name: api.name,
          api_id: api.id,
          phone_info: {
            success: false,
            error: error.message
          }
        };
      }

      // Teste 2: Verificar se consegue acessar a API de mensagens
      try {
        const messagesTestResponse = await fetch(`https://graph.facebook.com/v19.0/${api.phone_number_id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${api.api_key}`,
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
        console.log(`API ${api.name} - Messages test status:`, messagesTestResponse.status);

        results.tests[`api_${i + 1}`].messages_api = {
          success: messagesTestResponse.status !== 401 && messagesTestResponse.status !== 403,
          status: messagesTestResponse.status,
          data: messagesTestData,
          note: 'Status 400 é esperado (número inválido), 401/403 indica problema de credenciais'
        };
      } catch (error) {
        console.error(`Erro no teste de mensagens da API ${api.name}:`, error);
        results.tests[`api_${i + 1}`].messages_api = {
          success: false,
          error: error.message
        };
      }
    }

    // Determinar se os testes foram bem-sucedidos
    const allTestsPassed = Object.values(results.tests).every(test => 
      test.phone_info?.success && test.messages_api?.success
    );
    
    console.log('=== RESULTADO FINAL ===');
    console.log('Todos os testes passaram:', allTestsPassed);

    return new Response(JSON.stringify({
      success: allTestsPassed,
      message: allTestsPassed ? 'Todas as APIs estão funcionando corretamente' : 'Alguns testes falharam',
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
        error: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});