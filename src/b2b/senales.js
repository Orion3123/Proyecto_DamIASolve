/**
 * Detección de señales y puntuación de leads.
 *
 * AVISO IMPORTANTE DE INTERPRETACIÓN
 * ----------------------------------
 * Las señales se deducen de lo que hay (o falta) en la ficha del negocio en la
 * fuente de datos. Que en OpenStreetMap no conste la web de una peluquería
 * significa "OSM no tiene su web", NO "esa peluquería no tiene web". OSM es
 * colaborativo e incompleto.
 *
 * Por eso toda señal lleva `verificable: true` y la interfaz obliga a
 * comprobarla antes de usarla en un email. Escribir "he visto que no tenéis
 * web" a alguien que sí la tiene quema el contacto y la reputación. Las
 * plantillas de propuesta están redactadas en condicional por este motivo.
 */

/** Catálogo de señales. `tono` solo afecta al color del distintivo en la UI. */
export const SENALES = {
  sin_web: {
    id: "sin_web",
    etiqueta: "Sin web registrada",
    explicacion:
      "No consta ninguna página web en la ficha. Conviene buscar el nombre del negocio en Google antes de dar por hecho que no la tiene.",
    tono: "ambar",
  },
  solo_redes: {
    id: "solo_redes",
    etiqueta: "Solo redes sociales",
    explicacion:
      "Consta perfil en redes pero ninguna web propia. Suele indicar que toda su presencia digital depende de una plataforma ajena.",
    tono: "ambar",
  },
  web_insegura: {
    id: "web_insegura",
    etiqueta: "Web sin HTTPS",
    explicacion:
      "La dirección registrada empieza por http://. Si sigue así, el navegador la marca como no segura a sus clientes.",
    tono: "rojo",
  },
  sin_telefono: {
    id: "sin_telefono",
    etiqueta: "Sin teléfono",
    explicacion:
      "No consta teléfono en la ficha, así que tendrás que localizarlo por otra vía o presentarte en persona.",
    tono: "gris",
  },
  sin_email: {
    id: "sin_email",
    etiqueta: "Sin email",
    explicacion:
      "No consta correo de contacto. Muy habitual: la mayoría de negocios locales no lo publican en mapas.",
    tono: "gris",
  },
  sin_horario: {
    id: "sin_horario",
    etiqueta: "Sin horarios publicados",
    explicacion:
      "No constan horarios de apertura. Es una de las primeras cosas que busca un cliente antes de acercarse.",
    tono: "ambar",
  },
  ficha_incompleta: {
    id: "ficha_incompleta",
    etiqueta: "Ficha muy incompleta",
    explicacion:
      "Faltan la mayoría de los datos básicos. Indica poca atención a su presencia digital, aunque también puede ser que nadie haya actualizado el mapa.",
    tono: "ambar",
  },
  sin_direccion: {
    id: "sin_direccion",
    etiqueta: "Sin dirección completa",
    explicacion:
      "No consta calle y número, solo la ubicación aproximada en el mapa.",
    tono: "gris",
  },
};

/** Campos que se consideran "básicos" para medir si la ficha está completa. */
const CAMPOS_BASICOS = ["telefono", "web", "email", "horario", "direccion"];

/**
 * Grupos de señales que NUNCA pueden darse a la vez.
 *
 * Un negocio o no tiene web, o solo tiene redes, o tiene una web por http:
 * `detectarSenales` emite como mucho una de las tres. Esto importa para
 * normalizar la puntuación: si el denominador sumara las tres, el máximo
 * alcanzable se quedaría muy por debajo de 100 y la escala nunca llegaría a
 * "Prioritario", por muy bien que encajara el cliente.
 */
const GRUPOS_EXCLUYENTES = [["sin_web", "solo_redes", "web_insegura"]];

/**
 * Máxima puntuación de encaje realmente alcanzable con estos pesos, contando
 * solo la señal de mayor peso dentro de cada grupo excluyente.
 */
