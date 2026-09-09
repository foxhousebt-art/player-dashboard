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
  setText("date","DATE : "+n.toLocaleDateString("fr-FR").split("/").join("."));
  setText("time","HEURE : "+n.toLocaleTimeString("fr-FR"));
}

/* =========================================================
   V0.5.9 — PS4 NATIVE MOTION ENGINE
   Old WebKit fallback: no CSS animation dependency.
   One avatar + one light layer, transform/opacity only.
   ========================================================= */
var ps4MotionStarted = false;
var ps4MotionRAF = null;
var ps4MotionLast = 0;
var ps4GestureUntil = 0;
var ps4GestureType = 0;
var ps4NextGesture = 0;

function ps4Now(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
function ps4RAF(fn){
  var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
  if(raf) return raf(fn);
  return setTimeout(function(){ fn(ps4Now()); },33);
}
function startPs4NativeMotion(){
  if(ps4MotionStarted) return;
  ps4MotionStarted = true;
  ps4NextGesture = ps4Now() + 5000;
  var avatar = $("avatar");
  var sweep = $("ps4LightSweep");
  var corners = document.querySelector(".player-corners");
  if(avatar){
    avatar.style.webkitTransformOrigin = "50% 88%";
    avatar.style.transformOrigin = "50% 88%";
  }
  function frame(t){
    if(!t) t = ps4Now();
    if(t - ps4MotionLast >= 30){
      ps4MotionLast = t;
      var sec = t / 1000;
      var breath = Math.sin(sec * 2.55);
      var y = -1.5 - breath * 2.5;
      var sx = 1 + (breath + 1) * 0.0035;
      var sy = 1 + (breath + 1) * 0.006;
      var x = 0, rot = 0;

      if(t >= ps4NextGesture && t >= ps4GestureUntil){
        ps4GestureType = Math.random() < 0.55 ? 1 : 2;
        ps4GestureUntil = t + 1450;
        ps4NextGesture = t + 6500 + Math.random()*4500;
      }
      if(t < ps4GestureUntil){
        var gp = 1 - ((ps4GestureUntil - t) / 1450);
        var wave = Math.sin(gp * Math.PI * 2);
        if(ps4GestureType === 1){
          x = -2.2 + wave*1.4; rot = -0.7 + wave*0.4; y -= Math.sin(gp*Math.PI)*2;
        }else{
          x = wave*3.2; rot = wave*0.65; y -= Math.sin(gp*Math.PI)*2.5;
        }
      }

      if(avatar){
        var tr = "translate3d("+x.toFixed(2)+"px,"+y.toFixed(2)+"px,0) rotate("+rot.toFixed(2)+"deg) scale3d("+sx.toFixed(4)+","+sy.toFixed(4)+",1)";
        avatar.style.webkitTransform = tr;
        avatar.style.transform = tr;
      }

      if(sweep){
        var cycle = (t % 9000) / 9000;
        var pos = -5 + cycle * 520;
        var op = (cycle < .10 || cycle > .92) ? 0 : Math.min(.72, Math.sin((cycle-.10)/.82*Math.PI)*.72);
        var st = "translate3d("+pos.toFixed(1)+"%,0,0)";
        sweep.style.webkitTransform = st;
        sweep.style.transform = st;
        sweep.style.opacity = op.toFixed(3);
      }

      if(corners){
        corners.style.opacity = (0.55 + ((breath+1)/2)*0.35).toFixed(3);
      }
    }
    ps4MotionRAF = ps4RAF(frame);
  }
  ps4MotionRAF = ps4RAF(frame);
}
/* ========================================================= */

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
  startPs4NativeMotion();
  resizeCanvas();
  tickClock();
  setInterval(tickClock,1000);
});

console.log("SYSTEME PLAYER V0.5.9 PS4 — native motion chargé");

/* V0.6.0 PS4 VIDEO MODE ENGINE */
var ps4VideoKey="",ps4VideoReturnTimer=null;
function startPs4NativeMotion(){}
function ps4EvolutionKey(e){var f=((e&&e.sprite)||"sprites/brian_lvl_001_base.png").split("/").pop();return f.replace(/\.png$/i,"");}
function ps4SetVideo(key,kind,loop){var v=$("avatarVideo");if(!v)return;var src="ps4_media/"+key+"_"+kind+".mp4?v=060";if(v.getAttribute("data-src")!==src){v.setAttribute("data-src",src);v.loop=!!loop;v.src=src;try{v.load()}catch(e){}}else v.loop=!!loop;var b=$("videoStartButton");function ok(){if(b)b.classList.remove("show")}function fail(){if(b)b.classList.add("show")}try{var r=v.play();if(r&&typeof r.then==="function")r.then(ok).catch(fail);else setTimeout(function(){v.paused?fail():ok()},500)}catch(e){fail()}}
function updateCharacterSprite(level){var e=getCharacterEvolution(level);setText("evolutionStage",e.stage);var k=ps4EvolutionKey(e);if(k===ps4VideoKey)return;ps4VideoKey=k;ps4SetVideo(k,"idle",true)}
function ensureLivingCharacter(level){updateCharacterSprite(level)}
function playLivingLevelUp(level){var e=getCharacterEvolution(level),k=ps4EvolutionKey(e);ps4VideoKey=k;if(ps4VideoReturnTimer)clearTimeout(ps4VideoReturnTimer);ps4SetVideo(k,"levelup",false);ps4VideoReturnTimer=setTimeout(function(){ps4SetVideo(k,"idle",true)},1900)}
window.addEventListener("DOMContentLoaded",function(){var b=$("videoStartButton"),v=$("avatarVideo");if(b&&v){b.addEventListener("click",function(){try{var p=v.play();if(p&&p.catch)p.catch(function(){});b.classList.remove("show")}catch(e){}});setTimeout(function(){if(v.paused)b.classList.add("show")},1000)}});
console.log("SYSTEME PLAYER V0.6.0 PS4 — video mode chargé");
