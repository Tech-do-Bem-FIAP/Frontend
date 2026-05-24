import type {
  Paciente, Dentista, Atendimento, Notificacao, Exame, NotificacaoTipo, Anotacao,
  Campanha, Colaborador, CargoColaborador, Solicitacao, StatusSolicitacao,
} from "../types";
import type {
  PacienteDTO, PacienteRequestDTO, DentistaDTO, DentistaRequestDTO, AtendimentoDTO, ExameDTO,
  NotificacaoDTO, NotificacaoRequestDTO,
  AnotacaoDTO, AnotacaoRequestDTO,
  CampanhaDTO, CampanhaRequestDTO,
  ColaboradorDTO, ColaboradorRequestDTO,
  SolicitacaoDTO, SolicitacaoRequestDTO,
} from "./resources";

export function toPaciente(d: PacienteDTO): Paciente {
  return {
    id: d.idPaciente,
    nome: d.nome,
    cpf: d.cpf,
    data_nasc: d.dataNasc,
    telefone: d.telefone,
    email: d.email,
    id_dentista: d.idDentista,
    cep: d.cep ?? null,
    logradouro: d.logradouro ?? null,
    bairro: d.bairro ?? null,
    cidade: d.cidade ?? null,
    uf: d.uf ?? null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
  };
}

export function buildPacienteRequest(p: Omit<Paciente, "id">): PacienteRequestDTO {
  return {
    nome: p.nome,
    cpf: p.cpf,
    dataNasc: p.data_nasc,
    telefone: p.telefone,
    email: p.email,
    idDentista: p.id_dentista,
    cep: p.cep ?? null,
    logradouro: p.logradouro ?? null,
    bairro: p.bairro ?? null,
    cidade: p.cidade ?? null,
    uf: p.uf ?? null,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
  };
}

export function toColaborador(c: ColaboradorDTO): Colaborador {
  return {
    id: c.idColaborador,
    nome: c.nome,
    cpf: c.cpf,
    email: c.email,
    cargo: c.cargo as CargoColaborador,
    disponibilidade: c.disponibilidade,
  };
}

export function buildColaboradorRequest(
  c: Omit<Colaborador, "id">,
  senha: string | null,
): ColaboradorRequestDTO {
  return {
    nome: c.nome,
    cpf: c.cpf,
    email: c.email,
    senha,
    cargo: c.cargo,
    disponibilidade: c.disponibilidade,
  };
}

export function toCampanha(c: CampanhaDTO): Campanha {
  return {
    id: c.idCampanha,
    nome: c.nome,
    local: c.local,
    data_inicio: c.dataInicio,
    data_fim: c.dataFim,
    id_colaborador: c.idColaborador,
  };
}

export function buildCampanhaRequest(c: Omit<Campanha, "id">): CampanhaRequestDTO {
  return {
    nome: c.nome,
    local: c.local,
    dataInicio: c.data_inicio,
    dataFim: c.data_fim,
    idColaborador: c.id_colaborador,
  };
}

export function toDentista(d: DentistaDTO): Dentista {
  return {
    id: d.idDentista,
    nome: d.nome,
    cpf: d.cpf,
    email: d.email,
    cro: d.cro,
    especialidade: d.especialidade,
    disponibilidade: d.disponibilidade,
    id_colaborador: d.idColaborador,
  };
}

export function buildDentistaRequest(
  d: Omit<Dentista, "id">,
  senha: string | null,
): DentistaRequestDTO {
  return {
    nome: d.nome,
    cpf: d.cpf,
    email: d.email,
    senha,
    cro: d.cro,
    especialidade: d.especialidade,
    disponibilidade: d.disponibilidade,
    idColaborador: d.id_colaborador,
  };
}

function toExame(e: ExameDTO): Exame {
  return { id: e.idExame, tipo: e.tipo, requisitos: e.requisitos, resultado: e.resultado };
}

/** Backend grava status em lowercase ('agendado'/'realizado'/'cancelado'). */
function normalizeStatus(s: string): Atendimento["status"] {
  const lower = (s ?? "").toLowerCase();
  if (lower === "agendado") return "Agendado";
  if (lower === "realizado") return "Realizado";
  if (lower === "cancelado") return "Cancelado";
  return "Agendado";
}

