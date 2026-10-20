/* Ludoteca Maldita · Navegación Re-Animator v3.2.56 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('mode')==='screen')return; // QR existentes: acceso directo sin menú.
const el=id=>document.getElementById(id),DIRECTOR_PIN='15041981';
let authorized=false,step='scenario',hostRoom='',hostLobby=null,hostInterval=null,playerLobby=null,playerInterval=null,playerScenario='',failures=0,lockedUntil=0;
const root=document.createElement('div');root.className='lm-route-screen';root.id='lmRouteScreen';root.hidden=true;
root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Seleccionar modo de juego');
root.innerHTML=`<div class="lm-route-card">
 <header class="lm-route-head"><p class="lm-route-kicker">Ludoteca Maldita · Re-Animator</p><h1 id="lmRouteTitle"></h1><p id="lmRouteDesc"></p></header>
 <div id="lmRouteOptions" class="lm-route-options" hidden></div>
 <form id="lmDirectorForm" class="lm-route-pin" autocomplete="off" hidden><label for="lmDirectorPin">PIN del Director</label><input id="lmDirectorPin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" pattern="[0-9]{8}" placeholder="8 dígitos" required><button class="lm-route-action" type="submit">Entrar como Director</button></form>
 <div id="lmPlayerRooms" hidden aria-live="polite"></div><p id="lmRouteMessage" class="lm-route-hint" role="status" aria-live="polite"></p>
 <footer class="lm-route-navigation"><button id="lmRouteBack" class="lm-route-back" type="button">← Volver</button><span id="lmRouteScenario" class="lm-route-status"></span></footer>
</div>`;
document.body.appendChild(root);
const opts=el('lmRouteOptions'),form=el('lmDirectorForm'),rooms=el('lmPlayerRooms'),info=el('lmRouteMessage');
function client(){
 if(window.__LMRealtimeClient)return window.__LMRealtimeClient;
 if(!window.supabase?.createClient)throw Error('Supabase no disponible. Comprueba Internet.');
 return window.__LMRealtimeClient=window.supabase.createClient('https://hzlyiuhkolyhnvhhdgvk.supabase.co','sb_publishable_-sjvuy-a955SZjxi5nUOlQ_0uKLlfSe',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
const topic=sid=>'lm-reanimator-active-v3256:'+sid;
function active(){return !!directorState&&!directorState.closed&&document.body.dataset.lmEpicCreated==='yes';}
function stopHost(){if(hostInterval)clearInterval(hostInterval);hostInterval=null;if(hostLobby){hostLobby.untrack().catch(()=>{});client().removeChannel(hostLobby).catch(()=>{});hostLobby=null;}hostRoom='';}
function stopSearch(){if(playerInterval)clearInterval(playerInterval);playerInterval=null;if(playerLobby){client().removeChannel(playerLobby).catch(()=>{});playerLobby=null;}}
function show(){root.hidden=false;document.body.classList.add('lm-route-visible');el('lmRouteScenario').textContent=SCENARIOS[scenarioId]?.short||'';}
function hide(){root.hidden=true;document.body.classList.remove('lm-route-visible');stopSearch();}
function buttons(items){opts.replaceChildren();for(const x of items){const b=document.createElement('button');b.type='button';const head=document.createTextNode(x.title),sub=document.createElement('span');sub.textContent=x.description;b.append(head,sub);b.onclick=x.action;opts.append(b);}}
function view(next){
 step=next;show();opts.hidden=true;form.hidden=true;rooms.hidden=true;info.textContent='';info.classList.remove('lm-route-error');
 const title=el('lmRouteTitle'),desc=el('lmRouteDesc');
 if(next==='modes'){
  title.textContent='¿Cómo quieres jugar?';desc.textContent='Selecciona una de las dos formas de disfrutar el escenario.';
  opts.hidden=false;buttons([
   {title:'🎙 Narración del Escenario',description:'Selecciona, escucha y lee todas las narraciones del escenario.',action:launchNarration},
   {title:'🐙 Multijugador Épico',description:'Director de partida y acceso de jugadores desde sus teléfonos.',action:()=>view('epic')}
  ]);
 }else if(next==='epic'){
  title.textContent='Multijugador Épico';desc.textContent='El Director controla el evento y las mesas envían sus informes.';
  opts.hidden=false;buttons([
   {title:'🎩 Director',description:'Panel completo de dirección. Requiere PIN.',action:()=>view('pin')},
   {title:'🎴 Jugador',description:'Entra en una partida activa y selecciona tu mesa.',action:()=>view('player')}
  ]);
 }else if(next==='pin'){
  title.textContent='Acceso del Director';desc.textContent='Introduce tu PIN de ocho dígitos para acceder a todas las herramientas.';
  form.hidden=false;el('lmDirectorPin').value='';setTimeout(()=>el('lmDirectorPin').focus(),40);
 }else if(next==='player'){
  title.textContent='Entrar como Jugador';desc.textContent='Elige una partida que tenga un Director conectado y en juego.';
  rooms.hidden=false;rooms.innerHTML='<div class="lm-route-empty">Buscando partidas activas…</div>';startSearch();
 }
}
function launchNarration(){
 authorized=false;stopHost();hide();document.body.classList.add('lm-narration-only');setMode('narrator');appViewHistory.length=0;
 localStorage.setItem(BASE_STORE+'.mode','narrator');
 if(el('splashNarrate')?.checked)setTimeout(()=>startSplashOpeningNarration(scenarioId),200);
}
async function launchDirector(){
 authorized=true;document.body.dataset.lmEpicCreated='no';hide();document.body.classList.remove('lm-narration-only');setMode('director');appViewHistory.length=0;localStorage.setItem(BASE_STORE+'.mode','director');
 try{
  hostRoom=await window.LMEpicRealtime.ensureHost();
  if(!hostRoom)throw Error('No hay una sala de Director disponible.');
  hostLobby=client().channel(topic(scenarioId),{config:{presence:{key:'director-'+hostRoom}}});
  hostLobby.subscribe(status=>{if(status==='SUBSCRIBED')publish()});
  hostInterval=setInterval(publish,5000);
 }catch(e){console.error(e);toast('No se pudo anunciar el Director online. Comprueba la conexión.');}
 if(el('splashNarrate')?.checked)setTimeout(()=>startSplashOpeningNarration(scenarioId),300);
}
// Antes de crear el evento, mostrar solo la tarjeta de preparación en el Director.
// La vista del Director se controla desde el botón real de creación.
const directorGateStyle=document.createElement('style');
directorGateStyle.textContent=`
body.mode-director #modeNarratorBtn,
body.mode-director #modeDirectorBtn,
body.mode-director #modeScreenBtn,
body.mode-director #openScreenBtn,
body.mode-director #sharePublicBtn,
body.mode-director .app-quick-nav{display:none!important}
body.mode-director [data-lm-director-hidden="true"]{display:none!important}
`;
document.head.appendChild(directorGateStyle);
function syncPreparationGate(){
 const director=document.body.classList.contains('mode-director');
 const create=document.getElementById('newEventBtn');
 if(!director||!create){
  document.querySelectorAll('[data-lm-director-hidden]').forEach(n=>n.removeAttribute('data-lm-director-hidden'));
  return;
 }
 const created=document.body.dataset.lmEpicCreated==='yes';
 // Conservar el bloque más próximo al botón y todos sus antecesores.
 const prep=create.closest('.panel,section,article,.director-section,details')||create.parentElement;
 const nodes=[...document.querySelectorAll('main .panel,main section,main article,main details,main .director-section')];
 for(const node of nodes){
  if(!node.isConnected||node===prep||node.contains(prep)) {
   node.removeAttribute('data-lm-director-hidden');continue;
  }
  // La preparación se muestra sola, luego se retira para descubrir los demás paneles.
  const hide=created?prep.contains(node):true;
  if(hide)node.setAttribute('data-lm-director-hidden','true');
  else node.removeAttribute('data-lm-director-hidden');
 }
 if(created)prep.setAttribute('data-lm-director-hidden','true');
 else prep.removeAttribute('data-lm-director-hidden');
 // También ocultar contenedores hermanos de la preparación mientras no haya evento.
 if(!created){
  let branch=prep;
  while(branch&&branch.parentElement&&branch.parentElement.tagName!=='BODY'){
   const parent=branch.parentElement;
   for(const sibling of parent.children){
    if(sibling===branch||sibling.tagName==='SCRIPT'||sibling.tagName==='STYLE')continue;
    if(parent.matches('main,main *, .event-director-only')&&sibling.matches('section,.panel,article,details,.director-section'))
     sibling.setAttribute('data-lm-director-hidden','true');
   }
   if(parent.tagName==='MAIN')break;
   branch=parent;
  }
 }else{
  const main=document.querySelector('main');
  if(main)orderDirectorPanels(main);
 }
}
function orderDirectorPanels(main){
 const names=['tiempo de juego','seguimiento','recepcion de informes','reserva de dosis','estado global','hitos globales','comunicado global','resultado epico'];
 const norm=s=>(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/\\s+/g,' ').trim();
 const identified=[];
 for(const panel of main.querySelectorAll('section,.panel,article,.director-section')){
  const heading=panel.querySelector('h1,h2,h3,h4,.eyebrow,.section-title,summary');
  const index=heading?names.findIndex(n=>norm(heading.textContent).includes(n)):-1;
  if(index<0)continue;
  if(identified.some(it=>it.node.contains(panel)))continue;
  identified.push({node:panel,index});
 }
 // Reordenar únicamente elementos que comparten contenedor; preservar sus eventos.
 const groups=new Map();
 for(const item of identified){
  const parent=item.node.parentElement;
  if(!groups.has(parent))groups.set(parent,[]);
  groups.get(parent).push(item);
 }
 for(const [parent,items] of groups){
  if(items.length<2)continue;
  const sorted=[...items].sort((x,y)=>x.index-y.index);
  // Evitar movimientos DOM repetitivos.
  if(items.every((it,i)=>it.node===sorted[i].node))continue;
  const slots=items.map(it=>{const mark=document.createComment('lm-order');parent.insertBefore(mark,it.node);it.node.remove();return mark});
  sorted.forEach((item,i)=>slots[i].replaceWith(item.node));
 }
}

// Revisión del Director basada en sus controles reales, sin alterar la vista pública.
function enforceDirectorLayout(){
 const director=document.body.classList.contains('mode-director');
 if(!director)return;
 const created=document.body.dataset.lmEpicCreated==='yes';
 const create=document.getElementById('newEventBtn');
 const main=document.querySelector('main');
 if(!create||!main)return;
 // Ocultar pestañas por sus identificadores y por su etiqueta visible.
 const modes=['narrador','director épico','pantalla pública'];
 for(const element of document.querySelectorAll('button,[role="tab"]')){
  const label=(element.textContent||'').replace(/\\s+/g,' ').trim().toLocaleLowerCase('es');
  const id=element.id||'';
  if(['modeNarratorBtn','modeDirectorBtn','modeScreenBtn'].includes(id)||modes.some(m=>label===m||label.endsWith(' '+m))){
   element.style.setProperty('display','none','important');
  }
 }
 const prep=create.closest('section.panel,section,.panel,article')||create.parentElement;
 // El panel de preparación es siempre visible al entrar, y desaparece al crear.
 if(created){prep.style.setProperty('display','none','important');}
 else{prep.style.removeProperty('display');}
 const visibleNames=['tiempo de juego','seguimiento','recepción de informes','reserva de dosis','estado global','hitos globales','comunicado global','resultado épico'];
 const norm=s=>(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,' ').trim().toLowerCase();
 const candidates=[...main.querySelectorAll('section.panel,section,.panel,article')].filter(n=>n!==prep&&!n.contains(prep));
 for(const p of candidates){
  if(!created){p.style.setProperty('display','none','important');continue;}
  if(p.hasAttribute('data-lm-director-hidden'))p.removeAttribute('data-lm-director-hidden');
  if(p.style.getPropertyValue('display')==='none')p.style.removeProperty('display');
 }
 if(!created)return;
 // Forzar orden visual, incluyendo paneles que no son hermanos: orden por bloque de nivel superior.
 const ordered=[];
 for(const p of candidates){
  const h=p.querySelector('h1,h2,h3,h4,.eyebrow,.section-title,summary');
  const title=norm(h?.textContent);
  const i=visibleNames.findIndex(name=>title.includes(norm(name)));
  if(i>=0)ordered.push({p,i});
 }
 // Mostrar el temporizador original con sus controles, sin crear un reloj duplicado.
 const timer=main.querySelector('.timer-panel');
 if(timer){
  timer.removeAttribute('data-lm-director-hidden');
  timer.style.removeProperty('display');
  timer.style.setProperty('order','0','important');
  // Conservar la funcionalidad existente del botón Inicio/Pausa.
  for(const control of timer.querySelectorAll('button')){
   control.style.removeProperty('display');
  }
 }
 for(const {p,i} of ordered)p.style.setProperty('order',String(i+1),'important');
}
setInterval(enforceDirectorLayout,400);

function hideGlobalAnnouncementNarrator(){
  if(!document.body.classList.contains('mode-director'))return;
  const panel=document.querySelector('main .announcement-panel');
  if(!panel)return;
  for(const node of panel.querySelectorAll('*')){
    if(node.children.length)continue;
    if((node.textContent||'').trim()==='Narrador del comunicado global'){
      node.hidden=true;
      node.style.display='none';
    }
  }
}
setInterval(hideGlobalAnnouncementNarrator,800);
window.LMEpicSetupGate=syncPreparationGate;
setInterval(syncPreparationGate,500);
function publish(){
 if(!hostLobby||!hostRoom)return;
 if(authorized&&document.body.classList.contains('mode-director')&&active()){
  hostLobby.track({kind:'director',room:hostRoom,scenario:scenarioId,name:String(directorState.eventName||epic().eventName).slice(0,100),M:directorState.M,active:true,at:Date.now()}).catch(console.warn);
 }else hostLobby.untrack().catch(()=>{});
}
function drawGames(){
 if(step!=='player'||!playerLobby)return;
 const sessions=new Map();
 for(const items of Object.values(playerLobby.presenceState()))for(const x of items){
  if(x.kind==='director'&&x.active===true&&x.scenario===playerScenario&&typeof x.room==='string'&&x.room.startsWith('lm-')&&Date.now()-Number(x.at||0)<30000)sessions.set(x.room,x);
 }
 rooms.replaceChildren();
 if(!sessions.size){rooms.innerHTML='<div class="lm-route-empty"><strong>No hay partidas activas</strong>El Director debe estar conectado y haber pulsado Crear evento. En cuanto lo haga, la partida aparecerá aquí.</div>';return;}
 for(const game of sessions.values()){
  const card=document.createElement('div'),left=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small'),btn=document.createElement('button');
  card.className='lm-route-room';title.textContent=game.name||'Partida épica';sub.textContent=(Number(game.M)||3)+' mesas · Director conectado';left.append(title,sub);
  btn.type='button';btn.textContent='Elegir mesa →';btn.onclick=()=>{
   if(!sessions.has(game.room))return;
   const u=new URL(location.href);u.searchParams.set('mode','screen');u.searchParams.set('scenario',playerScenario);u.searchParams.set('room',game.room);u.searchParams.delete('table');location.assign(u.href);
  };
  card.append(left,btn);rooms.append(card);
 }
}
function startSearch(){
 stopSearch();playerScenario=scenarioId;
 try{
  playerLobby=client().channel(topic(playerScenario),{config:{presence:{key:'viewer-'+Math.random().toString(36).slice(2)}}});
  playerLobby.on('presence',{event:'sync'},drawGames);
  playerLobby.subscribe((status,error)=>{
   if(status==='SUBSCRIBED')drawGames();
   else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){rooms.innerHTML='<div class="lm-route-empty"><strong>No se pudo conectar</strong>Comprueba Wi-Fi o datos móviles y vuelve a intentarlo.</div>';console.warn(error);}
  });
  playerInterval=setInterval(drawGames,7000);
 }catch(e){console.error(e);rooms.textContent='No se pudo consultar el servidor de partidas.';}
}
function beginIntro(){
 if(step==='video')return;step='video';scenarioId=splashScenario;localStorage.setItem(BASE_STORE+'.scenario',scenarioId);
 if(el('scenarioSelect'))el('scenarioSelect').value=scenarioId;
 applySplashNarratorChoice();applyScenario();window.LMIntegratedBso?.prepareForLaunch?.(scenarioId);
 Promise.resolve(playSplashIntroVideo(false)).then(()=>{
  window.LMIntegratedBso?.afterIntro?.(scenarioId);hideGameMenu();view('modes');
 }).catch(e=>{console.warn(e);hideGameMenu();view('modes')});
}
form.onsubmit=e=>{
 e.preventDefault();
 if(Date.now()<lockedUntil){info.textContent='Demasiados intentos. Espera unos segundos.';info.classList.add('lm-route-error');return;}
 if(el('lmDirectorPin').value!=='15041981'){
  failures++;el('lmDirectorPin').value='';info.textContent='PIN incorrecto.';info.classList.add('lm-route-error');
  if(failures>=5){lockedUntil=Date.now()+30000;failures=0;}return;
 }
 failures=0;launchDirector();
};
const back=el('lmRouteBack');
back.onclick=()=>{
 if(step==='modes'){hide();showGameMenu();step='scenario';}
 else if(step==='epic')view('modes');
 else if(step==='pin'||step==='player'){stopSearch();view('epic');}
};
const oldMode=setMode;
setMode=function(mode){
 if(mode==='director'&&!authorized){view('pin');return;}
 document.body.classList.toggle('lm-narration-only',mode==='narrator');
 return oldMode(mode);
};
const oldMenu=showGameMenu;
showGameMenu=function(){authorized=false;stopHost();stopSearch();hide();step='scenario';try{window.LMIntegratedBso?.pause?.()}catch(e){}oldMenu();};
// Preparación antes de publicar: crear muestra la sesión a los jugadores sin iniciar el reloj.
document.getElementById('newEventBtn')?.addEventListener('click',()=>{
 setTimeout(()=>{if(!directorState?.closed){document.body.dataset.lmEpicCreated='yes';syncPreparationGate();publish();}},250);
});
document.getElementById('closeEventBtn')?.addEventListener('click',()=>{
 document.body.dataset.lmEpicCreated='no';syncPreparationGate();setTimeout(publish,200);
});
if(el('modeDirectorBtn'))el('modeDirectorBtn').onclick=()=>authorized?navigateAppMode('director'):view('pin');
if(el('modeNarratorBtn'))el('modeNarratorBtn').onclick=()=>{authorized=false;stopHost();navigateAppMode('narrator')};
if(el('splashNarratorBtn')){el('splashNarratorBtn').textContent='🎬 CONTINUAR · VER INTRODUCCIÓN';el('splashNarratorBtn').onclick=beginIntro;}
for(const id of ['splashDirectorBtn','splashScreenBtn','splashResumeBtn'])if(el(id))el(id).onclick=beginIntro;
if(el('openGameMenuBtn'))el('openGameMenuBtn').onclick=showGameMenu;
window.addEventListener('pagehide',()=>{stopHost();stopSearch();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden){e.preventDefault();back.click();}});
})();