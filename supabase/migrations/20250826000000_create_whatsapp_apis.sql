-- Criar tabela para armazenar credenciais da API do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_apis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    verify_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_apis_user_id ON public.whatsapp_apis(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_apis_active ON public.whatsapp_apis(is_active);

-- Políticas RLS (Row Level Security)
ALTER TABLE public.whatsapp_apis ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias APIs
CREATE POLICY "Users can view their own WhatsApp APIs" ON public.whatsapp_apis
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias APIs
CREATE POLICY "Users can create their own WhatsApp APIs" ON public.whatsapp_apis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias APIs
CREATE POLICY "Users can update their own WhatsApp APIs" ON public.whatsapp_apis
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias APIs
CREATE POLICY "Users can delete their own WhatsApp APIs" ON public.whatsapp_apis
    FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_apis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_apis_updated_at
    BEFORE UPDATE ON public.whatsapp_apis
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_apis_updated_at();

-- Inserir dados de exemplo (opcional)
-- INSERT INTO public.whatsapp_apis (user_id, name, api_key, phone_number_id, verify_token)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- substitua pelo user_id real
--     'API Principal',
--     'EAAaZBsZBDYZBZAoBPbDSgmIUOSWjZBYPfwmU8nmhEyM3cR89ChgtCYFfW4ThHzFvZCZCPyiD4Sp',
--     '752280551307194',
--     'fire_zap_webhook_token'
-- );
