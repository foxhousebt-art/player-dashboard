"use strict";
(function(){
const $=id=>document.getElementById(id);let S=null;
function q(){try{return JSON.parse(localStorage.getItem("playerQuotes")||"{}")}catch(e){return{}}}
function showQuote(){let x=q(),m=$("mainQuote");if(m)m.textContent="« "+(x.main||"Les petites actions d’aujourd’hui créent les grandes victoires de demain.")+" »"}
function open(name){let body=$("systemPanelBody");
 if(name==="designs"){
   body.innerHTML=`<h2>// DESIGNS</h2><p class="design-help">Choisis ton univers. Le changement est immédiat et ne modifie ni les XP, ni l'historique, ni les paramètres.</p><div id="designPickerMount"></div><p id="panelMsg"></p>`;
   $("systemPanel").classList.add("open");$("systemPanel").setAttribute("aria-hidden","false");
   setTimeout(function(){
     let mount=$("designPickerMount");
     if(window.PlayerThemeManager&&PlayerThemeManager.mountPicker){PlayerThemeManager.mountPicker(mount)}
     else if(mount){mount.innerHTML='<p>Le gestionnaire de designs n\'a pas pu être chargé.</p>'}
   },0);
   return;
 }
 if(!S)return;let g=S.goals||{},f=S.finance||{};
 if(name==="analysis")body.innerHTML=`<h2>// ANALYSE</h2><div class="panel-grid">${box("XP BRUTS",S.grossXp)+box("PÉNALITÉS","-"+S.penaltyTotal)+box("XP NETS",S.globalXp)+box("COMEBACK","+"+S.comebackBonus)+box("JOURS ACTIFS",S.activeDays)+box("SANS CIGARETTE",S.smoking.streak+" J")+box("SPORT SEMAINE",S.sportWeek.sessions+" / "+g.sport)+box("PERFECT DAY",Math.round(S.perfectDayBonus/50))}</div><h3>// PROGRESSION</h3>${Object.keys(S.attrs).map(k=>row(k.toUpperCase(),S.attrs[k].level,S.attrs[k].progress)).join("")}`;
 else if(name==="objectives")body.innerHTML=`<h2>// OBJECTIFS</h2>${obj("LECTURE",g.reading+" pages / jour")+obj("APPRENTISSAGE",g.learning+" minutes / jour")+obj("SPORT",g.sport+" séances / semaine")+obj("NUTRITION",g.nutrition+" repas conformes / jour")+obj("RECHERCHE D'EMPLOI",g.work+" action utile / jour")+obj("FINANCE",Math.round(f.monthlyBudget)+" € / mois")}`;
 else if(name==="settings"){let c=JSON.parse(localStorage.getItem("playerGameSettings")||"{}"),v=(k,x)=>c[k]!==undefined?c[k]:x;body.innerHTML=`<h2>// PARAMÈTRES</h2><div class="settings-grid">${inp("monthlyBudget","BUDGET MENSUEL (€)",v("monthlyBudget",f.monthlyBudget))+inp("readingGoal","LECTURE / JOUR",v("readingGoal",g.reading))+inp("learningGoal","APPRENTISSAGE (MIN/J)",v("learningGoal",g.learning))+inp("sportGoal","SPORT / SEMAINE",v("sportGoal",g.sport))+inp("nutritionGoal","REPAS CONFORMES / JOUR",v("nutritionGoal",g.nutrition))+inp("workGoal","ACTIONS EMPLOI / JOUR",v("workGoal",g.work))}</div><button id="saveSettings" class="action">ENREGISTRER</button><p id="panelMsg"></p>`;setTimeout(bindSettings,0)}
 else if(name==="difficulty"){let D=PlayerEngine.DIFFICULTY;body.innerHTML=`<h2>// MODE DE DIFFICULTÉ</h2><p>Le mode modifie réellement les récompenses et les pénalités du moteur XP.</p><div class="difficulty-grid">${Object.keys(D).map(n=>{let d=D[n];return `<button class="difficulty ${+n===S.difficulty.level?"active":""}" data-d="${n}"><b>${["","I","II","III","IV"][n]} — ${d.name}</b><small>Récompenses ×${d.reward.toFixed(2)} · Pénalités ×${d.penalty.toFixed(2)}<br>Grâce ${d.grace} · Comeback ${d.comeback} XP</small></button>`}).join("")}</div>`;setTimeout(bindDifficulty,0)}
 else {let x=q();body.innerHTML=`<h2>// CITATIONS</h2><label>CITATION DU DASHBOARD<textarea id="quoteMain">${x.main||"Les petites actions d’aujourd’hui créent les grandes victoires de demain."}</textarea></label><label>CITATION JOUEUR<textarea id="quotePlayer">${x.player||"Discipline aujourd’hui. Liberté demain."}</textarea></label><button id="saveQuotes" class="action">ENREGISTRER</button><p id="panelMsg"></p>`;setTimeout(bindQuotes,0)}
 $("systemPanel").classList.add("open");$("systemPanel").setAttribute("aria-hidden","false")
}
function box(a,b){return `<div class="panel-box"><span>${a}</span><b>${b}</b></div>`}
function row(a,l,p){return `<div class="analysis-row"><span>${a}</span><b>NIV. ${l}</b><div class="bar"><i style="width:${p}%"></i></div></div>`}
function obj(a,b){return `<div class="objective-row"><b>${a}</b><span>${b}</span><em>ACTIF</em></div>`}
function inp(k,l,v){return `<label>${l}<input data-setting="${k}" type="number" min="0" value="${v}"></label>`}
function bindSettings(){let b=$("saveSettings");if(!b)return;b.onclick=function(){let o={};document.querySelectorAll("[data-setting]").forEach(i=>o[i.dataset.setting]=+i.value);localStorage.setItem("playerGameSettings",JSON.stringify(o));$("panelMsg").textContent="PARAMÈTRES ENREGISTRÉS — RECALCUL EFFECTUÉ";PlayerDataSync.refresh()}}
function bindDifficulty(){document.querySelectorAll("[data-d]").forEach(b=>b.onclick=function(){localStorage.setItem("playerDifficulty",b.dataset.d);PlayerDataSync.refresh();setTimeout(()=>open("difficulty"),50)})}
function bindQuotes(){let a=$("quoteMain");if(a)a.oninput=function(){$("mainQuote").textContent="« "+a.value+" »"};let b=$("saveQuotes");if(b)b.onclick=function(){localStorage.setItem("playerQuotes",JSON.stringify({main:$("quoteMain").value.trim(),player:$("quotePlayer").value.trim()}));showQuote();$("panelMsg").textContent="CITATIONS ENREGISTRÉES"}}
document.querySelectorAll("[data-panel]").forEach(b=>b.onclick=()=>open(b.dataset.panel));$("closePanel").onclick=()=>{$("systemPanel").classList.remove("open");$("systemPanel").setAttribute("aria-hidden","true")};$("systemPanel").onclick=e=>{if(e.target===$("systemPanel"))$("closePanel").click()};
window.addEventListener("player-data-update",e=>{S=e.detail;let d=$("difficultyName");if(d)d.textContent=S.difficulty.name;showQuote()});showQuote();
})();