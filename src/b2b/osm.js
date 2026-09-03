/**
 * Búsqueda de negocios en OpenStreetMap mediante la API de Overpass.
 *
 * Overpass es gratuito y sin clave, pero es un servicio comunitario que se
 * satura: devuelve 429 (demasiadas peticiones) y 504 (tiempo agotado) con
 * bastante frecuencia. Por eso hay reintentos con espera creciente y un
 * servidor espejo de respaldo. Si aun así falla, la app lo dice claramente y
 * ofrece los datos de ejemplo, en lugar de dejar una pantalla en blanco.
 *
 * LICENCIA: los datos son © colaboradores de OpenStreetMap, bajo licencia ODbL.
 * La atribución es obligatoria y está en el pie de la aplicación.
 */
import { sectorPorId } from "./sectores";

const SERVIDORES = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const ESPERAS_REINTENTO = [2000, 4000, 8000];

/** Etiquetas de contacto que puede traer un elemento de OSM. */
function primerValor(tags, claves) {
  for (const clave of claves) {
    const valor = tags[clave];
    if (valor && String(valor).trim()) return String(valor).trim();
  }
  return null;
}

/** Construye la dirección postal a partir de las etiquetas `addr:*`. */
function componerDireccion(tags) {
  const calle = tags["addr:street"];
  const numero = tags["addr:housenumber"];
  if (!calle) return null;
  return numero ? `${calle}, ${numero}` : calle;
}

/**
 * Convierte un elemento crudo de Overpass en el formato de lead de la app.
 * Devuelve `null` para elementos sin nombre: un negocio sin nombre no sirve
 * como cliente potencial.
 */
function normalizar(elemento, sectorId, ciudad) {
  const tags = elemento.tags ?? {};
  const nombre = tags.name?.trim();
  if (!nombre) return null;

  const lat = elemento.lat ?? elemento.center?.lat;
  const lon = elemento.lon ?? elemento.center?.lon;
  if (lat === undefined || lon === undefined) return null;

  const web = primerValor(tags, [
    "website",
    "contact:website",
    "url",
    "contact:url",
  ]);

  return {
    id: `osm:${elemento.type}/${elemento.id}`,
    nombre,
    sector: sectorId,
    ciudad: tags["addr:city"] || ciudad,
    direccion: componerDireccion(tags),
    codigoPostal: tags["addr:postcode"] ?? null,
    telefono: primerValor(tags, ["phone", "contact:phone", "contact:mobile"]),
    email: primerValor(tags, ["email", "contact:email"]),
    web,
    horario: tags.opening_hours ?? null,
    redes: {
      facebook: primerValor(tags, ["contact:facebook", "facebook"]),
      instagram: primerValor(tags, ["contact:instagram", "instagram"]),
    },
    lat,
    lon,
    fuente: "osm",
    persistible: true,
    osmUrl: `https://www.openstreetmap.org/${elemento.type}/${elemento.id}`,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
  };
}

/** Cuenta cuántos campos útiles tiene un lead, para elegir el mejor duplicado. */
function riqueza(lead) {
  return ["telefono", "email", "web", "horario", "direccion"].filter(
    (campo) => Boolean(lead[campo])
  ).length;
}

/**
 * Elimina duplicados.
 *
 * Un mismo negocio aparece a menudo dos veces en OSM: como punto y como
 * polígono del edificio. Se consideran el mismo si comparten nombre
 * normalizado y están a menos de ~100 m, y se conserva el que tenga la ficha
 * más completa.
 */
function deduplicar(leads) {
  const porClave = new Map();

  leads.forEach((lead) => {
    const nombreNormalizado = lead.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    const clave = `${nombreNormalizado}@${lead.lat.toFixed(3)},${lead.lon.toFixed(3)}`;

    const previo = porClave.get(clave);
    if (!previo || riqueza(lead) > riqueza(previo)) {
      porClave.set(clave, lead);
    }
  });

  return Array.from(porClave.values());
}

/**
 * Claves de OpenStreetMap que identifican "algo que es un negocio".
 *
 * La búsqueda libre por nombre necesita este filtro: sin él, buscar "central"
 * devolvería calles, edificios y paradas de autobús. Solo interesan elementos
 * que además tengan alguna de estas claves.
 */
const CLAVES_NEGOCIO = [
  "shop",
  "amenity",
  "office",
  "craft",
  "leisure",
  "tourism",
  "healthcare",
];

