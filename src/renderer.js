import { WIDTH,HEIGHT,FLOOR,LEVELS,clamp,FORM_NAMES } from './config.js';
import {skillEffects} from './skill-effects.js';
import {crownGuard} from './challenge.js';
import {renderResolution} from './render-resolution.js';
export class Renderer {
  constructor(canvas,assets){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.assets=assets;this.needsResize=true;
    if(typeof ResizeObserver!=='undefined'){this.resizeObserver=new ResizeObserver(()=>{this.needsResize=true;});this.resizeObserver.observe(canvas);}
    this.prepareFrame();
  }
  prepareFrame(){
    const ratio=globalThis.devicePixelRatio||1;
    if(this.needsResize||ratio!==this.lastRatio){
      const size=renderResolution(this.canvas.getBoundingClientRect().width,ratio);
      if(this.canvas.width!==size.width)this.canvas.width=size.width;
      if(this.canvas.height!==size.height)this.canvas.height=size.height;
      this.lastRatio=ratio;this.needsResize=false;
    }
    this.ctx.setTransform(this.canvas.width/WIDTH,0,0,this.canvas.height/HEIGHT,0,0);
    this.ctx.imageSmoothingEnabled=false;
  }
  sprite(id,x,y,facing=1,animation='idle',time=0,frameOverride=null,alpha=1){const c=this.ctx,m=this.assets.catalog[id],img=m&&this.assets.image(m.atlas);if(!img)return;const a=m.animations[animation]||m.animations.idle;let frame=frameOverride;
    if(frame===null){const durations=a.durations||a.sequence.map(()=>1/(a.fps||5)),total=durations.reduce((s,n)=>s+n,0);let t=a.loop?time%total:Math.min(time,total-.001);let i=0;while(i<durations.length-1&&t>=durations[i]){t-=durations[i];i++;}frame=a.sequence[i];}
    const w=m.frameWidth,h=m.frameHeight,anchor=m.anchor;c.save();c.globalAlpha=alpha;c.translate(Math.round(x),Math.round(y));c.scale(facing,1);c.drawImage(img,(frame%m.columns)*w,Math.floor(frame/m.columns)*h,w,h,-w*anchor[0],-h*anchor[1],w,h);c.restore();
  }
  text(text,x,y,{color='#eee8d4',size=14,align='center',font='Segoe UI'}={}){const c=this.ctx;c.font=`600 ${size}px ${font}`;c.textAlign=align;c.fillStyle='#060d14';c.fillText(text,x+1,y+2);c.fillStyle=color;c.fillText(text,x,y);}
  backdrop(map,camera,time,reduced){const c=this.ctx;c.fillStyle='#101d27';c.fillRect(0,0,WIDTH,HEIGHT);
    for(let i=0;i<3;i++){const img=this.assets.image(`assets/backgrounds/${map.config.slug}/layer-${i}.png`);if(!img)continue;const w=img.width*2,h=img.height*2,offset=-(camera*[.08,.18,.35][i])%w;c.globalAlpha=i===0?1:.70;for(let x=offset-w;x<WIDTH;x+=w)c.drawImage(img,Math.round(x),FLOOR-h,w,h);}c.globalAlpha=1;
    const mist=c.createLinearGradient(0,100,0,FLOOR);mist.addColorStop(0,'#09101b22');mist.addColorStop(.75,'#09131b66');mist.addColorStop(1,'#08141bc9');c.fillStyle=mist;c.fillRect(0,0,WIDTH,FLOOR);
    if(!reduced){for(let i=0;i<28;i++){const x=((i*157.31-time*(8+i%3)-camera*.07)%WIDTH+WIDTH)%WIDTH,y=130+(i*73.7+Math.sin(time*.45+i)*20)%430;c.fillStyle=i%3===0?'#e6c78699':'#a2dcdb50';c.fillRect(x,y,2,2);}}
  }
  draw(world,settings,interpolation=0){this.prepareFrame();const c=this.ctx,map=world.map,cam=world.camera,t=world.time;this.backdrop(map,cam,t,settings.reducedMotion);
    c.save();c.translate(-Math.round(cam),0);
    for(const p of map.platforms){if(p.x+p.w<cam||p.x>cam+WIDTH)continue;c.fillStyle=p.ground?'#152328':'#293638';c.fillRect(p.x,p.y,p.w,p.h);c.fillStyle=map.config.color;c.globalAlpha=.50;c.fillRect(p.x,p.y,p.w,3);c.globalAlpha=1;if(p.ground){c.fillStyle='#233436';for(let x=Math.floor(cam/80)*80;x<cam+WIDTH+80;x+=80){c.fillRect(x+2,p.y+16,76,1);c.fillRect(x,p.y+4,1,26);c.fillRect(x+40,p.y+32,1,28);}const gradient=c.createLinearGradient(0,FLOOR,0,720);gradient.addColorStop(0,'#07101400');gradient.addColorStop(1,'#071014');c.fillStyle=gradient;c.fillRect(cam,FLOOR,WIDTH,130);}}
    for(const g of map.groups){if(g.end<cam||g.start>cam+WIDTH)continue;const locked=!world.cleared.has(g.id);if(locked){const x=g.end;c.fillStyle='#dcbe8055';c.fillRect(x-4,FLOOR-195,8,195);for(let y=FLOOR-185;y<FLOOR;y+=26){c.fillStyle='#e9d6a67f';c.fillRect(x-13,y,26,2);}if(g===world.encounter){this.text('JALUR TERKUNCI',x,FLOOR-213,{size:11});}}
      if(g.boss){c.strokeStyle='#bda1753b';c.lineWidth=3;c.strokeRect(g.start+18,FLOOR-340,g.end-g.start-36,340);}}
    if(map.npcType){this.sprite(map.npcType,map.npcX,FLOOR,1,'idle',t);this.text(map.npcType==='blacksmith'?'PANDAI BESI':world.prisonerReleased?'TAWANAN BEBAS':'HANCURKAN JERUJI',map.npcX,FLOOR-172,{size:11,color:'#cfbd92'});}else{this.text('◇',map.npcX,FLOOR-50,{size:32,color:'#cfbd92'});}
    if(world.cage?.hp>0){const cage=world.cage;c.strokeStyle='#b9a58a';c.lineWidth=5;c.strokeRect(cage.x-65,FLOOR-150,130,150);for(let x=cage.x-45;x<cage.x+60;x+=22){c.beginPath();c.moveTo(x,FLOOR-150);c.lineTo(x,FLOOR);c.stroke();}c.fillStyle='#edc182';c.fillRect(cage.x-60,FLOOR-161,120*cage.hp/cage.stats.hp,5);}
    if(map.alcove){const x=map.alcove,y=FLOOR-115;const available=world.run.fantasyStatus==='unseen';c.fillStyle='#09121c';c.fillRect(x-54,y-99,108,99);c.strokeStyle=available?'#cfacdd':'#675b6d';c.strokeRect(x-54,y-99,108,99);for(let i=0;i<4;i++){c.fillStyle=available?'#785b4c':'#413937';c.fillRect(x-58,y-92+i*23,116,14);}this.text('◇',x,y-33,{size:36,color:'#cbb087'});if(Math.abs(world.player.x-x)<250&&available){c.shadowColor='#d7b4ee';c.shadowBlur=settings.reducedMotion?0:20;c.strokeStyle='#dfb7ed';c.strokeRect(x-58,y-98,116,98);c.shadowBlur=0;this.text('LAMBANG NAGA',x,y-113,{size:12});}}
    if(world.run.level===7){const last=map.groups.at(-1);if(world.run.angelState==='in-vessel'){c.fillStyle='#c2caee18';c.fillRect(last.start+1450,FLOOR-265,160,265);this.sprite('princess',last.start+1530,FLOOR-130,-1,'idle',t);}}
    for(const a of world.enemies){if(a.x<cam-420||a.x>cam+WIDTH+420)continue;if(a.hp<=0&&t-(a.deathTime??-10)>1.6)continue;
      this.actor(a,t,settings);if(a.hp>0&&a.group===world.activeGroup&&!a.boss){const y=a.y-a.h-33;c.fillStyle='#071118';c.fillRect(a.x-38,y,76,5);c.fillStyle='#d28c87';c.fillRect(a.x-38,y,76*a.hp/a.stats.hp,5);}
    }
    for(const a of world.enemies){const attack=a.attack;if(!attack||a.hp<=0)continue;const active=attack.t>=attack.windup&&attack.t<attack.windup+Math.max(...attack.offsets)+attack.active;if(attack.t>attack.windup+Math.max(...attack.offsets)+attack.active)continue;
      if(attack.zones){for(const z of attack.zones){c.fillStyle=active?'#f58c7499':'#ed9a4933';c.fillRect(z.x,FLOOR-12,z.w,12);c.strokeStyle=active?'#fff1c0':'#f5b15b';c.lineWidth=2;c.strokeRect(z.x,FLOOR-14,z.w,14);for(let x=z.x+8;x<z.x+z.w-8;x+=22){c.beginPath();c.moveTo(x,FLOOR-4);c.lineTo(x+9,FLOOR-12);c.stroke();}this.text('△',z.x+z.w/2,FLOOR-30,{color:'#ffcf8e',size:28});if(active){c.fillStyle=attack.kind==='dark-storm'?'#bc4daa88':'#ebac7355';c.fillRect(z.x,attack.kind==='dark-storm'?80:FLOOR-110,z.w,attack.kind==='dark-storm'?FLOOR-80:100);}}}
      else if(attack.t<attack.windup){const progress=clamp(attack.t/attack.windup,0,1);c.strokeStyle=progress>.78?'#fff3b8':'#e6b064';c.lineWidth=3;c.beginPath();c.arc(a.x,a.y-a.h-(a.flying?90:40),13,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();this.text('!',a.x,a.y-a.h-(a.flying?84:34),{size:17,color:'#ffdfa4'});}
      if(attack.kind==='dive'){
        c.save();c.strokeStyle=active?'#fff1c0':'#e6b064';c.lineWidth=2;c.setLineDash([7,7]);
        c.beginPath();c.moveTo(a.x,a.y-a.h/2);c.lineTo(attack.targetX,attack.targetY-a.h/2);c.stroke();c.setLineDash([]);
        c.beginPath();c.ellipse(attack.targetX,attack.targetY,34,9,0,0,Math.PI*2);c.stroke();c.restore();
        if(!active)this.text('MENUKIK',attack.targetX+48,attack.targetY+12,{size:12,color:'#ffdfa4',align:'left'});
      }
      if(a.boss&&attack.t<attack.windup)this.text(attack.label,a.x,a.y-a.h-72,{size:13,color:attack.blockable?'#edcb98':'#ffb391'});
    }
    this.actor(world.player,t,settings);
    if(world.boss?.darkness)this.text('BLEESING OF DRAKNESS',world.boss.x,world.boss.y-world.boss.h-96,{size:13,color:'#e2a1ff'});
    for(const shot of world.projectiles){c.fillStyle=shot.source.type==='archer'?'#e3c485':'#c79ce9';c.fillRect(shot.x-17,shot.y-3,34,6);c.beginPath();c.moveTo(shot.x+shot.velocity/Math.abs(shot.velocity)*20,shot.y);c.lineTo(shot.x,shot.y-7);c.lineTo(shot.x,shot.y+7);c.fill();}
    if(world.cleared.size===map.groups.length){const x=map.exit;c.strokeStyle='#e6ce91';c.lineWidth=3;c.strokeRect(x-40,FLOOR-145,80,145);c.fillStyle='#ead19c1e';c.fillRect(x-40,FLOOR-145,80,145);this.text('WILAYAH BERIKUTNYA →',x,FLOOR-165,{size:13,color:'#efdbaf'});}
    for(const f of world.fx){c.globalAlpha=Math.min(1,f.life*2);this.text(f.text,f.x,f.y-(1.1-f.life)*35,{color:f.color,size:17});}c.globalAlpha=1;c.restore();
    const vignette=c.createLinearGradient(0,0,0,HEIGHT);vignette.addColorStop(0,'#040e1799');vignette.addColorStop(.25,'#040e1700');vignette.addColorStop(.8,'#040e1700');vignette.addColorStop(1,'#040e1777');c.fillStyle=vignette;c.fillRect(0,0,WIDTH,HEIGHT);
  }
  actor(a,time,settings){let animation=a.vx?(a.running?'run':'walk'):'idle',frame=null;
    if(a.hp<=0)animation=a.player?'defeat':'death';else if(a.guardBreak>0||a.hurt>0)animation='hurt';else if(a.potion)animation='block';else if(a.parryCooldown>0)animation='parry';else if(a.block)animation='block';else if(a.attack){const k=a.attack;animation=a.player?(k.kind==='heavy'?'heavy-attack':'attack'):'attack';const active=k.t>=k.windup&&k.t<k.windup+Math.max(...k.offsets)+k.active;frame=a.player?(k.t<k.windup?12:active?13:14):(k.t<k.windup?(k.costKind==='special'?15:8):active?9:10);}else if(!a.grounded)animation=a.vy<0?'jump':'fall';
    if(a.flying&&a.hp>0&&!a.attack&&a.hurt<=0&&a.guardBreak<=0)animation='fly';
    if(a.attack?.kind==='blessing'){animation='block';frame=11;}
    if(a.player)skillEffects(this.ctx,a,time,settings.reducedMotion,'back');
    this.sprite(a.type,a.x,a.y,a.attack?.facing||a.facing,animation,a.hp<=0?time-(a.deathTime??time):a.animTime,frame,a.hp<=0?clamp(1-(time-(a.deathTime??time))/1.6,0,1):1);
    const c=this.ctx;
    if(crownGuard(a)){
      c.save();c.strokeStyle='#d9a9f0';c.lineWidth=5;c.beginPath();const direction=a.facing===1?0:Math.PI;
      c.ellipse(a.x,a.y-a.h/2,80,a.h/2+12,0,direction-1.15,direction+1.15);c.stroke();c.restore();
      this.text('MAHKOTA · CELAH DI BELAKANG',a.x,a.y-a.h-112,{color:'#e8c1ff',size:12});
    }
    if(a.player)skillEffects(c,a,time,settings.reducedMotion,'front');
    if(a.attack?.kind==='blessing'){
      c.save();c.translate(a.x,a.y);const blade=c.createLinearGradient(-6,0,6,0);blade.addColorStop(0,'#cbb681');blade.addColorStop(.48,'#ffffff');blade.addColorStop(1,'#ecd3a1');
      c.fillStyle=blade;c.beginPath();c.moveTo(-6,-83);c.lineTo(6,-83);c.lineTo(3,-4);c.lineTo(0,4);c.lineTo(-3,-4);c.closePath();c.fill();
      c.fillStyle='#e5bd68';c.beginPath();c.moveTo(-25,-90);c.quadraticCurveTo(0,-77,25,-90);c.lineTo(21,-80);c.quadraticCurveTo(0,-73,-21,-80);c.closePath();c.fill();
      c.fillStyle='#8c6a32';c.fillRect(-3,-108,6,24);c.fillStyle='#fff6cd';c.beginPath();c.moveTo(0,-115);c.lineTo(5,-109);c.lineTo(0,-103);c.lineTo(-5,-109);c.closePath();c.fill();c.restore();
    }
    if(a.player&&a.attack?.aerial&&!a.grounded&&['light','heavy'].includes(a.attack.kind)){
      const k=a.attack,active=k.t>=k.windup&&k.t<k.windup+k.active;
      if(active){
        // A downward slash trail shares the collision volume's reach. It is a
        // combat cue, so reduced-motion mode keeps it without flashing or shaking.
        c.save();c.strokeStyle=k.kind==='heavy'?'#f2d39b':'#a7edf3';c.lineWidth=k.kind==='heavy'?5:3;
        c.beginPath();c.ellipse(a.x,a.y-8,k.downwardWidth/2,k.downwardRange,0,.12,Math.PI-.12);c.stroke();
        c.globalAlpha=.35;c.lineWidth=11;c.stroke();c.restore();
      }
    }
    if(a.block||a.parryWindow>0){c.strokeStyle=a.parryWindow?'#a9f5f5':'#e4d3a5';c.lineWidth=a.parryWindow?4:2;c.beginPath();const direction=a.facing===1?0:Math.PI;c.arc(a.x,a.y-60,55,direction-.95,direction+.95);c.stroke();}
    if(a.player&&a.counterTime>0)this.text('BALASAN SIAP',a.x,a.y-148,{color:'#a8eded',size:12});
    if(a.player&&a.potion)this.text('MEMULIHKAN…',a.x,a.y-145,{color:'#bdd9b3',size:12});
    if(a.type==='boss-king-phase2'&&!settings.reducedMotion){c.strokeStyle='#ed6f7a33';c.lineWidth=2;c.beginPath();c.ellipse(a.x,a.y-160,92+Math.sin(time*3)*7,174,0,0,Math.PI*2);c.stroke();}
  }
  transform(form,oldForm,time,duration,reveal,reduced){this.prepareFrame();const c=this.ctx;c.fillStyle='#08121f';c.fillRect(0,0,WIDTH,HEIGHT);const glow=c.createRadialGradient(640,390,10,640,390,400);glow.addColorStop(0,form==='brave-legacy'?'#977b454d':'#587b9455');glow.addColorStop(1,'#08121f');c.fillStyle=glow;c.fillRect(0,0,WIDTH,HEIGHT);c.strokeStyle='#e5c88655';for(let i=0;i<3;i++){c.beginPath();c.ellipse(640,460,140+i*45,35+i*13,reduced?0:Math.sin(time*.5+i)*.1,0,Math.PI*2);c.stroke();}this.sprite(time>=reveal?form:oldForm,640,470,1,'transform',time, time>=reveal?16:15);if(!reduced)for(let i=0;i<40;i++){const angle=i*2.4+time*.3,r=70+(i*19)%210;c.fillStyle='#edddad99';c.fillRect(640+Math.cos(angle)*r,410+Math.sin(angle)*r,3,3);}this.text(time>=reveal?FORM_NAMES[form]:'CAHAYA MENJAWAB JANJIMU',640,540,{size:24,font:'Georgia',color:'#e8c98b'});}
}
