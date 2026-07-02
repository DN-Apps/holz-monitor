'use client';

import { useEffect, useState } from 'react';

const NUTZBARE_HOEHE_CM = 115; // 120 cm Deckenhoehe minus 5 cm Sensorabstand
type Language = 'de' | 'en';

const TEXT = {
  de: {
    appTitle: 'Holz-Monitor',
    appSubtitle: 'Mobile-first Dashboard fuer den Fuellstand entlang der Treppe.',
    languageLabel: 'Sprache',
    languageGerman: 'Deutsch',
    languageEnglish: 'English',
    systemStatus: 'Systemstatus',
    loading: 'Lade Sensor-Daten...',
    loadingError: 'Sensor-Daten konnten nicht geladen werden.',
    stairSectionLabel: 'Grafische Treppenansicht',
    sensorSectionLabel: 'Fuellstand pro Sensor',
    sensorLabel: 'Sensor',
    distanceLabel: 'Abstand',
    lastMeasurement: 'Letzte Messung',
    noLiveData: 'Keine Live-Daten',
    waitingData: 'Warte auf Sensordaten...',
    progressLabel: 'Fuellstand Sensor',
    svgTitle: 'Treppenprofil mit Sensor-Fuellstaenden',
    svgDesc: 'Die Balken zeigen den Fuellstand pro Sensor entlang der Treppe in Prozent.',
    caption: 'Live-Ansicht der vier Sensoren (Update alle 3 Sekunden)',
    locale: 'de-DE',
  },
  en: {
    appTitle: 'Wood Monitor',
    appSubtitle: 'Mobile-first dashboard for staircase fill level monitoring.',
    languageLabel: 'Language',
    languageGerman: 'German',
    languageEnglish: 'English',
    systemStatus: 'System status',
    loading: 'Loading sensor data...',
    loadingError: 'Sensor data could not be loaded.',
    stairSectionLabel: 'Graphic staircase view',
    sensorSectionLabel: 'Fill level per sensor',
    sensorLabel: 'Sensor',
    distanceLabel: 'Distance',
    lastMeasurement: 'Last reading',
    noLiveData: 'No live data',
    waitingData: 'Waiting for sensor data...',
    progressLabel: 'Fill level sensor',
    svgTitle: 'Stair profile with sensor fill levels',
    svgDesc: 'Bars display the fill level for each sensor along the staircase in percent.',
    caption: 'Live view of all four sensors (updates every 3 seconds)',
    locale: 'en-US',
  },
} as const;

const SENSOR_CONFIG = [
  { id: 1, maxHoehe: 300 },
  { id: 2, maxHoehe: 230 },
  { id: 3, maxHoehe: 150 },
  { id: 4, maxHoehe: 150 },
] as const;

type Messung = {
  sensor_id: number;
  abstand: number;
  zeitstempel?: string;
};

type SensorStatus = {
  id: number;
  fuellstand: number;
  farbe: string;
  abstand: number;
  zeitstempel?: string;
  hatDaten: boolean;
};

function getFarbe(fuellstand: number) {
  if (fuellstand < 30) return '#ef4444';
  if (fuellstand < 80) return '#eab308';
  return '#22c55e';
}

function berechneFuellstand(abstand: number) {
  return Math.max(0, Math.min(100, ((NUTZBARE_HOEHE_CM - abstand) / NUTZBARE_HOEHE_CM) * 100));
}

function SensorKarte({ sensor, language }: { sensor: SensorStatus; language: Language }) {
  const t = TEXT[language];
  const farbe = getFarbe(sensor.fuellstand);

  const zeitText = sensor.zeitstempel
    ? new Date(sensor.zeitstempel).toLocaleTimeString(t.locale)
    : t.noLiveData;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">{t.sensorLabel} {sensor.id}</h3>
      <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{sensor.fuellstand.toFixed(1)}%</p>
      <p className="mt-1 text-sm text-slate-600">{t.distanceLabel}: {sensor.abstand.toFixed(1)} cm</p>
      <p className="mt-1 text-xs text-slate-500">{t.lastMeasurement}: {zeitText}</p>
      {!sensor.hatDaten ? <p className="mt-1 text-xs font-medium text-amber-700">{t.waitingData}</p> : null}
      <div
        className="mt-3 h-2 w-full rounded-full bg-slate-200"
        role="progressbar"
        aria-label={`${t.progressLabel} ${sensor.id}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sensor.fuellstand)}
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${sensor.fuellstand}%`, backgroundColor: farbe }}
        />
      </div>
    </li>
  );
}

