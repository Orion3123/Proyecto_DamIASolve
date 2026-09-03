/**
 * Generación de propuestas en un click.
 *
 * Son plantillas, no IA: son instantáneas, gratis, funcionan sin conexión y
 * siempre dicen lo mismo, que es justo lo que quieres en un texto comercial que
 * vas a enviar decenas de veces. Sigue el principio del AGENTS.md del proyecto:
 * no usar IA si una automatización sencilla resuelve el problema.
 *
 * REDACCIÓN EN CONDICIONAL
 * ------------------------
 * Los ganchos NUNCA afirman ("no tenéis web"), siempre relativizan ("no he
 * encontrado vuestra web, disculpa si se me ha pasado"). El dato viene de un
 * mapa colaborativo que puede estar desactualizado, y una afirmación falsa en
 * la primera línea de un email frío destruye la conversación antes de empezar.
 */
import { sectorEnSingular, nombreSector } from "./sectores";

/**
 * Frase de gancho por señal, siempre en condicional y en primera persona.
 * `abierto` se usa en email (más formal) y `corto` en WhatsApp.
 */
const GANCHOS = {
  sin_web: {
    abierto:
      "buscando negocios de la zona no he sido capaz de encontrar una página web vuestra (si la tenéis y se me ha pasado, disculpa)",
    corto: "no he encontrado web vuestra, corrígeme si me equivoco",
  },
  solo_redes: {
    abierto:
      "os he encontrado en redes sociales, pero no he localizado una página web propia vuestra",
    corto: "os veo en redes pero no encuentro web propia",
  },
  web_insegura: {
    abierto:
      "he entrado en vuestra web y me la ha marcado como «no segura», porque va por http en vez de https; a vuestros clientes les sale ese mismo aviso",
    corto: "vuestra web sale como «no segura» en el navegador (va por http)",
  },
  sin_horario: {
    abierto:
      "he mirado vuestra ficha en los mapas y no aparecen los horarios de apertura",
    corto: "en los mapas no aparecen vuestros horarios",
  },
  ficha_incompleta: {
    abierto:
      "vuestra ficha en los mapas está bastante incompleta: le faltan varios de los datos que la gente busca antes de acercarse",
    corto: "vuestra ficha en los mapas está muy incompleta",
  },
  sin_telefono: {
    abierto:
      "no he encontrado un teléfono de contacto público en vuestra ficha, y eso hace que perdáis llamadas de gente que os busca",
    corto: "no aparece teléfono público en vuestra ficha",
  },
  sin_email: {
    abierto:
      "no he localizado un correo de contacto vuestro, así que os escribo por la vía que he encontrado",
    corto: "no he encontrado correo de contacto vuestro",
  },
  sin_direccion: {
    abierto:
      "en los mapas vuestra dirección aparece incompleta, sin calle y número",
    corto: "vuestra dirección aparece incompleta en los mapas",
  },
};

/**
 * Elige el gancho más potente: la señal presente con más peso en esta oferta.
 * Devuelve `null` si ninguna señal encaja, para usar una apertura genérica.
 */
export function elegirGancho(senales, oferta) {
  const pesos = oferta?.pesos ?? {};
  let mejor = null;
  let mejorPeso = 0;

  senales.forEach((senal) => {
    const peso = pesos[senal.id] ?? 0;
    if (peso > mejorPeso && GANCHOS[senal.id]) {
      mejor = senal;
      mejorPeso = peso;
    }
  });

  return mejor;
}

/** Pie legal para el correo frío B2B. Corto a propósito: largo no se lee. */
function pieLegal(perfil) {
  const remitente = perfil.empresa || perfil.nombre || "nosotros";
  return [
    "—",
    `Te escribo a la dirección de contacto que tu negocio tiene publicada, por interés comercial legítimo. ${remitente} no comparte estos datos con terceros.`,
    "Si prefieres no recibir más mensajes míos, responde BAJA y te saco de la lista sin más.",
  ].join("\n");
}

