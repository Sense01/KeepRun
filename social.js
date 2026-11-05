// KeepRun: login Google + amigos (Firebase). Usa globais do index.html.
const V='10.14.1',G='https://www.gstatic.com/firebasejs/'+V+'/';
let ready=false,db,auth,user=null,code='',friends=[],inc=[],FA=[],unsubs=[];
let GoogleAuthProvider,signInWithPopup,signOut,doc,getDoc,setDoc,deleteDoc,updateDoc,collection,query,where,getDocs,onSnapshot,orderBy,limit;
const key=a=>String(a.id).replace(/[./]/g,'_');
async function init(){
  try{
    const {firebaseConfig:c}=await import('./firebase-config.js');
    if(!c.apiKey||c.apiKey.includes('COLE'))throw 0;
    const [A,Au,F]=await Promise.all([import(G+'firebase-app.js'),import(G+'firebase-auth.js'),import(G+'firebase-firestore.js')]);
    ({GoogleAuthProvider,signInWithPopup,signOut}=Au);
    ({doc,getDoc,setDoc,deleteDoc,updateDoc,collection,query,where,getDocs,onSnapshot,orderBy,limit}=F);
    const app=A.initializeApp(c);auth=Au.getAuth(app);db=F.getFirestore(app);ready=true;
    Au.onAuthStateChanged(auth,onUser);
  }catch(e){ready=false}
  renderAll();
}
async function onUser(u){
  unsubs.forEach(f=>f());unsubs=[];friends=[];inc=[];FA=[];user=u;code='';
  if(u){await ensureUser();listen();
    if(ls('kr_name','')==='')ss('kr_name',(u.displayName||'Atleta').split(' ')[0]);hello()}
  renderAll();KR_sync();
}
async function ensureUser(){
  const r=doc(db,'users',user.uid),s=await getDoc(r);
  if(s.exists()&&s.data().code){code=s.data().code}
  else{const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';code=Array.from({length:6},()=>ch[Math.floor(Math.random()*ch.length)]).join('')}
  await setDoc(r,{name:user.displayName||'Atleta',photo:user.photoURL||'',code},{merge:true});
}
function listen(){
  const me=user.uid;
  unsubs.push(onSnapshot(collection(db,'users',me,'friends'),s=>{friends=s.docs.map(d=>({id:d.id,...d.data()}));renderFriends();loadFA()}));
  unsubs.push(onSnapshot(query(collection(db,'requests'),where('to','==',me),where('status','==','pending')),s=>{inc=s.docs.map(d=>({id:d.id,...d.data()}));renderFriends()}));
  unsubs.push(onSnapshot(query(collection(db,'requests'),where('from','==',me),where('status','==','accepted')),s=>{
    s.docs.forEach(async d=>{const r=d.data();try{const u=await getDoc(doc(db,'users',r.to));
      await setDoc(doc(db,'users',me,'friends',r.to),{name:(u.data()||{}).name||'Amigo',t:Date.now()});await deleteDoc(d.ref)}catch(e){}})}));
}
async function loadFA(){
  const out=[];
  for(const f of friends){try{const s=await getDocs(query(collection(db,'activities',f.id,'items'),orderBy('date','desc'),limit(5)));
    s.docs.forEach(d=>out.push({...d.data(),fname:f.name}))}catch(e){}}
  FA=out.sort((a,b)=>b.date-a.date).slice(0,20);renderFF();
}
// ---- sincronização das minhas atividades (resumo + percurso simplificado) ----
function route(p){let d=0;const cum=[0];for(let i=1;i<p.length;i++){d+=hav(p[i-1],p[i]);cum.push(d)}
  const T=cum[cum.length-1],q=p.filter((_,i)=>cum[i]>200&&cum[i]<T-200),st=Math.max(1,Math.floor(q.length/80)),r=[];
  q.forEach((x,i)=>{if(i%st===0)r.push(+x[0].toFixed(5),+x[1].toFixed(5))});return r}
const pack=a=>({title:a.name,type:a.type,date:a.date,dist:Math.round(a.dist),dur:Math.round(a.dur),elev:Math.round(a.elev),r:route(a.pts)});
let syncT;window.KR_sync=()=>{clearTimeout(syncT);syncT=setTimeout(doSync,800)};
async function doSync(){
  if(!user||!ready)return;const sk='kr_synced_'+user.uid;let old=[];try{old=JSON.parse(ls(sk,'[]'))}catch(e){}
  const want=ls('kr_share','1')==='1'?acts:[],ids=new Map(want.map(a=>[key(a),a]));
  try{for(const [k,a] of ids)if(!old.includes(k))await setDoc(doc(db,'activities',user.uid,'items',k),pack(a));
    for(const k of old)if(!ids.has(k))await deleteDoc(doc(db,'activities',user.uid,'items',k));
    ss(sk,JSON.stringify([...ids.keys()]))}catch(e){toast('Erro ao sincronizar')}
}
// ---- ações ----
async function login(){try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){if(e.code!=='auth/popup-closed-by-user')toast('Falha no login: '+(e.code||'erro'))}}
async function addFriend(c){c=c.trim().toUpperCase();if(c.length<4)return toast('Código inválido');if(c===code)return toast('Esse é o teu código');
  try{const r=await getDocs(query(collection(db,'users'),where('code','==',c)));if(r.empty)return toast('Código não encontrado');
    const t=r.docs[0];if(friends.some(f=>f.id===t.id))return toast('Já são amigos');
    await setDoc(doc(db,'requests',t.id+'_'+user.uid),{from:user.uid,fromName:user.displayName||'Atleta',to:t.id,status:'pending',t:Date.now()});toast('Pedido enviado')}
  catch(e){toast('Erro ao adicionar')}}
