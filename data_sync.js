"use strict";
(function(){
let last="";const cfg=window.PLAYER_CONFIG||{};
function localSettings(){try{return JSON.parse(localStorage.getItem("playerGameSettings")||"{}")}catch(e){return{}}}
function localEntries(){try{return JSON.parse(localStorage.getItem("playerEntries")||"[]")}catch(e){return[]}}
function settings(cloud){let s=Object.assign({},cloud||{},localSettings()),d=+localStorage.getItem("playerDifficulty");if(d>=1&&d<=4)s.difficulty=d;return s}
function emit(entries,s){let snap=PlayerEngine.compute(entries,settings(s)),h=JSON.stringify(snap);if(h===last)return;last=h;window.PLAYER_SNAPSHOT=snap;window.dispatchEvent(new CustomEvent("player-data-update",{detail:snap}))}
async function refresh(){if(!cfg.WEB_APP_URL){emit(localEntries(),{});return}try{let u=cfg.WEB_APP_URL+(cfg.WEB_APP_URL.indexOf("?")>=0?"&":"?")+"action=state&_="+Date.now(),r=await fetch(u,{cache:"no-store"}),j=await r.json();emit(j.entries||[],j.settings||{})}catch(e){console.error("Sync cloud:",e);emit(localEntries(),{})}}
window.PlayerDataSync={refresh};window.addEventListener("DOMContentLoaded",function(){refresh();setInterval(refresh,+cfg.POLL_INTERVAL_MS||5000)});window.addEventListener("storage",refresh);
})();