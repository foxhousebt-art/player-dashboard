"use strict";

(function(){
  const LEVEL_MAX = 100;

  function isoDate(d){
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
  }

  function parseDateOnly(s){
    const [y,m,d] = String(s).split("-").map(Number);
    return new Date(y, m-1, d, 12, 0, 0);
  }

  function mondayOf(date){
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(12,0,0,0);
    return d;
  }

  function sundayOf(date){
    const d = mondayOf(date);
    d.setDate(d.getDate()+6);
    return d;
  }

  function daysInMonth(date){
    return new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
  }

  function globalLevelCost(level){
    return 120 + 10 * (level - 1);
  }

  function cumulativeXpForLevel(level){
    if(level <= 1) return 0;
    const k = level - 1;
    return 120*k + 5*k*(k-1);
  }

  function globalLevelFromXp(xp){
    xp = Math.max(0, Number(xp)||0);
    let level = 1;
    while(level < LEVEL_MAX && xp >= cumulativeXpForLevel(level+1)){
      level++;
    }
    const currentFloor = cumulativeXpForLevel(level);
    const nextFloor = level >= LEVEL_MAX ? currentFloor : cumulativeXpForLevel(level+1);
    const progress = level >= LEVEL_MAX ? 100 :
      Math.max(0, Math.min(100, ((xp-currentFloor)/(nextFloor-currentFloor))*100));

    return {
      level,
      currentFloor,
      nextFloor,
      progress,
      xpIntoLevel: xp-currentFloor,
      xpNeededForNext: level >= LEVEL_MAX ? 0 : nextFloor-xp
    };
  }

  // 100 XP par niveau pour chaque fondamental.
  function attributeLevelFromXp(xp){
    xp = Math.max(0, Number(xp)||0);
    const level = Math.floor(xp / 100) + 1;
    const current = xp % 100;
    return {
      level,
      currentXp: current,
      targetXp: 100,
      progress: current
    };
  }

  function sportWeeklyAdjustment(sessions, completedWeek){
    // Bonus cumulatif au moment où le seuil est atteint.
    if(sessions >= 7) return 120;
    if(sessions === 6) return 80;
    if(sessions === 5) return 60;
    if(sessions === 4) return 40;

    // On ne sanctionne pas une semaine encore en cours.
    if(completedWeek && sessions <= 3) return -40;
    return 0;
  }

  function sportStatus(sessions, completedWeek){
    if(sessions >= 7) return {label:"EXCEPTIONNEL", tone:"good"};
    if(sessions >= 4) return {label:"OBJECTIF ATTEINT", tone:"good"};
    if(completedWeek) return {label:"NÉGATIF", tone:"bad"};
    return {label:"EN COURS", tone:"neutral"};
  }

  function normalizeEntries(entries){
    const byDate = new Map();

    (entries || []).forEach(raw=>{
      if(!raw || !raw.date) return;
      const date = String(raw.date).slice(0,10);
      // Une validation remplace la précédente pour la même journée.
      byDate.set(date, {
        date,
        pages: Math.max(0, Number(raw.pages)||0),
        learningMinutes: Math.max(0, Number(raw.learningMinutes)||0),
        sport: Boolean(raw.sport === true || raw.sport === 1 || raw.sport === "1" || raw.sport === "true"),
        compliantMeals: Math.max(0, Number(raw.compliantMeals)||0),
        workActions: Math.max(0, Number(raw.workActions)||0),
        expenses: Math.max(0, Number(raw.expenses)||0),
        cigaretteSmoked:
          raw.cigaretteSmoked === true || raw.cigaretteSmoked === 1 || raw.cigaretteSmoked === "1" || raw.cigaretteSmoked === "true"
            ? true
            : raw.cigaretteSmoked === false || raw.cigaretteSmoked === 0 || raw.cigaretteSmoked === "0" || raw.cigaretteSmoked === "false"
              ? false : null
      });
    });

    return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }

  function compute(entries, settings={}){
    const clean = normalizeEntries(entries);
    const monthlyBudget = Math.max(0, Number(settings.monthlyBudget ?? 1000));
    const today = new Date();
    today.setHours(12,0,0,0);

    let readingXp = 0;
    let learningXp = 0;
    let sportBaseXp = 0;
    let nutritionXp = 0;
    let workXp = 0;
    let financeXp = 0;
    let perfectDayBonus = 0;
    let noSmokingXp = 0;
    let noSmokingStreak = 0;
    let bestNoSmokingStreak = 0;

    const monthSpend = new Map();
    const weeks = new Map();
    const enriched = [];

    clean.forEach(entry=>{
      const date = parseDateOnly(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
      const weekStart = mondayOf(date);
      const weekKey = isoDate(weekStart);

      if(!weeks.has(weekKey)){
        weeks.set(weekKey, {start:weekStart, sessions:0});
      }
      if(entry.sport) weeks.get(weekKey).sessions++;

      readingXp += entry.pages;
      learningXp += Math.floor(entry.learningMinutes / 30) * 20;
      if(entry.sport) sportBaseXp += 40;
      nutritionXp += entry.compliantMeals * 10;
      workXp += entry.workActions * 2;

      const cumulativeSpend = (monthSpend.get(monthKey)||0) + entry.expenses;
      monthSpend.set(monthKey, cumulativeSpend);

      const trajectoryAllowed = monthlyBudget * (date.getDate() / daysInMonth(date));
      const financeOk = cumulativeSpend <= trajectoryAllowed + 1e-9;
      if(financeOk) financeXp += 10;

      // Sport n'est plus obligatoire quotidiennement.
      // Perfect Day = validation des 5 objectifs réellement quotidiens.
      const isSunday = date.getDay() === 0;
      const perfectDay =
        !isSunday &&
        entry.pages >= 10 &&
        entry.learningMinutes >= 30 &&
        entry.compliantMeals >= 3 &&
        entry.workActions >= 1 &&
        financeOk;

      if(perfectDay) perfectDayBonus += 50;

      let smokingXpToday = 0;
      if(entry.cigaretteSmoked === true){
        noSmokingStreak = 0;
      } else if(entry.cigaretteSmoked === false){
        noSmokingStreak += 1;
        bestNoSmokingStreak = Math.max(bestNoSmokingStreak, noSmokingStreak);
        smokingXpToday = noSmokingStreak >= 10 ? 10 : 5;
        noSmokingXp += smokingXpToday;
      }

      enriched.push({
        ...entry, financeOk, trajectoryAllowed, cumulativeSpend, perfectDay,
        recoveryDay:isSunday, noSmokingStreak, smokingXpToday
      });
    });

    let sportWeeklyXp = 0;
    let currentWeekSessions = 0;
    let currentWeekStatus = {label:"EN COURS", tone:"neutral"};

    const currentMonday = mondayOf(today);
    const currentWeekKey = isoDate(currentMonday);

    weeks.forEach((week, key)=>{
      const completed = sundayOf(week.start) < today;
      const adjustment = sportWeeklyAdjustment(week.sessions, completed);
      sportWeeklyXp += adjustment;

      if(key === currentWeekKey){
        currentWeekSessions = week.sessions;
        currentWeekStatus = sportStatus(week.sessions, completed);
      }
    });

    // Si aucune entrée sport cette semaine.
    if(!weeks.has(currentWeekKey)){
      currentWeekStatus = sportStatus(0, false);
    }

    const sportXp = Math.max(0, sportBaseXp + sportWeeklyXp);

    const categoryXp = {
      lecture: readingXp,
      apprentissage: learningXp,
      sport: sportXp,
      nutrition: nutritionXp,
      travail: workXp,
      finance: financeXp
    };

    const globalXp =
      readingXp + learningXp + sportXp + nutritionXp + workXp + financeXp +
      perfectDayBonus + noSmokingXp;

    const global = globalLevelFromXp(globalXp);

    const attrs = {};
    Object.entries(categoryXp).forEach(([key,xp])=>{
      attrs[key] = {xp, ...attributeLevelFromXp(xp)};
    });

    const nowMonthKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
    const spentThisMonth = monthSpend.get(nowMonthKey)||0;
    const plannedToDate = monthlyBudget * (today.getDate()/daysInMonth(today));
    const budgetRemaining = Math.max(0, monthlyBudget-spentThisMonth);
    const trajectoryGap = plannedToDate-spentThisMonth;

    const lastEntry = enriched.length ? enriched[enriched.length-1] : null;

    return {
      globalXp,
      perfectDayBonus,
      noSmokingXp,
      smoking:{
        streak:noSmokingStreak,
        bestStreak:bestNoSmokingStreak,
        todayXp:enriched.length ? enriched[enriched.length-1].smokingXpToday : 0,
        status:enriched.length && enriched[enriched.length-1].cigaretteSmoked === false ? "SANS CIGARETTE" :
          enriched.length && enriched[enriched.length-1].cigaretteSmoked === true ? "RESET" : "INCONNU"
      },
      global,
      attrs,
      entries: enriched,
      activeDays: enriched.length,
      finance: {
        monthlyBudget,
        spentThisMonth,
        budgetRemaining,
        plannedToDate,
        trajectoryGap
      },
      sportWeek: {
        sessions: currentWeekSessions,
        target: 4,
        max: 7,
        status: currentWeekStatus.label,
        tone: currentWeekStatus.tone,
        baseXp: sportBaseXp,
        weeklyAdjustmentXp: sportWeeklyXp
      },
      lastEntry,
      rules: {
        reading: "1 page = 1 XP",
        learning: "30 min = 20 XP",
        sport: "1 séance = 40 XP + ajustement hebdomadaire",
        nutrition: "1 repas conforme = 10 XP",
        work: "1 action utile = 2 XP",
        finance: "+10 XP si trajectoire respectée",
        perfectDay: "+50 XP si les 5 objectifs quotidiens sont validés (hors dimanche)",
        smoking: "Jours 1-9 sans cigarette = +5 XP/jour ; dès le jour 10 = +10 XP/jour",
        sunday: "Dimanche = Recovery Day : aucune obligation de Perfect Day"
      }
    };
  }

  window.PlayerEngine = {
    compute,
    globalLevelCost,
    cumulativeXpForLevel,
    globalLevelFromXp,
    attributeLevelFromXp,
    sportWeeklyAdjustment
  };
})();