function TreppenVisualisierung({ sensoren, language }: { sensoren: SensorStatus[]; language: Language }) {
  const t = TEXT[language];
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 md:p-6">
      <svg
        viewBox="0 0 800 500"
        className="h-auto w-full"
        role="img"
        aria-labelledby="treppe-title treppe-desc"
      >
        <title id="treppe-title">{t.svgTitle}</title>
        <desc id="treppe-desc">
          {t.svgDesc}
        </desc>

        <defs>
          <linearGradient id="stair-body" x1="50" y1="150" x2="650" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="55%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="stair-shadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0" />
          </linearGradient>
          <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
        </defs>

        <g opacity="0.45">
          <rect x="64" y="-42" width="172" height="378" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
          <rect x="82" y="-24" width="136" height="310" rx="3" fill="#cbd5e1" />
          <circle cx="200" cy="76" r="4" fill="#334155" />
        </g>

        <g transform="translate(0 20)">
          <g opacity="0.32">
            <line x1="292" y1="142" x2="744" y2="317" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
            <line x1="292" y1="142" x2="744" y2="317" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <line x1="349" y1="164" x2="339" y2="190" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="442" y1="200" x2="432" y2="226" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="535" y1="236" x2="525" y2="262" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="628" y1="272" x2="618" y2="298" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <line x1="721" y1="308" x2="711" y2="334" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          </g>

          <g filter="url(#soft-shadow)">
            <path
              d="M50 450 L50 150 L250 150 L250 220 L450 220 L450 300 L650 300 L650 450 Z"
              fill="url(#stair-body)"
              stroke="#0f172a"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            <path d="M52 446 L648 446 L648 450 L52 450 Z" fill="#475569" opacity="0.18" />

            <line x1="50" y1="150" x2="250" y2="150" stroke="#475569" strokeWidth="2" opacity="0.85" />
            <line x1="250" y1="220" x2="450" y2="220" stroke="#475569" strokeWidth="2" opacity="0.85" />
            <line x1="450" y1="300" x2="650" y2="300" stroke="#475569" strokeWidth="2" opacity="0.85" />

            <line x1="250" y1="150" x2="250" y2="220" stroke="url(#stair-shadow)" strokeWidth="4" opacity="0.75" />
            <line x1="450" y1="220" x2="450" y2="300" stroke="url(#stair-shadow)" strokeWidth="4" opacity="0.75" />
            <line x1="650" y1="300" x2="650" y2="450" stroke="url(#stair-shadow)" strokeWidth="4" opacity="0.75" />
          </g>

          {sensoren.map((sensor, index) => {
            const x = 70 + index * 150;
            const balkenHoehe = (sensor.fuellstand / 100) * SENSOR_CONFIG[index].maxHoehe;
            const y = 450 - balkenHoehe;

            return (
              <g key={sensor.id}>
                <rect x={x} y={y} width={100} height={balkenHoehe} fill={sensor.farbe} opacity={0.85} rx={4} />
                <text
                  x={x + 50}
                  y={440}
                  textAnchor="middle"
                  fontSize="14"
                  fill="#ffffff"
                  fontWeight="700"
                >
                  {sensor.fuellstand.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <figcaption className="mt-3 text-sm text-slate-600">{t.caption}</figcaption>
    </figure>
  );
}

export default function Home() {
  const [messungen, setMessungen] = useState<Messung[]>([]);
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'de';

    const gespeichert = window.localStorage.getItem('holz-monitor-language');
    if (gespeichert === 'de' || gespeichert === 'en') {
      return gespeichert;
    }

    const browserSprache = window.navigator.language.toLowerCase();
    return browserSprache.startsWith('en') ? 'en' : 'de';
  });
  const [hatFehler, setHatFehler] = useState(false);
  const [laedt, setLaedt] = useState(true);
  const t = TEXT[language];

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('holz-monitor-language', language);
  }, [language]);

  useEffect(() => {
    const controller = new AbortController();

    const laden = async () => {
      try {
        const res = await fetch(`/sensor?t=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) {
          throw new Error(`Serverantwort ${res.status}`);
        }
        const data: Messung[] = await res.json();
        setMessungen(data.slice(0, SENSOR_CONFIG.length));
        setHatFehler(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        setHatFehler(true);
        console.error(error);
      } finally {
        setLaedt(false);
      }
    };

    laden();
    const interval = setInterval(laden, 3000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const sensoren: SensorStatus[] = SENSOR_CONFIG.map((sensorConfig) => {
    const messung = messungen.find((eintrag) => eintrag.sensor_id === sensorConfig.id);
    const abstand = messung?.abstand ?? NUTZBARE_HOEHE_CM;
    const fuellstand = berechneFuellstand(abstand);
    return {
      id: sensorConfig.id,
      abstand,
      fuellstand,
      farbe: getFarbe(fuellstand),
      zeitstempel: messung?.zeitstempel,
      hatDaten: Boolean(messung),
    };
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.appTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
              {t.appSubtitle}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span>{t.languageLabel}</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800"
              aria-label={t.languageLabel}
            >
              <option value="de">{t.languageGerman}</option>
              <option value="en">{t.languageEnglish}</option>
            </select>
          </label>
        </header>

        <section aria-live="polite" aria-busy={laedt} className="space-y-3">
          <h2 className="sr-only">{t.systemStatus}</h2>
          {laedt ? <p className="text-sm text-slate-700">{t.loading}</p> : null}
          {hatFehler ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{t.loadingError}</p> : null}
        </section>

        <section aria-label={t.stairSectionLabel}>
          <TreppenVisualisierung sensoren={sensoren} language={language} />
        </section>

        <section aria-label={t.sensorSectionLabel}>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sensoren.map((sensor) => (
              <SensorKarte key={sensor.id} sensor={sensor} language={language} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}