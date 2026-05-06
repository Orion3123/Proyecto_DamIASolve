#!/usr/bin/env node
/**
 * fathom-client.mjs
 *
 * Cliente minimo de Fathom API para la skill `comercial`.
 * Uso: node fathom-client.mjs [--meeting-id <id>]
 *
 * Lee la API key desde:
 *   1. flag --api-key <key>
 *   2. variable de entorno FATHOM_API_KEY
 *   3. config.json (en el directorio padre del script)
 *
 * Por defecto: devuelve la ULTIMA reunion del usuario en JSON.
 *
 * Salida exitosa (stdout, JSON):
 * {
 *   "ok": true,
 *   "meeting": {
 *     "meeting_id": "...",
 *     "title": "...",
 *     "date": "2026-04-19T10:30:00Z",
 *     "duration_minutes": 47,
 *     "language_hint": "es",
 *     "participants": [{"name": "...", "email": "..."}],
 *     "transcript": "..."
 *   }
 * }
 *
 * Error (stderr + exit 1):
 * { "ok": false, "error": "...", "hint": "..." }
 *
 * NOTA: La API publica de Fathom puede variar segun el plan y la fecha.
 * Este script asume endpoints REST estandar. Ajusta las URLs si cambian.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- Config loader ----------
function loadConfig() {
  const configPath = resolve(__dirname, '..', 'config.json');
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

// ---------- CLI arg parsing ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--meeting-id') args.meetingId = argv[++i];
    else if (a === '--api-key') args.apiKey = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`fathom-client.mjs — Cliente Fathom API para skill 'comercial'

Uso:
  node fathom-client.mjs                       # Trae la ultima reunion
  node fathom-client.mjs --meeting-id <id>     # Trae una reunion concreta
  node fathom-client.mjs --api-key <key>       # Usa API key especifica

Fuentes API key (en orden de prioridad):
  1. --api-key <key>
  2. FATHOM_API_KEY (env var)
  3. config.json -> fathom.api_key
`);
}

// ---------- Output helpers ----------
function fail(error, hint) {
  process.stderr.write(JSON.stringify({ ok: false, error, hint }) + '\n');
  process.exit(1);
}
function success(payload) {
  process.stdout.write(JSON.stringify({ ok: true, ...payload }, null, 2) + '\n');
}

// ---------- Main ----------
async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printHelp(); return; }

  const config = loadConfig();
  const apiKey = args.apiKey
    || process.env.FATHOM_API_KEY
    || (config.fathom && config.fathom.api_key);

  if (!apiKey || apiKey.trim() === '') {
    fail(
      'No Fathom API key configured',
      'Configura config.fathom.api_key en ~/.claude/skills/comercial/config.json o usa la variable de entorno FATHOM_API_KEY. Si no tienes plan con API, la skill caera a modo manual.'
    );
  }

  const base = 'https://api.fathom.video/v1';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
    'User-Agent': 'comercial-skill/1.0'
  };

  try {
    // 1. Obtener ID de la reunion (ultima si no se especifica)
    let meetingId = args.meetingId;
    if (!meetingId) {
      const listResp = await fetch(`${base}/meetings?limit=1&sort=-started_at`, { headers });
      if (!listResp.ok) {
        fail(
          `Fathom API error ${listResp.status}`,
          listResp.status === 401
            ? 'API key invalida o expirada. Revisa config.fathom.api_key.'
            : 'Verifica que tu plan de Fathom incluya acceso a la API.'
        );
      }
      const listData = await listResp.json();
      const meetings = listData.meetings || listData.data || listData.items || [];
      if (!meetings.length) fail('No meetings found', 'No hay reuniones recientes en tu cuenta de Fathom.');
      meetingId = meetings[0].id || meetings[0].meeting_id || meetings[0].uuid;
    }

    // 2. Obtener detalle + transcripcion
    const detailResp = await fetch(`${base}/meetings/${meetingId}?include=transcript,participants`, { headers });
    if (!detailResp.ok) fail(`Fathom API error ${detailResp.status}`, 'No se pudo obtener el detalle de la reunion.');
    const detail = await detailResp.json();

    // 3. Normalizar respuesta (los nombres de campos pueden variar segun version API)
    const m = detail.meeting || detail.data || detail;
    const transcript = m.transcript
      || m.transcription
      || (Array.isArray(m.transcript_segments)
          ? m.transcript_segments.map(s => `${s.speaker || 'Speaker'}: ${s.text || s.content || ''}`).join('\n')
          : '');

    if (!transcript || transcript.trim().length < 50) {
      fail(
        'Transcript unavailable or too short',
        'La reunion no tiene transcripcion procesada aun. Espera unos minutos o pasa a modo manual.'
      );
    }

    success({
      meeting: {
        meeting_id: m.id || m.meeting_id || meetingId,
        title: m.title || m.name || 'Reunion sin titulo',
        date: m.started_at || m.start_time || m.date || null,
        duration_minutes: m.duration_minutes || (m.duration_seconds ? Math.round(m.duration_seconds / 60) : null),
        language_hint: m.language || m.locale || null,
        participants: (m.participants || m.attendees || []).map(p => ({
          name: p.name || p.display_name || p.email || 'Unknown',
          email: p.email || null,
          is_host: !!p.is_host
        })),
        transcript: transcript.trim()
      }
    });

  } catch (err) {
    fail(
      `Unexpected error: ${err.message}`,
      'Si el problema persiste, cae al modo manual: pega la transcripcion cuando la skill te la pida.'
    );
  }
}

main();
