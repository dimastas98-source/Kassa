/* patch: merge days on pull/save to prevent data loss */
(function(){
  if (typeof save !== "function" || typeof pull !== "function") return;

  function dayRank(r){
    if(!r || typeof r !== "object") return 0;
    let score = 0;
    if(r.status === "accepted") score += 300;
    else if(r.status === "closed") score += 200;
    else if(r.razvoz || r.qr || r.raion || r.ret || r.cons || r.term || r.park || r.lunch || r.fuel || r.other || r.adv || r.coins) score += 100;
    if(r.off) score += 40;
    if(r.partner) score += 5;
    if(r.bills){
      for(const k in r.bills){ if(Number(r.bills[k])) { score += 10; break; } }
    }
    return score;
  }

  function pickDay(a, b){
    if(!a) return b;
    if(!b) return a;
    const ta = Number(a.updatedAt) || 0;
    const tb = Number(b.updatedAt) || 0;
    if(ta !== tb) return ta > tb ? a : b;
    return dayRank(a) >= dayRank(b) ? a : b;
  }

  function mergeDays(localDays, remoteDays){
    const out = {};
    const dates = new Set([
      ...Object.keys(localDays || {}),
      ...Object.keys(remoteDays || {})
    ]);
    for(const date of dates){
      out[date] = {};
      const L = (localDays && localDays[date]) || {};
      const R = (remoteDays && remoteDays[date]) || {};
      const logins = new Set([...Object.keys(L), ...Object.keys(R)]);
      for(const login of logins){
        out[date][login] = pickDay(L[login], R[login]);
      }
    }
    return out;
  }

  function mergeUsers(localUsers, remoteUsers){
    const map = new Map();
    (remoteUsers || []).forEach(u => { if(u && u.login) map.set(u.login, Object.assign({}, u)); });
    (localUsers || []).forEach(u => {
      if(!u || !u.login) return;
      const prev = map.get(u.login);
      if(!prev) map.set(u.login, Object.assign({}, u));
      else {
        // keep both fields; prefer non-empty local name/pass if remote empty
        map.set(u.login, Object.assign({}, prev, u, {
          name: (u.name && String(u.name).trim()) || prev.name,
          pass: (u.pass && String(u.pass).trim()) || prev.pass
        }));
      }
    });
    return Array.from(map.values());
  }

  function mergeState(local, remote){
    const L = local || {};
    const R = remote || {};
    const out = {
      users: mergeUsers(L.users, R.users),
      cash: Object.assign({}, R.cash || {}, L.cash || {}),
      days: mergeDays(L.days, R.days),
      raions: Array.from(new Set([...(R.raions||[]), ...(L.raions||[])])),
      tripRates: Object.assign({}, R.tripRates || {}, L.tripRates || {}),
      lunchRates: Object.assign({}, R.lunchRates || {}, L.lunchRates || {})
    };
    // payUrl: keep non-empty
    if(out.cash){
      out.cash.payUrl = (L.cash && L.cash.payUrl) || (R.cash && R.cash.payUrl) || out.cash.payUrl;
    }
    return out;
  }

  function stampDirtyDays(s){
    // mark currently edited day cells with updatedAt if missing recent stamp
    // (callers already mutate S; we stamp active form records)
    try{
      if(typeof C !== "undefined" && C.date && C.who && s.days && s.days[C.date] && s.days[C.date][C.who]){
        s.days[C.date][C.who].updatedAt = Date.now();
      }
      if(typeof D !== "undefined" && D.date && typeof who === "function"){
        const w = who();
        if(w && s.days && s.days[D.date] && s.days[D.date][w]){
          s.days[D.date][w].updatedAt = Date.now();
        }
      }
    }catch(e){}
  }

  const _save = save;
  save = function(s){
    stampDirtyDays(s);
    localStorage.setItem(KEY, JSON.stringify(s));
    if(!ONLINE) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async ()=>{
      try{
        // read server first, merge, then write — avoids clobbering parallel edits
        const r = await fetch("/api/state", { cache:"no-store" });
        if(r.ok){
          const remote = await r.json();
          const merged = mergeState(s, remote);
          // keep our newer cells (mergeState already picks by updatedAt/rank)
          S = merged;
          localStorage.setItem(KEY, JSON.stringify(merged));
          await fetch("/api/state", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify(merged)
          });
        } else {
          await fetch("/api/state", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify(s)
          });
        }
      }catch(e){}
    }, 400);
  };

  pull = async function(){
    if(!ONLINE) return false;
    try{
      const r = await fetch("/api/state", { cache:"no-store" });
      if(!r.ok) return false;
      const remote = await r.json();
      remote.users = remote.users || [];
      remote.cash = remote.cash || { login:"kassa", pass:"0000" };
      if(!remote.cash.payUrl && typeof PAY_DEFAULT !== "undefined") remote.cash.payUrl = PAY_DEFAULT;
      remote.days = remote.days || {};
      if(typeof ensureRaions === "function") ensureRaions(remote);

      const localHas = (S.users&&S.users.length) || Object.keys(S.days||{}).length;
      const remoteEmpty = !remote.users.length && !Object.keys(remote.days||{}).length;
      if(remoteEmpty && localHas){
        save(S);
        return false;
      }

      // Merge instead of replace — this is the main fix
      const merged = mergeState(S, remote);
      S = merged;
      localStorage.setItem(KEY, JSON.stringify(merged));
      return true;
    }catch(e){ return false; }
  };

  // Also stamp on common persist paths if available
  if(typeof persistDriver === "function"){
    const _pd = persistDriver;
    persistDriver = function(){
      const r = typeof rec === "function" ? rec() : null;
      if(r) r.updatedAt = Date.now();
      return _pd.apply(this, arguments);
    };
  }
  if(typeof grabCashDay === "function"){
    const _g = grabCashDay;
    grabCashDay = function(){
      _g.apply(this, arguments);
      try{
        const r = typeof recCash === "function" ? recCash() : null;
        if(r) r.updatedAt = Date.now();
      }catch(e){}
    };
  }
})();
