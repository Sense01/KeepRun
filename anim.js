// KeepRun: animações dos exercícios (figura articulada em SVG, desenhada com cinemática inversa).
(()=>{
const D=Math.PI/180,LT=50,UA=27,FA=25,TH=38,SH=38,HR=9,FOOT=10,SW=.9*LT,LEG=TH+SH,TOP=215,BL=LEG+SW;
const sn=a=>Math.sin(a*D),cs=a=>Math.cos(a*D),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
// cinemática inversa de dois ossos (y para cima); s escolhe o lado da articulação
const ik=(o,t,l1,l2,s)=>{const dx=t[0]-o[0],dy=t[1]-o[1],d0=Math.hypot(dx,dy)||1e-6,d=Math.min(l1+l2-.01,Math.max(Math.abs(l1-l2)+.01,d0)),a=Math.atan2(dy,dx),A=Math.acos(Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d)))),q=a+s*A;
  return[[o[0]+l1*Math.cos(q),o[1]+l1*Math.sin(q)],[o[0]+d*Math.cos(a),o[1]+d*Math.sin(a)]]};
const fkEnd=(o,l1,l2,a,b)=>{const j=[o[0]+l1*sn(a),o[1]-l1*cs(a)];return[j[0]+l2*sn(b),j[1]-l2*cs(b)]};
// intersecção de duas circunferências (devolve o ponto mais alto)
const ci=(c1,r1,c2,r2)=>{const dx=c2[0]-c1[0],dy=c2[1]-c1[1],d=Math.hypot(dx,dy),a=(r1*r1-r2*r2+d*d)/(2*d),h=Math.sqrt(Math.max(0,r1*r1-a*a)),mx=c1[0]+a*dx/d,my=c1[1]+a*dy/d,p1=[mx+h*dy/d,my-h*dx/d],p2=[mx-h*dy/d,my+h*dx/d];return p1[1]>p2[1]?p1:p2};
// pose canónica: pelvis, ângulo do tronco, alvos de tornozelos e pulsos
function canon(p){const P=p.P?p.P.slice():[0,0];let tau=p.t||0;if(p.SH)tau=Math.atan2(p.SH[0]-P[0],p.SH[1]-P[1])/D;
  const S=[P[0]+SW*sn(tau),P[1]+SW*cs(tau)],fa=(a,b)=>fkEnd(S,UA,FA,a||0,b==null?a||0:b),fl=(e,f)=>fkEnd(P,TH,SH,e||0,f==null?e||0:f);
  const LW=p.LH||fa(p.a,p.b),RW=p.RH||(p.c!=null?fa(p.c,p.d):LW),LA=p.LF||fl(p.e,p.f),RA=p.RF||(p.g!=null?fl(p.g,p.k):LA),ft=p.ft==null?90:p.ft;
  return{P,tau,h:p.h||0,cv:p.cv||0,y:p.y||0,LW,RW,LA,RA,ft,fft:p.fft==null?ft:p.fft,sa:p.sa||-1,sl:p.sl||1}}
const shift=(g,dx,dy)=>{for(const k of['P','S','N','H','LK','LA','RK','RA','LE','LW','RE','RW','LT','RT'])g[k]=[g[k][0]+dx,g[k][1]+dy]};
function solve(c,snap){const P=c.P,S=[P[0]+SW*sn(c.tau),P[1]+SW*cs(c.tau)],N=[P[0]+LT*sn(c.tau),P[1]+LT*cs(c.tau)],H=[N[0]+1.4*HR*sn(c.tau+c.h),N[1]+1.4*HR*cs(c.tau+c.h)];
  const[LK,LA]=ik(P,c.LA,TH,SH,c.sl),[RK,RA]=ik(P,c.RA,TH,SH,c.sl),[LE,LW]=ik(S,c.LW,UA,FA,c.sa),[RE,RW]=ik(S,c.RW,UA,FA,c.sa),toe=(A,f)=>[A[0]+FOOT*sn(f),A[1]-FOOT*cs(f)];
  const g={P,S,N,H,LK,LA,RK,RA,LE,LW,RE,RW,LT:toe(LA,c.ft),RT:toe(RA,c.fft),cv:c.cv,tau:c.tau,miss:{LA:dist(LA,c.LA),RA:dist(RA,c.RA),LW:dist(LW,c.LW),RW:dist(RW,c.RW)}};
  if(snap){const m=Math.min(g.LT[1],g.RT[1],LA[1],RA[1]);shift(g,-P[0],-m+c.y)}else if(c.y)shift(g,0,c.y);return g}
