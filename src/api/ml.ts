// Cliente para a API de Machine Learning (Flask) — predições de demanda por bairro.
// Reusa o tipo ApiError do client REST principal pra padronizar tratamento de erro.

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

/** Features completas pra quando o user quer prever sem cair no lookup por bairro. */
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

/** Wrapper de fetch com tratamento padronizado de erro via ApiError. */
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

/** Predição única — aceita lookup por bairro OU features completas. */
export function predizerDemanda(input: PredicaoInput): Promise<PredicaoML> {
  return mlRequest<PredicaoML>("POST", "/predict", input);
}

/** Predição em batch — cada item da resposta tem `index` correlacionado à entrada. */
export function predizerBatch(
  inputs: Array<{ bairro: string }>,
): Promise<Array<PredicaoML & { index: number }>> {
  return mlRequest<Array<PredicaoML & { index: number }>>("POST", "/predict/batch", inputs);
}

/** Health check — útil pra mostrar status no dashboard. */
export function verificarSaudeML(): Promise<HealthCheckResponse> {
  return mlRequest<HealthCheckResponse>("GET", "/health");
}
