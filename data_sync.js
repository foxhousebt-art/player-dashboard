"use strict";

(function(){
  const cfg = window.PLAYER_CONFIG || {};
  let lastPayloadHash = "";

  function localEntries(){
    try { return JSON.parse(localStorage.getItem("playerEntries") || "[]"); }
    catch(e){ return []; }
  }

  function localSettings(){
    return {
      monthlyBudget: Number(localStorage.getItem("playerMonthlyBudget") || cfg.MONTHLY_BUDGET || 1000)
    };
  }

  function dispatch(entries, settings){
    const snapshot = window.PlayerEngine.compute(entries, settings);
    const hash = JSON.stringify(snapshot);
    if(hash === lastPayloadHash) return;
    lastPayloadHash = hash;
    window.dispatchEvent(new CustomEvent("player-data-update", {detail:snapshot}));
  }

  async function refreshRemote(){
    if(!cfg.WEB_APP_URL){
      dispatch(localEntries(), localSettings());
      return;
    }

    try{
      const url = cfg.WEB_APP_URL + (cfg.WEB_APP_URL.includes("?") ? "&" : "?") + "action=state&_=" + Date.now();
      const res = await fetch(url, {cache:"no-store"});
      const payload = await res.json();
      dispatch(payload.entries || [], payload.settings || {});
    }catch(err){
      console.error("Synchronisation distante impossible :", err);
      // Fallback local pour que le dashboard continue à fonctionner.
      dispatch(localEntries(), localSettings());
    }
  }

  window.PlayerDataSync = {
    refresh: refreshRemote
  };

  window.addEventListener("DOMContentLoaded", ()=>{
    refreshRemote();
    setInterval(refreshRemote, Number(cfg.POLL_INTERVAL_MS)||5000);
  });

  // Permet à un autre onglet local de mettre à jour le dashboard immédiatement.
  window.addEventListener("storage", refreshRemote);
})();