/**
 * Prepara texto del usuario para incrustarlo como expresión regular dentro de
 * una cadena de Overpass QL.
 *
 * Doble escapado a propósito: primero se neutralizan los metacaracteres de
 * expresión regular (para que "Café (centro)" se busque literalmente) y después
 * las barras invertidas resultantes se duplican, porque el valor viaja dentro
 * de una cadena entrecomillada de Overpass QL. Sin esto, un paréntesis en la
 * búsqueda rompe la consulta entera.
 */
function escaparRegex(texto) {
  return texto
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

/** Construye la consulta Overpass QL para un sector dentro de un ámbito. */
export function construirConsulta(ambito, sector, limite) {
  const filtroZona =
    ambito.tipo === "area"
      ? "(area.zona)"
      : `(${ambito.bbox.map((n) => n.toFixed(6)).join(",")})`;

  const cabeceraZona =
    ambito.tipo === "area" ? `area(${ambito.areaId})->.zona;` : "";

  // Búsqueda libre por nombre: se cruza el nombre con cada clave de negocio.
  // Es más cara que filtrar por etiqueta, así que se le da más tiempo.
  const porNombre = sector.esLibre && sector.modo === "nombre";
  const lineas = porNombre
    ? CLAVES_NEGOCIO.map(
        (clave) =>
          `  nwr["name"~"${escaparRegex(sector.texto)}",i]["${clave}"]${filtroZona};`
      ).join("\n")
    : sector.etiquetas
        .map(([clave, valor]) => `  nwr["${clave}"="${valor}"]${filtroZona};`)
        .join("\n");

  return [
    `[out:json][timeout:${porNombre ? 60 : 25}];`,
    cabeceraZona,
    "(",
    lineas,
    ");",
    `out center tags ${limite};`,
  ]
    .filter(Boolean)
    .join("\n");
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lanza la consulta contra Overpass con reintentos y servidor de respaldo.
 * @throws {Error} con un mensaje en español apto para mostrar al usuario
 */
async function ejecutarConsulta(consulta, alProgresar) {
  let ultimoFallo = null;

  for (let servidor = 0; servidor < SERVIDORES.length; servidor += 1) {
    for (let intento = 0; intento <= ESPERAS_REINTENTO.length; intento += 1) {
      if (intento > 0) {
        const espera = ESPERAS_REINTENTO[intento - 1];
        alProgresar?.(
          `El servidor de mapas está saturado. Reintentando en ${espera / 1000} s…`
        );
        await esperar(espera);
      }

      try {
        const respuesta = await fetch(SERVIDORES[servidor], {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: consulta }),
        });

        if (respuesta.status === 429 || respuesta.status === 504) {
          ultimoFallo = `El servidor respondió ${respuesta.status}.`;
          continue;
        }
        if (!respuesta.ok) {
          ultimoFallo = `El servidor respondió ${respuesta.status}.`;
          break; // Error no recuperable: probamos el siguiente servidor.
        }

        return await respuesta.json();
      } catch (error) {
        ultimoFallo = error?.message ?? "Fallo de red.";
      }
    }

    if (servidor < SERVIDORES.length - 1) {
      alProgresar?.("Probando con el servidor de respaldo…");
    }
  }

  throw new Error(
    `No se ha podido consultar OpenStreetMap. ${ultimoFallo ?? ""} Puedes reintentarlo en unos minutos o usar los datos de ejemplo para probar la app.`.trim()
  );
}

/**
 * Busca negocios de un sector dentro de un ámbito geográfico.
 *
 * @param {object} ambito resultado de `geocodificarCiudad`
 * @param {string} sectorId id del sector del catálogo
 * @param {number} limite máximo de resultados a pedir
 * @param {Function} [alProgresar] callback de texto de progreso
 * @returns {Promise<Array>} leads normalizados y deduplicados
 */
export async function buscarNegocios(ambito, sectorOId, limite = 150, alProgresar) {
  // Admite un id del catálogo o un sector ya construido (búsqueda libre).
  const sector =
    typeof sectorOId === "string" ? sectorPorId(sectorOId) : sectorOId;
  if (!sector) {
    throw new Error(`Sector desconocido: ${sectorOId}`);
  }
  const sectorId = sector.id;

  const consulta = construirConsulta(ambito, sector, limite);
  const datos = await ejecutarConsulta(consulta, alProgresar);

  const elementos = Array.isArray(datos?.elements) ? datos.elements : [];
  const leads = elementos
    .map((el) => normalizar(el, sectorId, ambito.nombre))
    .filter(Boolean);

  return deduplicar(leads);
}
