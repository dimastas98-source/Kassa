const BILLS = [20000,10000,5000,2000,1000,500];
const KEY = "kassa_v2";

const today = () => new Date().toISOString().slice(0,10);
const n = v => { const x = String(v??"").replace(/\s/g,"").replace(",","."); const k=Number(x); return Number.isFinite(k)?k:0; };
function sumExpr(v){
  const s = String(v??"").trim();
  if(!s) return 0;
  if(!s.includes("+")) return n(s);
  return s.split("+").map(n).reduce((a,b)=>a+b,0);
}
const fmt = v => (n(v)||0).toLocaleString("ru-RU");
function fmtItog(i){
  if(!i) return "0";
  if(i>0) return "− "+fmt(i);
  return "+ "+fmt(Math.abs(i));
}

const I18N = {
  ru: {
    app:"Касса экспедиторов",
    login:"Логин", pass:"Пароль", enter:"Войти", back:"Назад", exit:"Выйти",
    myDays:"Мои дни",
    raion:"Район",
    razvoz:"Развоз", qr:"QR Kaspi", yourNums:"Ваши цифры", ret:"Возврат",
    cons:"Консигнация",
    term:"KASPI PAY", mustCash:"Наличными",
    newPass:"Сменить пароль", oldPass:"Старый пароль", newPass2:"Новый пароль", savePass:"Сохранить пароль",
    passOk:"Пароль изменён", passBad:"Старый пароль неверный", passEmpty:"Введите новый пароль",
    billsTitle:"Купюры — сколько штук", coins:"Монеты, сумма", cashNal:"Касса нал.",
    exp:"Расход", park:"Стоянка", lunch:"Обед", fuel:"Заправки", other:"Прочее", adv:"Аванс",
    expAll:"Расход всего", itog:"Итог", closeKassa:"Посчитать",
    month:"за месяц", pcs:"штук", noneYet:"ещё нет",
    lockWait:"Нет развоза или QR",
    lockOk:"",
    minusTxt:"Минус",
    plusTxt:"Плюс",
    zeroTxt:"0",
    payMinus:"Оплатить минус",
    accepted:"День принят",
    badLogin:"Неверный логин или пароль",
    noRazvoz:"Нет развоза",
    closed:"Посчитано. Кассир видит день.",
    noMinus:"Минуса нет",
    payAlert:"В Kaspi сумма: {s} ₸",
    hands:"на руках", paid:"сдал", counts:"считает", calendar:"календарь",
    drivers:"водители",
    monthNames:"январь,февраль,март,апрель,май,июнь,июль,август,сентябрь,октябрь,ноябрь,декабрь",
    dow:"пн,вт,ср,чт,пт,сб,вс",
    stNone:"не считал", stClosed:"закрыл, не сдал", stAcc:"принят"
  },
  kk: {
    app:"Экспедитор кассасы",
    login:"Логин", pass:"Құпиясөз", enter:"Кіру", back:"Артқа", exit:"Шығу",
    myDays:"Менің күндерім",
    raion:"Аудан",
    razvoz:"Тасымал", qr:"QR Kaspi", yourNums:"Сіздің сандарыңыз", ret:"Қайтару",
    cons:"Консигнация",
    term:"KASPI PAY", mustCash:"Қолма-қол",
    newPass:"Құпиясөзді ауыстыру", oldPass:"Ескі құпиясөз", newPass2:"Жаңа құпиясөз", savePass:"Сақтау",
    passOk:"Құпиясөз өзгерді", passBad:"Ескі құпиясөз қате", passEmpty:"Жаңа құпиясөзді жазыңыз",
    billsTitle:"Купюра — қанша дана", coins:"Тиын, сома", cashNal:"Қолма-қол касса",
    exp:"Шығын", park:"Тұрақ", lunch:"Түскі ас", fuel:"Жанармай", other:"Басқа", adv:"Аванс",
    expAll:"Шығын барлығы", itog:"Қорытынды", closeKassa:"Есептеу",
    month:"айға", pcs:"дана", noneYet:"әлі жоқ",
    lockWait:"Тасымал немесе QR жоқ",
    lockOk:"",
    minusTxt:"Минус",
    plusTxt:"Плюс",
    zeroTxt:"0",
    payMinus:"Минусты Kaspi-де төлеу",
    accepted:"Күн қабылданды",
    badLogin:"Логин немесе құпиясөз қате",
    noRazvoz:"Тасымал жоқ",
    closed:"Есептелді. Кассир көреді.",
    noMinus:"Минус жоқ",
    payAlert:"Kaspi сомасы: {s} ₸",
    hands:"қолда", paid:"өткізді", counts:"есептеп жатыр", calendar:"күнтізбе",
    drivers:"жүргізушілер",
    monthNames:"қаңтар,ақпан,наурыз,сәуір,мамыр,маусым,шілде,тамыз,қыркүйек,қазан,қараша,желтоқсан",
    dow:"дс,сс,ср,бс,жм,сб,жс",
    stNone:"есептемеді", stClosed:"жапты, өткізбеді", stAcc:"қабылданды"
  }
};
let LANG = localStorage.getItem("kassa_lang") || "ru";
function t(k){ return (I18N[LANG]&&I18N[LANG][k]) || I18N.ru[k] || k; }
function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    if(t(k)) el.textContent = t(k);
  });
  document.documentElement.lang = LANG==="kk" ? "kk" : "ru";
}
function setLang(l){
  LANG = l;
  localStorage.setItem("kassa_lang", l);
  applyI18n();
  try{
    if($("s-driver") && $("s-driver").classList.contains("on")){
      if($("d-form").style.display!=="none") renderDriver(); else renderDCal();
    }
    if($("s-cash") && $("s-cash").classList.contains("on")){
      if($("c-daywrap").style.display!=="none") renderDay();
      else if($("c-calwrap").style.display!=="none") renderCal();
      else renderDrivers();
    }
  }catch(e){}
}

