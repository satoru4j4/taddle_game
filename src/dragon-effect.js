// Side-profile energy dragon, redrawn from the user's reference as scalable Canvas geometry.
// Positive X is the snout; mirroring follows the direction of the dash.
const TAU=Math.PI*2;
export function dragonTrail(c,x,y,facing,travel,progress,reduced=false){
  const length=Math.min(490,160+Math.max(0,travel)),phase=reduced?0:progress*TAU;
  c.save();c.translate(x,y);c.scale(facing,1);c.lineCap='round';c.lineJoin='round';
  // Dark tapered ribbons connect the back of the skull to the wake of the dash.
  const smoke=c.createLinearGradient(-length,0,-48,0);
  smoke.addColorStop(0,'#09050a00');smoke.addColorStop(.22,'#18060d20');smoke.addColorStop(.62,'#34081180');smoke.addColorStop(1,'#8c13266b');
  c.fillStyle=smoke;
  for(let i=0;i<3;i++){
    const offset=(i-1)*29,sway=reduced?0:Math.sin(phase+i*1.7)*10;
    c.beginPath();c.moveTo(-53,offset-25);
    c.bezierCurveTo(-length*.38,offset-44+sway,-length*.7,offset+18,-length,offset*.25);
    c.bezierCurveTo(-length*.68,offset-11,-length*.36,offset+35+sway,-57,offset+25);c.closePath();c.fill();
  }
  const energy=c.createLinearGradient(-length,0,-45,0);
  energy.addColorStop(0,'#ef173000');energy.addColorStop(.2,'#b5122730');energy.addColorStop(.68,'#ed2638b0');energy.addColorStop(1,'#ff8a80e6');
  c.strokeStyle=energy;
  for(let band=0;band<(reduced?2:5);band++){
    const offset=(band-(reduced?.5:2))*19;
    c.beginPath();
    for(let j=0;j<=16;j++){
      const t=j/16,px=-48-(length-48)*t;
      const py=offset*(1-t*.65)+Math.sin(t*TAU*1.2-phase+band)*Math.sin(t*Math.PI)*(reduced?4:16);
      if(j===0)c.moveTo(px,py);else c.lineTo(px,py);
    }
    c.save();c.globalAlpha*=.13;c.lineWidth=10;c.stroke();c.restore();c.lineWidth=band%2?1.2:2.1;c.stroke();
  }
  if(!reduced){
    c.save();c.strokeStyle='#ff604f';c.fillStyle='#ffd5ad';
    for(let i=0;i<18;i++){
      const t=(i*.137+progress*.65)%1,px=-68-t*(length-68),py=Math.sin(i*2.4)*((1-t)*29+13)+Math.sin(phase+i)*7;
      const opacity=Math.sin(t*Math.PI)*.72;
      c.save();c.globalAlpha*=opacity;c.lineWidth=i%3===0?2:1;
      c.beginPath();c.moveTo(px,py);c.lineTo(px+8+12*t,py-2);c.stroke();
      if(i%3===0){c.beginPath();c.arc(px+8+12*t,py-2,1.5,0,TAU);c.fill();}c.restore();
    }c.restore();
  }
  c.restore();
}
function outline(c,path,fill){
  path();c.save();c.strokeStyle='#f52235';c.lineWidth=7;c.globalAlpha*=.16;c.stroke();c.restore();
  c.fillStyle=fill;c.fill();c.strokeStyle='#ee4650';c.lineWidth=1.45;c.stroke();
}
function radiance(c,x,y,r,color){
  const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(.35,color+'aa');g.addColorStop(1,color+'00');
  c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}