const lerp=(a,b,u)=>a+(b-a)*u,lp=(a,b,u)=>Array.isArray(a)?a.map((v,i)=>lerp(v,b[i],u)):lerp(a,b,u),mix=(A,B,u)=>{const o={};for(const k in A)o[k]=lp(A[k],B[k],u);return o};
const segs=A=>A.mode==='loop'?A.cps.length:2*(A.cps.length-1),msArr=A=>Array.isArray(A.ms)?A.ms:Array(segs(A)).fill(A.ms);
const period=k=>{const A=ANIMS[k];return A.proc?A.ms:msArr(A).reduce((a,b)=>a+b,0)};
function at(A,t){if(A.proc)return A.proc(t);const n=A.cps.length;if(n===1)return A.cps[0];const ms=msArr(A),T=ms.reduce((a,b)=>a+b,0);let x=t%T,k=0;while(x>=ms[k]){x-=ms[k];k++}
  let u=x/ms[k];if(!A.lin)u=.5-.5*Math.cos(Math.PI*u);let i,j;if(A.mode==='loop'){i=k;j=(k+1)%n}else if(k<n-1){i=k;j=k+1}else{i=2*(n-1)-k;j=i-1}return mix(A.cps[i],A.cps[j],u)}
// ---------- construtores de poses ----------
const ST=o=>({P:[0,LEG+2.5],t:0,LF:[0,3],RF:[0,3],...o});
function plank(hs,o){const A=[-Math.sqrt(BL*BL-(hs-10)**2),10],S=[0,hs],P=[A[0]+LEG*(S[0]-A[0])/BL,A[1]+LEG*(S[1]-A[1])/BL];return{P,SH:S,LF:A,RF:A,LH:[0,3],RH:[0,3],ft:0,h:-12,...o}}
function pike(hs,ax,o){const S=[0,hs],A=[ax,10];return{P:ci(S,SW,A,LEG),SH:S,LF:A,RF:A,LH:[0,3],RH:[0,3],ft:0,h:10,...o}}
function dog(ax,o){const S=[0,55],A=[ax,3];return{P:ci(S,SW,A,LEG),SH:S,LF:A,RF:A,LH:[0,3],RH:[0,3],h:15,...o}}
const ANIMS={};
const def=(k,o)=>{const A={ms:900,mode:'pp',...o};if(o.poses)A.cps=o.poses.map(canon);ANIMS[k]=A;
  if(A.cps&&!A.snap){let a=1e9,b=-1e9;const T=period(k);for(let i=0;i<24;i++){const g=solve(at(A,T*i/24),false);for(const q of['P','S','N','H','LK','LA','RK','RA','LE','LW','RE','RW','LT','RT']){a=Math.min(a,g[q][0]);b=Math.max(b,g[q][0])}}A.dx=Math.round(-(a+b)/2)}};
const RUNARM=[[-40,50,35,125],[-8,80,8,100],[35,125,-40,50],[8,100,-8,80]];
const cyc=(tt,L)=>L.map((l,i)=>({t:tt,e:l[0],f:l[1],g:l[2],k:l[3],a:RUNARM[i][0],b:RUNARM[i][1],c:RUNARM[i][2],d:RUNARM[i][3]}));
// caminhar / correr (ciclo com chão em movimento)
def('walk',{mode:'loop',snap:true,scroll:true,lin:true,ms:420,poses:[
  {t:4,e:24,f:14,g:-18,k:-34,a:-22,b:-8,c:22,d:34},{t:4,e:2,f:0,g:6,k:-26,a:-2,b:6,c:2,d:10},{t:4,e:-18,f:-34,g:24,k:14,a:22,b:34,c:-22,d:-8},{t:4,e:6,f:-26,g:2,k:0,a:2,b:10,c:-2,d:6}]});
def('jog',{mode:'loop',snap:true,scroll:true,lin:true,ms:250,poses:cyc(7,[[30,12,-32,-58],[4,0,42,-62],[-32,-58,30,12],[42,-62,4,0]])});
def('run',{mode:'loop',snap:true,scroll:true,lin:true,ms:180,poses:cyc(13,[[40,14,-40,-72],[6,0,55,-78],[-40,-72,40,14],[55,-78,6,0]])});
// bicicleta (procedural)
def('bike',{ms:1400,bike:true,proc:t=>{const th=-(t/1400)*2*Math.PI,C=[2,32],r=17,pl=[C[0]+r*Math.cos(th),C[1]+r*Math.sin(th)],pr=[C[0]-r*Math.cos(th),C[1]-r*Math.sin(th)];
  return{P:[-10,77],tau:48,h:-18,cv:0,y:0,LA:pl,RA:pr,LW:[44,79],RW:[44,79],ft:80,fft:80,sa:-1,sl:1}}});
