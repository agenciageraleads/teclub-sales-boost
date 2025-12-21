export type AppRole = 'vendedor' | 'gestor';
export type LeadStatus = 'Novo' | 'Em Atendimento' | 'Ganho' | 'Perdido';

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
  created_at: string;
  updated_at: string;
  // Joined data
  vendedor?: Profile;
}
