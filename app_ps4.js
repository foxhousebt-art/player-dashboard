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

  /* Si le bon sprite est déjà affiché, ne lance aucune transition. */
  const currentSrc = avatar.getAttribute("src") || "";
  if(currentCharacterStage === evolution.stage && currentSrc === evolution.sprite){
    avatar.classList.remove("sprite-transition-out","sprite-transition-in");
    avatar.style.opacity = "1";
    return;
  }

  /* Premier affichage : on affiche directement le sprite, sans fondu. */
  if(!currentCharacterStage){
    currentCharacterStage = evolution.stage;
    avatar.src = evolution.sprite;
    avatar.classList.remove("sprite-transition-out","sprite-transition-in");
    avatar.style.opacity = "1";
    return;
  }

  /* Changement réel de forme : transition courte, mais jamais bloquante. */
  currentCharacterStage = evolution.stage;
  avatar.classList.add("sprite-transition-out");

  const preload = new Image();

  const restoreOpaque = ()=>{
    avatar.classList.remove("sprite-transition-out","sprite-transition-in");
    avatar.style.opacity = "1";
  };

  preload.onload = ()=>{
    setTimeout(()=>{
      avatar.src = evolution.sprite;
      avatar.classList.remove("sprite-transition-out");
      avatar.classList.add("sprite-transition-in");
      avatar.style.opacity = "1";
      setTimeout(restoreOpaque,650);
    },120);
  };

  preload.onerror = ()=>{
    /* Si un sprite manque ou ne charge pas, le personnage ne reste jamais transparent. */
    restoreOpaque();
  };

  preload.src = evolution.sprite;

  /* Sécurité supplémentaire : aucune transition ne peut rester bloquée. */
  setTimeout(()=>{
    if(avatar.classList.contains("sprite-transition-out")){
      restoreOpaque();
    }
  },1500);
}


/* =========================================================
   V0.5.8 — PS4 BALANCED CHARACTER ENGINE
   One sprite only. Motion is compositor-friendly transforms,
   so the old PS4 browser never has to decode/swap frames.
   ========================================================= */
let ps4CharacterLevel = null;
let ps4GestureTimer = null;

function ensureLivingCharacter(level){
  updateCharacterSprite(level);
  const avatar = $("avatar");
  if(!avatar) return;
  avatar.classList.add("ps4-breathe");
  if(ps4CharacterLevel !== level){
    ps4CharacterLevel = level;
    schedulePs4Gesture();
  }
}

function schedulePs4Gesture(){
  if(ps4GestureTimer) clearTimeout(ps4GestureTimer);
  const delay = 6500 + Math.floor(Math.random()*5500);
  ps4GestureTimer = setTimeout(()=>{
    const avatar = $("avatar");
    if(!avatar) return;
    avatar.classList.remove("ps4-think","ps4-move");
    void avatar.offsetWidth;
    avatar.classList.add(Math.random()<0.55 ? "ps4-think" : "ps4-move");
    setTimeout(()=>{
      avatar.classList.remove("ps4-think","ps4-move");
      schedulePs4Gesture();
    },1650);
  },delay);
}

function playLivingLevelUp(level){
  updateCharacterSprite(level);
  const avatar = $("avatar");
  if(!avatar) return;
  avatar.classList.remove("ps4-levelup");
  void avatar.offsetWidth;
  avatar.classList.add("ps4-levelup");
  setTimeout(()=>avatar.classList.remove("ps4-levelup"),1000);
}
/* ========================================================= */

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

  ensureLivingCharacter(g.level);

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
    playLivingLevelUp(g.level);
  }
  renderedGlobalLevel = g.level;
}

function tickClock(){
  const n=new Date();
  setText("date","DATE : "+n.toLocaleDateString("fr-FR").replaceAll("/","."));
  setText("time","HEURE : "+n.toLocaleTimeString("fr-FR"));
}

/* ---------- PS4 FX ---------- */
function resizeCanvas(){ /* disabled on PS4 */ }
function showLevelUp(level){
  setText("levelUpNumber",String(level).padStart(2,"0"));
  const overlay=$("levelUp");
  if(overlay){
    overlay.classList.add("show");
    setTimeout(()=>overlay.classList.remove("show"),1800);
  }
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

console.log("SYSTEME PLAYER V0.5.7 PS4 — mode léger chargé");
