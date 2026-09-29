"use strict";
(function(){
  var $=function(id){return document.getElementById(id)};
  var WORLDS={
    forest:{name:"FORÊT",skin:"assets/desktop/forest.webp",thumb:"assets/desktop/forest.webp"},
    station:{name:"ORBITE NEXUS",skin:"assets/desktop/station.webp",thumb:"assets/desktop/station.webp"},
    ocean:{name:"ATLANTIS",skin:"assets/desktop/ocean.webp",thumb:"assets/desktop/ocean.webp"},
    desert:{name:"DÉSERT",skin:"assets/desktop/desert.webp",thumb:"assets/desktop/desert.webp"},
    inferno:{name:"FLAMMES",skin:"assets/desktop/inferno.webp",thumb:"assets/desktop/inferno.webp"}
  };
  var current="forest",snapshot=null;
  function safeStorage(k,v){try{if(arguments.length>1)localStorage.setItem(k,v);else return localStorage.getItem(k)}catch(e){}}
  function rankForLevel(level){if(level>=100)return"TRANSCENDANT";if(level>=95)return"PRÉ-TRANSCENDANT";if(level>=84)return"ASCENDANT II";if(level>=75)return"ASCENDANT";if(level>=62)return"MAÎTRE SUP.";if(level>=50)return"MAÎTRE";if(level>=35)return"ÉLITE";if(level>=20)return"VÉTÉRAN";if(level>=17)return"AGUERRI";if(level>=10)return"COMBATTANT";if(level>=5)return"DÉTERMINÉ";return"NOVICE I"}
  function stageForLevel(n){n=Number(n)||1;if(n>=84)return 5;if(n>=50)return 4;if(n>=20)return 3;if(n>=5)return 2;return 1}
  function setText(id,v){var e=$(id);if(e)e.textContent=v}
  function euro(n){try{return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0)}catch(e){return Math.round(Number(n)||0)+" €"}}
  function themeFromQuery(){try{var m=(location.search||"").match(/[?&]theme=([^&]+)/i);if(m&&WORLDS[m[1]])return m[1]}catch(e){}return null}
  function setWorld(id,save){if(!WORLDS[id])id="forest";current=id;document.body.setAttribute("data-world",id);$("desktopSkin").src=WORLDS[id].skin;if(save!==false)safeStorage("playerDesktopWorld",id);renderCharacter();refreshPicker()}
  function renderCharacter(){if(!snapshot)return;var img=$("desktopAvatar");if(!img)return;var s=stageForLevel(snapshot.global.level);img.src="assets/reference/"+current+"/avatar/stage_"+s+".jpg";img.alt="Personnage "+WORLDS[current].name+" niveau "+snapshot.global.level;setText("evolutionStage",["RECRUE","DÉTERMINÉ","VÉTÉRAN","MAÎTRE","ASCENDANT II"][s-1])}
  function descriptor(key){return {lecture:["LECTURE","yellow"],apprentissage:["APPRENTISSAGE","purple"],sport:["SPORT","red"],travail:["RECHERCHE D’EMPLOI","cyan"],finance:["ARGENT","green"],nutrition:["NUTRITION","teal"],smoking:["SANS CIGARETTE","orange"],rest:["REPOS","blue"]}[key]}
  function renderStats(s){var box=$("statOverlay");if(!box)return;var standard=(current==="forest"||current==="desert"||current==="inferno");var keys=standard?["lecture","apprentissage","sport","travail","finance","nutrition","smoking","rest"]:["lecture","apprentissage","sport","nutrition","travail","finance"];
    box.innerHTML="";
    keys.forEach(function(key){var d=descriptor(key),level=1,cur=0,pct=0,detail="";
      if(key==="smoking"){level=1+Math.floor((s.smoking.streak||0)/10);cur=(s.smoking.streak||0)%10*10;pct=Math.min(100,cur);detail=(s.smoking.streak||0)+" jours"}
      else if(key==="rest"){level=1;cur=s.lastEntry&&s.lastEntry.recoveryDay?100:0;pct=cur;detail=s.lastEntry&&s.lastEntry.recoveryDay?"Recovery":"Normal"}
      else {var a=s.attrs[key];if(!a)return;level=a.level;cur=a.currentXp;pct=a.progress;detail=Math.round(a.progress)+"%"}
      var el=document.createElement("div");el.className="stat-live tone-"+d[1];el.innerHTML='<div class="stat-top"><b>'+d[0]+'</b><span>NIV. '+String(level).padStart(2,"0")+'</span></div><div class="stat-bottom"><b>'+cur+' XP</b><span>'+detail+'</span><div class="mini-progress"><i style="width:'+pct+'%"></i></div></div>';box.appendChild(el);
    });
  }
  function render(s){snapshot=s;var g=s.global,rank=rankForLevel(g.level);setText("globalLevel",String(g.level).padStart(2,"0"));setText("globalXp",s.globalXp);setText("globalXpTarget",g.level>=100?s.globalXp:g.nextFloor);setText("xpRemaining",g.xpNeededForNext);setText("rank",rank);setText("profileRank",rank);setText("activeDays",s.activeDays);var gb=$("globalXpBar");if(gb)gb.style.width=g.progress+"%";setText("budgetMonthly",euro(s.finance.monthlyBudget));setText("spentTotal",euro(s.finance.spentThisMonth));setText("budgetRemaining",euro(s.finance.budgetRemaining));setText("trajectoryGap",(s.finance.trajectoryGap>=0?"+":"")+euro(s.finance.trajectoryGap));setText("smokeStreak",s.smoking.streak||0);setText("recoveryState",s.lastEntry&&s.lastEntry.recoveryDay?"RECOVERY":"NORMAL");var keys=["lecture","apprentissage","sport","nutrition","travail","finance"],p=keys.map(function(k){return{k:k,a:s.attrs[k]}}).sort(function(a,b){return(a.a.level+a.a.progress/100)-(b.a.level+b.a.progress/100)})[0];setText("priorityName",descriptor(p.k)[0]);setText("priorityPct",Math.round(p.a.progress)+"%");var pb=$("priorityBar");if(pb)pb.style.width=p.a.progress+"%";renderStats(s);renderCharacter()}
  function tick(){var n=new Date();setText("date",n.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}).toUpperCase());setText("time",n.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}))}
  function pickerHTML(){var h='<div class="world-picker-head"><div><h2>// DESIGNS DESKTOP</h2><span>Version MacBook Premium — même moteur et mêmes données.</span></div><button class="action" type="button" id="openPs4">OUVRIR CLASSIC PS4</button></div><div class="world-picker">';Object.keys(WORLDS).forEach(function(id){var w=WORLDS[id];h+='<button class="world-choice '+(id===current?'active':'')+'" data-world-choice="'+id+'" style="background-image:url(\''+w.thumb+'\')"><span class="world-choice-shade"></span><b>'+w.name+'</b><small>Layout desktop premium</small></button>'});return h+'</div><p class="world-picker-foot">Design actuel : <strong id="currentWorldName">'+WORLDS[current].name+'</strong></p>'}
  function mountPicker(root){if(!root)return;root.innerHTML=pickerHTML();root.querySelectorAll("[data-world-choice]").forEach(function(b){b.onclick=function(){setWorld(b.getAttribute("data-world-choice"),true);var m=$("panelMsg");if(m)m.textContent="DESIGN APPLIQUÉ — "+WORLDS[current].name}});var p=$("openPs4");if(p)p.onclick=function(){location.href="ps4.html"};refreshPicker()}
  function refreshPicker(){document.querySelectorAll("[data-world-choice]").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-world-choice")===current)});var n=$("currentWorldName");if(n)n.textContent=WORLDS[current]?WORLDS[current].name:current}
  window.PlayerWorlds={set:setWorld,get:function(){return current},name:function(id){return WORLDS[id]?WORLDS[id].name:id},mountPicker:mountPicker,list:function(){return Object.keys(WORLDS)}};
  window.addEventListener("player-data-update",function(e){render(e.detail)});
  document.addEventListener("DOMContentLoaded",function(){var q=themeFromQuery(),saved=safeStorage("playerDesktopWorld");setWorld(q|| (WORLDS[saved]?saved:"forest"),false);tick();setInterval(tick,1000);if(window.PLAYER_SNAPSHOT)render(window.PLAYER_SNAPSHOT)});
})();
