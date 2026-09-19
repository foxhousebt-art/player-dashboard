"use strict";
const $=id=>document.getElementById(id),set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
function clock(){const n=new Date(),tz="Europe/Paris";set("date",n.toLocaleDateString("fr-FR",{timeZone:tz,weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase());set("time",n.toLocaleTimeString("fr-FR",{timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false}));const parts=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"numeric",day:"numeric"}).formatToParts(n).reduce((a,p)=>(a[p.type]=p.value,a),{}),d=+parts.day,m=+parts.month,y=+parts.year,days=new Date(Date.UTC(y,m,0)).getUTCDate();set("weekLabel","JOUR "+d+" / "+days)}
function render(s){if(!s)return;const g=s.global;set("globalLevel",g.level);set("xpIntoLevel",Math.round(g.xpIntoLevel));set("xpLevelCost",g.level>=100?0:Math.round(g.nextFloor-g.currentFloor));set("difficultyName",s.difficulty.name);set("difficultyLevel",["","I","II","III","IV"][s.difficulty.level]||s.difficulty.level);
 document.querySelectorAll("[data-diff]").forEach(b=>b.classList.toggle("on",+b.dataset.diff===s.difficulty.level));
 const A=s.attrs;set("readingValue",A.lecture.xp+" XP");set("readingLevel","NIV. "+A.lecture.level);set("learningValue",A.apprentissage.xp+" XP");set("learningLevel","NIV. "+A.apprentissage.level);set("sportValue",s.sportWeek.sessions+" / 4");set("sportStatus",s.sportWeek.status);set("workValue",A.travail.xp+" XP");set("workLevel","NIV. "+A.travail.level);set("financeValue",Math.round(s.finance.budgetRemaining)+" €");set("nutritionValue",A.nutrition.xp+" XP");set("nutritionLevel","NIV. "+A.nutrition.level);set("smokeValue",s.smoking.streak+" J");set("smokeStatus",s.smoking.status);set("grossXp",s.grossXp||0);set("penaltyXp",s.penaltyTotal||0);set("comebackXp",s.comebackBonus||0);set("totalXp",s.globalXp||0);
}
document.querySelectorAll("[data-diff]").forEach(b=>b.onclick=()=>{localStorage.setItem("playerDifficulty",b.dataset.diff);location.reload()});
document.querySelectorAll("[data-msg]").forEach(b=>b.onclick=()=>{const t=$("toast");t.textContent=b.dataset.msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)});
window.addEventListener("player-data-update",e=>render(e.detail));window.addEventListener("DOMContentLoaded",()=>{clock();setInterval(clock,1000)});

/* V1.0.1 safe sprite animation */
const PLAYER_FORMS_SAFE=[
 [1,"brian_lvl_001_base"],[5,"brian_lvl_005_determine"],[10,"brian_lvl_010_combattant"],
 [17,"brian_lvl_017_aguerri"],[20,"brian_lvl_020_veteran"],[35,"brian_lvl_035_elite"],
 [50,"brian_lvl_050_maitre"],[62,"brian_lvl_062_maitre_superieur"],[75,"brian_lvl_075_ascendant"],
 [84,"brian_lvl_084_ascendant_2"],[95,"brian_lvl_095_pre_transcendant"],[100,"brian_lvl_100_transcendant"]
];
let playerLevelSafe=1, playerFrameSafe=0;
function playerFormSafe(level){let f=PLAYER_FORMS_SAFE[0][1];for(const pair of PLAYER_FORMS_SAFE){if(level>=pair[0])f=pair[1]}return f}
setInterval(function(){
 const img=document.getElementById("playerSprite"); if(!img)return;
 playerFrameSafe=(playerFrameSafe+1)%6;
 img.src="sprites/animated/"+playerFormSafe(playerLevelSafe)+"/idle_"+String(playerFrameSafe).padStart(2,"0")+".png";
},190);
window.addEventListener("player-data-update",function(e){if(e.detail&&e.detail.global)playerLevelSafe=e.detail.global.level});
