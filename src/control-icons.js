import {QUEST,FANTASY,LEGACY} from './config.js';

const sword='<path d="m10 22 13-15 3-1-1 4-14 14M7 20l6 6M6 27l4-4M5 28l2-1"/>';
const wings='<path d="M15 21C9 20 5 15 3 7l7 5-3-7 8 8M17 21c6-1 10-6 12-14l-7 5 3-7-8 8M6 15l7 5M26 15l-7 5"/>';
const dragon='<path d="m5 22 2-10 7-6-2 6 8-2 7 5-2 4-9-1 8 7-12-2-4-4M8 12 3 7l10 2M18 14h2M19 19l1 3M23 19l1 3"/>';
const bottle='<path d="M12 3h8v5l5 7v10a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V15l5-7V3ZM12 7h8"/>';
const icons={
  left:'<path d="m20 6-10 10 10 10M26 6 16 16l10 10"/>',
  right:'<path d="m6 6 10 10L6 26M12 6l10 10-10 10"/>',
  light:sword,
  heavy:sword+'<path d="M5 18A11 11 0 0 1 26 8M22 8l4-4 4 4"/>',
  jump:'<path d="M16 26V6M9 13l7-7 7 7M9 7l7-5 7 5M6 28h20"/>',
  block:'<path d="m16 3 11 4v9c0 6-6 11-11 14C11 27 5 22 5 16V7l11-4Z"/><path d="M16 8v16M10 11h12"/>',
  parry:'<path d="M16 4 6 8v8c0 6 6 10 10 13 5-3 10-7 10-13"/><path d="m22 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/>',
  journal:'<path d="M16 8C12 4 7 4 3 6v20c5-2 9-1 13 2 4-3 8-4 13-2V6c-4-2-9-2-13 2v20M7 10l5 1M7 15l5 1M20 11l5-1M20 16l5-1"/>',
  interact:'<path d="M12 18V8a2 2 0 0 1 4 0v8-3a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v5c0 5-4 8-9 8h-2c-3 0-5-2-7-5l-4-5a2 2 0 0 1 3-3l3 3M13 2h2M6 6 4 4M22 6l2-2"/>',
  hpPotion:bottle+'<path d="M16 15v8M12 19h8"/>',
  staminaPotion:bottle+'<path d="m18 12-6 9h5l-2 6 7-10h-5l1-5Z"/>',
  pause:'<path stroke-width="4" d="M11 6v20M21 6v20"/>'
};
export function controlIcon(action,form=QUEST){
  let body=icons[action];
  if(action==='skillBlink')body=form===FANTASY?dragon+'<path d="M2 25h5M1 29h9"/>':form===LEGACY?wings+'<path d="M10 26h15m-4-4 4 4-4 4"/>':'<path d="m19 3-9 14h7l-3 12L27 12h-8l3-9ZM2 12h5M1 18h5M2 24h5"/>';
  if(action==='skillSlash')body=(form===LEGACY?wings:'<path d="m3 6 11 6 12-7-4 12-6-2-7 4-6-13ZM3 6l13 9"/>')+sword;
  if(action==='skillBlessing')body=wings+'<ellipse cx="16" cy="4" rx="5" ry="2"/><path d="M16 16v14M12 22h8"/>';
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body||''}</svg>`;
}
