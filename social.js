// KeepRun: contas (Google ou email) + amigos (Firebase). Usa globais do index.html.
const V='10.14.1',G='https://www.gstatic.com/firebasejs/'+V+'/';
const MY={};let state='init',db,auth,user=null,code='',friends=[],inc=[],FA=[],unsubs=[];
let GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,deleteUser,createUser,signInEmail,resetPw;
let doc,getDoc,setDoc,deleteDoc,updateDoc,collection,query,where,getDocs,onSnapshot,orderBy,limit;
const key=a=>String(a.id).replace(/[./]/g,'_');
const uname=()=>user?(user.displayName||(user.email||'Atleta').split('@')[0]):'Atleta';
const num=x=>{x=Number(x);return isFinite(x)?x:0};
const pz=()=>{try{const z=JSON.parse(ls('kr_pz','null'));return z&&isFinite(z.lat)&&isFinite(z.lon)&&z.r>0?z:null}catch(e){return null}};
const mapOK=a=>a.showMap===true||(a.showMap===undefined&&!!pz());
const zh=()=>{const z=pz();return z?Math.round(z.lat*1e4)+','+Math.round(z.lon*1e4)+','+z.r:'0'};

async function init(){
  let c;
  try{({firebaseConfig:c}=await import('./firebase-config.js'));if(!c.apiKey||c.apiKey.includes('COLE'))throw 0}catch(e){state='nocfg';renderAll();return}
  try{
    const [A,Au,F]=await Promise.all([import(G+'firebase-app.js'),import(G+'firebase-auth.js'),import(G+'firebase-firestore.js')]);
    ({GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,deleteUser}=Au);createUser=Au.createUserWithEmailAndPassword;signInEmail=Au.signInWithEmailAndPassword;resetPw=Au.sendPasswordResetEmail;
    ({doc,getDoc,setDoc,deleteDoc,updateDoc,collection,query,where,getDocs,onSnapshot,orderBy,limit}=F);
    const app=A.initializeApp(c);auth=Au.getAuth(app);db=F.getFirestore(app);state='ready';Au.onAuthStateChanged(auth,onUser);
  }catch(e){state='offline'}
  renderAll();
}
addEventListener('online',()=>{if(state==='offline')init()});
async function onUser(u){
  unsubs.forEach(f=>f());unsubs=[];friends=[];inc=[];FA=[];user=u;code='';for(const k in MY)delete MY[k];
  if(u){
    if(ls('kr_wipe_'+u.uid,'')==='1'){ss('kr_wipe_'+u.uid,'');try{await deleteUser(u);toast('Dados e conta apagados')}catch(e){await signOut(auth)}renderAll();return}
    const prev=ls('kr_uid','');if(prev&&prev!==u.uid){ss('kr_share','0');ss('kr_name',uname().split(' ')[0])}
    ss('kr_uid',u.uid);
    try{await ensureUser();listen()}catch(e){toast('Erro ao preparar a conta')}
    if(ls('kr_name','')==='')ss('kr_name',uname().split(' ')[0]);hello()}
  renderAll();KR_sync();
}
const gen=()=>{const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=new Uint32Array(6);crypto.getRandomValues(b);return Array.from(b,x=>ch[x%ch.length]).join('')};
async function ensureUser(){
  const r=doc(db,'users',user.uid),s=await getDoc(r);let c=s.exists()?String(s.data().code||''):'';
  for(let n=0;n<6;n++){
    if(!c)c=gen();
    const cr=doc(db,'codes',c);let ex=null;try{ex=await getDoc(cr)}catch(e){}
    if(ex&&ex.exists()&&ex.data().uid!==user.uid){c='';continue}
    try{await setDoc(cr,{uid:user.uid,name:uname().slice(0,60)});break}catch(e){c=''}
  }
  code=c;await setDoc(r,{name:uname().slice(0,60),photo:String(user.photoURL||'').slice(0,500),code},{merge:true});
}
function listen(){
  const me=user.uid;
  unsubs.push(onSnapshot(collection(db,'users',me,'friends'),s=>{friends=s.docs.map(d=>({id:d.id,...d.data()}));renderFriends();loadFA()}));
  unsubs.push(onSnapshot(query(collection(db,'requests'),where('to','==',me),where('status','==','pending')),s=>{inc=s.docs.map(d=>({id:d.id,...d.data()}));renderFriends();renderBell()}));
  unsubs.push(onSnapshot(query(collection(db,'requests'),where('from','==',me),where('status','==','accepted')),s=>{
    s.docs.forEach(async d=>{const r=d.data();try{const u=await getDoc(doc(db,'users',r.to));
      await setDoc(doc(db,'users',me,'friends',r.to),{name:String((u.data()||{}).name||'Amigo').slice(0,60),t:Date.now()});await deleteDoc(d.ref)}catch(e){}})}));
}
async function loadFA(){
  if(!user)return;const out=[];
  for(const f of friends){try{const s=await getDocs(query(collection(db,'activities',f.id,'items'),orderBy('date','desc'),limit(5)));
    s.docs.forEach(d=>out.push({...d.data(),fname:f.name,owner:f.id,aid:d.id}))}catch(e){}}
  FA=out.sort((a,b)=>num(b.date)-num(a.date)).slice(0,12);renderFF();
  await Promise.all(FA.map(async p=>{p.soc=await loadSoc(p.owner,p.aid)}));renderFF();loadMine();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)loadFA()});
