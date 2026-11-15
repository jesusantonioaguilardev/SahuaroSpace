import { useMemo, useState } from "react";

type IconName =
  | "activity"
  | "air"
  | "alert"
  | "arrow"
  | "book"
  | "check"
  | "chevron"
  | "clock"
  | "close"
  | "comm"
  | "crew"
  | "data"
  | "earth"
  | "heart"
  | "home"
  | "lock"
  | "menu"
  | "mic"
  | "moon"
  | "pause"
  | "play"
  | "radiation"
  | "report"
  | "reset"
  | "settings"
  | "shield"
  | "spark"
  | "thermo"
  | "user"
  | "volume";

const paths: Record<IconName, React.ReactNode> = {
  activity: (
    <>
      <path d="M3 12h3l2-6 4 12 3-8 2 2h4" />
    </>
  ),
  air: (
    <>
      <path d="M4 9h11a3 3 0 1 0-3-3" />
      <path d="M3 14h15a3 3 0 1 1-3 3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5m0 3h.01" />
    </>
  ),
  arrow: (
    <>
      <path d="m5 12 14 0m-5-5 5 5-5 5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3V5.5Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  comm: (
    <>
      <path d="M5 16.5a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 9.5a2 2 0 0 1 2 0" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  crew: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5" />
    </>
  ),
  data: (
    <>
      <path d="M4 19V9m6 10V5m6 14v-7m5 7H2" />
    </>
  ),
  earth: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  heart: (
    <>
      <path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 7l-1.1-1.2a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z" />
      <path d="M7 13h2l1-3 2 6 1.5-3H17" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8" />
    </>
  ),
  moon: <path d="M20 15.5A9 9 0 0 1 8.5 4a9 9 0 1 0 11.5 11.5Z" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7V5Z" />,
  radiation: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M10.4 9.3 7 3.5A9.4 9.4 0 0 1 17 4l-3.4 5.8M9.5 13.5 3 15a9.5 9.5 0 0 1 4.5-9l4.7 4.3M14.5 13.5 18 19a9.4 9.4 0 0 1-10 .5l3-5.8" />
    </>
  ),
  report: (
    <>
      <path d="M6 2h9l4 4v16H6V2Z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  reset: (
    <>
      <path d="M4 7v6h6" />
      <path d="M5.5 13A7 7 0 1 0 7 6.5L4 10" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 13.5v-3l-2-.7-.6-1.4.9-2-2.2-2.1-2 .9-1.5-.6-.7-2h-3l-.7 2-1.4.6-2-.9-2.1 2.1.9 2-.6 1.4-2 .7v3l2 .7.6 1.4-.9 2 2.1 2.1 2-.9 1.4.6.7 2h3l.7-2 1.5-.6 2 .9 2.2-2.1-.9-2 .6-1.4 2-.7Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2 9.8 9.8 2 12l7.8 2.2L12 22l2.2-7.8L22 12l-7.8-2.2L12 2Z" />
    </>
  ),
  thermo: (
    <>
      <path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z" />
      <path d="M11 8v9" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 22a8 8 0 0 1 16 0" />
    </>
  ),
  volume: (
    <>
      <path d="M4 10v4h4l5 4V6l-5 4H4Z" />
      <path d="M16 9a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" />
    </>
  ),
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const astronautNav = [
  ["T1", "Inicio de misión"],
  ["T2", "Hoy"],
  ["T3", "Hablar con ELOISE"],
  ["T4", "Mis datos"],
  ["T5", "Check-in diario"],
  ["T6", "Alerta urgente"],
  ["T7", "Modo refugio"],
  ["T8", "Privacidad"],
  ["T9", "Preferencias"],
];
const medicalNav = [
  ["M1", "Tripulación"],
  ["M2", "Expediente"],
  ["M3", "Alertas"],
  ["M4", "Radiación"],
  ["M5", "Informe a Tierra"],
];
const simulationNav = [["D1", "Consola de simulación"]];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="logo-mark">
        <span />
      </span>
      {!compact && (
        <div>
          <strong>ELOISE</strong>
          <small>MISSION CARE SYSTEM</small>
        </div>
      )}
    </div>
  );
}

function StatusBar({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`status-bar ${mobile ? "mobile" : ""}`}>
      <span>
        <i className="status-dot" /> NAVE CONECTADA
      </span>
      {!mobile && (
        <span>
          <Icon name="comm" size={14} /> TIERRA · ESTABLE
        </span>
      )}
      <span className="mono">MET 187:14:32</span>
      {!mobile && <span className="mono">UTC 09:42</span>}
    </div>
  );
}

