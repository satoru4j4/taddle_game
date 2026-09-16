export const QUEST = 'taddle-quest';
export const FANTASY = 'taddle-fantasy';
export const LEGACY = 'brave-legacy';
const stat = (power, speed, defend, damage, stamina, hp) => Object.freeze({ power, speed, defend, damage, stamina, hp });
export const STATS = Object.freeze({
  [QUEST]: stat(50,50,50,80,200,800),
  [FANTASY]: stat(350,350,350,380,600,2000),
  [LEGACY]: stat(1000,1000,1000,1000,10000,10000),
  'boss-king': stat(400,400,400,600,1000,1000),
  'boss-king-phase2': stat(2000,2000,2000,1200,10000,10000),
  'mini-01-border-captain': stat(45,40,35,35,120,260),
  'mini-02-thorn-beast': stat(70,65,55,50,170,380),
  'mini-03-crystal-golem': stat(95,60,100,65,240,450),
  'boss-warden': stat(120,95,110,80,300,600),
  'mini-04-siege-brute': stat(160,120,145,110,400,700),
  'mini-05-marsh-revenant': stat(230,190,210,160,550,800),
  'mini-06-royal-inquisitor': stat(290,250,250,220,650,850),
  'boss-commander': stat(330,280,290,280,750,950),
  'mini-07-abyss-sentinel': stat(370,330,340,360,900,1000)
});
export const FORM_NAMES = { [QUEST]:'Taddle Quest', [FANTASY]:'Taddle Fantasy', [LEGACY]:'Taddle Legacy' };
const BASE = [null,[25,25,20,20,70,80],[40,40,35,30,90,110],[65,60,55,45,120,150],[100,90,90,65,160,210],[160,140,140,90,230,280],[240,210,210,125,320,380],[320,280,280,160,450,500]];
const MULT = { swordsman:[1,1,1,1,1,1], slime:[.65,.55,.7,.7,.8,1.1], bat:[.65,1.2,.5,.7,.7,.55], archer:[.8,1,.6,.9,.9,.75], 'shield-guard':[1,.75,1.6,.85,1.4,1.25], mage:[1.1,.85,.65,1.1,1.2,.8], elite:[1.2,1.1,1.15,1.1,1.2,1.2] };
export function enemyStats(type, level) { return stat(...BASE[level].map((n,i)=>Math.max(1,Math.round(n*MULT[type][i])))); }
export const LEVELS = [
  { name:'Desa Perbatasan', slug:'01-border-village', subtitle:'Janji yang belum selesai', goal:'Temukan jalan keluar dari desa.', pool:{slime:3,swordsman:3}, bosses:['mini-01-border-captain'], music:'dawn-of-the-quest', color:'#86aa9d', clue:'Catatan penjaga: Jangan kejar setiap pukulan. Lepaskan pertahanan, tarik napas, biarkan staminamu pulih.' },
  { name:'Hutan Berduri', slug:'02-thornwood', subtitle:'Di antara akar dan bayangan', goal:'Ikuti jejak pasukan menuju tambang.', pool:{swordsman:3,archer:3,bat:3}, bosses:['mini-02-thorn-beast'], music:'thorn-and-lantern', color:'#97ad77', clue:'Jejak pada pohon: Panah datang lurus. Dekati pemanah saat ia menyiapkan tembakan; parry membuka kesempatan balasan.' },
  { name:'Tambang Terlantar', slug:'03-abandoned-mine', subtitle:'Cahaya di bawah tanah', goal:'Buka lorong dan bebaskan tawanan.', pool:{bat:4,slime:3,'shield-guard':3}, bosses:['mini-03-crystal-golem','boss-warden'], music:'stone-and-iron', color:'#83b8c9', clue:'Catatan tambang: Perisai penjaga hanya melindungi bagian depan. Bergeraklah ke belakangnya saat ia bersiap menyerang.' },
  { name:'Benteng Perbatasan', slug:'04-border-fortress', subtitle:'Sang penjaga janji', goal:'Tembus benteng dan cari jejak Putri.', pool:{swordsman:4,archer:3,'shield-guard':3}, bosses:['mini-04-siege-brute'], music:'stone-and-iron', color:'#caab82', clue:'Pandai besi: Cari papan berlambang naga setelah pertahanan kedua. Gashat itu masih di sana. Aku menyimpannya untuk seseorang yang belum menyerah.' },
  { name:'Rawa Terkutuk', slug:'05-cursed-marsh', subtitle:'Sesuatu yang memilih tinggal', goal:'Telusuri cahaya di tengah kutukan.', pool:{slime:3,mage:4,bat:4}, bosses:['mini-05-marsh-revenant'], music:'thorn-and-lantern', color:'#af97c3', clue:'Tawanan: Terima kasih. Aku melihat Putri dibawa ke kastel. Lukanya sempat bercahaya, lalu hilang. Dia masih menyebut namamu.' },
  { name:'Kota Kerajaan Musuh', slug:'06-enemy-city', subtitle:'Surat dari masa yang telah pergi', goal:'Lewati pertahanan menuju istana.', pool:{elite:4,archer:4,'shield-guard':3}, bosses:['mini-06-royal-inquisitor','boss-commander'], music:'stone-and-iron', color:'#bf927e', clue:'Surat terakhir Putri: Jika malam ini aku tidak kembali, jangan biarkan ia berjalan sendirian. Tolong, jaga harapannya ketika aku tak lagi mampu.' },
  { name:'Kastel Bayangan', slug:'07-shadow-castle', subtitle:'Di ujung segala janji', goal:'Hadapi Raja Bayangan.', pool:{elite:4,mage:4,'shield-guard':4}, bosses:['mini-07-abyss-sentinel','boss-king'], music:'the-shadow-crown', color:'#c999a7', clue:'Ukiran takhta: Raja mengira cinta yang dipatahkan akan menyerahkan kekuatan kepadanya. Namun cahaya hanya dapat diberikan dengan kehendaknya sendiri.' }
];
export const TELEGRAPH = [0,.65,.6,.55,.5,.48,.45,.45];
export const REACTION = [0,.5,.45,.4,.35,.32,.3,.28];
// Updated movement/combat tuning requested after the first playable build.
export const PLAYER_MOVEMENT = Object.freeze({ maxJumps:2, jumpCost:6, jumpImpulse:-720, airAttackControl:1 });
export const BAT_FLIGHT = Object.freeze({ altitude:180, bob:16, returnSpeed:300, attackRange:220, windup:.70, active:.40, recovery:.95 });
export const PLAYER_ATTACKS = Object.freeze({
  light:Object.freeze({windup:.16,active:.10,recovery:.16,range:90,downwardRange:90,downwardWidth:100,audioRate:1}),
  heavy:Object.freeze({windup:.22,active:.14,recovery:.16,range:110,downwardRange:120,downwardWidth:130,audioRate:.54/.22})
});
export const DEFAULT_KEYS = { skillBlink:'KeyU', skillSlash:'KeyO', skillBlessing:'KeyP', left:'KeyA', right:'KeyD', run:'ShiftLeft', jump:'Space', light:'KeyJ', heavy:'KeyK', block:'KeyL', parry:'KeyI', interact:'KeyE', hpPotion:'KeyQ', staminaPotion:'KeyR', journal:'Tab', pause:'Escape' };
export const KEY_LABELS = { skillBlink:'Taddle Blink',skillSlash:'Taddle Slash',skillBlessing:'Bleesing of Legacy',left:'Gerak kiri',right:'Gerak kanan',run:'Berlari',jump:'Lompat',light:'Serangan ringan',heavy:'Serangan berat',block:'Tahan block',parry:'Parry',interact:'Interaksi',hpPotion:'Botol HP',staminaPotion:'Botol stamina',journal:'Catatan',pause:'Jeda' };
export const WIDTH=1280, HEIGHT=720, FLOOR=590, STEP=1/60;
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
