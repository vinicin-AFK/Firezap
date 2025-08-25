# 🔧 Guia Completo - Configuração das APIs do WhatsApp

## 🚨 **Problema Atual: QR Inválido**

O erro "QR inválido" indica que as credenciais do **WhatsApp Business API** não estão configuradas corretamente. Vamos resolver isso!

---

## 📋 **APIs Necessárias**

### **1. WhatsApp Business API (Meta/Facebook)**
**Status**: ⚠️ **REQUER CONFIGURAÇÃO**

**O que é**: API oficial do WhatsApp para empresas
**Para que serve**: Envio de mensagens, recebimento via webhook, QR codes reais

**Credenciais necessárias**:
- `WHATSAPP_API_KEY` - Access Token do Facebook
- `WHATSAPP_PHONE_NUMBER_ID` - ID do número de telefone
- `WHATSAPP_VERIFY_TOKEN` - Token para webhook

### **2. OpenAI API**
**Status**: ✅ **OPCIONAL** (já configurado)

**O que é**: API de IA para respostas automáticas
**Para que serve**: Bot inteligente que responde mensagens

**Credencial necessária**:
- `OPENAI_API_KEY` - Chave da API OpenAI

---

## 🔧 **Como Configurar o WhatsApp Business API**

### **Passo 1: Criar Conta no Facebook Developer**

1. Acesse: https://developers.facebook.com/
2. Clique em "Criar App"
3. Selecione "Business" como tipo
4. Preencha as informações básicas

### **Passo 2: Configurar WhatsApp Business**

1. No seu app, vá em **"Adicionar Produto"**
2. Procure por **"WhatsApp"** e clique em **"Configurar"**
3. Siga o assistente de configuração

### **Passo 3: Obter Credenciais**

1. **Access Token**:
   - Vá em **"WhatsApp > Getting Started"**
   - Copie o **"Access Token"**
   - Este é o `WHATSAPP_API_KEY`

2. **Phone Number ID**:
   - Vá em **"WhatsApp > Configuration"**
   - Copie o **"Phone number ID"**
   - Este é o `WHATSAPP_PHONE_NUMBER_ID`

3. **Verify Token**:
   - Crie um token personalizado (ex: `fire_zap_webhook_token`)
   - Este é o `WHATSAPP_VERIFY_TOKEN`

### **Passo 4: Configurar no Supabase**

1. Acesse: https://supabase.com/dashboard/project/fuohmclakezkvgaiarao/settings/secrets
2. Adicione as seguintes variáveis:

```bash
WHATSAPP_API_KEY=seu_access_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_VERIFY_TOKEN=fire_zap_webhook_token
```

---

## 🧪 **Como Testar as Credenciais**

### **Opção 1: Página de Verificação**
1. Acesse: `https://firezap-nine.vercel.app/verify-credentials`
2. Clique em **"Verificar Credenciais"**
3. Veja os resultados dos testes

### **Opção 2: Console do Supabase**
1. Acesse: https://supabase.com/dashboard/project/fuohmclakezkvgaiarao/functions
2. Vá em **"verify-whatsapp-credentials"**
3. Clique em **"Invoke"**
4. Veja os logs

---

## 🔄 **Fluxo de Conexão Atual**

### **Sem Credenciais (Fallback)**:
```
1. Usuário clica "Gerar QR Code"
2. Sistema usa QR simulado (api.qrserver.com)
3. QR não é válido para WhatsApp real
4. Usuário vê "QR inválido"
```

### **Com Credenciais (Produção)**:
```
1. Usuário clica "Gerar QR Code"
2. Sistema chama WhatsApp Business API
3. API retorna QR válido
4. Usuário escaneia e conecta
```

---

## 🛠️ **Soluções Temporárias**

### **Solução 1: Usar Simulação**
Se não quiser configurar a API agora:

1. O sistema já tem fallbacks
2. QR simulado funciona para demonstração
3. Use o botão **"Simular Escaneamento"**

### **Solução 2: Configurar API**
Para funcionamento real:

1. Siga o guia acima
2. Configure as credenciais
3. Teste com a página de verificação

---

## 📊 **Status das APIs**

| API | Status | Configuração | Funcionalidade |
|-----|--------|--------------|----------------|
| WhatsApp Business | ⚠️ Pendente | Requer setup | QR real, mensagens |
| OpenAI | ✅ Ativa | Já configurada | Bot inteligente |
| WebSocket | ✅ Ativa | Automática | Interface real-time |
| Supabase | ✅ Ativa | Automática | Banco de dados |

---

## 🚀 **Próximos Passos**

### **Para Demonstração**:
1. Use o QR simulado
2. Clique em **"Simular Escaneamento"**
3. Teste as funcionalidades

### **Para Produção**:
1. Configure WhatsApp Business API
2. Adicione credenciais no Supabase
3. Teste com página de verificação
4. Use QR real para conexão

---

## 🔍 **Troubleshooting**

### **QR sempre inválido**:
- ✅ Verifique se as credenciais estão configuradas
- ✅ Teste com a página de verificação
- ✅ Use o botão "Simular Escaneamento"

### **Erro de conexão**:
- ✅ Verifique os logs do WebSocket
- ✅ Confirme se o Supabase está ativo
- ✅ Teste a conectividade

### **Bot não responde**:
- ✅ Verifique se OpenAI API está configurada
- ✅ Teste o endpoint `whatsapp-bot`
- ✅ Veja os logs da função

---

## 📞 **Suporte**

Se ainda tiver problemas:

1. **Verifique credenciais**: `/verify-credentials`
2. **Veja logs**: Supabase Dashboard
3. **Teste endpoints**: Use a documentação
4. **Use fallbacks**: Para demonstração

---

## ✅ **Checklist de Configuração**

- [ ] Criar app no Facebook Developer
- [ ] Configurar WhatsApp Business
- [ ] Obter Access Token
- [ ] Obter Phone Number ID
- [ ] Criar Verify Token
- [ ] Adicionar secrets no Supabase
- [ ] Testar com página de verificação
- [ ] Configurar webhook (opcional)
- [ ] Testar QR real

**Status atual**: ⚠️ **Requer configuração da API do WhatsApp Business**
