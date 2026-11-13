// KeepRun: testes automáticos (osascript -l JavaScript test.js)
ObjC.import('Foundation');
function read(p){return ObjC.unwrap($.NSString.alloc.initWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null))}
function assert(cond,msg){if(!cond)throw new Error('FAIL: '+msg)}

// 1) Verificar sintaxe de todos os scripts
const html=read('index.html'),m=html.match(/<script>([\s\S]*?)<\/script>/);
assert(m&&m[1],'Bloco script principal em index.html');
new Function(m[1]);
['treinos.js','pro.js','anim.js','sw.js'].forEach(f=>new Function(read(f)));
new Function(read('social.js').replace(/export /g,'').replace(/import\(/g,'Promise.resolve('));
new Function('require','exports',read('functions/index.js'));

// 2) Ambiente mínimo para testar parsers, métricas e limpeza de dados
const store={};
const window=globalThis;
window.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
const ls=(k,d)=>store[k]??d,ss=(k,v)=>{store[k]=String(v)};
const R=Math.PI/180,num=window.num=x=>{x=Number(x);return isFinite(x)?x:0};
const splitCSV=window.splitCSV=l=>{const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(c.trim());c=''}else c+=ch}o.push(c.trim());return o};
const hav=(a,b)=>{const dl=(b[0]-a[0])*R,dn=(b[1]-a[1])*R,x=Math.sin(dl/2)**2+Math.cos(a[0]*R)*Math.cos(b[0]*R)*Math.sin(dn/2)**2;return 12742000*Math.asin(Math.sqrt(x))};
const fT=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),c=s%60,z=n=>String(n).padStart(2,'0');return(h?h+':':'')+z(m)+':'+z(c)};
const fP=(d,t)=>d>0?fT(t/(d/1000))+'/km':'--',fV=(d,t)=>t>0?(d/t*3.6).toFixed(1)+' km/h':'--',pace=a=>a.type==='Bicicleta'?fV(a.dist,a.dur):fP(a.dist,a.dur);
const fTL=s=>fT(s),esc=s=>String(s),wkStart=()=>Date.now()-864e5,wkId=t=>t,calc=()=>({dist:1000,dur:300,elev:10}),thin=p=>p,save=()=>{},renderList=()=>{},toast=()=>1,IC={};
let acts=[];
Object.assign(globalThis,{ls,ss,R,hav,fT,fP,fV,pace,fTL,esc,wkStart,wkId,calc,thin,save,renderList,toast,IC,acts});
const srcTreinos=read('treinos.js'),srcPro=read('pro.js');
const elStub=()=>({innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},querySelector:()=>elStub(),querySelectorAll:()=>[],appendChild(){},insertBefore(){},addEventListener(){},remove(){}});
window.document={querySelector:()=>elStub(),querySelectorAll:()=>[],getElementById:()=>elStub(),createElement:()=>elStub(),head:elStub(),body:elStub(),addEventListener(){}};
const qStub=s=>window.document.querySelector(s);
window.addEventListener=()=>{};window.navigator={};
window.setInterval=()=>1;window.clearInterval=()=>{};window.setTimeout=()=>1;window.clearTimeout=()=>{};
window.crypto={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=i+1;return a}};

new Function('$','acts',srcTreinos)(qStub,acts);
new Function('$','acts',srcPro)(qStub,acts);

// Teste A: splitCSV com aspas e vírgulas internas
const cols=splitCSV('"Corrida, Matinal",Run,"12,5",1500');
assert(cols.length===4&&cols[0]==='Corrida, Matinal'&&cols[2]==='12,5','splitCSV com aspas');

// Teste B: parseMFPText (equação MyFitnessPal + macros)
const mfp=window.KRW.parseMFPText('Meta 2200 - Alimentos 1850 + Exercício 300 = 650\nHidratos 210g Proteína 130g Gordura 55g');
assert(mfp.goal===2200&&mfp.food===1850&&mfp.carbs===210&&mfp.protein===130&&mfp.fat===55,'parseMFPText equação e macros');

