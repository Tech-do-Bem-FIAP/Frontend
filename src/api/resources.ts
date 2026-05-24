import { http } from "./client";

// ─── Backend DTO shapes (verbatim field names) ───────────────────────────────

export interface LoginResponseDTO { role: string; id: number; nome: string; cargo: string | null }

export interface PacienteDTO {
  idPaciente: number; nome: string; cpf: string | null;
  dataNasc: string; telefone: string; email: string; idDentista: number;
  /** Campos de endereço/geolocalização — opcionais (backend pode retornar null). */
  cep?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PacienteRequestDTO {
  nome: string; cpf: string | null;
  dataNasc: string; telefone: string; email: string; idDentista: number;
  /** Campos opcionais de endereço/geolocalização — enviar apenas quando preenchidos. */
  cep?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DentistaDTO {
  idDentista: number; nome: string; cpf: string; email: string;
  cro: string; especialidade: string; disponibilidade: number;
  idColaborador: number | null;
}

export interface DentistaRequestDTO {
  nome: string; cpf: string; email: string;
  /** Vazio/null = preserva senha atual no update; obrigatório no POST. */
  senha: string | null;
  cro: string; especialidade: string; disponibilidade: number;
  idColaborador: number | null;
}

export interface ColaboradorDTO {
  idColaborador: number; nome: string; cpf: string;
  email: string; cargo: string; disponibilidade: number;
}

export interface ColaboradorRequestDTO {
  nome: string; cpf: string; email: string;
  /** Vazio/null = preserva senha atual no update; obrigatório no POST. */
  senha: string | null;
  cargo: string; disponibilidade: number;
}

export interface CampanhaDTO {
  idCampanha: number; nome: string; local: string;
  dataInicio: string; dataFim: string; idColaborador: number;
}

export interface CampanhaRequestDTO {
  nome: string; local: string;
  dataInicio: string; dataFim: string; idColaborador: number;
}

export interface ExameDTO {
  idExame: number; tipo: string; requisitos: string;
  resultado: string; idAtendimento: number;
}

export interface AtendimentoDTO {
  idAtendimento: number; idPaciente: number; nomePaciente: string;
  idDentista: number; nomeDentista: string; idCampanha: number;
  nomeCampanha: string; data: string; status: string;
  tipo: string; observacoes: string;
}

export interface AtendimentoRequestDTO {
  data: string; tipo: string; status: string; observacoes: string;
  idPaciente: number; idDentista: number; idCampanha: number;
}

export interface NotificacaoDTO {
  idNotificacao: number; mensagem: string; dataEnvio: string;
  statusEnvio: string; canal: string;
  idDentista: number | null; idColaborador: number | null;
  idPaciente: number | null; dataLeitura: string | null;
  nomeDentista: string | null;
  nomeColaborador: string | null;
  nomePaciente: string | null;
}

export interface NotificacaoRequestDTO {
  mensagem: string;
  idDentista: number | null;
  idColaborador: number | null;
  idPaciente: number | null;
  dataEnvio?: string | null;
  statusEnvio?: string | null;
  canal?: string | null;
}

// ─── Endpoint calls ──────────────────────────────────────────────────────────

export const api = {
  login: (email: string, senha: string) =>
    http.post<LoginResponseDTO>("/api/login", { email, senha }),

  listPacientes: () => http.get<PacienteDTO[]>("/api/pacientes"),
  createPaciente: (req: PacienteRequestDTO) =>
    http.post<PacienteDTO>("/api/pacientes", req),
  updatePaciente: (id: number, req: PacienteRequestDTO) =>
    http.put<PacienteDTO>(`/api/pacientes/${id}`, req),
  deletePaciente: (id: number) =>
    http.del(`/api/pacientes/${id}`),

  listDentistas: () => http.get<DentistaDTO[]>("/api/dentistas"),
  getDentista: (id: number) => http.get<DentistaDTO>(`/api/dentistas/${id}`),
  createDentista: (req: DentistaRequestDTO) =>
    http.post<DentistaDTO>("/api/dentistas", req),
  updateDentista: (id: number, req: DentistaRequestDTO) =>
    http.put<DentistaDTO>(`/api/dentistas/${id}`, req),
  deleteDentista: (id: number) =>
    http.del(`/api/dentistas/${id}`),

  listColaboradores: () => http.get<ColaboradorDTO[]>("/api/colaboradores"),
  createColaborador: (req: ColaboradorRequestDTO) =>
    http.post<ColaboradorDTO>("/api/colaboradores", req),
  updateColaborador: (id: number, req: ColaboradorRequestDTO) =>
    http.put<ColaboradorDTO>(`/api/colaboradores/${id}`, req),
  deleteColaborador: (id: number) =>
    http.del(`/api/colaboradores/${id}`),

  listCampanhas: () => http.get<CampanhaDTO[]>("/api/campanhas"),
  createCampanha: (req: CampanhaRequestDTO) =>
    http.post<CampanhaDTO>("/api/campanhas", req),
  updateCampanha: (id: number, req: CampanhaRequestDTO) =>
    http.put<CampanhaDTO>(`/api/campanhas/${id}`, req),
  deleteCampanha: (id: number) =>
    http.del(`/api/campanhas/${id}`),

  listExames: () => http.get<ExameDTO[]>("/api/exames"),
  createExame: (req: { tipo: string; requisitos: string; resultado: string; idAtendimento: number }) =>
    http.post<ExameDTO>("/api/exames", req),

  listAtendimentos: () => http.get<AtendimentoDTO[]>("/api/atendimentos"),
  createAtendimento: (req: AtendimentoRequestDTO) =>
    http.post<AtendimentoDTO>("/api/atendimentos", req),
  updateAtendimento: (id: number, req: AtendimentoRequestDTO) =>
    http.put<AtendimentoDTO>(`/api/atendimentos/${id}`, req),
  updateExame: (id: number, req: { tipo: string; requisitos: string; resultado: string; idAtendimento: number }) =>
    http.put<ExameDTO>(`/api/exames/${id}`, req),

  listNotificacoes: () => http.get<NotificacaoDTO[]>("/api/notificacoes"),
  getNotificacao: (id: number) =>
    http.get<NotificacaoDTO>(`/api/notificacoes/${id}`),
  createNotificacao: (req: NotificacaoRequestDTO) =>
    http.post<NotificacaoDTO>("/api/notificacoes", req),
  marcarNotificacaoLida: (id: number) =>
    http.patch<NotificacaoDTO>(`/api/notificacoes/${id}/lida`, {}),

  listAnotacoes: (sobreTipo: AnotacaoSobreTipo, sobreId: number) =>
    http.get<AnotacaoDTO[]>(
      `/api/anotacoes?sobreTipo=${encodeURIComponent(sobreTipo)}&sobreId=${sobreId}`,
    ),
  createAnotacao: (req: AnotacaoRequestDTO) =>
    http.post<AnotacaoDTO>("/api/anotacoes", req),

  listSolicitacoes: () => http.get<SolicitacaoDTO[]>("/api/solicitacoes"),
  createSolicitacao: (req: SolicitacaoRequestDTO) =>
    http.post<SolicitacaoDTO>("/api/solicitacoes", req),
  revisarSolicitacao: (id: number, req: SolicitacaoReviewRequestDTO) =>
    http.patch<SolicitacaoDTO>(`/api/solicitacoes/${id}/revisao`, req),
  deleteSolicitacao: (id: number) =>
    http.del(`/api/solicitacoes/${id}`),
};

export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada";

export interface SolicitacaoDTO {
  idSolicitacao: number;
  /** Null quando vem de fora (pedido de cadastro pela tela de login). */
  idSolicitante: number | null;
  nomeSolicitante: string | null;
  tipo: string; descricao: string; status: StatusSolicitacao;
  dataSolicitacao: string;
  idRevisor: number | null; nomeRevisor: string | null;
  dataRevisao: string | null; comentarioRevisao: string | null;
  nomeExterno: string | null;
  cpfExterno: string | null;
  emailExterno: string | null;
  senhaExterno: string | null;
  telefoneExterno: string | null;
  /** Quando uma solicitação externa é aprovada, o id do colaborador recém-criado. */
  idColaboradorCriado: number | null;
}

export interface SolicitacaoRequestDTO {
  /** Null se for pedido externo (cadastro). */
  idSolicitante: number | null;
  tipo: string;
  descricao: string;
  nomeExterno: string | null;
  cpfExterno: string | null;
  emailExterno: string | null;
  senhaExterno: string | null;
  telefoneExterno: string | null;
}

export interface SolicitacaoReviewRequestDTO {
  status: "aprovada" | "rejeitada"; idRevisor: number;
  comentario: string | null;
  /** Obrigatório ao aprovar uma solicitação externa (define o cargo do novo colaborador). */
  cargo: string | null;
}

export type AnotacaoAutorTipo = "dentista" | "colaborador";
export type AnotacaoSobreTipo = "dentista" | "paciente" | "atendimento";

export interface AnotacaoDTO {
  idAnotacao: number; texto: string; data: string;
  autorTipo: AnotacaoAutorTipo; autorId: number;
  sobreTipo: AnotacaoSobreTipo; sobreId: number;
}

export interface AnotacaoRequestDTO {
  texto: string; data?: string | null;
  autorTipo: AnotacaoAutorTipo; autorId: number;
  sobreTipo: AnotacaoSobreTipo; sobreId: number;
}
