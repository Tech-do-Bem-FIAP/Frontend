// Mapa Leaflet exibindo pacientes geolocalizados.
// Cada Marker abre Popup com link pra página do bairro (/colaborador/area/:bairro).

import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router";
import type { PacienteGeolocalizado } from "../../types";

// Fix do bug clássico do Leaflet com bundlers: o ícone padrão quebra porque
// o Leaflet tenta resolver os assets via URL relativa do CSS.
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  pacientes: PacienteGeolocalizado[];
  /** Centro inicial. Default: São Paulo. */
  center?: [number, number];
  /** Zoom inicial. Default: 11. */
  zoom?: number;
}

export function MapaPacientes({
  pacientes,
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
        {pacientes.map((p) => (
          <Marker key={p.id} position={[p.coords.lat, p.coords.lng]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{p.nome}</p>
                <p className="text-xs">
                  Bairro: <span className="font-medium">{p.endereco.bairro}</span>
                </p>
                <p className="text-xs">
                  {p.endereco.cidade}/{p.endereco.uf}
                </p>
                <Link
                  to={`/colaborador/area/${encodeURIComponent(p.endereco.bairro)}`}
                  className="text-xs text-blue-700 underline"
                >
                  Ver detalhes do bairro
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
