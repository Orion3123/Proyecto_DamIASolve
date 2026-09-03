/**
 * Catálogo de ofertas: lo que vendes.
 *
 * Cada oferta decide qué señales puntúan y con qué peso, porque el encaje no es
 * universal: "sin web" es oro si vendes páginas web y casi irrelevante si
 * vendes facturación electrónica.
 *
 * `fiabilidadSenal` es deliberadamente explícito. Hay ofertas cuyo encaje se ve
 * bien en los datos de un mapa (una web que falta se nota) y otras cuyo encaje
 * NO se ve en un mapa (que alguien pierda horas copiando datos a mano no deja
 * rastro en OpenStreetMap). Ocultar esa diferencia daría una falsa sensación de
 * precisión, así que la interfaz la muestra.
 */
export const OFERTAS = [
  {
    id: "web",
    nombre: "Página web y presencia digital",
    emoji: "🌐",
    descripcion:
      "Web sencilla, rápida y actualizable para negocios que hoy no tienen o tienen una obsoleta.",
    fiabilidadSenal: "alta",
    notaFiabilidad:
      "La ausencia de web se detecta bien en los datos del mapa. Aun así, compruébalo antes de escribir.",
    pesos: {
      sin_web: 50,
      solo_redes: 45,
      web_insegura: 40,
      ficha_incompleta: 20,
      sin_horario: 10,
    },
    asunto: (lead) => `Una web sencilla para ${lead.nombre}`,
    beneficios: [
      "Una página clara con tus servicios, horarios y cómo llegar",
      "Que te encuentren en Google cuando buscan tu servicio en la zona",
      "Tú mismo puedes cambiar textos y fotos, sin depender de nadie",
    ],
    precioOrientativo: "desde 390 €",
  },
  {
    id: "fichaGoogle",
    nombre: "Ficha de Google y visibilidad local",
    emoji: "📍",
    descripcion:
      "Optimizar la ficha de Google para aparecer en las búsquedas del barrio y en el mapa.",
    fiabilidadSenal: "alta",
    notaFiabilidad:
      "Los datos incompletos se ven con claridad en el mapa, que es exactamente el problema que resuelves.",
    pesos: {
      ficha_incompleta: 45,
      sin_horario: 40,
      sin_telefono: 30,
      sin_web: 25,
      sin_direccion: 25,
    },
    asunto: (lead) => `${lead.nombre} en Google: he visto algo mejorable`,
    beneficios: [
      "Horarios, teléfono y fotos al día para que nadie se quede sin llamar",
      "Aparecer en el mapa cuando alguien busca tu servicio cerca",
      "Reseñas gestionadas, que es lo que más pesa en la decisión final",
    ],
    precioOrientativo: "desde 150 €",
  },
  {
    id: "reservas",
    nombre: "Reservas y citas online",
    emoji: "📅",
    descripcion:
      "Sistema de cita previa para dejar de gestionar la agenda por teléfono y WhatsApp.",
    fiabilidadSenal: "media",
    notaFiabilidad:
      "Que no tengan web sugiere que no hay reservas online, pero podrían usar una plataforma externa que el mapa no registra.",
    pesos: {
      sin_web: 35,
      solo_redes: 30,
      sin_horario: 30,
      ficha_incompleta: 20,
    },
    asunto: (lead) => `Cita previa online para ${lead.nombre}`,
    beneficios: [
      "Tus clientes reservan solos, también fuera de tu horario",
      "Menos llamadas interrumpiendo mientras atiendes",
      "Recordatorio automático que reduce las ausencias",
    ],
    precioOrientativo: "desde 290 € + mantenimiento",
  },
  {
    id: "redes",
    nombre: "Gestión de redes sociales",
    emoji: "📱",
    descripcion:
      "Publicaciones periódicas y respuesta a mensajes para negocios sin tiempo de llevarlo.",
    fiabilidadSenal: "media",
    notaFiabilidad:
      "El mapa dice poco de cómo lleva alguien sus redes. Usa esta oferta apoyándote más en el sector que en la señal.",
    pesos: {
      ficha_incompleta: 30,
      sin_web: 30,
      solo_redes: 25,
      sin_horario: 20,
    },
    asunto: (lead) => `Llevar las redes de ${lead.nombre} sin que te robe tiempo`,
    beneficios: [
      "Publicaciones planificadas para no depender de la inspiración del día",
      "Mensajes y comentarios contestados a tiempo",
      "Un informe mensual corto de qué ha funcionado",
    ],
    precioOrientativo: "desde 180 €/mes",
  },
  {
    id: "automatizacion",
    nombre: "Automatización de tareas repetitivas",
    emoji: "⚙️",
    descripcion:
      "Conectar las herramientas que ya usas para dejar de copiar datos a mano.",
    fiabilidadSenal: "baja",
    notaFiabilidad:
      "Esto NO se ve en un mapa: que alguien pierda dos horas al día copiando datos no deja rastro. Usa la búsqueda para hacer una lista por sector y detecta el dolor real en la primera llamada.",
    pesos: {
      sin_email: 40,
      ficha_incompleta: 25,
      solo_redes: 25,
      sin_web: 15,
    },
    asunto: (lead) => `Quitarle horas de tareas repetitivas a ${lead.nombre}`,
    beneficios: [
      "Los datos pasan solos de un sitio a otro, sin copiar y pegar",
      "Avisos automáticos cuando algo requiere tu atención",
      "Empezamos por un proceso pequeño y medimos lo que ahorra",
    ],
    precioOrientativo: "primera automatización desde 250 €",
  },
  {
    id: "facturacion",
    nombre: "Facturación y administración digital",
    emoji: "🧾",
    descripcion:
      "Poner orden en facturas, presupuestos y cobros con herramientas sencillas.",
    fiabilidadSenal: "baja",
    notaFiabilidad:
      "Tampoco se ve en el mapa. Sirve para construir la lista del sector; la cualificación real la haces tú al hablar.",
    pesos: {
      sin_email: 40,
      ficha_incompleta: 30,
      sin_web: 20,
    },
    asunto: (lead) => `Ordenar la facturación de ${lead.nombre}`,
    beneficios: [
      "Presupuestos y facturas con la misma plantilla, en dos clics",
      "Saber en todo momento qué está cobrado y qué no",
      "Todo preparado para tu gestoría sin carreras de última hora",
    ],
    precioOrientativo: "desde 200 €",
  },
];

export function ofertaPorId(id) {
  return OFERTAS.find((o) => o.id === id);
}

/** Distintivo visual para la fiabilidad de las señales de cada oferta. */
export const ESTILO_FIABILIDAD = {
  alta: { texto: "Señal fiable", clase: "bg-green-100 text-green-800" },
  media: { texto: "Señal orientativa", clase: "bg-amber-100 text-amber-800" },
  baja: { texto: "Señal débil", clase: "bg-red-100 text-red-800" },
};
