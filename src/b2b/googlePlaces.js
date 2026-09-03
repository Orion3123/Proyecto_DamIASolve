/**
 * Motor opcional: Google Places API (New).
 *
 * CUÁNDO USARLO
 * -------------
 * OpenStreetMap es el motor por defecto porque es gratis y sus datos se pueden
 * guardar. Google da mejor cobertura de comercio pequeño y rellena más
 * teléfonos y webs, pero:
 *
 *   · Es de pago. Los campos de teléfono y web pertenecen a los tramos de
 *     facturación más caros, así que la máscara de campos pide EXACTAMENTE lo
 *     que la app usa y nada más.
 *   · Sus condiciones NO permiten almacenar los resultados más de 30 días
 *     (salvo el identificador de sitio). Por eso los leads que salen de aquí se
 *     marcan `persistible: false` y la app no deja guardarlos.
 *
 * SOBRE LA CLAVE
 * --------------
 * La clave la introduce el usuario y se guarda solo en el localStorage de su
 * navegador. NUNCA se sube al repositorio. Al ir en una app de navegador, la
 * clave es visible para quien abra las herramientas de desarrollo, así que la
 * interfaz insiste en restringirla por referente HTTP y por API en la consola
 * de Google Cloud. Sin esa restricción, cualquiera que la vea puede gastar
 * dinero de la cuenta de Damián.
 */
import { sectorPorId } from "./sectores";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

/** Solo los campos que la aplicación muestra realmente. Afecta al coste. */
const CAMPOS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.location",
  "places.regularOpeningHours.openNow",
  "places.googleMapsUri",
].join(",");

/** Google limita `searchText` a 20 resultados por petición. */
const MAXIMO_POR_PETICION = 20;

function normalizar(sitio, sectorId, ciudad) {
  const nombre = sitio.displayName?.text?.trim();
  if (!nombre) return null;

  const lat = sitio.location?.latitude;
  const lon = sitio.location?.longitude;

  return {
    id: `google:${sitio.id}`,
    placeId: sitio.id,
    nombre,
    sector: sectorId,
    ciudad,
    direccion: sitio.formattedAddress ?? null,
    telefono: sitio.nationalPhoneNumber ?? null,
    // Places no expone email: siempre faltará con este motor.
    email: null,
    web: sitio.websiteUri ?? null,
    horario:
      sitio.regularOpeningHours?.openNow === undefined
        ? null
        : "Horario publicado en Google",
    redes: {},
    lat,
    lon,
    fuente: "google",
    // Sus condiciones prohíben almacenar estos datos: no se pueden guardar.
    persistible: false,
    osmUrl: null,
    mapsUrl:
      sitio.googleMapsUri ??
      (lat !== undefined
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
        : null),
  };
}

/**
 * Busca negocios de un sector en una ciudad usando Google Places.
 *
 * @param {object} ambito resultado de `geocodificarCiudad` (aporta el centro)
 * @param {string} sectorId id del sector del catálogo
 * @param {string} claveApi clave de Google del usuario
 * @param {number} limite máximo de resultados (Google tope 20)
 * @returns {Promise<Array>} leads normalizados, todos no persistibles
 */
export async function buscarEnGoogle(ambito, sectorId, claveApi, limite = 20) {
  if (!claveApi) {
    throw new Error(
      "Falta la clave de Google. Añádela en Ajustes o vuelve al motor de OpenStreetMap."
    );
  }

  const sector = sectorPorId(sectorId);
  if (!sector) {
    throw new Error(`Sector desconocido: ${sectorId}`);
  }

  const cuerpo = {
    textQuery: `${sector.consultaGoogle} en ${ambito.nombre}`,
    languageCode: "es",
    regionCode: "ES",
    maxResultCount: Math.min(limite, MAXIMO_POR_PETICION),
  };

  if (ambito.lat !== undefined && ambito.lon !== undefined) {
    cuerpo.locationBias = {
      circle: {
        center: { latitude: ambito.lat, longitude: ambito.lon },
        radius: 15000,
      },
    };
  }

  let respuesta;
  try {
    respuesta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": claveApi,
        "X-Goog-FieldMask": CAMPOS,
      },
      body: JSON.stringify(cuerpo),
    });
  } catch (error) {
    throw new Error(
      "No se pudo contactar con Google Places. Revisa tu conexión."
    );
  }

  if (!respuesta.ok) {
    let detalle = "";
    try {
      const error = await respuesta.json();
      detalle = error?.error?.message ?? "";
    } catch (e) {
      detalle = "";
    }

    if (respuesta.status === 403) {
      throw new Error(
        `Google ha rechazado la clave (403). Comprueba que la API "Places API (New)" está activada, que la facturación está habilitada y que la restricción por referente permite este dominio. ${detalle}`.trim()
      );
    }
    if (respuesta.status === 400) {
      throw new Error(`Google ha rechazado la petición (400). ${detalle}`.trim());
    }
    if (respuesta.status === 429) {
      throw new Error(
        "Has superado la cuota de Google Places. Espera un momento o revisa los límites de tu proyecto."
      );
    }
    throw new Error(
      `Google Places respondió con error ${respuesta.status}. ${detalle}`.trim()
    );
  }

  const datos = await respuesta.json();
  const sitios = Array.isArray(datos?.places) ? datos.places : [];

  return sitios
    .map((sitio) => normalizar(sitio, sectorId, ambito.nombre))
    .filter(Boolean);
}