function firma(perfil) {
  const lineas = [perfil.nombre || "—"];
  if (perfil.empresa) lineas.push(perfil.empresa);
  if (perfil.telefono) lineas.push(perfil.telefono);
  if (perfil.email) lineas.push(perfil.email);
  if (perfil.web) lineas.push(perfil.web);
  return lineas.join("\n");
}

function precio(perfil, oferta) {
  return perfil.precioOrientativo || oferta.precioOrientativo || "";
}

/** Cuerpo del email. */
function propuestaEmail({ lead, oferta, perfil, gancho }) {
  const singular = sectorEnSingular(lead.sector);
  const ciudad = lead.ciudad || "la zona";
  const presentacion = perfil.empresa
    ? `Soy ${perfil.nombre || "—"}, de ${perfil.empresa}.`
    : `Soy ${perfil.nombre || "—"}.`;

  const aperturaGancho = gancho
    ? `Te escribo porque ${GANCHOS[gancho.id].abierto}.`
    : `Te escribo porque trabajo con negocios como el vuestro en ${ciudad} y creo que esto os puede encajar.`;

  const importe = precio(perfil, oferta);

  // Se compone por PÁRRAFOS y se unen con una línea en blanco entre ellos.
  // Antes se montaba como lista de líneas con "" de separación y un filtro de
  // vacíos para quitar el precio opcional: ese filtro se llevaba por delante
  // también los separadores y el correo salía como un muro de texto.
  const parrafos = [
    "Hola:",
    `${presentacion} Ayudo a ${nombreSector(lead.sector).toLowerCase()} de ${ciudad} con ${oferta.nombre.toLowerCase()}.`,
    aperturaGancho,
    [
      `Si te interesa, esto es lo que suelo hacer en ${singular} como ${lead.nombre}:`,
      ...oferta.beneficios.map((b) => `  · ${b}`),
    ].join("\n"),
    importe ? `Precio orientativo: ${importe}. Sin compromiso ni permanencia.` : null,
    "¿Te viene bien que te llame cinco minutos esta semana y lo vemos? Si no te encaja, dímelo y no insisto.",
    `Un saludo,\n${firma(perfil)}`,
    pieLegal(perfil),
  ];

  return parrafos.filter(Boolean).join("\n\n");
}

/** Mensaje de WhatsApp: corto, directo, sin florituras. */
function propuestaWhatsApp({ lead, oferta, perfil, gancho }) {
  const ciudad = lead.ciudad || "la zona";
  const presentacion = perfil.empresa
    ? `${perfil.nombre || "—"}, de ${perfil.empresa}`
    : perfil.nombre || "—";

  const frase = gancho
    ? `He estado mirando negocios de ${ciudad} y ${GANCHOS[gancho.id].corto}.`
    : `Trabajo con negocios de ${ciudad} y creo que esto os puede encajar.`;

  return [
    `Hola, buenos días. Soy ${presentacion}.`,
    "",
    frase,
    "",
    `Me dedico a ${oferta.nombre.toLowerCase()} para negocios como el vuestro. ${oferta.beneficios[0]}.`,
    "",
    `¿Te paso información o prefieres que te llame un momento?`,
    "",
    `Si no te interesa, dímelo y no te vuelvo a escribir. Gracias.`,
  ].join("\n");
}

