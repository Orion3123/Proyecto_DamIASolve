// ============================================================
// GMAIL → DRIVE: GUARDADO AUTOMÁTICO DE PDFs ADJUNTOS
// Google Apps Script — Versión completa y lista para producción
// ============================================================
// Función principal: guardarPDFsDeGmail()
// Trigger:          crearTriggerAutomatico()
// Diagnóstico:      diagnosticar()
// ============================================================


// ============================================================
// SECCIÓN 1: CONFIGURACIÓN
// ► PERSONALIZA ESTAS VARIABLES ANTES DE EJECUTAR EL SCRIPT ◄
// ============================================================
var CONFIG = {

  // ── OBLIGATORIO ───────────────────────────────────────────
  // ID de la carpeta de Google Drive donde se guardarán los PDFs.
  // Cómo obtenerlo: abre la carpeta en Drive → mira la URL
  // Ejemplo URL: https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuV
  //                                                      ^^^^^^^^^^^^^^^^^^^^^^^^ ← esto es el ID
  DRIVE_FOLDER_ID: "PON_AQUI_EL_ID_DE_TU_CARPETA",

  // ── ETIQUETAS DE GMAIL ────────────────────────────────────
  // Se crean automáticamente si no existen.
  LABEL_PROCESADO: "PDF_GUARDADO_DRIVE",   // Correo procesado con éxito
  LABEL_ERROR:     "PDF_ERROR_DRIVE",       // Correo con error al procesar

  // ── FILTROS OPCIONALES ────────────────────────────────────
  // Dejar vacío ("") para desactivar cada filtro.
  FILTRO_REMITENTE: "",   // Ej: "facturas@proveedor.com"
  FILTRO_ASUNTO:    "",   // Ej: "Factura"  (busca ese texto en el asunto)
  FILTRO_ETIQUETA:  "",   // Ej: "Facturas" (etiqueta de Gmail ya existente)

  // ── SEGURIDAD AL ACTIVAR ──────────────────────────────────
  // Nº de días hacia atrás para buscar correos.
  // Recomendado: empezar con 1 o 2 días, ampliar después.
  // Pon 0 para no limitar por fecha (procesa TODOS los no procesados).
  DIAS_ATRAS: 7,

  // Máximo de hilos a procesar en cada ejecución del trigger.
  // Apps Script tiene un límite de ~6 min por ejecución; 50 es seguro.
  MAX_HILOS: 50,

  // ── ANTI-DUPLICADOS (método robusto) ─────────────────────
  // true  → guarda el ID de cada mensaje procesado en PropertiesService.
  //         MÁS FIABLE. Recomendado en producción.
  // false → solo usa la etiqueta de Gmail (más simple, menos robusto).
  USAR_CACHE_IDS: true,

  // ── LOG EN GOOGLE SHEETS (opcional) ──────────────────────
  // Deja vacío ("") para desactivar.
  // Si lo activas, pega el ID de tu hoja de cálculo.
  SHEETS_LOG_ID:   "",
  SHEETS_LOG_HOJA: "Log_PDFs",
};


// ============================================================
// SECCIÓN 2: FUNCIÓN PRINCIPAL
// ► Esta es la función que se ejecuta (manual o por trigger) ◄
// ============================================================

/**
 * Busca correos en Gmail con adjuntos PDF y los guarda en Drive.
 * Errores individuales no detienen la ejecución general.
 */
