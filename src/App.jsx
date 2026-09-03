import React, { useState } from "react";
import AnalizadorProcesos from "./analizador/AnalizadorProcesos";
import B2BHunter from "./b2b/B2BHunter";

/**
 * Punto de entrada de las herramientas de DamIASolve.
 *
 * No usamos router para no añadir dependencias: con un estado basta para
 * alternar entre la pantalla de inicio y cada herramienta.
 */
const HERRAMIENTAS = [
  {
    id: "hunter",
    nombre: "B2B Hunter",
    resumen: "Busca clientes potenciales por ciudad y sector, y genera la propuesta en un click.",
    emoji: "🎯",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "analizador",
    nombre: "Analizador de Procesos",
    resumen: "Diagnóstico rápido de ineficiencias y cuellos de botella en un negocio.",
    emoji: "🔎",
    color: "from-slate-600 to-slate-700",
  },
];

export default function App() {
  const [herramienta, setHerramienta] = useState(null);

  const volver = () => setHerramienta(null);

  if (herramienta === "analizador") {
    return <AnalizadorProcesos onVolver={volver} />;
  }

  if (herramienta === "hunter") {
    return <B2BHunter onVolver={volver} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center mb-8">
          <img
            src="/Logo_DamIASolve111.png"
            alt="DamIASolve"
            className="h-12 mr-3"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DamIASolve</h1>
            <p className="text-gray-500 text-sm">
              Herramientas para micropymes y negocios locales
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {HERRAMIENTAS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setHerramienta(h.id)}
              className="text-left bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className={`bg-gradient-to-r ${h.color} p-5`}>
                <span className="text-3xl" aria-hidden="true">
                  {h.emoji}
                </span>
                <h2 className="text-white text-lg font-semibold mt-2">
                  {h.nombre}
                </h2>
              </div>
              <p className="p-5 text-gray-600 text-sm">{h.resumen}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
