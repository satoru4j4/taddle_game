import { DEFAULT_KEYS } from './config.js';
export class InputController {
  constructor(canvas,onPause,onJournal){this.canvas=canvas;this.keys={...DEFAULT_KEYS};this.held=new Set();this.edges=new Map();this.sources=new Map();this.clearListeners=new Set();this.time=0;this.onPause=onPause;this.onJournal=onJournal;
    canvas.addEventListener('keydown',e=>{const action=this.action(e.code);if(!action)return;e.preventDefault();if(e.repeat)return;if(action==='pause'||action==='journal')e.stopPropagation();this.press(action,'key:'+e.code);});
    window.addEventListener('keyup',e=>this.release('key:'+e.code));
    window.addEventListener('blur',()=>{this.clear();onPause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();onPause(true);}});
  }
  action(code){if(code==='ArrowLeft')return 'left';if(code==='ArrowRight')return 'right';if(code==='ShiftRight'&&this.keys.run==='ShiftLeft')return 'run';return Object.keys(this.keys).find(k=>this.keys[k]===code);}
  press(action,source){
    if(!Object.hasOwn(DEFAULT_KEYS,action)||this.sources.has(source))return;
    if(action==='pause'||action==='journal'){this.clear();if(action==='pause')this.onPause();else this.onJournal();return;}
    this.sources.set(source,action);if(!this.held.has(action))this.edges.set(action,this.time);this.held.add(action);
  }
  release(source){const action=this.sources.get(source);this.sources.delete(source);if(![...this.sources.values()].includes(action))this.held.delete(action);}
  down(a){return this.held.has(a);}
  pressed(a,maxAge=.10){const t=this.edges.get(a);return t!==undefined&&this.time-t<=maxAge;}
  take(a,maxAge=.10){const yes=this.pressed(a,maxAge);if(yes)this.edges.delete(a);return yes;}
  update(dt){this.time+=dt;for(const [key,t]of this.edges)if(this.time-t>.12)this.edges.delete(key);}
  clear(){this.sources.clear();this.held.clear();this.edges.clear();for(const listener of this.clearListeners)listener();}
}
