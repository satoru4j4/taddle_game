import { copy,validateRun,newProfile } from './progression.js';
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Transaksi dibatalkan.'));tx.onerror=()=>{};});
export function upgradeProfile(profile){
  if(!profile?.settings?.keyBindings)return profile;
  const p=copy(profile),keys=p.settings.keyBindings,defaults=newProfile().settings.keyBindings;
  if((p.settings.keyBindingsVersion||1)<2)for(const [action,oldCode] of Object.entries({skillBlink:'KeyF',skillSlash:'KeyG',skillBlessing:'KeyH'})){
    if(keys[action]===oldCode&&!Object.values(keys).includes(defaults[action]))keys[action]=defaults[action];
  }
  p.settings.keyBindingsVersion=2;
  for(const key of ['skillBlink','skillSlash','skillBlessing'])if(keys[key]===undefined){
    const candidates=[defaults[key],...Array.from('FGHZXCVBNM123456789',c=>/[0-9]/.test(c)?'Digit'+c:'Key'+c)];
    keys[key]=candidates.find(code=>!Object.values(keys).includes(code));
  }
  return p;
}
export function validateProfile(p) {
  return !!p&&Array.isArray(p.unlockedEndings)&&p.unlockedEndings.every(e=>['real','good','extream'].includes(e))&&p.settings&&['masterVolume','musicVolume','sfxVolume'].every(k=>Number.isFinite(p.settings[k])&&p.settings[k]>=0&&p.settings[k]<=1)&&typeof p.settings.reducedMotion==='boolean'&&typeof p.settings.instantText==='boolean'&&Object.keys(newProfile().settings.keyBindings).every(k=>typeof p.settings.keyBindings?.[k]==='string')&&new Set(Object.values(p.settings.keyBindings)).size===Object.keys(p.settings.keyBindings).length;
}
export class SaveRepository {
  constructor({token,databaseName='taddle-journey'}={}){this.token=token||crypto.randomUUID();this.databaseName=databaseName;this.revision=0;this.memoryOnly=false;this.last=null;}
  async open(){const req=indexedDB.open(this.databaseName,1);req.onupgradeneeded=()=>req.result.createObjectStore('state');this.db=await request(req);this.db.onversionchange=()=>this.db.close();}
  async load(){const tx=this.db.transaction('state','readonly'),s=tx.objectStore('state');const [latest,backup]=await Promise.all([request(s.get('latest')),request(s.get('backup'))]);this.revision=latest?.revision||0;this.last=latest||null;
    if(!latest)return {run:null,profile:newProfile()};
    latest.profile=upgradeProfile(latest.profile);if(backup)backup.profile=upgradeProfile(backup.profile);
    const errors=this.check(latest); if(errors.length)return {corrupt:true,errors,backup:this.check(backup).length?null:backup,latest};
    return copy(latest);
  }
  check(data){if(!data||data.schemaVersion!==1)return ['Format penyimpanan tidak dikenal.'];if(!Number.isInteger(data.revision)||data.revision<1)return ['Revisi penyimpanan tidak sah.'];return [...(data.run?validateRun(data.run):[]),...(validateProfile(upgradeProfile(data.profile))?[]:['Pengaturan tidak sah.']),...(data.run&&data.run.revision!==data.revision?['Revisi perjalanan berbeda.']:[])];}
  async lease(){if(this.memoryOnly)return;const tx=this.db.transaction('state','readwrite'),complete=done(tx),s=tx.objectStore('state');const lease=await request(s.get('lease'));if(lease&&lease.token!==this.token&&lease.until>Date.now()){tx.abort();await complete.catch(()=>{});throw Error('Sesi lain sedang aktif. Tutup tab permainan yang lain, lalu coba lagi.');}s.put({token:this.token,until:Date.now()+15000},'lease');await complete;}
  async release(){if(!this.db)return;const tx=this.db.transaction('state','readwrite'),complete=done(tx),s=tx.objectStore('state');const lease=await request(s.get('lease'));if(lease?.token===this.token)s.delete('lease');await complete;}
  async commit(run,profile,{recover=false}={}) {
    if(run&&validateRun(run).length)throw Error(validateRun(run).join(' '));if(!validateProfile(profile))throw Error('Pengaturan tidak sah.');
    if(this.memoryOnly)return copy(run);
    const tx=this.db.transaction('state','readwrite'),complete=done(tx),s=tx.objectStore('state');
    const [lease,latest]=await Promise.all([request(s.get('lease')),request(s.get('latest'))]);
    if(!lease||lease.token!==this.token||lease.until<Date.now()||(!recover&&(latest?.revision||0)!==this.revision)) {tx.abort();await complete.catch(()=>{});throw Error('Kepemilikan sesi atau revisi berubah. Muat ulang setelah sesi lain ditutup.');}
    const revision=(latest?.revision||0)+1,nextRun=run?{...copy(run),revision}:null;
    const next={schemaVersion:1,revision,run:nextRun,profile:copy(profile)};
    if(latest&&!this.check(latest).length)s.put(latest,'backup');
    s.put(next,'latest');s.put({token:this.token,until:Date.now()+15000},'lease');await complete;
    this.revision=revision;this.last=next;return nextRun;
  }
}
