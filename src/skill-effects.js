import {QUEST,FANTASY,LEGACY,clamp} from './config.js';
import {dragonHead,dragonTrail} from './dragon-effect.js';
const TAU=Math.PI*2;
const ease=t=>1-(1-clamp(t,0,1))**3;
const seed=i=>((i*73.137)%1);

function glow(c,x,y,rx,ry,color,alpha){
  c.save();c.translate(x,y);c.scale(rx,ry);c.globalAlpha*=alpha;
  const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(.32,color);g.addColorStop(1,color+'00');
  c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,TAU);c.fill();c.restore();
}
function feather(c,x,y,length,width,angle){
  c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(0,0);
  c.bezierCurveTo(length*.27,-width,length*.76,-width*.48,length,0);
  c.bezierCurveTo(length*.71,width*.64,length*.3,width*.85,0,0);c.fill();c.stroke();
  c.globalAlpha*=.35;c.beginPath();c.moveTo(5,0);c.quadraticCurveTo(length*.5,-width*.08,length*.9,0);c.stroke();c.restore();
}

// Curved primary feathers, layered coverts, or a scalloped dragon membrane.
// All geometry is drawn at the canvas backing resolution, not upscaled from a small bitmap.
export function wings(c,x,y,size,time,{dragon=false,alpha=1,flap=true,reduced=false}={}){
  c.save();c.translate(x,y);c.globalAlpha*=alpha;
  const beat=flap?Math.sin(time*4.8):0;
  for(const side of [-1,1]){
    c.save();c.scale(side,1);c.rotate(-.07+beat*.075);c.scale(1,1+beat*.06);
    const fill=c.createLinearGradient(0,-size,size*.65,size*.38);
    fill.addColorStop(0,dragon?'#100c22':'#ffffff');fill.addColorStop(.48,dragon?'#411026':'#fffdf3');
    fill.addColorStop(.8,dragon?'#8d193e':'#f7e7b4');fill.addColorStop(1,dragon?'#e54865':'#c59039');
    c.fillStyle=fill;c.strokeStyle=dragon?'#e65c78':'#e9c773';c.lineWidth=1.2;
    if(dragon){
      const tips=[[.28,-.83],[.69,-1.04],[1.13,-.72],[.99,-.20],[.73,.27]];
      c.beginPath();c.moveTo(-8,16);c.bezierCurveTo(size*.07,-size*.42,size*.36,-size*.87,size*.69,-size*1.04);
      c.quadraticCurveTo(size*.87,-size*.78,size*1.13,-size*.72);
      for(let i=3;i<tips.length;i++){const p=tips[i-1],n=tips[i];c.quadraticCurveTo(size*(p[0]+n[0])*.32,size*(p[1]+n[1])*.28,n[0]*size,n[1]*size);}
      c.quadraticCurveTo(size*.26,-size*.08,-8,16);c.fill();c.stroke();
      for(const [tx,ty]of tips){c.beginPath();c.moveTo(0,12);c.quadraticCurveTo(size*.32,-size*.28,tx*size,ty*size);c.stroke();}
      c.strokeStyle='#ffc0c5';c.lineWidth=2.1;c.beginPath();c.moveTo(0,9);c.quadraticCurveTo(size*.3,-size*.73,size*.69,-size*1.04);c.stroke();
      c.fillStyle='#f6c2b4';c.beginPath();c.moveTo(size*.67,-size);c.lineTo(size*.8,-size*1.17);c.lineTo(size*.73,-size*.98);c.fill();
    }else{
      const count=reduced?10:16;
      for(let i=count-1;i>=0;i--){const u=i/(count-1);feather(c,size*(.14+u*.19),-size*(.16+u*.13),size*(.98-u*.44),size*.046,-.96+u*1.38);}
      const coverts=reduced?4:7;
      for(let i=coverts-1;i>=0;i--){const u=i/(coverts-1);feather(c,0,9,size*(.56-u*.13),size*.056,-1.05+u*1.65);}
      c.strokeStyle='#fffef4';c.lineWidth=3;c.beginPath();c.moveTo(-2,12);c.bezierCurveTo(size*.12,-size*.39,size*.4,-size*.61,size*.69,-size*.71);c.stroke();
    }
    c.restore();
  }
  c.restore();
}
function sparks(c,a,t,color,count,distance,{gold=false}={}){
  const facing=a.attack?.facing||a.facing;
  c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.4;
  for(let i=0;i<count;i++){
    const phase=(t*.8+i*.137)%1,spread=(seed(i+3)-.5)*130;
    const x=a.x-facing*(phase*distance),y=a.y-65+spread*(.4+phase);
    c.globalAlpha=(1-phase)*.65;c.beginPath();
    if(gold){c.moveTo(x-3,y);c.lineTo(x+3,y);c.moveTo(x,y-5);c.lineTo(x,y+5);}
    else{c.moveTo(x,y);c.lineTo(x+facing*(7+phase*15),y-spread*.05);}c.stroke();
  }c.restore();
}
function blink(c,a,k,time,reduced,legacy,dragon,layer){
  const local=k.t/(k.active||.24),alpha=clamp((1.15-local)*5,0,1),color=legacy?'#ffe8a0':dragon?'#ed2638':'#75eaff';
  c.save();c.globalAlpha*=alpha;
  if(layer==='back'){
    const distance=Math.min(k.distance,Math.abs(a.x-k.startX)+75);
    if(dragon)dragonTrail(c,a.x+k.facing*72,a.y-95,k.facing,Math.abs(a.x-k.startX),local,reduced);
    else{
    c.save();c.translate(a.x,a.y-60);c.scale(k.facing,1);
    const trail=c.createLinearGradient(-distance,0,30,0);trail.addColorStop(0,color+'00');trail.addColorStop(.7,color+'55');trail.addColorStop(1,dragon?'#e8394699':'#fff9eaaa');c.fillStyle=trail;
    for(let i=0;i<(reduced?2:4);i++){const y=(i-1.5)*20;c.beginPath();c.moveTo(-distance,y*.2);c.bezierCurveTo(-distance*.6,y-18,-45,y-26,26,y);c.quadraticCurveTo(-65,y+20,-distance,y*.2);c.fill();}
    c.restore();}
    glow(c,a.x,a.y-60,legacy?130:90,85,color,.18);
    if(legacy)wings(c,a.x,a.y-74,172,time,{alpha:.9,flap:!reduced,reduced});
    else if(dragon)dragonHead(c,a.x+k.facing*72,a.y-95,k.facing,1.12,local,reduced);
    else{c.strokeStyle='#abf3ff';c.lineWidth=2;c.beginPath();c.ellipse(a.x-k.facing*16,a.y-55,35,67,-k.facing*.15,0,TAU);c.stroke();}
    if(!reduced&&!dragon)sparks(c,a,k.t,color,legacy?24:16,Math.max(100,distance),{gold:legacy});
  }else if(!dragon){
    c.save();c.translate(a.x+k.facing*30,a.y-60);c.scale(k.facing,1);c.strokeStyle='#fffbee';c.lineWidth=2;c.globalAlpha*=.8;
    c.beginPath();c.ellipse(0,0,28,61,0,-1.15,1.15);c.stroke();c.restore();
  }c.restore();
}
function slash(c,a,k,time,reduced,legacy,layer){
  const charge=k.t<k.windup,age=Math.max(0,k.t-k.windup),fade=clamp(1-Math.max(0,age-k.active)/Math.max(.01,k.recovery),0,1);
  const open=charge?ease(k.t/k.windup):1,reach=charge?110:k.range,height=k.slashHeight;
  c.save();c.translate(a.x,a.y-65);c.scale(k.facing,1);c.globalAlpha*=(charge?.3:.85)*fade;
  if(layer==='back'){
    wings(c,reach*.32,-8,legacy?175:125,time,{dragon:!legacy,alpha:.8*open,flap:false,reduced});
    if(!charge)glow(c,reach*.48,-18,reach*.48,height*.45,legacy?'#f9de93':'#bf204f',.13);
  }else{
    const g=c.createLinearGradient(0,-height*.4,reach,height*.4);g.addColorStop(0,legacy?'#d2a74b00':'#60123500');g.addColorStop(.55,legacy?'#d8b363':'#921e43');g.addColorStop(.88,legacy?'#fff3c1':'#ff6b8a');g.addColorStop(1,'#ffffff');
    c.fillStyle=g;c.beginPath();c.moveTo(reach*.1,-height*.4);c.bezierCurveTo(reach*.64,-height*.68,reach,-height*.38,reach,height*.03);c.bezierCurveTo(reach*.91,height*.48,reach*.57,height*.67,reach*.15,height*.51);c.bezierCurveTo(reach*.72,height*.42,reach*.86,height*.16,reach*.88,-height*.02);c.quadraticCurveTo(reach*.86,-height*.34,reach*.1,-height*.4);c.fill();
    c.strokeStyle=legacy?'#fffbea':'#ffe1e6';c.lineWidth=legacy?3:2;c.beginPath();c.moveTo(reach*.1,-height*.4);c.bezierCurveTo(reach*.64,-height*.68,reach,-height*.38,reach,height*.03);c.bezierCurveTo(reach*.91,height*.48,reach*.57,height*.67,reach*.15,height*.51);c.stroke();
    if(!charge&&!reduced){c.globalAlpha*=.5;c.lineWidth=1;for(let i=0;i<7;i++){const u=(i/7+age*.6)%1;c.beginPath();c.moveTo(reach*(.1+u*.7),-height*.3+i*height*.1);c.lineTo(reach*(.25+u*.7),-height*.32+i*height*.1);c.stroke();}}
  }c.restore();
}
function blessing(c,a,reduced,layer){
  const age=5-a.blessingTime,opening=ease(age/.42),fade=clamp(a.blessingTime/.5,0,1),time=reduced?0:age;
  c.save();c.globalAlpha*=opening*fade;
  if(layer==='back'){
    glow(c,a.x,a.y-160,180,245,'#ebc875',.13);
    // A tapered column replaces the old opaque rectangular beam.
    const beam=c.createLinearGradient(0,a.y-385,0,a.y);beam.addColorStop(0,'#fff8dc00');beam.addColorStop(.5,'#fff1bd18');beam.addColorStop(1,'#e7b34f33');c.fillStyle=beam;
    c.beginPath();c.moveTo(a.x-24,a.y-385);c.lineTo(a.x+24,a.y-385);c.lineTo(a.x+104,a.y);c.lineTo(a.x-104,a.y);c.closePath();c.fill();
    wings(c,a.x,a.y-82,195*opening,time,{flap:!reduced,reduced});
    wings(c,a.x,a.y-262,90,time+.45,{alpha:.72,flap:!reduced,reduced});
    if(!reduced){c.fillStyle='#fff0bc';for(let i=0;i<18;i++){const phase=(age*.23+i*.137)%1;const x=a.x+(seed(i+9)-.5)*235,y=a.y-phase*330;c.globalAlpha=opening*fade*Math.sin(phase*Math.PI)*.65;c.beginPath();c.ellipse(x,y,1.6,3.6,-.4,0,TAU);c.fill();}}
  }else{
    c.strokeStyle='#f6d990';c.lineWidth=1.4;c.beginPath();c.ellipse(a.x,a.y-304,42,10,0,0,TAU);c.stroke();
    c.save();c.translate(a.x,a.y-2);c.scale(1,.20);c.rotate(time*.17);c.strokeStyle='#f5ce72';c.lineWidth=3;
    for(const radius of [102,118]){c.beginPath();c.arc(0,0,radius,0,TAU);c.stroke();}
    for(let i=0;i<12;i++){c.save();c.rotate(i*TAU/12);c.beginPath();c.moveTo(105,-4);c.lineTo(113,0);c.lineTo(105,4);c.stroke();c.restore();}c.restore();
  }c.restore();
}
export function skillEffects(c,a,time,reduced,layer='all'){
  if(layer==='all'){skillEffects(c,a,time,reduced,'back');skillEffects(c,a,time,reduced,'front');return;}
  const k=a.attack,legacy=a.type===LEGACY,dragon=a.type===FANTASY;
  c.save();c.lineCap='round';c.lineJoin='round';
  if(a.blessingTime>0)blessing(c,a,reduced,layer);
  if(k?.kind==='blink')blink(c,a,k,time,reduced,legacy,dragon,layer);
  if(k?.kind==='slash')slash(c,a,k,time,reduced,legacy,layer);
  if(k?.empowered&&['light','heavy'].includes(k.kind)&&layer==='front'&&k.t>=k.windup){
    const progress=clamp((k.t-k.windup)/(k.active+k.recovery),0,1),color=legacy?'#ffe7a3':dragon?'#ff476e':'#7eeaff';
    c.save();c.translate(a.x,a.y-62);c.scale(k.facing,1);c.globalAlpha*=(1-progress)*.8;
    c.strokeStyle=color;c.lineWidth=k.kind==='heavy'?9:5;c.beginPath();c.ellipse(12,0,k.range,78,0,-1.25,1.25);c.stroke();
    c.strokeStyle='#fff9df';c.lineWidth=2;c.stroke();c.restore();
  }
  if(a.nextStrikeTime>0&&layer==='front'){
    const color=a.type===QUEST?'#9ceeff':dragon?'#ff7797':'#ffe6a0';c.strokeStyle=color;c.lineWidth=2;c.globalAlpha*=clamp(a.nextStrikeTime/.35,0,1);
    c.beginPath();c.ellipse(a.x+a.facing*29,a.y-57,24,49,-a.facing*.2,-1.1,1.1);c.stroke();
  }c.restore();
}
