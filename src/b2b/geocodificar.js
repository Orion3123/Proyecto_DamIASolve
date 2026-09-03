/**
 * Geocodificación de ciudades con Nominatim (OpenStreetMap).
 *
 * POLÍTICA DE USO
 * ---------------
 * Nominatim es un servicio gratuito con normas estrictas: máximo una petición
 * por segundo y prohibido el uso masivo o el autocompletado por tecla. Por eso
 * aquí solo se geocodifica al pulsar "Buscar" (nunca mientras se escribe), se
 * serializa una petición por segundo y se cachea el resultado en localStorage.
 * Saltarse esto acaba con la IP bloqueada, y entonces la app deja de funcionar
 * para todos.
 *
 * Nota: el navegador no permite fijar la cabecera `User-Agent` que pide su
 * política, pero sí envía `Referer` automáticamente, que es lo que Nominatim
 * acepta para aplicaciones web.
 */
import { leerCacheCiudad, guardarCacheCiudad } from "./almacen";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const MILISEGUNDOS_ENTRE_PETICIONES = 1100;

let ultimaPeticion = 0;

/** Espera lo necesario para no superar 1 petición por segundo. */
async function respetarLimite() {
  const espera = ultimaPeticion + MILISEGUNDOS_ENTRE_PETICIONES - Date.now();
  if (espera > 0) {
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
  ultimaPeticion = Date.now();
}

/**
 * Traduce el resultado de Nominatim a algo que Overpass entienda.
 *
 * Si la ciudad está mapeada como relación (lo normal en municipios españoles),
 * se usa su área, que respeta el límite municipal real. Si no, se cae al
 * rectángulo delimitador, que es más tosco: incluye parte de los municipios
 * vecinos, así que la app avisa de ello.
 */
function interpretar(resultado, consulta) {
  const lat = Number(resultado.lat);
  const lon = Number(resultado.lon);

  if (resultado.osm_type === "relation" && resultado.osm_id) {
    return {
      consulta,
      nombre: resultado.display_name?.split(",")[0] ?? consulta,
      display: resultado.display_name,
      tipo: "area",
      areaId: 3600000000 + Number(resultado.osm_id),
      lat,
      lon,
    };
  }

  const caja = resultado.boundingbox;
  if (!caja || caja.length < 4) return null;

  const [sur, norte, oeste, este] = caja.map(Number);
  return {
    consulta,
    nombre: resultado.display_name?.split(",")[0] ?? consulta,
    display: resultado.display_name,
    tipo: "bbox",
    // Overpass espera el orden (sur, oeste, norte, este).
    bbox: [sur, oeste, norte, este],
    lat,
    lon,
  };
}

/**
 * Busca una ciudad y devuelve su ámbito para consultar Overpass.
 *
 * @param {string} ciudad nombre escrito por el usuario
 * @param {string} pais código ISO de país (por defecto España)
 * @returns {Promise<object>} ámbito geográfico
 * @throws {Error} con mensaje en español listo para mostrar
 */
export async function geocodificarCiudad(ciudad, pais = "es") {
  const consulta = ciudad.trim();
  if (!consulta) {
    throw new Error("Escribe el nombre de una ciudad.");
  }

  const claveCache = `${pais}:${consulta}`;
  const cacheada = leerCacheCiudad(claveCache);
  if (cacheada) return cacheada;

  await respetarLimite();

  const url = `${NOMINATIM}?${new URLSearchParams({
    q: consulta,
    format: "jsonv2",
    limit: "1",
    countrycodes: pais,
  })}`;

  let respuesta;
  try {
    respuesta = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(
      `No se pudo contactar con el servicio de mapas para localizar "${consulta}". Revisa tu conexión.`
    );
  }

  if (respuesta.status === 429) {
    throw new Error(
      "El servicio de mapas ha limitado las peticiones. Espera un minuto y vuelve a intentarlo."
    );
  }
  if (!respuesta.ok) {
    throw new Error(
      `El servicio de mapas respondió con un error (${respuesta.status}) al buscar "${consulta}".`
    );
  }

  const datos = await respuesta.json();
  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error(
      `No he encontrado la ciudad "${consulta}". Prueba a escribirla completa, por ejemplo "Granada" o "Alcalá de Henares".`
    );
  }

  const ambito = interpretar(datos[0], consulta);
  if (!ambito) {
    throw new Error(
      `He encontrado "${consulta}" pero no he podido delimitar su término municipal.`
    );
  }

  guardarCacheCiudad(claveCache, ambito);
  return ambito;
}
