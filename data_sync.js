"use strict";
(function(){
 const cfg=window.PLAYER_CONFIG||{};let last="";
 function localEntries(){try{return JSON.parse(localStorage.getItem("playerEntries")||"[]")}catch{return[]}}
 function localGame(){try{return JSON.parse(localStorage.getItem("playerGameSettings")||"{}")}catch{return{}}}
 function effective(cloud={}){
  const l=localGame(),d=+localStorage.getItem("playerDifficulty");
  const s={...cloud,...l}; if(d>=1&&d<=4)s.difficulty=d;
  return s;
 }
 function dispatch(entries,settings){const snap=PlayerEngine.compute(entries,effective(settings));const h=JSON.stringify(snap);if(h===last)return;last=h;window.PLAYER_SNAPSHOT=snap;window.dispatchEvent(new CustomEvent("player-data-update",{detail:snap}))}
 async function refresh(){if(!cfg.WEB_APP_URL){dispatch(localEntries(),{});return}try{const u=cfg.WEB_APP_URL+(cfg.WEB_APP_URL.includes("?")?"&":"?")+"action=state&_="+Date.now();const r=await fetch(u,{cache:"no-store"});const p=await r.json();dispatch(p.entries||[],p.settings||{})}catch(e){console.error(e);dispatch(localEntries(),{})}}
 window.PlayerDataSync={refresh};addEventListener("DOMContentLoaded",()=>{refresh();setInterval(refresh,+cfg.POLL_INTERVAL_MS||5000)});addEventListener("storage",refresh);
})();