"use strict";
const $=id=>document.getElementById(id),set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
function clock(){const n=new Date();set("date",n.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase());set("time",n.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}));set("weekLabel","JOUR "+n.getDate()+" / "+new Date(n.getFullYear(),n.getMonth()+1,0).getDate())}
function render(s){if(!s)return;const g=s.global;set("globalLevel",g.level);set("xpIntoLevel",Math.round(g.xpIntoLevel));set("xpLevelCost",g.level>=100?0:Math.round(g.nextFloor-g.currentFloor));set("difficultyName",s.difficulty.name);
 document.querySelectorAll("[data-diff]").forEach(b=>b.classList.toggle("on",+b.dataset.diff===s.difficulty.level));
 const A=s.attrs;set("readingValue",A.lecture.xp+" XP");set("readingLevel","NIV. "+A.lecture.level);set("learningValue",A.apprentissage.xp+" XP");set("learningLevel","NIV. "+A.apprentissage.level);set("sportValue",s.sportWeek.sessions+" / 4");set("sportStatus",s.sportWeek.status);set("workValue",A.travail.xp+" XP");set("workLevel","NIV. "+A.travail.level);set("financeValue",Math.round(s.finance.budgetRemaining)+" €");set("nutritionValue",A.nutrition.xp+" XP");set("nutritionLevel","NIV. "+A.nutrition.level);set("smokeValue",s.smoking.streak+" J");set("smokeStatus",s.smoking.status);set("grossXp",s.grossXp||0);set("penaltyXp",s.penaltyTotal||0);set("comebackXp",s.comebackBonus||0);set("totalXp",s.globalXp||0);
}
document.querySelectorAll("[data-diff]").forEach(b=>b.onclick=()=>{localStorage.setItem("playerDifficulty",b.dataset.diff);location.reload()});
document.querySelectorAll("[data-msg]").forEach(b=>b.onclick=()=>{const t=$("toast");t.textContent=b.dataset.msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)});
window.addEventListener("player-data-update",e=>render(e.detail));window.addEventListener("DOMContentLoaded",()=>{clock();setInterval(clock,1000)});
