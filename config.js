"use strict";

/*
  CONFIGURATION SYSTEME PLAYER V0.5
  Remplacer WEB_APP_URL après déploiement du script Google Apps Script.
  Tant que l'URL reste vide, le système fonctionne en MODE LOCAL pour test.
*/
window.PLAYER_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwKimvcMuopcfanJvW3gkiikkQ1gXATsz_Uydb8-uOeXvLm_LENXEscIWeMF3O08v3e/exec",
  POLL_INTERVAL_MS: 5000,
  MONTHLY_BUDGET: 1000,
  DEV_MODE: true
};
