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

## 🔑 **COMO OBTER AS CREDENCIAIS DA API DO WHATSAPP**

### **📱 Resposta Rápida:**
- **1 credencial = Múltiplos chips** ✅
- **Não precisa de 1 credencial por chip** ❌
- **1 API pode gerenciar vários números** ✅

### **🎯 Passo a Passo Detalhado:**

#### **Passo 1: Criar Conta no Facebook Developer**
1. Acesse: https://developers.facebook.com/
2. Clique em **"Criar App"**
3. Selecione **"Business"** como tipo
4. Preencha as informações básicas:
   - Nome do App: `Fire Zap Business`
   - Email de contato: seu email
   - Categoria: `Business`

#### **Passo 2: Configurar WhatsApp Business**
1. No seu app criado, vá em **"Adicionar Produto"**
2. Procure por **"WhatsApp"** e clique em **"Configurar"**
3. Siga o assistente de configuração
4. Aceite os termos de uso

#### **Passo 3: Obter Access Token**
1. No menu lateral, vá em **"WhatsApp > Getting Started"**
2. Role até a seção **"Access Token"**
3. Clique em **"Generate Token"**
4. Copie o token gerado (algo como: `EAA...`)
5. **Este é o `WHATSAPP_API_KEY`**

#### **Passo 4: Obter Phone Number ID**
1. No menu lateral, vá em **"WhatsApp > Configuration"**
2. Na seção **"Phone numbers"**, clique em **"Add phone number"**
3. Siga o processo de verificação do número
4. Após verificado, copie o **"Phone number ID"** (algo como: `123456789`)
5. **Este é o `WHATSAPP_PHONE_NUMBER_ID`**

#### **Passo 5: Criar Verify Token**
1. Crie um token personalizado (ex: `fire_zap_webhook_token_2024`)
2. **Este é o `WHATSAPP_VERIFY_TOKEN`**

#### **Passo 6: Configurar no Supabase**
1. Acesse: https://supabase.com/dashboard/project/fuohmclakezkvgaiarao/settings/secrets
2. Clique em **"Add secret"**
3. Adicione as seguintes variáveis:

```bash
WHATSAPP_API_KEY=EAA...seu_access_token_aqui
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_VERIFY_TOKEN=fire_zap_webhook_token_2024
```

---

## 🔄 **Como Funciona a Plataforma de Múltiplos Números**

### **Estrutura Atual:**
- ✅ **Dashboard**: Lista todos os números conectados
- ✅ **Chips**: Cada número é um "chip" no sistema
- ✅ **Aquecimento**: Pode usar múltiplos chips simultaneamente
- ✅ **Bot IA**: Responde para todos os números

### **Fluxo de Múltiplos Números:**
```
1. Usuário conecta Número A → Vira "Chip A"
2. Usuário conecta Número B → Vira "Chip B"
3. Usuário conecta Número C → Vira "Chip C"
4. Sistema pode fazer aquecimento entre:
   - Chip A ↔ Bot IA
   - Chip B ↔ Bot IA
   - Chip A ↔ Chip B (n2n)
   - Chip A ↔ Chip C (n2n)
```

### **Modos de Aquecimento:**
- **Bot Mode**: Chip conversa com IA
- **Chip-to-Chip**: Dois chips conversam entre si
- **Multi-Chip**: Múltiplos chips em conversas simultâneas

---

## 🎯 **RESPOSTA: 1 CREDENCIAL = MÚLTIPLOS CHIPS**

### **✅ Como Funciona:**
```
1 API do WhatsApp Business = Múltiplos números
├── Chip A (número 1) → Usa a mesma API
├── Chip B (número 2) → Usa a mesma API  
├── Chip C (número 3) → Usa a mesma API
└── Chip D (número 4) → Usa a mesma API
```

### **🔑 Vantagens:**
- **Mais simples**: Só precisa configurar 1 vez
- **Mais barato**: 1 API para todos os números
- **Mais fácil**: Menos credenciais para gerenciar
- **Mais eficiente**: Sistema unificado

