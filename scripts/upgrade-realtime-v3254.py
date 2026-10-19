from pathlib import Path
import re, subprocess, tempfile

p = Path("index.html")
c = p.read_text(encoding="utf-8")

old = '<script src="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js"></script>'
new = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js"></script>\n<script src="epic-supabase-transport.js?v=3.2.54"></script>'
if old in c:
    c = c.replace(old, new, 1)
elif '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>' in c:
    c = c.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script src="./epic-supabase-transport.js"></script>',new,1)
elif new not in c:
    raise SystemExit("ERROR: referencia a librería Supabase ausente")

start = '/* ===== DIRECTO ÉPICO ONLINE · Mesas P2P + QR v3.2.50 ====='
if start in c:
    a = c.index(start)
    b = c.index('*/', a) + 2
    c = c[:a] + '''/* ===== DIRECTOR ÉPICO ONLINE · Supabase Realtime + QR v3.2.54 =====
   Supabase transporta los mensajes entre todas las redes mediante WebSockets.
   Hitos, Crisis, Dosis y resultados los calcula el Director de forma canónica. */''' + c[b:]

before = 'setPlayerConnection("Conectada al Director",true);send(conn,{type:"request_state"})'
after = 'setPlayerConnection("Conectada al Director",true);if(publicAssignedTable)send(conn,{type:"claim_table",tableId:publicAssignedTable});send(conn,{type:"request_state"})'
if before in c:
    c = c.replace(before, after, 1)
elif after not in c and 'send(conn,{type:"request_state"});if(publicAssignedTable)send(conn,{type:"claim_table",tableId:publicAssignedTable})' not in c:
    raise SystemExit("ERROR: no se encuentra el callback de reconexión")

c = c.replace('PeerJS client', 'Supabase Realtime client')
c = c.replace('PeerJS host', 'Supabase Realtime host')
c = c.replace('No se pudo cargar la conexión online. Revisa Internet y recarga.', 'No se pudo cargar Supabase Realtime. Comprueba Internet o la red y recarga.')
c = c.replace('status("No se pudo conectar con el Director. Comprueba que su pantalla siga abierta.","error");', 'status(String(e?.message||"No se pudo conectar con el Director."),"error");')
c = c.replace('const APP_VERSION="3.2.53";','const APP_VERSION="3.2.54";',1)
c = c.replace('<span>v3.2.53 · Fanmade · Ludoteca Maldita</span>','<span>v3.2.54 · Fanmade · Ludoteca Maldita</span>',1)
c = c.replace('Aplicación v3.2.53<br>','Aplicación v3.2.54<br>',1)

assert 'peerjs.min.js' not in c
assert new in c
assert 'const APP_VERSION="3.2.54";' in c
assert 'body.mode-screen:not(.table-client) .event-director-only>.tables-panel' in c
assert 'Los Hitos y las Crisis se aplican globalmente a todas las mesas.' in c
assert Path("epic-supabase-transport.js").exists()
p.write_text(c,encoding="utf-8")
for i,script in enumerate(re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',c,re.S|re.I)):
    if not script.strip():continue
    f=Path(tempfile.gettempdir())/f"lm-v3254-inline-{i}.js"
    f.write_text(script,encoding="utf-8")
    subprocess.run(["node","--check",str(f)],check=True)
subprocess.run(["node","--check","epic-supabase-transport.js"],check=True)
print("OK v3.2.54: Supabase Realtime, JS valid, rules and screen preserved")
