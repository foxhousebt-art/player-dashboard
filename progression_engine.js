"use strict";
(function(){
const D={1:{name:"EXPLORATEUR",reward:1.08,penalty:.45,grace:3,comeback:15},2:{name:"ENGAGÉ",reward:1.04,penalty:.75,grace:2,comeback:20},3:{name:"DISCIPLINÉ",reward:1,penalty:1,grace:1,comeback:25},4:{name:"IMPITOYABLE",reward:1,penalty:1.35,grace:0,comeback:35}};
const N=(v,d=0)=>isFinite(+v)?+v:d, iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function dt(s){let a=String(s).slice(0,10).split("-").map(Number);return new Date(a[0],a[1]-1,a[2],12)}
function mon(d){let x=new Date(d),n=x.getDay()||7;x.setDate(x.getDate()-n+1);return x} function sun(d){let x=mon(d);x.setDate(x.getDate()+6);return x}
function dim(d){return new Date(d.getFullYear(),d.getMonth()+1,0).getDate()}
function floor(l){let k=Math.max(0,l-1);return 120*k+5*k*(k-1)}
function global(x){x=Math.max(0,N(x));let l=1;while(l<100&&x>=floor(l+1))l++;let lo=floor(l),hi=l===100?lo:floor(l+1);return{level:l,currentFloor:lo,nextFloor:hi,xpIntoLevel:x-lo,xpNeededForNext:l===100?0:hi-x,progress:l===100?100:Math.round((x-lo)/(hi-lo)*100)}}
function attr(x){x=Math.max(0,Math.round(N(x)));return{xp:x,level:Math.floor(x/100)+1,currentXp:x%100,targetXp:100,progress:x%100}}
function norm(rows){let m=new Map;(rows||[]).forEach(r=>{if(!r||!r.date)return;let date=String(r.date).slice(0,10);m.set(date,{date,pages:Math.max(0,N(r.pages)),learningMinutes:Math.max(0,N(r.learningMinutes)),sport:r.sport===true||r.sport===1||r.sport==="1"||r.sport==="true",compliantMeals:Math.max(0,N(r.compliantMeals)),workActions:Math.max(0,N(r.workActions)),expenses:Math.max(0,N(r.expenses)),cigaretteSmoked:r.cigaretteSmoked===true||r.cigaretteSmoked===1||r.cigaretteSmoked==="1"||r.cigaretteSmoked==="true"?true:r.cigaretteSmoked===false||r.cigaretteSmoked===0||r.cigaretteSmoked==="0"||r.cigaretteSmoked==="false"?false:null})});return[...m.values()].sort((a,b)=>a.date.localeCompare(b.date))}
function compute(rows,s={}){
 let es=norm(rows),now=new Date();now.setHours(12,0,0,0);let dl=Math.max(1,Math.min(4,N(s.difficulty,2))),difficulty={level:dl,...D[dl]};
 let goals={reading:Math.max(1,N(s.readingGoal,10)),learning:Math.max(1,N(s.learningGoal,30)),sport:Math.max(1,Math.min(7,N(s.sportGoal,4))),nutrition:Math.max(1,N(s.nutritionGoal,3)),work:Math.max(1,N(s.workGoal,1))},budget=Math.max(0,N(s.monthlyBudget,1000));
 let raw={lecture:0,apprentissage:0,sport:0,nutrition:0,travail:0,finance:0},p={lecture:0,apprentissage:0,sport:0,nutrition:0,travail:0,finance:0},weeks={},months={},perfect=0,smoke=0,streak=0,best=0,miss=0,comeback=0,en=[];
 es.forEach(e=>{let d=dt(e.date),wk=iso(mon(d)),mk=e.date.slice(0,7);weeks[wk]=weeks[wk]||{start:mon(d),sessions:0};if(e.sport)weeks[wk].sessions++;
 raw.lecture+=e.pages;raw.apprentissage+=Math.floor(e.learningMinutes/30)*20;raw.sport+=e.sport?40:0;raw.nutrition+=e.compliantMeals*10;raw.travail+=e.workActions*2;
 let spent=(months[mk]||0)+e.expenses;months[mk]=spent;let allowed=budget*d.getDate()/dim(d),financeOk=spent<=allowed+.001;if(financeOk)raw.finance+=10;
 let recovery=d.getDay()===0,pd=!recovery&&e.pages>=goals.reading&&e.learningMinutes>=goals.learning&&e.compliantMeals>=goals.nutrition&&e.workActions>=goals.work&&financeOk;if(pd)perfect+=50;
 let sx=0;if(e.cigaretteSmoked===true)streak=0;else if(e.cigaretteSmoked===false){streak++;best=Math.max(best,streak);sx=streak>=10?10:5;smoke+=sx}
 let dayPenalty=0;if(!recovery){let ms=[];if(e.pages===0)ms.push(["lecture",5]);if(e.learningMinutes===0)ms.push(["apprentissage",5]);if(e.compliantMeals===0)ms.push(["nutrition",5]);if(e.workActions===0)ms.push(["travail",5]);if(!financeOk)ms.push(["finance",Math.min(15,5+Math.floor(Math.max(0,spent-allowed)/Math.max(1,budget*.05))*2)]);
 if(ms.length){miss++;let esc=1+Math.min(.5,Math.max(0,miss-difficulty.grace)*.1);ms.forEach(x=>{let q=Math.round(x[1]*difficulty.penalty*esc);p[x[0]]+=q;dayPenalty+=q})}else{if(miss>=2)comeback+=Math.round(difficulty.comeback*(1+Math.min(1,miss/5)));miss=0}}
 en.push({...e,financeOk,perfectDay:pd,recoveryDay:recovery,noSmokingStreak:streak,smokingXpToday:sx,dayPenalty});
 });
 let cw=iso(mon(now)),sessions=weeks[cw]?weeks[cw].sessions:0,bonus=0;Object.keys(weeks).forEach(k=>{let w=weeks[k];if(w.sessions>=goals.sport){let x=w.sessions-goals.sport;bonus+=x===0?40:x===1?60:x===2?80:120}else if(sun(w.start)<now)p.sport+=Math.round(40*difficulty.penalty)});raw.sport+=bonus;
 let gross={},attrs={};Object.keys(raw).forEach(k=>{gross[k]=Math.round(raw[k]*difficulty.reward);attrs[k]=attr(Math.max(0,gross[k]-p[k]))});
 let penaltyTotal=Object.values(p).reduce((a,b)=>a+b,0),grossXp=Object.values(gross).reduce((a,b)=>a+b,0)+perfect+smoke+comeback,globalXp=Math.max(0,grossXp-penaltyTotal);
 let mk=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`,spent=months[mk]||0,planned=budget*now.getDate()/dim(now),last=en.length?en[en.length-1]:null;
 return{globalXp,grossXp,penaltyTotal,comebackBonus:comeback,penalties:p,difficulty,goals,global:global(globalXp),attrs,entries:en,activeDays:en.length,lastEntry:last,perfectDayBonus:perfect,noSmokingXp:smoke,
 smoking:{streak,bestStreak:best,todayXp:last?last.smokingXpToday:0,status:last&&last.cigaretteSmoked===false?"SANS CIGARETTE":last&&last.cigaretteSmoked===true?"RESET":"INCONNU"},
 finance:{monthlyBudget:budget,spentThisMonth:spent,budgetRemaining:Math.max(0,budget-spent),plannedToDate:planned,trajectoryGap:planned-spent},
 sportWeek:{sessions,target:goals.sport,status:sessions>=goals.sport?"OBJECTIF ATTEINT":"EN COURS"}}
}
window.PlayerEngine={compute,DIFFICULTY:D};
})();