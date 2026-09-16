import {FANTASY,FLOOR,clamp} from './config.js';
import {wings} from './skill-effects.js';

// A fixed timeline; no combat, damage, or save mutations happen in the renderer.
export function drawRescue(renderer,time,reduced){
  renderer.prepareFrame();
  const c=renderer.ctx;c.fillStyle='#080d19';c.fillRect(0,0,1280,720);
  const glow=c.createRadialGradient(650,380,20,650,380,520);glow.addColorStop(0,'#473645');glow.addColorStop(1,'#080d19');c.fillStyle=glow;c.fillRect(0,0,1280,720);
  c.fillStyle='#202330';c.fillRect(0,FLOOR,1280,130);c.fillStyle='#d6b57966';c.fillRect(0,FLOOR,1280,2);
  for(let i=0;i<5;i++){c.fillStyle='#121623';c.fillRect(120+i*255,40,48,550);}
  renderer.sprite(FANTASY,560,FLOOR,1,'defeat',3);
  const run=clamp((time-.6)/2.2,0,1),princessX=1050-run*410;
  const striking=time>=3.3&&time<4.0;
  renderer.sprite('boss-king-phase2',850,FLOOR,-1,'idle',time,striking?9:time>=2.8&&time<3.3?8:null);
  renderer.sprite('princess',princessX,FLOOR,-1,time>=3.8?'hurt':run<1?'walk':'idle',time>=3.8?time-3.8:time);
  if(striking){c.strokeStyle='#bc6681';c.lineWidth=6;c.beginPath();c.moveTo(800,300);c.lineTo(620,510);c.stroke();}
  if(time>=3.8){
    c.fillStyle='#080d19';c.globalAlpha=clamp((time-3.8)*2,0,.85);c.fillRect(595,390,90,200);c.globalAlpha=1;
    const rise=clamp((time-4.2)/3,0,1);wings(c,640,460-rise*100,45+rise*45,time,{alpha:rise,flap:!reduced});
    for(let i=0;i<18;i++){c.globalAlpha=rise*.7;c.fillStyle='#ffe1a1';c.fillRect(610+(i*17)%65,500-rise*(60+i*5),3,3);}c.globalAlpha=1;
  }
  c.fillStyle='#02050b';c.fillRect(0,0,1280,78);c.fillRect(0,642,1280,78);
  const caption=time<.8?'':time<2.9?'Ia berlari menghampirimu.':time<3.8?'“Jangan.”':time<5.8?'': 'Tangannya masih menggenggam tanganmu.';
  renderer.text(caption,640,686,{size:21,color:'#f4e9d1',font:'Georgia'});
}
