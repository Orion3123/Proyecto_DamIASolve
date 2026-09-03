/**
 * Exportación a CSV.
 *
 * Se usa `;` como separador y se añade BOM UTF-8 porque es lo que necesita
 * Excel en español para abrir el fichero en columnas y con los acentos bien.
 * Con `,` y sin BOM, Damián vería todo en una sola columna y con caracteres
 * rotos, que es la forma más rápida de que una función de exportar no se use.
 */
import { nombreSector } from "./sectores";

const COLUMNAS = [
  { cabecera: "Nombre", valor: (l) => l.nombre },
  { cabecera: "Sector", valor: (l) => nombreSector(l.sector) },
  { cabecera: "Ciudad", valor: (l) => l.ciudad },
  { cabecera: "Direccion", valor: (l) => l.direccion },
  { cabecera: "Telefono", valor: (l) => l.telefono },
  { cabecera: "Email", valor: (l) => l.email },
  { cabecera: "Web", valor: (l) => l.web },
  { cabecera: "Estado", valor: (l) => l.estado },
  { cabecera: "Notas", valor: (l) => l.notas },
  { cabecera: "Senales", valor: (l) => (l.senalesTexto ?? []).join(" | ") },
  { cabecera: "Puntuacion", valor: (l) => l.score },
  { cabecera: "Fuente", valor: (l) => l.fuente },
  { cabecera: "Mapa", valor: (l) => l.mapsUrl },
];

/** Escapa un valor para CSV: comillas dobladas y campo entrecomillado. */
function escapar(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

/** Convierte una lista de leads en el texto CSV completo. */
export function generarCsv(leads) {
  const cabecera = COLUMNAS.map((c) => escapar(c.cabecera)).join(";");
  const filas = leads.map((lead) =>
    COLUMNAS.map((c) => escapar(c.valor(lead))).join(";")
  );
  return [cabecera, ...filas].join("\r\n");
}

/**
 * Genera el CSV y lanza la descarga en el navegador.
 * @returns {{ok: boolean, mensaje?: string}}
 */
export function descargarCsv(leads, nombreFichero = "leads-b2b-hunter.csv") {
  if (!leads || leads.length === 0) {
    return { ok: false, mensaje: "No hay leads que exportar." };
  }

  try {
    // El BOM (﻿) es lo que le dice a Excel que el fichero es UTF-8.
    const contenido = `﻿${generarCsv(leads)}`;
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreFichero;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    return { ok: true };
  } catch (error) {
    console.warn("[B2B Hunter] Fallo al exportar CSV:", error);
    return {
      ok: false,
      mensaje: "No se pudo generar el fichero. Prueba en otro navegador.",
    };
  }
}
