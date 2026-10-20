/* Ajuste automático, exclusivamente para la Pantalla Pública de Re-Animator. */
(function(){
  "use strict";
  let pending=false;
  function publicScreen(){
    return document.body.classList.contains("mode-screen") &&
      !document.body.classList.contains("table-client") &&
      window.innerWidth>800;
  }
  function update(){
    pending=false;
    if(!publicScreen())return;
    for(const type of ["outcome-panel","global-panel"]){
      const panel=document.querySelector("main>div.event-director-only:not(#directorQuickbar)>."+type);
      if(!panel||panel.offsetParent===null)continue;
      const content=panel.querySelector(".panel-pad");
      if(!content)continue;
      content.style.zoom="1";
      const bounds=panel.getBoundingClientRect();
      const styles=getComputedStyle(panel);
      const available=Math.max(1,bounds.height-
        parseFloat(styles.paddingTop||0)-parseFloat(styles.paddingBottom||0)-8);
      const natural=Math.max(content.scrollHeight,content.getBoundingClientRect().height);
      // Se escala todo el contenido, manteniendo las proporciones de títulos y cifras.
      const ratio=natural>available?Math.max(.4,Math.min(1,(available-2)/natural)):1;
      content.style.zoom=ratio.toFixed(3);
      panel.style.overflow="hidden";
    }
  }
  function schedule(){
    if(!pending){
      pending=true;
      requestAnimationFrame(update);
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",schedule,{once:true});
  else schedule();
  window.addEventListener("resize",schedule,{passive:true});
  document.addEventListener("fullscreenchange",schedule);
  // El Director actualiza hitos, crisis y resultados en tiempo real; reajustar tras esos cambios.
  const ready=()=>{
    const panels=document.querySelector("main>div.event-director-only:not(#directorQuickbar)");
    if(panels){
      new MutationObserver(schedule).observe(panels,{subtree:true,childList:true,characterData:true});
    }
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});
  else ready();
  setInterval(schedule,2500);
})();
