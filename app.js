"use strict";

const CHARACTER_EVOLUTION = window.CHARACTER_EVOLUTION || [];
const $ = id => document.getElementById(id);

let currentCharacterStage = "";
let currentSnapshot = null;
let renderedGlobalLevel = null;

function setText(id, value){
  const el = $(id);
  if(el) el.textContent = value;
}

function formatEuro(n){
  return new Intl.NumberFormat("fr-FR",{
    style:"currency",
    currency:"EUR",
    minimumFractionDigits:Number.isInteger(Number(n)) ? 0 : 2
  }).format(Number(n)||0);
}

function getCharacterEvolution(level){
  return CHARACTER_EVOLUTION.find(s=>level>=s.minLevel)
    || CHARACTER_EVOLUTION[CHARACTER_EVOLUTION.length-1]
    || {sprite:"avatar_brian.png",stage:"RECRUE"};
}

function updateCharacterSprite(level){
  const avatar = $("avatar");
  if(!avatar) return;

  const evolution = getCharacterEvolution(level);
  setText("evolutionStage", evolution.stage);

  if(currentCharacterStage === evolution.stage) return;
  currentCharacterStage = evolution.stage;

  avatar.classList.add("sprite-transition-out");
  const preload = new Image();

  preload.onload = ()=>{
    setTimeout(()=>{
      avatar.src = evolution.sprite;
      avatar.classList.remove("sprite-transition-out");
      avatar.classList.add("sprite-transition-in");
      setTimeout(()=>avatar.classList.remove("sprite-transition-in"),650);
    },120);
  };
  preload.src = evolution.sprite;
}

function rankForLevel(level){
  if(level>=100) return "TRANSCENDANT";
  if(level>=95) return "PRÉ-TRANSCENDANT";
  if(level>=84) return "ASCENDANT II";
  if(level>=75) return "ASCENDANT";
  if(level>=62) return "MAÎTRE SUP.";
  if(level>=50) return "MAÎTRE";
  if(level>=35) return "ÉLITE";
  if(level>=20) return "VÉTÉRAN";
  if(level>=17) return "AGUERRI";
  if(level>=10) return "COMBATTANT";
  if(level>=5) return "DÉTERMINÉ";
  return "NOVICE I";
}

function attrDescriptor(key){
  return {
    lecture:{label:"LECTURE",icon:"▣",tone:"cyan"},
    apprentissage:{label:"APPRENTISSAGE",icon:"✺",tone:"purple"},
    sport:{label:"SPORT",icon:"↔",tone:"red"},
    nutrition:{label:"NUTRITION",icon:"●",tone:"green"},
    travail:{label:"TRAVAIL",icon:"▰",tone:"amber"},
    finance:{label:"FINANCE",icon:"$",tone:"green"}
  }[key];
}

function todayDetails(snapshot, key){
  const e = snapshot.lastEntry;
  if(!e) return {today:"0 XP",label:"AUCUNE SAISIE",detail:"—"};

  switch(key){
    case "lecture":
      return {today:`${e.pages} XP`,label:"PAGES LUES",detail:`${e.pages} pages`};
    case "apprentissage":
      return {today:`${Math.floor(e.learningMinutes/30)*20} XP`,label:"TEMPS D’APPRENTISSAGE",detail:`${e.learningMinutes} min`};
    case "sport":
      return {
        today:e.sport ? "40 XP" : "0 XP",
        label:"SEMAINE SPORT",
        detail:`${snapshot.sportWeek.sessions} / 4 • ${snapshot.sportWeek.status}`
      };
    case "nutrition":
      return {today:`${e.compliantMeals*10} XP`,label:"REPAS CONFORMES",detail:`${e.compliantMeals} / 3`};
    case "travail":
      return {today:`${e.workActions*2} XP`,label:"ACTIONS UTILES",detail:String(e.workActions)};
    case "finance":
      return {today:e.financeOk ? "10 XP" : "0 XP",label:"TRAJECTOIRE",detail:e.financeOk ? "RESPECTÉE" : "DÉPASSÉE"};
  }
}

