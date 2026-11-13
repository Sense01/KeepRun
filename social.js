// KeepRun: contas (Google ou email) + amigos (Firebase). Usa globais do index.html.
const V='10.14.1',G='https://www.gstatic.com/firebasejs/'+V+'/';
const MY={};let state='init',db,auth,app,user=null,code='',friends=[],inc=[],FA=[],cloudNotifs=[],unsubs=[],notifPrimed=false;const notifSeen=new Set();
let GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,deleteUser,createUser,signInEmail,resetPw;
let doc,getDoc,setDoc,deleteDoc,updateDoc,collection,query,where,getDocs,onSnapshot,orderBy,limit;
const key=a=>String(a.cloudKey||a.id).replace(/[./]/g,'_');
const uname=()=>user?(user.displayName||(user.email||'Atleta').split('@')[0]):'Atleta';
const pz=()=>{try{const z=JSON.parse(ls('kr_pz','null'));return z&&isFinite(z.lat)&&isFinite(z.lon)&&z.r>0?z:null}catch(e){return null}};
const mapOK=a=>a.showMap!==false;
const zh=()=>{const z=pz();return z?Math.round(z.lat*1e4)+','+Math.round(z.lon*1e4)+','+z.r:'0'};

async function init(){
  let c;
  try{({firebaseConfig:c}=await import('./firebase-config.js'));if(!c.apiKey||c.apiKey.includes('COLE'))throw 0}catch(e){state='nocfg';renderAll();return}
  try{
    const [A,Au,F]=await Promise.all([import(G+'firebase-app.js'),import(G+'firebase-auth.js'),import(G+'firebase-firestore.js')]);
    ({GoogleAuthProvider,signInWithPopup,signInWithRedirect,signOut,deleteUser}=Au);createUser=Au.createUserWithEmailAndPassword;signInEmail=Au.signInWithEmailAndPassword;resetPw=Au.sendPasswordResetEmail;
    ({doc,getDoc,setDoc,deleteDoc,updateDoc,collection,query,where,getDocs,onSnapshot,orderBy,limit}=F);
    app=A.initializeApp(c);auth=Au.getAuth(app);db=F.getFirestore(app);state='ready';Au.onAuthStateChanged(auth,onUser);
  }catch(e){state='offline'}
  renderAll();
}
addEventListener('online',()=>{if(state==='offline')init()});
async function onUser(u){
  unsubs.forEach(f=>f());unsubs=[];friends=[];inc=[];FA=[];cloudNotifs=[];notifPrimed=false;notifSeen.clear();user=u;code='';for(const k in MY)delete MY[k];
  if(u){
    if(ls('kr_wipe_'+u.uid,'')==='1'){ss('kr_wipe_'+u.uid,'');try{await deleteUser(u);toast('Dados e conta apagados')}catch(e){await signOut(auth)}renderAll();return}
    const prev=ls('kr_uid','');if(prev&&prev!==u.uid){ss('kr_share','0');ss('kr_name',uname().split(' ')[0]);ss('kr_strava_tok','');ss('kr_gemini_key','')}
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
function unpack(id,x){
  const pts=[],r=Array.isArray(x.r)?x.r:[],dur=num(x.dur),date=num(x.date)||Date.now(),elev=num(x.elev),nPts=Math.floor(r.length/2);
  for(let i=0;i+1<r.length;i+=2){
    const la=Number(r[i]),lo=Number(r[i+1]);
    if(isFinite(la)&&isFinite(lo)){
      const k=pts.length,frac=nPts>1?k/(nPts-1):0;
      pts.push([la,lo,elev>0?Math.round(frac*elev*10)/10:null,Math.round(date+frac*dur*1000)]);
    }
  }
  return{id:isFinite(+id)?+id:id,cloudKey:id,fromCloud:true,name:String(x.title||'Atividade').slice(0,80),type:String(x.type||'Corrida').slice(0,40),date,dist:num(x.dist),dur,elev,pts,eff:Math.min(10,Math.max(0,Math.round(num(x.eff)))),desc:String(x.desc||'').slice(0,300),share:true};
}
async function mergeCloudDocs(docs){
  if(!user)return 0;
  if(window.KR_loaded)await window.KR_loaded;
  let del=[];try{del=JSON.parse(ls('kr_del_'+user.uid,'[]'))}catch(e){}
  const delSet=new Set(del);let added=0,updated=0;
  docs.forEach(d=>{
    if(delSet.has(d.id))return;
    const x=d.data(),u=unpack(d.id,x);
    const ex=acts.find(a=>key(a)===d.id||(Math.abs(num(a.date)-u.date)<5000&&Math.abs(num(a.dist)-u.dist)<10));
    if(!ex){acts.push(u);added++}
    else{
      if(!ex.cloudKey)ex.cloudKey=d.id;
      if((!ex.pts||ex.pts.length<2)&&u.pts.length>1){ex.pts=u.pts;updated++}
      if(!ex.dirty&&x.title&&ex.name!==x.title){ex.name=String(x.title).slice(0,80);updated++}
    }
  });
  if(added||updated){
    window.KR_saveLocal&&KR_saveLocal();
    if(window.renderList)renderList();
  }
  return added;
}
function listen(){
  const me=user.uid;
  unsubs.push(onSnapshot(collection(db,'activities',me,'items'),async s=>{await mergeCloudDocs(s.docs);loadMine()}));
  unsubs.push(onSnapshot(collection(db,'users',me,'friends'),s=>{friends=s.docs.map(d=>({id:d.id,...d.data()}));renderFriends();loadFA()}));
  unsubs.push(onSnapshot(query(collection(db,'requests'),where('to','==',me),where('status','==','pending')),s=>{inc=s.docs.map(d=>({id:d.id,...d.data()}));renderFriends();renderBell()}));
  unsubs.push(onSnapshot(query(collection(db,'requests'),where('from','==',me),where('status','==','accepted')),s=>{
    s.docs.forEach(async d=>{const r=d.data();try{const u=await getDoc(doc(db,'users',r.to));
      await setDoc(doc(db,'users',me,'friends',r.to),{name:String((u.data()||{}).name||'Amigo').slice(0,60),t:Date.now()});await deleteDoc(d.ref)}catch(e){}})}));
  unsubs.push(onSnapshot(query(collection(db,'users',me,'notifications'),orderBy('t','desc'),limit(40)),s=>{
    cloudNotifs=s.docs.map(d=>({id:d.id,...d.data()}));
    if(!notifPrimed){notifPrimed=true;cloudNotifs.forEach(x=>notifSeen.add(x.id))}
    else{s.docChanges().forEach(ch=>{if(ch.type==='added'&&!notifSeen.has(ch.doc.id)){notifSeen.add(ch.doc.id);const d=ch.doc.data();if(d&&d.read!==true)fireAlert({id:ch.doc.id,...d})}})}
    renderBell();
    const nv=document.getElementById('nv');if(nv&&nv.classList.contains('on'))showNotifs(notifs());
  },()=>{}));
}
let lastFA=0;
async function loadFA(){
  if(!user)return;lastFA=Date.now();const out=[];
  await Promise.all(friends.map(async f=>{try{const s=await getDocs(query(collection(db,'activities',f.id,'items'),orderBy('date','desc'),limit(5)));
    s.docs.forEach(d=>out.push({...d.data(),fname:f.name,owner:f.id,aid:d.id}))}catch(e){}}));
  FA=out.sort((a,b)=>num(b.date)-num(a.date)).slice(0,12);renderFF();
  await Promise.all(FA.map(async p=>{p.soc=await loadSoc(p.owner,p.aid)}));renderFF();loadMine();
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user){if(Date.now()-lastFA>60000)loadFA();doSync()}});
addEventListener('online',()=>{if(user)doSync()});
setInterval(()=>{if(user&&!document.hidden)loadFA()},600000);

