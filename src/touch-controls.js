import {SKILLS,SKILL_ACTIONS} from './skills.js';
import {controlIcon} from './control-icons.js';
import {KEY_LABELS} from './config.js';

// Keep pointer ownership separate from keyboard ownership, including two fingers on one action.
export class TouchControls {
  constructor(root,input,canPlay){
    this.root=root;this.input=input;this.canPlay=canPlay;this.pointers=new Map();
    this.buttons=[...root.querySelectorAll('[data-action]')];
    for(const button of this.buttons){
      button.querySelector('.control-icon').innerHTML=controlIcon(button.dataset.action);
      button.title=KEY_LABELS[button.dataset.action];
      button.addEventListener('pointerdown',event=>{
        if(button.hidden||button.disabled||!canPlay()||(event.pointerType==='mouse'&&event.button!==0))return;
        event.preventDefault();
        this.pointers.set(event.pointerId,button);
        try{button.setPointerCapture(event.pointerId);}catch{/* Synthetic QA events have no active hardware pointer. */}
        button.classList.add('pressed');
        input.canvas.focus({preventScroll:true});
        input.press(button.dataset.action,'touch:'+event.pointerId);
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>this.release(event.pointerId));
      button.addEventListener('contextmenu',event=>event.preventDefault());
    }
    input.clearListeners.add(()=>this.clear());
  }
  release(id){
    const button=this.pointers.get(id);if(!button)return;
    this.pointers.delete(id);this.input.release('touch:'+id);
    if(button.hasPointerCapture(id))button.releasePointerCapture(id);
    if(![...this.pointers.values()].includes(button))button.classList.remove('pressed');
  }
  clear(){for(const id of [...this.pointers.keys()])this.release(id);}
  sync(player){
    this.root.hidden=!this.canPlay();if(this.root.hidden){this.clear();return;}
    const changedForm=this.form!==player.type;
    if(changedForm){this.clear();this.form=player.type;this.root.dataset.form=player.type;}
    for(const [kind,action] of Object.entries(SKILL_ACTIONS)){
      const button=this.buttons.find(b=>b.dataset.action===action),skill=SKILLS[player.type][kind],cool=player.cooldowns[kind]||0;
      button.disabled=!skill;button.hidden=!skill;
      if(changedForm)button.querySelector('.control-icon').innerHTML=controlIcon(action,player.type);
      button.classList.toggle('cooling',cool>0);
      const status=kind==='blessing'&&player.blessingTime>0?'×2':cool>0?cool.toFixed(1):'';
      button.querySelector('.control-badge').textContent=status;
      button.title=skill?`${skill.name} · ${skill.cost} ST${cool>0?' · '+cool.toFixed(1)+' detik':''}`:'Skill belum terbuka';
      button.setAttribute('aria-label',button.title);
    }
    for(const [action,count,label] of [['hpPotion',player.hpPotions,'HP'],['staminaPotion',player.staminaPotions,'ST']]){
      const button=this.buttons.find(b=>b.dataset.action===action);button.querySelector('.control-badge').textContent=count;button.disabled=count===0;
      button.setAttribute('aria-label',`Minum potion ${label}, tersisa ${count}`);
    }
  }
}
