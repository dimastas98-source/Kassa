const BILLS = [20000,10000,5000,2000,1000,500];
const KEY = "kassa_v2";

const today = () => new Date().toISOString().slice(0,10);
const n = v => { const x = String(v??"").replace(/\s/g,"").replace(",","."); const k=Number(x); return Number.isFinite(k)?k:0; };
const fmt = v => (n(v)||0).toLocaleString("ru-RU");
function fmtItog(i){
  if(!i) return "0";
  if(i>0) return "− "+fmt(i);
  return "+ "+fmt(Math.abs(i));
}

const ONLINE = location.protocol.startsWith("http");
const emptyState = () => ({ users: [], cash: { login:"kassa", pass:"0000" }, days: {} });

function loadLocal(){
  const raw = localStorage.getItem(KEY);
  if(raw){
    const s = JSON.parse(raw);
    if(!s.users) s.users = [];
    return s;
  }
  return emptyState();
}
let S = loadLocal();
let saveTimer = null;

function save(s){
  localStorage.setItem(KEY, JSON.stringify(s));
  if(!ONLINE) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    fetch("/api/state", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(s)
    }).catch(()=>{});
  }, 250);
}

async function pull(){
  if(!ONLINE) return false;
  try{
    const r = await fetch("/api/state", { cache:"no-store" });
    if(!r.ok) return false;
    const s = await r.json();
    s.users = s.users || [];
    s.cash = s.cash || { login:"kassa", pass:"0000" };
    s.days = s.days || {};
    S = s;
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  }catch(e){ return false; }
}
function drivers(){ return S.users; }

function dayObj(date){
  if(!S.days[date]) S.days[date] = {};
  for(const u of S.users){
    if(!S.days[date][u.login]) S.days[date][u.login] = blank();
  }
  return S.days[date];
}
function blank(){
  return {
    razvoz:0, qr:0, ret:0, cons:0, term:0, raion:"",
    bills:{20000:0,10000:0,5000:0,2000:0,1000:0,500:0}, coins:0,
    park:0,lunch:0,fuel:0,other:0,adv:0,
    status:"none" // none | closed | accepted
  };
}
function cashSum(r){
  let t = n(r.coins);
  for(const b of BILLS) t += n(r.bills[b])*b;
  return t;
}
function expSum(r){ return n(r.park)+n(r.lunch)+n(r.fuel)+n(r.other)+n(r.adv); }
function must(r){ return n(r.razvoz)-n(r.qr)-n(r.ret)-n(r.cons)-n(r.term); }
function itog(r){ return must(r)-cashSum(r)-expSum(r); }
function monthItog(login, y, m){
  const prefix = `${y}-${String(m+1).padStart(2,"0")}-`;
  let t=0, used=0;
  for(const date of Object.keys(S.days||{})){
    if(!date.startsWith(prefix)) continue;
    const r = S.days[date][login];
    if(!r) continue;
    if(r.status==="none" && !cashSum(r) && !n(r.razvoz)) continue;
    t += itog(r); used++;
  }
  return {t, used};
}
function dayMark(r){
  if(!r) return {cls:"daycell", mark:"", extra:""};
  let cls="daycell", mark="";
  if(r.status==="closed"){ cls+=" hands"; mark="на руках"; }
  else if(r.status==="accepted"){ cls+=" paid"; mark="сдал"; }
  else if(r.raion||r.ret||r.cons||cashSum(r)||r.razvoz||r.qr){ cls+=" draft"; mark=r.raion||"считает"; }
  const i = itog(r);
  const show = r.status!=="none" || cashSum(r) || n(r.razvoz);
  const extra = show ? `<div class="${i>0?"itog-minus":i<0?"itog-plus":"itog-ok"}">${fmtItog(i)}</div>` : "";
  return {cls, mark, extra};
}
function statusText(r){
  if(r.status==="accepted") return "принят";
  if(r.status==="closed") return "закрыл, не сдал";
  return "не считал";
}

const $ = id => document.getElementById(id);
function show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("on"));
  $(id).classList.add("on");
}

/* login */
$("log-go").onclick = ()=>{
  const login = $("log-login").value.trim().toLowerCase();
  const pass = $("log-pass").value;
  if(login===S.cash.login && pass===S.cash.pass){
    sessionStorage.setItem("role","cash");
    openCash(); return;
  }
  const u = S.users.find(x=>x.login===login && x.pass===pass);
  if(!u){ alert("Неверный логин или пароль"); return; }
  sessionStorage.setItem("role","driver");
  sessionStorage.setItem("who", u.login);
  sessionStorage.setItem("name", u.name);
  openDriver();
};
$("d-out").onclick = $("c-out").onclick = ()=>{ sessionStorage.clear(); show("s-login"); };

/* driver */
let D = { y:null, m:null, date:null };