// ---- Keeps (gostos) e comentários partilhados (só entre amigos) ----
const getLocalKeeps=()=>{try{return JSON.parse(ls('kr_keeps','{}'))||{}}catch(e){return{}}};
const setLocalKeep=(id,v)=>{const k=getLocalKeeps();if(v)k[id]=1;else delete k[id];ss('kr_keeps',JSON.stringify(k))};
async function loadSoc(owner,aid){let k=[],c=[];
  try{const s=await getDocs(collection(db,'activities',owner,'items',aid,'kudos'));k=s.docs.map(d=>({uid:d.id,name:String(d.data().name||'Amigo').slice(0,60),t:num(d.data().t)}))}catch(e){}
  if(user&&getLocalKeeps()[owner+'_'+aid]&&!k.some(x=>x.uid===user.uid))k.unshift({uid:user.uid,name:uname().slice(0,60),t:Date.now()});
  try{const s=await getDocs(query(collection(db,'activities',owner,'items',aid,'comments'),orderBy('t'),limit(20)));c=s.docs.map(d=>({id:d.id,uid:String(d.data().uid||''),name:String(d.data().name||'Amigo').slice(0,60),text:String(d.data().text||'').slice(0,200),t:num(d.data().t)}))}catch(e){}
  return{k,c}}
async function loadMine(){if(!user||state!=='ready')return;
  const mine=acts.filter(x=>x.share!==false&&ls('kr_share','1')==='1').slice().sort((x,y)=>y.date-x.date).slice(0,10);
  await Promise.all(mine.map(async a=>{const s=await loadSoc(user.uid,key(a));MY[key(a)]=s;if(s.k.some(x=>x.uid===user.uid))a.k=true}));
  if(window.renderCards)renderCards();renderBell()}