const ONLINE = location.protocol.startsWith("http");
const PAY_DEFAULT = "https://qr.kaspi.kz/1969965124051143278176170407929043063426";
const DEFAULT_RAIONS = ["Туркестан","Кентау","Атабай","Шаулдер","Арыс","Сөзак","Сырыағаш","Жетысай","Вановка","Қарабұлақ","Ленгер","Шардара"];
const emptyState = () => ({ users: [], cash: { login:"kassa", pass:"0000", payUrl: PAY_DEFAULT }, days: {}, raions: DEFAULT_RAIONS.slice() });
function ensureRaions(s){
  if(!s.raions || !s.raions.length) s.raions = DEFAULT_RAIONS.slice();
  return s.raions;
}
function fillRaionSelect(id, val){
  const el = $(id);
  if(!el) return;
  const list = ensureRaions(S);
  const cur = val || "";
  const extra = cur && !list.includes(cur) ? `<option value="${cur}">${cur}</option>` : "";
  el.innerHTML = `<option value="">—</option>`+extra+list.map(x=>`<option value="${x}">${x}</option>`).join("");
  el.value = cur;
}
function renderRaionAdmin(){
  const box = $("c-raion-list");
  if(!box) return;
  const list = ensureRaions(S);
  box.innerHTML = list.map(x=>`<div>${x} <button class="ghost" data-delr="${x}" type="button">×</button></div>`).join("");
  box.querySelectorAll("[data-delr]").forEach(b=>{
    b.onclick = ()=>{
      S.raions = ensureRaions(S).filter(n=>n!==b.dataset.delr);
      save(S); renderRaionAdmin();
    };
  });
}

