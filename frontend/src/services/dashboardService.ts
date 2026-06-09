import api from './api';
import type {
  DashboardSummary,
  SalaStatus,
  GeradorHistorico,
  Sala,
} from '../types';

// ─── Dashboard Service ────────────────────────────────────────────────────────

/**
 * Fetch today's summary counters:
 * rondas_hoje, falhas_hoje, itens_nok, salas_pendentes
 */
export async function getSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>('/dashboard/summary');
  return response.data;
}

/**
 * Fetch the status of all salas (ok / falha / pendente)
 * including the last ronda and fault count per sala.
 */
export async function getSalasStatus(): Promise<SalaStatus[]> {
  const response = await api.get<SalaStatus[]>('/dashboard/salas-status');
  return response.data;
}

/**
 * Fetch generator (gerador) historical load and frequency data
 * for the last 24 hours, or whatever range the API returns.
 */
export async function getGeradorHistorico(): Promise<GeradorHistorico[]> {
  const response = await api.get<GeradorHistorico[]>('/dashboard/gerador-historico');
  return response.data;
}

/**
 * Fetch the list of salas that have no ronda registered today
 * (i.e. pending inspection).
 */
export async function getRondasPendentes(): Promise<Sala[]> {
  const response = await api.get<Sala[]>('/dashboard/rondas-pendentes');
  return response.data;
}
