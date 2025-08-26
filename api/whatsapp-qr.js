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
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ 
        error: 'phone_number is required',
        success: false 
      });
    }
    
    console.log('=== GERANDO QR CODE ===');
    console.log('Phone number:', phone_number);

    // Buscar APIs ativas
    const { data: apis, error: apisError } = await supabase
      .from('whatsapp_apis')
      .select('*')
      .eq('is_active', true);

    if (apisError) {
      console.error('Erro ao buscar APIs:', apisError);
      return res.status(500).json({ 
        error: 'Erro ao buscar APIs no banco',
        success: false 
      });
    }

    console.log('APIs encontradas no banco:', apis?.length || 0);
    
    // Se não há APIs configuradas, usar fallback
    if (!apis || apis.length === 0) {
      console.warn('❌ Nenhuma API configurada, usando fallback QR');
      
      const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `firezap://connect/${phone_number}/${Date.now()}`
      )}`;
      
      return res.status(200).json({
        success: true,
        qr_code_url: fallbackQR,
        qr_code: fallbackQR,
        prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
        note: 'Using fallback QR - no WhatsApp APIs configured',
        api_used: 'fallback'
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
        
        return res.status(200).json({
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
      
      return res.status(200).json({
        success: true,
        qr_code_url: fallbackQR,
        qr_code: fallbackQR,
        prefilled_message: `Conectando número ${phone_number} ao Fire Zap`,
        note: 'Using fallback QR due to API error',
        api_used: 'fallback',
        error: apiError instanceof Error ? apiError.message : 'Erro desconhecido'
      });
    }

  } catch (error) {
    console.error('❌ Erro geral na geração de QR:', error);
    
    const fallbackQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `firezap://connect/error/${Date.now()}`
    )}`;
    
    return res.status(200).json({
      success: true,
      qr_code_url: fallbackQR,
      qr_code: fallbackQR,
      prefilled_message: 'Erro na conexão - tente novamente',
      note: 'Using fallback QR due to general error',
      api_used: 'fallback',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
