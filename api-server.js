const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'https://firezap-nine.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API Server running'
  });
});

// Rota para verificar credenciais
app.post('/api/verify-credentials', async (req, res) => {
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
});

// Rota para gerar QR code
app.post('/api/whatsapp-qr', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log(`🚀 API Server rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Verify credentials: http://localhost:${PORT}/api/verify-credentials`);
  console.log(`📱 WhatsApp QR: http://localhost:${PORT}/api/whatsapp-qr`);
  console.log(`🌐 CORS habilitado para: localhost:8080 e firezap-nine.vercel.app`);
});
