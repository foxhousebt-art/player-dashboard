(()=>{"use strict";
let state=null; const panel=document.getElementById("sidePanel"),title=document.getElementById("panelTitle"),body=document.getElementById("panelBody");
const row=(a,b)=>`<div class="panel-row"><span>${a}</span><b>${b}</b></div>`;
function open(titleText,html){title.textContent=titleText;body.innerHTML=html;panel.classList.add("open");panel.setAttribute("aria-hidden","false")}
function pct(x){return Math.max(0,Math.min(100,Math.round(x)))}
window.addEventListener("player-data-update",e=>state=e.detail);
document.getElementById("difficultyCard")?.addEventListener("click",()=>document.querySelector('[data-panel="settings"]')?.click());
document.querySelectorAll("[data-stat]").forEach(btn=>btn.addEventListener("click",()=>{
 const s=state;if(!s)return;const k=btn.dataset.stat,A=s.attrs;
 let t="",v="",sub="",extra="",p=0;
 if(k==="lecture"){t="LECTURE";v=A.lecture.xp+" XP";sub="Niveau "+A.lecture.level;p=A.lecture.xp%100;extra=row("Objectif quotidien","≥ 10 pages")}
 if(k==="apprentissage"){t="APPRENTISSAGE";v=A.apprentissage.xp+" XP";sub="Niveau "+A.apprentissage.level;p=A.apprentissage.xp%100;extra=row("Objectif quotidien","≥ 30 minutes")}
 if(k==="sport"){t="SPORT";v=s.sportWeek.sessions+" / 4";sub=s.sportWeek.status;p=s.sportWeek.sessions/4*100;extra=row("Objectif hebdomadaire","4 séances minimum")}
 if(k==="travail"){t="RECHERCHE D’EMPLOI";v=A.travail.xp+" XP";sub="Niveau "+A.travail.level;p=A.travail.xp%100;extra=row("Objectif quotidien","≥ 1 action utile")}
 if(k==="finance"){t="FINANCE";v=Math.round(s.finance.budgetRemaining)+" €";sub="Budget restant";p=s.finance.monthlyBudget?100*s.finance.budgetRemaining/s.finance.monthlyBudget:0;extra=row("Budget mensuel",Math.round(s.finance.monthlyBudget)+" €")+row("Trajectoire",s.finance.withinTrajectory?"RESPECTÉE":"DÉPASSÉE")}
 if(k==="nutrition"){t="NUTRITION";v=A.nutrition.xp+" XP";sub="Niveau "+A.nutrition.level;p=A.nutrition.xp%100;extra=row("Objectif quotidien","≥ 3 repas conformes")}
 if(k==="tabac"){t="SANS CIGARETTE";v=s.smoking.streak+" J";sub=s.smoking.status;p=Math.min(100,s.smoking.streak*10);extra=row("Bonus actuel",s.smoking.streak>=10?"+10 XP / jour":"+5 XP / jour")}
 open(t,`<div class="stat-head"><div><span>${sub}</span><strong>${v}</strong></div></div><div class="progress-track"><i style="width:${pct(p)}%"></i></div>${extra}<p class="panel-note">Cette carte ouvre le détail de cet indicateur. Elle ne modifie aucune donnée.</p>`);
}));
})();