/**
 * Datos de ejemplo para probar la aplicación sin conexión.
 *
 * TODOS LOS NEGOCIOS DE ESTE FICHERO SON FICTICIOS. Los nombres están
 * inventados y las coordenadas son aproximadas al centro de Granada. Sirven
 * para dos cosas:
 *
 *   1. Poder probar el flujo completo (buscar → puntuar → propuesta → CSV) sin
 *      depender de que Overpass esté disponible, que se cae con frecuencia.
 *   2. Ver cómo cambia la puntuación entre fichas completas e incompletas.
 *
 * No deben usarse para prospección real: no existen.
 */

/** Construye el enlace al mapa a partir de las coordenadas. */
function mapa(lat, lon) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

function lead(datos) {
  return {
    email: null,
    web: null,
    telefono: null,
    horario: null,
    direccion: null,
    redes: {},
    ciudad: "Granada",
    fuente: "demo",
    persistible: true,
    osmUrl: null,
    ...datos,
    mapsUrl: mapa(datos.lat, datos.lon),
  };
}

export const LEADS_DEMO = [
  lead({
    id: "demo:1",
    nombre: "Peluquería Ejemplo Realejo",
    sector: "peluqueria",
    direccion: "Calle Inventada 12",
    telefono: "958 00 00 01",
    lat: 37.1735,
    lon: -3.5905,
  }),
  lead({
    id: "demo:2",
    nombre: "Corte y Color Ficticio",
    sector: "peluqueria",
    direccion: "Plaza Imaginaria 4",
    telefono: "958 00 00 02",
    web: "http://cortey color-ficticio.example",
    horario: "Ma-Sa 10:00-20:00",
    lat: 37.1761,
    lon: -3.5983,
  }),
  lead({
    id: "demo:3",
    nombre: "Estilistas Sin Web",
    sector: "peluqueria",
    lat: 37.1799,
    lon: -3.6011,
  }),
  lead({
    id: "demo:4",
    nombre: "Peluquería Redes Sociales",
    sector: "peluqueria",
    direccion: "Avenida Ejemplo 88",
    telefono: "958 00 00 04",
    redes: { instagram: "https://instagram.com/ejemplo_ficticio" },
    horario: "Lu-Vi 09:30-19:00",
    lat: 37.1688,
    lon: -3.6042,
  }),
  lead({
    id: "demo:5",
    nombre: "Restaurante La Muestra",
    sector: "restaurante",
    direccion: "Calle Ficticia 3",
    telefono: "958 00 00 05",
    email: "reservas@lamuestra.example",
    web: "https://lamuestra.example",
    horario: "Ma-Do 13:00-16:00, 20:00-23:30",
    lat: 37.1773,
    lon: -3.5966,
  }),
  lead({
    id: "demo:6",
    nombre: "Bar Prueba",
    sector: "restaurante",
    telefono: "958 00 00 06",
    lat: 37.1812,
    lon: -3.6089,
  }),
  lead({
    id: "demo:7",
    nombre: "Tapas de Ejemplo",
    sector: "restaurante",
    direccion: "Calle Simulada 45",
    lat: 37.1704,
    lon: -3.5921,
  }),
  lead({
    id: "demo:8",
    nombre: "Clínica Dental Modelo",
    sector: "dentista",
    direccion: "Calle Supuesta 7",
    telefono: "958 00 00 08",
    email: "info@dentalmodelo.example",
    horario: "Lu-Vi 09:00-14:00, 16:00-20:00",
    lat: 37.1750,
    lon: -3.6001,
  }),
  lead({
    id: "demo:9",
    nombre: "Dentistas Ficticios Asociados",
    sector: "dentista",
    telefono: "958 00 00 09",
    lat: 37.1841,
    lon: -3.5952,
  }),
  lead({
    id: "demo:10",
    nombre: "Taller Mecánico Inventado",
    sector: "taller",
    direccion: "Polígono Ejemplo, nave 14",
    telefono: "958 00 00 10",
    horario: "Lu-Vi 08:00-18:00",
    lat: 37.1620,
    lon: -3.6155,
  }),
  lead({
    id: "demo:11",
    nombre: "Neumáticos Muestra",
    sector: "taller",
    lat: 37.1601,
    lon: -3.6188,
  }),
  lead({
    id: "demo:12",
    nombre: "Gimnasio Simulación",
    sector: "gimnasio",
    direccion: "Camino Ficticio 22",
    telefono: "958 00 00 12",
    web: "https://gimnasiosimulacion.example",
    email: "hola@gimnasiosimulacion.example",
    horario: "Lu-Do 07:00-23:00",
    lat: 37.1866,
    lon: -3.6021,
  }),
  lead({
    id: "demo:13",
    nombre: "Centro Fitness de Prueba",
    sector: "gimnasio",
    telefono: "958 00 00 13",
    redes: { facebook: "https://facebook.com/ejemplo-ficticio" },
    lat: 37.1712,
    lon: -3.6120,
  }),
  lead({
    id: "demo:14",
    nombre: "Óptica Ejemplar",
    sector: "optica",
    direccion: "Gran Vía Imaginaria 99",
    telefono: "958 00 00 14",
    web: "http://opticaejemplar.example",
    lat: 37.1780,
    lon: -3.5990,
  }),
  lead({
    id: "demo:15",
    nombre: "Asesoría Datos de Muestra",
    sector: "asesoria",
    direccion: "Calle Prototipo 5",
    telefono: "958 00 00 15",
    email: "contacto@asesoriamuestra.example",
    lat: 37.1795,
    lon: -3.6055,
  }),
];

/** Copia defensiva, para que la UI no mute el catálogo de ejemplo. */
export function cargarDemo() {
  return LEADS_DEMO.map((l) => ({ ...l, redes: { ...l.redes } }));
}
