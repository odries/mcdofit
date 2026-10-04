/* MCDO FIT — logica: workout samenstellen, opslag, datums, niveau, streak, thema. */

/* =====================================================================
   WORKOUT SAMENSTELLEN
   ===================================================================== */
function poolList(pool){
  const keys=Object.keys(EX);
  if(pool==="open"||pool==="close") return keys.filter(k=>EX[k].sub===pool);
  return keys.filter(k=>EX[k].cat===pool);
}
function exAt(key,li){ const e=EX[key], raw=e.lv[li], l=typeof raw==="string"?{r:raw}:raw; return {n:l.n||e.n, r:l.r, note:l.note||"", easy:l.easy||""}; }

/* Focus = wisselen: per focus-categorie wordt één niet-focus-slot vervangen
   (bij voorkeur van de categorie die die dag het vaakst voorkomt). */
function applyFocus(slots,focus){
  const s=slots.slice();
  focus.forEach(f=>{
    let best=-1, bestCnt=0;
    s.forEach((c,i)=>{ if(focus.includes(c)) return; const k=s.filter(x=>x===c).length; if(k>=bestCnt){ best=i; bestCnt=k; } });
    if(best>=0) s[best]=f;
  });
  return s;
}
function dayTitle(slots){
  const cnt={}, order=[];
  slots.forEach(c=>{ if(!cnt[c]){ cnt[c]=0; order.push(c); } cnt[c]++; });
  const dom=order.filter(c=>cnt[c]>=2).sort((a,b)=>cnt[b]-cnt[a]);
  return dom.length ? dom.map(c=>CATS[c].short).join(" & ") : "Full body";
}
function composition(slots){
  const cnt={}, order=[];
  slots.forEach(c=>{ if(!cnt[c]){ cnt[c]=0; order.push(c); } cnt[c]++; });
  return order.map(c=>({cat:c,n:cnt[c]}));
}

/* Rotatie: per categorie een teller (state.rot). Elk slot neemt de volgende oefening
   uit zijn categorie, nooit twee keer dezelfde op één dag. */
function buildPlan(dayIdx){
  const day=DAYS[dayIdx], li=curLevel()-1, S=state.settings;
  const slots=applyFocus(day.slots, S.focus);
  const rot=Object.assign({},state.rot), used=new Set(), items=[];
  const take=(pool,opt)=>{
    const list=poolList(pool), i=rot[pool]||0; let key=null;
    for(let k=0;k<list.length;k++){ const c=list[(i+k)%list.length]; if(!used.has(c)){ key=c; rot[pool]=i+k+1; break; } }
    if(!key){ key=list[i%list.length]; rot[pool]=i+1; }
    used.add(key);
    items.push(Object.assign({key,pool,cat:EX[key].cat,opt:!!opt},exAt(key,li)));
  };
  take("open");
  slots.forEach(c=>take(c));
  const o=S.opt;
  if(o.mode==="auto") take(day.opt,true);
  else if(o.mode==="cat") take(o.cat,true);
  else if(o.mode==="ex" && EX[o.ex]) items.push(Object.assign({key:o.ex,pool:null,cat:EX[o.ex].cat,opt:true},exAt(o.ex,li)));
  take("close");
  return {tag:day.tag, slots, title:dayTitle(slots), items, lvl:li+1, rotAfter:rot};
}
function catLabel(it){
  if(it.pool==="open") return "Opener";
  if(it.pool==="close") return "Afsluitstretch";
  return CATS[it.cat].label;
}

/* =====================================================================
   OPSLAG
   ===================================================================== */
function freshState(){
  return {
    log:{}, rest:{}, best:0, maxHit:false, today:null, dayIdx:0, checks:{},
    rot:{}, lvl:{level:1,prog:0,resetNote:null}, lastSession:null,
    settings:{manualLevel:null, focus:[], opt:{mode:"auto",cat:"benen",ex:"squat"}, theme:"system"}
  };
}
let state=freshState();

async function load(){
  let raw=null;
  if(window.storage){ try{ const r=await window.storage.get(KEY); if(r&&r.value) raw=r.value; }catch(e){} }
  if(raw===null){ try{ raw=localStorage.getItem(KEY); }catch(e){} }
  if(raw){ try{ const s=JSON.parse(raw), f=freshState(); state=Object.assign(f,s); state.settings=Object.assign(f.settings,s.settings||{}); state.lvl=Object.assign(f.lvl,s.lvl||{}); }catch(e){} }
}
async function save(){
  const s=JSON.stringify(state);
  if(window.storage){ try{ await window.storage.set(KEY,s); return; }catch(e){} }
  try{ localStorage.setItem(KEY,s); }catch(e){}
}

