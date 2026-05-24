// Utilitários de geocoding — ViaCEP (CEP → endereço) e Nominatim (endereço → coords).
// Cache em sessionStorage pra evitar bater na API repetidamente durante a mesma sessão.
// Timeouts via AbortController pra não travar a UI.

const VIACEP_TIMEOUT_MS = 5000;
const NOMINATIM_TIMEOUT_MS = 5000;

export interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

/** Limpa um CEP (remove tudo que não é dígito). */
function limparCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

/** Faz fetch com timeout via AbortController. */
async function fetchComTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Consulta o ViaCEP. Retorna `null` quando CEP inválido, não encontrado ou erro de rede.
 * Cache em sessionStorage com chave `via:<cep_limpo>`.
 */
export async function consultarCep(cep: string): Promise<EnderecoViaCep | null> {
  const limpo = limparCep(cep);
  if (limpo.length !== 8) return null;

  const cacheKey = `via:${limpo}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed as EnderecoViaCep | null;
    }
  } catch {
    // sessionStorage indisponível — segue sem cache
  }

  try {
    const res = await fetchComTimeout(
      `https://viacep.com.br/ws/${limpo}/json/`,
      {},
      VIACEP_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(null)); } catch { /* noop */ }
      return null;
    }
    const endereco: EnderecoViaCep = {
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
    try { sessionStorage.setItem(cacheKey, JSON.stringify(endereco)); } catch { /* noop */ }
    return endereco;
  } catch {
    return null;
  }
}

/** Gera uma key estável pra cachear consultas Nominatim. */
function nominatimKey(args: EnderecoViaCep): string {
  return `nom:${args.logradouro}|${args.bairro}|${args.cidade}|${args.uf}`.toLowerCase();
}

/**
 * Geocodifica um endereço usando Nominatim (OpenStreetMap).
 * Retorna `null` em erro/timeout/sem resultado. Cache em sessionStorage.
 *
 * IMPORTANTE: respeita a Usage Policy do Nominatim — chamada manual via botão
 * "Localizar no mapa", não em onChange/blur (rate-limit de 1 req/s).
 */
export async function geocodificar(args: EnderecoViaCep): Promise<Coordenadas | null> {
  const cacheKey = nominatimKey(args);
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed as Coordenadas | null;
    }
  } catch {
    // segue sem cache
  }

  const params = new URLSearchParams({
    street: args.logradouro,
    city: args.cidade,
    state: args.uf,
    country: "Brasil",
    format: "json",
    limit: "1",
  });

  try {
    const res = await fetchComTimeout(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { "User-Agent": "TechDoBem/sprint4" } },
      NOMINATIM_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(null)); } catch { /* noop */ }
      return null;
    }
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const coords: Coordenadas = { lat, lng };
    try { sessionStorage.setItem(cacheKey, JSON.stringify(coords)); } catch { /* noop */ }
    return coords;
  } catch {
    return null;
  }
}
