import { useState, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';
import {
  CamposComunsData,
  AcData,
  RackData,
  QdiData,
  NobreakData,
  GeradorData,
  CombustivelData,
  EquipamentoData,
  BancoBateriaData,
  ExaustorData,
  SectionState,
  RegistroCreatePayload,
  defaultCamposComunsData,
  defaultAcData,
  defaultRackData,
  defaultQdiData,
  defaultNobreakData,
  defaultGeradorData,
  defaultCombustivelData,
  defaultEquipamentoData,
  defaultBancoBateriaData,
  defaultExaustorData,
  defaultSection,
} from '../types/ronda';

// API calls use the configured axios instance from services/api.ts

// ─── Validation helpers ───────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Section key definitions (for named access) ──────────────────────────────

export interface AcSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<AcData>;
}

export interface RackSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<RackData>;
}

export interface QdiSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<QdiData>;
}

export interface NobreakSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<NobreakData>;
}

export interface EquipamentoSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<EquipamentoData>;
}

export interface BancoBateriaSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<BancoBateriaData>;
}

export interface ExaustorSectionEntry {
  itemId: string;
  identificador: string;
  state: SectionState<ExaustorData>;
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseRondaReturn {
  // Common fields
  camposComuns: CamposComunsData;
  setCamposComuns: (data: CamposComunsData) => void;

  // Per-item sections (keyed by item id)
  acSections: AcSectionEntry[];
  rackSections: RackSectionEntry[];
  qdiSections: QdiSectionEntry[];
  nobreakSections: NobreakSectionEntry[];
  equipamentoSections: EquipamentoSectionEntry[];
  bancoBateriaSections: BancoBateriaSectionEntry[];
  exaustorSections: ExaustorSectionEntry[];

  // Single-instance sections
  geradorSection: SectionState<GeradorData>;
  combustivelSection: SectionState<CombustivelData>;

  // Setters for per-item sections
  setAcSection: (itemId: string, state: SectionState<AcData>) => void;
  setRackSection: (itemId: string, state: SectionState<RackData>) => void;
  setQdiSection: (itemId: string, state: SectionState<QdiData>) => void;
  setNobreakSection: (itemId: string, state: SectionState<NobreakData>) => void;
  setEquipamentoSection: (itemId: string, state: SectionState<EquipamentoData>) => void;
  setBancoBateriaSection: (itemId: string, state: SectionState<BancoBateriaData>) => void;
  setExaustorSection: (itemId: string, state: SectionState<ExaustorData>) => void;

  // Setters for single sections
  setGeradorSection: (state: SectionState<GeradorData>) => void;
  setCombustivelSection: (state: SectionState<CombustivelData>) => void;

  // Initialisation — call after sala items are loaded
  initSections: (
    items: Array<{ id: string; tipo: string; identificador: string }>,
    opts?: { gerador?: boolean; combustivel?: boolean }
  ) => void;

  // Form actions
  validate: () => ValidationError[];
  submit: (salaId: string) => Promise<string>; // resolves with new ronda id
  loading: boolean;
  submitError: string | null;
  resetError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRonda(): UseRondaReturn {
  const [camposComuns, setCamposComuns] = useState<CamposComunsData>(defaultCamposComunsData);

  const [acSections, setAcSections] = useState<AcSectionEntry[]>([]);
  const [rackSections, setRackSections] = useState<RackSectionEntry[]>([]);
  const [qdiSections, setQdiSections] = useState<QdiSectionEntry[]>([]);
  const [nobreakSections, setNobreakSections] = useState<NobreakSectionEntry[]>([]);
  const [equipamentoSections, setEquipamentoSections] = useState<EquipamentoSectionEntry[]>([]);
  const [bancoBateriaSections, setBancoBateriaSections] = useState<BancoBateriaSectionEntry[]>([]);
  const [exaustorSections, setExaustorSections] = useState<ExaustorSectionEntry[]>([]);

  const [geradorSection, setGeradorSection] = useState<SectionState<GeradorData>>(
    () => defaultSection(defaultGeradorData)
  );
  const [combustivelSection, setCombustivelSection] = useState<SectionState<CombustivelData>>(
    () => defaultSection(defaultCombustivelData)
  );

  const [hasGeradorSection, setHasGeradorSection] = useState(false);
  const [hasCombustivelSection, setHasCombustivelSection] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── initSections ────────────────────────────────────────────────────────────

  const initSections = useCallback(
    (
      items: Array<{ id: string; tipo: string; identificador: string }>,
      opts?: { gerador?: boolean; combustivel?: boolean }
    ) => {
      setHasGeradorSection(!!opts?.gerador);
      setHasCombustivelSection(!!opts?.combustivel);
      if (opts?.gerador) setGeradorSection(defaultSection(defaultGeradorData));
      if (opts?.combustivel) setCombustivelSection(defaultSection(defaultCombustivelData));
      const acItems = items.filter((i) => i.tipo === 'ac' || i.tipo === 'ar_condicionado');
      const rackItems = items.filter((i) => i.tipo === 'rack');
      const qdiItems = items.filter((i) => i.tipo === 'qdi');
      const nobreakItems = items.filter((i) => i.tipo === 'nobreak');
      const equipamentoItems = items.filter((i) => i.tipo === 'equipamento' || i.tipo === 'quadro_eletrico');
      const bancoBateriaItems = items.filter((i) => i.tipo === 'banco_bateria');
      const exaustorItems = items.filter((i) => i.tipo === 'exaustor');

      setAcSections(
        acItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultAcData),
        }))
      );