window.KR_socData=a=>{const m=(user&&MY[key(a)])||{k:[],c:[]};return{k:m.k,c:m.c,mine:!!(user&&m.k.some(x=>x.uid===user.uid))}};
window.KR_keep=(a,on)=>{
  if(!user)return;const k=key(a);setLocalKeep(user.uid+'_'+k,on);
  const m=MY[k]=MY[k]||{k:[],c:[]};
  m.k=m.k.filter(x=>x.uid!==user.uid);
  if(on)m.k.unshift({uid:user.uid,name:uname().slice(0,60),t:Date.now()});
  if(state==='ready'&&a.share!==false&&ls('kr_share','1')==='1'){
    const r=doc(db,'activities',user.uid,'items',k,'kudos',user.uid);
    (on?setDoc(r,{name:uname().slice(0,60),t:Date.now()}):deleteDoc(r)).catch(()=>{});
  }
};
window.KR_social=a=>{const m=user&&MY[key(a)];if(!m)return'';
  return m.c.map(c=>`<p style="margin:4px 0;font-size:14px"><b>${esc(c.name)}</b> ${esc(c.text)}</p>`).join('')};
window.KR_cmt=(a,text)=>{if(state!=='ready'||!user||a.share===false||ls('kr_share','1')!=='1')return false;
  setDoc(doc(collection(db,'activities',user.uid,'items',key(a),'comments')),{uid:user.uid,name:uname().slice(0,60),text:String(text).slice(0,200),t:Date.now()}).then(loadMine).catch(()=>toast('Erro ao comentar'));return true};
const mineK=p=>!!(user&&((p.soc&&p.soc.k.some(x=>x.uid===user.uid))||getLocalKeeps()[p.owner+'_'+p.aid]));
async function toggleKudos(i){const p=FA[i];if(!p||!user)return;
  const now=!mineK(p);setLocalKeep(p.owner+'_'+p.aid,now);
  p.soc=p.soc||{k:[],c:[]};p.soc.k=p.soc.k.filter(x=>x.uid!==user.uid);
  if(now)p.soc.k.unshift({uid:user.uid,name:uname().slice(0,60),t:Date.now()});
  renderFF();toast(now?'🔥 Deste um Keep!':'Keep removido');
  if(state==='ready'){
    const r=doc(db,'activities',p.owner,'items',p.aid,'kudos',user.uid),nid='like_'+p.aid+'_'+user.uid;
    try{
      await(now?setDoc(r,{name:uname().slice(0,60),t:Date.now()}):deleteDoc(r));
      if(p.owner!==user.uid){now?emitNotif(p.owner,nid,{type:'post_like',entityType:'post',entityId:p.aid,postTitle:String(p.title||'atividade').slice(0,80),text:''}):deleteDoc(doc(db,'users',p.owner,'notifications',nid)).catch(()=>{})}
      p.soc=await loadSoc(p.owner,p.aid);renderFF();
    }catch(e){}
  }
}
async function addComment(i){const p=FA[i];if(!p)return;const t=prompt('Comentário');if(!t||!t.trim())return;
  const txt=t.trim().slice(0,200),cRef=doc(collection(db,'activities',p.owner,'items',p.aid,'comments'));
  try{
    await setDoc(cRef,{uid:user.uid,name:uname().slice(0,60),text:txt,t:Date.now()});
    if(p.owner!==user.uid)emitNotif(p.owner,'cmt_'+p.aid+'_'+cRef.id,{type:'post_comment',entityType:'post',entityId:p.aid,postTitle:String(p.title||'atividade').slice(0,80),text:txt});
    p.soc=await loadSoc(p.owner,p.aid);renderFF();
  }catch(e){toast('Erro')}}
