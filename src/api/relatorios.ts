// Cliente do endpoint GET /api/relatorios — snapshot dos 5 relatorios da rubrica.

import { http } from "./client";

export interface TopDentista {
  nome: string;
  especialidade: string;
  qtdPacientes: number;
}

export interface IdadeStats {
  idadeMedia: number;
  total: number;
  maisNovo: number;
  maisVelho: number;
}

export interface AtendimentoPorStatus {
  status: string;
  quantidade: number;
  primeiroAtendimento: string;
  ultimoAtendimento: string;
}

export interface DentistaAcimaMedia {
  id: number;
  nome: string;
  qtdPacientes: number;
}

export interface AtendimentoDetalhado {
  id: number;
  data: string;
  tipo: string;
  status: string;
  paciente: string;
  dentista: string;
  especialidade: string;
  campanha: string;
}

export interface RelatorioResponse {
  rankingDentistas: TopDentista[];
  idadeStats: IdadeStats;
  atendimentosPorStatus: AtendimentoPorStatus[];
  dentistasAcimaMedia: DentistaAcimaMedia[];
  ultimosAtendimentos: AtendimentoDetalhado[];
}

export function gerarRelatorios(): Promise<RelatorioResponse> {
  return http.get<RelatorioResponse>("/api/relatorios");
}
