/* cashier */
let C = { who:null, y:null, m:null, date:null };

function openCash(){
  show("s-cash");
  const now = new Date();
  if(C.y==null){ C.y=now.getFullYear(); C.m=now.getMonth(); }
  if(!C.date) C.date = today();
  showCash("month");
}
function shiftDate(iso, days){
  const d = new Date(iso+"T12:00:00");
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function showCash(view){
  C.view = view;
  const tabs = $("c-tabs");
  if(tabs) tabs.style.display = (view==="month"||view==="today"||view==="staff")?"flex":"none";
  if($("c-monthall")) $("c-monthall").style.display = view==="month"?"block":"none";
  if($("c-daylist")) $("c-daylist").style.display = view==="daylist"?"block":"none";
  $("c-today").style.display = view==="today"?"block":"none";
  $("c-staff").style.display = view==="staff"?"block":"none";
  $("c-calwrap").style.display = view==="cal"?"block":"none";
  $("c-daywrap").style.display = view==="day"?"block":"none";
  $("c-back").style.display = (view==="month"||view==="today")?"none":"inline-block";
  if(view==="month"){ $("c-path").textContent="календарь"; renderAllCal(); }
  if(view==="daylist"){ $("c-path").textContent=C.date; renderDayList(); }
  if(view==="today"){ $("c-path").textContent=C.date; renderBoard(); }
  if(view==="staff"){ $("c-path").textContent="сотрудники"; fillPayUrl(); renderRaionAdmin(); renderDrivers(); }
  if(view==="cal"){ $("c-path").textContent=(C.display||C.who)+" · "+t("calendar"); renderCal(); }
  if(view==="day"){ $("c-path").textContent=(C.display||C.who)+" · "+C.date; renderDay(); }
}
$("c-day-prev").onclick = ()=>{ C.date = shiftDate(C.date||today(), -1); renderBoard(); $("c-path").textContent=C.date; };
$("c-day-next").onclick = ()=>{ C.date = shiftDate(C.date||today(), 1); renderBoard(); $("c-path").textContent=C.date; };
$("c-tab-month").onclick = ()=> showCash("month");
$("c-tab-today").onclick = ()=> showCash("today");
$("c-open-staff").onclick = ()=> showCash("staff");
$("c-back").onclick = ()=>{
  if($("c-daywrap").style.display!=="none") showCash("daylist");
  else if($("c-daylist") && $("c-daylist").style.display!=="none") showCash("month");
  else if($("c-calwrap").style.display!=="none") showCash("daylist");
  else showCash("month");
};
function dayCrew(date){
  const out=[];
  for(const u of (S.users||[])){
    const r = (S.days[date]&&S.days[date][u.login]) || null;
    const work = r && (n(r.razvoz) || r.status==="closed" || r.status==="accepted");
    if(!work){ out.push({u, r, mark:"нет", cls:"off"}); continue; }
    if(r.status==="accepted") out.push({u, r, mark:t("paid"), cls:"done"});
    else if(r.status==="closed") out.push({u, r, mark:t("hands"), cls:"wait"});
    else out.push({u, r, mark:"не сдал", cls:"off"});
  }
  return out;
}
function dayAllPaid(date){
  const rows = dayCrew(date).filter(x=>x.mark!=="нет");
  return rows.length && rows.every(x=>x.cls==="done");
}
function renderAllCal(){
  const months=t("monthNames").split(",");
  $("c-all-month").textContent = months[C.m]+" "+C.y;
  const first = new Date(C.y,C.m,1);
  const start = (first.getDay()+6)%7;
  const days = new Date(C.y,C.m+1,0).getDate();
  const dow=t("dow").split(",").map(d=>`<div class="dow">${d}</div>`).join("");
  let cells="";
  for(let i=0;i<start;i++) cells+=`<div class="daycell empty"></div>`;
  for(let d=1;d<=days;d++){
    const date = `${C.y}-${String(C.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const rows = dayCrew(date);
    const work = rows.filter(x=>x.mark!=="нет");
    const ok = work.filter(x=>x.cls==="done").length;
    let cls="daycell";
    if(work.length && ok===work.length) cls+=" paid";
    else if(work.some(x=>x.cls==="wait")) cls+=" hands";
    const extra = work.length ? `<div class="muted">${ok}/${work.length}</div>` : "";
    cells+=`<button class="${cls}" data-adate="${date}"><div class="n">${d}</div>${extra}</button>`;
  }
  $("c-all-cal").innerHTML = dow+cells;
  $("c-all-cal").querySelectorAll("[data-adate]").forEach(b=>b.onclick=()=>{ C.date=b.dataset.adate; showCash("daylist"); });
}
function renderDayList(){
  $("c-daylist-title").textContent = C.date;
  const rows = dayCrew(C.date);
  if(!S.users.length){
    $("c-daylist-box").innerHTML = `<p class="muted">Нет водителей</p>`;
    return;
  }
  $("c-daylist-box").innerHTML = rows.map(x=>`<button data-who="${x.u.login}" style="width:100%;margin:6px 0;display:flex;justify-content:space-between">
    <span>${x.u.name}</span><span class="pill ${x.cls}">${x.mark}</span>
  </button>`).join("");
  $("c-daylist-box").querySelectorAll("[data-who]").forEach(b=>b.onclick=()=>{
    C.who=b.dataset.who;
    C.display=S.users.find(u=>u.login===C.who)?.name||C.who;
    showCash("day");
  });
}
if($("c-all-prev")) $("c-all-prev").onclick = ()=>{ C.m--; if(C.m<0){C.m=11;C.y--;} renderAllCal(); };
if($("c-all-next")) $("c-all-next").onclick = ()=>{ C.m++; if(C.m>11){C.m=0;C.y++;} renderAllCal(); };
function renderBoard(){
  const date = C.date || today();
  C.date = date;
  const el = $("c-today-date");
  if(el) el.textContent = date;
  dayObj(date);
  if(!S.users.length){
    $("c-board").innerHTML = `<p class="muted">Сначала добавьте сотрудника в настройках.</p>`;
    return;
  }
  $("c-board").innerHTML = S.users.map(u=>{
    const r = (S.days[date]&&S.days[date][u.login]) || blank();
    const st = r.status==="accepted"?t("paid"): r.status==="closed"?t("hands"): (r.raion||"");
    return `<div class="board-row">
      <button class="ghost nm" data-open="${u.login}" style="text-align:left;padding:8px">
        ${u.name}<br><span class="muted">${st||u.login}</span>
      </button>
      <div><label>Развоз</label><input inputmode="numeric" data-br="${u.login}" value="${r.razvoz||""}"></div>
      <div><label>QR</label><input inputmode="numeric" data-bq="${u.login}" value="${r.qr||""}"></div>
    </div>`;
  }).join("");
  $("c-board").querySelectorAll("[data-open]").forEach(b=>{
    b.onclick = ()=>{
      C.who=b.dataset.open;
      C.display=S.users.find(x=>x.login===C.who)?.name||C.who;
      const dt = new Date(C.date+"T12:00:00");
      C.y=dt.getFullYear(); C.m=dt.getMonth();
      showCash("cal");
    };
  });
  const saveRow = (login)=>{
    const r = dayObj(C.date)[login] || (dayObj(C.date)[login]=blank());
    const rz = $("c-board").querySelector(`[data-br="${login}"]`);
    const q = $("c-board").querySelector(`[data-bq="${login}"]`);
    if(rz) r.razvoz = n(rz.value);
    if(q) r.qr = n(q.value);
    save(S);
  };
  $("c-board").querySelectorAll("[data-br],[data-bq]").forEach(inp=>{
    inp.addEventListener("input", ()=>saveRow(inp.dataset.br||inp.dataset.bq));
    inp.addEventListener("change", ()=>saveRow(inp.dataset.br||inp.dataset.bq));
  });
}
function driverStats(name){
  let hands=0, paid=0;
  for(const date of Object.keys(S.days)){
    const r = S.days[date][name];
    if(!r) continue;
    if(r.status==="closed") hands++;
    if(r.status==="accepted") paid++;
  }
  return {hands,paid};
}
function fillPayUrl(){
  const el = $("c-payurl");
  if(el) el.value = (S.cash && S.cash.payUrl) || PAY_DEFAULT;
}
function renderDrivers(){
  if(!S.users.length){
    $("c-drivers").innerHTML = `<p class="muted">Пока никого нет. Добавьте первого ниже.</p>`;
    return;
  }
  $("c-drivers").innerHTML = S.users.map(u=>{
    const s = driverStats(u.login);
    return `<div class="card" style="padding:10px;margin:0 0 8px">
      <button data-name="${u.login}" style="margin:0">
        <span>${u.name}<br><span class="muted">${u.login}</span></span>
        <span class="pill ${s.hands?"wait":s.paid?"done":""}">
          ${s.hands?("на руках "+s.hands):""}${s.hands&&s.paid?" · ":""}${s.paid?("сдал "+s.paid): (!s.hands&&!s.paid?"пусто":"")}
        </span>
      </button>
      <div class="row" style="margin-top:6px">
        <button class="ghost" data-rename="${u.login}">имя</button>
        <button class="ghost" data-pass="${u.login}">пароль</button>
        <button class="ghost" data-del="${u.login}">удалить</button>
      </div>
    </div>`;
  }).join("");
  $("c-drivers").querySelectorAll("[data-name]").forEach(b=>b.onclick=()=>{
    C.who=b.dataset.name; C.display=S.users.find(x=>x.login===C.who)?.name||C.who; showCash("cal");
  });
  $("c-drivers").querySelectorAll("[data-rename]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const u = S.users.find(x=>x.login===b.dataset.rename);
    if(!u) return;
    const nm = prompt("Новое имя", u.name||"");
    if(nm==null) return;
    const t = String(nm).trim();
    if(!t){ alert("Имя пустое"); return; }
    u.name = t;
    save(S);
    renderDrivers();
  });
  $("c-drivers").querySelectorAll("[data-pass]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const p = prompt("Новый пароль для "+b.dataset.pass);
    if(!p) return;
    const u = S.users.find(x=>x.login===b.dataset.pass);
    u.pass = p; save(S); alert("Пароль обновлён");
  });
  $("c-drivers").querySelectorAll("[data-del]").forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    if(!confirm("Удалить "+b.dataset.del+"?")) return;
    S.users = S.users.filter(x=>x.login!==b.dataset.del);
    save(S); renderDrivers();
  });
}
function recCash(){ return dayObj(C.date)[C.who]; }
function renderCal(){
  $("c-cal-name").textContent = C.display||C.who;
  const months=t("monthNames").split(",");
  $("c-month").textContent = months[C.m]+" "+C.y;
  const msum = monthItog(C.who, C.y, C.m);
  const box = $("c-month-sum");
  if(box){
    box.className = "big "+(msum.t>0?"itog-minus":msum.t<0?"itog-plus":"itog-ok");
    box.textContent = t("month")+"  "+(msum.used ? fmtItog(msum.t) : "0");
  }
  const first = new Date(C.y,C.m,1);
  const start = (first.getDay()+6)%7;
  const days = new Date(C.y,C.m+1,0).getDate();
  const dow=t("dow").split(",").map(d=>`<div class="dow">${d}</div>`).join("");
  let cells="";
  for(let i=0;i<start;i++) cells+=`<div class="daycell empty"></div>`;
  for(let d=1;d<=days;d++){
    const date = `${C.y}-${String(C.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const r = (S.days[date]&&S.days[date][C.who]) || null;
    const x = dayMark(r);
    cells+=`<button class="${x.cls}" data-date="${date}"><div class="n">${d}</div><div class="muted">${x.mark}</div>${x.extra}</button>`;
  }
  $("c-cal").innerHTML = dow+cells;
  $("c-cal").querySelectorAll("[data-date]").forEach(b=>b.onclick=()=>{ C.date=b.dataset.date; showCash("day"); });
}
$("c-prev").onclick = ()=>{ C.m--; if(C.m<0){C.m=11;C.y--;} renderCal(); };
$("c-next").onclick = ()=>{ C.m++; if(C.m>11){C.m=0;C.y++;} renderCal(); };
function renderDay(){
  const r = recCash();
  if(!r.bills) r.bills = {20000:0,10000:0,5000:0,2000:0,1000:0,500:0};
  $("c-day-title").textContent = (C.display||C.who)+" · "+C.date;
  $("c-day-st").textContent = statusText(r)+(r.status==="closed"||r.status==="accepted"?" · можно править":"");
  fillRaionSelect("c-raion", r.raion||"");
  $("c-razvoz").value = r.razvoz||"";
  $("c-qr").value = r.qr||"";
  $("c-ret").value = r.retRaw||(r.ret||"");
  $("c-cons").value = r.consRaw||(r.cons||"");
  $("c-term").value = r.term||"";
  $("c-coins").value = r.coins||"";
  $("c-park").value = r.park||"";
  $("c-lunch").value = r.lunch||"";
  $("c-fuel").value = r.fuel||"";
  $("c-other").value = r.other||"";
  $("c-adv").value = r.adv||"";
  $("c-bills").innerHTML = BILLS.map(b=>`
    <div>
      <label>${fmt(b)} ₸ — ${t("pcs")}</label>
      <input data-cbill="${b}" inputmode="numeric" value="${r.bills[b]||""}">
    </div>`).join("");
  $("c-day-rest").innerHTML = `
    <p>Касса нал. <b>${fmt(cashSum(r))}</b> · расход <b>${fmt(expSum(r))}</b></p>
    <p>Должен нал. <b>${fmt(must(r))}</b></p>
    <p class="big ${itog(r)>0?"itog-minus":itog(r)<0?"itog-plus":"itog-ok"}">Итог ${fmtItog(itog(r))}</p>`;
  $("c-accept").style.display = r.status==="accepted"?"none":"inline-block";
  $("c-reopen").style.display = (r.status==="closed"||r.status==="accepted")?"block":"none";
}
function grabCashDay(){
  const r = recCash();
  r.raion = $("c-raion").value.trim();
  r.razvoz = n($("c-razvoz").value);
  r.qr = n($("c-qr").value);
  r.retRaw = $("c-ret").value.trim();
  r.consRaw = $("c-cons").value.trim();
  r.ret = sumExpr(r.retRaw);
  r.cons = sumExpr(r.consRaw);
  r.term = n($("c-term").value);
  r.coins = n($("c-coins").value);
  r.park = n($("c-park").value);
  r.lunch = n($("c-lunch").value);
  r.fuel = n($("c-fuel").value);
  r.other = n($("c-other").value);
  r.adv = n($("c-adv").value);
  if(!r.bills) r.bills = {};
  $("c-bills").querySelectorAll("[data-cbill]").forEach(inp=>{
    r.bills[inp.dataset.cbill] = n(inp.value);
  });
  return r;
}
function persistCashQuiet(){
  if(!$("c-daywrap") || $("c-daywrap").style.display==="none") return;
  grabCashDay();
  save(S);
  const r = recCash();
  const box = $("c-day-rest");
  if(box) box.innerHTML = `
    <p>Касса нал. <b>${fmt(cashSum(r))}</b> · расход <b>${fmt(expSum(r))}</b></p>
    <p>Должен нал. <b>${fmt(must(r))}</b></p>
    <p class="big ${itog(r)>0?"itog-minus":itog(r)<0?"itog-plus":"itog-ok"}">Итог ${fmtItog(itog(r))}</p>`;
}
["c-raion","c-razvoz","c-qr","c-ret","c-cons","c-term","c-coins","c-park","c-lunch","c-fuel","c-other","c-adv"].forEach(id=>{
  const el = $(id);
  if(!el) return;
  el.addEventListener("input", persistCashQuiet);
  el.addEventListener("change", persistCashQuiet);
});
document.addEventListener("input", e=>{
  if(e.target && e.target.dataset && e.target.dataset.cbill) persistCashQuiet();
});
$("c-save").onclick = ()=>{ grabCashDay(); save(S); renderDay(); };
$("c-accept").onclick = ()=>{ grabCashDay(); recCash().status="accepted"; save(S); renderDay(); };
$("c-reopen").onclick = ()=>{ grabCashDay(); recCash().status="closed"; save(S); renderDay(); };
function fmtDateRu(iso){
  const p = String(iso||"").split("-");
  if(p.length!==3) return iso||"";
  return p[2]+"."+p[1]+"."+p[0];
}
function printOpis(){
  grabCashDay();
  const r = recCash();
  const name = C.display || C.who || "";
  const row = (k,v)=>`<tr><td>${k}</td><td class="n">${v}</td></tr>`;
  const billRows = BILLS.map(b=>{
    const k = n(r.bills && r.bills[b]);
    return row(fmt(b)+" × "+k, fmt(k*b));
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Опись ${name}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:16px;color:#111;max-width:420px;margin:0 auto}
    h1{font-size:20px;margin:0 0 12px;text-align:center}
    table{width:100%;border-collapse:collapse;margin:8px 0 14px}
    td{border-bottom:1px solid #ccc;padding:6px 0;font-size:14px}
    td.n{text-align:right;font-variant-numeric:tabular-nums}
    .meta{margin:0 0 4px;font-size:15px}
    .sum td{font-weight:700;border-bottom:2px solid #111}
    @media print{button{display:none} body{padding:0}}
  </style></head><body>
  <h1>Опись кассы</h1>
  <p class="meta">Дата: <b>${fmtDateRu(C.date)}</b></p>
  <p class="meta">Водитель: <b>${name}</b></p>
  <p class="meta">Район: <b>${r.raion||"—"}</b></p>
  <table>
    <tr class="sum">${row("К сдаче (нал)", fmt(cashSum(r)))}</tr>
    <tr><td colspan="2"><b>По номиналу</b></td></tr>
    ${billRows}
    ${row("Мелочь", fmt(r.coins))}
    <tr><td colspan="2"><b>Расходы</b></td></tr>
    ${row("Стоянка", fmt(r.park))}
    ${row("Обед", fmt(r.lunch))}
    ${row("Заправки", fmt(r.fuel))}
    ${row("Прочее", fmt(r.other))}
    ${row("Аванс", fmt(r.adv))}
    <tr class="sum">${row("Расход всего", fmt(expSum(r)))}</tr>
    <tr class="sum">${row("KASPI PAY", fmt(r.term))}</tr>
  </table>
  <p>Кассир ____________ &nbsp;&nbsp; Водитель ____________</p>
  <button onclick="window.print()">Печать</button>
  </body></html>`;
  const w = window.open("", "_blank");
  if(!w){ alert("Разрешите всплывающие окна для печати"); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(()=>{ try{ w.print(); }catch(e){} }, 300);
}
if($("c-print")) $("c-print").onclick = printOpis;
function printDayTotal(){
  const date = C.date || today();
  const rows = (S.users||[]).map(u=>{
    const r = (S.days[date]&&S.days[date][u.login]) || blank();
    const st = r.status==="accepted"?"сдал": r.status==="closed"?"на руках":"не сдал";
    return { name:u.name, raion:r.raion||"—", cash:cashSum(r), exp:expSum(r), term:n(r.term), itog:itog(r), st };
  });
  const sumCash = rows.reduce((a,x)=>a+x.cash,0);
  const sumItog = rows.reduce((a,x)=>a+x.itog,0);
  const body = rows.map(x=>`<tr>
    <td>${x.name}</td><td>${x.raion}</td><td class="n">${fmt(x.cash)}</td>
    <td class="n">${fmt(x.term)}</td><td class="n">${fmt(x.exp)}</td>
    <td class="n">${fmtItog(x.itog)}</td><td>${x.st}</td>
  </tr>`).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Итог ${date}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:16px;color:#111}
    h1{font-size:18px;margin:0 0 10px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    th{background:#eee}
    td.n,th.n{text-align:right}
    .sum td{font-weight:700}
    @media print{button{display:none}}
  </style></head><body>
  <h1>Итог по кассе за ${fmtDateRu(date)}</h1>
  <table>
    <tr><th>Водитель</th><th>Район</th><th class="n">Нал</th><th class="n">KASPI PAY</th><th class="n">Расход</th><th class="n">Итог</th><th>Статус</th></tr>
    ${body}
    <tr class="sum"><td colspan="2">Всего</td><td class="n">${fmt(sumCash)}</td><td colspan="2"></td><td class="n">${fmtItog(sumItog)}</td><td></td></tr>
  </table>
  <p style="margin-top:16px">Кассир ____________</p>
  <button onclick="window.print()">Печать</button>
  </body></html>`;
  const w = window.open("", "_blank");
  if(!w){ alert("Разрешите всплывающие окна"); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(()=>{ try{ w.print(); }catch(e){} }, 300);
}
if($("c-print-day")) $("c-print-day").onclick = printDayTotal;
function exportBackup(){
  const blob = new Blob([JSON.stringify(S, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kassa-backup-"+today()+".json";
  a.click();
  URL.revokeObjectURL(a.href);
}
function importBackup(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const s = JSON.parse(reader.result);
      if(!s || typeof s!=="object") throw new Error("bad");
      s.users = s.users || [];
      s.cash = s.cash || { login:"kassa", pass:"0000" };
      s.days = s.days || {};
      ensureRaions(s);
      if(!confirm("Заменить текущую базу файлом бэкапа? Водителей: "+s.users.length)) return;
      S = s;
      save(S);
      alert("База восстановлена");
      showCash("staff");
    }catch(e){ alert("Файл не подходит"); }
  };
  reader.readAsText(file);
}
if($("c-backup-export")) $("c-backup-export").onclick = exportBackup;
if($("c-backup-import")) $("c-backup-import").onchange = e=>{
  const f = e.target.files && e.target.files[0];
  importBackup(f);
  e.target.value = "";
};
$("c-raion-add").onclick = ()=>{
  const name = ($("c-raion-new").value||"").trim();
  if(!name) return;
  const list = ensureRaions(S);
  if(!list.includes(name)){ list.push(name); S.raions = list; save(S); }
  $("c-raion-new").value="";
  renderRaionAdmin();
};
$("c-paysave").onclick = ()=>{
  const url = ($("c-payurl").value||"").trim() || PAY_DEFAULT;
  S.cash = S.cash || { login:"kassa", pass:"0000" };
  S.cash.payUrl = url;
  save(S);
  alert("Ссылка Kaspi сохранена");
};
$("u-add").onclick = ()=>{
  const name = $("u-name").value.trim();
  const login = $("u-login").value.trim().toLowerCase();
  const pass = $("u-pass").value;
  if(!name || !login || !pass){ alert("Имя, логин и пароль обязательны"); return; }
  if(login==="kassa"){ alert("Логин kassa занят кассиром"); return; }
  if(S.users.some(x=>x.login===login)){ alert("Такой логин уже есть"); return; }
  S.users.push({ name, login, pass });
  save(S);
  $("u-name").value=$("u-login").value=$("u-pass").value="";
  renderDrivers();
};

function isTyping(){
  const a = document.activeElement;
  return !!(a && (a.tagName==="INPUT"||a.tagName==="SELECT"||a.tagName==="TEXTAREA"));
}
function refreshView(){
  if(isTyping()) return;
  const role = (getSess()||{}).role || sessionStorage.getItem("role");
  if(role==="driver" && $("s-driver").classList.contains("on")){
    if($("d-form").style.display!=="none") renderDriver();
    else renderDCal();
  }
  if(role==="cash" && $("s-cash").classList.contains("on")){
    if(C.view==="day") renderDay();
    else if(C.view==="cal") renderCal();
    else if(C.view==="staff") renderDrivers();
    else if(C.view==="daylist") renderDayList();
    else if(C.view==="month") renderAllCal();
    else renderBoard();
  }
}

["lang-ru","lang-ru2","lang-ru3"].forEach(id=>{ const el=$(id); if(el) el.onclick=()=>setLang("ru"); });
["lang-kk","lang-kk2","lang-kk3"].forEach(id=>{ const el=$(id); if(el) el.onclick=()=>setLang("kk"); });

(async ()=>{
  applyI18n();
  const pill = $("net-pill");
  if(pill) pill.textContent = ONLINE ? "сервер" : "только этот браузер";
  const sess = getSess();
  if(sess && sess.role){
    if(sess.role) sessionStorage.setItem("role", sess.role);
    if(sess.who) sessionStorage.setItem("who", sess.who);
    if(sess.name) sessionStorage.setItem("name", sess.name);
    if(sess.role==="driver") openDriver();
    else if(sess.role==="cash") openCash();
  }
  if(ONLINE) await pull();
  const again = getSess();
  if(again && again.role){
    if(again.role==="driver") openDriver();
    else if(again.role==="cash") openCash();
  }
  if(ONLINE) setInterval(async ()=>{
    if(isTyping()) return;
    const ok = await pull();
    if(ok && !isTyping()) refreshView();
  }, 8000);
})();