// ---- notificações em tempo real (100% Spark gratuito) ----
const formatNotif=x=>{
  const nm=x.actorName||'Atleta',pt=x.postTitle||'atividade',cnt=Number(x.count)||1;
  let txt=x.txt||'';
  if(!txt){
    if(x.type==='friend_request')txt=`${nm} quer ser teu amigo`;
    else if(x.type==='friend_accepted')txt=`${nm} aceitou o teu pedido de amizade`;
    else if(x.type==='post_like')txt=cnt>1?`${nm} e mais ${cnt-1} deram Keep em "${pt}"`:`${nm} deu um Keep a "${pt}"`;
    else if(x.type==='post_comment')txt=`${nm} comentou "${pt}": ${x.text||''}`;
    else txt=`${nm} interagiu contigo`;
  }
  return{id:x.id||'',t:num(x.t),read:x.read===true,type:x.type||'',entityId:x.entityId||'',actorName:nm,postTitle:pt,count:cnt,req:x.type==='friend_request',txt};
};
function mergeNotifs(cloud,myMap,actsList,incList,uid){
  const out=[],likes=new Map();
  for(const raw of (cloud||[])){
    const x=formatNotif(raw),ids=x.id?[x.id]:[];
    if(x.type==='post_like'&&x.entityId){
      const gk=x.entityId+'|'+(x.read?1:0),prev=likes.get(gk);
      if(prev){
        prev.count+=x.count||1;if(ids.length)prev.ids.push(...ids);
        if(x.t>=prev.t){prev.t=x.t;prev.actorName=x.actorName;prev.id=x.id||prev.id}
        prev.txt=formatNotif({...prev,txt:''}).txt;continue;
      }
      const grp={...x,ids};likes.set(gk,grp);out.push(grp);
    }else out.push({...x,ids});
  }
  const reqCov=new Set(out.filter(x=>x.type==='friend_request').map(x=>x.entityId));
  incList.forEach(r=>{if(!reqCov.has(r.from))out.push({id:'',ids:[],t:num(r.t),read:false,type:'friend_request',entityId:r.from,req:true,txt:`${r.fromName} quer ser teu amigo`})});
  if(!cloud.length){
    for(const [k,m] of Object.entries(myMap||{})){
      const a=actsList.find(x=>key(x)===k);if(!a)continue;
      m.k.forEach(x=>{if(!uid||x.uid!==uid)out.push({id:'',ids:[],t:x.t,read:false,type:'post_like',entityId:k,req:false,txt:`${x.name} deu um Keep a "${a.name}"`})});
      m.c.forEach(c=>{if(c.uid!==uid)out.push({id:'',ids:[],t:c.t,read:false,type:'post_comment',entityId:k,req:false,txt:`${c.name} comentou "${a.name}": ${c.text}`})});
    }
  }
  return out.sort((a,b)=>b.t-a.t);
}
const countUnread=(list,seen)=>list.filter(x=>x.id?!x.read:(x.req||x.t>seen)).length;
const notifs=()=>mergeNotifs(cloudNotifs,MY,acts,inc,user?user.uid:'');
const emitNotif=(uid,nid,p)=>{
  if(!uid||!user||uid===user.uid||state!=='ready')return;
  return setDoc(doc(db,'users',uid,'notifications',nid),{...p,actorId:user.uid,actorName:(uname()||'Atleta').slice(0,60),count:1,read:false,t:Date.now()}).catch(()=>{});
};
async function fireAlert(item){
  const f=formatNotif(item);
  if(!document.hidden){toast('🔔 '+f.txt);return}
  if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
  const url=f.req||f.type==='friend_accepted'?'?tab=groups':(f.entityId?'?post='+encodeURIComponent(f.entityId):'./');
  const d={url,type:f.type,entityId:f.entityId,nid:f.id};
  try{
    if('serviceWorker' in navigator){
      const reg=await navigator.serviceWorker.ready;
      if(reg&&reg.showNotification){await reg.showNotification('KeepRun',{body:f.txt,icon:'./icon-192.png',badge:'./icon-192.png',tag:f.id||'kr-notif',renotify:true,data:d});return}
    }
    new Notification('KeepRun',{body:f.txt,icon:'./icon-192.png',tag:f.id||'kr-notif'});
  }catch(e){}
}
async function enableAlerts(){
  if(typeof Notification==='undefined'){toast('Alertas requerem browser compatível ou PWA no Ecrã Principal.');return}
  if(Notification.permission==='denied'){toast('Alertas bloqueados nas definições do navegador.');return}
  const p=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(p==='granted'){toast('Alertas ativos gratuitamente!');renderAcct();const nv=document.getElementById('nv');if(nv&&nv.classList.contains('on'))showNotifs(notifs())}
  else toast('Permissão de alertas recusada.');
}
async function markRead(ids){
  const arr=(Array.isArray(ids)?ids:[ids]).filter(Boolean);if(!user||!arr.length)return;
  arr.forEach(id=>{const it=cloudNotifs.find(x=>x.id===id);if(it)it.read=true});renderBell();
  Promise.all(arr.map(id=>updateDoc(doc(db,'users',user.uid,'notifications',id),{read:true}).catch(()=>{})));
}
async function markAllRead(){
  ss('kr_seen',String(Date.now()));
  const unread=cloudNotifs.filter(x=>x.read!==true);
  unread.forEach(x=>{x.read=true});renderBell();
  const nv=document.getElementById('nv');if(nv&&nv.classList.contains('on'))showNotifs(notifs());
  if(user&&unread.length)Promise.all(unread.map(x=>updateDoc(doc(db,'users',user.uid,'notifications',x.id),{read:true}).catch(()=>{})));
}
function navNotif(type,entityId){
  if(type==='friend_request'||type==='friend_accepted'){if(window.go)go('groups');return}
  if((type==='post_like'||type==='post_comment')&&entityId){
    const run=()=>{const a=acts.find(x=>key(x)===entityId);if(a&&window.show)show(a);else if(window.go)go('feed')};
    if(window.KR_loaded)KR_loaded.then(run);else run();
  }
}
function showNotifs(l){
  let g=document.getElementById('nv');if(!g){g=document.createElement('div');g.id='nv';g.className='ov';document.body.appendChild(g)}
  g.classList.add('on');
  const seen=+ls('kr_seen','0'),un=countUnread(l,seen);
  const canAl=typeof Notification!=='undefined'&&Notification.permission==='default';
  g.innerHTML=`<div class="gh" style="flex-wrap:wrap"><b>Notificações</b><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${canAl?'<button class="btn pri" id="np" style="padding:6px 10px;font-size:12px">🔔 Ativar alertas</button>':''}${un?'<button class="btn" id="nra" style="padding:6px 10px;font-size:12px">Ler todas</button>':''}<button class="btn" id="nx" style="padding:6px 12px;font-size:13px">Fechar</button></div></div>`
    +(l.length?l.slice(0,30).map((x,i)=>{
      const isU=x.id?!x.read:(x.req||x.t>seen);
      return `<div class="gst" data-ni="${i}" style="cursor:pointer;${isU?'background:rgba(252,76,2,.08);border-radius:12px;padding:12px 10px':'padding:12px 6px'}"><i style="width:9px;height:9px;border-radius:50%;background:${isU?'var(--ac)':'rgba(255,255,255,.14)'};flex:none"></i><div style="min-width:0"><div style="${isU?'font-weight:700':''}">${esc(x.txt)}</div><div class="mu">${x.t?new Date(x.t).toLocaleString('pt-PT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div></div></div>`;
    }).join(''):'<p class="mu">Sem notificações.</p>');
  g.querySelector('#nx').onclick=()=>g.classList.remove('on');
  if(g.querySelector('#nra'))g.querySelector('#nra').onclick=()=>markAllRead();
  if(g.querySelector('#np'))g.querySelector('#np').onclick=()=>enableAlerts();
  g.querySelectorAll('[data-ni]').forEach(el=>el.onclick=()=>{
    const it=l[+el.dataset.ni];if(!it)return;
    const ids=it.ids&&it.ids.length?it.ids:it.id;
    if(ids&&ids.length)markRead(ids);else ss('kr_seen',String(Date.now()));
    g.classList.remove('on');navNotif(it.type,it.entityId);
  });
}
function renderBell(){
  const b=document.getElementById('bell');if(!b)return;
  let nb=b.querySelector('.nb');
  const seen=+ls('kr_seen','0'),n=user?countUnread(notifs(),seen):0;
  if(n){if(!nb){nb=document.createElement('span');nb.className='nb';b.appendChild(nb)}nb.textContent=n>9?'9+':String(n)}
  else if(nb)nb.remove();
  b.onclick=()=>{if(!user)return toast('Entra com a tua conta para ver notificações');showNotifs(notifs());if(!cloudNotifs.length){ss('kr_seen',String(Date.now()));renderBell()}};
}
// ---- sincronização bidirecional (telemóvel <-> portátil + amigos, respeitando a zona de privacidade) ----
function route(p){const z=pz();let d=0;const cum=[0];for(let i=1;i<p.length;i++){d+=hav(p[i-1],p[i]);cum.push(d)}
  const T=cum[cum.length-1],trim=T>600?200:0;
  let q=p.filter((x,i)=>cum[i]>=trim&&cum[i]<=T-trim&&(!z||hav(x,[z.lat,z.lon])>z.r));
  if(q.length<2&&!z)q=p;
  const st=Math.max(1,Math.floor(q.length/80)),r=[];
  q.forEach((x,i)=>{if(i%st===0)r.push(+x[0].toFixed(4),+x[1].toFixed(4))});return r.slice(0,160)}
