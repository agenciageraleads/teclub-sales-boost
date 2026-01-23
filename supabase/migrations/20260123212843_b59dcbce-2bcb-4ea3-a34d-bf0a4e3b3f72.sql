-- Adicionar novo valor ao enum lead_status
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'Orçamento Enviado' AFTER 'Em Atendimento';

-- Criar bucket para armazenar orçamentos
INSERT INTO storage.buckets (id, name, public) VALUES ('orcamentos', 'orcamentos', false)
ON CONFLICT (id) DO NOTHING;

-- Adicionar campo para URL do arquivo de orçamento na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS orcamento_url text;

-- Policies para o bucket de orçamentos
-- Vendedores podem fazer upload nos leads deles
CREATE POLICY "Vendedores podem upload orcamento seus leads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'orcamentos' AND
  (
    has_role(auth.uid(), 'gestor'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE id::text = (storage.foldername(name))[1] 
      AND vendedor_id = auth.uid()
    )
  )
);

-- Vendedores e gestores podem visualizar orçamentos
CREATE POLICY "Usuarios podem ver orcamentos seus leads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'orcamentos' AND
  (
    has_role(auth.uid(), 'gestor'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE id::text = (storage.foldername(name))[1] 
      AND vendedor_id = auth.uid()
    )
  )
);

-- Gestores podem deletar qualquer orçamento
CREATE POLICY "Gestores podem deletar orcamentos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'orcamentos' AND
  has_role(auth.uid(), 'gestor'::app_role)
);