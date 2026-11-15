// Iconos del diseño ELOISE (trazos de 24×24, mismo estilo que el diseño de Figma Make)
const PATHS = {
  activity: '<path d="M3 12h3l2-6 4 12 3-8 2 2h4"/>',
  air: '<path d="M4 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/>',
  alert: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
  arrow: '<path d="m5 12 14 0m-5-5 5 5-5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  comm: '<path d="M5 16.5a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 9.5a2 2 0 0 1 2 0"/><circle cx="12" cy="19" r="1"/>',
  crew: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5"/>',
  earth: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  heart: '<path d="M20.8 5.8a5.4 5.4 0 0 0-7.7 0L12 7l-1.1-1.2a5.4 5.4 0 0 0-7.7 7.7L12 22l8.8-8.5a5.4 5.4 0 0 0 0-7.7Z"/><path d="M7 13h2l1-3 2 6 1.5-3H17"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  moon: '<path d="M20 15.5A9 9 0 0 1 8.5 4a9 9 0 1 0 11.5 11.5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  radiation: '<circle cx="12" cy="12" r="2"/><path d="M10.4 9.3 7 3.5A9.4 9.4 0 0 1 17 4l-3.4 5.8M9.5 13.5 3 15a9.5 9.5 0 0 1 4.5-9l4.7 4.3M14.5 13.5 18 19a9.4 9.4 0 0 1-10 .5l3-5.8"/>',
  report: '<path d="M6 2h9l4 4v16H6V2Z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  reset: '<path d="M4 7v6h6"/><path d="M5.5 13A7 7 0 1 0 7 6.5L4 10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.6-1.4.9-2-2.2-2.1-2 .9-1.5-.6-.7-2h-3l-.7 2-1.4.6-2-.9-2.1 2.1.9 2-.6 1.4-2 .7v3l2 .7.6 1.4-.9 2 2.1 2.1 2-.9 1.4.6.7 2h3l.7-2 1.5-.6 2 .9 2.2-2.1-.9-2 .6-1.4 2-.7Z"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z"/><path d="m8 12 2.5 2.5L16 9"/>',
  spark: '<path d="M12 2 9.8 9.8 2 12l7.8 2.2L12 22l2.2-7.8L22 12l-7.8-2.2L12 2Z"/>',
  thermo: '<path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z"/><path d="M11 8v9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
};

export function icon(name, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;
}
