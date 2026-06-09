import api from './api';
import type {
  Sala,
  Ronda,
  RegistroItem,
  FotoEvidencia,
  CreateRondaRequest,
  UpdateRondaRequest,
  CreateRegistroRequest,
  UpdateRegistroRequest,
  RondasFilter,
  PaginatedResponse,
} from '../types';

// ─── Salas ────────────────────────────────────────────────────────────────────

/**
 * List all active salas (rooms).
 */
export async function getSalas(): Promise<Sala[]> {
  const response = await api.get<Sala[]>('/salas');
  return response.data;
}

/**
 * Get a single sala by slug, including its items.
 */
export async function getSala(slug: string): Promise<Sala> {
  const response = await api.get<Sala>(`/salas/${slug}`);
  return response.data;
}

// ─── Rondas ───────────────────────────────────────────────────────────────────

/**
 * List rondas with optional filters and pagination.
 */
export async function getRondas(
  filters?: RondasFilter,
): Promise<PaginatedResponse<Ronda>> {
  const response = await api.get<PaginatedResponse<Ronda>>('/rondas', {
    params: filters,
  });
  return response.data;
}

/**
 * Get a single ronda by ID, including its registros.
 */
export async function getRonda(id: number): Promise<Ronda> {
  const response = await api.get<Ronda>(`/rondas/${id}`);
  return response.data;
}

/**
 * Create a new ronda.
 */
export async function createRonda(data: CreateRondaRequest): Promise<Ronda> {
  const response = await api.post<Ronda>('/rondas', data);
  return response.data;
}

/**
 * Update an existing ronda.
 */
export async function updateRonda(id: number, data: UpdateRondaRequest): Promise<Ronda> {
  const response = await api.patch<Ronda>(`/rondas/${id}`, data);
  return response.data;
}

/**
 * Delete a ronda by ID.
 */
export async function deleteRonda(id: number): Promise<void> {
  await api.delete(`/rondas/${id}`);
}

// ─── Registros ────────────────────────────────────────────────────────────────

/**
 * Create a new item registro within a ronda.
 */
export async function createRegistro(data: CreateRegistroRequest): Promise<RegistroItem> {
  const response = await api.post<RegistroItem>('/registros', data);
  return response.data;
}

/**
 * Update an existing registro.
 */
export async function updateRegistro(
  id: number,
  data: UpdateRegistroRequest,
): Promise<RegistroItem> {
  const response = await api.patch<RegistroItem>(`/registros/${id}`, data);
  return response.data;
}

/**
 * Get a single registro by ID.
 */
export async function getRegistro(id: number): Promise<RegistroItem> {
  const response = await api.get<RegistroItem>(`/registros/${id}`);
  return response.data;
}

/**
 * Delete a registro by ID.
 */
export async function deleteRegistro(id: number): Promise<void> {
  await api.delete(`/registros/${id}`);
}

// ─── Fotos ────────────────────────────────────────────────────────────────────

/**
 * Upload a photo evidence file linked to a registro.
 * Returns the created FotoEvidencia metadata.
 */
export async function uploadFoto(
  registro_id: number,
  file: File,
): Promise<FotoEvidencia> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('registro_id', String(registro_id));

  const response = await api.post<FotoEvidencia>('/fotos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Delete a photo evidence by ID.
 */
export async function deleteFoto(id: number): Promise<void> {
  await api.delete(`/fotos/${id}`);
}

/**
 * Get all photos for a registro.
 */
export async function getFotosByRegistro(registro_id: number): Promise<FotoEvidencia[]> {
  const response = await api.get<FotoEvidencia[]>(`/registros/${registro_id}/fotos`);
  return response.data;
}
