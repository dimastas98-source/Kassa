/* patch: show raion on closed/accepted days in driver calendar */
(function(){
  if (typeof dayMark !== "function") return;
  const _dayMark = dayMark;
  dayMark = function(r){
    if(!r) return {cls:"daycell", mark:"", extra:""};
    if(r.off) return {cls:"daycell", mark:"выходной", extra:""};
    const base = _dayMark(r);
    if(r.status==="closed" || r.status==="accepted"){
      const i = itog(r);
      let extra = "";
      if(r.raion) extra += `<div class="muted">${r.raion}</div>`;
      extra += `<div class="${i>0?"itog-minus":i<0?"itog-plus":"itog-ok"}">${fmtItog(i)}</div>`;
      base.extra = extra;
    }
    return base;
  };
})();
