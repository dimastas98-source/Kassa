/* patch: номер кассы (терминала) у водителя */
(function(){
  function userByLogin(login){
    return (S.users||[]).find(x=>x.login===login);
  }
  function kassaOf(login){
    const u = userByLogin(login);
    return (u && u.kassa) ? String(u.kassa).trim() : "";
  }

  // Список сотрудников: показать кассу + кнопка
  if(typeof renderDrivers === "function"){
    const _rd = renderDrivers;
    renderDrivers = function(){
      _rd.apply(this, arguments);
      const box = document.getElementById("c-drivers");
      if(!box) return;
      box.querySelectorAll(".card").forEach(card=>{
        const btn = card.querySelector("[data-name]");
        if(!btn) return;
        const login = btn.dataset.name;
        const k = kassaOf(login);
        // подпись кассы под именем
        const muted = btn.querySelector(".muted");
        if(muted){
          muted.textContent = login + (k ? " · касса "+k : " · касса не указана");
        }
        // кнопка если ещё нет
        const row = card.querySelector(".row");
        if(row && !row.querySelector("[data-kassa]")){
          const b = document.createElement("button");
          b.className = "ghost";
          b.dataset.kassa = login;
          b.textContent = "касса";
          row.insertBefore(b, row.firstChild);
          b.onclick = async e=>{
            e.stopPropagation();
            const u = userByLogin(login);
            if(!u) return;
            const v = await askText("Номер кассы (терминал) для "+(u.name||login), u.kassa||"");
            if(v==null) return;
            u.kassa = String(v).trim();
            save(S);
            renderDrivers();
            toast(u.kassa ? "Касса "+u.kassa+" закреплена" : "Номер кассы очищен", "ok");
          };
        }
      });
    };
  }

  // При добавлении водителя — поле u-kassa
  const addBtn = document.getElementById("u-add");
  if(addBtn){
    const prev = addBtn.onclick;
    addBtn.onclick = function(ev){
      if(typeof prev === "function") prev.call(this, ev);
      // если водитель только что добавлен — проставим кассу
      const loginEl = document.getElementById("u-login");
      const kEl = document.getElementById("u-kassa");
      // prev already cleared fields; better intercept before
    };
    // replace fully to include kassa
    addBtn.onclick = function(){
      const name = ($("u-name").value||"").trim();
      const login = ($("u-login").value||"").trim().toLowerCase();
      const pass = $("u-pass").value;
      const kassa = ($("u-kassa") && $("u-kassa").value || "").trim();
      if(!name || !login || !pass){ toast("Имя, логин и пароль обязательны", "err"); return; }
      if(login==="kassa"){ toast("Логин kassa занят кассиром", "err"); return; }
      if(S.users.some(x=>x.login===login)){ toast("Такой логин уже есть", "err"); return; }
      S.users.push({ name, login, pass, kassa });
      save(S);
      $("u-name").value=$("u-login").value=$("u-pass").value="";
      if($("u-kassa")) $("u-kassa").value="";
      renderDrivers();
      toast("Водитель добавлен"+(kassa?" · касса "+kassa:""), "ok");
    };
  }

  // В дне кассира — подпись у KASPI PAY с номером кассы
  function labelTermCash(){
    const lab = Array.from(document.querySelectorAll("#c-daywrap label")).find(l=>/KASPI\s*PAY/i.test(l.textContent||""));
    if(!lab) return;
    const k = kassaOf(C.who);
    lab.textContent = k ? ("KASPI PAY · касса "+k) : "KASPI PAY";
  }
  if(typeof renderDay === "function"){
    const _day = renderDay;
    renderDay = function(){
      _day.apply(this, arguments);
      labelTermCash();
    };
  }

  // В форме водителя — тоже показать свой номер
  function labelTermDriver(){
    const lab = Array.from(document.querySelectorAll("#d-form label")).find(l=>{
      const t = (l.getAttribute("data-i18n")||"")+" "+(l.textContent||"");
      return /term|KASPI/i.test(t);
    });
    if(!lab) return;
    const k = kassaOf(typeof who==="function"?who():"");
    lab.textContent = k ? ("KASPI PAY · касса "+k) : (lab.getAttribute("data-i18n")? undefined : lab.textContent);
    if(k) lab.textContent = "KASPI PAY · касса "+k;
  }
  if(typeof renderDriver === "function"){
    const _drv = renderDriver;
    renderDriver = function(){
      _drv.apply(this, arguments);
      labelTermDriver();
    };
  }
})();
