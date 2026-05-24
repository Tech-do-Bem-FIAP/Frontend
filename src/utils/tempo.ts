export function tempoRelativo(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const agora = Date.now();
  const diffMs = agora - dt.getTime();
  if (diffMs < 0) {

    return dt.toLocaleDateString("pt-BR");
  }
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return dt.toLocaleDateString("pt-BR");
}

export function tempoExato(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
