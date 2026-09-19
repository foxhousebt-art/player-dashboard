(()=>{"use strict";
const BASE_W=1672,BASE_H=941,dynamic=document.getElementById("dynamic"),hotspots=document.getElementById("hotspots");
function fit(){const s=Math.max(innerWidth/BASE_W,innerHeight/BASE_H),x=(innerWidth-BASE_W*s)/2,y=(innerHeight-BASE_H*s)/2,tr=`translate(${x}px,${y}px) scale(${s})`;if(dynamic)dynamic.style.transform=tr;if(hotspots)hotspots.style.transform=tr}
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
   body.innerHTML=s?row("Lecture",`≥ ${s.goals?.reading||10} pages / jour`)+row("Apprentissage",`≥ ${s.goals?.learning||30} min / jour`)+row("Sport",`${s.sportWeek.sessions} / ${s.goals?.sport||4} cette semaine`)+row("Nutrition",`≥ ${s.goals?.nutrition||3} repas conformes`)+row("Recherche d’emploi",`≥ ${s.goals?.work||1} action utile`)+row("Finance",`${Math.round(s.finance.budgetRemaining)} € restants`)+`<p class="panel-note">Perfect Day : lecture + apprentissage + nutrition + travail + trajectoire finance. Le sport reste suivi à la semaine.</p>`:`<p class="panel-note">Synchronisation des objectifs…</p>`;
 }else if(name==="settings"){
   title.textContent="PARAMÈTRES DU JEU";
   const cfg=JSON.parse(localStorage.getItem("playerGameSettings")||"{}"),g=s?.goals||{};
   const val=(k,f)=>cfg[k]??f;
   body.innerHTML=`
    <div class="settings-grid">
      <div class="edit-field"><label>BUDGET MENSUEL (€)</label><input id="setBudget" type="number" min="0" value="${val("monthlyBudget",s?.finance?.monthlyBudget||1000)}"></div>
      <div class="edit-field"><label>LECTURE / JOUR</label><input id="setReading" type="number" min="1" value="${val("readingGoal",g.reading||10)}"></div>
      <div class="edit-field"><label>APPRENTISSAGE (MIN)</label><input id="setLearning" type="number" min="1" value="${val("learningGoal",g.learning||30)}"></div>
      <div class="edit-field"><label>SPORT / SEMAINE</label><input id="setSport" type="number" min="1" max="7" value="${val("sportGoal",g.sport||4)}"></div>
      <div class="edit-field"><label>REPAS CONFORMES / JOUR</label><input id="setNutrition" type="number" min="1" value="${val("nutritionGoal",g.nutrition||3)}"></div>
      <div class="edit-field"><label>ACTIONS EMPLOI / JOUR</label><input id="setWork" type="number" min="1" value="${val("workGoal",g.work||1)}"></div>
    </div>
    <p class="panel-note">Ces réglages modifient les objectifs et le calcul des Perfect Days. Les saisies historiques ne sont pas effacées.</p>
    <button class="save-game-settings" id="saveGameSettings">ENREGISTRER LES PARAMÈTRES</button><div id="settingsSaved"></div>`;
   body.querySelector("#saveGameSettings").onclick=()=>{
      const cfg={monthlyBudget:+body.querySelector("#setBudget").value,readingGoal:+body.querySelector("#setReading").value,learningGoal:+body.querySelector("#setLearning").value,sportGoal:+body.querySelector("#setSport").value,nutritionGoal:+body.querySelector("#setNutrition").value,workGoal:+body.querySelector("#setWork").value};
      localStorage.setItem("playerGameSettings",JSON.stringify(cfg));
      body.querySelector("#settingsSaved").innerHTML='<div class="saved-msg">PARAMÈTRES ENREGISTRÉS — recalcul en cours…</div>';
      window.PlayerDataSync?.refresh(); setTimeout(()=>location.reload(),350);
   };
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
   title.textContent="CITATIONS";
   const q=JSON.parse(localStorage.getItem("playerQuotes")||"{}");
   body.innerHTML=`<div class="edit-field"><label>CITATION PRINCIPALE — HAUT DU DASHBOARD</label><textarea id="quote1">${q.top||"Les petites actions d’aujourd’hui créent les grandes victoires de demain."}</textarea></div><div class="edit-field"><label>CITATION DU JOUEUR — SOUS LE NIVEAU</label><textarea id="quote2">${q.player||"Un meilleur toi construit un meilleur monde."}</textarea></div><button class="save-game-settings" id="saveQuotes">ENREGISTRER LES CITATIONS</button><div id="quotesSaved"></div>`;
   body.querySelector("#saveQuotes").onclick=()=>{
      localStorage.setItem("playerQuotes",JSON.stringify({top:body.querySelector("#quote1").value.trim(),player:body.querySelector("#quote2").value.trim()}));
      window.dispatchEvent(new Event("player-quotes-update"));
      body.querySelector("#quotesSaved").innerHTML='<div class="saved-msg">CITATIONS MISES À JOUR.</div>';
   };
 }
}
function refreshOpen(){if(current)renderPanel(current)}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));
document.getElementById("panelClose")?.addEventListener("click",close);
addEventListener("keydown",e=>{if(e.key==="Escape")close()});
})();