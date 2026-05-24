// Heatmap dos bairros classificados pelo modelo de ML.
// Renderiza um CircleMarker por bairro, com cor por classe de demanda
// (vermelho=Alta, amarelo=Media, verde=Baixa) e raio proporcional à
// probabilidade da classe predita. Cada bairro tem Popup com link pra
// /colaborador/area/:bairro.

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router";
import type { ClasseDemanda, RankingItem } from "../../api/ml";

const CORES: Record<ClasseDemanda, { fill: string; border: string }> = {
  Alta:  { fill: "#dc2626", border: "#7f1d1d" },
  Media: { fill: "#f59e0b", border: "#92400e" },
  Baixa: { fill: "#16a34a", border: "#14532d" },
};

interface Props {
  itens: RankingItem[];
  center?: [number, number];
  zoom?: number;
}

/** Raio mínimo 8px, máximo 22px, escalado pela probabilidade da classe predita. */
function calcRaio(item: RankingItem): number {
  const p = item.probabilidades[item.classe] ?? 0;
  return 8 + Math.round(p * 14);
}

export function HeatmapAreas({
  itens,
  center = [-23.55, -46.63],
  zoom = 11,
}: Props) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: "100%", height: "500px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {itens.map((it) => {
          const cor = CORES[it.classe];
          return (
            <CircleMarker
              key={it.bairro}
              center={[it.coords.lat, it.coords.lng]}
              radius={calcRaio(it)}
              pathOptions={{
                color: cor.border,
                fillColor: cor.fill,
                fillOpacity: 0.55,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{it.bairro}</p>
                  <p className="text-xs">
                    Demanda predita:{" "}
                    <span className="font-medium" style={{ color: cor.border }}>
                      {it.classe}
                    </span>{" "}
                    ({Math.round((it.probabilidades[it.classe] ?? 0) * 100)}%)
                  </p>
                  <Link
                    to={`/colaborador/area/${encodeURIComponent(it.bairro)}`}
                    className="text-xs text-blue-700 underline"
                  >
                    Ver detalhes do bairro
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