const pack=a=>({title:String(a.name).slice(0,80),type:String(a.type).slice(0,40),date:num(a.date),dist:Math.round(num(a.dist)),dur:Math.round(num(a.dur)),elev:Math.round(num(a.elev)),r:mapOK(a)&&a.pts?route(a.pts):[],eff:Math.round(num(a.eff)),desc:String(a.desc||'').slice(0,300)});
window.KR_del=a=>{if(!user)return;const dk='kr_del_'+user.uid;let del=[];try{del=JSON.parse(ls(dk,'[]'))}catch(e){}const k=key(a);if(!del.includes(k)){del.push(k);ss(dk,JSON.stringify(del.slice(-200)))}};
let syncT,syncing=false;window.KR_sync=()=>{clearTimeout(syncT);syncT=setTimeout(()=>doSync(false),250)};
async function doSync(manual){
  if(syncing||state!=='ready'||!user)return;
  syncing=true;
  if(window.KR_loaded)await window.KR_loaded;
  const sk='kr_synced_'+user.uid,dk='kr_del_'+user.uid;
  let old=[],del=[];try{old=JSON.parse(ls(sk,'[]'))}catch(e){}try{del=JSON.parse(ls(dk,'[]'))}catch(e){}
  try{
    // 1) Descarregar atividades da conta que estejam na nuvem (ex.: gravadas no telemóvel) e ainda não estejam neste dispositivo
    const snap=await getDocs(collection(db,'activities',user.uid,'items'));
    const pulled=await mergeCloudDocs(snap.docs);
    // 2) Enviar atividades locais novas ou editadas para a nuvem
    const shareOn=ls('kr_share','1')==='1';
    const list=shareOn?acts.filter(a=>a.share!==false):[];
    const sig=a=>key(a)+'|'+(mapOK(a)?1:0)+'|'+zh(),wS=new Set(list.map(sig)),wK=new Set(list.map(key));
    for(const a of list){
      if((!a.fromCloud||a.dirty)&&!old.includes(sig(a))){
        await setDoc(doc(db,'activities',user.uid,'items',key(a)),pack(a));
        a.dirty=false;
      }
    }
    // 3) Apagar da nuvem atividades que o utilizador apagou ou deixou de partilhar
    const toRemove=new Set([...del,...old.map(e=>e.split('|')[0]).filter(k=>!wK.has(k)&&(!shareOn||acts.some(a=>key(a)===k&&a.share===false)))]);
    for(const k of toRemove){
      for(const sub of ['kudos','comments']){try{const s=await getDocs(collection(db,'activities',user.uid,'items',k,sub));for(const x of s.docs)await deleteDoc(x.ref)}catch(x){}}
      await deleteDoc(doc(db,'activities',user.uid,'items',k)).catch(()=>{});
    }
    if(del.length)ss(dk,'[]');
    ss(sk,JSON.stringify([...wS]));
    if(manual)toast(pulled?`Sincronizado! ${pulled} atividade(s) recebida(s) da nuvem.`:'Atividades sincronizadas com a nuvem!');
  }catch(e){if(manual)toast('Erro ao sincronizar')}finally{syncing=false}
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
    await setDoc(doc(db,'requests',to+'_'+user.uid),{from:user.uid,fromName:uname().slice(0,60),to,status:'pending',t:Date.now()});
    emitNotif(to,'req_'+user.uid,{type:'friend_request',entityType:'friendship',entityId:user.uid,postTitle:'',text:''});
    toast('Pedido enviado')}
  catch(e){toast('Erro ao adicionar')}}