function who(){ return sessionStorage.getItem("who"); }
function openDriver(){
  show("s-driver");
  $("d-hello").textContent = sessionStorage.getItem("name")||who();
  const t = new Date();
  if(D.y==null){ D.y=t.getFullYear(); D.m=t.getMonth(); }
  showDriver("cal");
}
function showDriver(view){
  $("d-calwrap").style.display = view==="cal"?"block":"none";
  $("d-form").style.display = view==="form"?"block":"none";
  $("d-back").style.display = view==="cal"?"none":"inline-block";
  $("d-path").textContent = view==="cal" ? "календарь" : D.date;
  if(view==="cal") renderDCal();
  if(view==="form") renderDriver();
}
$("d-back").onclick = ()=> showDriver("cal");
function renderDCal(){
  const months=["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
  $("d-month").textContent = months[D.m]+" "+D.y;
  const msum = monthItog(who(), D.y, D.m);
  const box = $("d-month-sum");
  if(box){
    box.className = "big "+(msum.t>0?"itog-minus":msum.t<0?"itog-plus":"itog-ok");
    box.textContent = msum.used ? ("за месяц  "+fmtItog(msum.t)) : "за месяц  0";
  }
  const first = new Date(D.y,D.m,1);
  const start = (first.getDay()+6)%7;
  const days = new Date(D.y,D.m+1,0).getDate();
  const dow=["пн","вт","ср","чт","пт","сб","вс"].map(d=>`<div class="dow">${d}</div>`).join("");
  let cells="";
  for(let i=0;i<start;i++) cells+=`<div class="daycell empty"></div>`;
  for(let d=1;d<=days;d++){
    const date = `${D.y}-${String(D.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const r = (S.days[date]&&S.days[date][who()]) || null;
    const x = dayMark(r);
    cells+=`<button class="${x.cls}" data-date="${date}"><div class="n">${d}</div><div class="muted">${x.mark}</div>${x.extra}</button>`;
  }
  $("d-cal").innerHTML = dow+cells;
  $("d-cal").querySelectorAll("[data-date]").forEach(b=>b.onclick=()=>{ D.date=b.dataset.date; showDriver("form"); });
}
$("d-prev").onclick = ()=>{ D.m--; if(D.m<0){D.m=11;D.y--;} renderDCal(); };
$("d-next").onclick = ()=>{ D.m++; if(D.m>11){D.m=0;D.y++;} renderDCal(); };

function rec(){
  return dayObj(D.date)[who()];
}
function renderBills(){
  const r = rec();
  $("bills").innerHTML = BILLS.map(b=>`
    <div>
      <label>${fmt(b)} ₸ — штук</label>
      <input data-bill="${b}" inputmode="numeric" value="${r.bills[b]||""}">
    </div>`).join("");
  $("bills").querySelectorAll("input").forEach(inp=>{
    inp.oninput = ()=>{ rec().bills[inp.dataset.bill]=n(inp.value); persistDriver(); };
  });
}
function persistDriver(){
  const r = rec();
  r.raion=$("d-raion").value.trim();
  r.ret=n($("d-ret").value); r.cons=n($("d-cons").value); r.term=n($("d-term").value);
  r.coins=n($("d-coins").value);
  r.park=n($("d-park").value); r.lunch=n($("d-lunch").value);
  r.fuel=n($("d-fuel").value); r.other=n($("d-other").value); r.adv=n($("d-adv").value);
  save(S);
  paintTotals();
}
function paintTotals(){
  const r = rec();
  $("d-razvoz").textContent = r.razvoz? fmt(r.razvoz) : "ещё нет";
  $("d-qr").textContent = r.qr? fmt(r.qr) : "ещё нет";
  $("d-lock").textContent = (!r.razvoz || !r.qr && r.qr!==0)
    ? "Пока кассир не проставил развоз и QR — итог предварительный, закрыть нельзя."
    : "QR стоит. Перед консой открой QR накладных в Kaspi.";
  $("d-must").textContent = fmt(must(r));
  $("d-cash").textContent = fmt(cashSum(r));
  $("d-exp").textContent = fmt(expSum(r));
  const i = itog(r);
  $("d-itog").textContent = fmtItog(i);
  $("d-itog").className = "big num "+(i>0?"itog-minus":i<0?"itog-plus":"itog-ok");
  $("d-itog-txt").textContent = i>0 ? "МИНУС — не донёс. Ищи: конса, купюры, возврат."
    : i<0 ? "Плюс. Не карман. Сначала проверь: не отнял ли консу и QR на одну накладную."
    : "Сошлось.";
  $("d-close").disabled = !r.razvoz;
}
function fillDriverFields(){
  const r = rec();
  $("d-raion").value=r.raion||"";
  $("d-ret").value=r.ret||""; $("d-cons").value=r.cons||""; $("d-term").value=r.term||"";
  $("d-coins").value=r.coins||"";
  $("d-park").value=r.park||""; $("d-lunch").value=r.lunch||"";
  $("d-fuel").value=r.fuel||""; $("d-other").value=r.other||""; $("d-adv").value=r.adv||"";
  renderBills();
}
function renderDriver(){
  dayObj(D.date);
  fillDriverFields();
  paintTotals();
  const r = rec();
  if(r.status==="accepted") $("d-lock").textContent = "Кассир уже принял деньги. Править можно, но день сдан.";
}
["d-raion","d-ret","d-cons","d-term","d-coins","d-park","d-lunch","d-fuel","d-other","d-adv"].forEach(id=>{
  $(id).addEventListener("input", persistDriver);
});
$("d-close").onclick = ()=>{
  const r = rec();
  if(!r.razvoz){ alert("Нет развоза от кассира"); return; }
  r.status = "closed";
  save(S);
  alert("Касса закрыта. Везите деньги. Кассир видит: закрыл, не сдал.");
};
/* водитель бланк не печатает */

/* cashier */
let C = { who:null, y:null, m:null, date:null };

function openCash(){
  show("s-cash");
  const t = new Date();
  if(C.y==null){ C.y=t.getFullYear(); C.m=t.getMonth(); }
  showCash("list");
}
function showCash(view){
  $("c-list").style.display = view==="list"?"block":"none";
  $("c-calwrap").style.display = view==="cal"?"block":"none";
  $("c-daywrap").style.display = view==="day"?"block":"none";
  $("c-back").style.display = view==="list"?"none":"inline-block";
  if(view==="list"){ $("c-path").textContent="водители"; renderDrivers(); }
  if(view==="cal"){ $("c-path").textContent=(C.display||C.who)+" · календарь"; renderCal(); }
  if(view==="day"){ $("c-path").textContent=(C.display||C.who)+" · "+C.date; renderDay(); }
}
$("c-back").onclick = ()=>{
  if($("c-daywrap").style.display!=="none") showCash("cal");
  else showCash("list");
};
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
        <button class="ghost" data-pass="${u.login}">сменить пароль</button>
        <button class="ghost" data-del="${u.login}">удалить</button>
      </div>
    </div>`;
  }).join("");
  $("c-drivers").querySelectorAll("[data-name]").forEach(b=>b.onclick=()=>{
    C.who=b.dataset.name; C.display=S.users.find(x=>x.login===C.who)?.name||C.who; showCash("cal");
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
  const months=["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
  $("c-month").textContent = months[C.m]+" "+C.y;
  const msum = monthItog(C.who, C.y, C.m);
  const box = $("c-month-sum");
  if(box){
    box.className = "big "+(msum.t>0?"itog-minus":msum.t<0?"itog-plus":"itog-ok");
    box.textContent = msum.used ? ("за месяц  "+fmtItog(msum.t)) : "за месяц  0";
  }
  const first = new Date(C.y,C.m,1);
  const start = (first.getDay()+6)%7;
  const days = new Date(C.y,C.m+1,0).getDate();
  const dow=["пн","вт","ср","чт","пт","сб","вс"].map(d=>`<div class="dow">${d}</div>`).join("");
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
  $("c-day-title").textContent = (C.display||C.who)+" · "+C.date;
  $("c-day-st").textContent = (r.raion?("район "+r.raion+" · "):"")+statusText(r);
  $("c-razvoz").value = r.razvoz||"";
  $("c-qr").value = r.qr||"";
  $("c-day-rest").innerHTML = `
    <p>Возврат ${fmt(r.ret)} · конса ${fmt(r.cons)} · терминал ${fmt(r.term)}</p>
    <p><b>Должен нал. ${fmt(must(r))}</b></p>
    <p>Купюры: ${BILLS.map(b=>fmt(b)+"×"+n(r.bills[b])).join(" · ")} · монеты ${fmt(r.coins)} = <b>${fmt(cashSum(r))}</b></p>
    <p>Расход ${fmt(expSum(r))}</p>
    <p class="big ${itog(r)>0?"itog-minus":itog(r)<0?"itog-plus":"itog-ok"}">Итог ${fmtItog(itog(r))}</p>`;
  $("c-accept").style.display = r.status==="accepted"?"none":"inline-block";
}
$("c-save").onclick = ()=>{
  const r = recCash();
  r.razvoz = n($("c-razvoz").value);
  r.qr = n($("c-qr").value);
  save(S); renderDay();
};
$("c-accept").onclick = ()=>{
  recCash().status="accepted"; save(S); renderDay();
};
$("c-print-day").onclick = ()=> window.print();
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

function refreshView(){
  const role = sessionStorage.getItem("role");
  if(role==="driver" && $("s-driver").classList.contains("on")){
    if($("d-form").style.display!=="none") renderDriver();
    else renderDCal();
  }
  if(role==="cash" && $("s-cash").classList.contains("on")){
    if($("c-daywrap").style.display!=="none") renderDay();
    else if($("c-calwrap").style.display!=="none") renderCal();
    else renderDrivers();
  }
}

(async ()=>{
  const pill = $("net-pill");
  if(pill) pill.textContent = ONLINE ? "сервер" : "только этот браузер";
  if(ONLINE) await pull();
  if(sessionStorage.getItem("role")==="driver") openDriver();
  else if(sessionStorage.getItem("role")==="cash") openCash();
  if(ONLINE) setInterval(async ()=>{
    const ok = await pull();
    if(ok) refreshView();
  }, 4000);
})();
