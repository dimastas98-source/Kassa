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
function amtList(r, key){
  if(Array.isArray(r[key+"List"]) && r[key+"List"].length) return r[key+"List"].map(n).filter(x=>x);
  const raw = r[key+"Raw"];
  if(raw && String(raw).includes("+")) return String(raw).split("+").map(n).filter(x=>x);
  if(n(r[key])) return [n(r[key])];
  return [];
}
function setAmtList(key, arr){
  const r = rec();
  r[key+"List"] = arr;
  r[key] = arr.reduce((a,b)=>a+b,0);
  r[key+"Raw"] = arr.join("+");
  save(S);
  renderAmtList(key);
  paintTotals();
}
function renderAmtList(key){
  const box = $("d-"+key+"-list");
  const sumEl = $("d-"+key+"-sum");
  if(!box) return;
  const arr = amtList(rec(), key);
  box.innerHTML = arr.map((x,i)=>`<div class="row" style="margin:4px 0;align-items:center">
    <span class="num">${fmt(x)}</span>
    <button type="button" class="ghost" data-del="${i}" style="flex:0;width:40px">×</button>
  </div>`).join("");
  if(sumEl) sumEl.textContent = fmt(arr.reduce((a,b)=>a+b,0));
  box.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick = ()=>{
      const next = amtList(rec(), key).filter((_,i)=>i!==Number(b.dataset.del));
      setAmtList(key, next);
    };
  });
}
function addAmt(key){
  const inp = $("d-"+key+"-add");
  const v = n(inp && inp.value);
  if(!v){ if(inp) inp.focus(); return; }
  setAmtList(key, amtList(rec(), key).concat([v]));
  if(inp){ inp.value=""; inp.focus(); }
}
function persistDriver(){
  const r = rec();
  r.raion=$("d-raion").value.trim();
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
  renderAmtList("ret");
  renderAmtList("cons");
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
["d-raion","d-term","d-coins","d-park","d-lunch","d-fuel","d-other","d-adv"].forEach(id=>{
  const el=$(id); if(!el) return;
  el.addEventListener("input", persistDriver);
  el.addEventListener("change", persistDriver);
});
if($("d-ret-go")) $("d-ret-go").onclick = ()=> addAmt("ret");
if($("d-cons-go")) $("d-cons-go").onclick = ()=> addAmt("cons");
["d-ret-add","d-cons-add"].forEach(id=>{
  const el=$(id); if(!el) return;
  el.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); addAmt(id.includes("ret")?"ret":"cons"); }});
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

