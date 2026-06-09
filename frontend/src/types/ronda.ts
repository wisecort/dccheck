// ─── Ronda Form — shared data types ─────────────────────────────────────────
//
// All section "data" objects represent the `dados` dict sent to the API as
// RegistroItemCreate.dados.  They are intentionally separate from the backend
// Pydantic schemas so the frontend can track partial / empty state and validate
// before submission.

// ─── API shapes (aligned with backend schemas) ───────────────────────────────

export interface SalaDetail {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  has_gerador: boolean;
  has_combustivel: boolean;
  itens: ItemSala[];
}

export interface ItemSala {
  id: string;
  sala_id: string;
  tipo: string; // 'ac' | 'rack' | 'qdi' | 'nobreak' | 'gerador' | 'extintor' | ...
  identificador: string;
  dados_fixos: Record<string, unknown>;
  ativo: boolean;
  ordem: number;
}

export interface RondaCreatePayload {
  sala_id: string;
  hora_entrada: string;   // HH:MM
  hora_saida?: string;    // HH:MM
  limpeza: 'limpo' | 'medio' | 'sujo';
  organizacao: boolean;
  iluminacao: boolean;
  vazamento: boolean;
  observacoes?: string;
}

export interface RegistroCreatePayload {
  ronda_id: string;
  item_id?: string;
  tipo_secao: string;
  falha: boolean;
  dados: Record<string, unknown>;
  observacao?: string;
}

// ─── CamposComuns ────────────────────────────────────────────────────────────

export type LimpezaValue = 'limpo' | 'medio' | 'sujo';

export interface CamposComunsData {
  hora_entrada: string;
  hora_saida: string;
  limpeza: LimpezaValue;
  organizacao: boolean;
  iluminacao: boolean;
  vazamento: boolean;
  observacoes: string;
}

export function defaultCamposComunsData(): CamposComunsData {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return {
    hora_entrada: `${hh}:${mm}`,
    hora_saida: '',
    limpeza: 'limpo',
    organizacao: true,
    iluminacao: true,
    vazamento: true,
    observacoes: '',
  };
}

// ─── AC (Ar-condicionado) ─────────────────────────────────────────────────────

export interface AcData {
  temperatura: string;
  houve_manutencao: boolean;
  acao_manutencao: string;
  data_manutencao: string;
  data_proxima_manutencao: string;
}

export function defaultAcData(): AcData {
  return {
    temperatura: '',
    houve_manutencao: false,
    acao_manutencao: '',
    data_manutencao: '',
    data_proxima_manutencao: '',
  };
}

// ─── Rack ─────────────────────────────────────────────────────────────────────

export interface RackData {
  equipamento_problema: string;
}

export function defaultRackData(): RackData {
  return { equipamento_problema: '' };
}

// ─── QDI (Quadro de Distribuição de Infraestrutura) ──────────────────────────

export interface QdiData {
  frequencia_hz: string;
  tensao_f1_n: string;
  tensao_f2_n: string;
  tensao_f3_n: string;
  carga_kw: string;
  carga_kvar: string;
  carga_kva: string;
}

export function defaultQdiData(): QdiData {
  return {
    frequencia_hz: '',
    tensao_f1_n: '',
    tensao_f2_n: '',
    tensao_f3_n: '',
    carga_kw: '',
    carga_kvar: '',
    carga_kva: '',
  };
}

// ─── Nobreak (UPS) ────────────────────────────────────────────────────────────

export interface NobreakData {
  carga_l1: string;
  carga_l2: string;
  carga_l3: string;
}

export function defaultNobreakData(): NobreakData {
  return { carga_l1: '', carga_l2: '', carga_l3: '' };
}

// ─── Gerador ──────────────────────────────────────────────────────────────────

export type ModoOperacao = 'AUTO' | 'MANUAL' | 'TEST';

export interface GeradorData {
  modo_operacao: ModoOperacao;
  estado: string;
  alarmes_ativos: string;
  load_kw: string;
  load_kva: string;
  frequencia_hz: string;
  tensao_l1_n: string;
  tensao_l2_n: string;
  tensao_l3_n: string;
  corrente_l1: string;
  corrente_l2: string;
  corrente_l3: string;
  genset_kwh: string;
  running_hours: string;
  temperatura: string;
  tensao_bateria: string;
  houve_manutencao: boolean;
  acao_manutencao: string;
  data_manutencao: string;
  data_proxima_manutencao: string;
  data_ultimo_teste: string;
  data_proximo_teste: string;
}

export function defaultGeradorData(): GeradorData {
  return {
    modo_operacao: 'AUTO',
    estado: '',
    alarmes_ativos: '',
    load_kw: '',
    load_kva: '',
    frequencia_hz: '',
    tensao_l1_n: '',
    tensao_l2_n: '',
    tensao_l3_n: '',
    corrente_l1: '',
    corrente_l2: '',
    corrente_l3: '',
    genset_kwh: '',
    running_hours: '',
    temperatura: '',
    tensao_bateria: '',
    houve_manutencao: false,
    acao_manutencao: '',
    data_manutencao: '',
    data_proxima_manutencao: '',
    data_ultimo_teste: '',
    data_proximo_teste: '',
  };
}

// ─── Combustível ──────────────────────────────────────────────────────────────

export interface CombustivelData {
  nivel_tanque_uso: string;
  data_abastecimento: string;
  nivel_reserva: string;
  data_abastecimento_reserva: string;
  data_vencimento_reserva: string;
  mains_tensao_l1_n: string;
  mains_tensao_l2_n: string;
  mains_tensao_l3_n: string;
  mains_frequencia_hz: string;
}

export function defaultCombustivelData(): CombustivelData {
  return {
    nivel_tanque_uso: '',
    data_abastecimento: '',
    nivel_reserva: '',
    data_abastecimento_reserva: '',
    data_vencimento_reserva: '',
    mains_tensao_l1_n: '',
    mains_tensao_l2_n: '',
    mains_tensao_l3_n: '',
    mains_frequencia_hz: '',
  };
}

// ─── Equipamento (Quadro Elétrico) ───────────────────────────────────────────

export interface EquipamentoData {
  quant_fases: number | '';
  desligados: number | '';
}

export function defaultEquipamentoData(): EquipamentoData {
  return { quant_fases: '', desligados: '' };
}

// ─── Banco de Bateria ─────────────────────────────────────────────────────────

export interface BancoBateriaData {
  autonomia_min: number | '';
  data_ultima_manutencao: string;
  data_proxima_manutencao: string;
}

export function defaultBancoBateriaData(): BancoBateriaData {
  return { autonomia_min: '', data_ultima_manutencao: '', data_proxima_manutencao: '' };
}

// ─── Exaustor ─────────────────────────────────────────────────────────────────

export interface ExaustorData {
  temperatura_c: number | '';
  data_ultima_manutencao: string;
  data_proxima_manutencao: string;
}

export function defaultExaustorData(): ExaustorData {
  return { temperatura_c: '', data_ultima_manutencao: '', data_proxima_manutencao: '' };
}

// ─── Section state (falha + observacao wrapper) ───────────────────────────────

export interface SectionState<T> {
  data: T;
  falha: boolean;
  observacao: string;
}

export function defaultSection<T>(defaultData: () => T): SectionState<T> {
  return { data: defaultData(), falha: false, observacao: '' };
}