export function toAtendimento(a: AtendimentoDTO, exames: ExameDTO[]): Atendimento {
  return {
    id: a.idAtendimento,
    id_paciente: a.idPaciente,
    id_dentista: a.idDentista,
    id_campanha: a.idCampanha,
    nome_campanha: a.nomeCampanha,
    dt_atendimento: a.data,
    tipo: a.tipo as Atendimento["tipo"],
    status: normalizeStatus(a.status),
    observacoes: a.observacoes,
    exames: exames.filter((e) => e.idAtendimento === a.idAtendimento).map(toExame),
  };
}

/** Infere a direção da notificação pelas FKs preenchidas. */
function inferTipo(dto: NotificacaoDTO): NotificacaoTipo | null {
  const hasDen = dto.idDentista != null;
  const hasCol = dto.idColaborador != null;
  const hasPac = dto.idPaciente != null;
  if (hasCol && hasDen && !hasPac) return "col_to_den";
  if (hasDen && hasPac && !hasCol) return "den_to_pac";
  return null;
}

export function toNotificacao(n: NotificacaoDTO): Notificacao | null {
  const tipo = inferTipo(n);
  if (!tipo) return null; // ignora registros com direção indefinida
  return {
    id: n.idNotificacao,
    mensagem: n.mensagem,
    data_envio: n.dataEnvio,
    data_leitura: n.dataLeitura,
    tipo,
    id_dentista: n.idDentista,
    id_colaborador: n.idColaborador,
    id_paciente: n.idPaciente,
    nome_dentista: n.nomeDentista,
    nome_colaborador: n.nomeColaborador,
    nome_paciente: n.nomePaciente,
  };
}

export function buildColToDenRequest(args: {
  mensagem: string; colaboradorId: number; dentistaId: number;
}): NotificacaoRequestDTO {
  return {
    mensagem: args.mensagem,
    idColaborador: args.colaboradorId,
    idDentista: args.dentistaId,
    idPaciente: null,
  };
}

export function buildDenToPacRequest(args: {
  mensagem: string; dentistaId: number; pacienteId: number;
}): NotificacaoRequestDTO {
  return {
    mensagem: args.mensagem,
    idDentista: args.dentistaId,
    idPaciente: args.pacienteId,
    idColaborador: null,
  };
}

export function toAnotacao(a: AnotacaoDTO): Anotacao {
  return {
    id: a.idAnotacao,
    texto: a.texto,
    data: a.data,
    autor_tipo: a.autorTipo,
    autor_id: a.autorId,
    sobre_tipo: a.sobreTipo,
    sobre_id: a.sobreId,
  };
}

export function toSolicitacao(s: SolicitacaoDTO): Solicitacao {
  return {
    id: s.idSolicitacao,
    id_solicitante: s.idSolicitante,
    nome_solicitante: s.nomeSolicitante,
    tipo: s.tipo,
    descricao: s.descricao,
    status: s.status as StatusSolicitacao,
    data_solicitacao: s.dataSolicitacao,
    id_revisor: s.idRevisor,
    nome_revisor: s.nomeRevisor,
    data_revisao: s.dataRevisao,
    comentario_revisao: s.comentarioRevisao,
    nome_externo: s.nomeExterno,
    cpf_externo: s.cpfExterno,
    email_externo: s.emailExterno,
    senha_externo: s.senhaExterno,
    telefone_externo: s.telefoneExterno,
    id_colaborador_criado: s.idColaboradorCriado,
  };
}

export function buildSolicitacaoRequest(args: {
  idSolicitante: number; tipo: string; descricao: string;
}): SolicitacaoRequestDTO {
  return {
    idSolicitante: args.idSolicitante,
    tipo: args.tipo,
    descricao: args.descricao,
    nomeExterno: null,
    cpfExterno: null,
    emailExterno: null,
    senhaExterno: null,
    telefoneExterno: null,
  };
}

export function buildSolicitacaoExternaRequest(args: {
  nome: string; cpf: string; email: string; senha: string; telefone: string;
  descricao: string;
}): SolicitacaoRequestDTO {
  return {
    idSolicitante: null,
    tipo: "cadastro_externo",
    descricao: args.descricao,
    nomeExterno: args.nome,
    cpfExterno: args.cpf,
    emailExterno: args.email,
    senhaExterno: args.senha,
    telefoneExterno: args.telefone || null,
  };
}

export function buildAnotacaoRequest(a: Omit<Anotacao, "id">): AnotacaoRequestDTO {
  return {
    texto: a.texto,
    data: a.data,
    autorTipo: a.autor_tipo,
    autorId: a.autor_id,
    sobreTipo: a.sobre_tipo,
    sobreId: a.sobre_id,
  };
}
