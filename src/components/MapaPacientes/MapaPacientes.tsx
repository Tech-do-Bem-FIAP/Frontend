import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router";
import type { PacienteGeolocalizado } from "../../types";

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

  center?: [number, number];

  zoom?: number;
}

export function MapaPacientes({
  pacientes,
  center = [-23.55, -46.63],
  zoom = 11,
}: Props) {
  return (
    <div className="isolate w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
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