setInterval(()=>{if(user&&!document.hidden)loadFA()},300000);

// ---- gostos e comentários partilhados (só entre amigos) ----
async function loadSoc(owner,aid){let k=[],c=[];
  try{const s=await getDocs(collection(db,'activities',owner,'items',aid,'kudos'));k=s.docs.map(d=>({uid:d.id,name:String(d.data().name||'Amigo').slice(0,60),t:num(d.data().t)}))}catch(e){}
  try{const s=await getDocs(query(collection(db,'activities',owner,'items',aid,'comments'),orderBy('t'),limit(20)));c=s.docs.map(d=>({id:d.id,uid:String(d.data().uid||''),name:String(d.data().name||'Amigo').slice(0,60),text:String(d.data().text||'').slice(0,200),t:num(d.data().t)}))}catch(e){}
  return{k,c}}
async function loadMine(){if(!user||state!=='ready')return;
  for(const a of acts.filter(x=>x.share!==false&&ls('kr_share','1')==='1').slice().sort((x,y)=>y.date-x.date).slice(0,10))MY[key(a)]=await loadSoc(user.uid,key(a));
  if(window.renderCards)renderCards();renderBell()}
window.KR_social=a=>{const m=user&&MY[key(a)];if(!m)return'';let h='';
  if(m.k.length)h+=`<div class="mu" style="margin:6px 0">👍 ${m.k.length} · ${m.k.slice(0,5).map(x=>esc(x.name)).join(', ')}${m.k.length>5?'…':''}</div>`;
  return h+m.c.map(c=>`<p style="margin:4px 0;font-size:14px"><b>${esc(c.name)}</b> ${esc(c.text)}</p>`).join('')};
window.KR_cmt=(a,text)=>{if(state!=='ready'||!user||a.share===false||ls('kr_share','1')!=='1')return false;
  setDoc(doc(collection(db,'activities',user.uid,'items',key(a),'comments')),{uid:user.uid,name:uname().slice(0,60),text:String(text).slice(0,200),t:Date.now()}).then(loadMine).catch(()=>toast('Erro ao comentar'));return true};
const mineK=p=>!!(user&&p.soc&&p.soc.k.some(x=>x.uid===user.uid));
async function toggleKudos(i){const p=FA[i];if(!p)return;const r=doc(db,'activities',p.owner,'items',p.aid,'kudos',user.uid);
  try{mineK(p)?await deleteDoc(r):await setDoc(r,{name:uname().slice(0,60),t:Date.now()});p.soc=await loadSoc(p.owner,p.aid);renderFF()}catch(e){toast('Erro')}}
async function addComment(i){const p=FA[i];if(!p)return;const t=prompt('Comentário');if(!t||!t.trim())return;
  try{await setDoc(doc(collection(db,'activities',p.owner,'items',p.aid,'comments')),{uid:user.uid,name:uname().slice(0,60),text:t.trim().slice(0,200),t:Date.now()});p.soc=await loadSoc(p.owner,p.aid);renderFF()}catch(e){toast('Erro')}}
// ---- notificações ----
function notifs(){const out=[];for(const [k,m] of Object.entries(MY)){const a=acts.find(x=>key(x)===k);if(!a)continue;
  m.k.forEach(x=>out.push({t:x.t,txt:`${x.name} deu gosto a "${a.name}"`}));m.c.forEach(c=>{if(c.uid!==user.uid)out.push({t:c.t,txt:`${c.name} comentou "${a.name}": ${c.text}`})})}
  inc.forEach(r=>out.push({t:num(r.t),txt:`${r.fromName} quer ser teu amigo`,req:true}));return out.sort((a,b)=>b.t-a.t)}
