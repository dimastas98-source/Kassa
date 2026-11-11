/* patch: work days detail = date, partner, district */
(function(){
  if (typeof monthDriverTotals !== "function" || typeof renderMonthTotals !== "function") return;

  const _monthDriverTotals = monthDriverTotals;
  monthDriverTotals = function(y, m){
    const rows = _monthDriverTotals(y, m);
    const prefix = y + "-" + String(m+1).padStart(2,"0") + "-";
    for(const row of rows){
      const detailed = [];
      for(const date of Object.keys(S.days||{})){
        if(!date.startsWith(prefix)) continue;
        const r = S.days[date][row.login];
        if(!r || r.off) continue;
        if(r.status!=="closed" && r.status!=="accepted") continue;
        const pn = r.partner
          ? ((S.users.find(u=>u.login===r.partner)||{}).name || r.partner)
          : "один";
        detailed.push({
          date: date,
          with: pn,
          raion: (r.raion||"").trim() || "—"
        });
      }
      detailed.sort((a,b)=>a.date.localeCompare(b.date));
      row.workDaysDetail = detailed;
    }
    return rows;
  };

  const _renderMonthTotals = renderMonthTotals;
  renderMonthTotals = function(){
    _renderMonthTotals();
    const box = document.getElementById("c-tot-box");
    if(!box) return;
    const rows = monthDriverTotals(C.y, C.m);
    box.querySelectorAll("[data-work]").forEach(btn=>{
      btn.onclick = ()=>{
        const login = btn.dataset.work;
        const row = rows.find(r=>r.login===login);
        if(!row) return;
        const det = document.getElementById("c-adv-detail");
        if(det && det.dataset.who===login && det.dataset.kind==="work"){ det.remove(); return; }
        const old = document.getElementById("c-adv-detail");
        if(old) old.remove();
        const items = row.workDaysDetail || [];
        const list = items.map(d=>
          `<div class="row" style="justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid var(--line)">`+
          `<span style="flex:0 0 7em">${d.date}</span>`+
          `<span style="flex:1">${d.with}</span>`+
          `<b style="flex:0 0 auto">${d.raion}</b>`+
          `</div>`
        ).join("") || `<p class="muted">Нет дней</p>`;
        const el = document.createElement("div");
        el.id = "c-adv-detail";
        el.dataset.who = login;
        el.dataset.kind = "work";
        el.className = "card";
        el.style.marginTop = "8px";
        el.innerHTML =
          `<h3>Рабочие дни · ${row.name}</h3>`+
          `<div class="row muted" style="justify-content:space-between;gap:8px;padding:4px 0">`+
          `<span style="flex:0 0 7em">Дата</span><span style="flex:1">С кем</span><span>Район</span></div>`+
          list+
          `<p class="muted" style="margin-top:6px">Всего ${items.length}</p>`;
        box.appendChild(el);
      };
    });
  };
})();
