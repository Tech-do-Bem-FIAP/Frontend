import { api } from "../api/resources";
import type { CampanhaDTO, AnotacaoSobreTipo } from "../api/resources";
import {
  toPaciente, toDentista, toAtendimento, toNotificacao, toAnotacao,
  toCampanha, toColaborador, toSolicitacao,
  buildColToDenRequest, buildDenToPacRequest, buildAnotacaoRequest,
  buildPacienteRequest, buildCampanhaRequest, buildDentistaRequest,
  buildColaboradorRequest, buildSolicitacaoRequest, buildSolicitacaoExternaRequest,
} from "../api/adapters";
import type {
  Paciente, Dentista, Atendimento, Notificacao, Anotacao, UserRole,
  Campanha, Colaborador, Solicitacao,
} from "../types";

export async function login(email: string, senha: string) {
  const r = await api.login(email, senha);
  const cargo =
    r.role === "colaborador" && r.cargo
      ? (r.cargo as import("../types").CargoColaborador)
      : null;
  return { id: r.id, nome: r.nome, email: r.email, role: r.role as UserRole, cargo };
}

export async function getPacientesByDentista(dentistaId: number): Promise<Paciente[]> {
  const list = await api.listPacientes();
  return list.map(toPaciente).filter((p) => p.id_dentista === dentistaId);
}

export async function getTodosPacientes(): Promise<Paciente[]> {
  const list = await api.listPacientes();
  return list.map(toPaciente);
}

export async function criarPaciente(p: Omit<Paciente, "id">): Promise<Paciente> {
  const dto = await api.createPaciente(buildPacienteRequest(p));
  return toPaciente(dto);
}

export async function atualizarPaciente(id: number, p: Omit<Paciente, "id">): Promise<Paciente> {
  const dto = await api.updatePaciente(id, buildPacienteRequest(p));
  return toPaciente(dto);
}

export async function excluirPaciente(id: number): Promise<void> {
  await api.deletePaciente(id);
}

export async function getDentistasByColaborador(colaboradorId: number): Promise<Dentista[]> {
  const list = await api.listDentistas();
  return list.map(toDentista).filter((d) => d.id_colaborador === colaboradorId);
}

export async function getTodosDentistas(): Promise<Dentista[]> {
  const list = await api.listDentistas();
  return list.map(toDentista);
}

export async function criarDentista(
  d: Omit<Dentista, "id">,
  senha: string,
): Promise<Dentista> {
  const dto = await api.createDentista(buildDentistaRequest(d, senha));
  return toDentista(dto);
}

export async function atualizarDentista(
  id: number,
  d: Omit<Dentista, "id">,
  novaSenha: string | null,
): Promise<Dentista> {
  const dto = await api.updateDentista(id, buildDentistaRequest(d, novaSenha));
  return toDentista(dto);
}

export async function excluirDentista(id: number): Promise<void> {
  await api.deleteDentista(id);
}

export async function getTodosColaboradores(): Promise<Colaborador[]> {
  const list = await api.listColaboradores();
  return list.map(toColaborador);
}

export async function criarColaborador(
  c: Omit<Colaborador, "id">,
  senha: string,
): Promise<Colaborador> {
  const dto = await api.createColaborador(buildColaboradorRequest(c, senha));
  return toColaborador(dto);
}

export async function atualizarColaborador(
  id: number,
  c: Omit<Colaborador, "id">,
  novaSenha: string | null,
): Promise<Colaborador> {
  const dto = await api.updateColaborador(id, buildColaboradorRequest(c, novaSenha));
  return toColaborador(dto);
}

export async function excluirColaborador(id: number): Promise<void> {
  await api.deleteColaborador(id);
}

export async function getTodasSolicitacoes(): Promise<Solicitacao[]> {
  const list = await api.listSolicitacoes();
  return list.map(toSolicitacao);
}

export async function criarSolicitacao(args: {
  idSolicitante: number; tipo: string; descricao: string;
}): Promise<Solicitacao> {
  const dto = await api.createSolicitacao(buildSolicitacaoRequest(args));
  return toSolicitacao(dto);
}

export async function solicitarCadastroExterno(args: {
  nome: string; cpf: string; email: string; senha: string; telefone: string;
  descricao: string;
}): Promise<Solicitacao> {
  const dto = await api.createSolicitacao(buildSolicitacaoExternaRequest(args));
  return toSolicitacao(dto);
}

export async function aprovarSolicitacao(
  id: number, idRevisor: number, comentario: string | null,
  cargo: string | null = null,
): Promise<Solicitacao> {
  const dto = await api.revisarSolicitacao(id, {
    status: "aprovada", idRevisor, comentario, cargo,
  });
  return toSolicitacao(dto);
}

export async function rejeitarSolicitacao(
  id: number, idRevisor: number, comentario: string | null,
): Promise<Solicitacao> {
  const dto = await api.revisarSolicitacao(id, {
    status: "rejeitada", idRevisor, comentario, cargo: null,
  });
  return toSolicitacao(dto);
}

export async function excluirSolicitacao(id: number): Promise<void> {
  await api.deleteSolicitacao(id);
}

export async function getDentistaColaboradorId(dentistaId: number): Promise<number | null> {
  const d = await api.getDentista(dentistaId);
  return d.idColaborador;
}

