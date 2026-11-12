/* patch: under driver calendar — advances and lunch-advances by day */
(function(){
  if (typeof renderCal !== "function") return;

  function ensureAdvBox(){
    let box = document.getElementById("c-cal-advlist");
    if(box) return box;
    const cal = document.getElementById("c-cal");
    if(!cal || !cal.parentNode) return null;
    box = document.createElement("div");
    box.id = "c-cal-advlist";
    box.style.marginTop = "12px";
    cal.parentNode.appendChild(box);
    return box;
  }

  function collectMonth(login, y, m){
    const prefix = y + "-" + String(m+1).padStart(2,"0") + "-";
    const adv = [];
    const ladv = [];
    for(const date of Object.keys(S.days||{})){
      if(!date.startsWith(prefix)) continue;
      const r = S.days[date][login];
      if(!r || r.off) continue;
      if(r.status!=="closed" && r.status!=="accepted") continue;
      const ad = n(r.adv);
      if(ad) adv.push({date, sum: ad});
      const ln = n(r.lunch);
      if(ln){
        const lr = (typeof lunchRate === "function") ? lunchRate(r.raion) : 0;
        let extra = 0;
        if(!lr) extra = ln;
        else if(ln > lr) extra = ln - lr;
        if(extra) ladv.push({date, sum: extra, note: lr ? ("обед "+fmt(ln)+" − "+fmt(lr)) : "весь обед"});
      }
    }
    adv.sort((a,b)=>a.date.localeCompare(b.date));
    ladv.sort((a,b)=>a.date.localeCompare(b.date));
    return {adv, ladv};
  }

  function rowHtml(d){
    return `<div class="row" style="justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--line)">`+
      `<span>${d.date}${d.note?` <span class="muted">${d.note}</span>`:""}</span>`+
      `<b>${fmt(d.sum)}</b></div>`;
  }

  const _renderCal = renderCal;
  renderCal = function(){
    _renderCal();
    const box = ensureAdvBox();
    if(!box || !C.who){ if(box) box.innerHTML = ""; return; }
    const {adv, ladv} = collectMonth(C.who, C.y, C.m);
    const sumAdv = adv.reduce((s,x)=>s+x.sum, 0);
    const sumLadv = ladv.reduce((s,x)=>s+x.sum, 0);
    let html = "";
    html += `<h3 style="margin:12px 0 6px">Авансы</h3>`;
    if(adv.length){
      html += adv.map(rowHtml).join("");
      html += `<p class="muted" style="margin-top:6px">Всего ${fmt(sumAdv)}</p>`;
    } else {
      html += `<p class="muted">Нет авансов за этот месяц</p>`;
    }
    html += `<h3 style="margin:14px 0 6px">Обед аванс</h3>`;
    if(ladv.length){
      html += ladv.map(rowHtml).join("");
      html += `<p class="muted" style="margin-top:6px">Всего ${fmt(sumLadv)}</p>`;
    } else {
      html += `<p class="muted">Нет обед-авансов за этот месяц</p>`;
    }
    box.innerHTML = html;
  };
})();