def('rest',{ms:1500,poses:[ST({a:4,b:8}),ST({a:2,b:5,t:1.5,h:2})]});
// --- força ---
def('squat',{ms:950,poses:[ST({a:90,b:90}),{P:[-22,41],t:40,LF:[0,3],RF:[0,3],a:90,b:90}]});
def('squatjump',{ms:430,poses:[{P:[-20,42],t:38,LF:[0,3],RF:[0,3],a:-30,b:-20},{P:[0,100],t:0,LF:[0,24],RF:[0,24],ft:15,a:150,b:150}]});
def('pushup',{ms:800,poses:[plank(55),plank(25)]});
def('plank',{ms:1500,poses:[plank(55),plank(57)]});
def('plankTap',{mode:'loop',ms:430,poses:[plank(55),plank(55,{LH:[16,50]}),plank(55),plank(55,{RH:[16,50]})]});
def('climbers',{mode:'loop',ms:260,poses:[plank(55),plank(55,{LF:[-22,36]}),plank(55),plank(55,{RF:[-22,36]})]});
def('pike',{ms:900,poses:[pike(55,-62),pike(26,-62)]});
const LUNGE={P:[0,48],t:2,a:-20,b:40};
def('lunge',{mode:'loop',ms:650,poses:[ST({a:-20,b:40}),{...LUNGE,LF:[30,3],RF:[-30,11],ft:90,fft:25},ST({a:-20,b:40}),{...LUNGE,LF:[-30,11],RF:[30,3],ft:25,fft:90}]});
def('bridge',{ms:1100,poses:[{P:[0,8],SH:[-45,8],LF:[48,3],RF:[48,3],LH:[8,3],RH:[8,3]},{P:[0,34],SH:[-44,8],LF:[48,3],RF:[48,3],LH:[8,3],RH:[8,3],h:35}]});
def('row',{ms:850,hold:'pack',poses:[{P:[-20,58],t:62,LF:[0,3],RF:[0,3],LH:[22,28]},{P:[-20,58],t:62,LF:[0,3],RF:[0,3],LH:[2,64]}]});
def('bulgarian',{ms:900,props:[['r',-74,0,34,36]],poses:[{P:[6,68],t:6,LF:[28,3],RF:[-46,39],fft:-85,a:-15,b:45},{P:[8,38],t:6,LF:[28,3],RF:[-46,39],fft:-85,a:-15,b:45}]});
def('calf',{ms:700,poses:[ST({a:3,b:4}),{P:[0,86.5],t:0,LF:[0,11],RF:[0,11],ft:25,a:3,b:4}]});
const sp=(d)=>{const p=plank(30);return{...p,P:[p.P[0],p.P[1]-d],LH:undefined,RH:undefined,a:0,b:90,h:-8}};
def('sideplank',{ms:850,poses:[sp(0),sp(15)]});
const DB={P:[0,8],t:-90,LF:[36,44],RF:[36,44],LH:[-45,58],RH:[-45,58],h:0};
def('deadbug',{mode:'loop',ms:700,poses:[DB,{...DB,LH:[-94,6],RF:[72,12]},DB,{...DB,RH:[-94,6],LF:[72,12]}]});
def('latlunge',{ms:900,poses:[ST({a:60,b:60}),{P:[22,48],t:12,LF:[38,3],RF:[-34,3],a:60,b:60}]});
def('superman',{ms:1000,poses:[{P:[-22,8],t:86,LF:[-98,8],RF:[-98,8],ft:-90,a:90,b:90,h:-8},{P:[-22,10],t:70,LF:[-96,30],RF:[-96,30],ft:-70,a:100,b:105,h:-15}]});
def('dips',{ms:900,props:[['r',-36,0,28,48],['l',-34,0,-34,44,3],['l',-10,0,-10,44,3]],poses:[{P:[10,50],t:-8,LH:[-12,48],RH:[-12,48],LF:[64,3],RF:[64,3],ft:110},{P:[10,28],t:-8,LH:[-12,48],RH:[-12,48],LF:[64,3],RF:[64,3],ft:110}]});
const BD=[{P:[-14,38],t:68,LF:[0,3],RF:[0,3],LH:[27,3],RH:[27,3]}];
def('burpee',{mode:'loop',ms:[450,280,300,280,260,380],poses:[ST({a:5,b:5}),BD[0],plank(55),BD[0],{P:[0,100],t:0,LF:[0,24],RF:[0,24],ft:15,a:150,b:150},ST({a:5,b:5})]});
def('jacks',{mode:'loop',ms:300,poses:[ST({a:3,b:5}),{P:[0,74],t:0,LF:[22,5],RF:[-22,5],a:170,b:170,y:4}]});
def('highknees',{mode:'loop',ms:230,poses:[{P:[0,80],t:3,LF:[10,50],RF:[0,3],a:40,b:130,c:-40,d:50},{P:[0,80],t:3,LF:[0,3],RF:[10,50],a:-40,b:50,c:40,d:130}]});
// --- ioga e mobilidade ---
def('seated',{ms:2000,poses:[{P:[0,9],t:0,LF:[2,3],RF:[2,3],LH:[37,21],RH:[37,21]},{P:[0,9],t:2,LF:[2,3],RF:[2,3],LH:[37,21],RH:[37,21],h:2}]});
def('mountain',{ms:2200,poses:[ST({a:6,b:6}),ST({a:176,b:176,t:-3,h:-8})]});
def('fold',{ms:2000,poses:[{P:[-18,74],t:75,LF:[0,3],RF:[0,3],a:0,b:0},{P:[-18,74],t:150,LF:[0,3],RF:[0,3],LH:[8,3],RH:[8,3],cv:-4}]});
def('cobra',{ms:1800,poses:[{P:[-40,7],t:86,LF:[-116,6],RF:[-116,6],ft:-90,LH:[4,3],RH:[4,3],h:-8},{P:[-40,8],t:42,LF:[-116,6],RF:[-116,6],ft:-90,LH:[4,3],RH:[4,3],h:-20}]});
def('downdog',{mode:'loop',ms:900,poses:[dog(-80),dog(-80,{LF:[-78,13]}),dog(-80),dog(-80,{RF:[-78,13]})]});
const LL={P:[-10,34],t:0,LF:[34,3],RF:[-62,5],fft:-90};
def('lowlunge',{ms:1800,poses:[{...LL,LH:[20,40],RH:[20,40]},{...LL,t:-6,a:172,b:172,h:-12}]});
def('lungetwist',{ms:1500,poses:[{...LL,LH:[20,40],RH:[20,40]},{...LL,t:-10,LH:[-4,128],RH:[20,40],h:-14}]});
def('pigeon',{ms:2200,poses:[{P:[0,12],t:0,LF:[8,7],RF:[-76,6],fft:-90,LH:[14,6],RH:[14,6],sa:1},{P:[0,12],t:100,LF:[8,7],RF:[-76,6],fft:-90,LH:[93,3],RH:[93,3],h:-20,sa:1}]});
def('butterfly',{ms:2200,poses:[{P:[0,9],t:0,LF:[24,3],RF:[24,3],LH:[22,10],RH:[22,10]},{P:[0,9],t:42,LF:[24,3],RF:[24,3],LH:[28,5],RH:[28,5]}]});
const F4={P:[0,8],t:-90,RF:[44,3],LF:[27,36],LH:[6,3],RH:[6,3]};
def('fig4',{ms:2000,poses:[F4,{...F4,RF:[32,14],LF:[20,42]}]});
def('legsup',{ms:2200,props:[['l',17,0,17,100,5]],poses:[{P:[8,8],t:-90,LF:[11,83],RF:[11,83],LH:[6,3],RH:[6,3],sa:1},{P:[8,8],t:-90,LF:[11,77],RF:[11,77],LH:[6,3],RH:[6,3],sa:1}]});
const CH={P:[-40,18],LF:[-44,5],RF:[-44,5],ft:-90};
def('child',{ms:2200,poses:[{...CH,t:96,h:-25,LH:[56,3],RH:[56,3]},{...CH,t:104,h:-30,LH:[57,3],RH:[57,3]}]});
const QD={P:[-48,41],LF:[-86,5],RF:[-86,5],ft:-90,LH:[0,3],RH:[0,3]};
def('catcow',{ms:1700,poses:[{...QD,SH:[-3,55],cv:11,h:40},{...QD,P:[-48,39],SH:[-3,53],cv:-9,h:-38}]});
def('thoracic',{ms:1700,poses:[{...QD,t:80,LH:[2,68],RH:[0,3],h:0},{...QD,t:75,LH:[-6,104],RH:[0,3],h:-20}]});
const TW={P:[0,8],t:-90,LF:[36,3],RF:[36,3],LH:[6,3],RH:[6,3]};
def('twist',{ms:2000,poses:[TW,{...TW,LF:[50,4],RF:[44,10],h:20}]});
def('kneehug',{ms:1800,poses:[{...TW,LF:[44,3],RF:[44,3]},{P:[0,8],t:-90,LF:[12,38],RF:[12,38],LH:[-4,32],RH:[-4,32]}]});
def('savasana',{ms:2600,poses:[{P:[0,8],t:-90,LF:[76,5],RF:[76,5],ft:150,LH:[7,3],RH:[7,3]},{P:[0,8],t:-88,LF:[76,5],RF:[76,5],ft:150,LH:[7,3],RH:[7,3],cv:3}]});
def('hipcircle',{mode:'loop',ms:500,poses:[{P:[6,79],t:-4,LF:[0,3],RF:[0,3],a:-25,b:65},{P:[0,77.5],t:0,LF:[0,3],RF:[0,3],a:-25,b:65},{P:[-6,79],t:4,LF:[0,3],RF:[0,3],a:-25,b:65},{P:[0,80.5],t:0,LF:[0,3],RF:[0,3],a:-25,b:65}]});
def('deepsquat',{ms:1600,poses:[ST({a:90,b:90}),{P:[-14,30],t:25,LF:[0,3],RF:[0,3],LH:[20,52],RH:[20,52]}]});
def('shouldercircle',{mode:'loop',lin:true,ms:130,poses:Array.from({length:12},(_,i)=>ST({a:i*30,b:i*30}))});
def('chestopen',{ms:1800,poses:[ST({a:-12,b:-12}),ST({a:-72,b:-62,t:-5,h:-12})]});
def('quadstretch',{ms:2000,poses:[{P:[0,79],t:0,LF:[-22,78],RF:[0,3],LH:[-22,78],c:60,d:60},{P:[0,79],t:-2,LF:[-21,75],RF:[0,3],LH:[-21,75],c:60,d:60}]});
def('hamstring',{ms:2000,poses:[{P:[0,6],t:0,LF:[76,5],RF:[76,5],ft:160,a:80,b:80},{P:[0,6],t:68,LF:[76,5],RF:[76,5],ft:160,LH:[74,10],RH:[74,10]}]});
def('calfstretch',{ms:1800,props:[['l',66,0,66,130,5]],poses:[{P:[-4,70],t:22,LF:[20,3],RF:[-40,3],LH:[62,110],RH:[62,110]},{P:[0,67],t:28,LF:[22,3],RF:[-40,3],LH:[62,110],RH:[62,110]}]});
// ---------- desenho ----------
const NS='http://www.w3.org/2000/svg',ACT=new Set();let raf=0;
const RED=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function mount(el,key,o){o=o||{};const A=ANIMS[key];if(!A||!el)return null;el.innerHTML='';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','-110 0 220 235');svg.setAttribute('preserveAspectRatio','xMidYMax meet');svg.setAttribute('class','kra');svg.setAttribute('aria-hidden','true');el.appendChild(svg);
  const gr=document.createElementNS(NS,'g');gr.setAttribute('transform','translate('+(A.dx||0)+',0)');let par=svg;const E=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);par.appendChild(e);return e},Y=y=>TOP-y;
  const e={floor:E('line',{x1:-110,y1:TOP+1,x2:110,y2:TOP+1,stroke:'var(--bd)','stroke-width':3,'stroke-linecap':'round'})};
  if(A.scroll)e.floor.setAttribute('stroke-dasharray','16 12');svg.appendChild(gr);par=gr;
  for(const p of A.props||[]){if(p[0]==='l')E('line',{x1:p[1],y1:Y(p[2]),x2:p[3],y2:Y(p[4]),stroke:'var(--mu)','stroke-width':p[5]||4,'stroke-linecap':'round'});
    else E('rect',{x:p[1],y:Y(p[2]+p[4]),width:p[3],height:p[4],rx:3,fill:'none',stroke:'var(--mu)','stroke-width':3})}
  if(A.bike){const wh=(cx)=>{E('circle',{cx,cy:Y(26),r:26,fill:'none',stroke:'var(--mu)','stroke-width':3});return[E('line',{stroke:'var(--mu)','stroke-width':2}),E('line',{stroke:'var(--mu)','stroke-width':2})]};
    e.sp=[...wh(-46),...wh(46)];const fl=(a,b,c,d)=>E('line',{x1:a,y1:Y(b),x2:c,y2:Y(d),stroke:'var(--mu)','stroke-width':4,'stroke-linecap':'round'});
    fl(-46,26,2,32);fl(2,32,-10,66);fl(2,32,38,58);fl(-10,66,38,60);fl(38,58,46,26);fl(38,58,40,80);fl(40,80,48,80);fl(-14,68,-6,68)}
  const body={stroke:'var(--ac)','stroke-width':6,fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},far={...body,opacity:.45};
  e.fa=E('polyline',far);e.fl=E('polyline',far);e.to=E('path',body);e.nl=E('polyline',body);e.na=E('polyline',body);
  e.hd=E('circle',{r:HR,fill:'var(--bg)',stroke:'var(--ac)','stroke-width':5});if(A.hold)e.hold=E('rect',{width:14,height:18,rx:3,fill:'var(--card)',stroke:'var(--mu)','stroke-width':3});
  const c={A,svg,e,t0:performance.now()};if(o.t!=null){render(c,o.t);return{stop(){}}}render(c,RED?(A.still||0):0);if(!RED){ACT.add(c);if(!raf)raf=requestAnimationFrame(loop)}return{stop:()=>ACT.delete(c),play:()=>{if(RED)return;c.t0=performance.now()-(c.t||0);ACT.add(c);if(!raf)raf=requestAnimationFrame(loop)}}}
