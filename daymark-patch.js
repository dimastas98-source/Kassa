/* patch: show raion + partner; off days red */
(function(){
  if (typeof dayMark !== "function") return;
  const _dayMark = dayMark;
  dayMark = function(r){
    if(!r) return {cls:"daycell", mark:"", extra:""};
    if(r.off) return {cls:"daycell alloff", mark:"выходной", extra:""};
    const base = _dayMark(r);
    if(r.status==="closed" || r.status==="accepted"){
      const i = itog(r);
      let extra = "";
      if(r.raion) extra += `<div class="muted">${r.raion}</div>`;
      const pn = r.partner
        ? ((S.users.find(u=>u.login===r.partner)||{}).name || r.partner)
        : "один";
      extra += `<div class="muted">${pn}</div>`;
      extra += `<div class="${i>0?"itog-minus":i<0?"itog-plus":"itog-ok"}">${fmtItog(i)}</div>`;
      base.extra = extra;
    } else if(r.raion || r.partner){
      let extra = base.extra || "";
      if(r.raion) extra = `<div class="muted">${r.raion}</div>` + extra;
      const pn = r.partner
        ? ((S.users.find(u=>u.login===r.partner)||{}).name || r.partner)
        : (r.raion ? "один" : "");
      if(pn) extra += `<div class="muted">${pn}</div>`;
      base.extra = extra;
    }
    return base;
  };
})();
