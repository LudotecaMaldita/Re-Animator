/* Ludoteca Maldita · Transporte Supabase Realtime · v3.2.54 */
(function(){
  'use strict';
  const PROJECT_URL='https://hzlyiuhkolyhnvhhdgvk.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_-sjvuy-a955SZjxi5nUOlQ_0uKLlfSe';
  const sdk=window.supabase;
  const singleton=()=>{
    if(!sdk?.createClient)throw new Error('No se cargó Supabase. Comprueba tu conexión a Internet.');
    if(!window.__LMRealtimeClient){
      window.__LMRealtimeClient=sdk.createClient(PROJECT_URL,PUBLISHABLE_KEY,{
        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
        realtime:{params:{eventsPerSecond:15}}
      });
    }
    return window.__LMRealtimeClient;
  };
  const ident=()=>{
    if(globalThis.crypto?.randomUUID)return 'lm-'+crypto.randomUUID().replace(/-/g,'');
    const arr=new Uint8Array(24);crypto.getRandomValues(arr);return 'lm-'+[...arr].map(n=>n.toString(16).padStart(2,'0')).join('');
  };
  class Emitter{
    constructor(){this.events=new Map()}
    on(key,fn){if(!this.events.has(key))this.events.set(key,new Set());this.events.get(key).add(fn);return this}
    emit(key,...args){for(const fn of this.events.get(key)||[])try{fn(...args)}catch(err){console.error('Realtime callback',err)}}
  }
  class RealtimeConn extends Emitter{
    constructor(owner,remote){super();this.owner=owner;this.peer=remote;this.open=false;this.closed=false}
    send(data){if(!this.open)return;this.owner.deliver({type:'data',to:this.peer,data})}
    close(remoteNotify=true){if(this.closed)return;this.closed=true;this.open=false;
      if(remoteNotify)this.owner.deliver({type:'bye',to:this.peer});this.owner.conns.delete(this.peer);this.emit('close')}
    fail(msg){this.emit('error',new Error(msg))}
  }
  class RealtimePeer extends Emitter{
    constructor(){
      super();this.id=ident();this.destroyed=false;this.disconnected=false;
      this.role=new URLSearchParams(location.search).get('mode')==='screen'?'client':'host';
      this.client=null;this.channel=null;this.room='';this.conns=new Map();this.pending=null;
      this.pingAt=0;this.timer=null;this.lastStatus='';this.online=false;
      try{this.client=singleton()}catch(e){setTimeout(()=>this.emit('error',e),0);return}
      if(this.role==='host')this.join(this.id);
      else setTimeout(()=>{if(!this.destroyed)this.emit('open',this.id)},0);
      window.addEventListener('pagehide',()=>this.destroy(),{once:true});
    }
    join(room){
      if(this.destroyed)return;
      this.room=room;
      const channel=this.client.channel('lm-epic-v3254:'+room,{
        config:{broadcast:{self:false,ack:true},presence:{key:this.id}}
      });
      this.channel=channel;
      channel.on('broadcast',{event:'wire'},packet=>this.receive(packet.payload));
      channel.on('presence',{event:'sync'},()=>this.syncPresence());
      channel.subscribe(async(status,error)=>{
        if(this.destroyed)return;
        if(status==='SUBSCRIBED'){
          this.online=true;this.disconnected=false;
          try{await channel.track({role:this.role,clientId:this.id,time:Date.now()})}catch(e){console.warn('Presence',e)}
          if(this.role==='host'){
            if(!this.lastStatus)this.emit('open',this.id);
            this.timer??=setInterval(()=>this.deliver({type:'ping'}),9000);
          }else{
            this.pingAt=Date.now();this.deliver({type:'hello',to:room});this.startClientWatch();
          }
          this.lastStatus='SUBSCRIBED';
        }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
          this.online=false;this.disconnected=true;
          if(this.role==='client')for(const conn of this.conns.values()){
            if(conn.open){conn.open=false;conn.emit('close')}
          }
          this.emit('disconnected');
          if(error)this.emit('error',new Error(error.message||String(error)));
        }
      });
    }
    deliver(payload){
      if(!this.channel||!this.online||this.destroyed)return Promise.resolve('offline');
      return this.channel.send({type:'broadcast',event:'wire',payload:{...payload,from:this.id}})
        .catch(e=>{console.warn('Realtime send',e);this.emit('error',e);return 'error'});
    }
    receive(packet){
      if(!packet||typeof packet!=='object'||packet.from===this.id)return;
      if(packet.to&&packet.to!==this.id)return;
      if(this.role==='host'){
        if(packet.type==='hello'){
          let conn=this.conns.get(packet.from);
          if(!conn||conn.closed){conn=new RealtimeConn(this,packet.from);this.conns.set(packet.from,conn);this.emit('connection',conn)}
          conn.open=true;
          queueMicrotask(()=>{if(!conn.closed)conn.emit('open')});
          this.deliver({type:'accept',to:packet.from});
          return;
        }
        if(packet.type==='data'){const conn=this.conns.get(packet.from);if(conn?.open)conn.emit('data',packet.data)}
        if(packet.type==='bye')this.conns.get(packet.from)?.close(false);
        return;
      }
      if(packet.from!==this.room)return;
      if(packet.type==='ping'){this.pingAt=Date.now();return}
      const conn=this.conns.get(this.room);
      if(!conn)return;
      if(packet.type==='accept'){
        this.pingAt=Date.now();if(!conn.open){conn.open=true;conn.emit('open')}
        return;
      }
      if(packet.type==='data'&&conn.open){this.pingAt=Date.now();conn.emit('data',packet.data)}
      if(packet.type==='bye')conn.close(false);
    }
    connect(room){
      if(this.role!=='client')throw new Error('Solo un cliente puede iniciar una conexión');
      const conn=new RealtimeConn(this,room);this.conns.set(room,conn);this.join(room);
      const started=Date.now();this.timer=setInterval(()=>{
        if(this.destroyed||conn.closed)return;
        if(!conn.open&&Date.now()-started>17000){
          this.emit('error',new Error('No responde el Director. Genera un enlace nuevo desde la partida activa.'));
          conn.fail('Director no disponible');clearInterval(this.timer);this.timer=null;
        }
      },1500);
      return conn;
    }
    startClientWatch(){
      if(this.role!=='client'||this.pending)return;
      this.pending=setInterval(()=>{
        if(this.destroyed)return;
        const conn=this.conns.get(this.room);if(!conn)return;
        if(this.online&&Date.now()-this.pingAt>31000){
          if(conn.open){conn.open=false;conn.emit('close')}
          this.emit('error',new Error('El Director no responde. Reconectando…'));
          this.pingAt=Date.now();this.deliver({type:'hello',to:this.room});
        }
      },5000);
    }
    syncPresence(){
      if(this.role!=='host'||!this.online)return;
      const present=new Set(Object.keys(this.channel.presenceState()));
      for(const conn of this.conns.values()){
        if(conn.open&&!present.has(conn.peer)){
          setTimeout(()=>{
            if(this.destroyed||!conn.open)return;
            const current=new Set(Object.keys(this.channel.presenceState()));
            if(!current.has(conn.peer))conn.close(false);
          },3500);
        }
      }
    }
    reconnect(){if(this.destroyed||!this.channel)return;
      try{this.client.realtime.connect()}catch(e){this.emit('error',e)}
    }
    destroy(){
      if(this.destroyed)return;
      this.deliver({type:'bye'});
      this.destroyed=true;this.online=false;
      if(this.timer)clearInterval(this.timer);if(this.pending)clearInterval(this.pending);
      for(const conn of [...this.conns.values()])conn.close(false);
      try{this.client?.removeChannel(this.channel)}catch(e){}
    }
  }
  window.Peer=RealtimePeer;
  window.LMSupabaseTransportVersion='3.2.54';
})();
