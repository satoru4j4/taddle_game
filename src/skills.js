import {QUEST,FANTASY,LEGACY,STATS} from './config.js';

// Multipliers apply on top of the current form's combat statistics.
export const SKILLS = Object.freeze({
  [QUEST]: {blink:{name:'Taddle Blink',cost:20,cooldown:4,duration:.24,distance:280,multiplier:1.5,boost:1.5}},
  [FANTASY]: {
    blink:{name:'Taddle Blink · Naga',cost:40,cooldown:4,duration:.24,distance:340,multiplier:2,boost:1.8},
    slash:{name:'Taddle Slash',cost:70,cooldown:7,range:520,height:180,multiplier:2.2}
  },
  [LEGACY]: {
    blink:{name:'Taddle Blink · Malaikat',cost:100,cooldown:3.5,duration:.24,distance:400,multiplier:3,boost:2},
    slash:{name:'Taddle Slash · Malaikat',cost:180,cooldown:6,range:760,height:240,multiplier:3},
    blessing:{name:'Bleesing of Legacy',cost:500,cooldown:20,duration:5}
  }
});
export const SKILL_ACTIONS={blink:'skillBlink',slash:'skillSlash',blessing:'skillBlessing'};
export const skillFor=(actor,kind)=>SKILLS[actor.type]?.[kind];
export function activateBlessing(actor){
  if(actor.blessingTime>0)return false;
  actor.baseStats=STATS[actor.type];
  actor.stats=Object.fromEntries(Object.entries(actor.baseStats).map(([key,n])=>[key,n*2]));
  // Preserve percentages: temporary maximum HP is not a permanent heal.
  actor.hp*=2;actor.stamina*=2;actor.blessingTime=5;return true;
}
export function tickSkills(actor,dt){
  for(const key of Object.keys(actor.cooldowns||{}))actor.cooldowns[key]=Math.max(0,actor.cooldowns[key]-dt);
  actor.nextStrikeTime=Math.max(0,(actor.nextStrikeTime||0)-dt);
  if(!actor.nextStrikeTime)actor.nextStrikeBoost=1;
  if(actor.blessingTime>0){
    actor.blessingTime=Math.max(0,actor.blessingTime-dt);
    if(!actor.blessingTime){actor.hp=Math.min(actor.baseStats.hp,actor.hp/2);actor.stamina=Math.min(actor.baseStats.stamina,actor.stamina/2);actor.stats=actor.baseStats;}
  }
}
export function combatSnapshot(actor){
  const scale=actor.blessingTime>0?2:1;
  return {hp:actor.hp/scale,stamina:actor.stamina/scale,hpPotions:actor.hpPotions,staminaPotions:actor.staminaPotions,cooldowns:{...actor.cooldowns}};
}
export function blinkInvulnerable(actor){const a=actor.attack;return !!a&&a.kind==='blink'&&!a.cancelled&&a.t>=a.windup&&a.t<a.windup+a.active;}