export async function getAtendimentosByDentista(dentistaId: number): Promise<Atendimento[]> {
  const [ats, exames] = await Promise.all([api.listAtendimentos(), api.listExames()]);
  return ats
    .filter((a) => a.idDentista === dentistaId)
    .map((a) => toAtendimento(a, exames));
}

export interface NovoAtendimento {
  id_paciente: number;
  dt_atendimento: string;
  tipo: string;
  status: string;
  observacoes: string;
  addExame: boolean;
  exame_tipo: string;
  exame_requisitos: string;
}

interface AtendimentoEdit {
  status: Atendimento["status"];
  observacoes: string;
  dt_atendimento: string;
}

export async function atualizarAtendimento(
  original: AtendimentoApiOriginal,
  campos: AtendimentoEdit,
): Promise<void> {
  await api.updateAtendimento(original.id, {
    data: campos.dt_atendimento,
    tipo: original.tipo,
    status: campos.status,
    observacoes: campos.observacoes,
    idPaciente: original.idPaciente,
    idDentista: original.idDentista,
    idCampanha: original.idCampanha,
  });
}

export interface AtendimentoApiOriginal {
  id: number;
  tipo: string;
  idPaciente: number;
  idDentista: number;
  idCampanha: number;
}

export async function lancarResultadoExame(
  idExame: number,
  tipo: string,
  requisitos: string,
  resultado: string,
  idAtendimento: number,
): Promise<void> {
  await api.updateExame(idExame, { tipo, requisitos, resultado, idAtendimento });
}

export async function adicionarExameAoAtendimento(
  idAtendimento: number,
  tipo: string,
  requisitos: string,
): Promise<void> {
  await api.createExame({ tipo, requisitos, resultado: "", idAtendimento });
}

export async function saveAtendimento(form: NovoAtendimento, dentistaId: number): Promise<void> {
  const campanhas: CampanhaDTO[] = await api.listCampanhas();
  if (campanhas.length === 0) throw new Error("SEM_CAMPANHA");
  const created = await api.createAtendimento({
    data: form.dt_atendimento,
    tipo: form.tipo,
    status: form.status,
    observacoes: form.observacoes,
    idPaciente: form.id_paciente,
    idDentista: dentistaId,
    idCampanha: campanhas[0].idCampanha,
  });
  if (form.addExame && form.exame_tipo.trim()) {
    await api.createExame({
      tipo: form.exame_tipo,
      requisitos: form.exame_requisitos,
      resultado: "",
      idAtendimento: created.idAtendimento,
    });
  }
}

export async function getTodasCampanhas(): Promise<Campanha[]> {
  const list = await api.listCampanhas();
  return list.map(toCampanha);
}

export async function criarCampanha(c: Omit<Campanha, "id">): Promise<Campanha> {
  const dto = await api.createCampanha(buildCampanhaRequest(c));
  return toCampanha(dto);
}

export async function atualizarCampanha(id: number, c: Omit<Campanha, "id">): Promise<Campanha> {
  const dto = await api.updateCampanha(id, buildCampanhaRequest(c));
  return toCampanha(dto);
}

export async function excluirCampanha(id: number): Promise<void> {
  await api.deleteCampanha(id);
}

async function listAll(): Promise<Notificacao[]> {
  const dtos = await api.listNotificacoes();
  return dtos
    .map(toNotificacao)
    .filter((n): n is Notificacao => n != null)
    .sort((a, b) => b.data_envio.localeCompare(a.data_envio));
}

export async function getNotificacoesRecebidasDentista(
  dentistaId: number,
): Promise<Notificacao[]> {
  const all = await listAll();
  return all.filter((n) => n.tipo === "col_to_den" && n.id_dentista === dentistaId);
}

export async function getNotificacoesEnviadasColaborador(
  colaboradorId: number,
): Promise<Notificacao[]> {
  const all = await listAll();
  return all.filter(
    (n) => n.tipo === "col_to_den" && n.id_colaborador === colaboradorId,
  );
}

export async function getNotificacoesEnviadasDentistaParaPacientes(
  dentistaId: number,
): Promise<Notificacao[]> {
  const all = await listAll();
  return all.filter(
    (n) => n.tipo === "den_to_pac" && n.id_dentista === dentistaId,
  );
}

export async function enviarColaboradorParaDentista(args: {
  mensagem: string; colaboradorId: number; dentistaId: number;
}): Promise<void> {
  await api.createNotificacao(buildColToDenRequest(args));
}

export async function enviarDentistaParaPaciente(args: {
  mensagem: string; dentistaId: number; pacienteId: number;
}): Promise<void> {
  await api.createNotificacao(buildDenToPacRequest(args));
}

export async function marcarNotificacaoLida(id: number): Promise<void> {
  await api.marcarNotificacaoLida(id);
}

export async function getAnotacoesSobre(
  sobreTipo: AnotacaoSobreTipo,
  sobreId: number,
): Promise<Anotacao[]> {
  const dtos = await api.listAnotacoes(sobreTipo, sobreId);
  return dtos.map(toAnotacao);
}

export async function saveAnotacao(a: Omit<Anotacao, "id">): Promise<Anotacao> {
  const created = await api.createAnotacao(buildAnotacaoRequest(a));
  return toAnotacao(created);
}
