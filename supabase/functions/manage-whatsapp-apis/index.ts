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
    const { action, chip_id, api_key, phone_number_id } = await req.json();

    switch (action) {
      case 'list':
        return await listAPIs();
      case 'add':
        return await addAPI(chip_id, api_key, phone_number_id);
      case 'remove':
        return await removeAPI(chip_id);
      case 'test':
        return await testAPI(chip_id, api_key, phone_number_id);
      default:
        return new Response(JSON.stringify({ 
          error: 'Ação não reconhecida. Use: list, add, remove, test' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Erro no manage-whatsapp-apis:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listAPIs() {
  const apis = [];
  
  // API Principal
  const primaryKey = Deno.env.get('WHATSAPP_API_KEY');
  const primaryPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
  if (primaryKey && primaryPhoneId) {
    apis.push({
      id: 'primary',
      name: 'API Principal',
      api_key: primaryKey.substring(0, 10) + '...',
      phone_number_id: primaryPhoneId,
      status: 'configured'
    });
  }

  // APIs Secundárias (procurar por padrão WHATSAPP_API_KEY_*)
  for (let i = 1; i <= 10; i++) {
    const key = Deno.env.get(`WHATSAPP_API_KEY_${i}`);
    const phoneId = Deno.env.get(`WHATSAPP_PHONE_NUMBER_ID_${i}`);
    
    if (key && phoneId) {
      apis.push({
        id: `chip_${i}`,
        name: `API Chip ${i}`,
        api_key: key.substring(0, 10) + '...',
        phone_number_id: phoneId,
        status: 'configured'
      });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    apis,
    total: apis.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addAPI(chip_id: string, api_key: string, phone_number_id: string) {
  if (!chip_id || !api_key || !phone_number_id) {
    return new Response(JSON.stringify({ 
      error: 'chip_id, api_key e phone_number_id são obrigatórios' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Testar a API antes de "adicionar"
  const testResult = await testAPIInternal(api_key, phone_number_id);
  
  if (!testResult.success) {
    return new Response(JSON.stringify({ 
      error: 'API inválida: ' + testResult.error 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Nota: Em produção, você precisaria salvar essas credenciais no banco de dados
  // Por enquanto, retornamos sucesso mas as credenciais precisam ser adicionadas manualmente no Supabase
  
  return new Response(JSON.stringify({
    success: true,
    message: `API para chip ${chip_id} testada com sucesso. Adicione as credenciais no Supabase:`,
    instructions: [
      `WHATSAPP_API_KEY_${chip_id}=${api_key}`,
      `WHATSAPP_PHONE_NUMBER_ID_${chip_id}=${phone_number_id}`
    ],
    note: 'As credenciais precisam ser adicionadas manualmente no painel do Supabase'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function removeAPI(chip_id: string) {
  if (!chip_id) {
    return new Response(JSON.stringify({ 
      error: 'chip_id é obrigatório' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: `Para remover a API do chip ${chip_id}, remova as seguintes variáveis do Supabase:`,
    instructions: [
      `WHATSAPP_API_KEY_${chip_id}`,
      `WHATSAPP_PHONE_NUMBER_ID_${chip_id}`
    ],
    note: 'As credenciais precisam ser removidas manualmente no painel do Supabase'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function testAPI(chip_id: string, api_key?: string, phone_number_id?: string) {
  if (!chip_id) {
    return new Response(JSON.stringify({ 
      error: 'chip_id é obrigatório' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let testApiKey = api_key;
  let testPhoneId = phone_number_id;

  // Se não foram fornecidas, tentar pegar das variáveis de ambiente
  if (!testApiKey || !testPhoneId) {
    testApiKey = Deno.env.get(`WHATSAPP_API_KEY_${chip_id}`) || Deno.env.get('WHATSAPP_API_KEY');
    testPhoneId = Deno.env.get(`WHATSAPP_PHONE_NUMBER_ID_${chip_id}`) || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  }

  if (!testApiKey || !testPhoneId) {
    return new Response(JSON.stringify({ 
      error: 'API não configurada para este chip' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const testResult = await testAPIInternal(testApiKey, testPhoneId);
  
  return new Response(JSON.stringify({
    success: testResult.success,
    message: testResult.success ? 'API funcionando corretamente' : 'Erro na API',
    error: testResult.error,
    api_used: chip_id === 'primary' ? 'primary' : `chip_${chip_id}`
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function testAPIInternal(apiKey: string, phoneNumberId: string) {
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