function showNotifs(l){let g=document.getElementById('nv');if(!g){g=document.createElement('div');g.id='nv';g.className='ov';document.body.appendChild(g)}g.classList.add('on');
  g.innerHTML='<div class="gh"><b>Notificações</b><button class="btn" id="nx">Fechar</button></div>'+(l.length?l.slice(0,30).map(x=>`<div class="gst"><div><div>${esc(x.txt)}</div><div class="mu">${x.t?new Date(x.t).toLocaleString('pt-PT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div></div></div>`).join(''):'<p class="mu">Sem notificações.</p>');
  g.querySelector('#nx').onclick=()=>g.classList.remove('on')}
function renderBell(){const b=document.getElementById('bell');if(!b)return;let nb=b.querySelector('.nb');const seen=+ls('kr_seen','0'),n=user?notifs().filter(x=>x.req||x.t>seen).length:0;
  if(n){if(!nb){nb=document.createElement('span');nb.className='nb';b.appendChild(nb)}nb.textContent=n>9?'9+':String(n)}else if(nb)nb.remove();
  b.onclick=()=>{if(!user)return toast('Entra com a tua conta para ver notificações');showNotifs(notifs());ss('kr_seen',String(Date.now()));renderBell()}}
// ---- sincronização (resumo + percurso simplificado, respeitando a zona de privacidade) ----
function route(p){const z=pz();let d=0;const cum=[0];for(let i=1;i<p.length;i++){d+=hav(p[i-1],p[i]);cum.push(d)}
  const T=cum[cum.length-1],q=p.filter((x,i)=>cum[i]>200&&cum[i]<T-200&&(!z||hav(x,[z.lat,z.lon])>z.r)),st=Math.max(1,Math.floor(q.length/80)),r=[];
  q.forEach((x,i)=>{if(i%st===0)r.push(+x[0].toFixed(4),+x[1].toFixed(4))});return r.slice(0,160)}
