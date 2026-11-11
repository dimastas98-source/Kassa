/* patch: correct Back navigation for cashier driver calendar */
(function(){
  const back = document.getElementById("c-back");
  if(!back) return;

  // Track where we came from when opening driver calendar / day
  const origShowCash = typeof showCash === "function" ? showCash : null;

  // Staff list → driver calendar
  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("[data-name]");
    if(btn && btn.dataset && btn.dataset.name && typeof C !== "undefined"){
      C.from = "staff";
    }
  }, true);

  // Board name → driver calendar
  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("[data-open]");
    if(btn && btn.dataset && btn.dataset.open && typeof C !== "undefined"){
      C.from = "today";
    }
  }, true);

  // Daylist → day
  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("[data-who]");
    if(btn && btn.dataset && btn.dataset.who && typeof C !== "undefined"){
      // only when daylist is visible
      const dl = document.getElementById("c-daylist");
      if(dl && dl.style.display !== "none") C.from = "daylist";
    }
  }, true);

  // Calendar day cell → day (keep C.from as staff/today)
  document.addEventListener("click", function(e){
    const btn = e.target && e.target.closest && e.target.closest("#c-cal [data-date]");
    if(btn && typeof C !== "undefined"){
      if(C.from !== "staff" && C.from !== "today") C.from = "cal";
    }
  }, true);

  back.onclick = function(){
    const daywrap = document.getElementById("c-daywrap");
    const calwrap = document.getElementById("c-calwrap");
    const daylist = document.getElementById("c-daylist");
    if(daywrap && daywrap.style.display !== "none"){
      if(typeof C !== "undefined" && C.from === "daylist") showCash("daylist");
      else showCash("cal");
      return;
    }
    if(calwrap && calwrap.style.display !== "none"){
      if(typeof C !== "undefined" && C.from === "today") showCash("today");
      else showCash("staff");
      return;
    }
    if(daylist && daylist.style.display !== "none"){
      showCash("month");
      return;
    }
    showCash("month");
  };
})();
