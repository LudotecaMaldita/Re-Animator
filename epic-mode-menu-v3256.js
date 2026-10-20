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
function syncPreparationGate(){
 const main=document.querySelector('main');
 const create=document.getElementById('newEventBtn');
 if(!main||!create)return;
 const director=document.body.classList.contains('mode-director');
 const waiting=director&&document.body.dataset.lmEpicCreated!=='yes';
 const preparation=create.closest('section,.panel,article,details,.director-section')||create.parentElement;
 // No intervenir en la pantalla general, narración ni jugadores.
 if(!director){
  for(const element of document.querySelectorAll('[data-lm-gate-hidden]')){
   element.style.removeProperty('display');
   element.removeAttribute('data-lm-gate-hidden');
  }
  return;
 }
 // No ocultar el contenedor principal: contiene todos los paneles del Director.
 const sections=[...main.querySelectorAll('section,.panel,article,details,.director-section')]
  .filter(node=>!node.querySelector('section,.panel,article,details,.director-section'));
 const candidates=[...new Set([preparation,...sections])].filter(Boolean);
 for(const node of candidates){
  if(node===main||node.contains(preparation)&&node!==preparation)continue;
  const hide=waiting?node!==preparation:node===preparation;
  if(hide){
   node.style.setProperty('display','none','important');
   node.setAttribute('data-lm-gate-hidden','');
  }else if(node.hasAttribute('data-lm-gate-hidden')){
   node.style.removeProperty('display');
   node.removeAttribute('data-lm-gate-hidden');
  }
 }
 if(!waiting)orderDirectorPanels(main);
}
function orderDirectorPanels(main){
 const names=[
  'tiempo de juego','seguimiento','recepción de informes','reserva de dosis',
  'estado global','hitos globales','comunicado global','resultado épico'
 ];
 const normalize=s=>(s||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,' ').trim();
 const indexOf=s=>names.findIndex(name=>normalize(s).includes(normalize(name)));
 // Buscar bloques de contenido, no sus títulos aislados ni la cuadrícula exterior.
 const nodes=[...main.querySelectorAll('section,.panel,article,details,.director-section')];
 const identified=[];
 for(const node of nodes){
  const heading=node.querySelector('h1,h2,h3,h4,.eyebrow,summary,.section-title');
  if(!heading)continue;
  const index=indexOf(heading.textContent);
  if(index<0)continue;
  if(nodes.some(inner=>inner!==node&&node.contains(inner)&&indexOf(inner.querySelector('h1,h2,h3,h4,.eyebrow,summary,.section-title')?.textContent)===index))continue;
  identified.push({node,index});
 }
 // Mover solamente bloques hermanos; nunca deshacer la estructura de otro panel.
 const parents=new Map();
 for(const item of identified){
  const parent=item.node.parentElement;
  if(!parents.has(parent))parents.set(parent,[]);
  parents.get(parent).push(item);
 }
 for(const [parent,items] of parents){
  if(items.length<2)continue;
  const sorted=[...items].sort((a,b)=>a.index-b.index);
  const anchors=items.map(x=>x.node);
  const end=anchors[anchors.length-1].nextSibling;
  for(const item of sorted)parent.insertBefore(item.node,end);
 }
}
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