export type AppRole = 'vendedor' | 'gestor';
export type LeadStatus = 'Novo' | 'Em Atendimento' | 'Orçamento Enviado' | 'Ganho' | 'Perdido';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Lead {
  id: string;
  nome: string;
  contato: string;
  status: LeadStatus;
  valor_fechamento: number | null;
  motivo_perda: string | null;
  vendedor_id: string | null;
  demanda: string | null;
  origem: string | null;
  ultimo_contato: string | null;
  orcamento_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  vendedor?: Profile;
}

export interface FollowupTemplate {
  id: string;
  nome: string;
  mensagem: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingCampaign {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  tipo: 'texto' | 'imagem' | 'video';
  conteudo: string;
  media_url: string | null;
  dias_apos_entrada: number;
  dias_apos_ultimo_followup: number | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface CampaignSend {
  id: string;
  lead_id: string;
  message_id: string;
  enviado_em: string;
  status: string;
}
