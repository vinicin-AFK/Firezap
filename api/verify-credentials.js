import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== VERIFICAÇÃO DE CREDENCIAIS ===');

    // Buscar todas as APIs ativas
    const { data: apis, error: apisError } = await supabase
      .from('whatsapp_apis')
      .select('*')
      .eq('is_active', true);

    if (apisError) {
      console.error('Erro ao buscar APIs:', apisError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar APIs no banco',
        details: apisError.message
      });
    }

    console.log('APIs encontradas no banco:', apis?.length || 0);

    // Se não há APIs configuradas
    if (!apis || apis.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'Nenhuma API do WhatsApp configurada no banco',
        apis_found: 0
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

    return res.status(200).json({
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
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
