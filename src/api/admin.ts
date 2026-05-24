import { http } from "./client";

export interface AdminRebuildRequest {
  email: string;
  senha: string;
  confirmacao: string;
}

export interface AdminRebuildResponse {
  sucesso: boolean;
  statementsExecutados: number;
  statementsPulados: number;
  erros: string[];
}

export function reconstruirBanco(req: AdminRebuildRequest): Promise<AdminRebuildResponse> {
  return http.post<AdminRebuildResponse>("/api/admin/rebuild", req);
}