function guardarPDFsDeGmail() {
  Logger.log("=== INICIO: " + new Date().toLocaleString() + " ===");

  // 1. Verificar carpeta de destino
  var carpetaDrive;
  try {
    carpetaDrive = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log("Carpeta Drive: \"" + carpetaDrive.getName() + "\"");
  } catch (e) {
    Logger.log("ERROR CRÍTICO: carpeta de Drive inaccesible. Revisa DRIVE_FOLDER_ID.");
    Logger.log(e.toString());
    return; // Sin carpeta de destino no podemos continuar
  }

  // 2. Preparar etiquetas de Gmail (se crean si no existen)
  var etiquetaOK  = _obtenerOCrearEtiqueta(CONFIG.LABEL_PROCESADO);
  var etiquetaERR = _obtenerOCrearEtiqueta(CONFIG.LABEL_ERROR);

  // 3. Construir query y buscar hilos
  var query = _construirQuery();
  Logger.log("Query: " + query);

  var hilos;
  try {
    hilos = GmailApp.search(query, 0, CONFIG.MAX_HILOS);
  } catch (e) {
    Logger.log("ERROR al buscar en Gmail: " + e.toString());
    return;
  }
  Logger.log("Hilos encontrados: " + hilos.length);

  // 4. Contadores para el resumen final
  var cntProcesados = 0, cntGuardados = 0, cntDuplicados = 0, cntErrores = 0;
  var detallesLog = [];

  // 5. Procesar cada hilo → cada mensaje → cada adjunto
  for (var i = 0; i < hilos.length; i++) {
    var hilo     = hilos[i];
    var mensajes = hilo.getMessages();

    for (var j = 0; j < mensajes.length; j++) {
      var msg = mensajes[j];

      // Saltar mensajes ya procesados
      if (_esMensajeProcesado(msg)) {
        cntDuplicados++;
        continue;
      }

      cntProcesados++;
      var tuvoPDFs  = false;
      var tuvoError = false;

      var adjuntos = msg.getAttachments();

      for (var k = 0; k < adjuntos.length; k++) {
        var adj = adjuntos[k];

        // Solo PDFs
        if (!_esPDF(adj)) {
          Logger.log("Omitido (no PDF): " + adj.getName() + " [" + adj.getContentType() + "]");
          continue;
        }

        tuvoPDFs = true;

        try {
          var res = _guardarPDFenDrive(adj, msg, carpetaDrive);

          if (res.guardado) {
            cntGuardados++;
            Logger.log("✓ Guardado: " + res.nombreFinal);
            detallesLog.push({ accion: "GUARDADO", asunto: msg.getSubject(),
              remitente: msg.getFrom(), archivo: res.nombreFinal, error: "" });
          } else {
            cntDuplicados++;
            Logger.log("≈ Ya existía: " + res.nombreFinal);
            detallesLog.push({ accion: "DUPLICADO", asunto: msg.getSubject(),
              remitente: msg.getFrom(), archivo: res.nombreFinal, error: "" });
          }

        } catch (e) {
          tuvoError = true;
          cntErrores++;
          Logger.log("✗ ERROR | Asunto: " + msg.getSubject()
            + " | Archivo: " + adj.getName() + " | " + e.toString());
          detallesLog.push({ accion: "ERROR", asunto: msg.getSubject(),
            remitente: msg.getFrom(), archivo: adj.getName(), error: e.toString() });
        }
      }

      // Etiquetar el hilo según resultado
      try {
        if (tuvoPDFs && !tuvoError) {
          hilo.addLabel(etiquetaOK);
          _marcarMensajeProcesado(msg);
        } else if (tuvoError) {
          hilo.addLabel(etiquetaERR);
        }
      } catch (e) {
        Logger.log("Error al etiquetar hilo: " + e.toString());
      }
    }
  }

  // 6. Resumen en Logger
  Logger.log("── RESUMEN ──────────────────────────");
  Logger.log("Mensajes evaluados : " + cntProcesados);
  Logger.log("PDFs guardados     : " + cntGuardados);
  Logger.log("Duplicados omitidos: " + cntDuplicados);
  Logger.log("Errores            : " + cntErrores);
  Logger.log("=== FIN ===");

  // 7. Log opcional en Sheets
  if (CONFIG.SHEETS_LOG_ID !== "") {
    _guardarLogEnSheets(detallesLog);
  }
}


// ============================================================
// SECCIÓN 3: FUNCIONES AUXILIARES — GMAIL Y QUERY
// ============================================================

/**
 * Construye la query de búsqueda de Gmail según la configuración.
 * Usa operadores nativos de Gmail para mayor eficiencia.
 */
