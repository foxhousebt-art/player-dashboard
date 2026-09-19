(()=>{"use strict";
function quotes(){
 const q=JSON.parse(localStorage.getItem("playerQuotes")||"{}");
 const top=document.getElementById("quoteTop"),player=document.getElementById("quotePlayer");
 if(top)top.textContent="« "+(q.top||"Les petites actions d’aujourd’hui créent les grandes victoires de demain.")+" »";
 if(player)player.textContent="« "+(q.player||"Un meilleur toi construit un meilleur monde.")+" »";
}
quotes();window.addEventListener("player-quotes-update",quotes);
})();