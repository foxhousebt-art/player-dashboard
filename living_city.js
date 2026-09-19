(()=>{"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const banner=$("#eventBanner"), flash=$("#worldFlash");
const events=["CONVOI EN APPROCHE","TRANSFERT DE CARGAISON","PATROUILLE AÉRIENNE","ATELIER EN ACTIVITÉ","RÉSEAU ÉNERGÉTIQUE STABLE","DRONES DE MAINTENANCE"];
let lastXP=null;
function event(msg){
 if(!banner)return; banner.querySelector("span").textContent=msg;banner.classList.add("show");
 setTimeout(()=>banner.classList.remove("show"),2600);
}
function burst(){
 if(flash){flash.classList.remove("go");void flash.offsetWidth;flash.classList.add("go")}
 $$(".world-event").forEach(x=>{x.animate([{transform:"scale(1)",opacity:1},{transform:"scale(4)",opacity:0}],{duration:900})});
}
setInterval(()=>{event(events[Math.floor(Math.random()*events.length)])},17000);
window.addEventListener("player-data-update",e=>{
 const xp=e.detail?.globalXp;
 if(lastXP!==null && xp>lastXP){event("PROGRESSION DÉTECTÉE  +"+(xp-lastXP)+" XP");burst()}
 lastXP=xp;
});
document.addEventListener("click",e=>{
 const x=e.clientX/innerWidth,y=e.clientY/innerHeight;
 if(x>.35&&y>.18){burst(); if(Math.random()>.45)event(events[Math.floor(Math.random()*events.length)])}
});
})();