function _construirQuery() {
  var partes = [];

  // Solo correos con adjuntos (operador Gmail nativo)
  partes.push("has:attachment");

  // Excluir correos ya marcados como procesados
  partes.push("-label:" + CONFIG.LABEL_PROCESADO.replace(/ /g, "-"));

  // Filtros opcionales
  if (CONFIG.FILTRO_REMITENTE !== "") partes.push("from:" + CONFIG.FILTRO_REMITENTE);
  if (CONFIG.FILTRO_ASUNTO    !== "") partes.push("subject:(" + CONFIG.FILTRO_ASUNTO + ")");
  if (CONFIG.FILTRO_ETIQUETA  !== "") partes.push("label:" + CONFIG.FILTRO_ETIQUETA.replace(/ /g, "-"));

  // Límite temporal de seguridad
  if (CONFIG.DIAS_ATRAS && CONFIG.DIAS_ATRAS > 0) {
    partes.push("newer_than:" + CONFIG.DIAS_ATRAS + "d");
  }

  return partes.join(" ");
}

/**
 * Obtiene una etiqueta de Gmail o la crea si no existe.
 */
function _obtenerOCrearEtiqueta(nombre) {
  var etq = GmailApp.getUserLabelByName(nombre);
  if (!etq) {
    etq = GmailApp.createLabel(nombre);
    Logger.log("Etiqueta creada: " + nombre);
  }
  return etq;
}


// ============================================================
// SECCIÓN 4: FUNCIONES AUXILIARES — ANTI-DUPLICADOS
// ============================================================

/**
 * Comprueba si un mensaje ya fue procesado.
 * Combina: etiqueta en el hilo + ID en PropertiesService (si activado).
 *
 * MÉTODO SIMPLE   → etiqueta en el hilo (se verifica vía la query de búsqueda
 *                   con -label:..., pero también se comprueba aquí por seguridad).
 * MÉTODO ROBUSTO  → PropertiesService guarda el ID único de cada mensaje Gmail.
 *                   Sobrevive a cambios de etiqueta o eliminaciones accidentales.
 */
function _esMensajeProcesado(msg) {
  // Comprobación de etiqueta en el hilo (defensa secundaria)
  var etiquetas = msg.getThread().getLabels();
  for (var i = 0; i < etiquetas.length; i++) {
    if (etiquetas[i].getName() === CONFIG.LABEL_PROCESADO) return true;
  }

  // Comprobación por ID almacenado
  if (CONFIG.USAR_CACHE_IDS) {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty("msg_" + msg.getId()) === "1") return true;
  }

  return false;
}

/**
 * Registra un mensaje como procesado en PropertiesService.
 */
function _marcarMensajeProcesado(msg) {
  if (CONFIG.USAR_CACHE_IDS) {
    PropertiesService.getScriptProperties()
      .setProperty("msg_" + msg.getId(), "1");
  }
}

/**
 * Comprueba si un archivo con el mismo nombre Y tamaño ya existe en la carpeta.
 * Criterio: mismo nombre + mismo tamaño → duplicado con alta confianza.
 * Si solo coincide el nombre pero el tamaño difiere, no es duplicado
 * (puede ser una versión actualizada del mismo documento).
 */
function _existeEnDrive(nombre, tamanio, carpeta) {
  var iter = carpeta.getFilesByName(nombre);
  while (iter.hasNext()) {
    var archivo = iter.next();
    if (archivo.getSize() === tamanio) return true;
  }
  return false;
}


// ============================================================
// SECCIÓN 5: FUNCIONES AUXILIARES — ARCHIVOS Y DRIVE
// ============================================================

/**
 * Determina si un adjunto es un PDF.
 * Comprueba tanto el MIME type como la extensión del nombre (más robusto).
 */
function _esPDF(adjunto) {
  var mime   = adjunto.getContentType() || "";
  var nombre = adjunto.getName().toLowerCase();
  return mime === "application/pdf" || nombre.endsWith(".pdf");
}

