"use strict";
(function(){
  var THEME=document.body.getAttribute('data-layout')||'forest';
  var LABELS={forest:["RECRUE DES BOIS","PISTEUR","RÔDEUR ENCHANTÉ","GARDIEN DU BOSQUET","CHAMPION SYLVESTRE"],station:["CADET ORBITAL","OPÉRATEUR SYSTÈMES","RÔDEUR ORBITAL","COMMANDANT DE STATION","CHAMPION COSMIQUE"],ocean:["RECRUE PLONGEUR","ÉCLAIREUR DU RÉCIF","EXPLORATEUR ABYSSAL","GARDIEN BIOLUMINESCENT","SEIGNEUR DES PROFONDEURS"],desert:["ERRANT","ÉCLAIREUR DES DUNES","RAIDER DU DÉSERT","CAPITAINE TEMPÊTE","ROI DES DUNES"],inferno:["INITIÉ ÉTINCELLE","COMBATTANT BRAISE","GUERRIER FLAMME","GARDIEN INFERNO","CHAMPION PHÉNIX"]};
  function $(id){return document.getElementById(id)}
  function stage(n){n=+n||1;return n>=84?5:n>=50?4:n>=20?3:n>=5?2:1}
  function setAvatar(level){var s=stage(level),img=$('worldAvatar');if(img){var src='assets/reference/'+THEME+'/avatar/stage_'+s+'.jpg';if(img.getAttribute('src')!==src)img.setAttribute('src',src)}var l=$('evolutionStage');if(l&&LABELS[THEME])l.textContent=LABELS[THEME][s-1]}
  function extraCard(cls,title,tone,body){var a=document.createElement('article');a.className='stat-card '+cls;a.setAttribute('data-tone',tone);a.innerHTML=body;return a}
  function syncExtras(s){
    var g=$('statGrid');if(!g)return;
    if(document.body.classList.contains('layout-adventure')){
      while(g.children.length>6)g.removeChild(g.lastChild);
      var sm=s.smoking||{streak:0,todayXp:0};
      var c=extraCard('smoking-card','SANS CIGARETTE','orange','<div class="icon">◉</div><div><h3>SANS CIGARETTE</h3><div class="lvl">SÉRIE '+sm.streak+'J</div><div class="xp">+'+sm.todayXp+' XP <span class="pct">'+sm.streak+'j</span></div><div class="bar"><i style="width:'+Math.min(100,sm.streak*10)+'%"></i></div></div><div class="detail"><span>AUJOURD’HUI</span><b>'+((s.lastEntry&&s.lastEntry.cigaretteSmoked===false)?'SANS CIGARETTE':'—')+'</b><span>SÉRIE</span><b>'+sm.streak+' jours</b></div>');
      var rec=!!(s.lastEntry&&s.lastEntry.recoveryDay);
      var r=extraCard('recovery-card','REPOS','blue','<div class="icon">☾</div><div><h3>REPOS</h3><div class="lvl">RECOVERY</div><div class="xp">'+(rec?'ACTIF':'NORMAL')+' <span class="pct">'+(rec?'✓':'—')+'</span></div><div class="bar"><i style="width:'+(rec?100:20)+'%"></i></div></div><div class="detail"><span>JOUR</span><b>'+(rec?'RECOVERY DAY':'STANDARD')+'</b><span>RÈGLE</span><b>DIMANCHE</b></div>');
      g.appendChild(c);g.appendChild(r);
    }
  }
  function reward(s){var el=$('nextRewardLevel'),rem=$('nextRewardXp');if(el)el.textContent='NIVEAU '+String(Math.min(100,(s.global.level||1)+1)).padStart(2,'0');if(rem)rem.textContent=(s.global.xpNeededForNext||0)+' XP restants';var bar=$('rewardBar');if(bar)bar.style.width=(s.global.progress||0)+'%'}
  window.addEventListener('player-data-update',function(e){var s=e.detail||{};if(s.global)setAvatar(s.global.level);syncExtras(s);reward(s)});
  document.addEventListener('DOMContentLoaded',function(){setAvatar(1)});
})();
