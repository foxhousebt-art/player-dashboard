"use strict";
(function(){
  var $=function(id){return document.getElementById(id)};
  var WORLDS={
    classic:{name:"CLASSIC NOIR",classic:true,thumb:"",desc:"Dashboard noir original"},
    forest:{name:"FORÊT ENCHANTÉE",desc:"Monde végétal premium",brand:"PLAYER",subtitle:"SYSTÈME DE PROGRESSION PERSONNELLE",layout:"leftHero",thumb:"assets/reference/forest/reference.jpg"},
    station:{name:"NEXUS ORBITAL",desc:"Station spatiale premium",brand:"NEXUS",subtitle:"STATION ORBITALE",layout:"rightHero",thumb:"assets/reference/station/reference.jpg"},
    ocean:{name:"ATLANTIS NÉON",desc:"Cité sous-marine premium",brand:"ATLANTIS NÉON",subtitle:"SUIVI DE PROGRESSION PERSONNELLE",layout:"rightHero",thumb:"assets/reference/ocean/reference.jpg"},
    desert:{name:"RUINES DU DÉSERT",desc:"Ruines et dunes premium",brand:"PLAYER",subtitle:"SYSTÈME DE PROGRESSION PERSONNELLE",layout:"leftHero",thumb:"assets/reference/desert/reference.jpg"},
    inferno:{name:"FLAMMES",desc:"Univers volcanique premium",brand:"SYSTÈME PLAYER",subtitle:"SUIVI DE PROGRESSION PERSONNELLE",layout:"leftHero",thumb:"assets/reference/inferno/reference.jpg"}
  };
  var LABELS={
    forest:["RECRUE DES BOIS","PISTEUR","RÔDEUR ENCHANTÉ","GARDIEN DU BOSQUET","CHAMPION SYLVESTRE"],
    station:["CADET ORBITAL","OPÉRATEUR SYSTÈMES","RÔDEUR ORBITAL","COMMANDANT DE STATION","CHAMPION COSMIQUE"],
    ocean:["RECRUE PLONGEUR","ÉCLAIREUR DU RÉCIF","EXPLORATEUR ABYSSAL","GARDIEN BIOLUMINESCENT","SEIGNEUR DES PROFONDEURS"],
    desert:["ERRANT","ÉCLAIREUR DES DUNES","RAIDER DU DÉSERT","CAPITAINE TEMPÊTE","ROI DES DUNES"],
    inferno:["INITIÉ ÉTINCELLE","COMBATTANT BRAISE","GUERRIER FLAMME","GARDIEN INFERNO","CHAMPION PHÉNIX"]
  };
  var current="forest", snapshot=null, levelInitialized=false, previousLevel=1, levelTimer=null;
  function safeStorage(k,v){try{if(arguments.length>1)localStorage.setItem(k,v);else return localStorage.getItem(k)}catch(e){}}
  function euro(n){try{return new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(n)||0)}catch(e){return Math.round(Number(n)||0)+" €"}}
  function setText(id,v){var el=$(id);if(el)el.textContent=v}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function rankForLevel(level){if(level>=100)return"TRANSCENDANT";if(level>=95)return"PRÉ-TRANSCENDANT";if(level>=84)return"ASCENDANT II";if(level>=75)return"ASCENDANT";if(level>=62)return"MAÎTRE SUP.";if(level>=50)return"MAÎTRE";if(level>=35)return"ÉLITE";if(level>=20)return"VÉTÉRAN";if(level>=17)return"AGUERRI";if(level>=10)return"COMBATTANT";if(level>=5)return"DÉTERMINÉ";return"NOVICE I"}
  function stageForLevel(n){n=Number(n)||1;if(n>=84)return 5;if(n>=50)return 4;if(n>=20)return 3;if(n>=5)return 2;return 1}
  function themeFromQuery(){try{var m=(location.search||"").match(/[?&]theme=([^&]+)/i);return m&&WORLDS[m[1]]?m[1]:null}catch(e){return null}}
  function descriptor(key){return {
    lecture:["LECTURE","yellow",1],apprentissage:["APPRENTISSAGE","purple",2],sport:["SPORT","red",3],nutrition:["NUTRITION","teal",4],travail:["RECHERCHE D’EMPLOI","cyan",5],finance:["ARGENT","green",6],smoking:["SANS CIGARETTE","orange",7],rest:["REPOS","blue",8]
  }[key]}
  function toneColor(t){return {yellow:"#ffd765",purple:"#bf5cff",red:"#ff5c5f",cyan:"#63d7ff",green:"#52e498",teal:"#42e0bf",orange:"#ff9b3f",blue:"#7d8dff"}[t]||"#fff"}
  function cardArt(key){
    var d=descriptor(key),n=d[2];
    if(key==="smoking"||key==="rest"){
      if(current==="forest"||current==="desert"||current==="inferno") return "assets/desktop220/"+current+"/"+key+".jpg";
      return "assets/reference/"+current+"/card_"+(key==="smoking"?3:4)+"_"+(key==="smoking"?"sport":"nutrition")+".jpg";
    }
    var suffix={1:"lecture",2:"apprentissage",3:"sport",4:"nutrition",5:"travail",6:"finance"}[n];
    return "assets/reference/"+current+"/card_"+n+"_"+suffix+".jpg";
  }
  function setWorld(id,save){
    if(id==="classic"){location.href="ps4.html";return}
    if(!WORLDS[id]||WORLDS[id].classic)id="forest";
    current=id;
    document.body.setAttribute("data-world",id);
    document.body.setAttribute("data-layout",WORLDS[id].layout);
    setText("worldBrand",WORLDS[id].brand);setText("worldSubtitle",WORLDS[id].subtitle);
    if(save!==false)safeStorage("playerDesktopWorld",id);
    if(snapshot)render(snapshot);
    refreshPicker();
  }
  function renderCharacter(s){
    var img=$("desktopAvatar");if(!img)return;
    var stage=stageForLevel(s.global.level);
    img.src="assets/desktop220/"+current+"/avatar/stage_"+stage+".jpg";
    img.alt="Personnage "+WORLDS[current].name+" niveau "+s.global.level;
    setText("evolutionStage",LABELS[current][stage-1]);
  }
  function renderStats(s){
    var box=$("statOverlay");if(!box)return;
    var eight=WORLDS[current].layout==="leftHero";
    var keys=eight?["lecture","apprentissage","sport","travail","finance","nutrition","smoking","rest"]:["lecture","apprentissage","sport","nutrition","travail","finance"];
    box.className="stat-grid "+(eight?"eight":"six");box.innerHTML="";
    keys.forEach(function(key){
      var d=descriptor(key),level=1,cur=0,pct=0,detail="";
      if(key==="smoking"){
        var st=s.smoking.streak||0;level=1+Math.floor(st/10);cur=(st%10)*10;pct=clamp(cur,0,100);detail=st+" jours";
      }else if(key==="rest"){
        var rec=!!(s.lastEntry&&s.lastEntry.recoveryDay);level=1;cur=rec?100:0;pct=cur;detail=rec?"RECOVERY":"NORMAL";
      }else{
        var a=s.attrs[key];if(!a)return;level=a.level;cur=a.currentXp;pct=a.progress;detail=Math.round(a.progress)+"%";
      }
      var el=document.createElement("div");el.className="stat-live";el.style.setProperty("--tone",toneColor(d[1]));el.style.setProperty("--card-art","url('"+cardArt(key)+"')");
      el.innerHTML='<div class="stat-top"><b>'+d[0]+'</b><span>NIV. '+String(level).padStart(2,"0")+'</span></div><div class="stat-bottom"><b>'+cur+' / 100 XP</b><span>'+detail+'</span><div class="mini-progress"><i style="width:'+pct+'%"></i></div></div>';
      box.appendChild(el);
    });
  }
  function mondayOf(d){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12),day=x.getDay()||7;x.setDate(x.getDate()-day+1);return x}
  function isoLocal(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
  function renderWeek(s){
    var box=$("weekGrid");if(!box)return;box.innerHTML="";
    var now=new Date(),m=mondayOf(now),seen={};(s.entries||[]).forEach(function(e){seen[String(e.date).slice(0,10)]=1});
    var names=["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
    for(var i=0;i<7;i++){var d=new Date(m);d.setDate(m.getDate()+i);var iso=isoLocal(d),done=!!seen[iso],today=iso===isoLocal(now);var el=document.createElement("div");el.className="day-cell"+(done?" done":"")+(today?" today":"");el.innerHTML='<strong>'+names[i]+'</strong><span>'+String(d.getDate()).padStart(2,"0")+'/'+String(d.getMonth()+1).padStart(2,"0")+'</span><em>'+(done?'✓':'○')+'</em>';box.appendChild(el)}
  }
  function triggerLevelUp(level){
    var card=document.querySelector(".player-card"),num=$("desktopLevelUpNumber"),overlay=$("desktopLevelOverlay"),overlayNum=$("desktopLevelOverlayNumber");if(!card)return;if(num)num.textContent=String(level).padStart(2,"0");if(overlayNum)overlayNum.textContent=String(level).padStart(2,"0");
    card.classList.remove("leveling");void card.offsetWidth;card.classList.add("leveling");if(overlay){overlay.classList.remove("show");void overlay.offsetWidth;overlay.classList.add("show")}clearTimeout(levelTimer);levelTimer=setTimeout(function(){card.classList.remove("leveling");if(overlay)overlay.classList.remove("show")},1800);
  }
  function maybeLevelUp(level){
    if(!levelInitialized){previousLevel=level;levelInitialized=true;try{sessionStorage.setItem("desktopV220Level",String(level))}catch(e){}return}
    if(level>previousLevel)triggerLevelUp(level);
    previousLevel=level;try{sessionStorage.setItem("desktopV220Level",String(level))}catch(e){}
  }
  function render(s){
    snapshot=s;var g=s.global,rank=rankForLevel(g.level);maybeLevelUp(g.level);
    setText("globalLevel",String(g.level).padStart(2,"0"));setText("globalXp",s.globalXp);setText("globalXpTarget",g.level>=100?s.globalXp:g.nextFloor);setText("xpRemaining",g.xpNeededForNext);setText("globalPct",g.progress+"%");setText("rank",rank);setText("profileRank",rank);
    setText("streak",s.smoking.streak||0);setText("record",s.smoking.bestStreak||0);setText("activeDays",s.activeDays||0);
    var gb=$("globalXpBar");if(gb)gb.style.width=g.progress+"%";
    setText("budgetMonthly",euro(s.finance.monthlyBudget));setText("spentTotal",euro(s.finance.spentThisMonth));setText("budgetRemaining",euro(s.finance.budgetRemaining));setText("trajectoryGap",(s.finance.trajectoryGap>=0?"+":"")+euro(s.finance.trajectoryGap));
    var marker=$("budgetMarker");if(marker){var b=Math.max(1,s.finance.monthlyBudget),pos=clamp(50+(s.finance.trajectoryGap/b)*50,0,100);marker.style.left=pos+"%"}
    setText("smokeStreak",s.smoking.streak||0);setText("sportWeek",s.sportWeek.sessions+" / "+s.sportWeek.target);setText("recoveryState",s.lastEntry&&s.lastEntry.recoveryDay?"RECOVERY":"NORMAL");setText("summaryXp",s.globalXp+" XP");setText("nextLevel",String(Math.min(100,g.level+1)).padStart(2,"0"));setText("rewardRemaining",g.level>=100?"NIVEAU MAXIMUM":g.xpNeededForNext+" XP restants");
    var keys=["lecture","apprentissage","sport","nutrition","travail","finance"],p=keys.map(function(k){return{k:k,a:s.attrs[k]}}).sort(function(a,b){return(a.a.level+a.a.progress/100)-(b.a.level+b.a.progress/100)})[0];setText("priorityName",descriptor(p.k)[0]);setText("priorityPct",Math.round(p.a.progress)+"%");var pb=$("priorityBar");if(pb)pb.style.width=p.a.progress+"%";
    renderStats(s);renderCharacter(s);renderWeek(s);
  }
  function tick(){var n=new Date();setText("date",n.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}).toUpperCase());setText("time",n.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}))}
  function pickerHTML(){
    var h='<div class="world-picker-head"><div><h2>// DESIGNS DESKTOP</h2><span>Six univers. Le Classic noir ouvre le dashboard original, inchangé.</span></div></div><div class="world-picker">';
    Object.keys(WORLDS).forEach(function(id){var w=WORLDS[id],style=w.thumb?' style="background-image:url(\''+w.thumb+'\')"':'';h+='<button class="world-choice '+(w.classic?'classic ':'')+(id===current?'active':'')+'" data-world-choice="'+id+'"'+style+'><span class="world-choice-shade"></span><b>'+w.name+'</b><small>'+(w.desc||'')+'</small></button>'});
    return h+'</div><p class="world-picker-foot">Design actuel : <strong id="currentWorldName">'+WORLDS[current].name+'</strong></p>';
  }
  function mountPicker(root){if(!root)return;root.innerHTML=pickerHTML();var btns=root.querySelectorAll("[data-world-choice]");for(var i=0;i<btns.length;i++)btns[i].onclick=function(){var id=this.getAttribute("data-world-choice");setWorld(id,true);var m=$("panelMsg");if(m&&id!=="classic")m.textContent="DESIGN APPLIQUÉ — "+WORLDS[current].name};refreshPicker()}
  function refreshPicker(){var btns=document.querySelectorAll("[data-world-choice]");for(var i=0;i<btns.length;i++)btns[i].classList.toggle("active",btns[i].getAttribute("data-world-choice")===current);var n=$("currentWorldName");if(n)n.textContent=WORLDS[current]?WORLDS[current].name:current}
  window.PlayerWorlds={set:setWorld,get:function(){return current},name:function(id){return WORLDS[id]?WORLDS[id].name:id},mountPicker:mountPicker,list:function(){return Object.keys(WORLDS)}};
  window.addEventListener("player-data-update",function(e){render(e.detail)});
  document.addEventListener("DOMContentLoaded",function(){
    var q=themeFromQuery(),saved=safeStorage("playerDesktopWorld");var start=q&&q!=="classic"?q:(WORLDS[saved]&&!WORLDS[saved].classic?saved:"forest");setWorld(start,false);tick();setInterval(tick,1000);if(window.PLAYER_SNAPSHOT)render(window.PLAYER_SNAPSHOT);
  });
})();
