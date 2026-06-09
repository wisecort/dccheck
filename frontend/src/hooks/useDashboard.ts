import { useState, useEffect, useCallback, useRef } from 'react';
import * as dashboardService from '../services/dashboardService';
import type { DashboardSummary, SalaStatus, GeradorHistorico, Sala } from '../types';

// ─── Loading state shape ──────────────────────────────────────────────────────

interface DashboardLoadingState {
  summary: boolean;
  salasStatus: boolean;
  geradorHistorico: boolean;
  rondasPendentes: boolean;
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseDashboardReturn {
  summary: DashboardSummary | null;
  salasStatus: SalaStatus[];
  geradorHistorico: GeradorHistorico[];
  rondasPendentes: Sala[];
  loading: DashboardLoadingState;
  /** True if any of the loading flags are true */
  isLoading: boolean;
  error: string | null;
  /** Refetch all dashboard data */
  refresh: () => Promise<void>;
  /** Refetch only the summary counters */
  refreshSummary: () => Promise<void>;
  /** Refetch only the sala status list */
  refreshSalasStatus: () => Promise<void>;
  /** Last successful fetch timestamp */
  lastUpdated: Date | null;
}

// ─── useDashboard hook ────────────────────────────────────────────────────────

export function useDashboard(): UseDashboardReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salasStatus, setSalasStatus] = useState<SalaStatus[]>([]);
  const [geradorHistorico, setGeradorHistorico] = useState<GeradorHistorico[]>([]);
  const [rondasPendentes, setRondasPendentes] = useState<Sala[]>([]);
  const [loading, setLoading] = useState<DashboardLoadingState>({
    summary: false,
    salasStatus: false,
    geradorHistorico: false,
    rondasPendentes: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track mount state to avoid setting state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Individual fetchers ──────────────────────────────────────────────────

  const refreshSummary = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading((prev) => ({ ...prev, summary: true }));
    try {
      const data = await dashboardService.getSummary();
      if (mountedRef.current) setSummary(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar resumo');
      }
    } finally {
      if (mountedRef.current) setLoading((prev) => ({ ...prev, summary: false }));
    }
  }, []);

  const refreshSalasStatus = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading((prev) => ({ ...prev, salasStatus: true }));
    try {
      const data = await dashboardService.getSalasStatus();
      if (mountedRef.current) setSalasStatus(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar status das salas');
      }
    } finally {
      if (mountedRef.current) setLoading((prev) => ({ ...prev, salasStatus: false }));
    }
  }, []);

  const refreshGeradorHistorico = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading((prev) => ({ ...prev, geradorHistorico: true }));
    try {
      const data = await dashboardService.getGeradorHistorico();
      if (mountedRef.current) setGeradorHistorico(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar histórico do gerador');
      }
    } finally {
      if (mountedRef.current) setLoading((prev) => ({ ...prev, geradorHistorico: false }));
    }
  }, []);

  const refreshRondasPendentes = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading((prev) => ({ ...prev, rondasPendentes: true }));
    try {
      const data = await dashboardService.getRondasPendentes();
      if (mountedRef.current) setRondasPendentes(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar rondas pendentes');
      }
    } finally {
      if (mountedRef.current) setLoading((prev) => ({ ...prev, rondasPendentes: false }));
    }
  }, []);

  // ─── Full refresh ─────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setError(null);

    await Promise.allSettled([
      refreshSummary(),
      refreshSalasStatus(),
      refreshGeradorHistorico(),
      refreshRondasPendentes(),
    ]);

    if (mountedRef.current) {
      setLastUpdated(new Date());
    }
  }, [
    refreshSummary,
    refreshSalasStatus,
    refreshGeradorHistorico,
    refreshRondasPendentes,
  ]);

  // ─── Initial fetch on mount ───────────────────────────────────────────────

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = Object.values(loading).some(Boolean);

  return {
    summary,
    salasStatus,
    geradorHistorico,
    rondasPendentes,
    loading,
    isLoading,
    error,
    refresh,
    refreshSummary,
    refreshSalasStatus,
    lastUpdated,
  };
}
