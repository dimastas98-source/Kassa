/* patch:
 * must = razvoz - qr - ret - cons
 * itog = must - cash - exp - term - payments
 * внизу порядок: Должен нал, KASPI PAY, QR офис, Касса нал · расход, Итог
 */
(function(){
  function ensurePayments(r){
    if(!r.payments || !Array.isArray(r.payments)) r.payments = [];
    return r.payments;
  }
  function paySum(r){
    return ensurePayments(r).reduce((s,p)=>s+n(p.sum),0);
  }
  window.paySum = paySum;

  must = function(r){
    return n(r.razvoz) - n(r.qr) - n(r.ret) - n(r.cons);
  };
  itog = function(r){
    return must(r) - cashSum(r) - expSum(r) - n(r.term) - paySum(r);
  };

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

  function relabelQrOffice(){
    const wrap = document.getElementById("c-daywrap");
    if(!wrap) return;
    // label before #c-qr
    const qr = document.getElementById("c-qr");
    if(qr){
      let lab = qr.previousElementSibling;
      while(lab && lab.tagName !== "LABEL") lab = lab.previousElementSibling;
      if(lab && lab.tagName === "LABEL") lab.textContent = "QR офис";
    }
  }

  function findTermAnchor(){
    return document.getElementById("c-term");
  }

  function renderPaymentsBox(){
    if(typeof recCash !== "function") return;
    const r = recCash();
    if(!r) return;
    const list = ensurePayments(r);
    const rows = list.map((p,i)=>`
      <div class="row" style="justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--line);gap:6px">
        <span style="flex:1">${fmtDtLocal(p.at)}${p.note?` · ${p.note}`:""}</span>
        <b>${fmt(p.sum)}</b>
        <button type="button" class="ghost" data-paydel="${i}" style="flex:0;padding:4px 8px">×</button>
      </div>`).join("");

    let payEl = document.getElementById("c-payments");
    if(!payEl){
      payEl = document.createElement("div");
      payEl.id = "c-payments";
      payEl.style.marginTop = "8px";
      const term = findTermAnchor();
      if(term && term.parentNode){
        if(term.nextSibling) term.parentNode.insertBefore(payEl, term.nextSibling);
        else term.parentNode.appendChild(payEl);
      } else {
        const box = document.getElementById("c-day-rest");
        if(box) box.appendChild(payEl);
      }
    } else {
      const term = findTermAnchor();
      if(term && term.parentNode && payEl.previousElementSibling !== term){
        if(term.nextSibling) term.parentNode.insertBefore(payEl, term.nextSibling);
        else term.parentNode.appendChild(payEl);
      }
    }

    payEl.innerHTML = `
      <div style="margin-top:4px">
        ${rows}
        <div class="row" style="margin-top:6px;gap:6px;flex-wrap:wrap">
          <input id="c-pay-sum" inputmode="numeric" placeholder="сумма" style="flex:1;min-width:90px">
          <input id="c-pay-at" type="datetime-local" style="flex:1;min-width:160px">
          <input id="c-pay-note" placeholder="коммент" style="flex:1;min-width:100px">
          <button type="button" class="ghost" id="c-pay-add" style="flex:0">+</button>
        </div>
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
      if(!sum){ toast("Укажите сумму", "err"); return; }
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
      toast("Добавлено", "ok");
      renderDay();
    };
  }

  if(typeof renderDay === "function"){
    const _rd = renderDay;
    renderDay = function(){
      _rd.apply(this, arguments);
      relabelQrOffice();
      try{
        const r = recCash();
        const box = document.getElementById("c-day-rest");
        if(box && r){
          const pays = paySum(r);
          box.innerHTML = `
            <p>Должен нал. <b>${fmt(must(r))}</b></p>
            <p>KASPI PAY <b>${fmt(r.term)}</b></p>
            <p>QR офис <b>${fmt(r.qr)}</b></p>
            <p>Касса нал. <b>${fmt(cashSum(r))}</b> · расход <b>${fmt(expSum(r))}</b></p>
            ${pays?`<p>Платежи <b>${fmt(pays)}</b></p>`:""}
            <p class="big ${itog(r)>0?"itog-minus":itog(r)<0?"itog-plus":"itog-ok"}">Итог ${fmtItog(itog(r))}</p>`;
        }
      }catch(e){}
      renderPaymentsBox();
    };
  }
})();
