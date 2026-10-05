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
function toast(msg, kind){
  const el = $("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.remove("err","ok","show");
  if(kind==="err") el.classList.add("err");
  if(kind==="ok") el.classList.add("ok");
  requestAnimationFrame(()=> el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove("show"), 2200);
}
function askText(title, def){
  return new Promise(resolve=>{
    const modal = $("ask-modal");
    const inp = $("ask-input");
    const tit = $("ask-title");
    if(!modal || !inp){ resolve(null); return; }
    tit.textContent = title || "Ввод";
    inp.value = def==null ? "" : String(def);
    modal.classList.add("on");
    setTimeout(()=>{ inp.focus(); inp.select && inp.select(); }, 50);
    const done = (v)=>{
      modal.classList.remove("on");
      $("ask-ok").onclick = null;
      $("ask-cancel").onclick = null;
      resolve(v);
    };
    $("ask-ok").onclick = ()=> done(inp.value);
    $("ask-cancel").onclick = ()=> done(null);
    inp.onkeydown = e=>{
      if(e.key==="Enter"){ e.preventDefault(); done(inp.value); }
      if(e.key==="Escape"){ e.preventDefault(); done(null); }
    };
  });
}
function askYes(msg){
  return new Promise(resolve=>{
    const modal = $("ask-modal");
    const inp = $("ask-input");
    const tit = $("ask-title");
    if(!modal){ resolve(false); return; }
    tit.textContent = msg || "Подтвердите";
    if(inp){ inp.style.display = "none"; inp.value = ""; }
    modal.classList.add("on");
    const done = (v)=>{
      modal.classList.remove("on");
      if(inp) inp.style.display = "";
      $("ask-ok").onclick = null;
      $("ask-cancel").onclick = null;
      resolve(v);
    };
    $("ask-ok").onclick = ()=> done(true);
    $("ask-cancel").onclick = ()=> done(false);
  });
}
function printHtml(html){
  const iframe = $("print-frame");
  if(!iframe){ toast("Нет рамки печати", "err"); return; }
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(()=>{
    try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    catch(e){ toast("Не удалось открыть печать", "err"); }
  }, 250);
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
  if(!u){ toast(t("badLogin"), "err"); return; }
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
function persistDriver(){
  const r = rec();
  r.raion=$("d-raion").value.trim();
  r.retRaw=($("d-ret")&&$("d-ret").value||"").trim();
  r.consRaw=($("d-cons")&&$("d-cons").value||"").trim();
  r.ret=sumExpr(r.retRaw); r.cons=sumExpr(r.consRaw);
  r.term=n($("d-term").value);
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
  if($("d-ret")) $("d-ret").value = r.retRaw!=null && r.retRaw!=="" ? r.retRaw : (r.ret||"");
  if($("d-cons")) $("d-cons").value = r.consRaw!=null && r.consRaw!=="" ? r.consRaw : (r.cons||"");
  $("d-term").value=r.term||"";
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
if($("c-ret-plus")) $("c-ret-plus").onclick = ()=>{
  const el=$("c-ret"); if(!el) return;
  let v=String(el.value||"").trim(); if(v==="0") v=""; if(v && !v.endsWith("+")) v+="+"; el.value=v; el.focus();
};
if($("c-cons-plus")) $("c-cons-plus").onclick = ()=>{
  const el=$("c-cons"); if(!el) return;
  let v=String(el.value||"").trim(); if(v==="0") v=""; if(v && !v.endsWith("+")) v+="+"; el.value=v; el.focus();
};
$("d-passgo").onclick = ()=>{
  const oldp = $("d-oldpass").value;
  const np = $("d-newpass").value;
  if(!np){ toast(t("passEmpty"), "err"); return; }
  const login = who();
  const u = S.users.find(x=>x.login===login);
  if(!u || u.pass!==oldp){ toast(t("passBad"), "err"); return; }
  u.pass = np; save(S);
  $("d-oldpass").value=$("d-newpass").value="";
  toast(t("passOk"), "ok");
};
$("c-passgo").onclick = ()=>{
  const oldp = $("c-oldpass").value;
  const np = $("c-newpass").value;
  if(!np){ toast(t("passEmpty"), "err"); return; }
  if(!S.cash || S.cash.pass!==oldp){ toast(t("passBad"), "err"); return; }
  S.cash.pass = np; save(S);
  $("c-oldpass").value=$("c-newpass").value="";
  toast(t("passOk"), "ok");
};
$("d-close").onclick = ()=>{
  persistDriver();
  const r = rec();
  if(!r.razvoz){ toast(t("noRazvoz"), "err"); return; }
  r.status = "closed";
  save(S);
  paintTotals();
  toast(t("closed"), "ok");
};
$("d-pay").onclick = ()=>{
  const r = rec();
  const i = itog(r);
  if(i<=0){ toast(t("noMinus"), "err"); return; }
  const url = (S.cash && S.cash.payUrl) || PAY_DEFAULT;
  const sum = fmt(i);
  try{ navigator.clipboard.writeText(String(Math.round(Math.abs(i)))); }catch(e){}
  toast(t("payAlert").replace("{s}", sum), "ok");
  setTimeout(()=>{ window.location.href = url; }, 400);
};
/* водитель бланк не печатает */

/* cashier */
let C = { who:null, y:null, m:null, date:null, q:"", st:"all" };

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
function cashMark(r){
  if(r && r.status==="accepted") return { text:"сдал", cls:"done" };
  if(r && r.status==="closed") return { text:"посчитана", cls:"wait" };
  return { text:"не посчитана", cls:"off" };
}
function dayCrew(date){
  const out=[];
  for(const u of (S.users||[])){
    const r = (S.days[date]&&S.days[date][u.login]) || null;
    const m = cashMark(r);
    const work = r && (n(r.razvoz) || r.status==="closed" || r.status==="accepted");
    out.push({u, r, mark: work ? m.text : (m.cls==="off" ? "не посчитана" : m.text), cls:m.cls, work:!!work});
  }
  return out;
}
function dayAllPaid(date){
  const rows = dayCrew(date).filter(x=>x.work);
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
    const work = rows.filter(x=>x.work);
    const ok = work.filter(x=>x.cls==="done").length;
    const counted = work.filter(x=>x.cls==="wait" || x.cls==="done").length;
    let cls="daycell";
    if(work.length && ok===work.length) cls+=" paid";
    else if(work.some(x=>x.cls==="wait")) cls+=" hands";
    const extra = work.length ? `<div class="muted">${counted} счит. · ${ok} сдал</div>` : "";
    cells+=`<button class="${cls}" data-adate="${date}"><div class="n">${d}</div>${extra}</button>`;
  }
  $("c-all-cal").innerHTML = dow+cells;
  $("c-all-cal").querySelectorAll("[data-adate]").forEach(b=>b.onclick=()=>{ C.date=b.dataset.adate; showCash("daylist"); });
}
function dayStatusKey(r){
  if(!r) return "off";
  if(r.status==="accepted") return "done";
  if(r.status==="closed") return "wait";
  return "off";
}
function statusRank(k){ return k==="off"?0:k==="wait"?1:2; }
function matchQuery(name, login, q){
  if(!q) return true;
  const s = (name+" "+login).toLowerCase();
  return s.includes(q.toLowerCase());
}
function ensureFiltBar(boxId, onChange){
  const box = $(boxId);
  if(!box) return;
  if(!box.dataset.ready){
    box.dataset.ready = "1";
    box.innerHTML = `<input id="${boxId}-q" placeholder="Поиск по имени…" value="">
      <div class="row">
        <button type="button" data-st="all" class="on">Все</button>
        <button type="button" data-st="off">Не посчитана</button>
        <button type="button" data-st="wait">Посчитана</button>
        <button type="button" data-st="done">Сдал</button>
      </div>`;
    const qel = $(boxId+"-q");
    if(qel) qel.oninput = ()=>{ C.q = qel.value.trim(); onChange(); };
    box.querySelectorAll("[data-st]").forEach(b=>{
      b.onclick = ()=>{ C.st = b.dataset.st; ensureFiltBar(boxId, onChange); onChange(); };
    });
  }
  const st = C.st||"all";
  box.querySelectorAll("[data-st]").forEach(b=>{
    b.classList.toggle("on", b.dataset.st===st);
  });
  const qel = $(boxId+"-q");
  if(qel && qel.value !== (C.q||"") && document.activeElement!==qel) qel.value = C.q||"";
}
function renderDayList(){
  $("c-daylist-title").textContent = C.date;
  ensureFiltBar("c-daylist-filt", renderDayList);
  let rows = dayCrew(C.date);
  rows = rows.filter(x=>{
    if(!matchQuery(x.u.name, x.u.login, C.q)) return false;
    if(C.st && C.st!=="all" && x.cls!==C.st) return false;
    return true;
  });
  rows.sort((a,b)=> statusRank(a.cls)-statusRank(b.cls) || (a.u.name||"").localeCompare(b.u.name||"","ru"));
  if(!S.users.length){
    $("c-daylist-box").innerHTML = `<p class="muted">Нет водителей</p>`;
    return;
  }
  if(!rows.length){
    $("c-daylist-box").innerHTML = `<p class="muted">Никого не найдено</p>`;
    return;
  }
  const counted = rows.filter(x=>x.cls==="wait").length;
  const paid = rows.filter(x=>x.cls==="done").length;
  const none = rows.filter(x=>x.cls==="off").length;
  $("c-daylist-box").innerHTML = `<p class="muted">посчитана ${counted} · сдал ${paid} · не посчитана ${none}</p>`+rows.map(x=>`<button data-who="${x.u.login}" style="width:100%;margin:4px 0;display:flex;justify-content:space-between;padding:10px">
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
  ensureFiltBar("c-board-filt", renderBoard);
  if(!S.users.length){
    $("c-board").innerHTML = `<p class="muted">Сначала добавьте сотрудника в настройках.</p>`;
    return;
  }
  let list = S.users.map(u=>{
    const r = (S.days[date]&&S.days[date][u.login]) || blank();
    return { u, r, sk: dayStatusKey(r) };
  });
  list = list.filter(x=>{
    if(!matchQuery(x.u.name, x.u.login, C.q)) return false;
    if(C.st && C.st!=="all" && x.sk!==C.st) return false;
    return true;
  });
  list.sort((a,b)=> statusRank(a.sk)-statusRank(b.sk) || (a.u.name||"").localeCompare(b.u.name||"","ru"));
  if(!list.length){
    $("c-board").innerHTML = `<p class="muted">Никого не найдено</p>`;
    return;
  }
  const sum = {off:0, wait:0, done:0};
  list.forEach(x=> sum[x.sk] = (sum[x.sk]||0)+1);
  $("c-board").innerHTML = `<p class="muted">посчитана ${sum.wait||0} · сдал ${sum.done||0} · не посчитана ${sum.off||0}</p>`+list.map(x=>{
    const m = cashMark(x.r);
    return `<div class="board-row">
      <button class="ghost nm" data-open="${x.u.login}" style="text-align:left;padding:6px 8px">
        ${x.u.name} <span class="pill ${m.cls}">${m.text}</span>
      </button>
      <div><label>Развоз</label><input inputmode="numeric" data-br="${x.u.login}" value="${x.r.razvoz||""}"></div>
      <div><label>QR</label><input inputmode="numeric" data-bq="${x.u.login}" value="${x.r.qr||""}"></div>
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
  ensureFiltBar("c-staff-filt", renderDrivers);
  if(!S.users.length){
    $("c-drivers").innerHTML = `<p class="muted">Пока никого нет. Добавьте первого ниже.</p>`;
    return;
  }
  let list = S.users.map(u=>{
    const s = driverStats(u.login);
    let sk = "off";
    if(s.hands) sk = "wait";
    else if(s.paid) sk = "done";
    return { u, s, sk };
  });
  list = list.filter(x=>{
    if(!matchQuery(x.u.name, x.u.login, C.q)) return false;
    if(C.st && C.st!=="all" && x.sk!==C.st) return false;
    return true;
  });
  list.sort((a,b)=> statusRank(a.sk)-statusRank(b.sk) || (a.u.name||"").localeCompare(b.u.name||"","ru"));
  if(!list.length){
    $("c-drivers").innerHTML = `<p class="muted">Никого не найдено</p>`;
    return;
  }
  $("c-drivers").innerHTML = list.map(x=>{
    const s = x.s;
    return `<div class="card" style="padding:8px;margin:0 0 6px">
      <button data-name="${x.u.login}" style="margin:0;padding:8px">
        <span>${x.u.name}<br><span class="muted">${x.u.login}</span></span>
        <span class="pill ${x.sk}">
          ${s.hands?("на руках "+s.hands):""}${s.hands&&s.paid?" · ":""}${s.paid?("сдал "+s.paid): (!s.hands&&!s.paid?"пусто":"")}
        </span>
      </button>
      <div class="row" style="margin-top:4px">
        <button class="ghost" data-rename="${x.u.login}">имя</button>
        <button class="ghost" data-pass="${x.u.login}">пароль</button>
        <button class="ghost" data-del="${x.u.login}">удалить</button>
      </div>
    </div>`;
  }).join("");
  $("c-drivers").querySelectorAll("[data-name]").forEach(b=>b.onclick=()=>{
    C.who=b.dataset.name; C.display=S.users.find(x=>x.login===C.who)?.name||C.who; showCash("cal");
  });
  $("c-drivers").querySelectorAll("[data-rename]").forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    const u = S.users.find(x=>x.login===b.dataset.rename);
    if(!u) return;
    const nm = await askText("Новое имя", u.name||"");
    if(nm==null) return;
    const tt = String(nm).trim();
    if(!tt){ toast("Имя пустое", "err"); return; }
    u.name = tt;
    save(S);
    renderDrivers();
    toast("Имя сохранено", "ok");
  });
  $("c-drivers").querySelectorAll("[data-pass]").forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    const p = await askText("Новый пароль для "+b.dataset.pass, "");
    if(p==null || !String(p).trim()) return;
    const u = S.users.find(x=>x.login===b.dataset.pass);
    if(!u) return;
    u.pass = String(p).trim(); save(S); toast("Пароль обновлён", "ok");
  });
  $("c-drivers").querySelectorAll("[data-del]").forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    if(!(await askYes("Удалить "+b.dataset.del+"?"))) return;
    S.users = S.users.filter(x=>x.login!==b.dataset.del);
    save(S); renderDrivers();
    toast("Удалено", "ok");
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
  const mon = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
  return p[2]+"."+ (mon[Number(p[1])-1] || p[1]);
}
function opisCardHtml(r, name, date){
  const billsOnly = BILLS.reduce((a,b)=>a+n(r.bills&&r.bills[b])*b,0);
  const kassa = billsOnly + n(r.coins);
  const qty = b => n(r.bills && r.bills[b]);
  const line = (b) => `${b} * ${qty(b)} = ${fmt(qty(b)*b)}`;
  return `<div class="slip">
    <div class="r2"><span>Дата: ${fmtDateRu(date)}</span><span>Район: ${r.raion||"—"}</span></div>
    <div class="r3"><span>Имя: ${name||"—"}</span><span>№</span></div>
    <div class="r4">Наличка</div>
    <div class="line"><span>Расход:</span><span></span><b>${line(20000)}</b></div>
    <div class="line"><span>Стоянка: ${fmt(r.park)}</span><span></span><b>${line(10000)}</b></div>
    <div class="line"><span>Обед: ${fmt(r.lunch)}</span><span></span><b>${line(5000)}</b></div>
    <div class="line"><span>Заправки: ${fmt(r.fuel)}</span><span></span><b>${line(2000)}</b></div>
    <div class="line"><span>Прочее: ${fmt(r.other)}</span><span></span><b>${line(1000)}</b></div>
    <div class="line"><span>Аванс: ${fmt(r.adv)}</span><span></span><b>${line(500)}</b></div>
    <div class="gap"></div>
    <div class="line"><span>Итог:</span><b>${fmt(billsOnly)}</b></div>
    <div class="line"><span>Монеты:</span><b>${fmt(r.coins)}</b></div>
    <div class="gap"></div>
    <div class="line"><span>Каспи ${fmt(r.term)}</span></div>
    <div class="gap big"></div>
    <div class="sec">Развоз:</div>
    <div class="line"><span>Развоз:</span><b>${fmt(r.razvoz)}</b></div>
    <div class="line"><span>Расход:</span><b>${fmt(expSum(r))}</b></div>
    <div class="line"><span>Касса:</span><b>${fmt(kassa)}</b></div>
    <div class="line"><span>Каспи:</span><b>${fmt(r.term)}</b></div>
    <div class="line tot"><span>Итог:</span><b>${fmtItog(itog(r))}</b></div>
  </div>`;
}
function printOpis(){
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
    .slip{width:92mm;font-size:11px;font-family:Arial,sans-serif;color:#000}
    .slip .r2,.slip .r3,.slip .line{display:flex;justify-content:space-between;gap:8px}
    .slip .r4{text-align:right;font-weight:700;margin-top:6px}
    .slip .line{min-height:18px}
    .slip .gap{height:10px}
    .slip .gap.big{height:28px}
    .slip .sec{font-weight:700;margin-top:4px}
    .slip .tot{font-weight:700}
    .no-print{margin:8px}
    @media print{.no-print{display:none}}
  </style></head><body>
  <div class="sheet">${card}</div>
  <div class="no-print"><button onclick="window.print()">Печать</button>
  <span style="margin-left:8px;color:#555">A4 альбомная, масштаб 100%. Одна опись справа</span></div>
  </body></html>`;
  printHtml(html);
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
  printHtml(html);
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
      askYes("Заменить базу? Водителей: "+s.users.length).then(ok=>{
        if(!ok) return;
        S = s;
        save(S);
        toast("База восстановлена", "ok");
        showCash("staff");
      });
    }catch(e){ toast("Файл не подходит", "err"); }
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
  toast("Ссылка Kaspi сохранена", "ok");
};
$("u-add").onclick = ()=>{
  const name = $("u-name").value.trim();
  const login = $("u-login").value.trim().toLowerCase();
  const pass = $("u-pass").value;
  if(!name || !login || !pass){ toast("Имя, логин и пароль обязательны", "err"); return; }
  if(login==="kassa"){ toast("Логин kassa занят кассиром", "err"); return; }
  if(S.users.some(x=>x.login===login)){ toast("Такой логин уже есть", "err"); return; }
  S.users.push({ name, login, pass });
  save(S);
  $("u-name").value=$("u-login").value=$("u-pass").value="";
  renderDrivers();
  toast("Водитель добавлен", "ok");
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