/* =====================================================================
   DATUMS (dag wisselt pas om 04:00)
   ===================================================================== */
function isoDate(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function todayStr(){ const d=new Date(); d.setHours(d.getHours()-4); return isoDate(d); }
function parseISO(s){ const p=s.split("-").map(Number); return new Date(p[0],p[1]-1,p[2]); }
function addDays(s,n){ const d=parseISO(s); d.setDate(d.getDate()+n); return isoDate(d); }
function daysBetween(a,b){ return Math.round((parseISO(b)-parseISO(a))/864e5); }
function mondayOf(s){ const d=parseISO(s); d.setDate(d.getDate()-(d.getDay()+6)%7); return isoDate(d); }
function restCountInWeek(s){ const wk=mondayOf(s); return Object.keys(state.rest).filter(x=>mondayOf(x)===wk).length; }
const MONTHS=["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
const DOW=["zo","ma","di","wo","do","vr","za"];
function prettyDate(s){ const d=parseISO(s); return DOW[d.getDay()]+" "+d.getDate()+" "+MONTHS[d.getMonth()].slice(0,3); }
function longDate(s){ const d=parseISO(s); return ["zondag","maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag"][d.getDay()]+" "+d.getDate()+" "+MONTHS[d.getMonth()]; }

/* =====================================================================
   NIVEAU, STREAK, ACHIEVEMENTS
   ===================================================================== */
function total(){ return Object.keys(state.log).length; }
function curLevel(){ return state.settings.manualLevel || state.lvl.level; }
function needFor(level){ return level<MAX ? LEVEL_STAPPEN[level-1] : 0; }
function checkInactivity(){
  if(!state.lastSession) return;
  if(daysBetween(state.lastSession,todayStr())>INACTIEF_DAGEN && state.lvl.prog>0){ state.lvl.prog=0; state.lvl.resetNote=todayStr(); }
}
function computeStreak(){
  let cur=todayStr(), count=0, used={}, first=true, guard=0;
  while(guard++<4000){
    if(state.log[cur]) count++;
    else if(state.rest[cur]){ const wk=mondayOf(cur); if(used[wk]) break; used[wk]=true; }
    else if(!first) break;
    first=false; cur=addDays(cur,-1);
  }
  return count;
}
function unlockedIds(){
  const tot=total();
  return ACH.filter(a=> a.kind==="total"?tot>=a.n : a.kind==="streak"?state.best>=a.n : state.maxHit).map(a=>a.id);
}
function freshen(){
  const t=todayStr();
  if(state.today!==t){ state.today=t; state.checks={}; state.dayIdx=total()%DAYS.length; }
  checkInactivity();
  state.best=Math.max(state.best||0, computeStreak());
}

let celebrate=null; // {gained, levelUp} — enkel in geheugen, voor het feestje na voltooien
function complete(){
  const t=todayStr();
  if(state.log[t]) return null;
  const plan=buildPlan(state.dayIdx), before=unlockedIds(), lvlBefore=state.lvl.level;
  checkInactivity();
  delete state.rest[t];
  if(state.lvl.level<MAX){
    state.lvl.prog++;
    if(state.lvl.prog>=needFor(state.lvl.level)){ state.lvl.level++; state.lvl.prog=0; }
  }
  state.log[t]={tag:plan.tag,title:plan.title,slots:plan.slots,lvl:plan.lvl,
    items:plan.items.map(it=>({key:it.key,pool:it.pool,cat:it.cat,opt:it.opt,n:it.n,r:it.r,note:it.note,easy:it.easy}))};
  state.rot=plan.rotAfter; state.lastSession=t; state.lvl.resetNote=null;
  state.best=Math.max(state.best,computeStreak());
  if(curLevel()>=MAX) state.maxHit=true;
  celebrate={gained:unlockedIds().filter(id=>!before.includes(id)), levelUp:(!state.settings.manualLevel && state.lvl.level>lvlBefore)?state.lvl.level:0};
  save();
  return celebrate;
}
function toggleRest(d){
  if(state.log[d] || d>todayStr()) return;
  if(state.rest[d]) delete state.rest[d];
  else{ if(restCountInWeek(d)>=1) return; state.rest[d]=true; }
  state.best=Math.max(state.best,computeStreak());
  save(); render();
}

/* =====================================================================
   THEMA
   ===================================================================== */
function applyTheme(){
  const th=state.settings.theme, root=document.documentElement;
  if(th==="system") delete root.dataset.theme; else root.dataset.theme=th;
  const dark = th==="dark" || (th==="system" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name=theme-color]').content = dark?"#100F1C":"#FBFAF7";
}

