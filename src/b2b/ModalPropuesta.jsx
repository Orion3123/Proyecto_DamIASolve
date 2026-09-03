import React, { useMemo, useState } from "react";
import {
  CANALES,
  generarPropuesta,
  enlaceMailto,
  enlaceWhatsApp,
} from "./propuestas";

/** Copia al portapapeles con alternativa para navegadores antiguos. */
async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Ventana de propuesta generada.
 *
 * El texto se puede editar antes de copiarlo: la plantilla es un punto de
 * partida, no un dogma. Si Damián sabe algo del negocio que la ficha no dice,
 * lo mejor que puede hacer es meterlo aquí a mano.
 */
export default function ModalPropuesta({ lead, oferta, perfil, onCerrar }) {
  const [canal, setCanal] = useState("email");
  const [copiado, setCopiado] = useState(false);

  const propuesta = useMemo(
    () =>
      generarPropuesta({
        lead,
        oferta,
        perfil,
        canal,
        senales: lead?.senales ?? [],
      }),
    [lead, oferta, perfil, canal]
  );

  const [texto, setTexto] = useState(propuesta.texto);
  const [canalActual, setCanalActual] = useState(canal);

  // Al cambiar de canal se regenera el texto, descartando ediciones manuales.
  if (canalActual !== canal) {
    setCanalActual(canal);
    setTexto(propuesta.texto);
    setCopiado(false);
  }

  if (!lead || !oferta) return null;

  const mailto = enlaceMailto(lead, propuesta.asunto, texto);
  const whatsapp = enlaceWhatsApp(lead, texto);

  const alCopiar = async () => {
    const completo = propuesta.asunto
      ? `Asunto: ${propuesta.asunto}\n\n${texto}`
      : texto;
    const ok = await copiar(completo);
    setCopiado(ok);
    if (ok) setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Propuesta para {lead.nombre}
            </h2>
            <p className="text-sm text-gray-500">
              {oferta.emoji} {oferta.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Aviso sobre el gancho usado */}
        {propuesta.gancho && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Antes de enviar:</strong> esta propuesta se apoya en la
              señal «{propuesta.gancho.etiqueta}», deducida de los datos del
              mapa. Compruébalo primero. El texto va en condicional a propósito,
              pero si te confirman que sí lo tienen, dales la razón sin discutir.
            </p>
          </div>
        )}

        {/* Selector de canal */}
        <div className="flex gap-2 px-5 pt-4">
          {CANALES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCanal(c.id)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                canal === c.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {c.emoji} {c.nombre}
            </button>
          ))}
        </div>

        {/* Texto editable */}
        <div className="p-5 overflow-y-auto flex-1">
          {propuesta.asunto && (
            <div className="mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Asunto
              </span>
              <p className="font-medium text-gray-900">{propuesta.asunto}</p>
            </div>
          )}
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={16}
            className="w-full text-sm font-mono border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Puedes editarlo antes de copiarlo. Si sabes algo del negocio que la
            ficha no dice, mételo aquí: personalizar de verdad multiplica la
            respuesta.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={alCopiar}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            {copiado ? "✓ Copiado" : "Copiar"}
          </button>

          {canal === "email" &&
            (mailto ? (
              <a
                href={mailto}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                Abrir en el correo
              </a>
            ) : (
              <span className="px-4 py-2 text-gray-400 text-sm">
                Sin email: copia el texto y búscalo en su web
              </span>
            ))}

          {canal === "whatsapp" &&
            (whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Abrir en WhatsApp
              </a>
            ) : (
              <span className="px-4 py-2 text-gray-400 text-sm">
                Sin teléfono válido para WhatsApp
              </span>
            ))}

          {canal === "llamada" && lead.telefono && (
            <a
              href={`tel:${lead.telefono.replace(/\s/g, "")}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              Llamar a {lead.telefono}
            </a>
          )}

          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-100 ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
