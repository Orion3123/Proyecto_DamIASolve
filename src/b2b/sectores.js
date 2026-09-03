/**
 * Catálogo de sectores objetivo, orientado a micropyme y negocio local español.
 *
 * Cada sector traduce un nombre comprensible ("peluquerías") a las etiquetas
 * reales de OpenStreetMap con las que se consulta Overpass. Un sector puede
 * necesitar varias etiquetas: una panadería puede estar mapeada como
 * `shop=bakery` o como `shop=pastry` según quien la haya dado de alta.
 *
 * `consultaGoogle` es el texto que se manda al motor opcional de Google Places,
 * que no entiende de etiquetas OSM.
 */
export const SECTORES = [
  {
    id: "peluqueria",
    nombre: "Peluquerías",
    emoji: "💇",
    etiquetas: [["shop", "hairdresser"]],
    consultaGoogle: "peluquería",
  },
  {
    id: "estetica",
    nombre: "Centros de estética",
    emoji: "💅",
    etiquetas: [
      ["shop", "beauty"],
      ["shop", "massage"],
    ],
    consultaGoogle: "centro de estética",
  },
  {
    id: "restaurante",
    nombre: "Restaurantes",
    emoji: "🍽️",
    etiquetas: [["amenity", "restaurant"]],
    consultaGoogle: "restaurante",
  },
  {
    id: "bar",
    nombre: "Bares y cafeterías",
    emoji: "☕",
    etiquetas: [
      ["amenity", "cafe"],
      ["amenity", "bar"],
      ["amenity", "pub"],
    ],
    consultaGoogle: "bar cafetería",
  },
  {
    id: "panaderia",
    nombre: "Panaderías y pastelerías",
    emoji: "🥖",
    etiquetas: [
      ["shop", "bakery"],
      ["shop", "pastry"],
    ],
    consultaGoogle: "panadería pastelería",
  },
  {
    id: "taller",
    nombre: "Talleres de coches",
    emoji: "🔧",
    etiquetas: [
      ["shop", "car_repair"],
      ["shop", "tyres"],
    ],
    consultaGoogle: "taller mecánico",
  },
  {
    id: "dentista",
    nombre: "Clínicas dentales",
    emoji: "🦷",
    etiquetas: [
      ["amenity", "dentist"],
      ["healthcare", "dentist"],
    ],
    consultaGoogle: "clínica dental",
  },
  {
    id: "fisioterapia",
    nombre: "Fisioterapia",
    emoji: "🧑‍⚕️",
    etiquetas: [["healthcare", "physiotherapist"]],
    consultaGoogle: "fisioterapeuta",
  },
  {
    id: "clinica",
    nombre: "Clínicas y consultas médicas",
    emoji: "🏥",
    etiquetas: [
      ["amenity", "clinic"],
      ["amenity", "doctors"],
    ],
    consultaGoogle: "clínica médica",
  },
  {
    id: "veterinario",
    nombre: "Veterinarios",
    emoji: "🐾",
    etiquetas: [["amenity", "veterinary"]],
    consultaGoogle: "clínica veterinaria",
  },
  {
    id: "optica",
    nombre: "Ópticas",
    emoji: "👓",
    etiquetas: [["shop", "optician"]],
    consultaGoogle: "óptica",
  },
  {
    id: "farmacia",
    nombre: "Farmacias",
    emoji: "💊",
    etiquetas: [["amenity", "pharmacy"]],
    consultaGoogle: "farmacia",
  },
  {
    id: "gimnasio",
    nombre: "Gimnasios",
    emoji: "🏋️",
    etiquetas: [
      ["leisure", "fitness_centre"],
      ["leisure", "sports_centre"],
    ],
    consultaGoogle: "gimnasio",
  },
  {
    id: "hotel",
    nombre: "Hoteles y alojamientos",
    emoji: "🏨",
    etiquetas: [
      ["tourism", "hotel"],
      ["tourism", "guest_house"],
      ["tourism", "apartment"],
    ],
    consultaGoogle: "hotel",
  },
  {
    id: "inmobiliaria",
    nombre: "Inmobiliarias",
    emoji: "🏘️",
    etiquetas: [["office", "estate_agent"]],
    consultaGoogle: "inmobiliaria",
  },
  {
    id: "asesoria",
    nombre: "Asesorías y gestorías",
    emoji: "📊",
    etiquetas: [
      ["office", "accountant"],
      ["office", "tax_advisor"],
      ["office", "financial"],
    ],
    consultaGoogle: "asesoría gestoría",
  },
  {
    id: "abogado",
    nombre: "Abogados",
    emoji: "⚖️",
    etiquetas: [["office", "lawyer"]],
    consultaGoogle: "despacho de abogados",
  },
  {
    id: "autoescuela",
    nombre: "Autoescuelas",
    emoji: "🚗",
    etiquetas: [["amenity", "driving_school"]],
    consultaGoogle: "autoescuela",
  },
  {
    id: "ropa",
    nombre: "Tiendas de ropa",
    emoji: "👕",
    etiquetas: [
      ["shop", "clothes"],
      ["shop", "boutique"],
      ["shop", "shoes"],
    ],
    consultaGoogle: "tienda de ropa",
  },
  {
    id: "floristeria",
    nombre: "Floristerías",
    emoji: "💐",
    etiquetas: [["shop", "florist"]],
    consultaGoogle: "floristería",
  },
  {
    id: "ferreteria",
    nombre: "Ferreterías",
    emoji: "🔩",
    etiquetas: [
      ["shop", "hardware"],
      ["shop", "doityourself"],
    ],
    consultaGoogle: "ferretería",
  },
  {
    id: "informatica",
    nombre: "Tiendas de informática",
    emoji: "💻",
    etiquetas: [
      ["shop", "computer"],
      ["shop", "electronics"],
    ],
    consultaGoogle: "tienda de informática",
  },
  {
    id: "oficios",
    nombre: "Oficios (fontanería, electricidad, carpintería)",
    emoji: "🛠️",
    etiquetas: [
      ["craft", "plumber"],
      ["craft", "electrician"],
      ["craft", "carpenter"],
      ["craft", "painter"],
    ],
    consultaGoogle: "fontanero electricista carpintero",
  },
];

