import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [answers, setAnswers] = useState([]);
  const questions = [
    {
      text: "¿Cómo gestionas actualmente los pedidos o citas?",
      type: "multiple",
      options: [
        "Manual en papel",
        "WhatsApp/Chat",
        "Software dedicado",
        "No gestiono",
      ],
    },
    {
      text: "¿Tienes demoras frecuentes en la atención al cliente?",
      type: "yesno",
    },
    { text: "¿Controlas tu inventario de forma digital?", type: "yesno" },
    {
      text: "¿Tienes tareas repetitivas que consumen mucho tiempo?",
      type: "yesno",
    },
    {
      text: "¿Cómo comunicas cambios o instrucciones a tu equipo?",
      type: "multiple",
      options: [
        "Verbal",
        "Documentos impresos",
        "Emails/Chat",
        "Sin protocolo",
      ],
    },
  ];

  const suggestions = [
    {
      title: "Automatizar registro de pedidos",
      description:
        "Crear un flujo en Make.com que capture órdenes y las almacene automáticamente en tu base de datos.",
      link: "https://www.make.com/es/scenario/registro-pedidos",
    },
    {
      title: "Notificaciones a equipo",
      description:
        "Configurar alerta en Make.com para que tu equipo reciba un resumen diario de tareas pendientes.",
      link: "https://www.make.com/es/scenario/notificaciones-equipo",
    },
    {
      title: "Actualización de inventario",
      description:
        "Integrar tu sistema de inventario con hojas de cálculo mediante Make.com para sincronizar niveles automáticamente.",
      link: "https://www.make.com/es/scenario/inventario-sync",
    },
  ];

  const [qIndex, setQIndex] = useState(0);

  function handleAnswer(answer) {
    setAnswers((prev) => [...prev, answer]);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setScreen("results");
    }
  }

  // Prepare data for chart
  const yesCount = answers.filter((a) => a === "Sí").length;
  const noCount = answers.filter((a) => a === "No").length;
  const chartData = [
    { name: "Sí", value: yesCount },
    { name: "No", value: noCount },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center bg-blue-600 p-4">
          {/* Ajuste para ruta correcta del logo en public */}
          <img
            src="/Logo_DamIASolve111.png"
            alt="DamIASolve"
            className="h-10 mr-2"
          />
          <h1 className="text-white text-xl font-bold">DamIASolve</h1>
        </div>

        {/* Screens */}
        {screen === "welcome" && (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Analizador de Procesos
            </h2>
            <p className="text-gray-600 mb-6">
              Descubre ineficiencias operativas y cuellos de botella en tu
              negocio.
            </p>
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              onClick={() => setScreen("quiz")}
            >
              Comenzar diagnóstico
            </button>
          </div>
        )}

        {screen === "quiz" && (
          <div className="p-6">
            <p className="text-gray-800 font-medium mb-3">
              {`Pregunta ${qIndex + 1} de ${questions.length}`}
            </p>
            <h3 className="text-lg font-semibold mb-4">
              {questions[qIndex].text}
            </h3>

            <div className="space-y-3">
              {questions[qIndex].type === "yesno"
                ? ["Sí", "No"].map((opt) => (
                    <button
                      key={opt}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                      onClick={() => handleAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))
                : questions[qIndex].options.map((opt) => (
                    <button
                      key={opt}
                      className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                      onClick={() => handleAnswer(opt)}
                    >
                      {opt}
                    </button>
                  ))}
            </div>
          </div>
        )}

        {screen === "results" && (
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Resultados del Diagnóstico
            </h2>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start">
                <div className="h-3 w-3 bg-orange-400 rounded-full mt-2 mr-3"></div>
                <p>
                  <strong>Procesos manuales:</strong> Muchas tareas se realizan
                  en papel o chat, reduciendo eficiencia.
                </p>
              </li>
              <li className="flex items-start">
                <div className="h-3 w-3 bg-yellow-400 rounded-full mt-2 mr-3"></div>
                <p>
                  <strong>Cuellos de botella:</strong> Identificados en atención
                  al cliente y coordinación interna.
                </p>
              </li>
              <li className="flex items-start">
                <div className="h-3 w-3 bg-red-400 rounded-full mt-2 mr-3"></div>
                <p>
                  <strong>Tareas repetitivas:</strong> Varias actividades
                  podrían automatizarse con low-code.
                </p>
              </li>
            </ul>

            {/* Chart Visualization */}
            <div className="w-full h-40 mb-6">
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations and Make.com links */}
            <h3 className="text-xl font-semibold mb-3">
              Sugerencias de Automatización
            </h3>
            <div className="space-y-4 mb-6">
              {suggestions.map((sug) => (
                <div key={sug.title} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-1">{sug.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">
                    {sug.description}
                  </p>
                  <a
                    href={sug.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver escenario en Make.com
                  </a>
                </div>
              ))}
            </div>

            <button
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              onClick={() => {
                setAnswers([]);
                setQIndex(0);
                setScreen("welcome");
              }}
            >
              Reiniciar diagnóstico
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
