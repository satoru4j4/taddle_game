import {FANTASY,LEGACY,TELEGRAPH} from './config.js';

// Difficulty follows the chosen form; these are combat targets, not measured human win rates.
export const CHALLENGE = Object.freeze({
  kingPhase1Hp:4800,
  kingPhase2Hp:Object.freeze({[FANTASY]:20000,[LEGACY]:60000}),
  rageThreshold:.45,
  darknessDamage:1.5
});
export function encounterStats(spawn,form,level){
  const stats={...spawn.stats};
  if(spawn.type==='boss-king')stats.hp=CHALLENGE.kingPhase1Hp;
  else if(spawn.type==='boss-king-phase2'){
    stats.hp=CHALLENGE.kingPhase2Hp[form]||stats.hp;
    if(form===LEGACY)stats.speed=2600;
  }else if(spawn.boss)stats.hp=Math.round(stats.hp*(level<=3?1.75:2.4));
  else if(level>=3){stats.hp=Math.round(stats.hp*1.35);stats.damage=Math.round(stats.damage*1.2);}
  return stats;
}
export function enraged(actor){return actor.boss&&actor.hp>0&&actor.hp/actor.stats.hp<=CHALLENGE.rageThreshold;}
export function crownGuard(actor){
  const a=actor.attack;
  return !!actor.darkness&&!!a&&!a.cancelled&&a.t<a.windup+Math.max(...a.offsets)+a.active;
}
export function tuneEnemyAttack(actor,attack,level){
  const rage=enraged(actor),floor=actor.boss?.5:TELEGRAPH[level];
  // Change a telegraph only before launch. Never accelerate an attack already being shown.
  attack.windup=Math.max(floor,attack.windup*(actor.darkness?.82:1)*(rage?.9:1));
  attack.recovery*= (actor.boss?.72:.82)*(rage?.72:1);
  if(actor.darkness){attack.multiplier*=CHALLENGE.darknessDamage;attack.range*=1.2;}
  if(rage)attack.label='AMUK · '+attack.label;
  return attack;
}
