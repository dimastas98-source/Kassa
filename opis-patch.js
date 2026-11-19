/* patch: opis — bold razvoz + Касса; Должен нал normal */
(function(){
  if (typeof printOpis !== "function" || typeof opisCardHtml !== "function") return;

  opisCardHtml = function(r, name, date){
    const billsOnly = BILLS.reduce((a,b)=>a+n(r.bills&&r.bills[b])*b,0);
    const kassa = billsOnly + n(r.coins);
    const qty = b => n(r.bills && r.bills[b]);
    const bill = (nom, label, sum) => `<tr>
      <td class="lab">${label}</td>
      <td class="n amt">${sum===""?"":fmt(sum)}</td>
      <td class="n nom">${fmt(nom)}</td>
      <td class="star">*</td>
      <td class="n qty">${qty(nom)}</td>
      <td class="n sum">${fmt(qty(nom)*nom)}</td>
    </tr>`;
    return `<div class="slip">
      <table class="g head">
        <tr><td>Дата: ${fmtDateRu(date)}</td><td class="r">Район: ${r.raion||"—"}</td></tr>
        <tr><td colspan="2">Имя: ${name||"—"}</td></tr>
      </table>
      <table class="g bills">
        <colgroup>
          <col class="c-lab"><col class="c-amt"><col class="c-nom"><col class="c-star"><col class="c-qty"><col class="c-sum">
        </colgroup>
        <tr><td colspan="2" class="title c">Расход</td><td colspan="4" class="title c">Наличка</td></tr>
        ${bill(20000, "Стоянка:", r.park)}
        ${bill(10000, "Обед:", r.lunch)}
        ${bill(5000, "Заправки:", r.fuel)}
        ${bill(2000, "Прочее:", r.other)}
        ${bill(1000, "Аванс:", r.adv)}
        ${bill(500, "", "")}
        <tr><td class="lab">Итог:</td><td class="n amt">${fmt(expSum(r))}</td><td colspan="4" class="n sum">${fmt(billsOnly)}</td></tr>
        <tr><td class="lab">Монеты:</td><td class="n amt">${fmt(r.coins)}</td><td colspan="4"></td></tr>
        <tr><td class="lab">Каспи</td><td class="n amt">${fmt(r.term)}</td><td colspan="4"></td></tr>
      </table>
      <table class="g bot">
        <tr><td colspan="2" class="title">Развоз: ${fmt(r.razvoz)}</td></tr>
        <tr><td>Должен нал:</td><td class="n">${fmt(must(r))}</td></tr>
        <tr><td>Расход:</td><td class="n">${fmt(expSum(r))}</td></tr>
        <tr><td>Касса:</td><td class="n bold">${fmt(kassa)}</td></tr>
        <tr><td>Каспи:</td><td class="n">${fmt(r.term)}</td></tr>
        <tr class="tot"><td>Итог:</td><td class="n">${fmtItog(itog(r))}</td></tr>
      </table>
      <div class="stamp">М.П.</div>
    </div>`;
  };

  printOpis = function(){
    grabCashDay();
    const r = recCash();
    const name = C.display || C.who || "";
    const card = opisCardHtml(r, name, C.date);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Опись ${name}</title>
    <style>
      @page{size:A4 landscape;margin:8mm}
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;color:#000;margin:0}
      .sheet{width:277mm;height:190mm;display:flex;justify-content:flex-end}
      .slip{width:76mm;font-size:10px;font-family:Arial,sans-serif;color:#000;border:1.5px solid #000;padding:2mm}
      table.g{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:1.5mm}
      table.g td{padding:1px 3px;vertical-align:middle;border:1px solid #000;height:5.2mm}
      table.head td{height:5.6mm}
      table.bills col.c-lab{width:38%}
      table.bills col.c-amt{width:20%}
      table.bills col.c-nom{width:12%}
      table.bills col.c-star{width:4%}
      table.bills col.c-qty{width:8%}
      table.bills col.c-sum{width:18%}
      td.lab{text-align:left;white-space:nowrap}
      td.amt{white-space:nowrap}
      td.n{text-align:right;font-variant-numeric:tabular-nums;font-family:"Courier New",monospace}
      td.star{text-align:center}
      td.nom,td.qty,td.sum{white-space:nowrap;padding-left:1px;padding-right:1px}
      td.nom{font-size:8.5px}
      td.r{text-align:right}
      td.c{text-align:center}
      td.title{font-weight:700;background:#f3f3f3}
      td.bold,.bold{font-weight:700}
      table.bot{margin-top:2mm;width:100%}
      tr.tot td{font-weight:700}
      .stamp{margin:3mm auto 1mm;width:24mm;height:22mm;border:1.5px solid #000;text-align:center;line-height:22mm;font-size:10px}
      .no-print{margin:8px}
      @media print{.no-print{display:none}}
    </style></head><body>
    <div class="sheet">${card}</div>
    <div class="no-print"><button onclick="window.print()">Печать</button>
    <span style="margin-left:8px;color:#555">A4 альбомная, масштаб 100%. Опись справа, уже и с рамкой</span></div>
    </body></html>`;
    printHtml(html);
  };

  if(typeof $ === "function" && $("c-print")) $("c-print").onclick = printOpis;
})();
