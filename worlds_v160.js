"use strict";
(function(){
  var STORAGE_KEY="playerDashboardWorld";
  var WORLDS=[
    {id:"classic",name:"CLASSIC",desc:"Dashboard noir stable",thumb:""},
    {id:"forest",name:"FORÊT ENCHANTÉE",desc:"Référence forêt approuvée",thumb:"assets/reference/forest/reference.jpg"},
    {id:"station",name:"STATION ORBITALE",desc:"Référence NEXUS approuvée",thumb:"assets/reference/station/reference.jpg"},
    {id:"ocean",name:"ATLANTIS NÉON",desc:"Référence fonds marins approuvée",thumb:"assets/reference/ocean/reference.jpg"},
    {id:"desert",name:"DÉSERT",desc:"Référence ruines désertiques approuvée",thumb:"assets/reference/desert/reference.jpg"},
    {id:"inferno",name:"FLAMMES",desc:"Référence infernale approuvée",thumb:"assets/reference/inferno/reference.jpg"}
  ];
  var VALID={classic:1,forest:1,station:1,ocean:1,desert:1,inferno:1};
  var LABELS={
    forest:["RECRUE DES BOIS","PISTEUR","RÔDEUR ENCHANTÉ","GARDIEN DU BOSQUET","CHAMPION SYLVESTRE"],
    station:["CADET ORBITAL","OPÉRATEUR SYSTÈMES","RÔDEUR ORBITAL","COMMANDANT DE STATION","CHAMPION COSMIQUE"],
    ocean:["RECRUE PLONGEUR","ÉCLAIREUR DU RÉCIF","EXPLORATEUR ABYSSAL","GARDIEN BIOLUMINESCENT","SEIGNEUR DES PROFONDEURS"],
    desert:["ERRANT","ÉCLAIREUR DES DUNES","RAIDER DU DÉSERT","CAPITAINE TEMPÊTE","ROI DES DUNES"],
    inferno:["INITIÉ ÉTINCELLE","COMBATTANT BRAISE","GUERRIER FLAMME","GARDIEN INFERNO","CHAMPION PHÉNIX"]
  };
  var current="classic", level=1, sprite=null, menuArt=null, lastSnapshot=null, motionStarted=false;
  function $(id){return document.getElementById(id)}
  function stageForLevel(n){n=Number(n)||1;if(n>=84)return 5;if(n>=50)return 4;if(n>=20)return 3;if(n>=5)return 2;return 1}
  function queryWorld(){try{var m=(location.search||"").match(/[?&]theme=([^&]+)/i);if(m){var t=decodeURIComponent(m[1]);if(VALID[t])return t}}catch(e){}return null}
  function savedWorld(){var q=queryWorld();if(q)return q;try{var s=localStorage.getItem(STORAGE_KEY);if(VALID[s])return s}catch(e){}return "classic"}
  function worldName(id){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===id)return WORLDS[i].name;return id}
  function ensureSprite(){
    if(sprite)return sprite;
    var stage=$("avatarStage"); if(!stage)return null;
    sprite=document.createElement("div");
    sprite.id="worldAvatarSprite";
    sprite.className="world-avatar-sprite-v150";
    sprite.setAttribute("aria-hidden","true");
    stage.insertBefore(sprite,stage.firstChild);
    return sprite;
  }
  function ensureMenuArt(){
    if(menuArt) return menuArt;
    var menu=document.querySelector(".ps4-menu");
    if(!menu) return null;
    menuArt=document.createElement("div");
    menuArt.id="worldMenuArt";
    menuArt.className="world-menu-art-v160";
    menuArt.setAttribute("aria-hidden","true");
    menu.appendChild(menuArt);
    return menuArt;
  }
  function ensureWorldPanels(){
    var hud=$("hud"); if(!hud) return;
    if(!$("worldGlobalSummary")){
      var a=document.createElement("section");a.id="worldGlobalSummary";a.className="world-global-summary-v160 panel";hud.appendChild(a);
    }
    if(!$("worldReward")){
      var b=document.createElement("section");b.id="worldReward";b.className="world-reward-v160 panel";hud.appendChild(b);
    }
  }
  function cardPercent(x){x=Number(x)||0;return Math.max(0,Math.min(100,x));}
  function renderExtras(snapshot){
    if(!snapshot) return; lastSnapshot=snapshot; ensureWorldPanels();
    var sum=$("worldGlobalSummary"), rew=$("worldReward");
    var domainCount=(current==="forest"||current==="desert"||current==="inferno")?8:6;
    if(sum) sum.innerHTML='<div class="section-title">// RÉSUMÉ GLOBAL</div><div class="wg-row"><span>XP TOTALE</span><b>'+snapshot.globalXp+' / '+(snapshot.global.level>=100?snapshot.globalXp:snapshot.global.nextFloor)+'</b></div><div class="wg-bar"><i style="width:'+snapshot.global.progress+'%"></i></div><div class="wg-row"><span>DOMAINES ACTIFS</span><b>'+domainCount+' / '+domainCount+'</b></div><div class="wg-row"><span>SÉRIE ACTUELLE</span><b>'+(snapshot.activeDays?1:0)+' jour</b></div><div class="wg-row"><span>MEILLEURE SÉRIE</span><b>'+(snapshot.activeDays?1:0)+' jour</b></div>';
    if(rew){var nl=Math.min(100,snapshot.global.level+1);rew.innerHTML='<div class="section-title">// PROCHAINE RÉCOMPENSE</div><div class="reward-main"><span class="reward-gift">◆</span><div><strong>NIVEAU '+String(nl).padStart(2,"0")+'</strong><small>UN PAS DE PLUS</small></div></div><div class="wg-bar"><i style="width:'+snapshot.global.progress+'%"></i></div><div class="reward-foot"><span>'+snapshot.globalXp+' XP</span><b>'+snapshot.global.xpNeededForNext+' XP restants</b></div>';}
    var grid=$("statGrid"); if(!grid) return;
    var old=grid.querySelectorAll(".world-extra-card-v160");for(var i=0;i<old.length;i++)old[i].parentNode.removeChild(old[i]);
    var themed=current==="forest"||current==="desert"||current==="inferno";
    var cards=grid.querySelectorAll(".stat-card");
    if(cards[4]&&cards[4].querySelector("h3"))cards[4].querySelector("h3").textContent=themed?"RECHERCHE D’EMPLOI":"TRAVAIL";
    if(cards[5]&&cards[5].querySelector("h3"))cards[5].querySelector("h3").textContent=themed?"ARGENT":"FINANCE";
    if(themed){
      var smoke=snapshot.smoking||{streak:0,todayXp:0};var sx=Math.max(0,Number(snapshot.noSmokingXp)||0);var sp=sx%100;
      var c=document.createElement("article");c.className="stat-card world-extra-card-v160 smoke-card-v160";c.dataset.tone="amber";c.innerHTML='<div class="icon">⊘</div><div><h3>SANS CIGARETTE</h3><div class="lvl">NIV. '+String(Math.floor(sx/100)+1).padStart(2,"0")+'</div><div class="xp">'+sp+' / 100 XP <span class="pct">'+sp+'%</span></div><div class="bar"><i style="width:'+sp+'%"></i></div></div><div class="detail"><span>DERNIÈRE SAISIE</span><b>'+smoke.todayXp+' XP</b><span>JOURS SANS TABAC</span><b>'+smoke.streak+' jours</b></div>';grid.appendChild(c);
      var rd=(snapshot.entries||[]).filter(function(e){return e.recoveryDay}).length;var rp=Math.min(100,Math.round(rd/52*100));
      var r=document.createElement("article");r.className="stat-card world-extra-card-v160 rest-card-v160";r.dataset.tone="cyan";r.innerHTML='<div class="icon">◒</div><div><h3>REPOS</h3><div class="lvl">SUIVI</div><div class="xp">'+rd+' JOURS <span class="pct">'+rp+'%</span></div><div class="bar"><i style="width:'+rp+'%"></i></div></div><div class="detail"><span>RECOVERY DAYS</span><b>'+rd+'</b><span>AUJOURD’HUI</span><b>'+(snapshot.lastEntry&&snapshot.lastEntry.recoveryDay?"REPOS":"ACTIF")+'</b></div>';grid.appendChild(r);
    }
  }
  function startWorldMotion(){
    if(motionStarted)return;motionStarted=true;var raf=window.requestAnimationFrame||window.webkitRequestAnimationFrame;
    function frame(t){if(!t)t=Date.now();if(current!=="classic"&&sprite&&sprite.style.display!=="none"){var sec=t/1000,breath=Math.sin(sec*2.55),y=-1.5-breath*2.5,sx=1.012+(breath+1)*.003,sy=1.012+(breath+1)*.005;var tr="translate3d(0,"+y.toFixed(2)+"px,0) scale3d("+sx.toFixed(4)+","+sy.toFixed(4)+",1)";sprite.style.webkitTransform=tr;sprite.style.transform=tr;}if(raf)raf(frame);else setTimeout(function(){frame(Date.now())},33)}
    frame(Date.now());
  }
  function classicLabel(){
    var el=$("evolutionStage");
    if(!el||!window.CHARACTER_EVOLUTION)return;
    for(var i=0;i<window.CHARACTER_EVOLUTION.length;i++){
      if(level>=window.CHARACTER_EVOLUTION[i].minLevel){el.textContent=window.CHARACTER_EVOLUTION[i].stage;return}
    }
  }
  function showCharacter(){
    var s=ensureSprite(), video=$("avatarVideo"), label=$("evolutionStage");
    if(current==="classic"){
      if(s){s.style.display="none";s.style.backgroundImage="none"}
      if(video){video.style.display="";try{var p=video.play();if(p&&p.catch)p.catch(function(){})}catch(e){}}
      classicLabel();
      return;
    }
    if(video){try{video.pause()}catch(e){}video.style.display="none"}
    if(!s)return;
    var stage=stageForLevel(level);
    s.style.display="block";
    s.style.backgroundImage="url('assets/reference/"+current+"/avatar/stage_"+stage+".jpg')";
    if(label&&LABELS[current])label.textContent=LABELS[current][stage-1];
  }
  function apply(id,save){
    if(!VALID[id])id="classic";
    current=id;
    document.body.setAttribute("data-world",id);
    ensureMenuArt(); ensureWorldPanels();
    if(save!==false){try{localStorage.setItem(STORAGE_KEY,id)}catch(e){}}
    showCharacter();renderExtras(lastSnapshot);refreshPicker();try{window.scrollTo(0,0)}catch(e){}
  }
  function pickerHTML(){
    var h='<div class="world-picker-head"><b>// DESIGNS</b><span>Le moteur et les données restent identiques.</span></div><div class="world-picker">';
    for(var i=0;i<WORLDS.length;i++){
      var w=WORLDS[i], cls='world-choice'+(w.id===current?' active':'');
      var style=w.thumb?' style="background-image:url(\''+w.thumb+'\')"':'';
      h+='<button type="button" class="'+cls+'" data-world-choice="'+w.id+'"'+style+'><span class="world-choice-shade"></span><b>'+w.name+'</b><small>'+w.desc+'</small></button>';
    }
    return h+'</div><p class="world-picker-foot">Design actuel : <strong id="currentWorldName">'+worldName(current)+'</strong></p>';
  }
  function mountPicker(root){
    if(!root)return; root.innerHTML=pickerHTML();
    var btns=root.querySelectorAll("[data-world-choice]");
    for(var i=0;i<btns.length;i++)btns[i].onclick=function(){apply(this.getAttribute("data-world-choice"),true);var msg=$("panelMsg");if(msg)msg.textContent="DESIGN APPLIQUÉ — "+worldName(current)};
    refreshPicker();
  }
  function refreshPicker(){
    var all=document.querySelectorAll("[data-world-choice]");
    for(var i=0;i<all.length;i++){
      if(all[i].getAttribute("data-world-choice")===current)all[i].classList.add("active");else all[i].classList.remove("active");
    }
    var n=$("currentWorldName");if(n)n.textContent=worldName(current);
  }
  function onData(e){if(e&&e.detail&&e.detail.global){lastSnapshot=e.detail;level=Number(e.detail.global.level)||1;showCharacter();renderExtras(e.detail)}}
  function init(){ensureSprite();ensureMenuArt();ensureWorldPanels();startWorldMotion();if(window.PLAYER_SNAPSHOT&&window.PLAYER_SNAPSHOT.global){lastSnapshot=window.PLAYER_SNAPSHOT;level=Number(window.PLAYER_SNAPSHOT.global.level)||1}apply(savedWorld(),false);renderExtras(lastSnapshot)}
  window.addEventListener("player-data-update",onData,false);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,false);else init();
  window.PlayerWorlds={set:apply,get:function(){return current},name:worldName,mountPicker:mountPicker,list:function(){return WORLDS.slice(0)},refreshCharacter:showCharacter};
})();
