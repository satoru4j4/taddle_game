import { LEVELS,STATS,enemyStats,FLOOR,BAT_FLIGHT } from './config.js';
export function levelLayout(level,phase=1) {
  const config=LEVELS[level-1],groupSize=level<=2?2:3,types=[];
  // Round-robin distribution keeps the documented roster and creates mixed encounters.
  const pool={...config.pool};while(Object.values(pool).some(n=>n>0))for(const type of Object.keys(pool))if(pool[type]>0){types.push(type);pool[type]--;}
  const groups=[],spawns=[];let cursor=490;
  for(let i=0;i<types.length;i+=groupSize){const index=groups.length,start=cursor,end=start+850;
    const group={id:`group-${index}`,start,end,boss:false,enemyIds:[]};
    types.slice(i,i+groupSize).forEach((type,j)=>{const id=`l${level}-g${index}-${j}`;group.enemyIds.push(id);spawns.push({id,type,stats:enemyStats(type,level),x:start+320+j*155,y:type==='bat'?FLOOR-BAT_FLIGHT.altitude:FLOOR,group:index,boss:false});});groups.push(group);cursor=end+150;
    if(level===4&&index===1)cursor+=420;
  }
  const alcove=level===4?groups[1].end+210:null;
  const roadEnd=cursor;
  config.bosses.forEach((original,index)=>{const type=original==='boss-king'&&phase===2?'boss-king-phase2':original;const start=cursor,end=start+(original==='boss-king'?1750:1280),g=groups.length,id=`l${level}-boss-${index}`;groups.push({id:`boss-${index}`,start,end,boss:true,enemyIds:[id]});spawns.push({id,type,stats:STATS[type],x:start+(original==='boss-king'?1000:830),y:FLOOR,group:g,boss:true});cursor=end+180;});
  const width=cursor+260,platforms=[{x:0,y:FLOOR,w:width,h:130,ground:true}];
  // All progression uses continuous ground. Raised branches reward observation,
  // without requiring a form, double jump, or an untested mandatory gap.
  for(let i=0;i<Math.ceil(types.length/groupSize);i++){const g=groups[i];platforms.push({x:g.start+180,y:FLOOR-132,w:180,h:24},{x:g.start+540,y:FLOOR-200,w:160,h:24});}
  if(alcove)platforms.push({x:alcove-90,y:FLOOR-115,w:200,h:26});
  return {level,config,width,groups,spawns,platforms,alcove,roadEnd,exit:width-130,npcX:level===5?groups[1].end+70:270,npcType:level===4?'blacksmith':level===5?'prisoner':null};
}
export function seededRandom(seed) {let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
