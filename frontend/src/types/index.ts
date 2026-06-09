// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'gestor' | 'tecnico';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ─── Sala & Itens ────────────────────────────────────────────────────────────

export type ItemTipo =
  | 'ar_condicionado'
  | 'nobreak'
  | 'gerador'
  | 'rack'
  | 'pdu'
  | 'sensor'
  | 'extintor'
  | 'outro';

export interface Sala {
  id: number;
  slug: string;
  nome: string;
  descricao: string | null;
  itens?: ItemSala[];
}

export interface ItemSala {
  id: number;
  sala_id: number;
  tipo: ItemTipo;
  identificador: string;
  dados_fixos: Record<string, unknown>;
  ativo: boolean;
  ordem: number;
}

// ─── Ronda ───────────────────────────────────────────────────────────────────

export interface Ronda {
  id: number;
  sala_id: number;
  data: string;           // ISO date string YYYY-MM-DD
  tecnico_id: number;
  hora_entrada: string;   // HH:mm
  hora_saida: string | null;
  limpeza: boolean;
  organizacao: boolean;
  iluminacao: boolean;
  vazamento: boolean;
  falha_geral: boolean;
  observacoes: string | null;
  created_at: string;     // ISO datetime string
  sala?: Sala;
  tecnico?: User;
  registros?: RegistroItem[];
}

export interface CreateRondaRequest {
  sala_id: number;
  data: string;
  hora_entrada: string;
  hora_saida?: string;
  limpeza: boolean;
  organizacao: boolean;
  iluminacao: boolean;
  vazamento: boolean;
  falha_geral: boolean;
  observacoes?: string;
}

export interface UpdateRondaRequest extends Partial<CreateRondaRequest> {}

// ─── Registro de Item ─────────────────────────────────────────────────────────

export type TipoSecao = 'geral' | 'item';

export interface RegistroItem {
  id: number;
  ronda_id: number;
  item_id: number | null;
  tipo_secao: TipoSecao;
  falha: boolean;
  dados: Record<string, unknown>;
  observacao: string | null;
  created_at: string;
  fotos?: FotoEvidencia[];
  item?: ItemSala;
}

export interface CreateRegistroRequest {
  ronda_id: number;
  item_id?: number;
  tipo_secao: TipoSecao;
  falha: boolean;
  dados?: Record<string, unknown>;
  observacao?: string;
}

export interface UpdateRegistroRequest extends Partial<CreateRegistroRequest> {}

// ─── Foto Evidência ───────────────────────────────────────────────────────────

export interface FotoEvidencia {
  id: number;
  registro_id: number;
  filename: string;
  mimetype: string;
  tamanho_bytes: number;
  url?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  rondas_hoje: number;
  falhas_hoje: number;
  itens_nok: number;
  salas_pendentes: number;
}

export type SalaStatusType = 'ok' | 'falha' | 'pendente';

export interface SalaStatus {
  sala: Sala;
  last_ronda: Ronda | null;
  falhas_count: number;
  status: SalaStatusType;
}

export interface GeradorHistorico {
  data_hora: string;   // ISO datetime string
  load_kw: number;
  load_kva: number;
  frequencia_hz: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface RondasFilter {
  sala_id?: number;
  tecnico_id?: number;
  data_inicio?: string;
  data_fim?: string;
  com_falha?: boolean;
  page?: number;
  page_size?: number;
}

// ─── Generic API ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