function loadLocal(){
  const raw = localStorage.getItem(KEY);
  if(raw){
    const s = JSON.parse(raw);
    if(!s.users) s.users = [];
    s.cash = s.cash || { login:"kassa", pass:"0000" };
    if(!s.cash.payUrl) s.cash.payUrl = PAY_DEFAULT;
    ensureRaions(s);
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
    if(!s.cash.payUrl) s.cash.payUrl = PAY_DEFAULT;
    s.days = s.days || {};
    ensureRaions(s);
    const localHas = (S.users&&S.users.length) || Object.keys(S.days||{}).length;
    const remoteEmpty = !s.users.length && !Object.keys(s.days||{}).length;
    if(remoteEmpty && localHas){
      save(S);
      return false;
    }
    S = s;
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  }catch(e){ return false; }
}
const SESS = "kassa_sess";
function setSess(obj){ localStorage.setItem(SESS, JSON.stringify(obj)); sessionStorage.setItem("role", obj.role||""); if(obj.who) sessionStorage.setItem("who", obj.who); if(obj.name) sessionStorage.setItem("name", obj.name); }
function getSess(){
  try{ return JSON.parse(localStorage.getItem(SESS)||"null"); }catch(e){ return null; }
}
function clearSess(){ localStorage.removeItem(SESS); sessionStorage.removeItem("role"); sessionStorage.removeItem("who"); sessionStorage.removeItem("name"); }
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
    if(r.status!=="closed" && r.status!=="accepted") continue;
    t += itog(r); used++;
  }
  return {t, used};
}
function dayMark(r){
  if(!r) return {cls:"daycell", mark:"", extra:""};
  let cls="daycell", mark="";
  if(r.status==="closed"){ cls+=" hands"; mark=t("hands"); }
  else if(r.status==="accepted"){ cls+=" paid"; mark=t("paid"); }
  else if(r.raion||r.ret||r.cons||cashSum(r)||r.razvoz||r.qr){ cls+=" draft"; mark=r.raion||t("counts"); }
  const i = itog(r);
  const show = r.status==="closed" || r.status==="accepted";
  const extra = show ? `<div class="${i>0?"itog-minus":i<0?"itog-plus":"itog-ok"}">${fmtItog(i)}</div>` : "";
  return {cls, mark, extra};
}
function statusText(r){
  if(r.status==="accepted") return t("stAcc");
  if(r.status==="closed") return t("stClosed");
  return t("stNone");
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
    setSess({ role:"cash" });
    openCash(); return;
  }
  const u = S.users.find(x=>x.login===login && x.pass===pass);
  if(!u){ alert(t("badLogin")); return; }
  setSess({ role:"driver", who:u.login, name:u.name });
  openDriver();
};
["log-login","log-pass"].forEach(id=>{
  $(id).addEventListener("keydown", e=>{ if(e.key==="Enter") $("log-go").click(); });
});
$("d-out").onclick = $("c-out").onclick = ()=>{ clearSess(); show("s-login"); };

/* driver */
let D = { y:null, m:null, date:null };

