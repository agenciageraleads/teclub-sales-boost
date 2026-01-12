-- Adicionar campo ultimo_contato na tabela leads
ALTER TABLE public.leads ADD COLUMN ultimo_contato timestamp with time zone DEFAULT null;

-- Criar tabela de mensagens de follow-up pré-configuradas
CREATE TABLE public.followup_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  mensagem text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.followup_templates ENABLE ROW LEVEL SECURITY;

-- Apenas gestores podem gerenciar templates
CREATE POLICY "Gestores can manage templates" 
ON public.followup_templates 
FOR ALL 
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Vendedores podem ver templates
CREATE POLICY "Vendedores can view templates" 
ON public.followup_templates 
FOR SELECT 
USING (has_role(auth.uid(), 'vendedor'::app_role));

-- Criar tabela de campanhas de marketing
CREATE TABLE public.marketing_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Apenas gestores podem gerenciar campanhas
CREATE POLICY "Gestores can manage campaigns" 
ON public.marketing_campaigns 
FOR ALL 
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Criar tabela de mensagens agendadas nas campanhas
CREATE TABLE public.campaign_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('texto', 'imagem', 'video')),
  conteudo text NOT NULL,
  media_url text,
  dias_apos_entrada integer NOT NULL DEFAULT 0,
  dias_apos_ultimo_followup integer,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

-- Apenas gestores podem gerenciar mensagens de campanha
CREATE POLICY "Gestores can manage campaign messages" 
ON public.campaign_messages 
FOR ALL 
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Tabela para rastrear envios
CREATE TABLE public.campaign_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.campaign_messages(id) ON DELETE CASCADE,
  enviado_em timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'enviado'
);

-- Habilitar RLS
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

-- Gestores podem ver todos os envios
CREATE POLICY "Gestores can view campaign sends" 
ON public.campaign_sends 
FOR ALL 
USING (has_role(auth.uid(), 'gestor'::app_role));

-- Trigger para updated_at nas novas tabelas
CREATE TRIGGER update_followup_templates_updated_at
BEFORE UPDATE ON public.followup_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();