async function accept(id){const r=inc.find(x=>x.id===id);if(!r)return;
  try{await setDoc(doc(db,'users',user.uid,'friends',r.from),{name:r.fromName,t:Date.now()});await updateDoc(doc(db,'requests',id),{status:'accepted'})}catch(e){toast('Erro')}}
const decline=id=>deleteDoc(doc(db,'requests',id)).catch(()=>toast('Erro'));
async function removeF(id){if(!confirm('Remover amigo?'))return;try{await deleteDoc(doc(db,'users',user.uid,'friends',id));await deleteDoc(doc(db,'users',id,'friends',user.uid))}catch(e){}}
// ---- interface ----
function renderAcct(){const el=$('#acct');if(!el)return;
  if(!ready){el.innerHTML='<div class="card"><b>Conta</b><p class="mu">Para entrar com Google e ter amigos, configura o Firebase (ver SETUP.md).</p></div>';return}
  if(!user){el.innerHTML='<div class="card"><b>Conta</b><p class="mu">Entra para sincronizar e adicionar amigos.</p><button class="btn pri" id="gl">Entrar com Google</button></div>';$('#gl').onclick=login;return}
  const sh=ls('kr_share','1')==='1';
  el.innerHTML=`<div class="card"><b>${esc(user.displayName||'Conta')}</b><div class="mu">${esc(user.email||'')}</div><p class="mu">Código de amigo: <b style="color:var(--tx)">${code}</b></p>
  <label><input type="checkbox" id="sh" ${sh?'checked':''}> Partilhar atividades com amigos</label><p><button class="btn" id="so">Terminar sessão</button></p></div>`;
  $('#so').onclick=()=>signOut(auth);$('#sh').onchange=e=>{ss('kr_share',e.target.checked?'1':'0');KR_sync()}}
function renderFriends(){const el=$('#friends');if(!el)return;
  if(!ready){el.innerHTML='<div class="card"><b>Amigos</b><p class="mu">Configura o Firebase (ver SETUP.md) para ativar contas e amigos.</p></div>';return}
  if(!user){el.innerHTML='<div class="card"><b>Amigos</b><p class="mu">Entra com a tua conta Google para adicionar amigos e ver as suas atividades.</p><button class="btn pri" id="gl2">Entrar com Google</button></div>';$('#gl2').onclick=login;return}
  el.innerHTML=`<div class="card"><b>Adicionar amigo</b><p class="mu">O teu código: <b style="color:var(--tx)">${code}</b> <button class="btn" id="cc">Copiar</button></p>
  <div style="display:flex;gap:8px"><input id="fc" placeholder="Código do amigo" maxlength="6" style="flex:1;text-transform:uppercase"><button class="btn pri" id="fa">Adicionar</button></div></div>
  ${inc.length?`<div class="card"><b>Pedidos</b>${inc.map(r=>`<div class="fr"><span>${esc(r.fromName)}</span><span><button class="btn pri" data-a="${r.id}">Aceitar</button> <button class="btn" data-d="${r.id}">Recusar</button></span></div>`).join('')}</div>`:''}
  <div class="card"><b>Amigos (${friends.length})</b>${friends.length?friends.map(f=>`<div class="fr"><span>${esc(f.name)}</span><button class="btn" data-r="${f.id}">Remover</button></div>`).join(''):'<p class="mu">Ainda sem amigos.</p>'}</div>`;
  $('#cc').onclick=()=>{try{navigator.clipboard.writeText(code)}catch(e){}toast('Código copiado')};
  $('#fa').onclick=()=>{addFriend($('#fc').value);$('#fc').value=''};
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>accept(b.dataset.a));
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>decline(b.dataset.d));
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>removeF(b.dataset.r))}
function fpost(a){const pts=[];for(let i=0;i+1<(a.r||[]).length;i+=2)pts.push([a.r[i],a.r[i+1]]);
  return `<div class="post"><div class="ph"><span class="av">${esc((a.fname||'?')[0].toUpperCase())}</span><div class="pm"><b>${esc(a.fname||'Amigo')}</b><div class="mu">${fDT(a.date)}</div><div class="mu">${ICON[a.type]||'🏃'} ${esc(a.type||'')}</div></div></div>
  <h2 style="cursor:default">${esc(a.title||'')}</h2><div class="ps"><div><span>Distância</span><b>${(a.dist/1000).toFixed(2)} km</b></div><div><span>Subida</span><b>${a.elev} m</b></div><div><span>Tempo</span><b>${fTL(a.dur)}</b></div></div>
  ${pts.length>1?`<div class="mapbox" style="cursor:default">${thumb(pts)}</div>`:''}<div style="height:12px"></div></div>`}
function renderFF(){const el=$('#ff');if(el)el.innerHTML=FA.length?'<h3 style="margin:8px 4px">Amigos</h3>'+FA.map(fpost).join(''):''}
function renderAll(){renderAcct();renderFriends();renderFF()}
window.KR_acct=renderAcct;window.KR_friends=renderFriends;window.KR_ff=renderFF;
init();