/**
 * Guarda un adjunto PDF en la carpeta de Drive.
 * Devuelve { guardado: bool, nombreFinal: string }.
 *
 * Lógica de nombre de archivo:
 *   AAAA-MM-DD_NombreOriginal.pdf
 *   Ejemplo: 2024-03-15_Factura_001.pdf
 *
 * Esto evita colisiones entre PDFs de distintas fechas con el mismo nombre,
 * facilita la ordenación cronológica y hace los archivos fácilmente localizables.
 */
function _guardarPDFenDrive(adjunto, msg, carpeta) {
  var nombreOriginal = adjunto.getName();
  var tamanio        = adjunto.getSize();

  // Generar nombre final con prefijo de fecha
  var nombreFinal = _generarNombre(nombreOriginal, msg);

  // Comprobar duplicado en Drive (nombre final + tamaño)
  if (_existeEnDrive(nombreFinal, tamanio, carpeta)) {
    return { guardado: false, nombreFinal: nombreFinal };
  }

  // Guardar en Drive
  var blob = adjunto.copyBlob().setName(nombreFinal);
  carpeta.createFile(blob);

  return { guardado: true, nombreFinal: nombreFinal };
}

/**
 * Genera el nombre de archivo final: AAAA-MM-DD_NombreOriginalLimpio.pdf
 * Elimina caracteres no permitidos en Drive (/\:*?"<>|).
 */
