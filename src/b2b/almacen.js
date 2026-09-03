/**
 * Persistencia en localStorage.
 *
 * Toda lectura y escritura va envuelta en try/catch a propósito: en navegación
 * privada, con las cookies bloqueadas o con la cuota llena, `localStorage`
 * lanza excepción en lugar de fallar en silencio. Una app comercial que se cae
 * en blanco por no poder guardar una nota es peor que una que avisa y sigue.
 *
 * Los datos viven solo en este navegador. Por eso la exportación a CSV no es un
 * extra: es la garantía de que Damián nunca se queda encerrado aquí dentro.
 */
const PREFIJO = "b2bhunter";
const VERSION = 1;

const CLAVES = {
  perfil: `${PREFIJO}.perfil.v${VERSION}`,
  leads: `${PREFIJO}.leads.v${VERSION}`,
  ajustes: `${PREFIJO}.ajustes.v${VERSION}`,
  cacheCiudades: `${PREFIJO}.ciudades.v${VERSION}`,
};

/** Estados del embudo comercial, en orden. */
export const ESTADOS = [
  { id: "nuevo", nombre: "Nuevo", clase: "bg-gray-100 text-gray-700" },
  { id: "contactado", nombre: "Contactado", clase: "bg-blue-100 text-blue-800" },
  { id: "interesado", nombre: "Interesado", clase: "bg-amber-100 text-amber-800" },
  { id: "cliente", nombre: "Cliente", clase: "bg-green-100 text-green-800" },
  { id: "descartado", nombre: "Descartado", clase: "bg-red-100 text-red-700" },
];

export const PERFIL_VACIO = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  web: "",
  ofertaId: "web",
  precioOrientativo: "",
};

export const AJUSTES_POR_DEFECTO = {
  motor: "osm",
  claveGoogle: "",
};

/** True si el navegador nos deja usar localStorage. */
export function almacenDisponible() {
  try {
    const prueba = `${PREFIJO}.prueba`;
    window.localStorage.setItem(prueba, "1");
    window.localStorage.removeItem(prueba);
    return true;
  } catch (error) {
    return false;
  }
}

function leer(clave, porDefecto) {
  try {
    const crudo = window.localStorage.getItem(clave);
    if (!crudo) return porDefecto;
    const valor = JSON.parse(crudo);
    return valor ?? porDefecto;
  } catch (error) {
    console.warn(`[B2B Hunter] No se pudo leer ${clave}:`, error);
    return porDefecto;
  }
}

function escribir(clave, valor) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
    return { ok: true };
  } catch (error) {
    console.warn(`[B2B Hunter] No se pudo guardar ${clave}:`, error);
    const sinEspacio =
      error?.name === "QuotaExceededError" ||
      error?.name === "NS_ERROR_DOM_QUOTA_REACHED";
    return {
      ok: false,
      mensaje: sinEspacio
        ? "No queda espacio en el navegador. Exporta tus leads a CSV y borra los que ya no necesites."
        : "Tu navegador no permite guardar datos. Si estás en modo incógnito, los leads no se conservarán.",
    };
  }
}

/* ---------------------------------- Perfil --------------------------------- */

export function leerPerfil() {
  return { ...PERFIL_VACIO, ...leer(CLAVES.perfil, {}) };
}

export function guardarPerfil(perfil) {
  return escribir(CLAVES.perfil, perfil);
}

/* --------------------------------- Ajustes --------------------------------- */

export function leerAjustes() {
  return { ...AJUSTES_POR_DEFECTO, ...leer(CLAVES.ajustes, {}) };
}

export function guardarAjustes(ajustes) {
  return escribir(CLAVES.ajustes, ajustes);
}

/* ---------------------------------- Leads ---------------------------------- */

/** Devuelve los leads guardados como array, del más reciente al más antiguo. */
export function leerLeads() {
  const mapa = leer(CLAVES.leads, {});
  return Object.values(mapa).sort(
    (a, b) => (b.guardadoEn ?? 0) - (a.guardadoEn ?? 0)
  );
}

function escribirLeads(lista) {
  const mapa = {};
  lista.forEach((lead) => {
    mapa[lead.id] = lead;
  });
  return escribir(CLAVES.leads, mapa);
}

/**
 * Guarda un lead nuevo. Si ya existía, conserva su estado y notas para no
 * pisar el trabajo comercial al repetir una búsqueda.
 */
export function guardarLead(lead) {
  const existentes = leerLeads();
  const previo = existentes.find((l) => l.id === lead.id);

  const fusionado = {
    ...lead,
    estado: previo?.estado ?? "nuevo",
    notas: previo?.notas ?? "",
    guardadoEn: previo?.guardadoEn ?? Date.now(),
    actualizadoEn: Date.now(),
  };

  const resto = existentes.filter((l) => l.id !== lead.id);
  const resultado = escribirLeads([fusionado, ...resto]);
  return { ...resultado, lead: fusionado };
}

export function actualizarLead(id, cambios) {
  const lista = leerLeads().map((lead) =>
    lead.id === id ? { ...lead, ...cambios, actualizadoEn: Date.now() } : lead
  );
  return escribirLeads(lista);
}

export function borrarLead(id) {
  return escribirLeads(leerLeads().filter((lead) => lead.id !== id));
}

export function borrarTodosLosLeads() {
  return escribirLeads([]);
}

/* ------------------------- Caché de geocodificación ------------------------ */

/**
 * Nominatim pide expresamente no abusar de su servicio gratuito. Cachear la
 * resolución ciudad → área evita repetir la misma consulta cada vez que Damián
 * busca otro sector en la misma ciudad.
 */
export function leerCacheCiudad(clave) {
  const cache = leer(CLAVES.cacheCiudades, {});
  return cache[clave.toLowerCase()] ?? null;
}

export function guardarCacheCiudad(clave, valor) {
  const cache = leer(CLAVES.cacheCiudades, {});
  cache[clave.toLowerCase()] = valor;
  return escribir(CLAVES.cacheCiudades, cache);
}