/** Devuelve un sector por su id, o `undefined` si no existe. */
export function sectorPorId(id) {
  return SECTORES.find((s) => s.id === id);
}

/**
 * Nombre legible de un sector a partir de su id.
 * Los sectores de búsqueda libre llevan el prefijo "libre:" y guardan el texto
 * que escribió el usuario, así que se muestra ese texto sin el prefijo.
 */
export function nombreSector(id) {
  if (typeof id === "string" && id.startsWith(PREFIJO_LIBRE)) {
    return id.slice(PREFIJO_LIBRE.length);
  }
  return sectorPorId(id)?.nombre ?? id ?? "Negocio";
}

const PREFIJO_LIBRE = "libre:";

/** Detecta la forma `clave=valor` de una etiqueta de OpenStreetMap. */
const ETIQUETA_SUELTA = /^\s*([a-z_]{2,30})\s*=\s*([A-Za-z0-9_:.-]{1,60})\s*$/;

/**
 * Crea un "sector" a medida a partir de texto libre, para los nichos que no
 * están en el catálogo.
 *
 * Admite dos formas, y la diferencia importa mucho:
 *
 *   · `shop=pizza` (clave=valor) → filtra por ETIQUETA de OpenStreetMap. Es lo
 *     potente: da acceso a los miles de categorías que OSM tiene y este
 *     catálogo no. Requiere conocer la etiqueta.
 *   · `pizzería` (texto suelto) → busca en el NOMBRE del negocio. Útil en
 *     España, donde muchos se llaman "Peluquería María" o "Clínica Dental X",
 *     pero se le escapan los que no llevan el tipo en el nombre: una pizzería
 *     llamada "Da Vincenzo" no aparecerá. La interfaz lo advierte.
 */
export function crearSectorLibre(texto) {
  const limpio = (texto ?? "").trim();
  if (!limpio) return null;

  const etiqueta = limpio.match(ETIQUETA_SUELTA);
  if (etiqueta) {
    const [, clave, valor] = etiqueta;
    return {
      id: `${PREFIJO_LIBRE}${clave}=${valor}`,
      nombre: `${clave}=${valor}`,
      esLibre: true,
      modo: "etiqueta",
      etiquetas: [[clave, valor]],
      consultaGoogle: valor.replace(/_/g, " "),
    };
  }

  return {
    id: `${PREFIJO_LIBRE}${limpio}`,
    nombre: limpio,
    esLibre: true,
    modo: "nombre",
    texto: limpio,
    etiquetas: [],
    consultaGoogle: limpio,
  };
}

/**
 * Nombre en singular CON su artículo indeterminado, para encajar en frases de
 * las propuestas: "...lo que suelo hacer en una peluquería como X".
 * El artículo va incluido porque el género varía por sector y escribir "una"
 * fijo en la plantilla producía errores como "en una restaurante".
 */
const SINGULARES = {
  peluqueria: "una peluquería",
  estetica: "un centro de estética",
  restaurante: "un restaurante",
  bar: "un bar",
  panaderia: "una panadería",
  taller: "un taller",
  dentista: "una clínica dental",
  fisioterapia: "un centro de fisioterapia",
  clinica: "una clínica",
  veterinario: "una clínica veterinaria",
  optica: "una óptica",
  farmacia: "una farmacia",
  gimnasio: "un gimnasio",
  hotel: "un alojamiento",
  inmobiliaria: "una inmobiliaria",
  asesoria: "una asesoría",
  abogado: "un despacho",
  autoescuela: "una autoescuela",
  ropa: "una tienda de ropa",
  floristeria: "una floristería",
  ferreteria: "una ferretería",
  informatica: "una tienda de informática",
  oficios: "un negocio",
};

export function sectorEnSingular(id) {
  return SINGULARES[id] ?? "un negocio";
}
