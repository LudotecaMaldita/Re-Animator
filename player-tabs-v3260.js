/* Re-Animator · Navegación de Jugador móvil v3.2.60 */
(function(){
  "use strict";
  function mobilePlayer(){
    return document.body.classList.contains("mode-screen")&&
      document.body.classList.contains("table-client")&&
      !document.body.classList.contains("public-general-view")&&
      window.matchMedia("(max-width:760px)").matches;
  }
  function formatClock(seconds){
    seconds=Math.max(0,Math.ceil(Number(seconds)||0));
    return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(x=>String(x).padStart(2,"0")).join(":");
  }
  function updateClock(){
    const label=document.getElementById("lmPlayerClock");if(!label)return;
    try{
      if(typeof directorState!=="undefined" && directorState && directorState.timer){
        const t=directorState.timer;
        const seconds=t.running?Math.max(0,Math.ceil((Number(t.endAt)-Date.now())/1000)):Number(t.remaining);
        if(Number.isFinite(seconds)){label.textContent=formatClock(seconds);return;}
      }
    }catch(e){}
    const other=document.getElementById("timerDisplay");
    if(other&&/^\d\d:\d\d:\d\d$/.test(other.textContent.trim()))label.textContent=other.textContent.trim();
  }
  function selectTab(name){
    const nav=document.getElementById("lmPlayerMobileNav");
    if(!nav)return;
    const status=name==="status";
    document.body.classList.toggle("lm-player-tab-status",status);
    document.body.classList.toggle("lm-player-tab-data",!status);
    nav.querySelectorAll("[data-lm-tab]").forEach(button=>{
      const active=button.dataset.lmTab===(status?"status":"data");
      button.setAttribute("aria-selected",String(active));
      button.tabIndex=active?0:-1;
    });
  }
  function init(){
    if(document.getElementById("lmPlayerMobileNav"))return;
    const main=document.querySelector("main"),quick=document.getElementById("directorQuickbar");
    if(!main||!quick)return;
    const nav=document.createElement("div");nav.id="lmPlayerMobileNav";
    nav.innerHTML='<div class="lm-player-clock"><span>⏱ Tiempo restante</span><strong id="lmPlayerClock">03:00:00</strong></div><div class="lm-player-tabs" role="tablist" aria-label="Vista de mesa"><button type="button" role="tab" data-lm-tab="status" aria-selected="false">Estado del evento</button><button type="button" role="tab" data-lm-tab="data" aria-selected="true">Introducir datos</button></div>';
    quick.insertAdjacentElement("afterend",nav);
    nav.querySelectorAll("[data-lm-tab]").forEach(b=>b.addEventListener("click",()=>selectTab(b.dataset.lmTab)));
    nav.style.display="none";
    selectTab("data");updateClock();
  }
  let announcementHome=null;
  function placeAnnouncement(active){
    const nav=document.getElementById("lmPlayerMobileNav");
    const moved=document.getElementById("lmMobileAnnouncement");
    const panel=document.querySelector("main .event-director-only > .announcement-panel");
    if(active&&nav){
      const el=moved||panel;
      if(!el)return;
      if(!announcementHome){
        announcementHome=document.createComment("original announcement position");
        el.parentNode.insertBefore(announcementHome,el);
      }
      el.id="lmMobileAnnouncement";
      const tabs=nav.querySelector(".lm-player-tabs");
      if(el.parentNode!==nav)nav.insertBefore(el,tabs);
      el.style.display="block";
    }else if(moved&&announcementHome&&announcementHome.parentNode){
      moved.removeAttribute("id");
      moved.style.removeProperty("display");
      announcementHome.parentNode.insertBefore(moved,announcementHome);
      announcementHome.remove();
      announcementHome=null;
    }
  }
  function tick(){
    init();
    const nav=document.getElementById("lmPlayerMobileNav");
    const active=mobilePlayer();
    if(nav)nav.style.display=active?"":"none";
    placeAnnouncement(active);
    if(active)updateClock();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tick,{once:true});else tick();
  setInterval(tick,1000);
})();
