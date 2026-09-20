"use strict";
(function(){
 const MAX=100;
 const DIFFICULTY={
  1:{name:"EXPLORATEUR",reward:1.08,penalty:.45,grace:3,comeback:15},
  2:{name:"ENGAGÉ",reward:1.04,penalty:.75,grace:2,comeback:20},
  3:{name:"DISCIPLINÉ",reward:1,penalty:1,grace:1,comeback:25},
  4:{name:"IMPITOYABLE",reward:1,penalty:1.35,grace:0,comeback:35}
 };
 const num=(v,d=0)=>Number.isFinite(+v)?+v:d;
 function dateOnly(s){const [y,m,d]=String(s).slice(0,10).split("-").map(Number);return new Date(y,m-1,d,12)}
 function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
 function monday(d){let x=new Date(d),n=x.getDay()||7;x.setDate(x.getDate()-n+1);x.setHours(12,0,0,0);return x}
 function sunday(d){let x=monday(d);x.setDate(x.getDate()+6);return x}
 function dim(d){return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
 function floorFor(l){if(l<=1)return 0;const k=l-1;return 120*k+5*k*(k-1)}
 function globalFromXp(xp){xp=Math.max(0,num(xp));let level=1;while(level<MAX&&xp>=floorFor(level+1))level++;let lo=floorFor(level),hi=level===MAX?lo:floorFor(level+1);return{level,currentFloor:lo,nextFloor:hi,xpIntoLevel:xp-lo,xpNeededForNext:level===MAX?0:hi-xp,progress:level===MAX?100:Math.round((xp-lo)/(hi-lo)*100)}}
 function attr(xp){xp=Math.max(0,num(xp));return{xp,level:Math.floor(xp/100)+1,currentXp:xp%100,progress:xp%100,targetXp:100}}
 function normalize(rows){const m=new Map;(rows||[]).forEach(r=>{if(!r?.date)return;let date=String(r.date).slice(0,10);m.set(date,{date,pages:Math.max(0,num(r.pages)),learningMinutes:Math.max(0,num(r.learningMinutes)),sport:r.sport===true||r.sport===1||r.sport==="1"||r.sport==="true",compliantMeals:Math.max(0,num(r.compliantMeals)),workActions:Math.max(0,num(r.workActions)),expenses:Math.max(0,num(r.expenses)),cigaretteSmoked:r.cigaretteSmoked===true||r.cigaretteSmoked===1||r.cigaretteSmoked==="1"||r.cigaretteSmoked==="true"?true:r.cigaretteSmoked===false||r.cigaretteSmoked===0||r.cigaretteSmoked==="0"||r.cigaretteSmoked==="false"?false:null})});return[...m.values()].sort((a,b)=>a.date.localeCompare(b.date))}
 function compute(rows,settings={}){
  const entries=normalize(rows), today=new Date();today.setHours(12,0,0,0);
  const dl=Math.max(1,Math.min(4,num(settings.difficulty,2))),difficulty={level:dl,...DIFFICULTY[dl]};
  const goals={reading:Math.max(1,num(settings.readingGoal,10)),learning:Math.max(1,num(settings.learningGoal,30)),sport:Math.max(1,Math.min(7,num(settings.sportGoal,4))),nutrition:Math.max(1,num(settings.nutritionGoal,3)),work:Math.max(1,num(settings.workGoal,1))};
  const budget=Math.max(0,num(settings.monthlyBudget,1000));
  let raw={lecture:0,apprentissage:0,sport:0,nutrition:0,travail:0,finance:0},pen={lecture:0,apprentissage:0,sport:0,nutrition:0,travail:0,finance:0};
  let perfect=0,smokeXp=0,smokeStreak=0,bestSmoke=0,missStreak=0,comeback=0;
  const weeks=new Map,monthSpend=new Map,enriched=[];
  entries.forEach(e=>{
   const d=dateOnly(e.date),wk=iso(monday(d)),mk=e.date.slice(0,7);
   if(!weeks.has(wk))weeks.set(wk,{start:monday(d),sessions:0}); if(e.sport)weeks.get(wk).sessions++;
   raw.lecture+=e.pages; raw.apprentissage+=Math.floor(e.learningMinutes/30)*20; raw.sport+=e.sport?40:0; raw.nutrition+=e.compliantMeals*10; raw.travail+=e.workActions*2;
   const spent=(monthSpend.get(mk)||0)+e.expenses;monthSpend.set(mk,spent);const allowed=budget*d.getDate()/dim(d),financeOk=spent<=allowed+1e-9;if(financeOk)raw.finance+=10;
   const recovery=d.getDay()===0,perfectDay=!recovery&&e.pages>=goals.reading&&e.learningMinutes>=goals.learning&&e.compliantMeals>=goals.nutrition&&e.workActions>=goals.work&&financeOk;if(perfectDay)perfect+=50;
   let smokingXpToday=0;if(e.cigaretteSmoked===true)smokeStreak=0;else if(e.cigaretteSmoked===false){smokeStreak++;bestSmoke=Math.max(bestSmoke,smokeStreak);smokingXpToday=smokeStreak>=10?10:5;smokeXp+=smokingXpToday}
   let dayPenalty=0;
   if(!recovery){let misses=[];if(e.pages===0)misses.push(["lecture",5]);if(e.learningMinutes===0)misses.push(["apprentissage",5]);if(e.compliantMeals===0)misses.push(["nutrition",5]);if(e.workActions===0)misses.push(["travail",5]);if(!financeOk){let over=Math.max(0,spent-allowed);misses.push(["finance",Math.min(15,5+Math.floor(over/Math.max(1,budget*.05))*2)])}
    if(misses.length){missStreak++;let esc=1+Math.min(.5,Math.max(0,missStreak-difficulty.grace)*.1);misses.forEach(([k,b])=>{let p=Math.round(b*difficulty.penalty*esc);pen[k]+=p;dayPenalty+=p})}
    else{if(missStreak>=2)comeback+=Math.round(difficulty.comeback*(1+Math.min(1,missStreak/5)));missStreak=0}
   }
   enriched.push({...e,financeOk,trajectoryAllowed:allowed,cumulativeSpend:spent,perfectDay,recoveryDay:recovery,noSmokingStreak:smokeStreak,smokingXpToday,dayPenalty})
  });
  const currentW=iso(monday(today));let currentSessions=weeks.get(currentW)?.sessions||0,weeklyBonus=0;
  weeks.forEach(w=>{const completed=sunday(w.start)<today;if(w.sessions>=goals.sport){const extra=w.sessions-goals.sport;weeklyBonus+=extra===0?40:extra===1?60:extra===2?80:120}else if(completed){pen.sport+=Math.round(40*difficulty.penalty)}});
  raw.sport+=weeklyBonus;
  const grossCats={};Object.keys(raw).forEach(k=>grossCats[k]=Math.round(raw[k]*difficulty.reward));
  const attrs={};Object.keys(raw).forEach(k=>attrs[k]=attr(Math.max(0,grossCats[k]-pen[k])));
  const penaltyTotal=Object.values(pen).reduce((a,b)=>a+b,0);
  const grossXp=Object.values(grossCats).reduce((a,b)=>a+b,0)+perfect+smokeXp+comeback;
  const globalXp=Math.max(0,grossXp-penaltyTotal),global=globalFromXp(globalXp);
  const mk=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`,spent=monthSpend.get(mk)||0,planned=budget*today.getDate()/dim(today);
  const last=enriched.at(-1)||null;
  return{globalXp,grossXp,penaltyTotal,comebackBonus:comeback,penalties:pen,difficulty,goals,perfectDayBonus:perfect,noSmokingXp:smokeXp,global,attrs,entries:enriched,activeDays:enriched.length,lastEntry:last,
   smoking:{streak:smokeStreak,bestStreak:bestSmoke,todayXp:last?.smokingXpToday||0,status:last?.cigaretteSmoked===false?"SANS CIGARETTE":last?.cigaretteSmoked===true?"RESET":"INCONNU"},
   finance:{monthlyBudget:budget,spentThisMonth:spent,budgetRemaining:Math.max(0,budget-spent),plannedToDate:planned,trajectoryGap:planned-spent},
   sportWeek:{sessions:currentSessions,target:goals.sport,max:7,status:currentSessions>=goals.sport?"OBJECTIF ATTEINT":"EN COURS"},
   rules:{reading:"1 page = 1 XP",learning:"30 min = 20 XP",sport:"1 séance = 40 XP + bonus hebdomadaire",nutrition:"1 repas conforme = 10 XP",work:"1 action utile = 2 XP",finance:"+10 XP si trajectoire respectée",perfectDay:"+50 XP hors dimanche",smoking:"J1–J9 : +5 XP ; J10+ : +10 XP",sunday:"Dimanche : Recovery Day"}}
 }
 window.PlayerEngine={compute,DIFFICULTY,globalFromXp};
})();