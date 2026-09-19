"use strict";
const $=id=>document.getElementById(id), set=(id,v)=>{const e=$(id);if(e)e.textContent=v}, pct=n=>Math.max(0,Math.min(100,n||0));
function clock(){const n=new Date();set("date",n.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase());set("time",n.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}));const d=(n.getDay()+6)%7;document.querySelectorAll("#days b").forEach((e,i)=>e.classList.toggle("today",i===d));set("weekLabel","JOUR "+n.getDate()+" / "+new Date(n.getFullYear(),n.getMonth()+1,0).getDate())}
function render(s){if(!s)return; const g=s.global;
 set("globalLevel",g.level);set("xpIntoLevel",Math.round(g.xpIntoLevel));set("xpLevelCost",g.level>=100?0:Math.round(g.nextFloor-g.currentFloor));$("globalProgress").style.width=pct(g.progress)+"%";
 set("nextLevel",Math.min(100,g.level+1));set("xpRemaining",g.level>=100?"TRANSCENDANT":Math.round(g.xpNeededForNext)+" XP restants");
 set("grossXp",s.grossXp||0);set("penaltyXp","-"+(s.penaltyTotal||0));set("comebackXp","+"+(s.comebackBonus||0));set("totalXp",s.globalXp||0);
 const map={lecture:["readingXp","readingLevel","readingBar"],apprentissage:["learningXp","learningLevel","learningBar"],travail:["workXp","workLevel","workBar"],nutrition:["nutritionXp","nutritionLevel","nutritionBar"]};
 Object.entries(map).forEach(([k,a])=>{const x=s.attrs[k];set(a[0],x.xp);set(a[1],x.level);$(a[2]).style.width=pct(x.progress)+"%"});
 set("sportSessions",s.sportWeek.sessions);set("sportStatus",s.sportWeek.status);$("sportBar").style.width=pct(s.sportWeek.sessions/4*100)+"%";
 set("financeRemaining",Math.round(s.finance.budgetRemaining));$("financeBar").style.width=pct(s.finance.monthlyBudget?100*s.finance.budgetRemaining/s.finance.monthlyBudget:0)+"%";
 set("smokeStreak",s.smoking.streak);set("smokeStatus",s.smoking.status);$("smokeBar").style.width=pct(s.smoking.streak/30*100)+"%";
 set("difficultyName",s.difficulty.name); const texts={1:"Exploration douce • reprise facile",2:"Engagement équilibré",3:"Discipline stricte • conséquences réelles",4:"Impitoyable • aucune grâce"};
 set("difficultyEffect",texts[s.difficulty.level]);document.querySelectorAll("[data-diff]").forEach(b=>b.classList.toggle("on",+b.dataset.diff===s.difficulty.level));
 const tier=g.level>=95?5:g.level>=62?4:g.level>=35?3:g.level>=10?2:1;$("world").className="world tier-"+tier;
}
document.querySelectorAll("[data-diff]").forEach(b=>b.onclick=()=>{localStorage.setItem("playerDifficulty",b.dataset.diff);location.reload()});
document.querySelectorAll("[data-toast]").forEach(b=>b.onclick=()=>{const t=$("toast");t.textContent=b.dataset.toast;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)});
$("worldBtn").onclick=()=>$("worldInfo").classList.toggle("show");
window.addEventListener("player-data-update",e=>render(e.detail));window.addEventListener("DOMContentLoaded",()=>{clock();setInterval(clock,1000)});
