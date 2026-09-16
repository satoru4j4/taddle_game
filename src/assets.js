import { LEVELS,QUEST,FANTASY,LEGACY } from './config.js';
export const ROOT='resource-taddle-game/';
export class AssetCatalog {
  constructor(){this.images=new Map();this.catalog={};}
  async init(){const [catalog,story]=await Promise.all(['catalog','story'].map(async name=>{const r=await fetch(`src/data/${name}.json`);if(!r.ok)throw Error(`src/data/${name}.json`);return r.json();}));this.catalog=catalog;this.story=story;}
  async loadImage(path){if(this.images.has(path))return this.images.get(path);const image=new Image();image.src=ROOT+path;await new Promise((res,rej)=>{image.onload=res;image.onerror=()=>rej(Error(path));});this.images.set(path,image);return image;}
  async level(run,progress=()=>{}){const config=LEVELS[run.level-1];const ids=[run.currentForm,...Object.keys(config.pool),...config.bosses,'blacksmith','prisoner'];if(run.level===4)ids.push(FANTASY);if(run.level===7)ids.push(LEGACY,'boss-king-phase2','princess');const paths=[...new Set(ids.map(id=>this.catalog[id].atlas)),...Array.from({length:3},(_,i)=>`assets/backgrounds/${config.slug}/layer-${i}.png`),'assets/objects/health-potion.png','assets/objects/stamina-potion.png','assets/objects/rune.png'];let count=0;const results=await Promise.allSettled(paths.map(async p=>{await this.loadImage(p);progress(++count,paths.length);}));const failed=results.flatMap((r,i)=>r.status==='rejected'?[paths[i]]:[]);if(failed.length)throw Error('Aset gagal dimuat:\n'+failed.join('\n'));}
  image(path){return this.images.get(path);}
}
export class AudioBus {
  constructor(settings){this.settings=settings;this.active=new Set();this.music=null;this.track=null;this.transform=null;}
  volume(kind){return this.settings.masterVolume*this.settings[kind==='music'?'musicVolume':'sfxVolume'];}
  configure(settings){this.settings=settings;if(this.music)this.music.volume=this.volume('music');for(const a of this.active)a.volume=this.volume('sfx');}
  playFile(path,rate=1){const audio=new Audio(ROOT+path);audio.volume=this.volume('sfx');audio.playbackRate=rate;this.active.add(audio);audio.onended=()=>this.active.delete(audio);audio.onerror=()=>this.active.delete(audio);audio.play().catch(()=>this.active.delete(audio));return audio;}
  action(form,name,rate=1){if(['attack','heavy-attack','jump','hurt','block','parry','defeat'].includes(name))this.playFile(`assets/audio/forms/${form}/${name}.wav`,rate);}
  setMusic(name){if(this.track===name){this.music?.play().catch(()=>{});return;}this.music?.pause();this.track=name;this.music=new Audio(ROOT+`assets/audio/music/${name}.wav`);this.music.loop=true;this.music.volume=this.volume('music');this.music.play().catch(()=>{});}
  stopEffects(){for(const a of this.active)a.pause();this.active.clear();this.transform=null;}
  pause(){this.music?.pause();for(const a of this.active)a.pause();}
  resume(){this.music?.play().catch(()=>{});if(this.transform)this.transform.play().catch(()=>{});}
}