export function maximoAlcanzable(pesos) {
  const agrupadas = new Set();
  let total = 0;

  GRUPOS_EXCLUYENTES.forEach((grupo) => {
    let mayor = 0;
    grupo.forEach((id) => {
      agrupadas.add(id);
      mayor = Math.max(mayor, pesos[id] ?? 0);
    });
    total += mayor;
  });

  Object.entries(pesos).forEach(([id, peso]) => {
    if (!agrupadas.has(id)) total += Math.max(0, peso);
  });

  return total;
}

/**
 * Analiza un lead y devuelve las señales detectadas.
 * @returns {Array<{id, etiqueta, explicacion, tono, verificable}>}
 */
export function detectarSenales(lead) {
  const encontradas = [];
  const anadir = (id) => encontradas.push({ ...SENALES[id], verificable: true });

  const tieneWeb = Boolean(lead.web);
  const tieneRedes = Boolean(lead.redes?.facebook || lead.redes?.instagram);

  if (!tieneWeb) {
    anadir(tieneRedes ? "solo_redes" : "sin_web");
  } else if (/^http:\/\//i.test(lead.web)) {
    anadir("web_insegura");
  }

  if (!lead.telefono) anadir("sin_telefono");
  if (!lead.email) anadir("sin_email");
  if (!lead.horario) anadir("sin_horario");
  if (!lead.direccion) anadir("sin_direccion");

  const rellenos = CAMPOS_BASICOS.filter((campo) => Boolean(lead[campo])).length;
  if (rellenos <= 1) anadir("ficha_incompleta");

  return encontradas;
}

/**
 * Puntúa la facilidad de contactar con el negocio (0-100).
 *
 * Un lead con encaje perfecto al que no puedes llegar no vale nada, por eso
 * esto pesa en la nota final en lugar de mostrarse solo como adorno.
 */
export function calcularContactabilidad(lead) {
  let puntos = 0;
  if (lead.telefono) puntos += 60;
  if (lead.email) puntos += 40;
  if (lead.web) puntos += 20;
  return Math.min(100, puntos);
}

/**
 * Puntúa un lead frente a una oferta concreta.
 *
 * El encaje no es genérico: depende de lo que vendas. "Sin web" vale mucho si
 * vendes páginas web y casi nada si vendes facturación electrónica. Por eso la
 * oferta aporta los pesos y aquí solo se aplican.
 *
 * @param {object} lead
 * @param {object} oferta objeto de OFERTAS, con `pesos` por id de señal
 * @returns {{score, encaje, contactabilidad, motivos, senales}}
 */
export function puntuar(lead, oferta) {
  const senales = detectarSenales(lead);
  const pesos = oferta?.pesos ?? {};

  const maxPosible = maximoAlcanzable(pesos);

  const motivos = [];
  let bruto = 0;

  senales.forEach((senal) => {
    const peso = pesos[senal.id];
    if (!peso) return;
    bruto += peso;
    motivos.push({
      texto: senal.etiqueta,
      peso,
      explicacion: senal.explicacion,
    });
  });

  const encaje =
    maxPosible > 0
      ? Math.max(0, Math.min(100, Math.round((bruto / maxPosible) * 100)))
      : 0;
  const contactabilidad = calcularContactabilidad(lead);
  const score = Math.round(encaje * 0.65 + contactabilidad * 0.35);

  if (motivos.length === 0) {
    motivos.push({
      texto: "Ninguna señal encaja con lo que vendes",
      peso: 0,
      explicacion:
        "Su ficha está razonablemente completa para esta oferta. Puede seguir siendo buen cliente, pero no tienes un gancho evidente.",
    });
  }

  return { score, encaje, contactabilidad, motivos, senales };
}

/** Etiqueta corta para el score, para no obligar a interpretar el número. */
export function etiquetaScore(score) {
  if (score >= 70) return { texto: "Prioritario", clase: "bg-green-100 text-green-800" };
  if (score >= 45) return { texto: "Interesante", clase: "bg-blue-100 text-blue-800" };
  if (score >= 25) return { texto: "Dudoso", clase: "bg-amber-100 text-amber-800" };
  return { texto: "Poco encaje", clase: "bg-gray-100 text-gray-600" };
}
