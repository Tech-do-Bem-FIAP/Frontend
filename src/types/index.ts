export type UserRole = 'dentista' | 'colaborador';

export type CargoColaborador = 'Administrador' | 'Coordenador' | 'Auxiliar' | 'Estagiário';

export const NIVEL_CARGO: Record<CargoColaborador, number> = {
  Estagiário: 1,
  Auxiliar: 2,
  Coordenador: 3,
  Administrador: 4,
};

/** Helper pra checar nível mínimo do cargo logado. */
export function temNivel(cargo: CargoColaborador | null | undefined, minimo: number): boolean {
  if (!cargo) return false;
  return (NIVEL_CARGO[cargo] ?? 0) >= minimo;
}

export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  role: UserRole;
  /** Só presente quando role === 'colaborador'. */
  cargo: CargoColaborador | null;
}

export interface Dentista {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  cro: string;
  especialidade: string;
  disponibilidade: number;
  id_colaborador: number | null;
}

export interface Paciente {
  id: number;
  nome: string;
  cpf: string | null;
  data_nasc: string;
  telefone: string;
  email: string;
  id_dentista: number;
  /** Campos de endereço/geolocalização — opcionais (null pra pacientes sem geocoding). */
  cep?: string | null;
  logradouro?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Intersection Type — Paciente que já possui coordenadas e endereço resolvidos.
 * Usado em telas que exigem geolocalização garantida (ex: mapa, página de área).
 */
export type PacienteGeolocalizado = Paciente & {
  coords: { lat: number; lng: number };
  endereco: { cep: string; bairro: string; cidade: string; uf: string };
};

/** Type guard — verifica se o paciente possui coordenadas + endereço completos. */
export function temGeolocalizacao(p: Paciente): boolean {
  return (
    p.latitude != null &&
    p.longitude != null &&
    p.bairro != null &&
    p.cep != null &&
    p.cidade != null &&
    p.uf != null
  );
}

/**
 * Constrói um PacienteGeolocalizado a partir de um Paciente, retornando null
 * caso falte algum campo obrigatório. Útil pra mapear listas pro mapa.
 */
export function toPacienteGeolocalizado(p: Paciente): PacienteGeolocalizado | null {
  if (!temGeolocalizacao(p)) return null;
  return {
    ...p,
    coords: { lat: p.latitude as number, lng: p.longitude as number },
    endereco: {
      cep: p.cep as string,
      bairro: p.bairro as string,
      cidade: p.cidade as string,
      uf: p.uf as string,
    },
  };
}

export interface Colaborador {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  cargo: CargoColaborador;
  disponibilidade: number;
}

export interface Campanha {
  id: number;
  nome: string;
  local: string;
  data_inicio: string;
  data_fim: string;
  id_colaborador: number;
}

export type TipoAtendimento = 'Consulta' | 'Retorno' | 'Emergência' | 'Procedimento';
export type StatusAtendimento = 'Agendado' | 'Realizado' | 'Cancelado';

export interface Exame {
  id: number;
  tipo: string;
  requisitos: string;
  resultado: string;
}

export interface Atendimento {
  id: number;
  id_paciente: number;
  id_dentista: number;
  id_campanha: number;
  nome_campanha: string;
  dt_atendimento: string;
  tipo: TipoAtendimento;
  status: StatusAtendimento;
  observacoes: string;
  exames: Exame[];
}

/** Direção da notificação — inferida pelas FKs preenchidas no backend. */
export type NotificacaoTipo = 'col_to_den' | 'den_to_pac';

export interface Notificacao {
  id: number;
  mensagem: string;
  data_envio: string;
  data_leitura: string | null; // null = não lida (ou irrelevante p/ den→pac)
  tipo: NotificacaoTipo;
  id_dentista: number | null;
  id_colaborador: number | null;
  id_paciente: number | null;
  nome_dentista: string | null;
  nome_colaborador: string | null;
  nome_paciente: string | null;
}

export type StatusSolicitacao = 'pendente' | 'aprovada' | 'rejeitada';

export interface Solicitacao {
  id: number;
  /** Null quando o solicitante é externo (cadastro pela tela de login). */
  id_solicitante: number | null;
  nome_solicitante: string | null;
  tipo: string;
  descricao: string;
  status: StatusSolicitacao;
  data_solicitacao: string;
  id_revisor: number | null;
  nome_revisor: string | null;
  data_revisao: string | null;
  comentario_revisao: string | null;
  /** Dados de quem ainda não é colaborador (presentes quando id_solicitante é null). */
  nome_externo: string | null;
  cpf_externo: string | null;
  email_externo: string | null;
  senha_externo: string | null;
  telefone_externo: string | null;
  /** Colaborador recém-criado ao aprovar uma solicitação externa. */
  id_colaborador_criado: number | null;
}

export interface Anotacao {
  id: number;
  texto: string;
  data: string;
  autor_id: number;
  autor_tipo: UserRole;
  sobre_tipo: 'dentista' | 'paciente' | 'atendimento';
  sobre_id: number;
}
