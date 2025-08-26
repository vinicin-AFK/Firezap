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
    const { action, api_id, name, api_key, phone_number_id, verify_token } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ 
        error: 'action é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    switch (action) {
      case 'list':
        return await listAPIs(supabase, user.id);
      case 'add':
        return await addAPI(supabase, user.id, { name, api_key, phone_number_id, verify_token });
      case 'update':
        return await updateAPI(supabase, user.id, api_id, { name, api_key, phone_number_id, verify_token });
      case 'delete':
        return await deleteAPI(supabase, user.id, api_id);
      case 'test':
        return await testAPI(supabase, user.id, api_id);
      default:
        return new Response(JSON.stringify({ 
          error: 'Ação inválida' 
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

async function listAPIs(supabase: any, userId: string) {
  const { data: apis, error } = await supabase
    .from('whatsapp_apis')
    .select('id, name, phone_number_id, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Erro ao listar APIs: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    apis: apis || [],
    total: apis?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addAPI(supabase: any, userId: string, apiData: any) {
  const { name, api_key, phone_number_id, verify_token } = apiData;

  if (!name || !api_key || !phone_number_id) {
    return new Response(JSON.stringify({ 
      error: 'name, api_key e phone_number_id são obrigatórios' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: api, error } = await supabase
    .from('whatsapp_apis')
    .insert({
      user_id: userId,
      name,
      api_key,
      phone_number_id,
      verify_token: verify_token || 'fire_zap_webhook_token',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao adicionar API: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'API adicionada com sucesso',
    api: {
      id: api.id,
      name: api.name,
      phone_number_id: api.phone_number_id,
      is_active: api.is_active
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateAPI(supabase: any, userId: string, apiId: string, apiData: any) {
  if (!apiId) {
    return new Response(JSON.stringify({ 
      error: 'api_id é obrigatório' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const updateData: any = {};
  if (apiData.name) updateData.name = apiData.name;
  if (apiData.api_key) updateData.api_key = apiData.api_key;
  if (apiData.phone_number_id) updateData.phone_number_id = apiData.phone_number_id;
  if (apiData.verify_token) updateData.verify_token = apiData.verify_token;

  const { data: api, error } = await supabase
    .from('whatsapp_apis')
    .update(updateData)
    .eq('id', apiId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar API: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'API atualizada com sucesso',
    api: {
      id: api.id,
      name: api.name,
      phone_number_id: api.phone_number_id,
      is_active: api.is_active
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deleteAPI(supabase: any, userId: string, apiId: string) {
  if (!apiId) {
    return new Response(JSON.stringify({ 
      error: 'api_id é obrigatório' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase
    .from('whatsapp_apis')
    .delete()
    .eq('id', apiId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Erro ao deletar API: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'API deletada com sucesso'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function testAPI(supabase: any, userId: string, apiId: string) {
  if (!apiId) {
    return new Response(JSON.stringify({ 
      error: 'api_id é obrigatório' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Buscar a API
  const { data: api, error: fetchError } = await supabase
    .from('whatsapp_apis')
    .select('api_key, phone_number_id')
    .eq('id', apiId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !api) {
    return new Response(JSON.stringify({ 
      error: 'API não encontrada' 
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Testar a API
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${api.phone_number_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api.api_key}`,
      },
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: response.ok,
      message: response.ok ? 'API funcionando corretamente' : 'Erro na API',
      status: response.status,
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro ao testar API',
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
