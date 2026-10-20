/* Ajuste automático, exclusivamente para la Pantalla Pública de Re-Animator. */
(function(){
  "use strict";
  let pending=false;
  function publicScreen(){
    return document.body.classList.contains("mode-screen") &&
      !document.body.classList.contains("table-client") &&
      window.innerWidth>800;
  }
  // Identificar los títulos por su texto real, sin depender de la etiqueta HTML.
  function adjustGeneralTitles(){
    const rules=[
      {match:/^escenario anterior\\s*[·•-]\\s*laboratorio,?\\s*hill y la morgue$/i,hide:true},
      {match:/^fracaso\\s*[·•-]\\s*la muerte ha sido vencida$/i,size:"clamp(21px,1.65vw,30px)"},
      {match:/^laboratorio central$/i,size:"clamp(23px,1.9vw,34px)",center:true},
      {match:/^hitos globales$/i,size:"clamp(19px,1.35vw,25px)",center:true},
      {match:/^crisis globales$/i,size:"clamp(19px,1.35vw,25px)",center:true}
    ];
    const clean=s=>(s||"").replace(/\\s+/g," ").trim();
    const elements=document.querySelectorAll("header *, main *, .scenario-panel *");
    for(const el of elements){
      if(el.children.length>0 && Array.from(el.children).some(ch=>rules.some(r=>r.match.test(clean(ch.textContent)))))continue;
      const text=clean(el.textContent);
      const rule=rules.find(r=>r.match.test(text));
      if(!rule)continue;
      if(rule.hide){el.style.setProperty("display","none","important");continue;}
      el.style.setProperty("font-size",rule.size,"important");
      el.style.setProperty("line-height","1.2","important");
      if(rule.center){
        el.style.setProperty("text-align","center","important");
        el.style.setProperty("width","100%","important");
        el.style.setProperty("display","block","important");
      }
    }
  }
  // Centrar respecto al rectángulo de la caja derecha, no al viewport.
  function centerGlobalPanelTitles(){
    const panel=document.querySelector("main>div.event-director-only:not(#directorQuickbar)>.global-panel");
    if(!panel)return;
    const titleNames=new Set(["estado global","laboratorio central"]);
    const walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT);
    const found=new Set();
    let node;
    while((node=walker.nextNode())){
      if(!titleNames.has((node.nodeValue||"").replace(/\\s+/g," ").trim().toLocaleLowerCase("es")))continue;
      let el=node.parentElement;
      if(!el||found.has(el))continue;
      found.add(el);
      el.style.setProperty("width","max-content","important");
      el.style.setProperty("max-width","100%","important");
      el.style.setProperty("display","block","important");
      el.style.setProperty("margin-left","0","important");
      el.style.setProperty("margin-right","0","important");
      el.style.setProperty("text-align","center","important");
      el.style.setProperty("transform","none","important");
      const box=panel.getBoundingClientRect();
      const title=el.getBoundingClientRect();
      const delta=(box.left+box.width/2)-(title.left+title.width/2);
      el.style.setProperty("transform",`translateX(${delta.toFixed(2)}px)`,"important");
    }
  }
  // Ocultar el indicador «Preparado» situado bajo el contador público.
  function hideReadyBox(){
    const timer=document.querySelector("main>div.event-director-only:not(#directorQuickbar)>.timer-panel");
    if(!timer)return;
    for(const el of timer.querySelectorAll("*")){
      if(el.children.length)continue;
      if((el.textContent||"").trim().toLocaleLowerCase("es")!=="preparado")continue;
      const badge=el.closest(".badge,.pill,.chip,.status,.status-badge,.status-pill,.ready-box");
      const target=badge&&timer.contains(badge)?badge:el;
      target.style.setProperty("display","none","important");
    }
  }
  // Ajustes exclusivos del bloque izquierdo de Resultado épico.
  function adjustOutcomePanel(){
    const panel=document.querySelector("main>div.event-director-only:not(#directorQuickbar)>.outcome-panel");
    if(!panel)return;
    const normalized=s=>(s||"").replace(/\\s+/g," ").trim().toLocaleLowerCase("es");
    for(const el of panel.querySelectorAll("*")){
      if(el.children.length && [...el.children].some(child=>normalized(child.textContent)===normalized(el.textContent)))continue;
      const label=normalized(el.textContent);
      if(label==="en curso"){
        const badge=el.closest(".badge,.pill,.chip,.status,.status-badge,.status-pill");
        const target=badge&&panel.contains(badge)?badge:el;
        target.style.setProperty("display","none","important");
      }
      if(label==="resultado épico"||label==="fracaso · la muerte ha sido vencida"){
        el.style.setProperty("display","block","important");
        el.style.setProperty("width","max-content","important");
        el.style.setProperty("max-width","100%","important");
        el.style.setProperty("margin-left","0","important");
        el.style.setProperty("margin-right","0","important");
        el.style.setProperty("text-align","center","important");
        el.style.setProperty("transform","none","important");
        const box=panel.getBoundingClientRect();
        const bounds=el.getBoundingClientRect();
        const offset=box.left+box.width/2-bounds.left-bounds.width/2;
        el.style.setProperty("transform",`translateX(${offset.toFixed(2)}px)`,"important");
      }
    }
  }
  function update(){
    pending=false;
    if(!publicScreen())return;
    adjustGeneralTitles();
    hideReadyBox();
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
    centerGlobalPanelTitles();
    adjustOutcomePanel();
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
