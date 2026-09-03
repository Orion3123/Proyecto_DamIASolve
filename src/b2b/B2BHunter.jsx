import React, { useCallback, useMemo, useRef, useState } from "react";
import PanelBusqueda from "./PanelBusqueda";
import FichaLead from "./FichaLead";
import ModalPropuesta from "./ModalPropuesta";
import { OFERTAS, ofertaPorId, ESTILO_FIABILIDAD } from "./ofertas";
import { puntuar } from "./senales";
import { nombreSector } from "./sectores";
import { geocodificarCiudad } from "./geocodificar";
import { buscarNegocios } from "./osm";
import { buscarEnGoogle } from "./googlePlaces";
import { cargarDemo } from "./demo";
import { descargarCsv } from "./csv";
import {
  ESTADOS,
  leerPerfil,
  guardarPerfil,
  leerAjustes,
  guardarAjustes,
  leerLeads,
  guardarLead,
  actualizarLead,
  borrarLead,
  almacenDisponible,
} from "./almacen";

const PESTANAS = [
  { id: "perfil", nombre: "1. Qué vendes" },
  { id: "buscar", nombre: "2. Buscar" },
  { id: "resultados", nombre: "3. Resultados" },
  { id: "leads", nombre: "4. Mis leads" },
];

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Aplica los filtros del formulario a la lista de leads en bruto. */
function filtrar(leads, filtros) {
  return leads.filter((lead) => {
    if (filtros.soloConTelefono && !lead.telefono) return false;
    if (filtros.soloSinWeb && lead.web) return false;
    return true;
  });
}

