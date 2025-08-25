# 📋 Documentação dos Endpoints - Fire Zap

## 🔗 **Endpoints Disponíveis**

### **1. WhatsApp WebSocket** (`whatsapp-websocket`)
**URL**: `wss://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/whatsapp-websocket`

**Função**: Conexão WebSocket principal para WhatsApp
**Status**: ✅ **ATIVO** (melhorado recentemente)

**Funcionalidades**:
- Gera QR Code válido para conexão
- Simula escaneamento do QR
- Gerencia estados de conexão
- Suporte a reconexão automática

**Mensagens**:
- `qr`: Envia QR Code para conexão
- `ready`: Confirma conexão estabelecida
- `status`: Atualizações de status
- `scan`: Simula escaneamento do QR

---

### **2. WhatsApp QR** (`whatsapp-qr`)
**URL**: `https://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/whatsapp-qr`

**Função**: Gera QR Codes para conexão WhatsApp
**Status**: ✅ **ATIVO** (com fallbacks)

**Parâmetros**:
```json
{
  "phone_number": "5511999999999"
}
```

**Resposta**:
```json
{
  "success": true,
  "qr_code_url": "https://...",
  "qr_code": "data...",
  "prefilled_message": "Conectando número..."
}
```

**Fallbacks**:
- Se credenciais não configuradas → QR simulado
- Se API falhar → QR simulado
- Sempre retorna status 200

---

### **3. WhatsApp Bot** (`whatsapp-bot`)
**URL**: `https://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/whatsapp-bot`

**Função**: Gera respostas de IA e envia mensagens
**Status**: ✅ **ATIVO** (modelo atualizado)

**Parâmetros**:
```json
{
  "message": "Olá, como você está?",
  "chipName": "Chip Principal",
  "isInitiatedByBot": false,
  "phoneNumber": "5511999999999",
  "sendMessage": true
}
```

**Resposta**:
```json
{
  "response": "Oi! Tudo bem, e você? 😊",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sent_via_whatsapp": true
}
```

**Melhorias**:
- Modelo OpenAI atualizado para `gpt-4o-mini`
- API WhatsApp v19.0
- Fallback response em caso de erro

---

### **4. Business API** (`business-api`)
**URL**: `https://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/business-api`

**Função**: Envia mensagens via WhatsApp Business API
**Status**: ✅ **ATIVO** (versão atualizada)

**Parâmetros**:
```json
{
  "number": "5511999999999",
  "message": "Mensagem de teste",
  "type": "text"
}
```

**Resposta**:
```json
{
  "success": true,
  "messageId": "wamid.xxx",
  "to": "5511999999999",
  "message": "Mensagem de teste",
  "type": "business"
}
```

---

### **5. WhatsApp Webhook** (`whatsapp-webhook`)
**URL**: `https://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/whatsapp-webhook`

**Função**: Recebe mensagens e status do WhatsApp
**Status**: ✅ **ATIVO**

**Funcionalidades**:
- Verificação de webhook (GET)
- Processamento de mensagens recebidas (POST)
- Integração com bot automático
- Atualização de status de mensagens

---

### **6. Verify Credentials** (`verify-whatsapp-credentials`)
**URL**: `https://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/verify-whatsapp-credentials`

**Função**: Verifica credenciais do WhatsApp Business API
**Status**: ✅ **ATIVO**

**Testes Realizados**:
- Verificação de informações do número
- Teste de acesso à API de mensagens
- Verificação de limites da conta

---

### **7. Baileys Session** (`baileys-session`)
**URL**: `https://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/baileys-session`

**Função**: Gerencia sessões pessoais (simulação)
**Status**: ✅ **ATIVO** (simulação)

**Ações**:
- `create`: Cria nova sessão
- `connect`: Conecta sessão
- `send`: Envia mensagem
- `status`: Obtém status da sessão

---

### **8. Hybrid WebSocket** (`hybrid-websocket`)
**URL**: `wss://fuohmclakezkvgaiarao.functions.supabase.co/functions/v1/hybrid-websocket`

**Função**: WebSocket para funcionalidades híbridas
**Status**: ✅ **ATIVO**

---

## ⚠️ **Endpoints Descontinuados**

### **WhatsApp Realtime** (`whatsapp-realtime`)
**Status**: ❌ **DESCONTINUADO**
**Motivo**: Substituído por `whatsapp-websocket`

### **WhatsApp SocketIO** (`whatsapp-socketio`)
**Status**: ❌ **DESCONTINUADO**
**Motivo**: Substituído por `whatsapp-websocket`

---

## 🔧 **Configurações Necessárias**

### **Variáveis de Ambiente**:
```bash
# WhatsApp Business API
WHATSAPP_API_KEY=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=fire_zap_webhook_token

# OpenAI
OPENAI_API_KEY=your_openai_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📊 **Status dos Endpoints**

| Endpoint | Status | Versão API | Fallback |
|----------|--------|------------|----------|
| whatsapp-websocket | ✅ Ativo | - | ✅ |
| whatsapp-qr | ✅ Ativo | v19.0 | ✅ |
| whatsapp-bot | ✅ Ativo | v19.0 | ✅ |
| business-api | ✅ Ativo | v19.0 | ❌ |
| whatsapp-webhook | ✅ Ativo | v19.0 | ❌ |
| verify-credentials | ✅ Ativo | v18.0 | ❌ |
| baileys-session | ✅ Ativo | Simulação | ✅ |
| hybrid-websocket | ✅ Ativo | - | ❌ |

---

## 🚀 **Recomendações**

1. **Use `whatsapp-websocket`** para conexões WebSocket
2. **Configure credenciais** do WhatsApp Business API para produção
3. **Teste endpoints** usando `verify-credentials`
4. **Monitore logs** para identificar problemas
5. **Use fallbacks** quando disponíveis

---

## 🔄 **Próximas Melhorias**

- [ ] Implementar rate limiting
- [ ] Adicionar autenticação JWT
- [ ] Melhorar tratamento de erros
- [ ] Implementar cache para QR codes
- [ ] Adicionar métricas de uso
