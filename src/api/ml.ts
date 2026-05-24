import { ApiError } from "./client";

const ML_BASE_URL =
  (import.meta.env.VITE_ML_URL as string | undefined) ?? "http://localhost:5001";

export type ClasseDemanda = "Baixa" | "Media" | "Alta";

export interface PredicaoML {
  classe: ClasseDemanda;
  probabilidades: Record<ClasseDemanda, number>;
  modelo_versao: string;
  bairro?: string;
}

export interface FeaturesCompletas {
  densidade_pop: number;
  idh: number;
  dist_ubs_km: number;
  historico_atendimentos: number;
  pct_exames_pendentes: number;
  populacao_infantil_pct: number;
  dia_semana_cadastro: number;
}

export type PredicaoInput = { bairro: string } | FeaturesCompletas;

export interface HealthCheckResponse {
  status: string;
  modelo_carregado: boolean;
  versao: string;
  bairros_disponiveis: number;
}

export interface RankingItem {
  bairro: string;
  classe: ClasseDemanda;
  probabilidades: Record<ClasseDemanda, number>;
  coords: { lat: number; lng: number };
}

export interface RankingResponse {
  modelo_versao: string;
  total: number;
  itens: RankingItem[];
}

async function mlRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ML_BASE_URL + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API de ML.");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "erro" in data
        ? String((data as { erro: unknown }).erro)
        : `Erro ${res.status} na API de ML`;
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}

export function predizerDemanda(input: PredicaoInput): Promise<PredicaoML> {
  return mlRequest<PredicaoML>("POST", "/predict", input);
}

export function predizerBatch(
  inputs: Array<{ bairro: string }>,
): Promise<Array<PredicaoML & { index: number }>> {
  return mlRequest<Array<PredicaoML & { index: number }>>("POST", "/predict/batch", inputs);
}

export function verificarSaudeML(): Promise<HealthCheckResponse> {
  return mlRequest<HealthCheckResponse>("GET", "/health");
}

export function obterRankingBairros(): Promise<RankingResponse> {
  return mlRequest<RankingResponse>("GET", "/ranking");
}
