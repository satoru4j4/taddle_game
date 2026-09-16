import { QUEST,FANTASY,LEGACY,STATS,DEFAULT_KEYS } from './config.js';
export const copy = value=>structuredClone(value);
export function newProfile() { return {unlockedEndings:[],settings:{masterVolume:.65,musicVolume:.35,sfxVolume:.75,reducedMotion:false,instantText:true,keyBindingsVersion:2,keyBindings:{...DEFAULT_KEYS}}}; }
export function fullSnapshot(form) {return {hp:STATS[form].hp,stamina:STATS[form].stamina,hpPotions:3,staminaPotions:2};}
export function scene(id,returnPoint,snapshot,temporaryWorld) {return {id,page:0,returnPoint,snapshot,...(temporaryWorld?{temporaryWorld}: {})};}
export function newRun(seed=Date.now()>>>0) {
  return {schemaVersion:1,revision:0,runId:globalThis.crypto.randomUUID(),level:1,currentForm:QUEST,formHistory:[QUEST],fantasyStatus:'unseen',fantasyClueSeen:false,finalPhaseUnlocked:1,phase1VictoryForm:null,legacyAwakened:false,princessHumanDead:true,angelState:'in-vessel',storyFlags:[],pendingScene:scene('intro','level-entry',fullSnapshot(QUEST)),outcome:null,attemptSeed:seed,deathCount:0};
}
const histories=[[QUEST],[QUEST,FANTASY],[QUEST,FANTASY,LEGACY]];
const scenes=['intro','quest-transform','fantasy-story','fantasy-transform','phase2-transition','loss','legacy-story','legacy-transform'];
export const PAGE_COUNTS={intro:3,'quest-transform':1,'fantasy-story':5,'fantasy-transform':1,'phase2-transition':1,loss:4,'legacy-story':6,'legacy-transform':1};
export function validateRun(r) {
  const errors=[]; const check=(yes,msg)=>{if(!yes)errors.push(msg);};
  if(!r||typeof r!=='object')return ['Data perjalanan tidak terbaca.'];
  check(r.schemaVersion===1,'Versi save tidak dikenal.');
  check(Number.isInteger(r.revision)&&r.revision>=0,'Revisi tidak sah.');
  check(typeof r.runId==='string'&&r.runId.length>0,'ID perjalanan tidak sah.');
  check(Number.isInteger(r.level)&&r.level>=1&&r.level<=7,'Wilayah tidak sah.');
  check(histories.some(h=>JSON.stringify(h)===JSON.stringify(r.formHistory)),'Riwayat form tidak sah.');
  check(Array.isArray(r.formHistory)&&r.currentForm===r.formHistory.at(-1),'Form tidak sesuai riwayat.');
  check(['unseen','offered','accepted','declined','missed'].includes(r.fantasyStatus),'Status Gashat tidak sah.');
  if(r.level<4)check(r.fantasyStatus==='unseen','Keputusan Fantasy sebelum wilayah 4.');
  check(r.princessHumanDead===true,'Status jiwa Putri tidak sah.');
  check(['in-vessel','vessel-broken','merged-legacy'].includes(r.angelState),'Status malaikat tidak sah.');
  check(typeof r.legacyAwakened==='boolean'&&typeof r.fantasyClueSeen==='boolean','Flag cerita tidak sah.');
  check(Array.isArray(r.storyFlags)&&r.storyFlags.every(s=>typeof s==='string'),'Catatan tidak sah.');
  check(Number.isInteger(r.deathCount)&&r.deathCount>=0&&Number.isInteger(r.attemptSeed),'Data percobaan tidak sah.');
  check([1,2].includes(r.finalPhaseUnlocked),'Fase final tidak sah.');
  check(r.outcome===null||['real','good','extream'].includes(r.outcome),'Ending tidak sah.');
  if(r.currentForm!==QUEST)check(r.fantasyStatus==='accepted'&&r.level>=4,'Form lanjutan memerlukan Fantasy diterima.');
  if(r.fantasyStatus==='accepted')check(r.currentForm===FANTASY||r.currentForm===LEGACY,'Gashat diterima tanpa form.');
  if(r.level>=5)check(!['unseen','offered'].includes(r.fantasyStatus),'Kesempatan Gashat telah berakhir.');
  if(r.fantasyStatus==='offered')check(r.level===4&&r.currentForm===QUEST&&r.pendingScene?.id==='fantasy-story','Penawaran tanpa kisah.');
  if(r.fantasyStatus==='missed')check(r.level>=5,'Gashat terlewat sebelum waktunya.');
  if(r.pendingScene?.snapshot?.cooldowns)check(['blink','slash','blessing'].every(k=>Number.isFinite(r.pendingScene.snapshot.cooldowns[k])&&r.pendingScene.snapshot.cooldowns[k]>=0),'Cooldown tidak sah.');
  if(r.currentForm===LEGACY||r.legacyAwakened||r.angelState==='merged-legacy')check(r.currentForm===LEGACY&&r.level===7&&r.finalPhaseUnlocked===2&&r.legacyAwakened&&r.angelState==='merged-legacy','Legacy tidak konsisten.');
  if(r.angelState==='vessel-broken')check(r.currentForm===FANTASY&&r.finalPhaseUnlocked===2&&['loss','legacy-story'].includes(r.pendingScene?.id),'Kehilangan tanpa adegan.');
  if(r.finalPhaseUnlocked===2)check(r.level===7&&[QUEST,FANTASY].includes(r.phase1VictoryForm),'Fase 2 tanpa kemenangan fase 1.');
  else check(r.phase1VictoryForm===null,'Riwayat fase tidak konsisten.');
  if(r.currentForm===QUEST&&r.phase1VictoryForm)check(r.phase1VictoryForm===QUEST,'Riwayat kemenangan Quest tidak sah.');
  if(r.pendingScene) {
    const p=r.pendingScene;
    check(scenes.includes(p.id)&&Number.isInteger(p.page)&&p.page>=0&&p.page<PAGE_COUNTS[p.id],'Adegan tidak sah.');
    check(['level-entry','fantasy-alcove','phase2-arena'].includes(p.returnPoint),'Titik kembali tidak sah.');
    check(p.snapshot&&['hp','stamina','hpPotions','staminaPotions'].every(k=>Number.isFinite(p.snapshot[k])&&p.snapshot[k]>=0),'Snapshot tidak sah.');
    if(p.snapshot){check(p.snapshot.hp<=STATS[r.currentForm]?.hp&&p.snapshot.stamina<=STATS[r.currentForm]?.stamina&&Number.isInteger(p.snapshot.hpPotions)&&p.snapshot.hpPotions<=3&&Number.isInteger(p.snapshot.staminaPotions)&&p.snapshot.staminaPotions<=2,'Kapasitas snapshot tidak sah.');}
    if(p.id==='fantasy-story')check(r.fantasyStatus==='offered','Kisah Fantasy tanpa penawaran.');
    if(p.id==='fantasy-transform')check(r.currentForm===FANTASY&&r.level===4,'Transformasi Fantasy tidak sah.');
    if(['intro','quest-transform'].includes(p.id))check(r.level===1&&r.currentForm===QUEST,'Intro tidak sah.');
    if(['loss','legacy-story'].includes(p.id))check(r.angelState==='vessel-broken','Kisah kehilangan tidak sah.');
    if(p.id==='legacy-transform')check(r.currentForm===LEGACY,'Transformasi Legacy tidak sah.');
    if(p.returnPoint==='fantasy-alcove')check(p.temporaryWorld&&Array.isArray(p.temporaryWorld.defeatedEnemyIds)&&Array.isArray(p.temporaryWorld.openedEncounterIds)&&Number.isFinite(p.temporaryWorld.playerX)&&Number.isFinite(p.temporaryWorld.playerY),'Snapshot ceruk tidak lengkap.');
    if(p.returnPoint==='phase2-arena')check(r.finalPhaseUnlocked===2,'Arena fase 2 belum dibuka.');
  }
  if(r.outcome)check(!r.pendingScene&&r.level===7&&r.finalPhaseUnlocked===2&&endingFor(r)===r.outcome,'Ending tidak konsisten.');
  return errors;
}
export function endingFor(r) {
  if(r.currentForm===LEGACY&&r.legacyAwakened&&r.angelState==='merged-legacy')return 'real';
  if(r.currentForm===FANTASY&&!r.legacyAwakened&&r.angelState==='in-vessel')return 'good';
  if(r.currentForm===QUEST&&r.formHistory?.length===1&&r.phase1VictoryForm===QUEST&&!r.legacyAwakened&&r.angelState==='in-vessel')return 'extream';
  return null;
}
// Reducer accepts verified simulation evidence, never a menu-supplied win event.
export function transition(run,event) {
  const r=copy(run),p=r.pendingScene; const require=(ok)=>{if(!ok)throw Error(`Transisi tidak sah: ${event.type}`);};
  const finished=!!p&&p.page===PAGE_COUNTS[p.id]-1&&event.finished===true;
  require(!r.outcome);
  switch(event.type) {
    case 'cinematic-finished': require(p?.id==='loss'&&p.page===0&&event.finished===true);p.cinematicDone=true;break;
    case 'prisoner-free': require(!p&&r.level===5&&event.cageHp<=0);if(!r.storyFlags.includes('prisoner-freed'))r.storyFlags.push('prisoner-freed');if(!r.storyFlags.includes('clue-5'))r.storyFlags.push('clue-5');break;
    case 'clue': require(!p); r.fantasyClueSeen=r.level===4||r.fantasyClueSeen; if(!r.storyFlags.includes(`clue-${r.level}`))r.storyFlags.push(`clue-${r.level}`); break;
    case 'offer': require(!p&&r.level===4&&r.currentForm===QUEST&&r.fantasyStatus==='unseen'&&event.atAlcove); r.fantasyStatus='offered'; r.pendingScene=scene('fantasy-story','fantasy-alcove',event.snapshot,event.world); break;
    case 'page': require(p&&!(p.id==='loss'&&p.page===0&&!p.cinematicDone)&&!p.id.includes('transform')&&event.page===p.page+1&&event.page<PAGE_COUNTS[p.id]&&event.pageCount===PAGE_COUNTS[p.id]); p.page=event.page; break;
    case 'intro-finished': require(p?.id==='intro'&&finished); r.pendingScene={...p,id:'quest-transform',page:0}; break;
    case 'fantasy-choice': require(p?.id==='fantasy-story'&&r.fantasyStatus==='offered'&&finished); r.storyFlags.push('fantasy-story'); r.fantasyStatus=event.accept?'accepted':'declined'; if(event.accept){r.currentForm=FANTASY;r.formHistory.push(FANTASY);r.pendingScene={...p,id:'fantasy-transform',page:0,snapshot:{...p.snapshot,hp:STATS[FANTASY].hp,stamina:STATS[FANTASY].stamina}};}else r.pendingScene=null; break;
    case 'loss-finished': require(p?.id==='loss'&&finished);r.pendingScene={...p,id:'legacy-story',page:0};break;
    case 'legacy-finished': require(p?.id==='legacy-story'&&r.currentForm===FANTASY&&r.angelState==='vessel-broken'&&finished);r.currentForm=LEGACY;r.formHistory.push(LEGACY);r.legacyAwakened=true;r.angelState='merged-legacy';r.storyFlags.push('legacy-story');r.pendingScene=scene('legacy-transform','phase2-arena',fullSnapshot(LEGACY));break;
    case 'scene-finished': require(p&&(p.id.includes('transform')||p.id==='phase2-transition')&&event.destinationReady);r.pendingScene=null;break;
    case 'advance': require(!p&&r.level<7&&event.bossesDefeated&&event.atExit&&(r.level!==5||r.storyFlags.includes('prisoner-freed'))); if(r.level===4&&r.fantasyStatus==='unseen')r.fantasyStatus='missed';r.level++;r.attemptSeed=event.seed;break;
    case 'defeat': require(!p&&event.playerHp<=0);r.deathCount++;if(r.currentForm===FANTASY&&r.level===7&&r.finalPhaseUnlocked===2&&event.encounter==='boss-king-phase2'&&event.cause==='boss-king-phase2'&&!r.legacyAwakened){r.angelState='vessel-broken';r.pendingScene=scene('loss','phase2-arena',event.snapshot);}break;
    case 'phase1-win': require(!p&&r.level===7&&r.finalPhaseUnlocked===1&&event.encounter==='boss-king'&&event.playerHp>0&&event.bossHp<=0);r.finalPhaseUnlocked=2;r.phase1VictoryForm=r.currentForm;r.pendingScene=scene('phase2-transition','phase2-arena',event.snapshot);break;
    case 'final-win': require(!p&&r.level===7&&r.finalPhaseUnlocked===2&&event.encounter==='boss-king-phase2'&&event.playerHp>0&&event.bossHp<=0);r.outcome=endingFor(r);require(r.outcome);break;
    default: throw Error(`Event tidak dikenal: ${event.type}`);
  }
  const errors=validateRun(r);if(errors.length)throw Error(errors.join(' '));return r;
}
