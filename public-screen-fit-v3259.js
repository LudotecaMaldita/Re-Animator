/* Ajuste automático, exclusivamente para la Pantalla Pública de Re-Animator. */
(function(){
  "use strict";
  let pending=false;
  function publicScreen(){
    return document.body.classList.contains("mode-screen") &&
      !document.body.classList.contains("table-client") &&
      window.innerWidth>800;
  }
  // Ajustes por texto visible, para no depender de clases antiguas del HTML.
  function adjustGeneralTitles(){
    const specs=[
      {text:"Escenario anterior · laboratorio, Hill y la morgue",hide:true},
      {text:"Fracaso · La muerte ha sido vencida",size:"clamp(20px,1.55vw,29px)"},
      {text:"Laboratorio central",size:"clamp(22px,1.7vw,31px)",center:true},
      {text:"Hitos globales",size:"clamp(19px,1.35vw,26px)",center:true},
      {text:"Crisis globales",size:"clamp(19px,1.35vw,26px)",center:true}
    ];
    const normalize=s=>s.replace(/\\s+/g," ").trim().toLocaleLowerCase("es");
    const roots=document.querySelectorAll("header, main, .scenario-panel");
    const visited=new Set();
    for(const root of roots){
      for(const el of root.querySelectorAll("h1,h2,h3,h4,h5,p,span,div,strong,small")){
        if(visited.has(el))continue;
        visited.add(el);
        const value=normalize(el.textContent||"");
        const spec=specs.find(item=>normalize(item.text)===value);
        if(!spec)continue;
        // Preferir el nodo de texto más interno que contenga el título exacto.
        if(Array.from(el.children).some(ch=>normalize(ch.textContent||"")===value))continue;
        if(spec.hide){
          el.style.setProperty("display","none","important");
          continue;
        }
        el.style.setProperty("font-size",spec.size,"important");
        el.style.setProperty("line-height","1.2","important");
        if(spec.center){
          el.style.setProperty("text-align","center","important");
          el.style.setProperty("width","100%","important");
          el.style.setProperty("display","block","important");
        }
      }
    }
  }
  function update(){
    pending=false;
    if(!publicScreen())return;
    adjustGeneralTitles();
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
