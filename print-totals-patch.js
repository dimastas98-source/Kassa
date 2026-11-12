/* patch: print monthly totals */
(function(){
  if (typeof renderMonthTotals !== "function" || typeof printHtml !== "function") return;

  function printMonthTotals(){
    const months = (typeof t === "function" ? t("monthNames") : "январь,февраль,март,апрель,май,июнь,июль,август,сентябрь,октябрь,ноябрь,декабрь").split(",");
    const title = (months[C.m] || "") + " " + C.y;
    const rows = monthDriverTotals(C.y, C.m);
    if(!rows.length){
      if(typeof toast === "function") toast("Нет данных за месяц", "err");
      return;
    }
    let sumCash=0, sumAdv=0, sumLunchCity=0, sumTrip=0, sumDays=0, sumOffs=0;
    const body = rows.map(x=>{
      sumCash += x.cash; sumAdv += x.adv; sumLunchCity += x.lunchCity; sumTrip += x.trip;
      sumDays += x.days; sumOffs += x.offs;
      const rs = Object.entries(x.raions||{}).map(([k,v])=>k+": "+(v.alone+v.pair)).join(", ") || "—";
      return `<tr>
        <td>${x.name}</td>
        <td class="n">${fmtItog(x.cash)}</td>
        <td class="n">${fmt(x.adv)}</td>
        <td class="n">${fmt(x.lunchCity)}</td>
        <td class="n">${fmt(x.trip)}</td>
        <td class="n">${x.days}</td>
        <td class="n">${x.offs}</td>
        <td>${rs}</td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Итоги ${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px;color:#111}
      h1{font-size:18px;margin:0 0 10px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #ccc;padding:5px 6px;text-align:left}
      th{background:#eee}
      td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
      tr.sum td{font-weight:700}
      @media print{button{display:none}}
    </style></head><body>
    <h1>Итоги месяца · ${title}</h1>
    <table>
      <tr>
        <th>Водитель</th>
        <th class="n">Итог кассы</th>
        <th class="n">Аванс</th>
        <th class="n">Аванс обед</th>
        <th class="n">Командир.</th>
        <th class="n">Раб.</th>
        <th class="n">Вых.</th>
        <th>Районы</th>
      </tr>
      ${body}
      <tr class="sum">
        <td>Всего</td>
        <td class="n">${fmtItog(sumCash)}</td>
        <td class="n">${fmt(sumAdv)}</td>
        <td class="n">${fmt(sumLunchCity)}</td>
        <td class="n">${fmt(sumTrip)}</td>
        <td class="n">${sumDays}</td>
        <td class="n">${sumOffs}</td>
        <td></td>
      </tr>
    </table>
    <p style="margin-top:16px">Кассир ____________</p>
    <button onclick="window.print()">Печать</button>
    </body></html>`;
    printHtml(html);
  }

  const _renderMonthTotals = renderMonthTotals;
  renderMonthTotals = function(){
    _renderMonthTotals();
    const box = document.getElementById("c-tot-box");
    if(!box) return;
    if(document.getElementById("c-print-totals")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ghost";
    btn.id = "c-print-totals";
    btn.style.cssText = "width:100%;margin-top:12px";
    btn.textContent = "Печать итогов месяца";
    btn.onclick = printMonthTotals;
    // insert before districts toggle if present, else at end
    const tog = document.getElementById("c-raion-toggle");
    if(tog && tog.parentNode === box){
      box.insertBefore(btn, tog);
    } else {
      box.appendChild(btn);
    }
  };
})();
