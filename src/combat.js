import { clamp } from './config.js';
import {blinkInvulnerable} from './skills.js';
import {crownGuard} from './challenge.js';
export const actionRate = s => 1+.30*s/(s+300);
export const walkSpeed = s => 200+100*s/(s+200);
export function attackCost(stats, kind='light') { const base=Math.ceil(8+.01*stats.damage); return kind==='heavy'?Math.ceil(2.5*base):kind==='special'?Math.ceil(3*base):base; }
export function impact(attacker, defender, multiplier=1, counter=1) {
  const rawImpact=attacker.damage*(1+.25*attacker.power/(attacker.power+100))*multiplier*counter;
  const guardFactor=1+defender.defend/500;
  return { rawImpact, hpDamage:Math.max(1,Math.round(rawImpact*(1-Math.min(.6,defender.defend/(defender.defend+400))))), blockCost:Math.ceil(8+.06*rawImpact/guardFactor), parryImpactCost:Math.ceil(.025*rawImpact/guardFactor) };
}
export function defenseResult(defender, hit, facing) {
  const values=impact(hit.stats,defender.stats,hit.multiplier,hit.counter||1);
  const parry=defender.parryWindow>0 && facing && hit.parryable && !defender.parryUsed;
  const block=defender.block && facing && hit.blockable;
  if(parry || block) {
    const cost=parry?values.parryImpactCost:values.blockCost;
    if(defender.stamina>=cost) return {...values,type:parry?'parry':'block',damage:0,cost};
    return {...values,type:'guard-break',damage:values.hpDamage,cost:defender.stamina};
  }
  return {...values,type:'hit',damage:values.hpDamage,cost:0};
}
export function spend(actor,amount) { if(actor.stamina<amount)return false; actor.stamina=Math.max(0,actor.stamina-amount); actor.regenDelay=.8; return true; }
export function tickVitals(actor,dt) {
  for(const key of ['immunity','hurt','guardBreak','regenDelay','parryCooldown','parryWindow','counterTime','staggerResist','guardCooldown']) actor[key]=Math.max(0,(actor[key]||0)-dt);
  if(!actor.counterTime)actor.counterTarget=null;
  if(actor.regenDelay<=0 && (actor.grounded||actor.flying) && !actor.attack && !actor.block && !actor.parryCooldown && !actor.hurt && !actor.guardBreak && !actor.potion && !actor.running) actor.stamina=clamp(actor.stamina+(12+.04*actor.stats.stamina)*dt,0,actor.stats.stamina);
}
// Contacts are computed before mutation. Damage is then applied as one batch;
// parrying cancels the entire attack instance, including its remaining subhits.
export function resolveContacts(contacts, now=0) {
  contacts.sort((a,b)=>(a.time??now)-(b.time??now)||a.source.id.localeCompare(b.source.id));
  const results=[], cancelled=new Set(), damaged=new Set();
  for(const contact of contacts) {
    const {source,target,attack,subhit=0}=contact;
    const key=`${subhit}:${target.id}`;
    if(attack.cancelled || cancelled.has(attack.id)||attack.hits.has(key)||target.immunity>0||blinkInvulnerable(target)||damaged.has(target.id))continue;
    attack.hits.add(key);
    const facing=(source.x-target.x)*target.facing>=0;
    const crown=crownGuard(target)&&facing&&attack.counterTarget!==target.id;
    const hit={stats:source.stats,multiplier:attack.multiplier*(crown?.4:1),counter:attack.counterTarget===target.id?3:1,blockable:attack.blockable,parryable:attack.parryable};
    const result=defenseResult(target,hit,facing);
    if(result.type!=='hit')spend(target,result.cost);
    if(result.type==='parry') {
      target.parryUsed=true; target.parryWindow=0; target.parryCooldown=0;
      target.counterTarget=source.id; target.counterTime=1.5;
      attack.cancelled=true; cancelled.add(attack.id); source.attack=null;
      source.hurt=source.boss?.9:1.1; source.block=false;
    }
    if(result.damage)damaged.add(target.id);
    results.push({...result,crown,source,target,attack});
  }
  for(const r of results) {
    if(r.damage) {
      r.target.hp=Math.max(0,r.target.hp-r.damage); r.target.immunity=r.target.player?.45:.10;
      r.target.lastDamageSource=r.source.type;
      if(r.attack.knockUp&&r.target.blessingTime<=0&&!r.target.destructible){r.target.vy=-r.attack.knockUp;r.target.grounded=false;r.target.coyote=0;if(r.target.player)r.target.jumpsUsed=Math.max(1,r.target.jumpsUsed);}
      r.target.potion=null;
      if(!r.target.boss || !r.target.attack) {
        if((r.target.player || !r.target.staggerResist)&&!(r.target.blessingTime>0)) { r.target.attack=null; r.target.hurt=r.target.player?.16:.30; r.target.staggerResist=.90; }
      }
    }
    if(r.type==='guard-break') { r.target.guardBreak=.9; r.target.attack=null; r.target.block=false; r.target.parryWindow=0; }
  }
  return results;
}
export function finalResult(playerHp,bossHp,phase) { return playerHp<=0?'defeat':bossHp<=0?(phase===1?'phase2':'ending'):null; }