async function accept(i){const r=inc[i];if(!r)return;
  try{await setDoc(doc(db,'users',user.uid,'friends',r.from),{name:String(r.fromName||'Amigo').slice(0,60),t:Date.now()});await updateDoc(doc(db,'requests',r.id),{status:'accepted'});
    emitNotif(r.from,'acc_'+user.uid,{type:'friend_accepted',entityType:'friendship',entityId:user.uid,postTitle:'',text:''});
    markRead('req_'+r.from)}catch(e){toast('Erro')}}
const decline=i=>{const r=inc[i];if(r){deleteDoc(doc(db,'requests',r.id)).catch(()=>toast('Erro'));deleteDoc(doc(db,'users',user.uid,'notifications','req_'+r.from)).catch(()=>{})}};
async function removeF(i){const f=friends[i];if(!f||!confirm('Remover amigo?'))return;try{await deleteDoc(doc(db,'users',user.uid,'friends',f.id));await deleteDoc(doc(db,'users',f.id,'friends',user.uid));await deleteDoc(doc(db,'requests',user.uid+'_'+f.id)).catch(()=>{});await deleteDoc(doc(db,'requests',f.id+'_'+user.uid)).catch(()=>{})}catch(e){}}
async function wipe(){
  if(!confirm('Apagar todos os teus dados na nuvem (atividades partilhadas, amigos, pedidos, código e conta)? As atividades guardadas neste dispositivo mantêm-se.'))return;
  try{const me=user.uid;ss('kr_share','0');
    for(const f of friends){try{const its=await getDocs(query(collection(db,'activities',f.id,'items'),limit(200)));for(const d of its.docs){await deleteDoc(doc(db,'activities',f.id,'items',d.id,'kudos',me)).catch(()=>{});const cs=await getDocs(query(collection(db,'activities',f.id,'items',d.id,'comments'),where('uid','==',me)));for(const c of cs.docs)await deleteDoc(c.ref).catch(()=>{})}}catch(e){}}
    const it=await getDocs(collection(db,'activities',me,'items'));for(const d of it.docs){for(const sub of ['kudos','comments']){const ss2=await getDocs(collection(db,'activities',me,'items',d.id,sub));for(const x of ss2.docs)await deleteDoc(x.ref)}await deleteDoc(d.ref)}
    for(const f of friends){await deleteDoc(doc(db,'users',me,'friends',f.id)).catch(()=>{});await deleteDoc(doc(db,'users',f.id,'friends',me)).catch(()=>{})}
    for(const k of ['from','to']){const rs=await getDocs(query(collection(db,'requests'),where(k,'==',me)));for(const d of rs.docs)await deleteDoc(d.ref)}
    try{const sn=await getDocs(collection(db,'users',me,'notifications'));for(const d of sn.docs)await deleteDoc(d.ref)}catch(e){}
    if(code)await deleteDoc(doc(db,'codes',code)).catch(()=>{});
    await deleteDoc(doc(db,'users',me)).catch(()=>{});ss('kr_synced_'+me,'[]');ss('kr_strava_tok','');ss('kr_gemini_key','');
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
  else{const sh=ls('kr_share','1')==='1',pOn=typeof Notification!=='undefined'&&Notification.permission==='granted';
    h=`<div class="card"><b>${esc(uname())}</b><div class="mu">${esc(user.email||'')}</div><p class="mu">Código de amigo: <b style="color:var(--tx)">${esc(code||'—')}</b></p>
    <label><input type="checkbox" id="sh" ${sh?'checked':''}> Partilhar e sincronizar atividades na nuvem</label><p style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="sy-now">🔄 Sincronizar agora</button>${typeof Notification!=='undefined'?`<button class="btn" id="psh-btn">${pOn?'🔔 Alertas ativos':'🔕 Ativar alertas'}</button>`:''}<button class="btn" id="so">Terminar sessão</button> <button class="btn" id="wp-del">Apagar os meus dados na nuvem</button></p></div>`}
  el.innerHTML=h+renderZone();
  const q=x=>el.querySelector(x);
  if(q('#pv2'))q('#pv2').onclick=()=>window.KR_policy&&KR_policy();
  if(q('#gl')){q('#gl').onclick=login;q('#em-t').onclick=()=>q('#em').classList.toggle('hide');q('#em-in').onclick=()=>emailAuth('in');q('#em-new').onclick=()=>emailAuth('new');q('#em-rs').onclick=()=>emailAuth('reset')}
  if(q('#so')){if(q('#sy-now'))q('#sy-now').onclick=()=>doSync(true);if(q('#psh-btn'))q('#psh-btn').onclick=()=>enableAlerts();q('#so').onclick=()=>{ss('kr_strava_tok','');ss('kr_gemini_key','');signOut(auth)};q('#sh').onchange=e=>{ss('kr_share',e.target.checked?'1':'0');KR_sync()};q('#wp-del').onclick=wipe}
  bindZone(el)}
function renderFriends(){const el=$('#friends');if(!el)return;
  const stravaCard=`<div class="card"><div class="sh" style="margin-bottom:6px"><b>🧡 Perfis Strava & Importação</b></div><p class="mu" style="margin:0 0 10px">Explora perfis de outros atletas no Strava, compara estatísticas frente-a-frente ou importa as tuas atividades do Strava.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" id="st-prof">👤 Ver Perfis do Strava</button><button class="btn" id="st-imp">📥 Importar do Strava</button></div></div>`;
  if(state!=='ready'||!user){
    el.innerHTML=stravaCard+(state==='nocfg'?'<div class="card"><b>Amigos KeepRun</b><p class="mu">Configura o Firebase (ver SETUP.md) para ativar contas e amigos.</p></div>':state==='offline'?'<div class="card"><b>Amigos KeepRun</b><p class="mu">Sem ligação: os amigos precisam de internet.</p></div>':state==='ready'?'<div class="card"><b>Amigos KeepRun</b><p class="mu">Entra com a tua conta (separador Eu) para adicionar amigos e ver as suas atividades.</p></div>':'');
    if(el.querySelector('#st-prof'))el.querySelector('#st-prof').onclick=()=>window.openStravaProfiles&&openStravaProfiles();
    if(el.querySelector('#st-imp'))el.querySelector('#st-imp').onclick=()=>window.openStravaImport&&openStravaImport();
    return;
  }
  el.innerHTML=stravaCard+`<div class="card"><b>Adicionar amigo KeepRun</b><p class="mu">O teu código: <b style="color:var(--tx)">${esc(code||'—')}</b> <button class="btn" id="cc">Copiar</button></p>
  <div style="display:flex;gap:8px"><input id="fc" placeholder="Código do amigo" maxlength="6" style="flex:1;text-transform:uppercase"><button class="btn pri" id="fa">Adicionar</button></div></div>
  ${inc.length?`<div class="card"><b>Pedidos</b>${inc.map((r,i)=>`<div class="fr"><span>${esc(r.fromName)}</span><span><button class="btn pri" data-a="${i}">Aceitar</button> <button class="btn" data-d="${i}">Recusar</button></span></div>`).join('')}</div>`:''}
  <div class="card"><b>Amigos (${friends.length})</b>${friends.length?friends.map((f,i)=>`<div class="fr"><span data-pf="${i}" style="cursor:pointer;font-weight:600;color:var(--ac)">👤 ${esc(f.name)} <small class="mu">(ver perfil)</small></span><button class="btn" data-r="${i}">Remover</button></div>`).join(''):'<p class="mu">Ainda sem amigos.</p>'}</div>`;
  if(el.querySelector('#st-prof'))el.querySelector('#st-prof').onclick=()=>window.openStravaProfiles&&openStravaProfiles();
  if(el.querySelector('#st-imp'))el.querySelector('#st-imp').onclick=()=>window.openStravaImport&&openStravaImport();
  $('#cc').onclick=()=>{try{navigator.clipboard.writeText(code)}catch(e){}toast('Código copiado')};
  $('#fa').onclick=()=>{addFriend($('#fc').value);$('#fc').value=''};
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>accept(+b.dataset.a));
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>decline(+b.dataset.d));
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>removeF(+b.dataset.r));
  el.querySelectorAll('[data-pf]').forEach(s=>s.onclick=()=>{const f=friends[+s.dataset.pf];if(f&&window.openAthleteProfile)openAthleteProfile(f.id,f.name)})}