      setRackSections(
        rackItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultRackData),
        }))
      );

      setQdiSections(
        qdiItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultQdiData),
        }))
      );

      setNobreakSections(
        nobreakItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultNobreakData),
        }))
      );

      setEquipamentoSections(
        equipamentoItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultEquipamentoData),
        }))
      );

      setBancoBateriaSections(
        bancoBateriaItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultBancoBateriaData),
        }))
      );

      setExaustorSections(
        exaustorItems.map((i) => ({
          itemId: i.id,
          identificador: i.identificador,
          state: defaultSection(defaultExaustorData),
        }))
      );
    },
    []
  );

  // ── Per-item setters ─────────────────────────────────────────────────────────

  const setAcSection = useCallback((itemId: string, state: SectionState<AcData>) => {
    setAcSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  const setRackSection = useCallback((itemId: string, state: SectionState<RackData>) => {
    setRackSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  const setQdiSection = useCallback((itemId: string, state: SectionState<QdiData>) => {
    setQdiSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  const setNobreakSection = useCallback((itemId: string, state: SectionState<NobreakData>) => {
    setNobreakSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  const setEquipamentoSection = useCallback((itemId: string, state: SectionState<EquipamentoData>) => {
    setEquipamentoSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  const setBancoBateriaSection = useCallback((itemId: string, state: SectionState<BancoBateriaData>) => {
    setBancoBateriaSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  const setExaustorSection = useCallback((itemId: string, state: SectionState<ExaustorData>) => {
    setExaustorSections((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, state } : e)));
  }, []);

  // ── validate ─────────────────────────────────────────────────────────────────

  const validate = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!camposComuns.hora_entrada) {
      errors.push({ field: 'hora_entrada', message: 'Hora de entrada é obrigatória.' });
    }

    // Validate per-section falha → observacao requirement
    acSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `ac_${e.itemId}_observacao`,
          message: `AC ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
      if (e.state.data.houve_manutencao) {
        if (!e.state.data.acao_manutencao.trim()) {
          errors.push({
            field: `ac_${e.itemId}_acao`,
            message: `AC ${e.identificador}: ação de manutenção é obrigatória.`,
          });
        }
        if (!e.state.data.data_manutencao) {
          errors.push({
            field: `ac_${e.itemId}_data_manutencao`,
            message: `AC ${e.identificador}: data da manutenção é obrigatória.`,
          });
        }
        if (!e.state.data.data_proxima_manutencao) {
          errors.push({
            field: `ac_${e.itemId}_data_proxima`,
            message: `AC ${e.identificador}: data da próxima manutenção é obrigatória.`,
          });
        }
      }
    });

    rackSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `rack_${e.itemId}_observacao`,
          message: `Rack ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
    });

    qdiSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `qdi_${e.itemId}_observacao`,
          message: `QDI ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
    });

    nobreakSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `nobreak_${e.itemId}_observacao`,
          message: `Nobreak ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
    });

    equipamentoSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `equipamento_${e.itemId}_observacao`,
          message: `Quadro Elétrico ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
    });

    bancoBateriaSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `banco_bateria_${e.itemId}_observacao`,
          message: `Banco de Bateria ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
    });

    exaustorSections.forEach((e) => {
      if (e.state.falha && !e.state.observacao.trim()) {
        errors.push({
          field: `exaustor_${e.itemId}_observacao`,
          message: `Exaustor ${e.identificador}: observação obrigatória quando FALHA = Sim.`,
        });
      }
    });

    if (geradorSection.falha && !geradorSection.observacao.trim()) {
      errors.push({ field: 'gerador_observacao', message: 'Gerador: observação obrigatória quando FALHA = Sim.' });
    }
    if (geradorSection.data.houve_manutencao) {
      if (!geradorSection.data.acao_manutencao.trim()) {
        errors.push({ field: 'gerador_acao', message: 'Gerador: ação de manutenção é obrigatória.' });
      }
      if (!geradorSection.data.data_manutencao) {
        errors.push({ field: 'gerador_data_manutencao', message: 'Gerador: data da manutenção é obrigatória.' });
      }
      if (!geradorSection.data.data_proxima_manutencao) {
        errors.push({ field: 'gerador_data_proxima', message: 'Gerador: data da próxima manutenção é obrigatória.' });
      }
    }

    if (combustivelSection.falha && !combustivelSection.observacao.trim()) {
      errors.push({
        field: 'combustivel_observacao',
        message: 'Combustível: observação obrigatória quando FALHA = Sim.',
      });
    }

    return errors;
  }, [camposComuns, acSections, rackSections, qdiSections, nobreakSections, equipamentoSections, bancoBateriaSections, exaustorSections, geradorSection, combustivelSection]);

  // ── buildRegistros ────────────────────────────────────────────────────────────

  function buildRegistros(rondaId: string): RegistroCreatePayload[] {
    const registros: RegistroCreatePayload[] = [];

    acSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'ac',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    rackSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'rack',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    qdiSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'qdi',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    nobreakSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'nobreak',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    equipamentoSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'equipamento',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    bancoBateriaSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'banco_bateria',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    exaustorSections.forEach((e) => {
      registros.push({
        ronda_id: rondaId,
        item_id: e.itemId,
        tipo_secao: 'exaustor',
        falha: e.state.falha,
        dados: e.state.data as unknown as Record<string, unknown>,
        observacao: e.state.falha ? e.state.observacao : undefined,
      });
    });

    // Gerador — only when the form enabled this section (salagerador)
    if (hasGeradorSection) {
      registros.push({
        ronda_id: rondaId,
        tipo_secao: 'gerador',
        falha: geradorSection.falha,
        dados: geradorSection.data as unknown as Record<string, unknown>,
        observacao: geradorSection.falha ? geradorSection.observacao : undefined,
      });
    }

    // Combustível — only when the form enabled this section (salagerador)
    if (hasCombustivelSection) {
      registros.push({
        ronda_id: rondaId,
        tipo_secao: 'combustivel',
        falha: combustivelSection.falha,
        dados: combustivelSection.data as unknown as Record<string, unknown>,
        observacao: combustivelSection.falha ? combustivelSection.observacao : undefined,
      });
    }

    return registros;
  }

  // ── submit ────────────────────────────────────────────────────────────────────

  const submit = useCallback(
    async (salaId: string): Promise<string> => {
      setLoading(true);
      setSubmitError(null);

      try {
        // 1. Create ronda
        const rondaPayload = {
          sala_id: salaId,
          hora_entrada: camposComuns.hora_entrada,
          hora_saida: camposComuns.hora_saida || undefined,
          limpeza: camposComuns.limpeza,
          organizacao: camposComuns.organizacao,
          iluminacao: camposComuns.iluminacao,
          vazamento: camposComuns.vazamento,
          observacoes: camposComuns.observacoes || undefined,
        };

        const rondaResp = await api.post('/rondas/', rondaPayload);

        const rondaId: string = rondaResp.data.id;

        // 2. Create each registro sequentially (preserves ordem on backend)
        const registros = buildRegistros(rondaId);
        for (const reg of registros) {
          await api.post('/registros/', reg);
        }

        return rondaId;
      } catch (err: unknown) {
        let message = 'Erro ao salvar ronda.';
        if (axios.isAxiosError(err)) {
          const detail = err.response?.data?.detail;
          if (typeof detail === 'string') {
            message = detail;
          } else if (Array.isArray(detail)) {
            message = detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join('; ');
          }
        }
        setSubmitError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camposComuns, acSections, rackSections, qdiSections, nobreakSections, equipamentoSections, bancoBateriaSections, exaustorSections, geradorSection, combustivelSection]
  );

  const resetError = useCallback(() => setSubmitError(null), []);

  return {
    camposComuns,
    setCamposComuns,
    acSections,
    rackSections,
    qdiSections,
    nobreakSections,
    equipamentoSections,
    bancoBateriaSections,
    exaustorSections,
    geradorSection,
    combustivelSection,
    setAcSection,
    setRackSection,
    setQdiSection,
    setNobreakSection,
    setEquipamentoSection,
    setBancoBateriaSection,
    setExaustorSection,
    setGeradorSection,
    setCombustivelSection,
    initSections,
    validate,
    submit,
    loading,
    submitError,
    resetError,
  };
}
