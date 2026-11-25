/* patch:
 * 1) must() = razvoz - qr - ret - cons  (без term / KASPI PAY)
 * 2) платежи на терминал кассира: несколько, с датой и временем
 */
(function(){
  // --- формула: KASPI PAY не трогает нал ---
  if (typeof must === "function") {
    must = function(r){
      return n(r.razvoz) - n(r.qr) - n(r.ret) - n(r.cons);
    };
  }

  function ensurePayments(r){
    if(!r.payments || !Array.isArray(r.payments)) r.payments = [];
    return r.payments;
  }
  function paySum(r){
    return ensurePayments(r).reduce((s,p)=>s+n(p.sum),0);
  }
  function fmtDtLocal(iso){
    if(!iso) return "—";
    const d = new Date(iso);
    if(isNaN(d.getTime())) return String(iso);
    const pad = x => String(x).padStart(2,"0");
    return pad(d.getDate())+"."+pad(d.getMonth()+1)+"."+d.getFullYear()+" "+pad(d.getHours())+":"+pad(d.getMinutes());
  }
  function nowLocalInput(){
    const d = new Date();
    const pad = x => String(x).padStart(2,"0");
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
  }

  function renderPaymentsBox(){
    const box = document.getElementById("c-day-rest");
    if(!box || typeof recCash !== "function") return;
    const r = recCash();
    if(!r) return;
    const list = ensurePayments(r);
    const rows = list.map((p,i)=>`
      <div class="row" style="justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--line);gap:6px">
        <span style="flex:1">${fmtDtLocal(p.at)}${p.note?` <span class="muted">· ${p.note}</span>`:""}</span>
        <b>${fmt(p.sum)}</b>
        <button type="button" class="ghost" data-paydel="${i}" style="flex:0;padding:4px 8px">×</button>
      </div>`).join("") || `<p class="muted">Платежей пока нет</p>`;
    const total = paySum(r);
    const i = itog(r);
    const left = i - total;

    // keep existing totals block, append payments
    let payEl = document.getElementById("c-payments");
    if(!payEl){
      payEl = document.createElement("div");
      payEl.id = "c-payments";
      payEl.style.marginTop = "12px";
      box.appendChild(payEl);
    }
    payEl.innerHTML = `
      <h3 style="margin:8px 0 4px">Платежи (терминал)</h3>
      <p class="muted" style="margin:0 0 6px">Оплаты на ваш терминал при сдаче кассы. Несколько записей, дата и время.</p>
      ${rows}
      <p style="margin-top:6px">Всего платежей <b>${fmt(total)}</b>${i>0?` · остаток минуса <b>${fmt(left)}</b>`:""}</p>
      <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">
        <input id="c-pay-sum" inputmode="numeric" placeholder="сумма" style="flex:1;min-width:90px">
        <input id="c-pay-at" type="datetime-local" style="flex:1;min-width:160px">
        <input id="c-pay-note" placeholder="коммент" style="flex:1;min-width:100px">
        <button type="button" class="ghost" id="c-pay-add" style="flex:0">+ платёж</button>
      </div>`;

    const at = document.getElementById("c-pay-at");
    if(at && !at.value) at.value = nowLocalInput();

    payEl.querySelectorAll("[data-paydel]").forEach(btn=>{
      btn.onclick = ()=>{
        const idx = Number(btn.dataset.paydel);
        const rr = recCash();
        ensurePayments(rr).splice(idx,1);
        rr.updatedAt = Date.now();
        save(S);
        renderDay();
      };
    });
    const add = document.getElementById("c-pay-add");
    if(add) add.onclick = ()=>{
      const sumEl = document.getElementById("c-pay-sum");
      const atEl = document.getElementById("c-pay-at");
      const noteEl = document.getElementById("c-pay-note");
      const sum = n(sumEl && sumEl.value);
      if(!sum){ toast("Укажите сумму платежа", "err"); return; }
      let atVal = (atEl && atEl.value) || "";
      if(atVal && atVal.length === 16) atVal = atVal + ":00";
      const iso = atVal ? new Date(atVal).toISOString() : new Date().toISOString();
      const rr = recCash();
      ensurePayments(rr).push({
        sum,
        at: iso,
        note: (noteEl && noteEl.value || "").trim()
      });
      rr.updatedAt = Date.now();
      save(S);
      toast("Платёж добавлен", "ok");
      renderDay();
    };
  }

  // hook after renderDay
  if(typeof renderDay === "function"){
    const _rd = renderDay;
    renderDay = function(){
      _rd.apply(this, arguments);
      // refresh must/itog text (formula changed)
      try{
        const r = recCash();
        const box = document.getElementById("c-day-rest");
        if(box && r){
          box.innerHTML = `
            <p>Касса нал. <b>${fmt(cashSum(r))}</b> · расход <b>${fmt(expSum(r))}</b></p>
            <p>Должен нал. <b>${fmt(must(r))}</b> <span class="muted">(без KASPI PAY)</span></p>
            <p>KASPI PAY <b>${fmt(r.term)}</b> <span class="muted">— справочно, на нал не влияет</span></p>
            <p class="big ${itog(r)>0?"itog-minus":itog(r)<0?"itog-plus":"itog-ok"}">Итог ${fmtItog(itog(r))}</p>`;
        }
      }catch(e){}
      renderPaymentsBox();
    };
  }

  // also refresh driver must display after paintTotals
  if(typeof paintTotals === "function"){
    const _pt = paintTotals;
    paintTotals = function(){
      _pt.apply(this, arguments);
      // must already uses new formula
    };
  }
})();