function fpost(a,i){const pts=[],r=Array.isArray(a.r)?a.r:[];for(let i=0;i+1<r.length;i+=2){const la=Number(r[i]),lo=Number(r[i+1]);if(isFinite(la)&&isFinite(lo))pts.push([la,lo])}
  const d=num(a.dist),el=Math.round(num(a.elev)),du=num(a.dur),ef=Math.min(10,Math.max(0,Math.round(num(a.eff)))),nm=esc(a.fname||'Amigo'),k=(a.soc&&a.soc.k)||[],cm=(a.soc&&a.soc.c)||[];
  return `<div class="post"><div class="ph" data-fpf="${i}" style="cursor:pointer"><span class="av">${esc(String(a.fname||'?')[0].toUpperCase())}</span><div class="pm" style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b>${nm} <small class="mu" style="font-weight:400">· ver perfil</small></b><span class="pill">${window.ic?ic(String(a.type||'')):'🏃'} ${esc(a.type||'')}</span></div><div class="mu">${fDT(num(a.date))}</div></div></div>
  <h2 style="cursor:default">${esc(a.title||'')}</h2>${ef?`<div class="mu" style="margin:-6px 0 10px">💪 Esforço ${ef}/10</div>`:''}${a.desc?`<p style="margin:0 0 10px">${esc(a.desc)}</p>`:''}
  <div class="ps"><div><span>Distância</span><b>${d?(d/1000).toFixed(2)+' km':'—'}</b></div><div><span>Subida</span><b>${el} m</b></div><div><span>Tempo</span><b>${fTL(du)}</b></div></div>
  ${pts.length>1?`<div class="mapbox" style="cursor:default">${thumb(pts)}</div>`:''}
  <div class="kd">${k.length?`🔥 <b>${k.length} ${k.length===1?'Keep':'Keeps'}</b> · `+k.slice(0,4).map(x=>esc(x.name)).join(', '):'Sê o primeiro a dar um Keep!'}</div>${cm.map(c=>`<p style="margin:4px 0;font-size:14px"><b>${esc(c.name)}</b> ${esc(c.text)}</p>`).join('')}
  <div class="ac"><button class="fk ${mineK(a)?'on':''}" data-i="${i}" aria-label="Dar Keep">${(window.KR_IC||{}).thumb||''}<span>${k.length?k.length+' ':''}${k.length===1?'Keep':'Keeps'}</span></button><button class="fc" data-i="${i}" aria-label="Comentar">${(window.KR_IC||{}).chat||''}<span>Comentar</span></button></div></div>`}
