import { QUEST,FANTASY,LEGACY,STATS,FLOOR,WIDTH,REACTION,TELEGRAPH,PLAYER_MOVEMENT,PLAYER_ATTACKS,BAT_FLIGHT,clamp } from './config.js';
import { actionRate,walkSpeed,attackCost,spend,tickVitals,resolveContacts } from './combat.js';
import { levelLayout,seededRandom } from './levels.js';
import {skillFor,activateBlessing,tickSkills,combatSnapshot} from './skills.js';
import {encounterStats,enraged,tuneEnemyAttack} from './challenge.js';
export function makeActor(spawn) {
  const boss=!!spawn.boss,player=!!spawn.player;
  if(spawn.type==='bat')spawn={...spawn,flying:true};
  return {...spawn,hp:spawn.stats.hp,stamina:spawn.stats.stamina,facing:player?1:-1,w:player?44:boss?96:44,h:player?104:boss?(spawn.type==='boss-king-phase2'?330:220):96,vx:0,vy:0,grounded:!spawn.flying,coyote:spawn.flying?0:.1,state:'IDLE',animTime:0,attack:null,potion:null,block:false,running:false,parryWindow:0,parryCooldown:0,parryUsed:false,counterTime:0,counterTarget:null,immunity:0,hurt:0,guardBreak:0,regenDelay:0,staggerResist:0,guardCooldown:0,guardTime:0,reaction:0,reposition:.7,pattern:0,seen:false,lastDamageSource:null,hpPotions:3,staminaPotions:2,cooldowns:{blink:0,slash:0,blessing:0},blessingTime:0,nextStrikeTime:0,nextStrikeBoost:1};
}
function attackShape(source,kind,windup,active,recovery,multiplier,extra={}) {
  return {id:'',kind,t:0,windup,active,recovery,multiplier,range:source.boss?200:90,blockable:true,parryable:true,hits:new Set(),facing:source.facing,counterTarget:null,cancelled:false,offsets:[0],...extra};
}
export class World {
  constructor(run,{snapshot,temporaryWorld,arena=false}={}) {
    this.run=run;this.map=levelLayout(run.level,run.finalPhaseUnlocked);this.random=seededRandom(run.attemptSeed);this.time=0;this.serial=0;this.camera=0;this.events=[];this.fx=[];this.projectiles=[];this.nextThreatAt=0;this.finished=false;this.activeGroup=-1;this.cleared=new Set();this.clueDelivered=run.storyFlags.includes(`clue-${run.level}`);this.metrics={hits:0,parries:0,failedParries:0,start:0};
    this.player=makeActor({id:'player',type:run.currentForm,player:true,stats:STATS[run.currentForm],x:135,y:FLOOR,jumpsUsed:0});
    this.enemies=this.map.spawns.map(spawn=>makeActor({...spawn,stats:encounterStats(spawn,run.currentForm,run.level),darkness:spawn.type==='boss-king-phase2'&&run.currentForm===LEGACY}));
    this.cage=run.level===5?makeActor({id:'prison-cell',type:'cage',destructible:true,stats:{power:0,speed:0,defend:0,damage:0,stamina:0,hp:240},x:this.map.npcX,y:FLOOR}):null;
    if(this.cage){this.cage.w=130;this.cage.h=150;if(run.storyFlags.includes('prisoner-freed'))this.cage.hp=0;}
    this.prisonerReleased=!this.cage||this.cage.hp<=0;
    if(snapshot){Object.assign(this.player,snapshot);this.player.cooldowns={blink:0,slash:0,blessing:0,...snapshot.cooldowns};}
    if(temporaryWorld) {this.player.x=temporaryWorld.playerX;this.player.y=temporaryWorld.playerY;for(const e of this.enemies)if(temporaryWorld.defeatedEnemyIds.includes(e.id)){e.hp=0;e.deathTime=-10;}this.cleared=new Set(temporaryWorld.openedEncounterIds);}
    if(arena){const index=this.map.groups.length-1,g=this.map.groups[index];for(const e of this.enemies)if(e.group!==index)e.hp=0;for(let i=0;i<index;i++)this.cleared.add(this.map.groups[i].id);this.activeGroup=index;this.player.x=g.start+420;this.camera=clamp(this.player.x-450,0,this.map.width-WIDTH);}
  }
  snapshot(){return combatSnapshot(this.player);}
  temporary(){return {defeatedEnemyIds:this.enemies.filter(e=>e.hp<=0).map(e=>e.id),openedEncounterIds:[...this.cleared],playerX:this.player.x,playerY:this.player.y};}
  get encounter(){return this.map.groups[this.activeGroup];}
  get boss(){return this.enemies.find(e=>e.group===this.activeGroup&&e.boss&&e.hp>0);}
  get atAlcove(){return this.run.level===4&&Math.abs(this.player.x-this.map.alcove)<115&&this.cleared.has('group-1')&&this.run.fantasyStatus==='unseen'&&!this.encounter;}
  get atExit(){return this.prisonerReleased&&this.cleared.size===this.map.groups.length&&Math.abs(this.player.x-this.map.exit)<120;}
  emit(type,data={}){this.events.push({type,...data});}
  effect(text,x,y,color='#fff1c9'){this.fx.push({text,x,y,color,life:1.1});}
  clearCombat(){this.projectiles=[];for(const a of [this.player,...this.enemies]){a.attack=null;a.block=false;a.parryWindow=0;a.vx=0;} }
  launch(actor,attack){attack.id=`${actor.id}:${++this.serial}`;actor.attack=attack;actor.block=false;actor.animTime=0;actor.state='WINDUP';}
  startPlayerAttack(heavy){const p=this.player;if(!spend(p,attackCost(p.stats,heavy?'heavy':'light'))){this.emit('feedback',{text:'Stamina belum cukup.'});return;}
    const kind=heavy?'heavy':'light',tuning=PLAYER_ATTACKS[kind],rate=actionRate(p.stats.speed);
    const attack=attackShape(p,kind,tuning.windup/rate,tuning.active/rate,tuning.recovery/rate,(heavy?2:1)*(p.nextStrikeTime>0?p.nextStrikeBoost:1),{
      range:tuning.range,aerial:!p.grounded,downwardRange:tuning.downwardRange,downwardWidth:tuning.downwardWidth,empowered:p.nextStrikeTime>0,
      counterTarget:p.counterTime>0?p.counterTarget:null
    });
    p.counterTarget=null;p.counterTime=0;p.nextStrikeTime=0;p.nextStrikeBoost=1;this.launch(p,attack);
    this.emit('sound',{action:heavy?'heavy-attack':'attack',rateMultiplier:tuning.audioRate});
  }
  startSkill(kind){
    const p=this.player,tuning=skillFor(p,kind);
    if(!tuning){this.emit('feedback',{text:'Skill belum tersedia pada form ini.'});return false;}
    if(p.attack||p.potion||p.hurt>0||p.guardBreak>0||p.parryCooldown>0)return false;
    if(p.cooldowns[kind]>0){this.emit('feedback',{text:'Skill sedang memulihkan cahaya.'});return false;}
    if(kind==='blessing'&&!p.grounded){this.emit('feedback',{text:'Tancapkan pedang dari tanah untuk memanggil berkat.'});return false;}
    if(!spend(p,tuning.cost)){this.emit('feedback',{text:'Stamina belum cukup untuk skill.'});return false;}
    p.cooldowns[kind]=tuning.cooldown;
    if(kind==='blink'){
      this.launch(p,attackShape(p,'blink',0,tuning.duration,.04,tuning.multiplier,{range:0,aerial:!p.grounded,startX:p.x,startY:p.y,distance:tuning.distance,previousX:p.x,boost:tuning.boost}));
      p.nextStrikeBoost=tuning.boost;p.nextStrikeTime=4;
    }else if(kind==='slash'){
      this.launch(p,attackShape(p,'slash',.12,.14,.12,tuning.multiplier,{range:tuning.range,slashHeight:tuning.height,aerial:!p.grounded}));
    }else{
      activateBlessing(p);
      this.launch(p,attackShape(p,'blessing',0,.38,0,0,{range:0}));
    }
    this.effect(tuning.name,p.x,p.y-160,p.type===QUEST?'#9eeeff':p.type===FANTASY?'#ff697a':'#ffe5a0');
    this.emit('sound',{action:kind==='blessing'?'parry':'heavy-attack',rateMultiplier:1.4});return true;
  }
  jump(){
    const p=this.player,groundJump=p.grounded||p.coyote>0;
    if(!groundJump&&p.jumpsUsed>=PLAYER_MOVEMENT.maxJumps)return false;
    if(!spend(p,PLAYER_MOVEMENT.jumpCost)){this.emit('feedback',{text:'Lompat memerlukan 6 stamina.'});return false;}
    p.jumpsUsed=groundJump?1:PLAYER_MOVEMENT.maxJumps;
    p.vy=PLAYER_MOVEMENT.jumpImpulse;p.grounded=false;p.coyote=0;p.animTime=0;
    this.emit('sound',{action:'jump'});
    if(!groundJump)this.effect('LOMPAT KEDUA',p.x,p.y+12,'#a8e8ed');
    return true;
  }
  playerInput(input,dt){const p=this.player;p.running=false;
    const locked=p.hurt>0||p.guardBreak>0||p.attack||p.potion||p.parryCooldown>0;
    if(!locked) {
      p.block=false;
      if(input.take('interact')&&(this.atAlcove||this.atExit||(Math.abs(p.x-this.map.npcX)<110&&this.prisonerReleased))){this.emit(this.atAlcove?'fantasy':this.atExit?'exit':'clue');return;}
      if(input.take('parry')){if(spend(p,4)){p.parryWindow=.14;p.parryCooldown=.40;p.parryUsed=false;p.animTime=0;this.emit('sound',{action:'parry'});}else this.emit('feedback',{text:'Ilmu parry memerlukan 4 stamina.'});}
      else if(input.down('block'))p.block=true;
      else if(input.take('hpPotion'))this.drink('hp');
      else if(input.take('staminaPotion'))this.drink('stamina');
      else if(input.take('skillBlink'))this.startSkill('blink');
      else if(input.take('skillSlash'))this.startSkill('slash');
      else if(input.take('skillBlessing'))this.startSkill('blessing');
      else if(input.take('heavy'))this.startPlayerAttack(true);
      else if(input.take('light'))this.startPlayerAttack(false);
      else if(input.pressed('jump',.12)&&(p.coyote>0||p.jumpsUsed<PLAYER_MOVEMENT.maxJumps)){input.take('jump',.12);this.jump();}
    } else {p.block=false; // Only retain a fresh attack during the final 100 ms recovery.
      if(p.attack){const remain=p.attack.windup+Math.max(...p.attack.offsets)+p.attack.active+p.attack.recovery-p.attack.t;if(remain>.10){input.edges.delete('light');input.edges.delete('heavy');}}
    }
    const airAttack=p.attack?.aerial&&!p.grounded;
    const immobile=['blink','blessing'].includes(p.attack?.kind)||p.hurt>0||p.guardBreak>0;
    const dir=Number(input.down('right'))-Number(input.down('left'));
    if(!immobile&&dir){if(!p.attack)p.facing=dir;let speed=walkSpeed(p.stats.speed);if(p.attack)speed*=airAttack?PLAYER_MOVEMENT.airAttackControl:.8;if(p.potion)speed*=.65;if(p.block)speed*=.4;else if(input.down('run')&&p.grounded&&p.stamina>=6*dt){spend(p,6*dt);speed*=1.45;p.running=true;}p.vx=dir*speed;}else p.vx=0;
  }
  drink(kind){const p=this.player,key=kind==='hp'?'hpPotions':'staminaPotions';if(!p[key]){this.emit('feedback',{text:'Botol sudah habis. Stok pulih di awal wilayah.'});return;}p[key]--;p.potion={kind,t:0};p.animTime=0;}
  patternFor(a){
    const l=this.run.level,min=TELEGRAPH[l],id=a.type,n=a.pattern;
    if(id==='boss-king'&&n%4===3)return attackShape(a,'projectile',.85,.14,.65,1.15,{range:640,knockUp:400,label:'TOMBAK MAHKOTA'});
    if(id==='boss-king')return n%4===2?attackShape(a,'area',1.1,.2,1.2,1.4,{blockable:false,parryable:false,costKind:'special',label:'HANTAMAN MAHKOTA'}):attackShape(a,'light',.8,.14,.85,1,{knockUp:500,label:'TEBASAN BAYANGAN'});
    if(id==='boss-king-phase2'){
      if(a.darkness&&n%7===6)return attackShape(a,'dark-storm',1.05,.25,.75,1.8,{blockable:false,parryable:false,costKind:'special',label:'GERHANA JATUH'});
      if(n%(a.darkness?7:6)===5)return attackShape(a,'projectile',.7,.14,.6,1.4,{range:700,knockUp:550,label:'TOMBAK MAHKOTA II'});
      const slot=n%(a.darkness?7:6);
      if(slot===1)return attackShape(a,'combo',.8,.14,1.1,.7,{offsets:[0,.45],costKind:'special',label:'RANTAI BAYANGAN'});
      if(slot===2)return attackShape(a,'heavy',1,.18,1.3,1.6,{range:235,costKind:'heavy',label:'TEBASAN PENGHAKIMAN'});
      if(slot===4)return attackShape(a,'area',1.2,.2,1.4,1.2,{blockable:false,parryable:false,zonesCount:3,costKind:'special',label:'RETAKAN TAKHTA'});
      return attackShape(a,'light',.65,.14,.9,1,{knockUp:650,label:'TEBASAN KEGELAPAN'});
    }
    if(a.boss&&n%2===1){let kind='charge',extra={};if(/crystal|marsh|abyss/.test(id))kind='area';else if(/thorn/.test(id))kind='pounce';else if(/inquisitor/.test(id)){kind='combo';extra.offsets=[0,.45];}else if(/warden|commander/.test(id))kind='heavy';
      return attackShape(a,kind,.9,.16,1,1.4,{...extra,blockable:!['area','pounce'].includes(kind),parryable:!['area','pounce'].includes(kind),costKind:'special',label:{area:'BAHAYA AREA · PINDAH',pounce:'TERKAMAN · PINDAH',combo:'DUA TEBASAN',charge:'TERJANGAN',heavy:'AYUNAN BERAT'}[kind]});}
    if(a.boss)return attackShape(a,'light',min,.14,.65,1,{label:'TEBASAN'});
    if(id==='mage'&&n%2===1)return attackShape(a,'area',Math.max(.9,min),.2,.9,1.4,{blockable:false,parryable:false,costKind:'special',label:'KUTUKAN · PINDAH'});
    if(id==='mage'||id==='archer')return attackShape(a,'projectile',min,.1,.8,1,{range:550,label:id==='archer'?'PANAH':'BOLA BAYANGAN'});
    if(id==='elite')return attackShape(a,'combo',min,.12,.8,1,{offsets:[0,.45],costKind:'special',label:'DUA TEBASAN'});
    if(id==='bat')return attackShape(a,'dive',Math.max(min,BAT_FLIGHT.windup),BAT_FLIGHT.active,BAT_FLIGHT.recovery,1,{label:'MENUKIK'});
    if(id==='slime')return attackShape(a,'charge',min,.16,.9,1,{label:'MENERJANG'});
    return attackShape(a,'light',min,.14,.8,1,{label:'TEBASAN'});
  }
  threatSlots(){const ids=new Set();for(const a of this.enemies)if(a.hp>0&&a.attack&&a.attack.t<a.attack.windup+Math.max(...a.attack.offsets)+a.attack.active)ids.add(a.id);for(const p of this.projectiles)if(!p.dead)ids.add(p.source.id);return ids.size;}
  enemyAI(a,dt){a.vx=0;a.running=false;
    if(a.hp<=0||a.group!==this.activeGroup){a.state=a.hp<=0?'DEAD':'PATROL';return;}
    if(a.hurt>0||a.guardBreak>0){a.block=false;return;}
    if(a.attack){a.block=false;return;}
    const dx=this.player.x-a.x,dist=Math.abs(dx);a.reaction-=dt;
    if(!a.seen){if(dist>650)return;a.seen=true;a.reaction=REACTION[this.run.level];a.state='ALERT';return;}
    if(a.reaction>0)return;
    if(enraged(a)&&!a.rageAnnounced){a.rageAnnounced=true;this.effect('AMUK',a.x,a.y-a.h-80,'#ffae82');}
    if(Math.sign(dx)!==a.facing&&a.block){a.guardTime-=dt;if(a.guardTime>0)return;}
    a.facing=Math.sign(dx)||a.facing;
    if(a.reposition>0){a.reposition-=dt;a.state='POSITION';if(dist<(a.boss?180:80))a.vx=-a.facing*55;return;}
    if(a.guardTime>0){a.guardTime-=dt;a.block=true;a.state='GUARD';if(a.guardTime<=0){a.block=false;a.guardCooldown=1.5;}return;}
    a.block=false;
    const ranged=a.type==='archer'||a.type==='mage';
    const punishRetreat=a.type.startsWith('boss-king')&&dist>330&&dist<700&&a.pattern%2===1;
    const range=punishRetreat?700:a.flying?BAT_FLIGHT.attackRange:ranged?420:a.boss?195:85;
    if(dist>(range+20)){a.state='CHASE';a.vx=a.facing*walkSpeed(a.stats.speed)*.85*(a.darkness?1.35:1)*(a.type==='slime'?.45:a.type==='bat'?.9:1);return;}
    if(ranged&&dist<250){a.state='POSITION';a.vx=-a.facing*walkSpeed(a.stats.speed)*.65;}
    if(!a.boss&&['shield-guard','elite','swordsman'].includes(a.type)&&a.guardCooldown<=0&&a.pattern%3===1){a.guardTime=a.type==='shield-guard'?2:1.2;a.guardCooldown=1.5;a.pattern++;a.block=true;return;}
    const maxSlots=this.run.level<=2?1:2;
    if(this.threatSlots()>=maxSlots||this.time<this.nextThreatAt||a.x<this.camera+45||a.x>this.camera+WIDTH-45)return;
    if(a.flying&&a.y>this.player.y-110)return; // Climb above the target before telegraphing a dive.
    const attack=tuneEnemyAttack(a,punishRetreat?attackShape(a,'projectile',.85,.14,.7,1.15,{range:700,knockUp:400,label:'TOMBAK PEMBURU'}):this.patternFor(a),this.run.level);
    const cost=attackCost(a.stats,attack.costKind||'light');
    if(!spend(a,cost)){a.state='RECOVERY';a.reposition=.5;return;}
    attack.targetX=this.player.x;
    if(attack.kind==='dive'){
      // Lock both coordinates before the cue: dodging must not be tracked mid-dive.
      attack.startX=a.x;attack.startY=a.y;
      attack.targetX=clamp(this.player.x,25,this.encounter.end-25);
      attack.targetY=clamp(this.player.y-24,140,FLOOR-24);
    }
    if(['area','pounce','dark-storm'].includes(attack.kind)){
      const g=this.encounter,center=clamp(this.player.x,130,g.end-130);
      attack.zones=[{x:center-105,w:210}];
      if(attack.zonesCount===3)attack.zones=[{x:center-410,w:190},{x:center-95,w:190},{x:center+220,w:190}].map(z=>({...z,x:clamp(z.x,20,g.end-z.w-20)}));
    }
    a.pattern++;a.state='WINDUP';this.launch(a,attack);
    // Projected contact times are separated, and simultaneous marked areas are
    // prohibited: at least one escape route remains available in mixed encounters.
    this.nextThreatAt=this.time+Math.max(.25,attack.windup+.25);
  }
  physics(a,dt){const oldY=a.y;a.x+=a.vx*dt;
    if(a.flying&&a.hp>0){
      const atk=a.attack;
      if(!atk||atk.t>=atk.windup+atk.active){
        const hoverY=clamp(Math.min(FLOOR-BAT_FLIGHT.altitude,this.player.y-150),150,FLOOR-BAT_FLIGHT.altitude)+Math.sin(this.time*2+a.group)*BAT_FLIGHT.bob;
        a.y+=clamp(hoverY-a.y,-BAT_FLIGHT.returnSpeed*dt,BAT_FLIGHT.returnSpeed*dt);
      }
      a.vy=(a.y-oldY)/dt;a.grounded=false;a.coyote=0;
    }else{
    if(a.attack?.kind==='blink'&&a.attack.t<a.attack.active){a.vy=0;}else{a.vy+=1800*dt;a.y+=a.vy*dt;}a.grounded=false;
    for(const platform of this.map.platforms){if(!a.player&&!platform.ground)continue;if(a.vy>=0&&oldY<=platform.y+.1&&a.y>=platform.y&&a.x+a.w/2>platform.x&&a.x-a.w/2<platform.x+platform.w){a.y=platform.y;a.vy=0;a.grounded=true;}}
    a.coyote=a.grounded?.1:Math.max(0,a.coyote-dt);
    if(a.player){
      if(a.grounded)a.jumpsUsed=0;
      else if(a.coyote<=0&&a.jumpsUsed===0)a.jumpsUsed=1; // Walking off a ledge leaves one air jump.
    }
    }
    a.x=clamp(a.x,25,this.map.width-25);
    if(this.encounter){const g=this.encounter;a.x=clamp(a.x,25,g.end-25);}else if(a.player){const next=this.map.groups.find(g=>!this.cleared.has(g.id));if(next)a.x=Math.min(a.x,next.end-25);}
  }
  updateAttack(a,dt){const atk=a.attack;if(!atk)return;atk.previous=atk.t;atk.t+=dt;
    if(atk.previous<atk.windup-.25&&atk.t>=atk.windup-.25&&atk.kind==='charge'){atk.targetX=this.player.x;atk.facing=Math.sign(atk.targetX-a.x)||a.facing;}
    if(atk.previous<atk.windup&&atk.t>=atk.windup){a.state='ACTIVE';if(!a.player&&!['charge','dive'].includes(atk.kind)){atk.facing=Math.sign(this.player.x-a.x)||a.facing;a.facing=atk.facing;}
      if(atk.kind==='projectile')this.projectiles.push({id:atk.id,source:a,attack:atk,x:a.x+atk.facing*35,y:a.y-65,oldX:a.x,velocity:atk.facing*550,life:2,dead:false});
    }
    if(atk.kind==='blink'&&atk.previous<atk.active){
      atk.previousX=a.x;const progress=clamp(atk.t/atk.active,0,1);
      a.x=clamp(atk.startX+atk.facing*atk.distance*progress,25,this.encounter?this.encounter.end-25:(this.map.groups.find(g=>!this.cleared.has(g.id))?.end??this.map.width)-25);
    }
    if(atk.kind==='charge'&&atk.t>=atk.windup&&atk.t<atk.windup+atk.active){a.x+=atk.facing*(a.boss?1050:650)*dt;}
    if(atk.kind==='dive'&&atk.t>=atk.windup&&atk.previous<atk.windup+atk.active){
      const progress=clamp((atk.t-atk.windup)/atk.active,0,1),oldY=a.y;
      a.x=atk.startX+(atk.targetX-atk.startX)*progress;
      a.y=atk.startY+(atk.targetY-atk.startY)*progress;a.vy=(a.y-oldY)/dt;
    }
    if(atk.kind==='pounce'&&atk.t>=atk.windup&&atk.t<atk.windup+atk.active)a.x=clamp(atk.targetX,25,this.encounter.end-25);
    const activeEnd=atk.windup+Math.max(...atk.offsets)+atk.active;
    if(atk.t>=activeEnd)a.state='RECOVERY';
    if(atk.t>=activeEnd+atk.recovery||atk.cancelled){a.attack=null;a.reposition=a.boss?(enraged(a)?.16:.3):(.25+this.random()*.25);}
  }
  hitContacts(a,targets){const attack=a.attack;if(!attack||attack.kind==='projectile')return [];
    if(attack.kind==='blessing')return [];
    const contacts=[];attack.offsets.forEach((offset,subhit)=>{const start=attack.windup+offset;if(attack.t<start||attack.previous>=start+attack.active)return;
      for(const target of targets){if(target.hp<=0)continue;let touch=false;
        if(attack.kind==='dark-storm')touch=attack.zones.some(z=>target.x+target.w/2>z.x&&target.x-target.w/2<z.x+z.w);
        else if(['area','pounce'].includes(attack.kind))touch=target.y>FLOOR-70&&attack.zones.some(z=>target.x+target.w/2>z.x&&target.x-target.w/2<z.x+z.w);
        else if(attack.kind==='blink')touch=target.x+target.w/2>=Math.min(attack.previousX,a.x)-a.w/2&&target.x-target.w/2<=Math.max(attack.previousX,a.x)+a.w/2&&target.y>a.y-a.h&&target.y-target.h<a.y;
        else if(attack.kind==='slash')touch=(target.x-a.x)*attack.facing>=-target.w/2&&(target.x-a.x)*attack.facing<=attack.range+target.w/2&&target.y>a.y-attack.slashHeight&&target.y-target.h<a.y+35;
        else if(attack.kind==='dive')touch=Math.abs(target.x-a.x)<(target.w+a.w)/2&&target.y>a.y-a.h&&target.y-target.h<a.y;
        else {
          const front=(target.x-a.x)*attack.facing,y=a.player?a.y-88:a.y-112,height=a.player?72:105;
          const frontal=front>=-target.w/2&&front<=a.w/2+attack.range+target.w/2&&target.y>y&&target.y-target.h<y+height;
          // The same attack instance covers a downward swing in the air. A target
          // overlapping both volumes is still added only once and uses normal damage.
          const downward=a.player&&attack.aerial&&!a.grounded&&target.y>=a.y&&
            Math.abs(target.x-a.x)<(attack.downwardWidth+target.w)/2&&
            target.y>a.y-16&&target.y-target.h<a.y+attack.downwardRange;
          touch=frontal||downward;
        }
        if(touch)contacts.push({source:a,target,attack,subhit,time:this.time});
      }
    });return contacts;
  }
  update(input,dt){if(this.finished)return;this.events=[];this.time+=dt;input.update(dt);
    const p=this.player;
    this.fx=this.fx.filter(f=>(f.life-=dt)>0);
    if(!this.clueDelivered&&this.run.level!==5&&p.x>=200&&!p.attack&&!this.encounter){this.clueDelivered=true;this.emit('clue');return;}
    if(!this.encounter){const index=this.map.groups.findIndex(g=>!this.cleared.has(g.id));if(index>=0&&p.x>=this.map.groups[index].start+35){this.activeGroup=index;this.emit('encounter',{name:this.map.groups[index].boss?'Arena penjaga':'Jalur terkunci'});}}
    for(const a of [p,...this.enemies,...(this.cage?[this.cage]:[])]){tickSkills(a,dt);tickVitals(a,dt);a.animTime+=dt;}
    this.playerInput(input,dt);if(this.events.some(e=>['fantasy','exit','clue'].includes(e.type)))return;
    for(const a of this.enemies)this.enemyAI(a,dt);
    for(const a of [p,...this.enemies])if(a.hp>0&&(a.player||a.group===this.activeGroup)){this.physics(a,dt);this.updateAttack(a,dt);if(a.potion){a.potion.t+=dt;if(a.potion.t>=.70){const kind=a.potion.kind,max=kind==='hp'?a.stats.hp:a.stats.stamina;a[kind]=clamp(a[kind]+Math.ceil(max*(kind==='hp'?.4:.6)),0,max);a.potion=null;this.effect(kind==='hp'?'+ HP':'+ STAMINA',a.x,a.y-120,'#a8e7b5');}}}
    const live=this.enemies.filter(a=>a.hp>0&&a.group===this.activeGroup);
    const contacts=[...this.hitContacts(p,[...live,...(this.cage?.hp>0?[this.cage]:[])]),...live.flatMap(a=>this.hitContacts(a,[p]))];
    for(const shot of this.projectiles){shot.oldX=shot.x;shot.x+=shot.velocity*dt;shot.life-=dt;if(shot.attack.cancelled||shot.life<=0){shot.dead=true;continue;}
      if(Math.max(shot.oldX,shot.x)>=p.x-p.w/2&&Math.min(shot.oldX,shot.x)<=p.x+p.w/2&&shot.y>=p.y-p.h&&shot.y<=p.y){contacts.push({source:shot.source,target:p,attack:shot.attack,subhit:0,time:this.time});shot.dead=true;}}
    const results=resolveContacts(contacts,this.time);
    for(const r of results){this.effect(r.type==='parry'?'PARRY · BALAS!':r.type==='block'?'BLOCK':r.type==='guard-break'?'GUARD BREAK':`−${r.damage}`,r.target.x,r.target.y-r.target.h-20,r.type==='parry'?'#9ae9ee':r.damage?'#ffbab0':'#e7cf93');if(r.target.player){if(r.type==='parry')this.metrics.parries++;if(r.damage)this.metrics.hits++;this.emit('sound',{action:r.damage?'hurt':r.type});}if(r.target.hp<=0)r.target.deathTime=this.time;}
    this.projectiles=this.projectiles.filter(s=>!s.dead&&!s.attack.cancelled);
    if(this.cage?.hp<=0&&!this.prisonerReleased&&p.hp>0&&p.y<=850){this.prisonerReleased=true;this.clueDelivered=true;this.emit('prisoner-free');}
    if(p.hp<=0||p.y>850){p.hp=0;this.finished=true;this.emit('defeat',{encounter:live.find(a=>a.boss)?.type||'road',cause:p.y>850?'fall':p.lastDamageSource});return;}
    const deadBoss=live.find(a=>a.boss&&a.hp<=0);
    if(deadBoss?.type.startsWith('boss-king')){this.finished=true;this.emit(deadBoss.type==='boss-king'?'phase1-win':'final-win',{boss:deadBoss});return;}
    if(this.encounter&&this.enemies.filter(e=>e.group===this.activeGroup).every(e=>e.hp<=0)){this.cleared.add(this.encounter.id);this.effect('JALAN TERBUKA',p.x,p.y-155,'#e8cf99');this.activeGroup=-1;this.projectiles=[];this.emit('clear');}
    this.camera=clamp(p.x-430,0,this.map.width-WIDTH);
  }
}
