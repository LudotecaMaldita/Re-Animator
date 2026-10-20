(function(){
  "use strict";
  if(new URLSearchParams(location.search).get("mode")==="screen")return;
  const $=id=>document.getElementById(id),PIN="15041981";
  const S_URL="https://hzlyiuhkolyhnvhhdgvk.supabase.co";
  const S_KEY="sb_publishable_-sjvuy-a955SZjxi5nUOlQ_0uKLlfSe";
  let auth=false,opening=false,hostChannel=null,hostRoom="",watchChannel=null,phase="choice",overlay;
  const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||"";if(text)e.textContent=text;return e};
  const css=node("style");css.textContent=`
  .lm-v3256-overlay{position:fixed;z-index:2147483000;inset:0;background:radial-gradient(ellipse at 50% 10%,#244028,#040b07 80%);display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;color:#eaf6df}
  .lm-v3256-overlay.hidden{display:none!important}
  .lm-v3256-dialog{width:min(710px,100%);background:linear-gradient(140deg,#15271a,#09120c);border:1px solid #688e60;border-radius:17px;padding:clamp(23px,4vw,46px);box-shadow:0 20px 90px #000b;max-height:calc(100dvh - 36px);overflow:auto}
  .lm-v3256-dialog h2{text-align:center;font-size:clamp(25px,4vw,37px);color:#e7f9ce;margin:10px 0}
  .lm-v3256-kicker{text-align:center;font-size:12px;letter-spacing:.2em;color:#abd48c;font-weight:800;text-transform:uppercase}
  .lm-v3256-sub{text-align:center;color:#b8cdaf;margin:0 0 28px;line-height:1.6}
  .lm-v3256-stack{display:grid;gap:13px}
  .lm-v3256-choice{width:100%;background:#18331f!important;border:1px solid #63975c!important;border-radius:12px!important;padding:21px!important;color:#edffe3!important;text-align:left!important;font-size:21px!important;font-weight:800!important;cursor:pointer}
  .lm-v3256-choice.alt{background:#0f2016!important}
  .lm-v3256-choice small{display:block;margin-top:8px;color:#b9d0b0;font-size:13px;font-weight:400}
  .lm-v3256-back{margin-top:23px;width:100%;background:transparent!important;border:1px solid #6d836e!important;border-radius:9px!important;color:#ddebd6!important;padding:11px!important;cursor:pointer}
  .lm-v3256-status{padding:13px;border:1px solid #557d50;border-radius:9px;color:#d2e9c9;margin-bottom:15px;line-height:1.5}
  .lm-v3256-pass{width:100%;background:#07120a;border:1px solid #79ac6e;border-radius:9px;color:white;padding:14px;font-size:22px;letter-spacing:.12em}
  .lm-v3256-error{color:#ffb7a9;min-height:18px;margin:8px 0}
  body.mode-narrator main >.scenario-panel,body.mode-narrator main >.mode-panel,body.mode-narrator main >.audio-only{display:none!important}
  body.mode-narrator #narratorSettingsPanel,body.mode-narrator #openScreenBtn,body.mode-narrator #sharePublicBtn{display:none!important}
  `;
  document.head.appendChild(css);
  const actions=document.querySelector("#gameSplash .game-main-actions");
  if(actions){actions.replaceChildren();const b=node("button","game-main-btn primary","▶ VER VÍDEO Y CONTINUAR");b.id="lmContinueScenario";b.type="button";actions.appendChild(b);b.addEventListener("click",startIntro)}
  const modeLabel=document.querySelector("#gameSplash .game-mode-label");if(modeLabel)modeLabel.textContent="Siguiente paso";
  if($("splashResumeBtn"))$("splashResumeBtn").style.display="none";
  const tagline=document.querySelector("#gameSplash .game-tagline");
  if(tagline)tagline.textContent="Selecciona el escenario. Después del vídeo de introducción podrás escoger el modo de juego.";
  overlay=node("div","lm-v3256-overlay hidden");overlay.id="lmV3256Overlay";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");
  const panel=node("div","lm-v3256-dialog");overlay.appendChild(panel);document.body.appendChild(overlay);
  function render(title,detail){
    panel.replaceChildren();panel.appendChild(node("p","lm-v3256-kicker","Ludoteca Maldita · Re-Animator"));panel.appendChild(node("h2","",title));
    panel.appendChild(node("p","lm-v3256-sub",detail));
    const stack=node("div","lm-v3256-stack");panel.appendChild(stack);return stack;
  }
  function button(into,title,note,click,alt){
    const b=node("button","lm-v3256-choice"+(alt?" alt":""),title);b.type="button";if(note)b.appendChild(node("small","",note));b.addEventListener("click",click);into.appendChild(b);return b
  }
  function goBack(label,fn){const b=node("button","lm-v3256-back",label);b.type="button";b.addEventListener("click",fn);panel.appendChild(b)}
  function show(){overlay.classList.remove("hidden")}
  function hide(){overlay.classList.add("hidden")}
  async function startIntro(){
    if(opening)return;opening=true;
    try{
      scenarioId=splashScenario;localStorage.setItem(`${BASE_STORE}.scenario`,scenarioId);
      if($("scenarioSelect"))$("scenarioSelect").value=scenarioId;
      applySplashNarratorChoice();applyScenario();appViewHistory.length=0;
      window.LMIntegratedBso?.prepareForLaunch(scenarioId);
      await playSplashIntroVideo(false);
      hideGameMenu();choice();
    }catch(err){console.error(err);alert("No se pudo iniciar el escenario: "+err.message)}
    finally{opening=false}
  }
  function choice(){
    phase="choice";show();
    const box=render("¿Cómo quieres jugar?",`Escenario seleccionado: ${SCENARIOS[scenarioId]?.short||scenarioId}.`);
    button(box,"🎙 Narración del Escenario","Elegir narraciones, escucharlas y consultar sus textos.",()=>{
      hide();setMode("narrator");localStorage.setItem(`${BASE_STORE}.mode`,"narrator");
      window.LMIntegratedBso?.afterIntro(scenarioId);
      setTimeout(()=>startSplashOpeningNarration(scenarioId),180);
    });
    button(box,"🎲 Multijugador Épico","Dos accesos: Director y Jugador.",epic,true);
    goBack("← Elegir otro escenario",()=>{hide();showGameMenu()});
  }
  function epic(){
    phase="epic";show();
    const box=render("Multijugador Épico","Los Directores gestionan el evento y las mesas envían sus informes.");
    button(box,"🎩 Director","Acceso protegido con PIN.",directorPin);
    button(box,"🎲 Jugador","Eventos creados con un Director conectado.",player,true);
    goBack("← Elegir modo",choice);
  }
  function directorPin(){
    phase="pin";show();const box=render("Acceso del Director","Introduce el PIN de ocho cifras.");
    const form=node("form","");const label=node("label","","PIN del Director");
    const input=node("input","lm-v3256-pass");input.type="password";input.inputMode="numeric";input.autocomplete="off";input.maxLength=8;input.required=true;
    const warning=node("div","lm-v3256-error");warning.setAttribute("role","alert");
    const submit=node("button","lm-v3256-choice","🔓 Entrar al Director");submit.type="submit";
    form.append(label,input,warning,submit);box.appendChild(form);
    form.addEventListener("submit",async ev=>{
      ev.preventDefault();if(input.value!==PIN){warning.textContent="PIN incorrecto.";input.value="";input.focus();return}
      auth=true;submit.disabled=true;warning.textContent="Publicando partida en Supabase…";
      try{
        document.body.dataset.lmEpicCreated="no";setMode("director");localStorage.setItem(`${BASE_STORE}.mode`,"director");
        const room=await window.LMEpicRealtime.ensureHost();if(!room)throw new Error("El Director no dispone de sala online.");
        await advertise(room);hide();window.LMIntegratedBso?.afterIntro(scenarioId);
        setTimeout(()=>startSplashOpeningNarration(scenarioId),180);
      }catch(error){console.error(error);warning.textContent="No se pudo conectar: "+error.message;submit.disabled=false}
    });
    goBack("← Multijugador Épico",epic);setTimeout(()=>input.focus(),20);
  }
  function client(){
    if(window.__LMRealtimeClient)return window.__LMRealtimeClient;
    if(!window.supabase?.createClient)throw new Error("No está disponible Supabase. Revisa la conexión a Internet.");
    window.__LMRealtimeClient=window.supabase.createClient(S_URL,S_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    return window.__LMRealtimeClient;
  }
  function topic(){return "lm-epic-lobby-v3256:"+scenarioId}
  async function stopWatch(){const c=watchChannel;watchChannel=null;if(c)try{await client().removeChannel(c)}catch(err){console.warn(err)}}
  async function stopHost(){const c=hostChannel;hostChannel=null;hostRoom="";if(c)try{await client().removeChannel(c)}catch(err){console.warn(err)}}
  async function advertise(room){
    await stopHost();
    const c=client().channel(topic(),{config:{presence:{key:"director-"+room}}});
    hostChannel=c;hostRoom=room;
    await new Promise((resolve,reject)=>{
      let completed=false;const finish=err=>{if(completed)return;completed=true;clearTimeout(timer);err?reject(err):resolve()};
      const timer=setTimeout(()=>finish(new Error("Tiempo de espera agotado.")),12000);
      c.subscribe(async(status,err)=>{
        if(status==="SUBSCRIBED")try{await updateHost();finish()}catch(e){finish(e)}
        else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")finish(new Error(err?.message||"No responde Supabase"))
      });
    });
  }
  async function updateHost(){
    if(!hostChannel)return;
    const s=directorState;
    const started=document.body.dataset.lmEpicCreated==='yes';
    if(auth&&document.body.classList.contains("mode-director")&&!s?.closed&&started){
      await hostChannel.track({role:"director",room:hostRoom,scenario:scenarioId,closed:false,eventName:s.eventName||"Re-Animator",startedAt:Date.now()});
    }else await hostChannel.untrack();
  }
  async function player(){
    phase="player";show();const box=render("Acceder como Jugador","Puedes entrar en cuanto el Director haya creado el evento, sin esperar al temporizador.");
    const status=node("div","lm-v3256-status","Buscando partidas conectadas…");box.appendChild(status);
    const list=node("div","lm-v3256-stack");box.appendChild(list);
    goBack("← Multijugador Épico",()=>{stopWatch();epic()});
    await stopWatch();let c;try{
      c=client().channel(topic(),{config:{presence:{key:"viewer-"+Date.now()+"-"+Math.random().toString(36).slice(2)}}});
    }catch(err){status.textContent="No se pudo conectar: "+err.message;return}
    watchChannel=c;let ready=false;
    const refresh=()=>{
      if(watchChannel!==c||phase!=="player")return;
      const active=new Map();
      Object.values(c.presenceState()).flat().forEach(p=>{
        if(p?.role==="director"&&!p.closed&&p.scenario===scenarioId&&/^lm-[a-z0-9]{16,100}$/i.test(p.room||"")&&Date.now()-Number(p.startedAt||0)<30000)
          active.set(p.room,p.eventName||"Partida épica");
      });
      list.replaceChildren();status.textContent=active.size?`${active.size} partida(s) disponible(s).`:(ready?"No hay partidas activas. Espera a que un Director inicie una.":"Buscando partidas…");
      for(const [room,name] of active)button(list,"🎲 "+String(name).slice(0,75),"Entrar a la selección de mesa",()=>{
        const url=new URL(location.href);url.searchParams.set("mode","screen");url.searchParams.set("scenario",scenarioId);
        url.searchParams.set("room",room);url.searchParams.delete("table");stopWatch();location.assign(url.toString());
      },true);
    };
    c.on("presence",{event:"sync"},refresh);
    c.on("presence",{event:"join"},refresh);
    c.on("presence",{event:"leave"},refresh);
    c.subscribe((result,err)=>{
      if(watchChannel!==c)return;
      if(result==="SUBSCRIBED"){ready=true;refresh()}
      else if(["CHANNEL_ERROR","TIMED_OUT","CLOSED"].includes(result)){list.replaceChildren();status.textContent="No se puede consultar el Director. "+(err?.message||"Comprueba Internet.")}
    });
  }
  // Los jugadores únicamente ven la partida cuando el Director la ha iniciado.
  const previousSaveDirector=saveDirector;
  saveDirector=function(...args){
    const result=previousSaveDirector(...args);
    if(hostChannel)setTimeout(()=>updateHost().catch(console.warn),0);
    return result;
  };
  const previousShowGameMenu=showGameMenu;
  showGameMenu=function(...args){
    auth=false;
    stopHost();
    return previousShowGameMenu(...args);
  };
  // Bloquear la navegación antigua al Director sin PIN y cerrar lobby al abandonar el modo.
  document.addEventListener("click",ev=>{
    if(ev.target.closest?.("#modeDirectorBtn")&&!auth){ev.preventDefault();ev.stopImmediatePropagation();show();epic();directorPin()}
    if(ev.target.closest?.("#openGameMenuBtn")){auth=false;hide();stopHost()}
  },true);
  document.addEventListener("click",ev=>{if(ev.target.closest?.("#modeNarratorBtn")){auth=false;stopHost()}},true);
  $("newEventBtn")?.addEventListener("click",()=>setTimeout(()=>{
    if(!directorState?.closed){document.body.dataset.lmEpicCreated="yes";updateHost().catch(console.warn);}
  },250));
  $("closeEventBtn")?.addEventListener("click",()=>{
    document.body.dataset.lmEpicCreated="no";setTimeout(()=>updateHost().catch(console.warn),200);
  });
  window.addEventListener("pagehide",()=>{stopWatch();stopHost()},{once:true});
  if(new URLSearchParams(location.search).get("mode")==="director"){history.replaceState(null,"",location.pathname);setMode("narrator");showGameMenu()}
  // La Novia del Re-Animator permanecerá cerrada hasta su lanzamiento.
  const brideCard=document.querySelector('[data-splash-scenario="bride"]');
  if(brideCard){
    brideCard.disabled=true;
    brideCard.classList.remove("active");
    brideCard.setAttribute("aria-disabled","true");
    brideCard.setAttribute("title","PRÓXIMAMENTE");
    brideCard.querySelector("span")?.replaceChildren(document.createTextNode("PRÓXIMAMENTE"));
    const ribbon=document.createElement("span");
    ribbon.className="lm-bride-soon";
    ribbon.textContent="PRÓXIMAMENTE";
    brideCard.appendChild(ribbon);
    const style=document.createElement("style");
    style.textContent='.game-scenario[data-splash-scenario="bride"]{position:relative;opacity:.58;filter:grayscale(.65);cursor:not-allowed!important;pointer-events:none;border-color:#68745f!important}.lm-bride-soon{display:block!important;margin-top:8px!important;padding:5px 8px!important;background:#203224;color:#b5f28a!important;font-size:.77rem!important;font-weight:900!important;letter-spacing:.09em;border-radius:6px;text-align:center}';
    document.head.appendChild(style);
  }
  // Impedir el inicio del escenario bloqueado aunque se hubiera guardado anteriormente.
  if(typeof splashScenario!=="undefined"&&splashScenario==="bride"){
    splashScenario="west";renderSplashScenario();
  }

  // Control independiente de BSO para Narración del Escenario.
  const musicButton=node("button","ghost compact lm-narration-music");
  musicButton.type="button";
  musicButton.id="lmNarrationMusicToggle";
  musicButton.setAttribute("aria-label","Activar o desactivar música de fondo");
  musicButton.style.display="none";
  const toolbar=document.querySelector(".topbar .top-actions");
  const fullscreenButton=document.getElementById("fullscreenBtn");
  if(toolbar){if(fullscreenButton)fullscreenButton.insertAdjacentElement("afterend",musicButton);else toolbar.appendChild(musicButton);}
  function syncNarratorMusicButton(){
    const showNarrator=document.body.classList.contains("mode-narrator")&&!document.body.classList.contains("game-menu-open")&&overlay.classList.contains("hidden");
    musicButton.style.display=showNarrator?"block":"none";
    const enabled=window.LMIntegratedBso?.enabled(scenarioId)!==false;
    musicButton.textContent=enabled?"🔊 Música de fondo: ACTIVADA":"🔇 Música de fondo: DESACTIVADA";
    musicButton.setAttribute("aria-pressed",String(enabled));
  }
  musicButton.addEventListener("click",()=>{
    const bso=window.LMIntegratedBso;
    if(!bso)return;
    bso.setEnabled(scenarioId,!bso.enabled(scenarioId));
    syncNarratorMusicButton();
  });
  setInterval(syncNarratorMusicButton,600);
  // Ocultar exclusivamente el botón Atrás en el modo Narración.
  const backStyle=document.createElement("style");
  backStyle.textContent='body.mode-narrator #backBtn,body.mode-narrator #appBackBtn,body.mode-narrator .app-back-btn{display:none!important}';
  document.head.appendChild(backStyle);
  window.LMEpicFlow={choice,epic,stopHost};
})();