"use strict";
(function(){
  var STORAGE_KEY="playerDashboardWorld";
  var WORLDS=[
    {id:"classic",name:"CLASSIC",desc:"Version noire V1.2.3 — référence stable",thumb:""},
    {id:"forest",name:"FORÊT ENCHANTÉE",desc:"Bois, lumière naturelle et rôdeur",thumb:"assets/themes/forest/thumb.jpg"},
    {id:"station",name:"STATION ORBITALE",desc:"Commandement spatial bleu / orange",thumb:"assets/themes/station/thumb.jpg"},
    {id:"ocean",name:"FONDS MARINS",desc:"Atlantis, abysses et bioluminescence",thumb:"assets/themes/ocean/thumb.jpg"},
    {id:"desert",name:"DÉSERT",desc:"Ruines, exploration et lumière solaire",thumb:"assets/themes/desert/thumb.jpg"},
    {id:"inferno",name:"FLAMMES",desc:"Forge, lave et puissance infernale",thumb:"assets/themes/inferno/thumb.jpg"}
  ];
  var VALID={classic:1,forest:1,station:1,ocean:1,desert:1,inferno:1};
  var LABELS={
    forest:["RECRUE DES BOIS","PISTEUR","RÔDEUR ENCHANTÉ","GARDIEN DU BOSQUET","CHAMPION SYLVESTRE"],
    station:["CADET ORBITAL","OPÉRATEUR SYSTÈMES","RÔDEUR ORBITAL","COMMANDANT DE STATION","CHAMPION COSMIQUE"],
    ocean:["RECRUE PLONGEUR","ÉCLAIREUR DU RÉCIF","EXPLORATEUR ABYSSAL","GARDIEN BIOLUMINESCENT","SEIGNEUR DES PROFONDEURS"],
    desert:["ERRANT","ÉCLAIREUR DES DUNES","RAIDER DU DÉSERT","CAPITAINE TEMPÊTE","ROI DES DUNES"],
    inferno:["INITIÉ ÉTINCELLE","COMBATTANT BRAISE","GUERRIER FLAMME","GARDIEN INFERNO","CHAMPION PHÉNIX"]
  };
  var current="classic";
  var level=1;
  var sprite=null;
  var moveUp=false;

  function $(id){return document.getElementById(id)}
  function stageForLevel(n){n=Number(n)||1;if(n>=84)return 5;if(n>=50)return 4;if(n>=20)return 3;if(n>=5)return 2;return 1}
  function queryWorld(){
    try{
      var m=(location.search||"").match(/[?&]theme=([^&]+)/i);
      if(m){var t=decodeURIComponent(m[1]);if(VALID[t])return t}
    }catch(e){}
    return null;
  }
  function savedWorld(){
    var q=queryWorld();
    if(q)return q;
    try{var s=localStorage.getItem(STORAGE_KEY);if(VALID[s])return s}catch(e){}
    return "classic";
  }
  function worldName(id){for(var i=0;i<WORLDS.length;i++)if(WORLDS[i].id===id)return WORLDS[i].name;return id}
  function ensureSprite(){
    if(sprite)return sprite;
    var stage=$("avatarStage");
    if(!stage)return null;
    sprite=document.createElement("div");
    sprite.id="worldAvatarSprite";
    sprite.className="world-avatar-sprite";
    sprite.setAttribute("aria-hidden","true");
    stage.insertBefore(sprite,stage.firstChild);
    return sprite;
  }
  function classicLabel(){
    var el=$("evolutionStage");
    if(!el||!window.CHARACTER_EVOLUTION)return;
    for(var i=0;i<window.CHARACTER_EVOLUTION.length;i++){
      if(level>=window.CHARACTER_EVOLUTION[i].minLevel){el.textContent=window.CHARACTER_EVOLUTION[i].stage;return}
    }
  }
  function showCharacter(){
    var s=ensureSprite();
    var video=$("avatarVideo");
    var label=$("evolutionStage");
    if(current==="classic"){
      if(s){s.style.display="none";s.style.backgroundImage="none"}
      if(video){video.style.display="";try{var p=video.play();if(p&&p.catch)p.catch(function(){})}catch(e){}}
      classicLabel();
      return;
    }
    if(video){try{video.pause()}catch(e){}video.style.display="none"}
    if(!s)return;
    var stage=stageForLevel(level);
    var src="assets/characters/"+current+"/stage_"+stage+".jpg";
    s.style.display="block";
    s.style.backgroundImage="url('"+src+"')";
    if(label&&LABELS[current])label.textContent=LABELS[current][stage-1];
  }
  function apply(id,save){
    if(!VALID[id])id="classic";
    current=id;
    document.body.setAttribute("data-world",id);
    if(save!==false){try{localStorage.setItem(STORAGE_KEY,id)}catch(e){}}
    showCharacter();
    refreshPicker();
    try{window.scrollTo(0,0)}catch(e){}
  }
  function pickerHTML(){
    var h='<div class="world-picker-head"><b>// DESIGNS</b><span>Choisis un univers. Les données et le moteur restent identiques.</span></div><div class="world-picker">';
    for(var i=0;i<WORLDS.length;i++){
      var w=WORLDS[i];
      var cls='world-choice'+(w.id===current?' active':'');
      var style=w.thumb?' style="background-image:url(\''+w.thumb+'\')"':'';
      h+='<button type="button" class="'+cls+'" data-world-choice="'+w.id+'"'+style+'><span class="world-choice-shade"></span><b>'+w.name+'</b><small>'+w.desc+'</small></button>';
    }
    return h+'</div><p class="world-picker-foot">Design actuel : <strong id="currentWorldName">'+worldName(current)+'</strong></p>';
  }
  function mountPicker(root){
    if(!root)return;
    root.innerHTML=pickerHTML();
    var btns=root.querySelectorAll("[data-world-choice]");
    for(var i=0;i<btns.length;i++)btns[i].onclick=function(){
      apply(this.getAttribute("data-world-choice"),true);
      var msg=$("panelMsg");if(msg)msg.textContent="DESIGN APPLIQUÉ — "+worldName(current);
    };
    refreshPicker();
  }
  function refreshPicker(){
    var all=document.querySelectorAll("[data-world-choice]");
    for(var i=0;i<all.length;i++){
      if(all[i].getAttribute("data-world-choice")===current)all[i].classList.add("active");
      else all[i].classList.remove("active");
    }
    var n=$("currentWorldName");if(n)n.textContent=worldName(current);
  }
  function onData(e){
    if(e&&e.detail&&e.detail.global){level=Number(e.detail.global.level)||1;showCharacter()}
  }
  function startLightMotion(){
    setInterval(function(){
      if(current==="classic"||!sprite||sprite.style.display==="none")return;
      moveUp=!moveUp;
      var y=moveUp?-2:0;
      sprite.style.marginTop=y+"px";
    },1100);
  }
  function init(){
    ensureSprite();
    if(window.PLAYER_SNAPSHOT&&window.PLAYER_SNAPSHOT.global)level=Number(window.PLAYER_SNAPSHOT.global.level)||1;
    apply(savedWorld(),false);
    startLightMotion();
  }
  window.addEventListener("player-data-update",onData,false);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,false);else init();
  window.PlayerWorlds={set:apply,get:function(){return current},name:worldName,mountPicker:mountPicker,list:function(){return WORLDS.slice(0)},refreshCharacter:showCharacter};
})();
