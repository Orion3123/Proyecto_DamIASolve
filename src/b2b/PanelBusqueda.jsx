import React from "react";
import { SECTORES } from "./sectores";

/**
 * Formulario de búsqueda.
 *
 * Los criterios viven en el componente padre, no aquí. Si los guardara este
 * componente, al ir a Resultados y volver se perderían ciudad y sectores,
 * obligando a rellenarlo todo otra vez para afinar una búsqueda: justo lo que
 * más se hace al prospectar.
 *
 * Las ciudades se escriben separadas por comas y se consultan EN SERIE, nunca
 * en paralelo: tanto Nominatim como Overpass son servicios gratuitos que
 * bloquean por abuso, y lanzar cinco peticiones a la vez es la forma más rápida
 * de que te corten el grifo.
 */
export default function PanelBusqueda({
  criterios,
  onCambiar,
  buscando,
  progreso,
  error,
  onBuscar,
  onCancelar,
  onCargarDemo,
}) {
  const {
    ciudades,
    sectores: sectoresElegidos,
    soloConTelefono,
    soloSinWeb,
    limite,
  } = criterios;

  const cambiar = (campo, valor) => onCambiar({ ...criterios, [campo]: valor });

  const alternarSector = (id) => {
    cambiar(
      "sectores",
      sectoresElegidos.includes(id)
        ? sectoresElegidos.filter((s) => s !== id)
        : [...sectoresElegidos, id]
    );
  };

  const listaCiudades = ciudades
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const puedeBuscar =
    listaCiudades.length > 0 && sectoresElegidos.length > 0 && !buscando;

  const enviar = (e) => {
    e.preventDefault();
    if (!puedeBuscar) return;
    onBuscar({
      ciudades: listaCiudades,
      sectores: sectoresElegidos,
      filtros: { soloConTelefono, soloSinWeb },
      limite,
    });
  };

  const consultas = listaCiudades.length * sectoresElegidos.length;

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label
          htmlFor="ciudades"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          ¿En qué ciudades?
        </label>
        <input
          id="ciudades"
          type="text"
          value={ciudades}
          onChange={(e) => cambiar("ciudades", e.target.value)}
          placeholder="Granada, Motril, Armilla"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Separa varias ciudades con comas. Se consultan una detrás de otra para
          no saturar los servidores gratuitos de mapas.
        </p>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">
          ¿Qué tipo de negocio buscas?
        </span>
        <div className="flex flex-wrap gap-2">
          {SECTORES.map((sector) => {
            const activo = sectoresElegidos.includes(sector.id);
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => alternarSector(sector.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  activo
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {sector.emoji} {sector.nombre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={soloConTelefono}
            onChange={(e) => cambiar("soloConTelefono", e.target.checked)}
            className="rounded"
          />
          Solo con teléfono
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={soloSinWeb}
            onChange={(e) => cambiar("soloSinWeb", e.target.checked)}
            className="rounded"
          />
          Solo sin web registrada
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          Máximo por búsqueda
          <select
            value={limite}
            onChange={(e) => cambiar("limite", Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
      </div>

      {consultas > 6 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Vas a lanzar {consultas} consultas. Tardará alrededor de{" "}
          {Math.ceil((consultas * 3) / 60) || 1} minuto(s) porque van en serie.
          Si solo quieres probar, empieza con una ciudad y un sector.
        </p>
      )}

      {error && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="font-medium mb-1">No se pudo completar la búsqueda</p>
          <p>{error}</p>
        </div>
      )}

      {buscando && progreso && (
        <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-3">
          {progreso}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!puedeBuscar}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {buscando ? "Buscando…" : "Buscar clientes"}
        </button>

        {buscando && (
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2.5 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={onCargarDemo}
          disabled={buscando}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Probar con datos de ejemplo
        </button>
      </div>
    </form>
  );
}