function Pill({
  children,
  tone = "safe",
}: {
  children: React.ReactNode;
  tone?: "safe" | "warn" | "critical" | "info" | "neutral";
}) {
  return (
    <span className={`pill ${tone}`}>
      <i />
      {children}
    </span>
  );
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button disabled={disabled} onClick={onClick} className={`button ${variant}`}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

function Panel({
  children,
  className = "",
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-title">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Sparkline({
  color = "#39D8E8",
  points = "0,34 18,31 35,32 53,22 70,26 88,16 106,20 124,9 142,13 160,5",
}: {
  color?: string;
  points?: string;
}) {
  return (
    <svg className="sparkline" viewBox="0 0 160 40" preserveAspectRatio="none">
      <path d="M0 39H160M0 26H160M0 13H160" className="gridline" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="160" cy="5" r="3" fill={color} />
    </svg>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  detail,
  tone = "cyan",
  chart = true,
}: {
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  detail: string;
  tone?: string;
  chart?: boolean;
}) {
  return (
    <Panel className={`metric-card ${tone}`}>
      <div className="metric-head">
        <span className="metric-icon">
          <Icon name={icon} />
        </span>
        <Pill tone={tone === "yellow" ? "warn" : "safe"}>{detail}</Pill>
      </div>
      <div className="label">{label}</div>
      <div className="metric-value">
        {value} <small>{unit}</small>
      </div>
      {chart && (
        <Sparkline
          color={tone === "green" ? "#35D39A" : tone === "yellow" ? "#FFC857" : "#39D8E8"}
        />
      )}
    </Panel>
  );
}

function Ring({
  value,
  label,
  tone = "safe",
  sub,
}: {
  value: string;
  label: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className={`ring ${tone}`}>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function EcoOrb({ state = "ready", small = false }: { state?: string; small?: boolean }) {
  return (
    <div className={`eco-orb ${state} ${small ? "small" : ""}`}>
      <div className="orbit orbit-a" />
      <div className="orbit orbit-b" />
      <div className="orb-core">
        <span />
      </div>
    </div>
  );
}

function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="screen-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

function T2Dashboard({ navigate }: { navigate: (s: string) => void }) {
  return (
    <div className="screen-content">
      <ScreenHeader
        eyebrow="MARTES · DÍA DE MISIÓN 188"
        title="Buenos días, Valentina."
        subtitle="Tus sistemas se mantienen estables. No hay acciones urgentes."
        action={
          <div className="health-score">
            <span>ESTADO GENERAL</span>
            <strong>
              <i /> ÓPTIMO
            </strong>
          </div>
        }
      />
      <Panel className="hero-panel">
        <div className="hero-copy">
          <Pill tone="info">ELOISE DISPONIBLE</Pill>
          <h2>¿Cómo te encuentras hoy?</h2>
          <p>Podemos hablar, registrar cómo te sientes o simplemente hacer una pausa.</p>
          <div className="button-row">
            <Button icon="mic" onClick={() => navigate("T3")}>
              Hablar con ELOISE
            </Button>
            <Button variant="secondary" onClick={() => navigate("T5")}>
              Check-in diario · 1 min
            </Button>
          </div>
        </div>
        <EcoOrb />
      </Panel>
      <div className="section-heading">
        <h2>Sistemas vitales</h2>
        <button onClick={() => navigate("T4")}>
          Ver tendencias <Icon name="arrow" size={15} />
        </button>
      </div>
      <div className="metric-grid">
        <MetricCard
          icon="radiation"
          label="Radiación acumulada"
          value="42.8"
          unit="mSv"
          detail="12% del límite"
          tone="yellow"
        />
        <MetricCard
          icon="air"
          label="Oxígeno de cabina"
          value="20.9"
          unit="%"
          detail="Nominal"
          tone="green"
        />
        <MetricCard
          icon="activity"
          label="Calidad del aire"
          value="94"
          unit="/ 100"
          detail="Excelente"
        />
        <MetricCard
          icon="heart"
          label="Frecuencia cardíaca"
          value="68"
          unit="lpm"
          detail="En reposo"
          tone="green"
        />
      </div>
      <div className="two-col">
        <Panel title="Último check-in" action={<span className="muted mono">AYER · 20:14</span>}>
          <div className="checkin-summary">
            <div className="mood-face">◡</div>
            <div>
              <strong>Calmada y con buena energía</strong>
              <p>Estrés bajo · Sin síntomas reportados</p>
            </div>
            <Pill>COMPLETO</Pill>
          </div>
        </Panel>
        <Panel className="shelter-card">
          <span className="metric-icon">
            <Icon name="shield" />
          </span>
          <div>
            <h3>Modo refugio</h3>
            <p>Protocolo de protección ante radiación solar.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate("T7")}>
            Abrir
          </Button>
        </Panel>
      </div>
      <Panel title="Actualizaciones de misión" action={<span className="count-badge">2</span>}>
        <div className="notification-row">
          <span className="notification-icon">
            <Icon name="comm" />
          </span>
          <div>
            <strong>Enlace con Tierra sincronizado</strong>
            <p>Paquete médico recibido · hace 18 min</p>
          </div>
          <Icon name="chevron" />
        </div>
      </Panel>
    </div>
  );
}

function T1Welcome({ navigate }: { navigate: (s: string) => void }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-visual">
        <Logo />
        <div className="spacecraft">
          <div className="craft-body">
            <span />
            <i />
          </div>
          <div className="craft-orbit" />
          <EcoOrb small />
        </div>
        <div className="mission-tag mono">ARES VII · PERSONAL CARE NODE 03</div>
      </div>
      <div className="welcome-copy">
        <Pill tone="info">PRIMER ACCESO</Pill>
        <h1>
          Bienvenida a bordo,
          <br />
          Valentina.
        </h1>
        <p className="lead">
          Soy ELOISE, tu sistema de apoyo al bienestar durante la misión. Estoy aquí para
          escucharte, acompañarte y ayudarte a mantenerte segura.
        </p>
        <div className="trust-list">
          <div>
            <Icon name="data" />
            <span>
              <strong>Registro esencial</strong>Biometría, bienestar y conversaciones que decidas
              guardar.
            </span>
          </div>
          <div>
            <Icon name="lock" />
            <span>
              <strong>Tú controlas tus datos</strong>El equipo médico solo ve la información que
              autorizas.
            </span>
          </div>
          <div>
            <Icon name="shield" />
            <span>
              <strong>Emergencias protegidas</strong>Ante un riesgo crítico, el protocolo prioriza
              tu seguridad.
            </span>
          </div>
        </div>
        <div className="disclaimer">
          ELOISE acompaña tu cuidado, pero no reemplaza la evaluación ni las decisiones del personal
          médico.
        </div>
        <Button icon="arrow" onClick={() => navigate("T2")}>
          Aceptar y comenzar
        </Button>
        <button className="text-button">Revisar política completa de privacidad</button>
      </div>
    </div>
  );
}

function T3Conversation() {
  const [mode, setMode] = useState("Compañero");
  const [listening, setListening] = useState(false);
  return (
    <div className="conversation">
      <div className="conversation-top">
        <div>
          <Pill tone="info">SESIÓN PRIVADA</Pill>
          <h2>Conversación con ELOISE</h2>
        </div>
        <Button variant="ghost" icon="close">
          Finalizar
        </Button>
      </div>
      <div className="mode-tabs">
        {["Escucha", "Compañero", "Refugio"].map((x) => (
          <button className={mode === x ? "active" : ""} onClick={() => setMode(x)} key={x}>
            {x === "Escucha" ? "Solo escuchar" : x}
          </button>
        ))}
      </div>
      <div className="orb-stage">
        <EcoOrb state={listening ? "listening" : "ready"} />
        <div className="orb-status">
          <i /> {listening ? "ESCUCHANDO" : "LISTA PARA TI"}
        </div>
      </div>
      <div className="messages">
        <div className="message eco">
          <span>E</span>
          <div>
            <p>Hola, Valentina. Estoy aquí contigo. ¿Cómo ha sido tu mañana?</p>
            <small>09:41 · ELOISE</small>
          </div>
        </div>
        <div className="message user">
          <div>
            <p>Me siento bien, aunque me costó concentrarme durante la primera tarea.</p>
            <small>09:42 · TÚ</small>
          </div>
        </div>
        <div className="message eco">
          <span>E</span>
          <div>
            <p>
              Gracias por contármelo. Podemos revisar qué pudo influir o hacer una pausa breve. ¿Qué
              prefieres?
            </p>
            <small>AHORA · ELOISE</small>
          </div>
        </div>
      </div>
      {listening && (
        <div className="transcript">
          “Hoy siento que…”
          <span className="cursor" />
        </div>
      )}
      <div className="composer">
        <button>
          <Icon name="book" />
        </button>
        <input aria-label="Escribe un mensaje" placeholder="Escribe a ELOISE…" />
        <button
          className={`mic-button ${listening ? "active" : ""}`}
          onClick={() => setListening(!listening)}
        >
          <Icon name={listening ? "pause" : "mic"} />
        </button>
      </div>
      <div className="privacy-note">
        <Icon name="lock" size={13} /> Esta conversación es privada y no se comparte sin tu permiso.
      </div>
    </div>
  );
}

function T4Health() {
  return (
    <div className="screen-content">
      <ScreenHeader
        eyebrow="MONITOREO PERSONAL"
        title="Mis datos de salud"
        subtitle="Actualizado hace 32 segundos · Sensores biométricos sincronizados"
        action={<Pill>TODO NOMINAL</Pill>}
      />
      <div className="health-overview">
        <Panel
          className="radiation-panel"
          title="Exposición a radiación"
          action={
            <select>
              <option>Últimos 7 días</option>
            </select>
          }
        >
          <div className="radiation-summary">
            <Ring value="42.8" label="mSv" sub="ACUMULADO" tone="warn" />
            <div>
              <span className="label">Límite de misión</span>
              <strong>350 mSv</strong>
              <div className="progress">
                <i style={{ width: "12.2%" }} />
              </div>
              <p>307.2 mSv disponibles dentro del límite configurado.</p>
            </div>
          </div>
          <div className="large-chart">
            <div className="y-labels">
              <span>0.8</span>
              <span>0.4</span>
              <span>0</span>
            </div>
            <Sparkline
              color="#FFC857"
              points="0,34 18,32 35,27 53,29 70,19 88,22 106,15 124,20 142,11 160,13"
            />
            <div className="x-labels">
              <span>LUN</span>
              <span>MAR</span>
              <span>MIÉ</span>
              <span>JUE</span>
              <span>VIE</span>
              <span>SÁB</span>
              <span>HOY</span>
            </div>
          </div>
        </Panel>
        <Panel title="Resumen de hoy">
          <div className="mini-metrics">
            <div>
              <Icon name="heart" />
              <span>
                <small>PULSO MEDIO</small>
                <strong>
                  71 <em>lpm</em>
                </strong>
                <b>−2 vs. ayer</b>
              </span>
            </div>
            <div>
              <Icon name="moon" />
              <span>
                <small>SUEÑO</small>
                <strong>7h 42m</strong>
                <b>Calidad 86%</b>
              </span>
            </div>
            <div>
              <Icon name="air" />
              <span>
                <small>OXÍGENO</small>
                <strong>
                  20.9 <em>%</em>
                </strong>
                <b>Estable</b>
              </span>
            </div>
            <div>
              <Icon name="spark" />
              <span>
                <small>ÁNIMO</small>
                <strong>Calmada</strong>
                <b>4 días estable</b>
              </span>
            </div>
          </div>
        </Panel>
      </div>
      <div className="three-col">
        <MetricCard
          icon="heart"
          label="Frecuencia cardíaca"
          value="68"
          unit="lpm"
          detail="Normal"
          tone="green"
        />
        <MetricCard
          icon="air"
          label="Calidad del aire"
          value="94"
          unit="/ 100"
          detail="Excelente"
        />
        <MetricCard
          icon="moon"
          label="Calidad del sueño"
          value="86"
          unit="%"
          detail="+4% semanal"
          tone="green"
        />
      </div>
      <Panel
        title="Tendencias de bienestar"
        action={<span className="muted">ÚLTIMOS 14 DÍAS</span>}
      >
        <div className="trend-bars">
          {[58, 64, 71, 68, 76, 73, 80, 75, 82, 78, 85, 88, 84, 90].map((v, i) => (
            <i key={i} style={{ height: v + "%" }} className={i > 10 ? "latest" : ""} />
          ))}
        </div>
        <div className="legend-row">
          <span>
            <i className="cyan-dot" /> Índice de bienestar
          </span>
          <b>Tendencia +8%</b>
        </div>
      </Panel>
    </div>
  );
}

function T5Checkin() {
  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(2);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const toggle = (s: string) =>
    setSymptoms((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  if (saved)
    return (
      <div className="completion-state">
        <div className="success-mark">
          <Icon name="check" size={42} />
        </div>
        <h1>Check-in completado</h1>
        <p>Gracias, Valentina. Tu registro se guardó de forma segura.</p>
        <Panel>
          <Pill>ESTADO ESTABLE</Pill>
          <strong>No se detectan cambios que requieran atención.</strong>
        </Panel>
        <Button onClick={() => setSaved(false)}>Ver resumen</Button>
      </div>
    );
  return (
    <div className="checkin-flow">
      <div className="flow-top">
        <div>
          <span className="eyebrow">CHECK-IN DIARIO</span>
          <h1>¿Cómo estás hoy?</h1>
        </div>
        <span className="mono">PASO 3 DE 4</span>
      </div>
      <div className="flow-progress">
        <i />
        <i />
        <i />
        <i className="pending" />
      </div>
      <Panel className="question-card">
        <span className="question-number">01</span>
        <h2>¿Cómo describirías tu ánimo?</h2>
        <p>Elige la opción que más se acerque a cómo te sientes ahora.</p>
        <div className="mood-selector">
          {["Muy bajo", "Bajo", "Neutral", "Bien", "Muy bien"].map((x, i) => (
            <button className={mood === i ? "active" : ""} onClick={() => setMood(i)} key={x}>
              <span>{["⌢", "–", "—", "◡", "⌣"][i]}</span>
              {x}
            </button>
          ))}
        </div>
      </Panel>
      <div className="two-col">
        <Panel title="Nivel de estrés">
          <div className="range-label">
            <strong>{["Muy bajo", "Bajo", "Moderado", "Alto", "Muy alto"][stress]}</strong>
            <span>{stress + 1} / 5</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            value={stress}
            onChange={(e) => setStress(+e.target.value)}
          />
          <div className="range-ticks">
            <span>Sin estrés</span>
            <span>Muy alto</span>
          </div>
        </Panel>
        <Panel title="Nivel de energía">
          <div className="energy-scale">
            {[1, 2, 3, 4, 5].map((x) => (
              <button className={x === 4 ? "active" : ""} key={x}>
                {x}
              </button>
            ))}
          </div>
          <p className="helper">Energía buena para las tareas previstas.</p>
        </Panel>
      </div>
      <Panel title="¿Tienes algún síntoma?">
        <div className="symptom-chips">
          {["Dolor de cabeza", "Mareo", "Náusea", "Fatiga", "Dolor muscular", "Ninguno"].map(
            (x) => (
              <button
                onClick={() => toggle(x)}
                className={symptoms.includes(x) ? "active" : ""}
                key={x}
              >
                {symptoms.includes(x) && <Icon name="check" size={15} />} {x}
              </button>
            ),
          )}
        </div>
      </Panel>
      <div className="eco-tip">
        <EcoOrb small />
        <p>
          <strong>Vas muy bien.</strong> Este registro nos ayuda a observar cambios con el tiempo,
          sin emitir diagnósticos automáticos.
        </p>
      </div>
      <div className="flow-actions">
        <Button variant="ghost">Atrás</Button>
        <Button icon="check" onClick={() => setSaved(true)}>
          Guardar check-in
        </Button>
      </div>
    </div>
  );
}

function T6Emergency() {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="emergency-screen">
      <div className="emergency-top">
        <Logo />
        <span className="emergency-code mono">ALERTA · ECO-CRITICAL-04</span>
        <span className="mono">MET 187:14:32</span>
      </div>
      <div className="emergency-main">
        <div className="emergency-title">
          <span>
            <Icon name="alert" size={36} />
          </span>
          <div>
            <Pill tone="critical">PRIORIDAD CRÍTICA</Pill>
            <h1>
              Oxígeno por debajo
              <br />
              del nivel seguro
            </h1>
            <p>Módulo de laboratorio · Descenso sostenido durante 02:14 min</p>
          </div>
        </div>
        <div className="emergency-grid">
          <div className="instruction-list">
            <h2>Actúa ahora</h2>
            {[
              ["01", "Colócate la máscara auxiliar", "Ubicada en el panel de seguridad L-04."],
              ["02", "Sal del módulo de laboratorio", "Dirígete al nodo central por la esclusa B."],
              ["03", "Cierra la compuerta tras de ti", "Confirma el sellado antes de continuar."],
            ].map((x) => (
              <div className="instruction" key={x[0]}>
                <b>{x[0]}</b>
                <span>
                  <strong>{x[1]}</strong>
                  <p>{x[2]}</p>
                </span>
              </div>
            ))}
          </div>
          <Panel className="critical-readings">
            <h3>VARIABLE COMPROMETIDA</h3>
            <div className="critical-value">
              17.2 <small>% O₂</small>
            </div>
            <div className="safe-threshold">
              <span>UMBRAL SEGURO</span>
              <strong>≥ 19.5%</strong>
            </div>
            <Sparkline color="#FF4D5A" points="0,5 30,8 60,12 90,18 120,29 160,36" />
            <div className="voice-active">
              <Icon name="volume" />
              <span>
                <strong>ELOISE está leyendo</strong>Instrucción 1 de 3
              </span>
            </div>
          </Panel>
        </div>
        <div className="emergency-actions">
          <Button
            variant={confirmed ? "secondary" : "danger"}
            icon="check"
            onClick={() => setConfirmed(true)}
          >
            {confirmed ? "Recepción confirmada" : "Confirmar que recibí la alerta"}
          </Button>
          <Button variant="ghost" icon="book">
            Ver protocolo OX-04 completo
          </Button>
        </div>
      </div>
    </div>
  );
}

function T7Shelter() {
  return (
    <div className="screen-content shelter-screen">
      <ScreenHeader
        eyebrow="PROTOCOLO SR-02 ACTIVO"
        title="Refugio solar"
        subtitle="Evento de partículas solares detectado · Protección coordinada por ELOISE"
        action={<Pill tone="warn">NIVEL 2 · PRECAUCIÓN</Pill>}
      />
      <Panel className="countdown-panel">
        <div>
          <span>IMPACTO ESTIMADO EN</span>
          <strong className="mono">00:18:42</strong>
          <p>Tiempo suficiente para completar el ingreso de la tripulación.</p>
        </div>
        <Ring value="83%" label="PROTECCIÓN" tone="safe" />
        <div className="shelter-state">
          <Icon name="shield" size={30} />
          <span>
            <small>ESTADO DEL REFUGIO</small>
            <strong>SEGURO Y SELLADO</strong>
            <b>Todos los sistemas nominales</b>
          </span>
        </div>
      </Panel>
      <div className="metric-grid shelter-metrics">
        <MetricCard
          icon="radiation"
          label="Radiación exterior"
          value="8.4"
          unit="mSv/h"
          detail="En ascenso"
          tone="yellow"
        />
        <MetricCard
          icon="shield"
          label="Radiación interior"
          value="0.08"
          unit="mSv/h"
          detail="Protegido"
          tone="green"
        />
        <MetricCard
          icon="air"
          label="Oxígeno refugio"
          value="20.8"
          unit="%"
          detail="Nominal"
          tone="green"
        />
        <MetricCard
          icon="activity"
          label="Calidad del aire"
          value="92"
          unit="/ 100"
          detail="Óptima"
        />
      </div>
      <div className="two-col">
        <Panel title="Ocupación del refugio" action={<Pill>5 / 6 A BORDO</Pill>}>
          <div className="crew-list">
            {["V. Ramos", "J. Okafor", "L. Chen", "M. Petrov", "S. Al-Hassan", "A. Torres"].map(
              (x, i) => (
                <div key={x} className={i === 5 ? "pending" : ""}>
                  <span>
                    {x
                      .split(" ")
                      .map((y) => y[0])
                      .join("")}
                  </span>
                  <strong>{x}</strong>
                  <small>{i === 5 ? "EN TRÁNSITO · 02:10" : "EN REFUGIO"}</small>
                </div>
              ),
            )}
          </div>
        </Panel>
        <Panel title="Turnos de vigilancia">
          <div className="shift">
            <span className="mono">10:00—12:00</span>
            <strong>J. Okafor</strong>
            <Pill>ACTUAL</Pill>
          </div>
          <div className="shift">
            <span className="mono">12:00—14:00</span>
            <strong>V. Ramos</strong>
            <Pill tone="neutral">SIGUIENTE</Pill>
          </div>
          <div className="eco-guidance">
            <EcoOrb small />
            <p>
              <strong>Indicación de ELOISE</strong>Permanece en la zona central hasta nueva
              instrucción. La exposición interior está controlada.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const Toggle = ({ on = true }: { on?: boolean }) => {
  const [active, setActive] = useState(on);
  return (
    <button
      aria-label="Cambiar ajuste"
      onClick={() => setActive(!active)}
      className={`toggle ${active ? "on" : ""}`}
    >
      <i />
    </button>
  );
};

function T8Privacy() {
  return (
    <div className="screen-content">
      <ScreenHeader
        eyebrow="CONTROL PERSONAL"
        title="Privacidad y permisos"
        subtitle="Tú decides qué información puede consultar el equipo médico."
        action={<Pill>CONSENTIMIENTO ACTIVO</Pill>}
      />
      <Panel className="privacy-hero">
        <Icon name="lock" size={28} />
        <div>
          <h3>Tus datos están protegidos</h3>
          <p>
            Las comunicaciones están cifradas dentro de la red de misión. Los accesos quedan
            registrados y son auditables.
          </p>
        </div>
        <Button variant="secondary">Ver política de misión</Button>
      </Panel>
      <div className="privacy-grid">
        <Panel title="Permisos de visualización">
          <div className="setting-list">
            <div>
              <span>
                <strong>Datos biométricos</strong>
                <small>Pulso, sueño, oxígeno y actividad</small>
              </span>
              <Pill>REQUERIDO</Pill>
            </div>
            <div>
              <span>
                <strong>Check-ins de bienestar</strong>
                <small>Ánimo, estrés, energía y síntomas</small>
              </span>
              <Toggle />
            </div>
            <div>
              <span>
                <strong>Resúmenes de conversación</strong>
                <small>Solo conclusiones que elijas compartir</small>
              </span>
              <Toggle on={false} />
            </div>
            <div>
              <span>
                <strong>Conversaciones completas</strong>
                <small>Texto y transcripciones de voz</small>
              </span>
              <Toggle on={false} />
            </div>
          </div>
        </Panel>
        <Panel title="Información recopilada">
          <div className="data-categories">
            <div>
              <Icon name="heart" />
              <span>
                <strong>Salud</strong>Continuo
              </span>
            </div>
            <div>
              <Icon name="spark" />
              <span>
                <strong>Bienestar</strong>Diario
              </span>
            </div>
            <div>
              <Icon name="radiation" />
              <span>
                <strong>Radiación</strong>Continuo
              </span>
            </div>
            <div>
              <Icon name="comm" />
              <span>
                <strong>Interacciones</strong>Bajo control
              </span>
            </div>
          </div>
          <div className="retention">
            <span>CONSERVACIÓN DE MISIÓN</span>
            <strong>180 días después del regreso</strong>
          </div>
        </Panel>
      </div>
      <Panel
        title="Registro de accesos"
        action={<button className="link-button">Descargar registro</button>}
      >
        <div className="access-table">
          <div className="table-head">
            <span>PERSONA / SISTEMA</span>
            <span>INFORMACIÓN</span>
            <span>FECHA</span>
            <span>RESULTADO</span>
          </div>
          {[
            ["Dra. Elena Ruiz", "Biometría y check-in", "HOY · 08:20", "Autorizado"],
            ["Sistema médico ARES", "Signos vitales", "AYER · 22:00", "Autorizado"],
            ["Control de misión", "Conversación ELOISE", "AYER · 14:12", "Bloqueado"],
          ].map((r, i) => (
            <div className="table-row" key={r[0]}>
              <span>
                <i className="avatar-mini">{r[0][0]}</i>
                <strong>{r[0]}</strong>
              </span>
              <span>{r[1]}</span>
              <span className="mono">{r[2]}</span>
              <span>
                <Pill tone={i === 2 ? "neutral" : "safe"}>{r[3]}</Pill>
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <div className="danger-zone">
        <div>
          <Icon name="alert" />
          <span>
            <strong>Gestión del historial</strong>
            <p>El borrado está sujeto a la política de conservación de datos de la misión.</p>
          </span>
        </div>
        <Button variant="secondary">Gestionar conversaciones</Button>
      </div>
    </div>
  );
}

function T9Settings() {
  const [lang, setLang] = useState("Español");
  return (
    <div className="screen-content narrow-content">
      <ScreenHeader
        eyebrow="CONFIGURACIÓN PERSONAL"
        title="Preferencias"
        subtitle="Personaliza cómo ELOISE se comunica contigo."
      />
      <Panel title="Idioma y voz">
        <div className="settings-form">
          <label>
            <span>
              Idioma del sistema<small>Interfaz, alertas e instrucciones</small>
            </span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option>Español</option>
              <option>English</option>
              <option>Français</option>
            </select>
          </label>
          <label>
            <span>
              Voz de ELOISE<small>Serena · tono medio</small>
            </span>
            <button className="select-button">
              <Icon name="play" size={15} /> Vega 02 <Icon name="chevron" size={15} />
            </button>
          </label>
          <label className="slider-setting">
            <span>
              Velocidad de reproducción<small>0.9× — ligeramente pausada</small>
            </span>
            <input type="range" min="0" max="4" defaultValue="2" />
          </label>
        </div>
      </Panel>
      <Panel title="Pantalla y accesibilidad">
        <div className="setting-list">
          <div>
            <span>
              <strong>Tamaño del texto</strong>
              <small>
                Vista previa: <b className="sample-text">Aa</b>
              </small>
            </span>
            <select>
              <option>Mediano</option>
              <option>Grande</option>
            </select>
          </div>
          <div>
            <span>
              <strong>Modo oscuro</strong>
              <small>Optimizado para iluminación de cabina</small>
            </span>
            <Toggle />
          </div>
          <div>
            <span>
              <strong>Contraste reforzado</strong>
              <small>Aumenta la definición de bordes y texto</small>
            </span>
            <Toggle on={false} />
          </div>
          <div>
            <span>
              <strong>Reducir movimiento</strong>
              <small>Limita animaciones del núcleo ELOISE</small>
            </span>
            <Toggle on={false} />
          </div>
        </div>
      </Panel>
      <Panel title="Notificaciones">
        <div className="setting-list">
          <div>
            <span>
              <strong>Recordatorio de check-in</strong>
              <small>Todos los días · 20:00</small>
            </span>
            <Toggle />
          </div>
          <div>
            <span>
              <strong>Actualizaciones médicas</strong>
              <small>Nuevos mensajes del equipo de salud</small>
            </span>
            <Toggle />
          </div>
          <div>
            <span>
              <strong>Sonidos del sistema</strong>
              <small>Alertas e interacciones</small>
            </span>
            <Toggle />
          </div>
        </div>
      </Panel>
      <div className="version-row">
        <Logo />
        <span>
          ELOISE OS 1.4.2 · BUILD 2187
          <br />
          <small>Última verificación de integridad: hoy, 09:12</small>
        </span>
        <Pill>SISTEMA VERIFICADO</Pill>
      </div>
    </div>
  );
}

function CrewTable({ navigate }: { navigate: (s: string) => void }) {
  const crew = [
    ["VR", "Valentina Ramos", "Comandante", "Óptimo", "42.8 mSv", "68 lpm", "Hoy · 08:34"],
    ["JO", "Jamal Okafor", "Piloto", "Óptimo", "39.2 mSv", "72 lpm", "Hoy · 08:18"],
    ["LC", "Lin Chen", "Especialista", "Atención", "47.1 mSv", "88 lpm", "Hoy · 07:56"],
    ["MP", "Mikhail Petrov", "Ingeniero", "Óptimo", "41.6 mSv", "65 lpm", "Hoy · 08:22"],
    ["SA", "Sara Al-Hassan", "Científica", "Observación", "44.0 mSv", "76 lpm", "Ayer · 21:10"],
    ["AT", "Alex Torres", "Médico", "Óptimo", "38.9 mSv", "70 lpm", "Hoy · 08:05"],
  ];
  return (
    <div className="crew-table">
      <div className="table-head">
        <span>TRIPULANTE</span>
        <span>ESTADO</span>
        <span>RADIACIÓN</span>
        <span>FREC. CARDÍACA</span>
        <span>ÚLTIMO REGISTRO</span>
        <span />
      </div>
      {crew.map((r, i) => (
        <button className="table-row" key={r[1]} onClick={() => navigate("M2")}>
          <span>
            <i className="crew-avatar">{r[0]}</i>
            <span>
              <strong>{r[1]}</strong>
              <small>{r[2]}</small>
            </span>
          </span>
          <span>
            <Pill tone={i === 2 ? "warn" : i === 4 ? "info" : "safe"}>{r[3]}</Pill>
          </span>
          <span className="mono">{r[4]}</span>
          <span className="mono">{r[5]}</span>
          <span>{r[6]}</span>
          <Icon name="chevron" size={17} />
        </button>
      ))}
    </div>
  );
}

function M1Crew({ navigate }: { navigate: (s: string) => void }) {
  return (
    <div className="desktop-content">
      <ScreenHeader
        eyebrow="ARES VII · DÍA 188"
        title="Estado de la tripulación"
        subtitle="Vista consolidada de salud, bienestar y seguridad de la misión."
        action={
          <>
            <Button variant="secondary" icon="report" onClick={() => navigate("M5")}>
              Preparar informe
            </Button>
            <Button icon="alert" onClick={() => navigate("M3")}>
              2 alertas activas
            </Button>
          </>
        }
      />
      <div className="kpi-grid">
        <Panel>
          <span className="kpi-icon">
            <Icon name="crew" />
          </span>
          <div>
            <small>TRIPULACIÓN</small>
            <strong>
              6 <em>/ 6 activos</em>
            </strong>
            <span>Todos localizados</span>
          </div>
        </Panel>
        <Panel>
          <span className="kpi-icon safe">
            <Icon name="shield" />
          </span>
          <div>
            <small>ESTADO GENERAL</small>
            <strong>
              4 <em>óptimos</em>
            </strong>
            <span className="warn-text">2 requieren atención</span>
          </div>
        </Panel>
        <Panel>
          <span className="kpi-icon warn">
            <Icon name="radiation" />
          </span>
          <div>
            <small>DOSIS MEDIA</small>
            <strong>
              42.3 <em>mSv</em>
            </strong>
            <span>12.1% del límite</span>
          </div>
        </Panel>
        <Panel>
          <span className="kpi-icon">
            <Icon name="comm" />
          </span>
          <div>
            <small>ENLACE TIERRA</small>
            <strong>Estable</strong>
            <span>Retraso 04:16 min</span>
          </div>
        </Panel>
      </div>
      <div className="mission-strip">
        <div>
          <span className="pulse-dot" />
          <strong>MISIÓN NOMINAL</strong>
          <small>Última sincronización · 09:41:32 UTC</small>
        </div>
        <div>
          <span>
            O₂ CABINA <strong>20.9%</strong>
          </span>
          <span>
            CO₂ <strong>0.12%</strong>
          </span>
          <span>
            PRESIÓN <strong>101.2 kPa</strong>
          </span>
          <span>
            TEMP. <strong>22.4 °C</strong>
          </span>
        </div>
      </div>
      <Panel
        className="table-panel"
        title="Tripulación"
        action={
          <div className="table-tools">
            <input placeholder="Buscar tripulante…" />
            <button>
              <Icon name="settings" size={16} /> Filtros
            </button>
          </div>
        }
      >
        <CrewTable navigate={navigate} />
      </Panel>
      <div className="two-col unequal">
        <Panel title="Atención requerida">
          <div className="attention-item warn">
            <span>
              <Icon name="heart" />
            </span>
            <div>
              <strong>Lin Chen · Pulso elevado</strong>
              <p>88 lpm en reposo · 18 min sostenidos</p>
            </div>
            <Pill tone="warn">REVISAR</Pill>
          </div>
          <div className="attention-item info">
            <span>
              <Icon name="spark" />
            </span>
            <div>
              <strong>Sara Al-Hassan · Cambio de ánimo</strong>
              <p>Tendencia descendente durante 3 días</p>
            </div>
            <Pill tone="info">OBSERVAR</Pill>
          </div>
        </Panel>
        <Panel title="Resumen de misión">
          <div className="mission-progress">
            <span>DÍA 188 DE 420</span>
            <strong>44.7%</strong>
            <div className="progress">
              <i style={{ width: "44.7%" }} />
            </div>
          </div>
          <div className="mission-stat">
            <span>Próximo informe a Tierra</span>
            <strong className="mono">02:18:42</strong>
          </div>
          <div className="mission-stat">
            <span>Próxima revisión médica</span>
            <strong>Hoy · 14:00</strong>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function M2Detail() {
  return (
    <div className="desktop-content">
      <div className="breadcrumb">
        TRIPULACIÓN <Icon name="chevron" size={13} /> EXPEDIENTE
      </div>
      <div className="profile-header">
        <div className="profile-avatar">VR</div>
        <div>
          <Pill>ESTADO ÓPTIMO</Pill>
          <h1>Valentina Ramos</h1>
          <p>Comandante de misión · ID AR7-001 · 38 años</p>
        </div>
        <div className="profile-meta">
          <span>
            <small>ÚLTIMA SINCRONIZACIÓN</small>
            <strong>Hoy · 09:41 UTC</strong>
          </span>
          <Button variant="secondary">Añadir observación</Button>
          <Button>Iniciar consulta</Button>
        </div>
      </div>
      <div className="kpi-grid compact">
        <MetricCard
          icon="heart"
          label="Pulso actual"
          value="68"
          unit="lpm"
          detail="Normal"
          tone="green"
        />
        <MetricCard
          icon="radiation"
          label="Radiación acumulada"
          value="42.8"
          unit="mSv"
          detail="12% límite"
          tone="yellow"
        />
        <MetricCard icon="moon" label="Sueño anoche" value="7h 42m" detail="Calidad 86%" />
        <MetricCard
          icon="spark"
          label="Bienestar"
          value="84"
          unit="/ 100"
          detail="Estable"
          tone="green"
        />
      </div>
      <div className="medical-grid">
        <Panel
          className="vitals-panel"
          title="Signos biométricos"
          action={
            <select>
              <option>Últimas 24 horas</option>
            </select>
          }
        >
          <div className="chart-legend">
            <span>
              <i /> Pulso, lpm
            </span>
            <span>
              <i /> SpO₂, %
            </span>
          </div>
          <div className="clinical-chart">
            <span className="limit-line">LÍMITE CONFIGURADO</span>
            <Sparkline
              color="#39D8E8"
              points="0,27 15,28 30,20 45,25 60,18 75,24 90,12 105,16 120,15 140,20 160,12"
            />
            <Sparkline
              color="#8B7CFF"
              points="0,10 20,11 40,9 60,12 80,10 100,9 120,11 140,9 160,10"
            />
            <div className="x-labels">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>AHORA</span>
            </div>
          </div>
        </Panel>
        <Panel title="Tendencia emocional">
          <div className="permission-banner">
            <Icon name="lock" size={15} />
            <span>Visible con autorización de la tripulante</span>
          </div>
          <div className="emotion-score">
            <Ring value="84" label="BIENESTAR" tone="safe" />
            <div>
              <strong>Estable</strong>
              <p>Sin variaciones clínicas relevantes</p>
              <span>+3 puntos esta semana</span>
            </div>
          </div>
          <div className="mood-timeline">
            {[3, 4, 4, 3, 4, 4, 4].map((v, i) => (
              <i key={i} style={{ height: v * 20 + "%" }} />
            ))}
          </div>
        </Panel>
      </div>
      <div className="two-col">
        <Panel
          title="Historial de check-ins"
          action={<button className="link-button">Ver todos</button>}
        >
          {["Hoy · 08:34", "Ayer · 20:14", "Día 186 · 20:08"].map((x, i) => (
            <div className="history-row" key={x}>
              <span className="mood-face">◡</span>
              <div>
                <strong>{i === 0 ? "Bien · Energía alta" : "Calmada · Energía media"}</strong>
                <p>Estrés bajo · Sin síntomas</p>
              </div>
              <span className="mono">{x}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Observaciones médicas">
          <div className="note">
            <div>
              <span>ER</span>
              <strong>Dra. Elena Ruiz</strong>
              <small>AYER · 16:42 UTC</small>
            </div>
            <p>
              Parámetros dentro del rango esperado. Mantener seguimiento de la calidad del sueño
              durante los próximos tres ciclos.
            </p>
          </div>
          <Button variant="ghost">Ver historial clínico</Button>
        </Panel>
      </div>
    </div>
  );
}

function M3Alerts() {
  const [tab, setTab] = useState("Activas");
  return (
    <div className="desktop-content">
      <ScreenHeader
        eyebrow="CENTRO DE OPERACIONES MÉDICAS"
        title="Alertas y emergencias"
        subtitle="Gestión coordinada de incidentes de salud y seguridad."
        action={<Pill tone="critical">2 ACTIVAS</Pill>}
      />
      <div className="alert-tabs">
        {["Activas", "En seguimiento", "Resueltas"].map((x, i) => (
          <button onClick={() => setTab(x)} className={tab === x ? "active" : ""} key={x}>
            {x}
            <span>{[2, 1, 38][i]}</span>
          </button>
        ))}
      </div>
      <div className="alerts-layout">
        <div className="alert-list">
          <div className="alert-item critical selected">
            <div className="alert-item-top">
              <Pill tone="critical">CRÍTICA</Pill>
              <span className="mono">09:38 UTC</span>
            </div>
            <h3>Nivel de oxígeno bajo</h3>
            <p>Valentina Ramos · Módulo de laboratorio</p>
            <div className="alert-reading">
              <span>O₂ ACTUAL</span>
              <strong>17.2%</strong>
              <small>Umbral: ≥ 19.5%</small>
            </div>
            <div className="alert-state">
              <i /> Sin reconocer · hace 4 min
            </div>
          </div>
          <div className="alert-item warn">
            <div className="alert-item-top">
              <Pill tone="warn">ALTA</Pill>
              <span className="mono">09:24 UTC</span>
            </div>
            <h3>Pulso elevado sostenido</h3>
            <p>Lin Chen · Hábitat B</p>
            <div className="alert-state">
              <i /> En seguimiento · Dra. Ruiz
            </div>
          </div>
        </div>
        <Panel className="alert-detail">
          <div className="detail-header">
            <div>
              <Pill tone="critical">PRIORIDAD CRÍTICA · OX-04</Pill>
              <h2>Descenso de oxígeno en laboratorio</h2>
              <p>Alerta generada por ELOISE · MET 187:14:28</p>
            </div>
            <Icon name="alert" size={34} />
          </div>
          <div className="incident-meta">
            <div>
              <span>TRIPULANTE</span>
              <strong>Valentina Ramos</strong>
            </div>
            <div>
              <span>UBICACIÓN</span>
              <strong>Lab · Sector L-04</strong>
            </div>
            <div>
              <span>ESTADO ELOISE</span>
              <strong>Instrucciones activas</strong>
            </div>
          </div>
          <div className="eloise-report">
            <div>
              <EcoOrb small />
              <span>
                <strong>Resumen proporcionado por ELOISE</strong>
                <p>
                  Descenso sostenido de O₂ durante 2:14 min. La tripulante confirmó la recepción y
                  se dirige al nodo central con máscara auxiliar.
                </p>
              </span>
            </div>
            <span className="live-label">
              <i /> EN TIEMPO REAL
            </span>
          </div>
          <div className="telemetry-row">
            <div>
              <span>O₂</span>
              <strong className="critical-text">17.2%</strong>
              <small>↓ 2.4%</small>
            </div>
            <div>
              <span>PULSO</span>
              <strong>96 lpm</strong>
              <small>↑ 18</small>
            </div>
            <div>
              <span>SpO₂</span>
              <strong>96%</strong>
              <small>Estable</small>
            </div>
            <div>
              <span>UBICACIÓN</span>
              <strong>Nodo B</strong>
              <small>En movimiento</small>
            </div>
          </div>
          <div className="response-timeline">
            <h3>Respuesta al incidente</h3>
            <div>
              <i className="done" />
              <span>
                <strong>09:38:12 · Alerta generada</strong>
                <p>ELOISE activa protocolo OX-04</p>
              </span>
            </div>
            <div>
              <i className="done" />
              <span>
                <strong>09:39:02 · Recepción confirmada</strong>
                <p>Tripulante responde a instrucciones</p>
              </span>
            </div>
            <div>
              <i />
              <span>
                <strong>09:42:18 · Esperando reconocimiento médico</strong>
              </span>
            </div>
          </div>
          <div className="detail-actions">
            <Button variant="danger" icon="check">
              Reconocer alerta
            </Button>
            <Button variant="secondary" icon="user">
              Asignar profesional
            </Button>
            <Button variant="ghost">Marcar resuelta</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function M4Radiation() {
  return (
    <div className="desktop-content">
      <ScreenHeader
        eyebrow="ANÁLISIS DE ENTORNO"
        title="Radiación y clima espacial"
        subtitle="Exposición de tripulación, zonas de nave y actividad solar."
        action={
          <>
            <Pill tone="warn">ACTIVIDAD SOLAR MODERADA</Pill>
            <Button variant="secondary">Configurar límites</Button>
          </>
        }
      />
      <div className="kpi-grid">
        <Panel>
          <span className="kpi-icon warn">
            <Icon name="radiation" />
          </span>
          <div>
            <small>DOSIS MEDIA</small>
            <strong>
              42.3 <em>mSv</em>
            </strong>
            <span>12.1% del límite</span>
          </div>
        </Panel>
        <Panel>
          <span className="kpi-icon">
            <Icon name="activity" />
          </span>
          <div>
            <small>TASA EXTERIOR</small>
            <strong>
              0.42 <em>mSv/h</em>
            </strong>
            <span className="warn-text">+12% en 6h</span>
          </div>
        </Panel>
        <Panel>
          <span className="kpi-icon safe">
            <Icon name="shield" />
          </span>
          <div>
            <small>REFUGIO</small>
            <strong>
              0.03 <em>mSv/h</em>
            </strong>
            <span>Protección 93%</span>
          </div>
        </Panel>
        <Panel>
          <span className="kpi-icon">
            <Icon name="spark" />
          </span>
          <div>
            <small>PRÓXIMO EVENTO</small>
            <strong>18h 24m</strong>
            <span>Probabilidad 28%</span>
          </div>
        </Panel>
      </div>
      <div className="radiation-grid">
        <Panel
          className="ship-panel"
          title="Exposición por zona"
          action={<span className="muted">mSv/h · TIEMPO REAL</span>}
        >
          <div className="ship-map">
            <div className="module lab">
              <span>LAB</span>
              <strong>0.18</strong>
            </div>
            <div className="module node">
              <span>NODO</span>
              <strong>0.12</strong>
            </div>
            <div className="module habitat">
              <span>HÁBITAT A</span>
              <strong>0.09</strong>
            </div>
            <div className="module habitat-b">
              <span>HÁBITAT B</span>
              <strong>0.11</strong>
            </div>
            <div className="module shelter">
              <Icon name="shield" />
              <span>REFUGIO</span>
              <strong>0.03</strong>
            </div>
            <div className="solar-side">
              <span>ORIENTACIÓN SOLAR</span>
              <Icon name="spark" size={28} />
            </div>
          </div>
          <div className="heat-legend">
            <span>BAJA</span>
            <i />
            <span>ALTA</span>
          </div>
        </Panel>
        <Panel title="Clima espacial">
          <div className="space-weather">
            <div className="sun-index">
              <Icon name="spark" size={34} />
              <span>
                <small>ÍNDICE DE ACTIVIDAD</small>
                <strong>Kp 4</strong>
                <b>MODERADA</b>
              </span>
            </div>
            <div className="forecast">
              {[
                ["HOY", "Kp 4", "Moderada"],
                ["MAÑANA", "Kp 3", "Baja"],
                ["+2 DÍAS", "Kp 5", "Elevada"],
              ].map((x, i) => (
                <div key={x[0]}>
                  <span>{x[0]}</span>
                  <strong>{x[1]}</strong>
                  <Pill tone={i === 2 ? "warn" : i === 0 ? "info" : "safe"}>{x[2]}</Pill>
                </div>
              ))}
            </div>
            <div className="solar-event">
              <Icon name="alert" />
              <span>
                <strong>Eyección coronal en observación</strong>
                <p>Probabilidad de impacto: 28% · ETA 18h</p>
              </span>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Exposición acumulada por tripulante">
        <div className="dose-bars">
          {[
            ["V. Ramos", 42.8],
            ["J. Okafor", 39.2],
            ["L. Chen", 47.1],
            ["M. Petrov", 41.6],
            ["S. Al-Hassan", 44],
            ["A. Torres", 38.9],
          ].map((x) => (
            <div key={x[0]}>
              <span>{x[0]}</span>
              <div>
                <i style={{ width: +x[1] / 3.5 + "%" }} />
              </div>
              <strong>{x[1]} mSv</strong>
              <small>{Math.round(+x[1] / 3.5)}%</small>
            </div>
          ))}
        </div>
        <div className="dose-limit">
          <span>LÍMITE DE MISIÓN CONFIGURADO</span>
          <strong>350 mSv</strong>
        </div>
      </Panel>
    </div>
  );
}

function M5Report() {
  const [generated, setGenerated] = useState(false);
  return (
    <div className="desktop-content">
      <ScreenHeader
        eyebrow="COMUNICACIONES MÉDICAS"
        title="Informe diario para la Tierra"
        subtitle="Consolidado de salud y seguridad · Día de misión 188"
        action={<Pill>ENLACE ESTABLE · +04:16</Pill>}
      />
      <div className="report-layout">
        <div className="report-builder">
          <Panel title="Contenido del informe" action={<span className="muted">6 SECCIONES</span>}>
            <div className="report-sections">
              {[
                "Resumen de tripulación",
                "Eventos médicos",
                "Alertas e incidentes",
                "Exposición a radiación",
                "Indicadores de bienestar",
                "Observaciones del equipo",
              ].map((x, i) => (
                <div key={x}>
                  <Icon name="check" />
                  <span>
                    <strong>{x}</strong>
                    <small>{[6, 1, 2, "42.3 mSv media", "84 / 100", "2 notas"][i]} incluido</small>
                  </span>
                  <button>Editar</button>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Ventana de transmisión">
            <div className="transmission-window">
              <div>
                <Icon name="earth" size={28} />
                <span>
                  <small>PRÓXIMA VENTANA</small>
                  <strong>12:00—12:18 UTC</strong>
                  <p>Disponible en 02:18:42</p>
                </span>
              </div>
              <div>
                <Icon name="comm" size={28} />
                <span>
                  <small>RETRASO ESTIMADO</small>
                  <strong>04 min 16 s</strong>
                  <p>Distancia: 76.8 M km</p>
                </span>
              </div>
            </div>
          </Panel>
          <div className="report-actions">
            <Button variant="secondary">Guardar borrador</Button>
            <Button icon="report" onClick={() => setGenerated(true)}>
              {generated ? "Informe preparado" : "Generar y preparar envío"}
            </Button>
          </div>
        </div>
        <Panel className="report-preview">
          <div className="report-paper">
            <div className="paper-head">
              <Logo />
              <div>
                <strong>INFORME MÉDICO DIARIO</strong>
                <span>ARES VII · SOL 188</span>
              </div>
            </div>
            <div className="paper-meta">
              <span>
                GENERADO
                <br />
                <b>{generated ? "HOY · 09:47 UTC" : "PENDIENTE"}</b>
              </span>
              <span>
                CLASIFICACIÓN
                <br />
                <b>MÉDICO · MISIÓN</b>
              </span>
              <span>
                DESTINO
                <br />
                <b>CONTROL TERRESTRE</b>
              </span>
            </div>
            <h3>01 · RESUMEN EJECUTIVO</h3>
            <p>
              La tripulación mantiene un estado general estable. Cuatro de seis integrantes
              presentan parámetros óptimos; dos permanecen en observación preventiva.
            </p>
            <div className="paper-kpis">
              <span>
                <strong>6/6</strong>ACTIVOS
              </span>
              <span>
                <strong>42.3</strong>mSv MEDIA
              </span>
              <span>
                <strong>2</strong>ALERTAS
              </span>
              <span>
                <strong>84</strong>BIENESTAR
              </span>
            </div>
            <h3>02 · EVENTOS RELEVANTES</h3>
            <div className="paper-event">
              <i />
              <p>
                <strong>09:38 · Descenso de O₂ en laboratorio</strong>
                <br />
                Protocolo OX-04 activado. Tripulante segura. Incidente en seguimiento.
              </p>
            </div>
            <h3>03 · OBSERVACIÓN MÉDICA</h3>
            <div className="paper-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="paper-footer">
              PÁGINA 1 DE 4 · ELOISE MISSION CARE SYSTEM · DATOS CIFRADOS
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function D1Simulation({ onImpact }: { onImpact: (active: boolean) => void }) {
  const [running, setRunning] = useState(true);
  const [solar, setSolar] = useState(false);
  const [oxygen, setOxygen] = useState(20.9);
  const [co2, setCo2] = useState(0.12);
  const [speed, setSpeed] = useState("1×");
  const reset = () => {
    setSolar(false);
    setOxygen(20.9);
    setCo2(0.12);
    onImpact(false);
  };
  const risk = solar || oxygen < 19.5 || co2 > 0.4;
  return (
    <div className="desktop-content simulation">
      <div className="simulation-banner">
        <Icon name="alert" />
        <strong>ENTORNO DE SIMULACIÓN</strong>
        <span>Todos los valores y eventos de esta consola son ficticios.</span>
        <b>NO USAR PARA OPERACIONES REALES</b>
      </div>
      <ScreenHeader
        eyebrow="ELOISE · DEMO CONTROL"
        title="Consola de simulación"
        subtitle="Manipula variables para validar respuestas del sistema en tiempo real."
        action={
          <>
            <Pill tone={running ? "info" : "neutral"}>
              {running ? "SIMULACIÓN ACTIVA" : "PAUSADA"}
            </Pill>
            <Button
              variant="secondary"
              icon={running ? "pause" : "play"}
              onClick={() => setRunning(!running)}
            >
              {running ? "Pausar" : "Reanudar"}
            </Button>
            <Button variant="ghost" icon="reset" onClick={reset}>
              Restablecer
            </Button>
          </>
        }
      />
      <div className="sim-status">
        <div>
          <span className={`sim-pulse ${risk ? "risk" : ""}`} />
          <span>
            <small>ESTADO GENERAL</small>
            <strong>{risk ? "ESCENARIO DE RIESGO" : "SISTEMAS NOMINALES"}</strong>
          </span>
        </div>
        <div>
          <small>TIEMPO SIMULADO</small>
          <strong className="mono">SOL 188 · 09:42:18</strong>
        </div>
        <div className="time-speed">
          <small>VELOCIDAD</small>
          {["0.5×", "1×", "5×", "10×"].map((x) => (
            <button className={speed === x ? "active" : ""} onClick={() => setSpeed(x)} key={x}>
              {x}
            </button>
          ))}
        </div>
        <div>
          <small>SESIÓN</small>
          <strong className="mono">DEMO-AR7-004</strong>
        </div>
      </div>
      <div className="sim-layout">
        <div className="sim-controls">
          <Panel title="Eventos de misión" action={<span className="sim-label">SIMULADO</span>}>
            <div className="event-buttons">
              <button
                className={solar ? "active danger" : ""}
                onClick={() => {
                  setSolar(!solar);
                  onImpact(!solar);
                }}
              >
                <Icon name="radiation" />
                <span>
                  <strong>{solar ? "Tormenta solar activa" : "Lanzar tormenta solar"}</strong>
                  <small>Evento SEP · Nivel configurable</small>
                </span>
                <Icon name="chevron" />
              </button>
              <button>
                <Icon name="comm" />
                <span>
                  <strong>Perder comunicación</strong>
                  <small>Interrumpe el enlace con Tierra</small>
                </span>
                <Icon name="chevron" />
              </button>
              <button>
                <Icon name="alert" />
                <span>
                  <strong>Activar alerta manual</strong>
                  <small>Seleccionar tipo y prioridad</small>
                </span>
                <Icon name="chevron" />
              </button>
            </div>
          </Panel>
          <Panel title="Variables ambientales">
            <div className="variable-control">
              <div>
                <span>
                  <Icon name="air" />
                  <strong>Nivel de oxígeno</strong>
                </span>
                <b className={oxygen < 19.5 ? "critical-text" : ""}>{oxygen.toFixed(1)}%</b>
              </div>
              <input
                type="range"
                min="16"
                max="23"
                step=".1"
                value={oxygen}
                onChange={(e) => {
                  setOxygen(+e.target.value);
                  onImpact(+e.target.value < 19.5);
                }}
              />
              <div className="control-actions">
                <button onClick={() => setOxygen(Math.max(16, oxygen - 0.5))}>− 0.5%</button>
                <button onClick={() => setOxygen(Math.min(23, oxygen + 0.5))}>+ 0.5%</button>
                <span>Nominal: 20.9%</span>
              </div>
            </div>
            <div className="variable-control">
              <div>
                <span>
                  <Icon name="activity" />
                  <strong>Concentración CO₂</strong>
                </span>
                <b>{co2.toFixed(2)}%</b>
              </div>
              <input
                type="range"
                min=".05"
                max="1"
                step=".01"
                value={co2}
                onChange={(e) => setCo2(+e.target.value)}
              />
              <div className="control-actions">
                <button onClick={() => setCo2(Math.max(0.05, co2 - 0.05))}>− 0.05%</button>
                <button onClick={() => setCo2(Math.min(1, co2 + 0.05))}>+ 0.05%</button>
                <span>Nominal: 0.12%</span>
              </div>
            </div>
          </Panel>
          <Panel title="Cambios biométricos">
            <div className="bio-sim-row">
              <select>
                <option>Lin Chen</option>
                <option>Valentina Ramos</option>
              </select>
              <select>
                <option>Frecuencia cardíaca</option>
                <option>SpO₂</option>
              </select>
              <input defaultValue="96 lpm" />
              <Button variant="secondary">Aplicar cambio</Button>
            </div>
          </Panel>
        </div>
        <div className="sim-side">
          <Panel
            title="Impacto en sistemas"
            action={
              <span className="live-label">
                <i /> EN VIVO
              </span>
            }
          >
            <div className="impact-preview">
              <div className="preview-head">
                <span>VISTA ASTRONAUTA</span>
                <Pill tone={risk ? "critical" : "safe"}>{risk ? "ALERTA" : "NOMINAL"}</Pill>
              </div>
              <div className={`mini-dashboard ${risk ? "risk" : ""}`}>
                <Logo compact />
                <div className="mini-cards">
                  <i />
                  <i />
                  <i />
                </div>
                <strong>{risk ? "PROTOCOLO ACTIVO" : "Estado general óptimo"}</strong>
              </div>
              <div className="preview-head">
                <span>VISTA MÉDICA</span>
                <Pill tone={risk ? "warn" : "safe"}>{risk ? "1 EVENTO" : "SIN ALERTAS"}</Pill>
              </div>
              <div className={`mini-dashboard medical ${risk ? "risk" : ""}`}>
                <div />
                <div />
                <div />
              </div>
            </div>
          </Panel>
          <Panel title="Registro de eventos">
            <div className="event-log">
              {risk && (
                <div>
                  <i className="risk" />
                  <span className="mono">09:42:18</span>
                  <p>
                    <strong>Variable fuera de rango</strong>
                    <small>Actualización propagada a dashboards</small>
                  </p>
                </div>
              )}
              <div>
                <i />
                <span className="mono">09:41:02</span>
                <p>
                  <strong>Simulación iniciada</strong>
                  <small>Valores nominales cargados</small>
                </p>
              </div>
              <div>
                <i />
                <span className="mono">09:40:58</span>
                <p>
                  <strong>Perfil ARES VII</strong>
                  <small>Escenario validado</small>
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AstronautShell({
  screen,
  setScreen,
  children,
}: {
  screen: string;
  setScreen: (s: string) => void;
  children: React.ReactNode;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="astronaut-frame">
      {screen !== "T1" && screen !== "T6" && (
        <>
          <header className="mobile-header">
            <Logo />
            <StatusBar mobile />
            <button className="icon-button" onClick={() => setMenu(!menu)}>
              <Icon name={menu ? "close" : "menu"} />
            </button>
          </header>
          {menu && (
            <div className="mobile-menu">
              {astronautNav.map((x) => (
                <button
                  className={screen === x[0] ? "active" : ""}
                  onClick={() => {
                    setScreen(x[0]);
                    setMenu(false);
                  }}
                  key={x[0]}
                >
                  <span>{x[0]}</span>
                  {x[1]}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <main>{children}</main>
      {screen !== "T1" && screen !== "T6" && (
        <nav className="bottom-nav">
          {[
            ["T2", "home", "Hoy"],
            ["T4", "activity", "Salud"],
            ["T3", "spark", "ELOISE"],
            ["T5", "check", "Check-in"],
            ["T9", "settings", "Ajustes"],
          ].map((x) => (
            <button
              className={screen === x[0] ? "active" : ""}
              onClick={() => setScreen(x[0])}
              key={x[0]}
            >
              <Icon name={x[1] as IconName} />
              <span>{x[2]}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function DesktopShell({
  screen,
  setScreen,
  children,
  role,
}: {
  screen: string;
  setScreen: (s: string) => void;
  children: React.ReactNode;
  role: "medical" | "simulation";
}) {
  const nav = role === "medical" ? medicalNav : simulationNav;
  return (
    <div className="desktop-shell">
      <aside>
        <Logo />
        <div className="mission-id">
          <span>ARES VII</span>
          <strong>Misión activa</strong>
          <Pill>ONLINE</Pill>
        </div>
        <nav>
          {nav.map((x) => (
            <button
              className={screen === x[0] ? "active" : ""}
              onClick={() => setScreen(x[0])}
              key={x[0]}
            >
              <Icon
                name={
                  (
                    {
                      M1: "crew",
                      M2: "user",
                      M3: "alert",
                      M4: "radiation",
                      M5: "report",
                      D1: "settings",
                    } as Record<string, IconName>
                  )[x[0]]
                }
              />
              <span>{x[1]}</span>
              {x[0] === "M3" && <b>2</b>}
            </button>
          ))}
        </nav>
        <div className="aside-bottom">
          <button>
            <Icon name="settings" /> Configuración
          </button>
          <div className="user-card">
            <span>ER</span>
            <div>
              <strong>Dra. Elena Ruiz</strong>
              <small>Directora médica</small>
            </div>
            <Icon name="chevron" size={15} />
          </div>
        </div>
      </aside>
      <div className="desktop-main">
        <header>
          <StatusBar />
          <div className="header-actions">
            <button>
              <Icon name="alert" size={18} />
              <i />
            </button>
            <span>RED MÉDICA CIFRADA</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("T2");
  const [simImpact, setSimImpact] = useState(false);
  const role = screen.startsWith("T")
    ? "astronaut"
    : screen.startsWith("M")
      ? "medical"
      : "simulation";
  const content = useMemo(() => {
    const screens: Record<string, React.ReactNode> = {
      T1: <T1Welcome navigate={setScreen} />,
      T2: <T2Dashboard navigate={setScreen} />,
      T3: <T3Conversation />,
      T4: <T4Health />,
      T5: <T5Checkin />,
      T6: <T6Emergency />,
      T7: <T7Shelter />,
      T8: <T8Privacy />,
      T9: <T9Settings />,
      M1: <M1Crew navigate={setScreen} />,
      M2: <M2Detail />,
      M3: <M3Alerts />,
      M4: <M4Radiation />,
      M5: <M5Report />,
      D1: <D1Simulation onImpact={setSimImpact} />,
    };
    return screens[screen];
  }, [screen]);
  return (
    <div className="app">
      <div className="prototype-switcher">
        <span>ENTORNO</span>
        <button className={role === "astronaut" ? "active" : ""} onClick={() => setScreen("T2")}>
          Astronauta
        </button>
        <button className={role === "medical" ? "active" : ""} onClick={() => setScreen("M1")}>
          Personal médico
        </button>
        <button className={role === "simulation" ? "active" : ""} onClick={() => setScreen("D1")}>
          Simulación
        </button>
        <select value={screen} onChange={(e) => setScreen(e.target.value)}>
          {[...astronautNav, ...medicalNav, ...simulationNav].map((x) => (
            <option value={x[0]} key={x[0]}>
              {x[0]} · {x[1]}
            </option>
          ))}
        </select>
        {simImpact && <Pill tone="critical">SIMULACIÓN PROPAGADA</Pill>}
      </div>
      {role === "astronaut" ? (
        <AstronautShell screen={screen} setScreen={setScreen}>
          {content}
        </AstronautShell>
      ) : (
        <DesktopShell role={role} screen={screen} setScreen={setScreen}>
          {content}
        </DesktopShell>
      )}
    </div>
  );
}

export default App;