function renderFF(){const el=$('#ff');if(!el)return;el.innerHTML=FA.length?'<h3 style="margin:8px 4px">Amigos</h3>'+FA.map((a,i)=>fpost(a,i)).join(''):'';
  el.querySelectorAll('[data-fpf]').forEach(p=>{p.onclick=()=>{const a=FA[+p.dataset.fpf];if(a&&window.openAthleteProfile)openAthleteProfile(a.owner,a.fname)}});
  el.querySelectorAll('.fk').forEach(b=>b.onclick=()=>toggleKudos(+b.dataset.i));el.querySelectorAll('.fc').forEach(b=>b.onclick=()=>addComment(+b.dataset.i))}
function renderAll(){renderAcct();renderFriends();renderFF();renderBell()}
window.KR_fa=()=>FA;window.KR_friendsList=()=>friends;window.KR_acct=renderAcct;window.KR_friends=renderFriends;window.KR_ff=renderFF;window.KR_notifs={formatNotif,mergeNotifs,countUnread};
if(typeof navigator!=='undefined'&&navigator.serviceWorker){navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='KR_NOTIF'&&e.data.data){const d=e.data.data;if(d.nid)markRead(d.nid);navNotif(d.type,d.entityId)}})}
if(typeof location!=='undefined'){try{const sp=new URLSearchParams(location.search);if(sp.get('tab')==='groups'||sp.get('post')){const tab=sp.get('tab'),pid=sp.get('post');history.replaceState(null,'',location.pathname);navNotif(tab==='groups'?'friend_request':'post_comment',pid||'')}}catch(e){}}
init();