function who(){
  return (getSess()||{}).who || sessionStorage.getItem("who") || "";
}
function openDriver(){
  const sess = getSess()||{};
  if(sess.who) sessionStorage.setItem("who", sess.who);
  if(sess.name) sessionStorage.setItem("name", sess.name);
  show("s-driver");
  $("d-hello").textContent = sess.name || sessionStorage.getItem("name") || who();
  const t = new Date();
  if(D.y==null){ D.y=t.getFullYear(); D.m=t.getMonth(); }
  showDriver("cal");
}
function showDriver(view){
  $("d-calwrap").style.display = view==="cal"?"block":"none";
  $("d-form").style.display = view==="form"?"block":"none";
  const set = $("d-setwrap");
  if(set) set.style.display = view==="set"?"block":"none";
  $("d-back").style.display = view==="cal"?"none":"inline-block";
  $("d-path").textContent = view==="cal" ? t("calendar") : (view==="set" ? "настройки" : D.date);
  if(view==="cal") renderDCal();
  if(view==="form") renderDriver();
}
$("d-back").onclick = ()=> showDriver("cal");
$("d-open-set").onclick = ()=> showDriver("set");
function renderDCal(){
  const months=t("monthNames").split(",");
  $("d-month").textContent = months[D.m]+" "+D.y;
  const msum = monthItog(who(), D.y, D.m);
  const box = $("d-month-sum");
  if(box){
    box.className = "big "+(msum.t>0?"itog-minus":msum.t<0?"itog-plus":"itog-ok");
    box.textContent = t("month")+"  "+(msum.used ? fmtItog(msum.t) : "0");
  }
  const first = new Date(D.y,D.m,1);
  const start = (first.getDay()+6)%7;
  const days = new Date(D.y,D.m+1,0).getDate();
  const dow=t("dow").split(",").map(d=>`<div class="dow">${d}</div>`).join("");
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
      <label>${fmt(b)} ₸ — ${t("pcs")}</label>
      <input data-bill="${b}" inputmode="numeric" value="${r.bills[b]||""}">
    </div>`).join("");
  $("bills").querySelectorAll("input").forEach(inp=>{
    inp.oninput = ()=>{ rec().bills[inp.dataset.bill]=n(inp.value); persistDriver(); };
  });
}
function hintSum(id, raw){
  const el = $(id);
  if(!el) return;
  const s = String(raw||"");
  el.textContent = s.includes("+") ? ("= "+fmt(sumExpr(s))) : "";
}
function persistDriver(){
  const r = rec();
  r.raion=$("d-raion").value.trim();
  r.retRaw=$("d-ret").value.trim();
  r.consRaw=$("d-cons").value.trim();
  r.ret=sumExpr(r.retRaw); r.cons=sumExpr(r.consRaw); r.term=n($("d-term").value);
  hintSum("d-ret-sum", r.retRaw);
  hintSum("d-cons-sum", r.consRaw);
  r.coins=n($("d-coins").value);
  r.park=n($("d-park").value); r.lunch=n($("d-lunch").value);
  r.fuel=n($("d-fuel").value); r.other=n($("d-other").value); r.adv=n($("d-adv").value);
  save(S);
  paintTotals();
}
function paintTotals(){
  const r = rec();
  $("d-razvoz").textContent = r.razvoz? fmt(r.razvoz) : t("noneYet");
  $("d-qr").textContent = r.qr? fmt(r.qr) : t("noneYet");
  $("d-lock").textContent = (!r.razvoz || !r.qr && r.qr!==0) ? t("lockWait") : t("lockOk");
  $("d-must").textContent = fmt(must(r));
  $("d-cash").textContent = fmt(cashSum(r));
  $("d-exp").textContent = fmt(expSum(r));
  const i = itog(r);
  const ready = r.status==="closed" || r.status==="accepted";
  const show = $("d-itog-show");
  if(show) show.style.display = ready ? "block" : "none";
  $("d-itog").textContent = ready ? fmtItog(i) : "—";
  $("d-itog").className = "big num "+(i>0?"itog-minus":i<0?"itog-plus":"itog-ok");
  $("d-itog-txt").textContent = ready ? (i>0 ? t("minusTxt") : i<0 ? t("plusTxt") : t("zeroTxt")) : "";
  $("d-close").disabled = !r.razvoz;
  $("d-close").textContent = ready ? t("closeKassa") : t("closeKassa");
  const payBtn = $("d-pay");
  if(payBtn){
    payBtn.style.display = (ready && i>0) ? "block" : "none";
    payBtn.textContent = t("payMinus")+" "+fmtItog(i);
  }
}
function fillDriverFields(){
  const r = rec();
  fillRaionSelect("d-raion", r.raion||"");
  $("d-ret").value=r.retRaw||(r.ret||"");
  $("d-cons").value=r.consRaw||(r.cons||"");
  $("d-term").value=r.term||"";
  hintSum("d-ret-sum", $("d-ret").value);
  hintSum("d-cons-sum", $("d-cons").value);
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
  if(r.status==="accepted") $("d-lock").textContent = t("accepted");
}
["d-raion","d-ret","d-cons","d-term","d-coins","d-park","d-lunch","d-fuel","d-other","d-adv"].forEach(id=>{
  const el=$(id); if(!el) return;
  el.addEventListener("input", persistDriver);
  el.addEventListener("change", persistDriver);
});
$("d-passgo").onclick = ()=>{
  const oldp = $("d-oldpass").value;
  const np = $("d-newpass").value;
  if(!np){ alert(t("passEmpty")); return; }
  const login = who();
  const u = S.users.find(x=>x.login===login);
  if(!u || u.pass!==oldp){ alert(t("passBad")); return; }
  u.pass = np; save(S);
  $("d-oldpass").value=$("d-newpass").value="";
  alert(t("passOk"));
};
$("c-passgo").onclick = ()=>{
  const oldp = $("c-oldpass").value;
  const np = $("c-newpass").value;
  if(!np){ alert(t("passEmpty")); return; }
  if(!S.cash || S.cash.pass!==oldp){ alert(t("passBad")); return; }
  S.cash.pass = np; save(S);
  $("c-oldpass").value=$("c-newpass").value="";
  alert(t("passOk"));
};
$("d-close").onclick = ()=>{
  persistDriver();
  const r = rec();
  if(!r.razvoz){ alert(t("noRazvoz")); return; }
  r.status = "closed";
  save(S);
  paintTotals();
  alert(t("closed"));
};
$("d-pay").onclick = ()=>{
  const r = rec();
  const i = itog(r);
  if(i<=0){ alert(t("noMinus")); return; }
  const url = (S.cash && S.cash.payUrl) || PAY_DEFAULT;
  const sum = fmt(i);
  try{ navigator.clipboard.writeText(String(Math.round(i))); }catch(e){}
  alert(t("payAlert").replace("{s}", sum));
  window.location.href = url;
};
/* водитель бланк не печатает */

/* cashier */
let C = { who:null, y:null, m:null, date:null };

function openCash(){
  show("s-cash");
  const now = new Date();
  if(C.y==null){ C.y=now.getFullYear(); C.m=now.getMonth(); }
  if(!C.date) C.date = today();
  showCash("today");
}
function shiftDate(iso, days){
  const d = new Date(iso+"T12:00:00");
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function showCash(view){
  C.view = view;
  $("c-today").style.display = view==="today"?"block":"none";
  $("c-staff").style.display = view==="staff"?"block":"none";
  $("c-calwrap").style.display = view==="cal"?"block":"none";
  $("c-daywrap").style.display = view==="day"?"block":"none";
  $("c-back").style.display = view==="today"?"none":"inline-block";
  if(view==="today"){ $("c-path").textContent=C.date; renderBoard(); }
  if(view==="staff"){ $("c-path").textContent="сотрудники"; fillPayUrl(); renderRaionAdmin(); renderDrivers(); }
  if(view==="cal"){ $("c-path").textContent=(C.display||C.who)+" · "+t("calendar"); renderCal(); }
  if(view==="day"){ $("c-path").textContent=(C.display||C.who)+" · "+C.date; renderDay(); }
}
$("c-day-prev").onclick = ()=>{ C.date = shiftDate(C.date||today(), -1); renderBoard(); $("c-path").textContent=C.date; };
$("c-day-next").onclick = ()=>{ C.date = shiftDate(C.date||today(), 1); renderBoard(); $("c-path").textContent=C.date; };
$("c-open-staff").onclick = ()=> showCash("staff");
$("c-back").onclick = ()=>{
  if($("c-daywrap").style.display!=="none") showCash("cal");
  else if($("c-calwrap").style.display!=="none") showCash("today");
  else showCash("today");
};
function renderBoard(){
  const date = C.date || today();
  C.date = date;
  const el = $("c-today-date");
  if(el) el.textContent = date===today() ? ("сегодня · "+date) : date;
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
    if($("c-daywrap").style.display!=="none") renderDay();
    else if($("c-calwrap").style.display!=="none") renderCal();
    else if($("c-staff") && $("c-staff").style.display!=="none") renderDrivers();
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