/** Guion de llamada: no es un texto para enviar, es una chuleta para hablar. */
function propuestaLlamada({ lead, oferta, perfil, gancho }) {
  const ciudad = lead.ciudad || "la zona";
  const presentacion = perfil.empresa
    ? `${perfil.nombre || "—"}, de ${perfil.empresa}`
    : perfil.nombre || "—";

  const observacion = gancho
    ? `He visto que ${GANCHOS[gancho.id].corto}.`
    : `Trabajo con ${nombreSector(lead.sector).toLowerCase()} de ${ciudad}.`;

  return [
    `GUION DE LLAMADA — ${lead.nombre}`,
    lead.telefono ? `Teléfono: ${lead.telefono}` : "Teléfono: (no disponible)",
    "",
    "1. APERTURA (10 segundos)",
    `   «Hola, buenos días. Soy ${presentacion}. ¿Hablo con la persona que lleva ${lead.nombre}?»`,
    "",
    "2. MOTIVO (15 segundos)",
    `   «${observacion} Me dedico a ${oferta.nombre.toLowerCase()} para ${nombreSector(lead.sector).toLowerCase()} de ${ciudad}.»`,
    "",
    "3. PREGUNTA ABIERTA (y a callar)",
    `   «¿Cómo lo lleváis ahora mismo?»`,
    "   → Deja que hable. Aquí es donde averiguas si hay dolor real o no.",
    "",
    "4. SI HAY INTERÉS",
    ...oferta.beneficios.map((b) => `   · ${b}`),
    `   Precio orientativo: ${precio(perfil, oferta) || "a concretar"}.`,
    "",
    "5. CIERRE",
    `   «¿Te paso una propuesta por escrito y la miras con calma?»`,
    "",
    "OBJECIONES FRECUENTES",
    `   «No tengo tiempo» → «Justo por eso te llamo, es para quitarte trabajo. ¿Te llamo el ${diaSiguienteHabil()}?»`,
    `   «Ya tengo a alguien» → «Perfecto. ¿Qué tal os va? Si algún día necesitáis segunda opinión, aquí estoy.»`,
    `   «Es caro» → «¿Comparado con qué? Vamos a ver cuántas horas te está costando ahora.»`,
    `   «Mándame información» → «Te la mando ahora. ¿Cuál es tu correo?» (consigue el email, es el objetivo mínimo)`,
    "",
    "RECUERDA: la señal que has visto es una hipótesis del mapa, no un hecho.",
    "Si te dice que sí tiene web, no discutas: «Perfecto, entonces se me pasó a mí».",
  ].join("\n");
}

/** Nombre del próximo día laborable, para las objeciones del guion. */
function diaSiguienteHabil() {
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const hoy = new Date().getDay();
  let siguiente = (hoy + 1) % 7;
  if (siguiente === 0) siguiente = 1;
  if (siguiente === 6) siguiente = 1;
  return dias[siguiente];
}

const GENERADORES = {
  email: propuestaEmail,
  whatsapp: propuestaWhatsApp,
  llamada: propuestaLlamada,
};

export const CANALES = [
  { id: "email", nombre: "Email", emoji: "✉️" },
  { id: "whatsapp", nombre: "WhatsApp", emoji: "💬" },
  { id: "llamada", nombre: "Guion de llamada", emoji: "📞" },
];

/**
 * Genera el texto de la propuesta.
 *
 * @param {object} lead
 * @param {object} oferta objeto de OFERTAS
 * @param {object} perfil datos del vendedor (nombre, empresa, email, ...)
 * @param {string} canal "email" | "whatsapp" | "llamada"
 * @param {Array} senales señales ya detectadas del lead
 * @returns {{asunto: string|null, texto: string, gancho: object|null}}
 */
export function generarPropuesta({ lead, oferta, perfil, canal, senales }) {
  if (!lead || !oferta) {
    return { asunto: null, texto: "", gancho: null };
  }

  const gancho = elegirGancho(senales ?? [], oferta);
  const generar = GENERADORES[canal] ?? propuestaEmail;
  const texto = generar({ lead, oferta, perfil: perfil ?? {}, gancho });
  const asunto = canal === "email" ? oferta.asunto(lead) : null;

  return { asunto, texto, gancho };
}

/** Enlace `mailto:` con asunto y cuerpo ya rellenos. */
export function enlaceMailto(lead, asunto, texto) {
  if (!lead.email) return null;
  return `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(
    asunto ?? ""
  )}&body=${encodeURIComponent(texto)}`;
}

/**
 * Enlace de WhatsApp. Solo funciona si el teléfono se puede normalizar a
 * formato internacional; se asume España (+34) cuando no hay prefijo.
 */
export function enlaceWhatsApp(lead, texto) {
  if (!lead.telefono) return null;
  const soloDigitos = String(lead.telefono).replace(/[^\d+]/g, "");
  let numero = soloDigitos.replace(/^\+/, "");
  if (!soloDigitos.startsWith("+") && numero.length === 9) {
    numero = `34${numero}`;
  }
  if (numero.length < 9) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
