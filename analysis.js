"use strict";
const $=id=>document.getElementById(id);
const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
function clock(){const n=new Date();set("date","DATE : "+n.toLocaleDateString("fr-FR").replaceAll("/","."));set("time","HEURE : "+n.toLocaleTimeString("fr-FR"))}
function render(s){
  set("grossXp",s.grossXp||0);set("penaltyXp","-"+(s.penaltyTotal||0));set("netXp",s.globalXp||0);
  set("perfectDays",(s.entries||[]).filter(e=>e.perfectDay).length);
  set("difficultyName",`${s.difficulty.level} — ${s.difficulty.name}`);
  set("difficultyText",`Coefficient de pénalité ×${s.difficulty.penalty.toFixed(2)} • bonus XP ×${s.difficulty.reward.toFixed(2)} • grâce ${s.difficulty.grace}j`);
  const last30=(s.entries||[]).slice(-30);
  const compliant=last30.filter(e=>e.perfectDay||e.recoveryDay).length;
  const consistency=last30.length?Math.round(compliant/last30.length*100):0;
  set("consistencyScore",consistency+"%");
  const keys=["lecture","apprentissage","sport","nutrition","travail","finance"];
  const labels={lecture:"LECTURE",apprentissage:"APPRENTISSAGE",sport:"SPORT",nutrition:"NUTRITION",travail:"TRAVAIL",finance:"FINANCE"};
  const trend=$("trendBars");trend.innerHTML="";
  keys.forEach(k=>{
    const a=s.attrs[k],p=s.penalties[k]||0;
    const row=document.createElement("div");row.className="trend-row";
    row.innerHTML=`<span>${labels[k]}</span><div class="analysis-bar"><i style="width:${Math.max(3,a.progress)}%"></i></div><b>NIV.${a.level}</b><em>${p?"−"+p+" XP":"STABLE"}</em>`;
    trend.appendChild(row);
  });
  const reg=$("regularityList");reg.innerHTML=`
    <div><span>Jours enregistrés</span><b>${last30.length}</b></div>
    <div><span>Jours complets/repos</span><b>${compliant}</b></div>
    <div><span>Streak sans cigarette</span><b>${s.smoking.streak} j</b></div>
    <div><span>Bonus retour</span><b>+${s.comebackBonus||0} XP</b></div>`;
  const f=$("financeAnalysis");f.innerHTML=`
    <div><span>Dépensé ce mois</span><b>${Math.round(s.finance.spentThisMonth)} €</b></div>
    <div><span>Budget restant</span><b>${Math.round(s.finance.budgetRemaining)} €</b></div>
    <div><span>Écart trajectoire</span><b>${s.finance.trajectoryGap>=0?"+":""}${Math.round(s.finance.trajectoryGap)} €</b></div>`;
  const sp=$("sportAnalysis");sp.innerHTML=`
    <div><span>Séances semaine</span><b>${s.sportWeek.sessions} / 4</b></div>
    <div><span>Statut</span><b>${s.sportWeek.status}</b></div>
    <div><span>Ajustement</span><b>${s.sportWeek.weeklyAdjustmentXp>=0?"+":""}${s.sportWeek.weeklyAdjustmentXp} XP</b></div>`;
  const insights=$("insights");insights.innerHTML="";
  const weakest=keys.map(k=>({k,a:s.attrs[k]})).sort((x,y)=>(x.a.level+x.a.progress/100)-(y.a.level+y.a.progress/100))[0];
  const msgs=[
    `Ton secteur actuellement le moins avancé est <strong>${labels[weakest.k]}</strong> (niveau ${weakest.a.level}).`,
    s.penaltyTotal?`Le système a retiré <strong>${s.penaltyTotal} XP</strong> pour des écarts enregistrés. Ces pertes restent inférieures aux gains tant que l'activité reprend.`:"Aucune perte d'XP enregistrée sur les données disponibles.",
    s.comebackBonus?`Tu as déclenché <strong>+${s.comebackBonus} XP de retour</strong> après une période incomplète : le système récompense explicitement la reprise.`:"Aucun bonus de retour déclenché pour le moment.",
    `La constance affichée (${consistency} %) mesure les journées enregistrées complètes ou de récupération sur les 30 dernières entrées ; elle ne prétend pas expliquer la cause de tes comportements.`
  ];
  msgs.forEach(m=>{const p=document.createElement("p");p.innerHTML=m;insights.appendChild(p)});
  const wt=s.global.level>=95?5:s.global.level>=62?4:s.global.level>=35?3:s.global.level>=10?2:1;
  document.body.className=`analysis-page world-tier-${wt}`;
}
window.addEventListener("player-data-update",e=>render(e.detail));
window.addEventListener("DOMContentLoaded",()=>{clock();setInterval(clock,1000);
  setTimeout(()=>window.PlayerDataSync&&window.PlayerDataSync.refresh(),80);
});