/** Puntúa y ordena una lista de leads frente a la oferta activa. */
function puntuarYOrdenar(leads, oferta) {
  return leads
    .map((lead) => {
      const analisis = puntuar(lead, oferta);
      return {
        ...lead,
        ...analisis,
        senalesTexto: analisis.senales.map((s) => s.etiqueta),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export default function B2BHunter({ onVolver }) {
  const [pestana, setPestana] = useState("perfil");
  const [perfil, setPerfil] = useState(() => leerPerfil());
  const [ajustes, setAjustes] = useState(() => leerAjustes());

  const [resultadosBrutos, setResultadosBrutos] = useState([]);
  const [leadsBrutos, setLeadsBrutos] = useState(() => leerLeads());

  const [buscando, setBuscando] = useState(false);
  const [progreso, setProgreso] = useState("");
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [leadPropuesta, setLeadPropuesta] = useState(null);

  // Los criterios viven aquí para que sobrevivan al cambio de pestaña: afinar
  // una búsqueda tras ver los resultados es lo más habitual, y perder la
  // selección cada vez haría la app irritante de usar.
  const [criterios, setCriterios] = useState({
    ciudades: "",
    sectores: [],
    textoLibre: "",
    soloConTelefono: false,
    soloSinWeb: false,
    limite: 100,
  });

  const cancelar = useRef(false);
  const hayAlmacen = useMemo(() => almacenDisponible(), []);

  const oferta = ofertaPorId(perfil.ofertaId) ?? OFERTAS[0];

  // Al cambiar de oferta se reordena todo al instante: el encaje depende de lo
  // que vendas, así que la misma lista se prioriza distinto.
  const resultados = useMemo(
    () => puntuarYOrdenar(resultadosBrutos, oferta),
    [resultadosBrutos, oferta]
  );
  const leadsGuardados = useMemo(
    () => puntuarYOrdenar(leadsBrutos, oferta),
    [leadsBrutos, oferta]
  );

  const idsGuardados = useMemo(
    () => new Set(leadsBrutos.map((l) => l.id)),
    [leadsBrutos]
  );

  /* ------------------------------ Perfil ------------------------------ */

  const cambiarPerfil = (campo, valor) => {
    const nuevo = { ...perfil, [campo]: valor };
    setPerfil(nuevo);
    const resultado = guardarPerfil(nuevo);
    if (!resultado.ok) setAviso(resultado.mensaje);
  };

  const cambiarAjustes = (campo, valor) => {
    const nuevo = { ...ajustes, [campo]: valor };
    setAjustes(nuevo);
    const resultado = guardarAjustes(nuevo);
    if (!resultado.ok) setAviso(resultado.mensaje);
  };

  /* ------------------------------ Búsqueda ---------------------------- */

  const buscar = useCallback(
    async ({ ciudades, sectores, filtros, limite }) => {
      cancelar.current = false;
      setBuscando(true);
      setError(null);
      setProgreso("Preparando la búsqueda…");

      const encontrados = new Map();
      const fallos = [];

      try {
        for (const ciudad of ciudades) {
          if (cancelar.current) break;

          setProgreso(`Localizando ${ciudad}…`);
          let ambito;
          try {
            ambito = await geocodificarCiudad(ciudad);
          } catch (e) {
            fallos.push(`${ciudad}: ${e.message}`);
            continue;
          }

          if (ambito.tipo === "bbox") {
            setProgreso(
              `${ambito.nombre}: uso un rectángulo aproximado, pueden colarse negocios de municipios vecinos.`
            );
            await esperar(1200);
          }

          for (const sector of sectores) {
            if (cancelar.current) break;

            // `sector` puede ser un id del catálogo o un sector de búsqueda
            // libre ya construido; para los mensajes hace falta su nombre.
            const etiquetaSector =
              typeof sector === "string" ? nombreSector(sector) : sector.nombre;

            setProgreso(`Buscando ${etiquetaSector} en ${ambito.nombre}…`);
            try {
              const encontradosAqui =
                ajustes.motor === "google"
                  ? await buscarEnGoogle(
                      ambito,
                      sector,
                      ajustes.claveGoogle,
                      limite
                    )
                  : await buscarNegocios(ambito, sector, limite, setProgreso);

              encontradosAqui.forEach((lead) => {
                if (!encontrados.has(lead.id)) encontrados.set(lead.id, lead);
              });
            } catch (e) {
              fallos.push(`${ciudad} / ${etiquetaSector}: ${e.message}`);
            }

            // Pausa de cortesía con los servidores gratuitos.
            await esperar(1500);
          }
        }

        const brutos = filtrar(Array.from(encontrados.values()), filtros);
        setResultadosBrutos(brutos);

        if (brutos.length === 0) {
          setError(
            fallos.length > 0
              ? `No se ha obtenido ningún resultado. ${fallos.join(" · ")}`
              : "No he encontrado negocios con esos criterios. Prueba con otro sector, otra ciudad o quita los filtros."
          );
        } else {
          if (fallos.length > 0) {
            setAviso(
              `Se han encontrado ${brutos.length} negocios, pero algunas consultas fallaron: ${fallos.join(" · ")}`
            );
          }
          setPestana("resultados");
        }
      } finally {
        setBuscando(false);
        setProgreso("");
      }
    },
    [ajustes]
  );

  const usarDemo = () => {
    setResultadosBrutos(cargarDemo());
    setError(null);
    setAviso(
      "Estás viendo datos de ejemplo ficticios, útiles para probar la app. No los uses para prospección real."
    );
    setPestana("resultados");
  };

  /* -------------------------------- Leads ----------------------------- */

  const alGuardar = (lead) => {
    if (lead.persistible === false) return;
    // Se guarda el lead en bruto: el score se recalcula al vuelo según la
    // oferta activa, así que almacenarlo dejaría datos obsoletos.
    const { score, encaje, contactabilidad, motivos, senales, senalesTexto, ...limpio } =
      lead;
    const resultado = guardarLead(limpio);
    if (!resultado.ok) {
      setAviso(resultado.mensaje);
      return;
    }
    setLeadsBrutos(leerLeads());
  };

  const cambiarEstado = (id, estado) => {
    const resultado = actualizarLead(id, { estado });
    if (!resultado.ok) setAviso(resultado.mensaje);
    setLeadsBrutos(leerLeads());
  };

  const cambiarNotas = (id, notas) => {
    const resultado = actualizarLead(id, { notas });
    if (!resultado.ok) setAviso(resultado.mensaje);
    setLeadsBrutos(leerLeads());
  };

  const eliminar = (id) => {
    borrarLead(id);
    setLeadsBrutos(leerLeads());
  };

  const exportar = () => {
    const resultado = descargarCsv(leadsGuardados);
    if (!resultado.ok) setAviso(resultado.mensaje);
  };

  const leadsFiltrados =
    filtroEstado === "todos"
      ? leadsGuardados
      : leadsGuardados.filter((l) => (l.estado ?? "nuevo") === filtroEstado);

  const recuento = ESTADOS.map((estado) => ({
    ...estado,
    total: leadsGuardados.filter((l) => (l.estado ?? "nuevo") === estado.id).length,
  }));

  /* --------------------------------- UI ------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="text-white/90 hover:text-white text-sm"
            >
              ← Inicio
            </button>
          )}
          <img
            src="/Logo_DamIASolve111.png"
            alt="DamIASolve"
            className="h-8 ml-auto sm:ml-0"
          />
          <h1 className="text-lg font-bold">B2B Hunter</h1>
        </div>

        <nav className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPestana(p.id)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                pestana === p.id
                  ? "border-white font-medium"
                  : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              {p.nombre}
              {p.id === "resultados" && resultados.length > 0 && (
                <span className="ml-1 text-xs">({resultados.length})</span>
              )}
              {p.id === "leads" && leadsGuardados.length > 0 && (
                <span className="ml-1 text-xs">({leadsGuardados.length})</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {!hayAlmacen && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            Tu navegador no permite guardar datos (¿modo incógnito?). Puedes
            buscar y generar propuestas, pero los leads no se conservarán al
            cerrar. Exporta a CSV antes de salir.
          </div>
        )}

        {aviso && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 flex justify-between gap-3">
            <span>{aviso}</span>
            <button
              type="button"
              onClick={() => setAviso(null)}
              className="text-amber-700 hover:text-amber-900 shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* ------------------------------ Perfil ------------------------ */}
        {pestana === "perfil" && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl p-5 border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-1">
                ¿Qué vendes?
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Esto decide a quién se prioriza. La misma lista de negocios se
                ordena distinto según lo que ofrezcas.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {OFERTAS.map((o) => {
                  const activa = perfil.ofertaId === o.id;
                  const fiabilidad = ESTILO_FIABILIDAD[o.fiabilidadSenal];
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => cambiarPerfil("ofertaId", o.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-colors ${
                        activa
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900">
                          {o.emoji} {o.nombre}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${fiabilidad.clase}`}
                        >
                          {fiabilidad.texto}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {o.descripcion}
                      </p>
                      {activa && (
                        <p className="text-xs text-gray-500 mt-2 border-t border-blue-200 pt-2">
                          {o.notaFiabilidad}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white rounded-xl p-5 border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-1">Tus datos</h2>
              <p className="text-sm text-gray-500 mb-4">
                Se usan para firmar las propuestas. Solo se guardan en este
                navegador.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { campo: "nombre", etiqueta: "Tu nombre", tipo: "text" },
                  { campo: "empresa", etiqueta: "Empresa", tipo: "text" },
                  { campo: "email", etiqueta: "Tu email", tipo: "email" },
                  { campo: "telefono", etiqueta: "Tu teléfono", tipo: "tel" },
                  { campo: "web", etiqueta: "Tu web", tipo: "text" },
                  {
                    campo: "precioOrientativo",
                    etiqueta: "Precio orientativo (opcional)",
                    tipo: "text",
                  },
                ].map(({ campo, etiqueta, tipo }) => (
                  <div key={campo}>
                    <label
                      htmlFor={campo}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {etiqueta}
                    </label>
                    <input
                      id={campo}
                      type={tipo}
                      value={perfil[campo] ?? ""}
                      onChange={(e) => cambiarPerfil(campo, e.target.value)}
                      placeholder={
                        campo === "precioOrientativo"
                          ? oferta.precioOrientativo
                          : ""
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-xl p-5 border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-1">
                Motor de búsqueda
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                OpenStreetMap es gratis y sus datos se pueden guardar. Google da
                más cobertura, pero es de pago y sus condiciones no permiten
                almacenar los resultados.
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="motor"
                    checked={ajustes.motor === "osm"}
                    onChange={() => cambiarAjustes("motor", "osm")}
                    className="mt-1"
                  />
                  <span>
                    <strong>OpenStreetMap</strong> (recomendado) — gratis, sin
                    clave, leads guardables.
                  </span>
                </label>

                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="motor"
                    checked={ajustes.motor === "google"}
                    onChange={() => cambiarAjustes("motor", "google")}
                    className="mt-1"
                  />
                  <span>
                    <strong>Google Places</strong> — más cobertura, de pago, y
                    los resultados <strong>no se pueden guardar</strong>.
                  </span>
                </label>
              </div>

              {ajustes.motor === "google" && (
                <div className="mt-4">
                  <label
                    htmlFor="claveGoogle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tu clave de Google Places API (New)
                  </label>
                  <input
                    id="claveGoogle"
                    type="password"
                    value={ajustes.claveGoogle}
                    onChange={(e) => cambiarAjustes("claveGoogle", e.target.value)}
                    placeholder="AIza…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-red-700 mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                    <strong>Importante:</strong> al ir en el navegador, esta
                    clave es visible para quien inspeccione la página.
                    Restríngela en Google Cloud por referente HTTP y limítala a
                    la Places API, o cualquiera podría gastar dinero de tu
                    cuenta. Nunca se sube al repositorio.
                  </p>
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={() => setPestana("buscar")}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              Continuar a la búsqueda →
            </button>
          </div>
        )}

        {/* ----------------------------- Buscar ------------------------- */}
        {pestana === "buscar" && (
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="mb-5 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Vendes</p>
              <p className="font-medium text-gray-900">
                {oferta.emoji} {oferta.nombre}
              </p>
              <button
                type="button"
                onClick={() => setPestana("perfil")}
                className="text-sm text-blue-600 hover:underline"
              >
                Cambiar
              </button>
            </div>

            <PanelBusqueda
              criterios={criterios}
              onCambiar={setCriterios}
              buscando={buscando}
              progreso={progreso}
              error={error}
              onBuscar={buscar}
              onCancelar={() => {
                cancelar.current = true;
              }}
              onCargarDemo={usarDemo}
            />
          </div>
        )}

        {/* ---------------------------- Resultados ---------------------- */}
        {pestana === "resultados" && (
          <div className="space-y-4">
            {resultados.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <p className="text-gray-500 mb-4">
                  Todavía no has hecho ninguna búsqueda.
                </p>
                <button
                  type="button"
                  onClick={() => setPestana("buscar")}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
                >
                  Ir a buscar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-gray-600">
                    <strong>{resultados.length}</strong> negocios, ordenados por
                    encaje con {oferta.nombre.toLowerCase()}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPestana("perfil")}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Cambiar oferta y reordenar
                  </button>
                </div>

                {resultados.map((lead) => (
                  <FichaLead
                    key={lead.id}
                    lead={lead}
                    guardado={false}
                    yaGuardado={idsGuardados.has(lead.id)}
                    onGuardar={alGuardar}
                    onPropuesta={setLeadPropuesta}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ------------------------------ Leads -------------------------- */}
        {pestana === "leads" && (
          <div className="space-y-4">
            {leadsGuardados.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <p className="text-gray-500">
                  Aún no has guardado ningún lead. Guárdalos desde la pestaña de
                  resultados.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setFiltroEstado("todos")}
                      className={`text-sm px-3 py-1 rounded-full ${
                        filtroEstado === "todos"
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      Todos ({leadsGuardados.length})
                    </button>
                    {recuento.map((estado) => (
                      <button
                        key={estado.id}
                        type="button"
                        onClick={() => setFiltroEstado(estado.id)}
                        className={`text-sm px-3 py-1 rounded-full ${
                          filtroEstado === estado.id
                            ? estado.clase
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {estado.nombre} ({estado.total})
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={exportar}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    ⬇ Exportar a CSV
                  </button>
                </div>

                {leadsFiltrados.map((lead) => (
                  <FichaLead
                    key={lead.id}
                    lead={lead}
                    guardado
                    onPropuesta={setLeadPropuesta}
                    onCambiarEstado={cambiarEstado}
                    onCambiarNotas={cambiarNotas}
                    onBorrar={eliminar}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-6 text-xs text-gray-400 space-y-1">
        <p>
          Datos de negocios © colaboradores de{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            OpenStreetMap
          </a>
          , bajo licencia ODbL. Geocodificación por Nominatim.
        </p>
        <p>
          Las señales son hipótesis deducidas de datos de mapas incompletos:
          verifícalas antes de usarlas en un mensaje comercial.
        </p>
      </footer>

      {leadPropuesta && (
        <ModalPropuesta
          lead={leadPropuesta}
          oferta={oferta}
          perfil={perfil}
          onCerrar={() => setLeadPropuesta(null)}
        />
      )}
    </div>
  );
}