### **📱 Como Funciona na Prática:**
1. **Você configura 1 API** no Facebook Developer
2. **Adiciona múltiplos números** na mesma API
3. **Cada número vira um chip** no sistema
4. **Todos usam a mesma credencial** mas são independentes

---

## 🔧 **Como Configurar o WhatsApp Business API**

### **Opção 1: Configuração Única (Recomendada para Início)**

Configure uma API principal que será usada para todos os números:

#### **Passo 1: Criar Conta no Facebook Developer**

1. Acesse: https://developers.facebook.com/
2. Clique em "Criar App"
3. Selecione "Business" como tipo
4. Preencha as informações básicas

#### **Passo 2: Configurar WhatsApp Business**

1. No seu app, vá em **"Adicionar Produto"**
2. Procure por **"WhatsApp"** e clique em **"Configurar"**
3. Siga o assistente de configuração

#### **Passo 3: Obter Credenciais**

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

#### **Passo 4: Configurar no Supabase**

1. Acesse: https://supabase.com/dashboard/project/fuohmclakezkvgaiarao/settings/secrets
2. Adicione as seguintes variáveis:

```bash
WHATSAPP_API_KEY=seu_access_token_aqui
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_VERIFY_TOKEN=fire_zap_webhook_token
```

### **Opção 2: Configuração Multi-API (Avançado)**

Para usar APIs separadas para cada número:

#### **Estrutura de Credenciais Múltiplas:**
```bash
# API Principal (para números principais)
WHATSAPP_API_KEY=token_principal
WHATSAPP_PHONE_NUMBER_ID=id_principal

# APIs Secundárias (para números adicionais)
WHATSAPP_API_KEY_2=token_secundario
WHATSAPP_PHONE_NUMBER_ID_2=id_secundario

WHATSAPP_API_KEY_3=token_terceiro
WHATSAPP_PHONE_NUMBER_ID_3=id_terceiro
```

#### **Como Funciona:**
- Sistema usa API principal por padrão
- Cada chip pode ter sua própria API configurada
- Fallback para API principal se específica não estiver disponível

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

### **Opção 3: Nova Função de Gerenciamento**
1. Acesse: https://supabase.com/dashboard/project/fuohmclakezkvgaiarao/functions
2. Vá em **"manage-whatsapp-apis"**
3. Use para listar, testar e gerenciar APIs

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

---

## 🎯 **Resumo: Múltiplos Números**

### **Como Funciona:**
- ✅ Sistema suporta múltiplos números ("chips")
- ✅ Cada número pode ser conectado independentemente
- ✅ Aquecimento funciona entre múltiplos números
- ✅ Bot IA responde para todos os números

### **Configuração Necessária:**
- ⚠️ **Uma API principal** para começar
- 🔄 **APIs adicionais** opcionais para cada número
- ✅ **Sistema flexível** que funciona com ambas as opções

### **Recomendação:**
1. **Comece com uma API** (mais simples)
2. **Teste com múltiplos números** usando a mesma API
3. **Expanda para múltiplas APIs** conforme necessário

---

## 💡 **FAQ - Perguntas Frequentes**

### **Q: Preciso de 1 credencial para cada chip?**
**R: NÃO!** 1 credencial pode gerenciar múltiplos chips. É mais simples e eficiente.

### **Q: Como adicionar mais números na mesma API?**
**R:** No Facebook Developer, vá em "WhatsApp > Configuration" e adicione números adicionais.

### **Q: Posso usar números pessoais?**
**R:** Para produção, use números de negócio verificados. Para teste, pode usar pessoais.

### **Q: Quanto custa a API?**
**R:** O Facebook oferece 1000 mensagens gratuitas por mês. Depois, paga por uso.

### **Q: É seguro usar a mesma API para múltiplos números?**
**R:** SIM! É a prática recomendada e mais segura.