// Teste C: decodePolyline + importStravaCSV
const pts=window.KRPro.decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@',1200,45,1700000000000);
assert(pts.length===3&&Math.abs(pts[0][0]-38.5)<0.01&&pts[2][3]===1700001200000,'decodePolyline');
const nImp=window.KRPro.importStravaCSV('Activity Name,Activity Type,Activity Date,Distance,Moving Time,Elevation Gain,Polyline\nCorrida Teste,Run,2026-11-10T09:00:00Z,5.2,1560,62,_p~iF~ps|U_ulLnnqC');
assert(nImp===1&&acts.length===1&&acts[0].dist===5200&&acts[0].pts.length===2,'importStravaCSV');

// Teste D: analyzeAct e memoização (_pro)
const m1=window.KRPro.analyzeAct(acts[0]),m2=window.KRPro.analyzeAct(acts[0]);
assert(m1===m2&&m1.relEffort>0&&m1.avgW>0,'analyzeAct memoização e métricas');

// Teste E: parseGarminSleep + calcReadiness (Score Global Sono Garmin + Alimentação + Exercício e diagnóstico de falha)
const slp1=window.KRPro.parseGarminSleep('Duração 6h 30m Pontuação de sono 62 Profundo 1h 12m REM 1h 00m Repouso 56 bpm');
assert(slp1.hours===6.5&&slp1.score===62&&slp1.deep===1.2&&slp1.rem===1&&slp1.rhr===56,'parseGarminSleep OCR');
const rdNoEx=window.KRPro.calcReadiness();
assert(rdNoEx.worst.id==='ex'&&rdNoEx.failMsg.includes('Exercício'),'calcReadiness identifica falha no exercício quando 0 km na semana');
acts[0].date=Date.now();acts[0].dist=18000;
window.KRPro.setSleep({hours:4.5,target:8,score:45,deep:0.6,rem:0.8,rhr:62,updatedAt:Date.now()});
const rd=window.KRPro.calcReadiness();
assert(rd.total>0&&rd.total<=100&&rd.worst.id==='sleep'&&rd.failMsg.includes('Sono (Garmin)'),'calcReadiness identifica falha no sono');
assert(window.KRW.scoreRing(rd.total,rd.color,44).includes('<svg')&&window.KRW.scoreRing(rd.total,rd.color,44).includes('>'+rd.total+'<'),'scoreRing gera SVG radial válido');

// Teste F: Notificações sociais em tempo real (formatação, colapsamento de likes, não lidas e fallback)
const escSocial=esc,lsSocial=ls,ssSocial=ss,numSocial=num,hello=()=>{},KR_sync=()=>{},actsSocial=[{id:42,name:'Meia Maratona'}];
new Function('acts','ls','ss','esc','num','hello','KR_sync','renderCards','toast','window','navigator','document',
  read('social.js').replace(/export /g,'').replace(/\bimport\(/g,'(async()=>({}))('))(
  actsSocial,lsSocial,ssSocial,escSocial,numSocial,hello,KR_sync,()=>{},toast,globalThis,window.navigator,window.document);
const {formatNotif,mergeNotifs,countUnread}=globalThis.KR_notifs;
assert(formatNotif({type:'post_like',actorName:'Ana',postTitle:'Treino Longo',count:4}).txt.includes('e mais 3 deram Keep'),'formatNotif colapsa likes');
assert(formatNotif({type:'friend_accepted',actorName:'Pedro'}).txt.includes('aceitou'),'formatNotif amigo aceite');
const merged=mergeNotifs(
  [{id:'like_42',type:'post_like',actorName:'Ana',entityId:'42',postTitle:'Treino Longo',count:2,read:false,t:200}],
  {'42':{k:[{uid:'u2',name:'Ana',t:100}],c:[{uid:'u3',name:'Rui',text:'Boa!',t:150}]}},
  actsSocial,
  [{from:'u4',fromName:'Sofia',t:300}],
  'me'
);
assert(merged.length===2&&merged[0].entityId==='u4'&&merged[1].id==='like_42','mergeNotifs ordena e funde cloud + pedidos pendentes');
assert(countUnread(merged,0)===2,'countUnread conta pedidos e notificações por ler');
merged[1].read=true;
assert(countUnread(merged,0)===1,'countUnread reduz após marcar lida');

console.log('OK: Todos os testes passaram.');