function teeth(c,lower=false){
  const enamel=c.createLinearGradient(0,lower?48:2,0,lower?28:27);
  enamel.addColorStop(0,'#a52d37');enamel.addColorStop(.48,'#ff8c83');enamel.addColorStop(1,'#fff0d9');
  c.fillStyle=enamel;c.strokeStyle='#ff6868';c.lineWidth=.8;
  for(let i=0;i<9;i++){
    const x=85-i*12,base=lower?57-i*2.8:1+i*1.55,length=8+(i%3===1?12:7),direction=lower?-1:1;
    c.beginPath();c.moveTo(x+5,base);c.quadraticCurveTo(x+1,base+direction*length*.55,x-2,base+direction*length);
    c.lineTo(x-7,base+direction);c.closePath();c.fill();c.stroke();
  }
}
export function dragonHead(c,x,y,facing,size,progress=0,reduced=false){
  c.save();c.translate(x,y);c.scale(facing*size,size);c.lineCap='round';c.lineJoin='round';
  const motion=reduced?0:Math.sin(progress*Math.PI*2),jawLift=reduced?0:-5*(1-Math.sin(Math.min(1,progress)*Math.PI));
  const blackRed=c.createLinearGradient(-100,-60,95,65);
  blackRed.addColorStop(0,'#08070d');blackRed.addColorStop(.36,'#14070c');blackRed.addColorStop(.7,'#4e0b18');blackRed.addColorStop(1,'#a11727');
  const jawRed=c.createLinearGradient(-65,20,95,80);jawRed.addColorStop(0,'#12070d');jawRed.addColorStop(.65,'#550b19');jawRed.addColorStop(1,'#b32230');

  // Long swept crests and filaments, like the streaming energy in the reference.
  const flow=c.createLinearGradient(-265,0,0,0);flow.addColorStop(0,'#e8182a00');flow.addColorStop(.6,'#a31527aa');flow.addColorStop(1,'#fb525a');
  c.strokeStyle=flow;c.lineWidth=1.25;
  for(let i=0;i<(reduced?5:10);i++){
    const sy=-65+i*13,dy=motion*(i%2?3:-3);
    c.beginPath();c.moveTo(-20,sy);c.bezierCurveTo(-95,sy-17,-130,sy+18+dy,-180-i*8,sy-30+dy);c.stroke();
    if(i%2===0){c.beginPath();c.moveTo(-83,sy-2);c.lineTo(-118,sy-21);c.lineTo(-146,sy-14);c.lineTo(-193,sy-43+dy);c.stroke();}
  }
  outline(c,()=>{c.beginPath();c.moveTo(-41,-47);c.quadraticCurveTo(-81,-95,-169,-109);c.lineTo(-136,-88);c.lineTo(-155,-80);c.quadraticCurveTo(-96,-83,-70,-48);c.closePath();},blackRed);
  outline(c,()=>{c.beginPath();c.moveTo(-62,-18);c.lineTo(-136,-47);c.lineTo(-117,-23);c.lineTo(-167,-29);c.quadraticCurveTo(-124,0,-69,9);c.closePath();},blackRed);

  // Deep open mouth: the broad dark gap and two rows of teeth define the silhouette.
  c.fillStyle='#08060a';c.beginPath();c.moveTo(-56,8);c.quadraticCurveTo(20,-7,100,-3);
  c.lineTo(103,62+jawLift);c.quadraticCurveTo(14,69,-57,28);c.closePath();c.fill();
  outline(c,()=>{
    c.beginPath();c.moveTo(-115,33);c.quadraticCurveTo(-104,-10,-67,-38);c.lineTo(-39,-67);
    c.quadraticCurveTo(-4,-78,25,-54);c.quadraticCurveTo(43,-46,65,-61);
    c.quadraticCurveTo(100,-72,105,-49);c.lineTo(95,-30);c.quadraticCurveTo(108,-20,98,-1);
    c.lineTo(70,3);c.quadraticCurveTo(31,-4,-9,11);c.quadraticCurveTo(-33,20,-49,7);
    c.quadraticCurveTo(-76,14,-115,33);c.closePath();
  },blackRed);
  teeth(c);

  c.save();c.translate(0,jawLift);
  outline(c,()=>{
    c.beginPath();c.moveTo(-67,15);c.quadraticCurveTo(-17,47,43,54);c.lineTo(93,48);
    c.quadraticCurveTo(111,56,98,74);c.quadraticCurveTo(33,90,-13,61);
    c.quadraticCurveTo(-43,49,-92,43);c.lineTo(-67,15);c.closePath();
  },jawRed);
  teeth(c,true);
  c.strokeStyle='#fb7375';c.lineWidth=1;c.beginPath();c.moveTo(-50,39);c.quadraticCurveTo(20,81,94,69);c.stroke();
  c.strokeStyle='#8e1b2c';c.beginPath();c.moveTo(-54,30);c.quadraticCurveTo(-27,45,-3,47);c.stroke();c.restore();

  // Facial plates, a recessed nostril, and the angular brow keep the face readable in motion.
  c.strokeStyle='#c93845';c.lineWidth=1.2;
  for(const line of [
    [-84,8,-62,-17,-30,-20,-12,-42],[-67,-33,-29,-55,-1,-57,22,-39],
    [-32,-30,9,-39,23,-20,65,-15],[-33,-8,-5,-4,30,-22,87,-10],
    [-5,-63,17,-56,26,-46,46,-46],[-77,17,-59,23,-44,31,-31,32]
  ]){c.beginPath();c.moveTo(line[0],line[1]);c.bezierCurveTo(...line.slice(2));c.stroke();}
  c.fillStyle='#10070b';c.strokeStyle='#ff5c61';c.beginPath();c.ellipse(85,-34,6,10,.5,0,TAU);c.fill();c.stroke();
  c.strokeStyle='#ff7977';c.beginPath();c.moveTo(29,-50);c.quadraticCurveTo(63,-62,91,-57);c.stroke();
  c.fillStyle='#09070b';c.beginPath();c.moveTo(-25,-39);c.quadraticCurveTo(-8,-51,13,-30);c.quadraticCurveTo(-3,-15,-20,-26);c.closePath();c.fill();
  radiance(c,-6,-31,23,'#ec1825');radiance(c,-6,-31,11,'#ff5b28');
  c.fillStyle='#ffd18a';c.beginPath();c.ellipse(-6,-31,5,6,-.3,0,TAU);c.fill();
  c.strokeStyle='#ff8990';c.lineWidth=1.6;c.beginPath();c.moveTo(-26,-43);c.quadraticCurveTo(-6,-47,14,-32);c.stroke();
  c.restore();
}
