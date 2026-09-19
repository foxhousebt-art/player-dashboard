(()=>{"use strict";
const BASE_W=1672,BASE_H=941,dynamic=document.getElementById("dynamic"),hotspots=document.getElementById("hotspots");
function fit(){
 const s=Math.max(innerWidth/BASE_W,innerHeight/BASE_H),x=(innerWidth-BASE_W*s)/2,y=(innerHeight-BASE_H*s)/2;
 const tr=`translate(${x}px,${y}px) scale(${s})`; if(dynamic)dynamic.style.transform=tr;if(hotspots)hotspots.style.transform=tr;
}
addEventListener("resize",fit);fit();

let state=null;
window.addEventListener("player-data-update",e=>{state=e.detail; if(document.getElementById("sidePanel")?.classList.contains("open")) refreshOpen()});

const panel=document.getElementById("sidePanel"),title=document.getElementById("panelTitle"),body=document.getElementById("panelBody");
let current="";
function row(a,b){return `<div class="panel-row"><span>${a}</span><b>${b}</b></div>`}
function openPanel(name){current=name;renderPanel(name);panel.classList.add("open");panel.setAttribute("aria-hidden","false")}
function close(){panel.classList.remove("open");panel.setAttribute("aria-hidden","true")}
function renderPanel(name){
 const s=state;
 if(name==="objectives"){
   title.textContent="OBJECTIFS";
   body.innerHTML=s?row("Lecture","≥ 10 pages / jour")+row("Apprentissage","≥ 30 min / jour")+row("Sport",`${s.sportWeek.sessions} / 4 cette semaine`)+row("Nutrition","≥ 3 repas conformes")+row("Recherche d’emploi","≥ 1 action utile")+row("Finance",`${Math.round(s.finance.budgetRemaining)} € restants`)+`<p class="panel-note">Perfect Day : lecture + apprentissage + nutrition + travail + trajectoire finance. Le sport reste suivi à la semaine.</p>`:`<p class="panel-note">Synchronisation des objectifs…</p>`;
 }else if(name==="settings"){
   title.textContent="PARAMÈTRES DE JEU";
   const d=s?.difficulty?.level||+(localStorage.getItem("playerDifficulty")||2);
   body.innerHTML=`${row("Difficulté actuelle",s?.difficulty?.name||"ENGAGÉ")}<div class="panel-diffs">${[1,2,3,4].map(n=>`<button data-panel-diff="${n}" class="${n===d?"on":""}">${n}</button>`).join("")}</div>${row("Budget mensuel",`${Math.round(s?.finance?.monthlyBudget||1000)} €`)}<p class="panel-note">Changer la difficulté recharge le moteur de progression. Les données enregistrées ne sont pas supprimées.</p>`;
   body.querySelectorAll("[data-panel-diff]").forEach(b=>b.onclick=()=>{localStorage.setItem("playerDifficulty",b.dataset.panelDiff);location.reload()});
 }else if(name==="mode"){
   title.textContent="MODE DE DIFFICULTÉ";
   const d=s?.difficulty?.level||+(localStorage.getItem("playerDifficulty")||2);
   const names={1:"EXPLORATEUR",2:"ENGAGÉ",3:"DISCIPLINÉ",4:"IMPITOYABLE"};
   const rules={
     1:"Récompenses +8 % · pénalités ×0,45 · grâce 3 · comeback 15",
     2:"Récompenses +4 % · pénalités ×0,75 · grâce 2 · comeback 20",
     3:"Récompenses normales · pénalités ×1 · grâce 1 · comeback 25",
     4:"Récompenses normales · pénalités ×1,35 · aucune grâce · comeback 35"
   };
   body.innerHTML=`${row("Mode actif",s?.difficulty?.name||names[d])}<div class="panel-diffs">${[1,2,3,4].map(n=>`<button data-panel-diff="${n}" class="${n===d?"on":""}" title="${names[n]}">${["","I","II","III","IV"][n]}</button>`).join("")}</div><p class="panel-note" id="modeRule">${rules[d]}</p><div class="panel-row"><span>XP net actuel</span><b>${s?.globalXp??"—"} XP</b></div><p class="panel-note">Changer de mode recalcule immédiatement tout l’historique avec les coefficients du mode choisi. Tes saisies ne sont jamais modifiées.</p>`;
   body.querySelectorAll("[data-panel-diff]").forEach(b=>b.onclick=()=>{
      localStorage.setItem("playerDifficulty",b.dataset.panelDiff);
      window.PlayerDataSync?.refresh();
      setTimeout(()=>location.reload(),120);
   });
 }else{
   title.textContent="MOTIVATION";
   body.innerHTML=`<div class="quote-card">« Les petites actions d’aujourd’hui créent les grandes victoires de demain. »</div><div class="quote-card">« Un jour meilleur commence maintenant. »</div><div class="quote-card">« Discipline aujourd’hui. Liberté demain. »</div>`;
 }
}
function refreshOpen(){if(current)renderPanel(current)}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));
document.getElementById("panelClose")?.addEventListener("click",close);
addEventListener("keydown",e=>{if(e.key==="Escape")close()});
})();