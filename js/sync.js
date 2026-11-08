/* MCDO FIT — koppeling met MCDO PT.
   Na elke wijziging schrijft de app een korte samenvatting (reeks, niveau, sessies, deze week)
   naar een privé-gist op je GitHub. MCDO PT op je Mac leest die gist uit.
   Het GitHub-token blijft enkel op dit toestel (localStorage), apart van je trainingsdata. */

const SYNC_KEY="mcdofit:sync";             // {token, gistId, last, lastErr}
const GIST_DESC="mcdo-fit-sync", GIST_FILE="mcdo-fit.json";

function syncCfg(){ try{ return JSON.parse(localStorage.getItem(SYNC_KEY)||"{}"); }catch(e){ return {}; } }
function setSyncCfg(c){ try{ localStorage.setItem(SYNC_KEY,JSON.stringify(c)); }catch(e){} }

/* Wat MCDO PT te zien krijgt: enkel een samenvatting, geen volledige app-data. */
function fitSummary(){
  const t=todayStr(), done=state.log[t], mon=mondayOf(t), L=state.lvl;
  const week=[];
  for(let i=0;i<7;i++){ const d=addDays(mon,i); week.push({d, s:state.log[d]?"done":state.rest[d]?"rest":""}); }
  const log={}; Object.keys(state.log).forEach(d=>{ log[d]=state.log[d].title||""; });
  return {
    v:1, updated:new Date().toISOString(), day:t,
    streak:computeStreak(), best:state.best||0, total:total(),
    level:L.level, prog:L.prog, need:needFor(L.level), locked:!!state.settings.lockLevel,
    todayDone:!!done, todayTitle: done ? done.title : dayTitle(daySlots(state.dayIdx),DAYS[state.dayIdx]),
    week, log, rest:Object.keys(state.rest),
    backup:makeBackup()   // volledige back-up: zo kan je na opnieuw installeren alles terughalen
  };
}

/* ---------- back-up & herstel ---------- */
function makeBackup(){ const s=Object.assign({},state); delete s.checks; return {v:1, savedAt:new Date().toISOString(), state:s}; }
function applyBackup(b){
  if(!b || !b.state || typeof b.state.log!=="object") throw new Error("Dit is geen geldige back-up.");
  const f=freshState(), s=b.state;
  state=Object.assign(f,s);
  state.settings=Object.assign(f.settings,s.settings||{});
  state.lvl=Object.assign(f.lvl,s.lvl||{});
  state.checks={}; state.today=null;
  if(state.settings.opt && !EX[state.settings.opt.ex]) state.settings.opt.ex="squat";
  freshen(); save();
}
async function readGist(c,id){
  const r=await fetch("https://api.github.com/gists/"+id,{headers:{Authorization:"Bearer "+c.token, Accept:"application/vnd.github+json"}});
  if(!r.ok) throw new Error("GitHub antwoordde "+r.status);
  const f=((await r.json()).files||{})[GIST_FILE]; if(!f) return null;
  const txt=f.truncated ? await (await fetch(f.raw_url)).text() : f.content;
  return JSON.parse(txt);
}
/* back-up uit de gist terugzetten (na opnieuw installeren) */
async function restoreFromGist(){
  const c=syncCfg(); if(!c.token||!c.gistId) throw new Error("Geen gekoppelde back-up gevonden.");
  const d=await readGist(c,c.gistId);
  if(!d || !d.backup) throw new Error("De gist bevat nog geen volledige back-up (enkel een samenvatting van een oudere versie).");
  applyBackup(d.backup);
  setSyncCfg(Object.assign(syncCfg(),{pending:null}));
}

let syncTimer=null, syncBusy=false;
/* wordt na elke save() aangeroepen; wacht even zodat snelle wijzigingen samen één sync worden */
function scheduleSync(){
  const c=syncCfg();
  if(!c.token || c.pending) return; // wacht op jouw keuze als er een grotere back-up klaarstaat
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{ syncNow(); },2000);
}
async function syncNow(){
  const c=syncCfg();
  if(!c.token) return {ok:false,error:"Geen token"};
  if(c.pending && !c.allowOverwrite) return {ok:false,pending:true};
  if(syncBusy) return {ok:false,error:"Bezig"};
  syncBusy=true;
  const h={Authorization:"Bearer "+c.token, Accept:"application/vnd.github+json", "Content-Type":"application/json"};
  const body={description:GIST_DESC, files:{[GIST_FILE]:{content:JSON.stringify(fitSummary(),null,1)}}};
  try{
    let id=c.gistId;
    if(!id){ // bestaande gist opzoeken (bv. na opnieuw installeren), anders straks nieuw maken
      const r=await fetch("https://api.github.com/gists?per_page=100",{headers:h});
      if(r.status===401) throw new Error("Token ongeldig of verlopen");
      if(!r.ok) throw new Error("GitHub antwoordde "+r.status);
      const g=(await r.json()).find(x=>x.description===GIST_DESC);
      if(g){
        id=g.id;
        // VEILIGHEID: staat daar al meer voortgang dan op dit toestel, dan nooit zomaar overschrijven
        let remote=null; try{ remote=await readGist(c,id); }catch(e){}
        if(remote && (remote.total||0)>total() && !c.allowOverwrite){
          setSyncCfg(Object.assign(syncCfg(),{gistId:id,pending:{total:remote.total,updated:remote.updated,full:!!remote.backup}}));
          return {ok:false,pending:true};
        }
      }
    }
    let r=id ? await fetch("https://api.github.com/gists/"+id,{method:"PATCH",headers:h,body:JSON.stringify(body)}) : null;
    if(!r || r.status===404) r=await fetch("https://api.github.com/gists",{method:"POST",headers:h,body:JSON.stringify(Object.assign({public:false},body))});
    if(r.status===401) throw new Error("Token ongeldig of verlopen");
    if(r.status===403) throw new Error("Token mag geen gists schrijven");
    if(!r.ok) throw new Error("GitHub antwoordde "+r.status);
    const g=await r.json();
    setSyncCfg(Object.assign(syncCfg(),{gistId:g.id,last:new Date().toISOString(),lastErr:null,pending:null,allowOverwrite:false}));
    return {ok:true};
  }catch(e){
    const msg=e.message==="Failed to fetch"?"Geen verbinding":e.message;
    setSyncCfg(Object.assign(syncCfg(),{lastErr:msg}));
    return {ok:false,error:msg};
  }finally{ syncBusy=false; }
}