function render(c,t){c.t=t;const A=c.A,g=solve(at(A,t),A.snap),e=c.e,P=p=>p[0].toFixed(1)+','+(TOP-p[1]).toFixed(1),dr=Math.PI/180;
  const dx=-Math.cos(g.tau*dr),dy=Math.sin(g.tau*dr),m=[(g.P[0]+g.N[0])/2+dx*g.cv*2,(g.P[1]+g.N[1])/2+dy*g.cv*2];
  e.to.setAttribute('d',`M${P(g.P)} Q${P(m)} ${P(g.N)}`);
  e.fl.setAttribute('points',[g.P,g.RK,g.RA,g.RT].map(P).join(' '));e.nl.setAttribute('points',[g.P,g.LK,g.LA,g.LT].map(P).join(' '));
  e.fa.setAttribute('points',[g.S,g.RE,g.RW].map(P).join(' '));e.na.setAttribute('points',[g.S,g.LE,g.LW].map(P).join(' '));
  e.hd.setAttribute('cx',g.H[0].toFixed(1));e.hd.setAttribute('cy',(TOP-g.H[1]).toFixed(1));
  if(e.hold){e.hold.setAttribute('x',(g.LW[0]-7).toFixed(1));e.hold.setAttribute('y',(TOP-g.LW[1]-2).toFixed(1))}
  if(A.scroll)e.floor.setAttribute('stroke-dashoffset',((t*(A.scroll===true?.09:A.scroll))%28).toFixed(1));
  if(A.bike&&e.sp){const w=(t/1400)*2*Math.PI*1.6;[[-46,0],[-46,1],[46,2],[46,3]].forEach(([cx,i])=>{const a=w+(i%2)*Math.PI/2;e.sp[i].setAttribute('x1',cx+26*Math.cos(a));e.sp[i].setAttribute('y1',TOP-26-26*Math.sin(a));e.sp[i].setAttribute('x2',cx-26*Math.cos(a));e.sp[i].setAttribute('y2',TOP-26+26*Math.sin(a))})}}
function loop(now){raf=0;for(const c of[...ACT]){if(!c.svg.isConnected){ACT.delete(c);continue}render(c,now-c.t0)}if(ACT.size&&!document.hidden)raf=requestAnimationFrame(loop)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ACT.size&&!raf)raf=requestAnimationFrame(loop)});
window.KRAnim={mount,keys:()=>Object.keys(ANIMS),has:k=>!!ANIMS[k],solveAt:(k,t)=>{const A=ANIMS[k];return solve(at(A,t),A.snap)},period,dx:k=>ANIMS[k].dx||0,limits:{LT,UA,FA,TH,SH,TOP}};
})();
