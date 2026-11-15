// Catálogo copiado de supabase/schema.sql (tipos de alerta y umbrales).
// ⚠️ Los umbrales son valores de referencia por verificar (fase 0).

export const THRESHOLDS = [
  { metric: 'spo2_pct', level: 'attention', min: 94 },
  { metric: 'spo2_pct', level: 'urgent', min: 90 },
  { metric: 'cabin_o2_pct', level: 'attention', min: 32 },
  { metric: 'cabin_o2_pct', level: 'urgent', min: 30 },
  { metric: 'cabin_pressure_psia', level: 'attention', min: 7.9, max: 8.6 },
  { metric: 'cabin_pressure_psia', level: 'urgent', min: 7.5, max: 9.0 },
  { metric: 'cabin_co2_mmhg', level: 'attention', max: 3 },
  { metric: 'cabin_co2_mmhg', level: 'urgent', max: 6 },
  { metric: 'heart_rate_bpm', level: 'attention', min: 45, max: 110 },
  { metric: 'heart_rate_bpm', level: 'urgent', min: 38, max: 140 },
  { metric: 'resp_rate_bpm', level: 'attention', min: 10, max: 24 },
  { metric: 'resp_rate_bpm', level: 'urgent', min: 8, max: 30 },
  { metric: 'dose_rate_usv_h', level: 'attention', max: 200 },
  { metric: 'dose_rate_usv_h', level: 'urgent', max: 1000 },
  { metric: 'cabin_temp_c', level: 'attention', min: 18, max: 27 },
  { metric: 'cabin_temp_c', level: 'urgent', min: 15, max: 30 },
];

export const ALERT_TYPES = {
  spo2_low: {
    metric: 'spo2_pct',
    title: { es: 'Oxígeno en sangre bajo', en: 'Low blood oxygen' },
    steps: {
      es: ['Detén la actividad y respira con calma', 'Usa el oxígeno de emergencia si está indicado', 'Avisa a un compañero: el médico ya fue notificado'],
      en: ['Stop what you are doing and breathe calmly', 'Use emergency oxygen if indicated', 'Tell a crewmate: the surgeon has been notified'],
    },
  },
  cabin_o2_low: {
    metric: 'cabin_o2_pct',
    title: { es: 'Oxígeno de la cabina bajo', en: 'Low cabin oxygen' },
    steps: {
      es: ['Revisa el sistema de soporte vital', 'Reduce el esfuerzo físico', 'Sigue el procedimiento de la tripulación'],
      en: ['Check the life support system', 'Reduce physical effort', 'Follow the crew procedure'],
    },
  },
  cabin_pressure_out_of_range: {
    metric: 'cabin_pressure_psia',
    title: { es: 'Presión de la cabina fuera de rango', en: 'Cabin pressure out of range' },
    steps: {
      es: ['Revisa el panel de presión', 'Prepárate para el procedimiento de emergencia', 'Mantente con tu equipo'],
      en: ['Check the pressure panel', 'Get ready for the emergency procedure', 'Stay with your team'],
    },
  },
  cabin_co2_high: {
    metric: 'cabin_co2_mmhg',
    title: { es: 'CO2 alto en la cabina', en: 'High cabin CO2' },
    steps: {
      es: ['Revisa el depurador de CO2', 'Si te duele la cabeza, avísalo', 'Muévete a una zona con mejor ventilación'],
      en: ['Check the CO2 scrubber', 'If you have a headache, report it', 'Move to a better ventilated area'],
    },
  },
  heart_rate_out_of_range: {
    metric: 'heart_rate_bpm',
    title: { es: 'Frecuencia cardíaca fuera de rango', en: 'Heart rate out of range' },
    steps: {
      es: ['Detente y descansa', 'Respira despacio', 'Si no mejora, avisa al médico'],
      en: ['Stop and rest', 'Breathe slowly', 'If it does not improve, tell the surgeon'],
    },
  },
  resp_rate_out_of_range: {
    metric: 'resp_rate_bpm',
    title: { es: 'Respiración fuera de rango', en: 'Breathing rate out of range' },
    steps: {
      es: ['Detente y descansa', 'Respira despacio por la nariz', 'Si no mejora, avisa al médico'],
      en: ['Stop and rest', 'Breathe slowly through your nose', 'If it does not improve, tell the surgeon'],
    },
  },
  dose_rate_high: {
    metric: 'dose_rate_usv_h',
    title: { es: 'Radiación alta en la zona', en: 'High radiation in this area' },
    steps: {
      es: ['Ve a una zona más blindada', 'Limita el tiempo en esta zona', 'Sigue las indicaciones de Eco'],
      en: ['Move to a better shielded area', 'Limit your time in this area', "Follow Echo's guidance"],
    },
  },
  cabin_temp_out_of_range: {
    metric: 'cabin_temp_c',
    title: { es: 'Temperatura de la cabina fuera de rango', en: 'Cabin temperature out of range' },
    steps: {
      es: ['Revisa el control térmico', 'Abrígate o refréscate según el caso'],
      en: ['Check thermal control', 'Warm up or cool down as needed'],
    },
  },
  solar_storm: {
    metric: null,
    title: { es: 'Tormenta solar: ve al refugio', en: 'Solar storm: go to the shelter' },
    steps: {
      es: ['Deja lo que estás haciendo de forma segura', 'Ve al refugio blindado asignado', 'Confirma tu llegada en la pantalla'],
      en: ['Safely stop what you are doing', 'Go to your assigned shielded shelter', 'Confirm your arrival on screen'],
    },
  },
};

export const TYPE_BY_METRIC = Object.fromEntries(
  Object.entries(ALERT_TYPES).filter(([, v]) => v.metric).map(([code, v]) => [v.metric, code]),
);
