"use strict";
(function(){
  var STORAGE_KEY="playerDashboardTheme";
  var VALID={classic:1,forest:1,station:1,ocean:1,desert:1,inferno:1};
  var THEMES=[
    {id:"classic",name:"CLASSIC",desc:"Dashboard noir V1.2.3 — intact",thumb:""},
    {id:"forest",name:"FORÊT ENCHANTÉE",desc:"Bois, magie et progression organique",thumb:"assets/themes/forest/thumb.jpg"},
    {id:"station",name:"STATION ORBITALE",desc:"Commandement spatial bleu / orange",thumb:"assets/themes/station/thumb.jpg"},
    {id:"ocean",name:"FONDS MARINS",desc:"Atlantis, abysses et bioluminescence",thumb:"assets/themes/ocean/thumb.jpg"},
    {id:"desert",name:"DÉSERT",desc:"Ruines, exploration et lumière solaire",thumb:"assets/themes/desert/thumb.jpg"},
    {id:"inferno",name:"FLAMMES",desc:"Forge, lave et puissance infernale",thumb:"assets/themes/inferno/thumb.jpg"}
  ];
  var STAGES={
    forest:["RECRUE DES BOIS","PISTEUR","RÔDEUR ENCHANTÉ","GARDIEN DU BOSQUET","CHAMPION SYLVESTRE"],
    station:["CADET ORBITAL","OPÉRATEUR SYSTÈMES","RÔDEUR ORBITAL","COMMANDANT DE STATION","CHAMPION COSMIQUE"],
    ocean:["RECRUE PLONGEUR","ÉCLAIREUR DU RÉCIF","EXPLORATEUR ABYSSAL","GARDIEN BIOLUMINESCENT","SEIGNEUR DES PROFONDEURS"],
    desert:["ERRANT","ÉCLAIREUR DES DUNES","RAIDER DU DÉSERT","CAPITAINE TEMPÊTE","ROI DES DUNES"],
    inferno:["INITIÉ ÉTINCELLE","COMBATTANT BRAISE","GUERRIER FLAMME","GARDIEN INFERNO","CHAMPION PHÉNIX"]
  };
  var currentTheme="classic";
  var currentLevel=1;
  var themeImg=null;
  var lastStage=0;
  var motionStarted=false;
  var motionLast=0;
  var levelupUntil=0;

  function byId(id){return document.getElementById(id)}
  function readQueryTheme(){
    try{
      var m=(location.search||"").match(/[?&]theme=([^&]+)/i);
      if(m){var t=decodeURIComponent(m[1]);if(VALID[t])return t}
    }catch(e){}
    return null;
  }
  function storedTheme(){
    var q=readQueryTheme();
    if(q){try{localStorage.setItem(STORAGE_KEY,q)}catch(e){} return q}
    try{var t=localStorage.getItem(STORAGE_KEY);return VALID[t]?t:"classic"}catch(e){return "classic"}
  }
  function stageForLevel(level){
    level=Number(level)||1;
    if(level>=84)return 5;
    if(level>=50)return 4;
    if(level>=20)return 3;
    if(level>=5)return 2;
    return 1;
  }
  function ensureThemeImage(){
    if(themeImg)return themeImg;
    var stage=byId("avatarStage");
    if(!stage)return null;
    themeImg=document.createElement("img");
    themeImg.id="themeAvatarImage";
    themeImg.className="theme-avatar-image";
    themeImg.alt="Évolution du personnage";
    stage.insertBefore(themeImg,stage.firstChild);
    return themeImg;
  }
  function pauseClassicVideo(){
    var v=byId("avatarVideo");
    if(v){try{v.pause()}catch(e){}}
  }
  function resumeClassicVideo(){
    var v=byId("avatarVideo");
    if(v){try{var p=v.play();if(p&&p.catch)p.catch(function(){})}catch(e){}}
  }
  function applyCharacter(force){
    var img=ensureThemeImage();
    var label=byId("evolutionStage");
    var video=byId("avatarVideo");
    if(currentTheme==="classic"){
      if(img)img.style.display="none";
      if(video)video.style.display="";
      resumeClassicVideo();
      /* Restore the exact V1.2.3 stage label without touching its video engine. */
      if(label&&window.CHARACTER_EVOLUTION){
        for(var ci=0;ci<window.CHARACTER_EVOLUTION.length;ci++){
          if(currentLevel>=window.CHARACTER_EVOLUTION[ci].minLevel){label.textContent=window.CHARACTER_EVOLUTION[ci].stage;break}
        }
      }
      return;
    }
    pauseClassicVideo();
    if(video)video.style.display="none";
    if(!img)return;
    var s=stageForLevel(currentLevel);
    var src="assets/characters/"+currentTheme+"/stage_"+s+".jpg";
    if(force||img.getAttribute("data-src")!==src){
      img.setAttribute("data-src",src);
      img.src=src;
      img.style.display="block";
      lastStage=s;
    }
    if(label&&STAGES[currentTheme])label.textContent=STAGES[currentTheme][s-1];
  }
  function applyTheme(theme,save){
    if(!VALID[theme])theme="classic";
    currentTheme=theme;
    document.body.setAttribute("data-player-theme",theme);
    if(save!==false){try{localStorage.setItem(STORAGE_KEY,theme)}catch(e){}}
    applyCharacter(true);
    refreshPicker();
  }
  function refreshPicker(){
    var nodes=document.querySelectorAll("[data-theme-choice]");
    for(var i=0;i<nodes.length;i++){
      if(nodes[i].getAttribute("data-theme-choice")===currentTheme)nodes[i].classList.add("active");
      else nodes[i].classList.remove("active");
    }
  }
  function pickerHtml(){
    var out='<div class="theme-picker-title">// DESIGN DU DASHBOARD</div><div class="theme-picker" id="themePicker">';
    for(var i=0;i<THEMES.length;i++){
      var t=THEMES[i];
      var style=t.thumb?' style="background-image:url('+t.thumb+')"':'';
      out+='<button type="button" class="theme-choice'+(t.id===currentTheme?' active':'')+'" data-theme-choice="'+t.id+'"'+style+'><b>'+t.name+'</b><small>'+t.desc+'</small></button>';
    }
    return out+'</div><p class="theme-picker-note">Le changement est immédiat et conserve toutes les données, XP, historique et paramètres.</p>';
  }
  function bindPicker(root){
    var nodes=(root||document).querySelectorAll("[data-theme-choice]");
    for(var i=0;i<nodes.length;i++){
      nodes[i].onclick=function(){
        var t=this.getAttribute("data-theme-choice");
        applyTheme(t,true);
        var msg=byId("panelMsg");
        if(msg)msg.textContent="DESIGN APPLIQUÉ — "+themeName(t);
        refreshPicker();
      };
    }
  }
  function themeName(id){for(var i=0;i<THEMES.length;i++)if(THEMES[i].id===id)return THEMES[i].name;return id}
  function injectPicker(){
    var body=byId("systemPanelBody");
    if(!body||byId("themePicker"))return;
    var wrap=document.createElement("div");
    wrap.id="themePickerWrap";
    wrap.innerHTML=pickerHtml();
    var action=byId("saveSettings");
    if(action&&action.parentNode)action.parentNode.insertBefore(wrap,action);
    else body.appendChild(wrap);
    bindPicker(wrap);
  }
  function startMotion(){
    if(motionStarted)return;
    motionStarted=true;
    function raf(fn){var r=window.requestAnimationFrame||window.webkitRequestAnimationFrame;return r?r(fn):setTimeout(function(){fn(Date.now())},50)}
    function frame(t){
      if(!t)t=Date.now();
      if(t-motionLast>55){
        motionLast=t;
        if(currentTheme!=="classic"&&themeImg&&themeImg.style.display!=="none"){
          var sec=t/1000;
          var y=Math.sin(sec*1.75)*1.8;
          var x=Math.sin(sec*.51)*.65;
          var scale=1.012+((Math.sin(sec*1.75)+1)*.0015);
          if(t<levelupUntil){
            var p=1-((levelupUntil-t)/900);
            y-=Math.sin(Math.min(1,p)*Math.PI)*14;
            scale+=Math.sin(Math.min(1,p)*Math.PI)*.025;
          }
          var tr="translate3d("+x.toFixed(2)+"px,"+y.toFixed(2)+"px,0) scale("+scale.toFixed(4)+")";
          themeImg.style.transform=tr;themeImg.style.webkitTransform=tr;
        }
      }
      raf(frame);
    }
    raf(frame);
  }
  function onData(e){
    var s=e&&e.detail?e.detail:null;
    if(!s||!s.global)return;
    var old=currentLevel;
    currentLevel=Number(s.global.level)||1;
    if(currentTheme!=="classic"&&currentLevel>old)levelupUntil=(window.performance&&performance.now?performance.now():Date.now())+900;
    applyCharacter(false);
  }
  function init(){
    ensureThemeImage();
    currentTheme=storedTheme();
    applyTheme(currentTheme,false);
    startMotion();
    var settingsButtons=document.querySelectorAll('[data-panel="settings"]');
    for(var i=0;i<settingsButtons.length;i++)settingsButtons[i].addEventListener("click",function(){setTimeout(injectPicker,40)},false);
  }
  window.addEventListener("player-data-update",onData,false);
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,false);else init();
  window.PlayerThemeManager={
    setTheme:function(t){applyTheme(t,true)},
    getTheme:function(){return currentTheme},
    getThemes:function(){return THEMES.slice(0)},
    injectPicker:injectPicker,
    refreshCharacter:function(){applyCharacter(true)}
  };
})();