function _generarNombre(nombreOriginal, msg) {
  var fecha    = msg.getDate();
  var prefijo  = Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd");
  var limpio   = nombreOriginal.replace(/[\/\\:*?"<>|]/g, "_").trim();
  return prefijo + "_" + limpio;
}


// ============================================================
// SECCIÓN 6: LOG OPCIONAL EN GOOGLE SHEETS
// ============================================================

/**
 * Guarda cada acción del script en una hoja de cálculo.
 * Solo se ejecuta si CONFIG.SHEETS_LOG_ID está configurado.
 * Columnas: Fecha | Acción | Asunto | Remitente | Archivo | Error
 */
function _guardarLogEnSheets(detalles) {
  try {
    var ss   = SpreadsheetApp.openById(CONFIG.SHEETS_LOG_ID);
    var hoja = ss.getSheetByName(CONFIG.SHEETS_LOG_HOJA);

    // Crear pestaña con cabecera si no existe
    if (!hoja) {
      hoja = ss.insertSheet(CONFIG.SHEETS_LOG_HOJA);
      hoja.appendRow(["Fecha", "Acción", "Asunto", "Remitente", "Archivo", "Error"]);
      hoja.setFrozenRows(1);
    }

    var ahora = new Date();

    if (detalles.length === 0) {
      hoja.appendRow([ahora, "SIN_CAMBIOS", "—", "—", "—", "—"]);
    } else {
      for (var i = 0; i < detalles.length; i++) {
        var d = detalles[i];
        hoja.appendRow([ahora, d.accion, d.asunto, d.remitente, d.archivo, d.error]);
      }
    }

  } catch (e) {
    Logger.log("Error al guardar log en Sheets: " + e.toString());
    // No es un error crítico; no interrumpe la ejecución
  }
}


// ============================================================
// SECCIÓN 7: TRIGGER AUTOMÁTICO
// ► Ejecuta crearTriggerAutomatico() UNA SOLA VEZ ◄
// ============================================================

/**
 * Crea un trigger que ejecuta guardarPDFsDeGmail cada 5 minutos.
 * Si ya existe un trigger para esa función, lo elimina primero
 * para evitar ejecuciones duplicadas.
 *
 * IMPORTANTE: ejecutar esta función manualmente UNA SOLA VEZ.
 * No la incluyas en el trigger; solo es para configurarlo.
 */
function crearTriggerAutomatico() {
  _eliminarTriggersDe("guardarPDFsDeGmail");

  ScriptApp.newTrigger("guardarPDFsDeGmail")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("✓ Trigger creado: guardarPDFsDeGmail cada 5 minutos.");
}

/**
 * Elimina todos los triggers asociados a una función concreta.
 */
function _eliminarTriggersDe(nombreFuncion) {
  var todos = ScriptApp.getProjectTriggers();
  for (var i = 0; i < todos.length; i++) {
    if (todos[i].getHandlerFunction() === nombreFuncion) {
      ScriptApp.deleteTrigger(todos[i]);
      Logger.log("Trigger eliminado: " + nombreFuncion);
    }
  }
}

/**
 * Detiene la automatización eliminando todos los triggers del proyecto.
 * Útil para pausar sin borrar el código.
 */
function detenerAutomatizacion() {
  var todos = ScriptApp.getProjectTriggers();
  for (var i = 0; i < todos.length; i++) {
    ScriptApp.deleteTrigger(todos[i]);
  }
  Logger.log("Automatización detenida. Todos los triggers eliminados.");
}


// ============================================================
// SECCIÓN 8: HERRAMIENTAS DE MANTENIMIENTO
// ============================================================

/**
 * DIAGNÓSTICO — Ejecutar antes de activar el script.
 * Muestra en Logger toda la información relevante sin guardar nada.
 * No modifica Gmail ni Drive.
 */
function diagnosticar() {
  Logger.log("=== DIAGNÓSTICO (" + new Date().toLocaleString() + ") ===");

  // Carpeta de Drive
  try {
    var carpeta = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    Logger.log("✓ Carpeta Drive accesible: \"" + carpeta.getName() + "\"");
  } catch (e) {
    Logger.log("✗ Carpeta Drive NO accesible. Revisa DRIVE_FOLDER_ID.");
    Logger.log("  " + e.toString());
  }

  // Etiquetas
  Logger.log("Etiqueta procesado: " +
    (GmailApp.getUserLabelByName(CONFIG.LABEL_PROCESADO) ? "✓ existe" : "⚠ se creará al ejecutar"));
  Logger.log("Etiqueta error: " +
    (GmailApp.getUserLabelByName(CONFIG.LABEL_ERROR)     ? "✓ existe" : "⚠ se creará al ejecutar"));

  // Query y correos encontrados
  var query = _construirQuery();
  Logger.log("Query: " + query);

  try {
    var hilos = GmailApp.search(query, 0, CONFIG.MAX_HILOS);
    Logger.log("Hilos que coinciden: " + hilos.length);

    // Inspeccionar los primeros 3 hilos para dar contexto
    var limite = Math.min(hilos.length, 3);
    for (var i = 0; i < limite; i++) {
      var msgs = hilos[i].getMessages();
      for (var j = 0; j < msgs.length; j++) {
        var adjs = msgs[j].getAttachments();
        for (var k = 0; k < adjs.length; k++) {
          if (_esPDF(adjs[k])) {
            Logger.log("  PDF: \"" + adjs[k].getName() +
              "\" | Asunto: \"" + msgs[j].getSubject() + "\"");
          }
        }
      }
    }
    if (hilos.length > 3) Logger.log("  (mostrando solo los primeros 3 hilos)");

  } catch (e) {
    Logger.log("Error al buscar: " + e.toString());
  }

  // Triggers activos
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log("Triggers activos: " + triggers.length);
  for (var t = 0; t < triggers.length; t++) {
    Logger.log("  → " + triggers[t].getHandlerFunction() +
      " | Tipo: " + triggers[t].getEventType());
  }

  Logger.log("=== FIN DIAGNÓSTICO ===");
}

/**
 * Limpia el caché de IDs procesados en PropertiesService.
 *
 * ¡USAR CON PRECAUCIÓN! Si lo limpias sin quitar la etiqueta de Gmail,
 * el script no procesará de nuevo esos correos (la query los filtra).
 * Si además quitas la etiqueta de Gmail, los correos se procesarán de nuevo
 * y podrían crearse duplicados en Drive.
 *
 * Caso de uso legítimo: migración de carpeta de Drive o reseteo controlado.
 */
function limpiarCacheIDs() {
  var props   = PropertiesService.getScriptProperties();
  var claves  = props.getKeys();
  var borradas = 0;

  for (var i = 0; i < claves.length; i++) {
    if (claves[i].indexOf("msg_") === 0) {
      props.deleteProperty(claves[i]);
      borradas++;
    }
  }

  Logger.log("Caché limpiado. IDs eliminados: " + borradas);
}
