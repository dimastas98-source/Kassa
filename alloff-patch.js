/* patch: all-off day in general calendar — red highlight */
(function(){
  if (typeof renderAllCal !== "function") return;

  function allDriversOff(date){
    const users = S.users || [];
    if(!users.length) return false;
    let marked = 0;
    for(const u of users){
      const r = S.days[date] && S.days[date][u.login];
      if(r && r.off) marked++;
      else return false; // someone not marked off
    }
    return marked === users.length;
  }

  const _renderAllCal = renderAllCal;
  renderAllCal = function(){
    _renderAllCal();
    const root = document.getElementById("c-all-cal");
    if(!root) return;
    root.querySelectorAll("[data-adate]").forEach(btn=>{
      const date = btn.dataset.adate;
      if(allDriversOff(date)){
        btn.classList.remove("paid", "hands");
        btn.classList.add("alloff");
        // keep number, replace extra text
        const n = btn.querySelector(".n");
        const dayNum = n ? n.textContent : "";
        btn.innerHTML = `<div class="n">${dayNum}</div><div class="muted">выходной</div>`;
      }
    });
  };
})();
