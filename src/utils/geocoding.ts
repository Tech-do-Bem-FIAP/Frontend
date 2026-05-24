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

function limparCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

async function fetchComTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

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
      try { sessionStorage.setItem(cacheKey, JSON.stringify(null)); } catch {  }
      return null;
    }
    const endereco: EnderecoViaCep = {
      logradouro: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
    try { sessionStorage.setItem(cacheKey, JSON.stringify(endereco)); } catch {  }
    return endereco;
  } catch {
    return null;
  }
}

function nominatimKey(args: EnderecoViaCep): string {
  return `nom:${args.logradouro}|${args.bairro}|${args.cidade}|${args.uf}`.toLowerCase();
}

export async function geocodificar(args: EnderecoViaCep): Promise<Coordenadas | null> {
  const cacheKey = nominatimKey(args);
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed as Coordenadas | null;
    }
  } catch {

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
      try { sessionStorage.setItem(cacheKey, JSON.stringify(null)); } catch {  }
      return null;
    }
    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const coords: Coordenadas = { lat, lng };
    try { sessionStorage.setItem(cacheKey, JSON.stringify(coords)); } catch {  }
    return coords;
  } catch {
    return null;
  }
}
