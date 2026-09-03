import React, { useState } from "react";
import { etiquetaScore } from "./senales";
import { nombreSector } from "./sectores";
import { ESTADOS } from "./almacen";

const CLASES_TONO = {
  rojo: "bg-red-50 text-red-700 border-red-200",
  ambar: "bg-amber-50 text-amber-800 border-amber-200",
  gris: "bg-gray-50 text-gray-600 border-gray-200",
};

/** Búsqueda en Google del negocio, para verificar una señal antes de usarla. */
function enlaceVerificacion(lead) {
  const consulta = `"${lead.nombre}" ${lead.ciudad ?? ""}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(consulta)}`;
}

/**
 * Tarjeta de un cliente potencial.
 *
 * Muestra el score pero nunca solo el score: al lado van siempre los motivos en
 * texto, para que Damián pueda discrepar de la máquina con criterio propio.
 */
export default function FichaLead({
  lead,
  guardado = false,
  yaGuardado = false,
  onGuardar,
  onPropuesta,
  onCambiarEstado,
  onCambiarNotas,
  onBorrar,
}) {
  const [abierto, setAbierto] = useState(false);
  const [editandoNotas, setEditandoNotas] = useState(false);
  const insignia = etiquetaScore(lead.score ?? 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{lead.nombre}</h3>
          <p className="text-sm text-gray-500">
            {nombreSector(lead.sector)}
            {lead.ciudad ? ` · ${lead.ciudad}` : ""}
          </p>
          {lead.direccion && (
            <p className="text-sm text-gray-500 truncate">{lead.direccion}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900">{lead.score ?? 0}</div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${insignia.clase}`}>
            {insignia.texto}
          </span>
        </div>
      </div>

      {/* Datos de contacto disponibles */}
      <div className="flex flex-wrap gap-3 mt-3 text-sm">
        {lead.telefono ? (
          <a
            href={`tel:${lead.telefono.replace(/\s/g, "")}`}
            className="text-blue-600 hover:underline"
          >
            📞 {lead.telefono}
          </a>
        ) : (
          <span className="text-gray-400">📞 sin teléfono</span>
        )}

        {lead.email ? (
          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
            ✉️ {lead.email}
          </a>
        ) : (
          <span className="text-gray-400">✉️ sin email</span>
        )}

        {lead.web ? (
          <a
            href={lead.web}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            🌐 web
          </a>
        ) : (
          <span className="text-gray-400">🌐 sin web</span>
        )}

        {lead.mapsUrl && (
          <a
            href={lead.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📍 mapa
          </a>
        )}
      </div>

      {/* Señales detectadas */}
      {lead.senales?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {lead.senales.map((senal) => (
            <span
              key={senal.id}
              title={senal.explicacion}
              className={`text-xs px-2 py-1 rounded border ${
                CLASES_TONO[senal.tono] ?? CLASES_TONO.gris
              }`}
            >
              {senal.etiqueta}
            </span>
          ))}
        </div>
      )}

      {/* Aviso permanente: las señales son hipótesis, no hechos */}
      {lead.senales?.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Señales sin verificar, deducidas de los datos del mapa.{" "}
          <a
            href={enlaceVerificacion(lead)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            Comprobar en Google →
          </a>
        </p>
      )}

      {/* Estado y notas, solo para leads ya guardados */}
      {guardado && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS.map((estado) => (
              <button
                key={estado.id}
                type="button"
                onClick={() => onCambiarEstado?.(lead.id, estado.id)}
                className={`text-xs px-2 py-1 rounded-full transition-opacity ${
                  lead.estado === estado.id
                    ? estado.clase
                    : "bg-white text-gray-400 border border-gray-200 hover:border-gray-400"
                }`}
              >
                {estado.nombre}
              </button>
            ))}
          </div>

          {editandoNotas ? (
            <textarea
              autoFocus
              defaultValue={lead.notas ?? ""}
              onBlur={(e) => {
                onCambiarNotas?.(lead.id, e.target.value);
                setEditandoNotas(false);
              }}
              rows={3}
              placeholder="Qué habéis hablado, cuándo volver a llamar…"
              className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditandoNotas(true)}
              className="text-sm text-left w-full text-gray-600 hover:text-gray-900"
            >
              {lead.notas ? `📝 ${lead.notas}` : "📝 Añadir nota…"}
            </button>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => onPropuesta?.(lead)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Generar propuesta
        </button>

        {!guardado &&
          (lead.persistible === false ? (
            <span
              className="px-3 py-1.5 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed"
              title="Las condiciones de Google no permiten almacenar sus resultados. Copia la propuesta ahora o cambia al motor de OpenStreetMap."
            >
              No se puede guardar
            </span>
          ) : yaGuardado ? (
            // Sin este estado, el botón seguiría pareciendo pulsable y no
            // haría nada, que es la peor combinación posible.
            <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg">
              ✓ Ya está en tus leads
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onGuardar?.(lead)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              Guardar
            </button>
          ))}

        {guardado && (
          <button
            type="button"
            onClick={() => onBorrar?.(lead.id)}
            className="px-3 py-1.5 text-red-600 text-sm rounded-lg hover:bg-red-50"
          >
            Borrar
          </button>
        )}

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="px-3 py-1.5 text-gray-500 text-sm rounded-lg hover:bg-gray-100 ml-auto"
        >
          {abierto ? "Ocultar detalle" : "¿Por qué esta nota?"}
        </button>
      </div>

      {/* Desglose del score: la máquina explica su razonamiento */}
      {abierto && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-2">
          <div className="flex gap-4 text-gray-600">
            <span>
              Encaje con tu oferta: <strong>{lead.encaje ?? 0}</strong>/100
            </span>
            <span>
              Facilidad de contacto: <strong>{lead.contactabilidad ?? 0}</strong>/100
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Nota final = 65 % encaje + 35 % facilidad de contacto.
          </p>
          <ul className="space-y-1">
            {(lead.motivos ?? []).map((motivo) => (
              <li key={motivo.texto} className="text-gray-600">
                · {motivo.texto}
                {motivo.peso > 0 && (
                  <span className="text-gray-400"> (+{motivo.peso})</span>
                )}
                <span className="block text-xs text-gray-400 ml-3">
                  {motivo.explicacion}
                </span>
              </li>
            ))}
          </ul>
          {lead.fuente && (
            <p className="text-xs text-gray-400">
              Fuente:{" "}
              {lead.fuente === "osm"
                ? "OpenStreetMap"
                : lead.fuente === "google"
                ? "Google Places"
                : "datos de ejemplo"}
              {lead.osmUrl && (
                <>
                  {" · "}
                  <a
                    href={lead.osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    ver ficha original
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