const pack=a=>({title:String(a.name).slice(0,80),type:String(a.type).slice(0,40),date:num(a.date),dist:Math.round(num(a.dist)),dur:Math.round(num(a.dur)),elev:Math.round(num(a.elev)),r:mapOK(a)&&a.pts?route(a.pts):[],eff:Math.round(num(a.eff)),desc:String(a.desc||'').slice(0,300)});
let syncT;window.KR_sync=()=>{clearTimeout(syncT);syncT=setTimeout(doSync,800)};
async function doSync(){
  if(state!=='ready'||!user)return;const sk='kr_synced_'+user.uid;let old=[];try{old=JSON.parse(ls(sk,'[]'))}catch(e){}
  const list=(ls('kr_share','1')==='1'?acts:[]).filter(a=>a.share!==false),sig=a=>key(a)+'|'+(mapOK(a)?1:0)+'|'+zh(),wS=new Set(list.map(sig)),wK=new Set(list.map(key));
  try{for(const a of list)if(!old.includes(sig(a)))await setDoc(doc(db,'activities',user.uid,'items',key(a)),pack(a));
    for(const e of old){const k=e.split('|')[0];if(!wK.has(k)){for(const sub of ['kudos','comments']){try{const s=await getDocs(collection(db,'activities',user.uid,'items',k,sub));for(const x of s.docs)await deleteDoc(x.ref)}catch(x){}}await deleteDoc(doc(db,'activities',user.uid,'items',k))}}
    ss(sk,JSON.stringify([...wS]))}catch(e){toast('Erro ao sincronizar')}
}
// ---- ações ----
const errMsg=e=>({'auth/invalid-credential':'Email ou palavra-passe errados','auth/email-already-in-use':'Esse email já tem conta','auth/weak-password':'Palavra-passe fraca (mínimo 6)','auth/invalid-email':'Email inválido','auth/operation-not-allowed':'Este método de entrada não está ativo no Firebase'}[e.code]||('Falha: '+(e.code||'erro')));
async function login(){const p=new GoogleAuthProvider();try{await signInWithPopup(auth,p)}catch(e){
  if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'){try{await signInWithRedirect(auth,p)}catch(x){toast(errMsg(x))}}
  else if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')toast(errMsg(e))}}
async function emailAuth(mode){const e=($('#em-e').value||'').trim(),p=$('#em-p').value||'';if(!e)return toast('Escreve o email');
  try{if(mode==='reset'){await resetPw(auth,e);return toast('Enviámos um email para recuperar a palavra-passe')}
    if(!p)return toast('Escreve a palavra-passe');mode==='new'?await createUser(auth,e,p):await signInEmail(auth,e,p)}catch(x){toast(errMsg(x))}}
async function addFriend(c){c=c.trim().toUpperCase();if(c.length<4)return toast('Código inválido');if(c===code)return toast('Esse é o teu código');
  try{const t=await getDoc(doc(db,'codes',c));if(!t.exists())return toast('Código não encontrado');const to=t.data().uid;
    if(friends.some(f=>f.id===to))return toast('Já são amigos');
    await setDoc(doc(db,'requests',to+'_'+user.uid),{from:user.uid,fromName:uname().slice(0,60),to,status:'pending',t:Date.now()});toast('Pedido enviado')}
  catch(e){toast('Erro ao adicionar')}}
async function accept(i){const r=inc[i];if(!r)return;
  try{await setDoc(doc(db,'users',user.uid,'friends',r.from),{name:String(r.fromName||'Amigo').slice(0,60),t:Date.now()});await updateDoc(doc(db,'requests',r.id),{status:'accepted'})}catch(e){toast('Erro')}}
const decline=i=>{const r=inc[i];if(r)deleteDoc(doc(db,'requests',r.id)).catch(()=>toast('Erro'))};
async function removeF(i){const f=friends[i];if(!f||!confirm('Remover amigo?'))return;try{await deleteDoc(doc(db,'users',user.uid,'friends',f.id));await deleteDoc(doc(db,'users',f.id,'friends',user.uid));await deleteDoc(doc(db,'requests',user.uid+'_'+f.id)).catch(()=>{});await deleteDoc(doc(db,'requests',f.id+'_'+user.uid)).catch(()=>{})}catch(e){}}
async function wipe(){
  if(!confirm('Apagar todos os teus dados na nuvem (atividades partilhadas, amigos, pedidos, código e conta)? As atividades guardadas neste dispositivo mantêm-se.'))return;
  try{const me=user.uid;ss('kr_share','0');
    for(const f of friends){try{const its=await getDocs(query(collection(db,'activities',f.id,'items'),limit(200)));for(const d of its.docs){await deleteDoc(doc(db,'activities',f.id,'items',d.id,'kudos',me)).catch(()=>{});const cs=await getDocs(query(collection(db,'activities',f.id,'items',d.id,'comments'),where('uid','==',me)));for(const c of cs.docs)await deleteDoc(c.ref).catch(()=>{})}}catch(e){}}
    const it=await getDocs(collection(db,'activities',me,'items'));for(const d of it.docs){for(const sub of ['kudos','comments']){const ss2=await getDocs(collection(db,'activities',me,'items',d.id,sub));for(const x of ss2.docs)await deleteDoc(x.ref)}await deleteDoc(d.ref)}
    for(const f of friends){await deleteDoc(doc(db,'users',me,'friends',f.id)).catch(()=>{});await deleteDoc(doc(db,'users',f.id,'friends',me)).catch(()=>{})}
    for(const k of ['from','to']){const rs=await getDocs(query(collection(db,'requests'),where(k,'==',me)));for(const d of rs.docs)await deleteDoc(d.ref)}
    if(code)await deleteDoc(doc(db,'codes',code)).catch(()=>{});
    await deleteDoc(doc(db,'users',me)).catch(()=>{});ss('kr_synced_'+me,'[]');
    try{await deleteUser(user);toast('Dados e conta apagados')}catch(e){ss('kr_wipe_'+me,'1');await signOut(auth);toast('Dados apagados. Entra de novo para concluir a eliminação da conta.')}
  }catch(e){toast('Erro ao apagar')}}
// ---- interface ----
const sub=m=>'<div class="card"><b>Conta</b><p class="mu">'+m+'</p></div>';
function renderZone(){const z=pz();
  return `<div class="card"><b>Zona de privacidade</b><p class="mu">Esconde dos amigos o percurso perto de um local, por exemplo a tua casa. ${z?`Ativa, com raio de ${z.r} m.`:'Ainda não definida: os percursos só são partilhados se escolheres mostrá-los em cada atividade.'} Não é uma garantia absoluta: percursos que começam e acabam sempre no mesmo sítio podem indicar a zona.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><select id="pz-r" aria-label="Raio">${[200,400,800,1500].map(r=>`<option value="${r}" ${z&&z.r===r?'selected':''}>${r} m</option>`).join('')}</select><button class="btn" id="pz-set">Usar a minha localização atual</button>${z?'<button class="btn" id="pz-clear">Remover</button>':''}</div></div>`}
function bindZone(el){const s=el.querySelector('#pz-set');if(!s)return;
  s.onclick=()=>{if(!navigator.geolocation)return toast('Sem GPS');navigator.geolocation.getCurrentPosition(p=>{const b=new Uint32Array(2);crypto.getRandomValues(b);const ang=(b[0]/4294967296)*2*Math.PI,rad=30+(b[1]/4294967296)*50,dLat=(rad*Math.cos(ang))/111320,dLon=(rad*Math.sin(ang))/(111320*Math.max(0.1,Math.cos(p.coords.latitude*Math.PI/180)));ss('kr_pz',JSON.stringify({lat:+(p.coords.latitude+dLat).toFixed(5),lon:+(p.coords.longitude+dLon).toFixed(5),r:+el.querySelector('#pz-r').value}));toast('Zona definida');KR_sync();renderAcct()},()=>toast('Não consegui obter a localização'))};
  el.querySelector('#pz-r').onchange=e=>{const z=pz();if(z){z.r=+e.target.value;ss('kr_pz',JSON.stringify(z));KR_sync();renderAcct()}};
  const c=el.querySelector('#pz-clear');if(c)c.onclick=()=>{ss('kr_pz','null');KR_sync();renderAcct()}}
function renderAcct(){const el=$('#acct');if(!el)return;let h='';
  if(state==='nocfg')h=sub('Para entrar e ter amigos, configura o Firebase (ver SETUP.md).');
  else if(state==='offline')h=sub('Sem ligação: o login e os amigos precisam de internet. Tenta de novo quando estiveres online.');
  else if(state==='init')h=sub('A carregar…');
  else if(!user)h=`<div class="card"><b>Conta</b><p class="mu">Entra para sincronizar e adicionar amigos. Ao entrares, aceitas a <a id="pv2" style="color:var(--ac);cursor:pointer">política de privacidade</a>.</p><button class="btn pri" id="gl">Entrar com Google</button> <button class="btn" id="em-t">Entrar com email</button>
    <div id="em" class="hide"><input id="em-e" type="email" placeholder="Email" style="width:100%;margin-top:10px"><input id="em-p" type="password" placeholder="Palavra-passe (mín. 6)" style="width:100%;margin-top:8px"><p><button class="btn pri" id="em-in">Entrar</button> <button class="btn" id="em-new">Criar conta</button> <button class="btn" id="em-rs">Recuperar palavra-passe</button></p></div></div>`;
  else{const sh=ls('kr_share','1')==='1';
    h=`<div class="card"><b>${esc(uname())}</b><div class="mu">${esc(user.email||'')}</div><p class="mu">Código de amigo: <b style="color:var(--tx)">${esc(code||'—')}</b></p>
    <label><input type="checkbox" id="sh" ${sh?'checked':''}> Partilhar atividades com amigos</label><p><button class="btn" id="so">Terminar sessão</button> <button class="btn" id="wp-del">Apagar os meus dados na nuvem</button></p></div>`}
  el.innerHTML=h+renderZone();
  const q=x=>el.querySelector(x);
  if(q('#pv2'))q('#pv2').onclick=()=>window.KR_policy&&KR_policy();
  if(q('#gl')){q('#gl').onclick=login;q('#em-t').onclick=()=>q('#em').classList.toggle('hide');q('#em-in').onclick=()=>emailAuth('in');q('#em-new').onclick=()=>emailAuth('new');q('#em-rs').onclick=()=>emailAuth('reset')}
  if(q('#so')){q('#so').onclick=()=>signOut(auth);q('#sh').onchange=e=>{ss('kr_share',e.target.checked?'1':'0');KR_sync()};q('#wp-del').onclick=wipe}
  bindZone(el)}
function renderFriends(){const el=$('#friends');if(!el)return;
  if(state!=='ready'||!user){el.innerHTML=state==='nocfg'?'<div class="card"><b>Amigos</b><p class="mu">Configura o Firebase (ver SETUP.md) para ativar contas e amigos.</p></div>':state==='offline'?'<div class="card"><b>Amigos</b><p class="mu">Sem ligação: os amigos precisam de internet.</p></div>':state==='ready'?'<div class="card"><b>Amigos</b><p class="mu">Entra com a tua conta (separador Eu) para adicionar amigos e ver as suas atividades.</p></div>':'';return}
  el.innerHTML=`<div class="card"><b>Adicionar amigo</b><p class="mu">O teu código: <b style="color:var(--tx)">${esc(code||'—')}</b> <button class="btn" id="cc">Copiar</button></p>
  <div style="display:flex;gap:8px"><input id="fc" placeholder="Código do amigo" maxlength="6" style="flex:1;text-transform:uppercase"><button class="btn pri" id="fa">Adicionar</button></div></div>
  ${inc.length?`<div class="card"><b>Pedidos</b>${inc.map((r,i)=>`<div class="fr"><span>${esc(r.fromName)}</span><span><button class="btn pri" data-a="${i}">Aceitar</button> <button class="btn" data-d="${i}">Recusar</button></span></div>`).join('')}</div>`:''}
  <div class="card"><b>Amigos (${friends.length})</b>${friends.length?friends.map((f,i)=>`<div class="fr"><span>${esc(f.name)}</span><button class="btn" data-r="${i}">Remover</button></div>`).join(''):'<p class="mu">Ainda sem amigos.</p>'}</div>`;
  $('#cc').onclick=()=>{try{navigator.clipboard.writeText(code)}catch(e){}toast('Código copiado')};
  $('#fa').onclick=()=>{addFriend($('#fc').value);$('#fc').value=''};
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>accept(+b.dataset.a));
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>decline(+b.dataset.d));
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>removeF(+b.dataset.r))}
function fpost(a,i){const pts=[],r=Array.isArray(a.r)?a.r:[];for(let i=0;i+1<r.length;i+=2){const la=Number(r[i]),lo=Number(r[i+1]);if(isFinite(la)&&isFinite(lo))pts.push([la,lo])}
  const d=num(a.dist),el=Math.round(num(a.elev)),du=num(a.dur),ef=Math.min(10,Math.max(0,Math.round(num(a.eff)))),nm=esc(a.fname||'Amigo'),k=(a.soc&&a.soc.k)||[],cm=(a.soc&&a.soc.c)||[];
  return `<div class="post"><div class="ph"><span class="av">${esc(String(a.fname||'?')[0].toUpperCase())}</span><div class="pm"><b>${nm}</b><div class="mu">${fDT(num(a.date))}</div><div class="mu">${window.ic?ic(String(a.type||'')):'🏃'} ${esc(a.type||'')}</div></div></div>
  <h2 style="cursor:default">${esc(a.title||'')}</h2>${ef?`<div class="mu" style="margin:-6px 0 10px">💪 Esforço ${ef}/10</div>`:''}${a.desc?`<p style="margin:0 0 10px">${esc(a.desc)}</p>`:''}
  <div class="ps"><div><span>Distância</span><b>${d?(d/1000).toFixed(2)+' km':'—'}</b></div><div><span>Subida</span><b>${el} m</b></div><div><span>Tempo</span><b>${fTL(du)}</b></div></div>
  ${pts.length>1?`<div class="mapbox" style="cursor:default">${thumb(pts)}</div>`:''}
  <div class="kd">${k.length?'👍 '+k.length+' · '+k.slice(0,4).map(x=>esc(x.name)).join(', '):'Sê o primeiro a dar gosto!'}</div>${cm.map(c=>`<p style="margin:4px 0;font-size:14px"><b>${esc(c.name)}</b> ${esc(c.text)}</p>`).join('')}
  <div class="ac"><button class="fk ${mineK(a)?'on':''}" data-i="${i}" aria-label="Dar gosto">${(window.KR_IC||{}).thumb||''}</button><button class="fc" data-i="${i}" aria-label="Comentar">${(window.KR_IC||{}).chat||''}</button></div></div>`}
function renderFF(){const el=$('#ff');if(!el)return;el.innerHTML=FA.length?'<h3 style="margin:8px 4px">Amigos</h3>'+FA.map((a,i)=>fpost(a,i)).join(''):'';
  el.querySelectorAll('.fk').forEach(b=>b.onclick=()=>toggleKudos(+b.dataset.i));el.querySelectorAll('.fc').forEach(b=>b.onclick=()=>addComment(+b.dataset.i))}
function renderAll(){renderAcct();renderFriends();renderFF();renderBell()}
window.KR_fa=()=>FA;window.KR_acct=renderAcct;window.KR_friends=renderFriends;window.KR_ff=renderFF;
init();