function renderSnapshot(snapshot){
  currentSnapshot = snapshot;
  const g = snapshot.global;
  const rank = rankForLevel(g.level);

  setText("globalLevel", String(g.level).padStart(2,"0"));
  setText("globalXp", snapshot.globalXp);
  setText("globalXpTarget", g.level >= 100 ? snapshot.globalXp : g.nextFloor);
  setText("xpRemaining", g.xpNeededForNext);
  setText("rank", rank);
  setText("profileRank", rank);
  setText("totalXp", snapshot.globalXp);
  setText("activeDays", snapshot.activeDays);

  // Streak complet sera calculé côté moteur dans une prochaine itération.
  setText("streak", snapshot.activeDays ? 1 : 0);
  setText("bestStreak", snapshot.activeDays ? 1 : 0);
  setText("record", snapshot.activeDays);

  const globalBar = $("globalXpBar");
  if(globalBar) globalBar.style.width = g.progress + "%";

  updateCharacterSprite(g.level);

  const grid = $("statGrid");
  if(grid){
    grid.innerHTML = "";
    ["lecture","apprentissage","sport","nutrition","travail","finance"].forEach(key=>{
      const a = snapshot.attrs[key];
      const d = attrDescriptor(key);
      const t = todayDetails(snapshot,key);

      const card = document.createElement("article");
      card.className = "stat-card";
      card.dataset.tone = d.tone;
      card.innerHTML = `
        <div class="icon">${d.icon}</div>
        <div>
          <h3>${d.label}</h3>
          <div class="lvl">NIV. ${String(a.level).padStart(2,"0")}</div>
          <div class="xp">${a.currentXp} / ${a.targetXp} XP <span class="pct">${Math.round(a.progress)}%</span></div>
          <div class="bar"><i style="width:${a.progress}%"></i></div>
        </div>
        <div class="detail">
          <span>DERNIÈRE SAISIE</span><b>${t.today}</b>
          <span>${t.label}</span><b>${t.detail}</b>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  const f = snapshot.finance;
  setText("budgetMonthly",formatEuro(f.monthlyBudget));
  setText("spentTotal",formatEuro(f.spentThisMonth));
  setText("budgetRemaining",formatEuro(f.budgetRemaining));
  setText("spentToDate",formatEuro(f.spentThisMonth));
  setText("plannedToDate",formatEuro(f.plannedToDate));

  const gapText = (f.trajectoryGap>=0?"+":"") + formatEuro(f.trajectoryGap);
  setText("trajectoryGap",gapText);
  setText("gapDetail",gapText);

  ["trajectoryGap","gapDetail"].forEach(id=>{
    const el=$(id);
    if(el) el.className=f.trajectoryGap>=0?"good":"bad";
  });

  const marker=$("trajectoryMarker");
  if(marker){
    marker.style.left = Math.max(5,Math.min(95,50+(f.trajectoryGap/Math.max(1,f.monthlyBudget))*100))+"%";
  }

  // Discipline I : niveau 3 dans les 6 fondamentaux.
  const skillRows=$("skillRows");
  let completed=0;
  if(skillRows){
    skillRows.innerHTML="";
    ["lecture","apprentissage","sport","nutrition","travail","finance"].forEach(key=>{
      const a=snapshot.attrs[key];
      const d=attrDescriptor(key);
      const passed=a.level>=3;
      if(passed) completed++;
      const row=document.createElement("div");
      row.className="skill-row";
      row.innerHTML=`<span>${d.label}</span><b>Niveau ${a.level} / 3</b><b class="${passed?"ok":"x"}">${passed?"✓":"✕"}</b>`;
      skillRows.appendChild(row);
    });
  }
  setText("skillProgressText",`${completed} / 6`);
  if($("skillBar")) $("skillBar").style.width=(completed/6*100)+"%";

  const keys=["lecture","apprentissage","sport","nutrition","travail","finance"];
  const priority=keys.map(key=>({key,a:snapshot.attrs[key]}))
    .sort((x,y)=>(x.a.level+x.a.progress/100)-(y.a.level+y.a.progress/100))[0];
  const pd=attrDescriptor(priority.key);
  setText("priorityName",pd.label);
  setText("priorityPct",Math.round(priority.a.progress)+"%");
  if($("priorityBar")) $("priorityBar").style.width=priority.a.progress+"%";

  const online=document.querySelector(".online");
  if(online){
    const mode=(window.PLAYER_CONFIG && window.PLAYER_CONFIG.WEB_APP_URL) ? "SYNC CLOUD" : "MODE LOCAL";
    const smoke=snapshot.smoking||{streak:0,todayXp:0};
    const recovery=snapshot.lastEntry&&snapshot.lastEntry.recoveryDay ? " • RECOVERY DAY" : "";
    online.textContent=`● SYSTEME EN LIGNE — ${mode} • 🚭 ${smoke.streak}J +${smoke.todayXp}XP${recovery}`;
  }

  // Animation uniquement lorsqu'un nouveau snapshot fait réellement monter le niveau.
  if(renderedGlobalLevel !== null && g.level > renderedGlobalLevel){
    showLevelUp(g.level);
  }
  renderedGlobalLevel = g.level;
}

function tickClock(){
  const n=new Date();
  setText("date","DATE : "+n.toLocaleDateString("fr-FR").replaceAll("/","."));
  setText("time","HEURE : "+n.toLocaleTimeString("fr-FR"));
}

/* ---------- FX ---------- */
const canvas=$("fxCanvas");
const ctx=canvas?canvas.getContext("2d"):null;
let particles=[],raf=null;

function resizeCanvas(){
  if(!canvas)return;
  canvas.width=innerWidth; canvas.height=innerHeight;
}
function burst(){
  if(!ctx)return;
  const colors=["#d8ddc8","#96ad7c","#78d06c","#c69a43","#79c4ca"];
  for(let b=0;b<7;b++){
    const cx=innerWidth*(.2+Math.random()*.6),cy=innerHeight*(.12+Math.random()*.45);
    for(let i=0;i<38;i++){
      const a=Math.random()*Math.PI*2,s=1.4+Math.random()*4.4;
      particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c:colors[Math.floor(Math.random()*colors.length)]});
    }
  }
  if(!raf) animateFx();
}
function animateFx(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.vy+=.035;p.vx*=.992;p.life-=.013;
    ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,2,2);
  });
  particles=particles.filter(p=>p.life>0);ctx.globalAlpha=1;
  if(particles.length) raf=requestAnimationFrame(animateFx);
  else {ctx.clearRect(0,0,canvas.width,canvas.height);raf=null;}
}
function showLevelUp(level){
  setText("levelUpNumber",String(level).padStart(2,"0"));
  const overlay=$("levelUp");
  if(overlay){
    overlay.classList.add("show");
    setTimeout(()=>overlay.classList.remove("show"),2800);
  }
  burst();
}

/* Dev keys are visual tests only. They DO NOT alter stored XP. */
function devKeyboard(e){
  if(!(window.PLAYER_CONFIG||{}).DEV_MODE) return;
  const key=(e.key||"").toLowerCase();
  if(key==="l" && currentSnapshot){
    e.preventDefault();
    const fakeLevel=Math.min(100,(renderedGlobalLevel||currentSnapshot.global.level)+1);
    renderedGlobalLevel=fakeLevel;
    setText("globalLevel",String(fakeLevel).padStart(2,"0"));
    setText("rank",rankForLevel(fakeLevel));
    setText("profileRank",rankForLevel(fakeLevel));
    updateCharacterSprite(fakeLevel);
    showLevelUp(fakeLevel);
  }
  if(key==="r" && currentSnapshot){
    e.preventDefault();
    renderedGlobalLevel=currentSnapshot.global.level;
    renderSnapshot(currentSnapshot);
  }
}

window.addEventListener("player-data-update",e=>renderSnapshot(e.detail));
window.addEventListener("resize",resizeCanvas);
window.addEventListener("keydown",devKeyboard,true);
window.addEventListener("DOMContentLoaded",()=>{
  resizeCanvas();
  tickClock();
  setInterval(tickClock,1000);
});

console.log("SYSTEME PLAYER V0.5 — automatisation XP chargée");
