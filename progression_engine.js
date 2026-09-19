"use strict";

(function(){
  const LEVEL_MAX = 100;
  const DIFFICULTY = {
    1:{name:"EXPLORATEUR", penalty:0.45, reward:1.08, grace:3, comeback:15},
    2:{name:"ENGAGÉ",     penalty:0.75, reward:1.04, grace:2, comeback:20},
    3:{name:"DISCIPLINÉ", penalty:1.00, reward:1.00, grace:1, comeback:25},
    4:{name:"IMPITOYABLE",penalty:1.35, reward:1.00, grace:0, comeback:35}
  };

  function isoDate(d){
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  }
  function parseDateOnly(s){
    const [y,m,d] = String(s).split("-").map(Number);
    return new Date(y,m-1,d,12,0,0);
  }
  function mondayOf(date){
    const d=new Date(date), day=d.getDay()||7;
    d.setDate(d.getDate()-day+1); d.setHours(12,0,0,0); return d;
  }
  function sundayOf(date){ const d=mondayOf(date); d.setDate(d.getDate()+6); return d; }
  function daysInMonth(date){ return new Date(date.getFullYear(),date.getMonth()+1,0).getDate(); }
  function globalLevelCost(level){ return 120+10*(level-1); }
  function cumulativeXpForLevel(level){
    if(level<=1)return 0; const k=level-1; return 120*k+5*k*(k-1);
  }
  function globalLevelFromXp(xp){
    xp=Math.max(0,Number(xp)||0); let level=1;
    while(level<LEVEL_MAX && xp>=cumulativeXpForLevel(level+1)) level++;
    const currentFloor=cumulativeXpForLevel(level);
    const nextFloor=level>=LEVEL_MAX?currentFloor:cumulativeXpForLevel(level+1);
    return {
      level,currentFloor,nextFloor,
      progress:level>=LEVEL_MAX?100:Math.max(0,Math.min(100,((xp-currentFloor)/(nextFloor-currentFloor))*100)),
      xpIntoLevel:xp-currentFloor,
      xpNeededForNext:level>=LEVEL_MAX?0:nextFloor-xp
    };
  }
  function attributeLevelFromXp(xp){
    xp=Math.max(0,Number(xp)||0);
    return {level:Math.floor(xp/100)+1,currentXp:xp%100,targetXp:100,progress:xp%100};
  }
  function sportWeeklyAdjustment(sessions,completedWeek){
    if(sessions>=7)return 120;if(sessions===6)return 80;if(sessions===5)return 60;if(sessions===4)return 40;
    if(completedWeek&&sessions<=3)return -40; return 0;
  }
  function sportStatus(sessions,completedWeek){
    if(sessions>=7)return {label:"EXCEPTIONNEL",tone:"good"};
    if(sessions>=4)return {label:"OBJECTIF ATTEINT",tone:"good"};
    if(completedWeek)return {label:"NÉGATIF",tone:"bad"};
    return {label:"EN COURS",tone:"neutral"};
  }
  function normalizeEntries(entries){
    const byDate=new Map();
    (entries||[]).forEach(raw=>{
      if(!raw||!raw.date)return; const date=String(raw.date).slice(0,10);
      byDate.set(date,{
        date,
        pages:Math.max(0,Number(raw.pages)||0),
        learningMinutes:Math.max(0,Number(raw.learningMinutes)||0),
        sport:Boolean(raw.sport===true||raw.sport===1||raw.sport==="1"||raw.sport==="true"),
        compliantMeals:Math.max(0,Number(raw.compliantMeals)||0),
        workActions:Math.max(0,Number(raw.workActions)||0),
        expenses:Math.max(0,Number(raw.expenses)||0),
        cigaretteSmoked: raw.cigaretteSmoked===true||raw.cigaretteSmoked===1||raw.cigaretteSmoked==="1"||raw.cigaretteSmoked==="true"
          ? true : raw.cigaretteSmoked===false||raw.cigaretteSmoked===0||raw.cigaretteSmoked==="0"||raw.cigaretteSmoked==="false" ? false:null
      });
    });
    return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  function difficultyFrom(settings){
    const n=Math.max(1,Math.min(4,Number(settings.difficulty||localStorage.getItem("playerDifficulty")||2)));
    return {level:n,...DIFFICULTY[n]};
  }
  function compute(entries,settings={}){
    const clean=normalizeEntries(entries);
    const difficulty=difficultyFrom(settings);
    const monthlyBudget=Math.max(0,Number(settings.monthlyBudget??1000));
    const today=new Date(); today.setHours(12,0,0,0);

    let readingGross=0,learningGross=0,sportBase=0,nutritionGross=0,workGross=0,financeGross=0;
    let perfectDayBonus=0,noSmokingXp=0,noSmokingStreak=0,bestNoSmokingStreak=0;
    let penaltyTotal=0,comebackBonus=0,missedStreak=0;
    const penalties={lecture:0,apprentissage:0,sport:0,nutrition:0,travail:0,finance:0};
    const monthSpend=new Map(),weeks=new Map(),enriched=[];

    clean.forEach(entry=>{
      const date=parseDateOnly(entry.date);
      const monthKey=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
      const weekStart=mondayOf(date),weekKey=isoDate(weekStart);
      if(!weeks.has(weekKey))weeks.set(weekKey,{start:weekStart,sessions:0});
      if(entry.sport)weeks.get(weekKey).sessions++;

      const r=entry.pages;
      const l=Math.floor(entry.learningMinutes/30)*20;
      const s=entry.sport?40:0;
      const n=entry.compliantMeals*10;
      const w=entry.workActions*2;
      readingGross+=r;learningGross+=l;sportBase+=s;nutritionGross+=n;workGross+=w;

      const cumulativeSpend=(monthSpend.get(monthKey)||0)+entry.expenses;
      monthSpend.set(monthKey,cumulativeSpend);
      const trajectoryAllowed=monthlyBudget*(date.getDate()/daysInMonth(date));
      const financeOk=cumulativeSpend<=trajectoryAllowed+1e-9;
      const fx=financeOk?10:0; financeGross+=fx;

      const isSunday=date.getDay()===0;
      const perfectDay=!isSunday&&entry.pages>=10&&entry.learningMinutes>=30&&entry.compliantMeals>=3&&entry.workActions>=1&&financeOk;
      if(perfectDay)perfectDayBonus+=50;

      let smokingXpToday=0;
      if(entry.cigaretteSmoked===true) noSmokingStreak=0;
      else if(entry.cigaretteSmoked===false){
        noSmokingStreak++;bestNoSmokingStreak=Math.max(bestNoSmokingStreak,noSmokingStreak);
        smokingXpToday=noSmokingStreak>=10?10:5;noSmokingXp+=smokingXpToday;
      }

      // Penalties only for an actually submitted day. Missing days are never fabricated failures.
      let dayPenalty=0;
      if(!isSunday){
        const misses=[];
        if(entry.pages===0) misses.push(["lecture",5]);
        if(entry.learningMinutes===0) misses.push(["apprentissage",5]);
        if(entry.compliantMeals===0) misses.push(["nutrition",5]);
        if(entry.workActions===0) misses.push(["travail",5]);
        if(!financeOk){
          const over=Math.max(0,cumulativeSpend-trajectoryAllowed);
          misses.push(["finance",Math.min(15,5+Math.floor(over/Math.max(1,monthlyBudget*.05))*2)]);
        }
        if(misses.length){
          missedStreak++;
          const escalation=1+Math.min(.50,Math.max(0,missedStreak-difficulty.grace)*.10);
          misses.forEach(([key,base])=>{
            const p=Math.round(base*difficulty.penalty*escalation);
            penalties[key]+=p;dayPenalty+=p;
          });
        }else{
          if(missedStreak>=2){
            const bonus=Math.round(difficulty.comeback*(1+Math.min(1,missedStreak/5)));
            comebackBonus+=bonus;
          }
          missedStreak=0;
        }
      }
      penaltyTotal+=dayPenalty;

      enriched.push({...entry,financeOk,trajectoryAllowed,cumulativeSpend,perfectDay,recoveryDay:isSunday,
        noSmokingStreak,smokingXpToday,dayPenalty});
    });

    let sportWeeklyXp=0,currentWeekSessions=0,currentWeekStatus={label:"EN COURS",tone:"neutral"};
    const currentWeekKey=isoDate(mondayOf(today));
    weeks.forEach((week,key)=>{
      const completed=sundayOf(week.start)<today;
      let adjustment=sportWeeklyAdjustment(week.sessions,completed);
      if(adjustment<0){
        const p=Math.round(Math.abs(adjustment)*difficulty.penalty);
        penalties.sport+=p; penaltyTotal+=p; adjustment=0;
      }
      sportWeeklyXp+=adjustment;
      if(key===currentWeekKey){currentWeekSessions=week.sessions;currentWeekStatus=sportStatus(week.sessions,completed);}
    });
    if(!weeks.has(currentWeekKey))currentWeekStatus=sportStatus(0,false);

    const reward=difficulty.reward;
    const grossCategory={
      lecture:Math.round(readingGross*reward),
      apprentissage:Math.round(learningGross*reward),
      sport:Math.round((sportBase+sportWeeklyXp)*reward),
      nutrition:Math.round(nutritionGross*reward),
      travail:Math.round(workGross*reward),
      finance:Math.round(financeGross*reward)
    };
    const categoryXp={};
    Object.keys(grossCategory).forEach(k=>categoryXp[k]=Math.max(0,grossCategory[k]-penalties[k]));

    const grossXp=Object.values(grossCategory).reduce((a,b)=>a+b,0)+perfectDayBonus+noSmokingXp+comebackBonus;
    const globalXp=Math.max(0,grossXp-penaltyTotal);
    const global=globalLevelFromXp(globalXp);
    const attrs={};
    Object.entries(categoryXp).forEach(([key,xp])=>attrs[key]={xp,...attributeLevelFromXp(xp)});

    const nowMonthKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
    const spentThisMonth=monthSpend.get(nowMonthKey)||0;
    const plannedToDate=monthlyBudget*(today.getDate()/daysInMonth(today));
    const budgetRemaining=Math.max(0,monthlyBudget-spentThisMonth);
    const trajectoryGap=plannedToDate-spentThisMonth;
    const lastEntry=enriched.length?enriched[enriched.length-1]:null;

    return {
      globalXp,grossXp,penaltyTotal,comebackBonus,penalties,difficulty,
      perfectDayBonus,noSmokingXp,
      smoking:{streak:noSmokingStreak,bestStreak:bestNoSmokingStreak,
        todayXp:lastEntry?lastEntry.smokingXpToday:0,
        status:lastEntry&&lastEntry.cigaretteSmoked===false?"SANS CIGARETTE":lastEntry&&lastEntry.cigaretteSmoked===true?"RESET":"INCONNU"},
      global,attrs,entries:enriched,activeDays:enriched.length,
      finance:{monthlyBudget,spentThisMonth,budgetRemaining,plannedToDate,trajectoryGap},
      sportWeek:{sessions:currentWeekSessions,target:4,max:7,status:currentWeekStatus.label,tone:currentWeekStatus.tone,
        baseXp:sportBase,weeklyAdjustmentXp:sportWeeklyXp},
      lastEntry,
      rules:{
        reading:"1 page = 1 XP",learning:"30 min = 20 XP",sport:"1 séance = 40 XP + ajustement hebdomadaire",
        nutrition:"1 repas conforme = 10 XP",work:"1 action utile = 2 XP",finance:"+10 XP si trajectoire respectée",
        perfectDay:"+50 XP si les 5 objectifs quotidiens sont validés (hors dimanche)",
        smoking:"Jours 1-9 sans cigarette = +5 XP/jour ; dès le jour 10 = +10 XP/jour",
        sunday:"Dimanche = Recovery Day : aucune pénalité",
        penalty:"Les pénalités ne s'appliquent qu'aux journées réellement saisies. Une donnée absente n'est jamais inventée comme échec."
      }
    };
  }

  window.PlayerEngine={compute,globalLevelCost,cumulativeXpForLevel,globalLevelFromXp,attributeLevelFromXp,sportWeeklyAdjustment,DIFFICULTY};
})();
