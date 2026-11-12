// KeepRun Pro: Funcionalidades completas de assinatura Strava (Segmentos & Live Segments, Fitness & Freshness, Esforço Relativo, GAP, Zonas, Registo de Treino, Atividades Comparáveis, Objetivos, Planos de Treino, Recover Athletics, Heatmap Pessoal, Criador de Rotas, Mapas Offline, Beacon e Meteorologia).
(()=>{
const R=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const getJSON=(k,d)=>{try{const v=JSON.parse(ls(k,'null'));return v==null?d:v}catch(e){return d}};
const setJSON=(k,v)=>ss(k,JSON.stringify(v));

// ---------- 1. Perfil Fisiológico & Métricas Avançadas (GAP, Esforço Relativo, Potência, FC, Zonas) ----------
const getProf=()=>{const p=getJSON('kr_prof',{});return{kg:clamp(+p.kg||70,35,180),maxHr:clamp(+p.maxHr||190,130,220),ftp:clamp(+p.ftp||220,80,500)}};
const setProf=p=>setJSON('kr_prof',p);

// Fator de custo energético de Minetti para cálculo do Ritmo Ajustado à Inclinação (GAP)
function gradeFactor(g){
  g=clamp(g,-0.30,0.30);
  const cr=155.4*Math.pow(g,5)-30.4*Math.pow(g,4)-43.3*Math.pow(g,3)+46.3*Math.pow(g,2)+19.5*g+3.6;
  return clamp(cr/3.6,0.55,3.2);
}

// Calcula métricas detalhadas de uma atividade: GAP, Potência (W), FC média, Esforço Relativo, Zonas de Ritmo e Zonas de FC, e Voltas detalhadas
function analyzeAct(a){
  const prof=getProf(),ck=`${prof.kg}|${prof.maxHr}|${prof.ftp}|${a.dist}|${a.dur}|${a.elev}|${a.eff}|${a.pts?a.pts.length:0}`;
  if(a._pro&&a._proKey===ck)return a._pro;
  const sp=(a.type||'Corrida'),isBike=/Bicicleta|Ciclismo|Spinning/i.test(sp),isRun=/Corrida|Trail|Passadeira|Caminhada|Hiking/i.test(sp);
  const dur=Math.max(1,+a.dur||0),dist=Math.max(0,+a.dist||0),elev=Math.max(0,+a.elev||0),eff=clamp(+a.eff||5,1,10);
  const basePace=dist>50?dur/(dist/1000):330; // s/km
  let eqDist=dist,sumW=0,wTime=0;
  const pZones=[0,0,0,0,0],hrZones=[0,0,0,0,0],splits=[];
  let kmAcc=0,kmIdx=1,kmT0=a.pts&&a.pts.length?a.pts[0][3]:0,kmEqD=0,kmGain=0,kmLoss=0,kmW=0,kmWT=0;

  if(a.pts&&a.pts.length>1){
    eqDist=0;
    for(let i=1;i<a.pts.length;i++){
      const p0=a.pts[i-1],p1=a.pts[i],d=hav(p0,p1);
      const dt=p1[3]&&p0[3]&&p1[3]>p0[3]?clamp((p1[3]-p0[3])/1000,0.5,60):(d>0?d/Math.max(1,dist/dur):1);
      const de=(p1[2]!=null&&p0[2]!=null&&isFinite(p1[2])&&isFinite(p0[2]))?(p1[2]-p0[2]):0;
      const g=d>3?clamp(de/d,-0.28,0.28):0;
      const gf=gradeFactor(g),eqD=d*gf;
      eqDist+=eqD;
      const v=d/dt; // m/s
      // Potência estimada (W): modelo físico para ciclismo e corrida
      let w=0;
      if(isBike){
        const m=prof.kg+9,fg=m*9.81*(g+0.005),fa=0.5*1.225*0.32*v*v;
        w=clamp(Math.max(0,(fg+fa)*v),0,1200);
      }else if(isRun){
        w=clamp(prof.kg*v*gf*3.8,0,900);
      }else{
        w=clamp(prof.kg*(0.8+eff*0.25)*1.2,40,600);
      }
      sumW+=w*dt;wTime+=dt;

      // Zona de ritmo do segmento
      const segEqPace=eqD>0.5?(dt/(eqD/1000)):basePace;
      const ratio=basePace/Math.max(120,segEqPace);
      const pz=ratio<0.82?0:ratio<0.94?1:ratio<1.04?2:ratio<1.14?3:4;
      pZones[pz]+=dt;

      // Zona de FC estimada no segmento
      const hrRatio=clamp(0.54+0.032*eff+(ratio-1)*0.35+(g>0?g*0.4:0),0.50,0.99);
      const hz=hrRatio<0.65?0:hrRatio<0.76?1:hrRatio<0.85?2:hrRatio<0.92?3:4;
      hrZones[hz]+=dt;

      // Acumular parciais por km
      kmAcc+=d;kmEqD+=eqD;
      if(de>0)kmGain+=de;else kmLoss+=Math.abs(de);
      kmW+=w*dt;kmWT+=dt;
      if(kmAcc>=kmIdx*1000){
        const lapT=p1[3]&&kmT0&&p1[3]>kmT0?(p1[3]-kmT0)/1000:dur/(dist/1000);
        const lapGap=kmEqD>100?lapT/(kmEqD/1000):lapT;
        splits.push({km:kmIdx,t:lapT,gap:lapGap,gain:Math.round(kmGain),loss:Math.round(kmLoss),w:Math.round(kmW/Math.max(1,kmWT))});
        kmT0=p1[3];kmEqD=0;kmGain=0;kmLoss=0;kmW=0;kmWT=0;kmIdx++;
      }
    }
  }else{
    // Atividade sem GPS (indoor / passadeira / força)
    const zWeights=eff<=3?[55,30,12,3,0]:eff<=5?[20,45,25,8,2]:eff<=7?[10,25,40,20,5]:[5,15,30,32,18];
    zWeights.forEach((w,i)=>{pZones[i]=dur*w/100;hrZones[i]=dur*w/100});
    wTime=dur;sumW=prof.kg*(1.1+eff*0.22)*dur;
    if(dist>0)eqDist=dist+(elev*8);
  }

  const gapPace=eqDist>50?dur/(eqDist/1000):0;
  const avgW=Math.round(sumW/Math.max(1,wTime));
  const avgHr=Math.round(prof.maxHr*clamp(0.56+eff*0.036+(elev>200?0.03:0),0.55,0.96));
  // Esforço Relativo (Relative Effort estilo Strava TRIMP)
  const intensityFactor=Math.pow(clamp((avgHr-60)/Math.max(40,prof.maxHr-60),0.2,1.0),2.1);
  const relEffort=Math.max(1,Math.round((dur/60)*intensityFactor*2.35*(1+elev/1500)));

  const totZ=pZones.reduce((s,x)=>s+x,0)||1,totH=hrZones.reduce((s,x)=>s+x,0)||1;
  a._proKey=ck;
  return a._pro={
    gapPace,
    gapStr:gapPace>0?fT(gapPace)+'/km':'--',
    avgW,
    avgHr,
    maxHr:Math.min(prof.maxHr,Math.round(avgHr*1.09)),
    relEffort,
    pZones:pZones.map(x=>Math.round(x/totZ*100)),
    hrZones:hrZones.map(x=>Math.round(x/totH*100)),
    splits
  };
}

// ---------- 2. Fitness & Freshness (CTL / ATL / TSB) e Esforço Relativo Semanal ----------
function calcFitnessCurve(days=60){
  const now=new Date();now.setHours(0,0,0,0);
  const end=now.getTime(),start=end-(days+42)*864e5;
  const byDay={};
  acts.forEach(a=>{
    const d=new Date(a.date);d.setHours(0,0,0,0);const k=d.getTime();
    if(k>=start&&k<=end+864e5)byDay[k]=(byDay[k]||0)+analyzeAct(a).relEffort;
  });
  let ctl=0,atl=0;const series=[];
  for(let t=start;t<=end;t+=864e5){
    const load=byDay[t]||0;
    ctl=ctl+(load-ctl)/42;
    atl=atl+(load-atl)/7;
    const tsb=ctl-atl;
    if(t>=end-(days-1)*864e5)series.push({t,load,fitness:Math.round(ctl*10)/10,fatigue:Math.round(atl*10)/10,form:Math.round(tsb*10)/10});
  }
  const cur=series[series.length-1]||{fitness:0,fatigue:0,form:0,load:0};
  const status=cur.form>10?'Pico de Forma / Fresco 🟢':cur.form>=-10?'Treino Produtivo ⚡':cur.form>=-25?'Carga Elevada 🔥':'Fadiga Acumulada — Recupera 🛡️';
  return{series,cur,status};
}

// ---------- 3. Segmentos, Tabelas de Classificação e Live Segments ----------
const DEFAULT_SEGS=[
  {id:'seg_400m',name:'Sprint 400 m',dist:400,kind:'dist'},
  {id:'seg_1km',name:'1 km Rápido',dist:1000,kind:'dist'},
  {id:'seg_5km',name:'5 km Rápido',dist:5000,kind:'dist'},
  {id:'seg_10km',name:'10 km Rápido',dist:10000,kind:'dist'},
  {id:'seg_climb',name:'Subida de 500 m',dist:500,kind:'climb'}
];
const getCustomSegs=()=>getJSON('kr_segs',[]);
const saveCustomSeg=s=>{const l=getCustomSegs().filter(x=>x.id!==s.id);l.unshift(s);setJSON('kr_segs',l.slice(0,30))};

// Encontra o melhor esforço num segmento de distância dentro de uma atividade
function bestWindowEffort(a,targetDist,climbMode){
  if(!a.pts||a.pts.length<2||a.dist<targetDist*0.92)return null;
  const p=a.pts,cumD=[0];
  for(let i=1;i<p.length;i++)cumD.push(cumD[i-1]+hav(p[i-1],p[i]));
  const totalD=cumD[cumD.length-1];if(totalD<targetDist*0.95)return null;
  let best=null,j=0;
  for(let i=0;i<p.length-1;i++){
    while(j<p.length-1&&cumD[j]-cumD[i]<targetDist)j++;
    const segD=cumD[j]-cumD[i];if(segD<targetDist*0.95)break;
    const rawDt=(p[j][3]&&p[i][3]&&p[j][3]>p[i][3])?(p[j][3]-p[i][3])/1000:(a.dur*(segD/Math.max(1,a.dist)));
    const dt=rawDt*(targetDist/segD);
    const elevG=(p[j][2]!=null&&p[i][2]!=null)?(p[j][2]-p[i][2]):0;
    if(climbMode&&elevG<10)continue;
    const score=climbMode?(elevG/Math.max(1,dt)):-dt;
    if(!best||score>best.score){
      best={score,time:Math.max(1,Math.round(dt)),elev:Math.round(Math.max(0,elevG)),startPt:p[i],endPt:p[j],pts:p.slice(i,j+1)};
    }
  }
  return best;
}

// Encontra esforço num segmento geográfico personalizado (com início e fim no mapa)
function matchGeoSeg(a,seg){
  if(!a.pts||a.pts.length<2||!seg.start||!seg.end)return null;
  let iStart=-1,bestS=999,iEnd=-1,bestE=999;
  for(let i=0;i<a.pts.length;i++){
    const ds=hav(a.pts[i],seg.start);if(ds<120&&ds<bestS){bestS=ds;iStart=i}
  }
  if(iStart<0)return null;
  for(let j=iStart+1;j<a.pts.length;j++){
    const de=hav(a.pts[j],seg.end);if(de<120&&de<bestE){bestE=de;iEnd=j}
  }
  if(iEnd<=iStart)return null;
  let d=0;for(let k=iStart+1;k<=iEnd;k++)d+=hav(a.pts[k-1],a.pts[k]);
  if(d<seg.dist*0.6||d>seg.dist*1.5)return null;
  const p0=a.pts[iStart],p1=a.pts[iEnd];
  const dt=(p1[3]&&p0[3]&&p1[3]>p0[3])?(p1[3]-p0[3])/1000:(a.dur*(d/Math.max(1,a.dist)));
  return{time:Math.max(1,Math.round(dt)),dist:Math.round(d),elev:Math.round(Math.max(0,(p1[2]||0)-(p0[2]||0))),pts:a.pts.slice(iStart,iEnd+1)};
}

function getAllSegs(){return[...getCustomSegs(),...DEFAULT_SEGS]}

function getSegEfforts(seg,filterMode='all'){
  const now=Date.now(),y0=new Date(new Date().getFullYear(),0,1).getTime(),m0=new Date(new Date().getFullYear(),new Date().getMonth(),1).getTime();
  const myName=ls('kr_name','Atleta'),efforts=[];
  acts.forEach(a=>{
    if(filterMode==='year'&&a.date<y0)return;
    if(filterMode==='month'&&a.date<m0)return;
    const ef=seg.kind==='geo'?matchGeoSeg(a,seg):bestWindowEffort(a,seg.dist,seg.kind==='climb');
    if(ef)efforts.push({athlete:myName,isMe:true,date:a.date,actName:a.name,actId:a.id,time:ef.time,dist:seg.dist,elev:ef.elev});
  });
  // Incluir esforços estimados de amigos sincronizados quando o filtro não é 'mine'
  if(filterMode!=='mine'&&window.KR_fa){
    (KR_fa()||[]).forEach(fa=>{
      if(filterMode==='year'&&fa.date<y0)return;
      if(filterMode==='month'&&fa.date<m0)return;
      if((fa.dist||0)>=seg.dist*0.95&&fa.dur>0){
        const estT=Math.round((fa.dur/(fa.dist/seg.dist))*0.96);
        efforts.push({athlete:fa.fname||'Amigo',isMe:false,date:fa.date,actName:fa.title||'Atividade',time:estT,dist:seg.dist,elev:0});
      }
    });
  }
  // Referência de comunidade (KOM/QOM virtual se não houver amigos para comparar)
  if(filterMode==='all'){
    const refK=seg.dist===400?78:seg.dist===1000?215:seg.dist===5000?1140:seg.dist===10000?2380:Math.round(seg.dist*0.23);
    efforts.push({athlete:'KOM/QOM Referência KeepRun',isMe:false,isRef:true,date:now-864e5*14,actName:'Recorde de Referência',time:refK,dist:seg.dist,elev:0});
  }
  return efforts.sort((a,b)=>a.time-b.time);
}

function getActSegments(a){
  if(!a.pts||a.pts.length<2)return[];
  const out=[];
  getAllSegs().forEach(seg=>{
    const ef=seg.kind==='geo'?matchGeoSeg(a,seg):bestWindowEffort(a,seg.dist,seg.kind==='climb');
    if(!ef)return;
    const allMy=getSegEfforts(seg,'mine').sort((x,y)=>x.time-y.time);
    const allLb=getSegEfforts(seg,'all');
    const myRank=allMy.findIndex(x=>x.actId===a.id)+1;
    const lbRank=allLb.findIndex(x=>x.actId===a.id)+1;
    const prTime=allMy.length?allMy[0].time:ef.time;
    out.push({seg,time:ef.time,elev:ef.elev,myRank,lbRank,prTime,diffPr:ef.time-prTime,isPR:ef.time<=prTime,isKOM:lbRank===1});
  });
  return out;
}

// ---------- 4. Atividades Comparáveis (Matched Activities no mesmo percurso) ----------
function getMatchedActs(a){
  if(!a.pts||a.pts.length<2||a.dist<400)return[];
  const s0=a.pts[0],e0=a.pts[a.pts.length-1],mid0=a.pts[Math.floor(a.pts.length/2)];
  return acts.filter(x=>{
    if(!x.pts||x.pts.length<2||x.type!==a.type)return false;
    if(Math.abs(x.dist-a.dist)>Math.max(400,a.dist*0.18))return false;
    const xs=x.pts[0],xe=x.pts[x.pts.length-1],xm=x.pts[Math.floor(x.pts.length/2)];
    return hav(s0,xs)<220&&hav(e0,xe)<220&&hav(mid0,xm)<350;
  }).sort((x,y)=>x.date-y.date);
}

// ---------- 5. Condições Meteorológicas Automáticas (Open-Meteo + Cache Local) ----------
const wxCache=getJSON('kr_wx',{});
const WX_ICONS={0:'☀️ Céu limpo',1:'🌤️ Pouco nublado',2:'⛅ Parcialmente nublado',3:'☁️ Nublado',45:'🌫️ Nevoeiro',48:'🌫️ Nevoeiro',51:'🌦️ Chuvisco',53:'🌦️ Chuvisco',61:'🌧️ Chuva fraca',63:'🌧️ Chuva moderada',65:'🌧️ Chuva forte',80:'🌦️ Aguaceiros',95:'⛈️ Trovoada'};
async function fetchWeather(a){
  if(!a.pts||!a.pts.length)return null;
  const key=String(a.id);if(wxCache[key])return wxCache[key];
  const lat=+a.pts[0][0].toFixed(3),lon=+a.pts[0][1].toFixed(3),dt=new Date(a.date||Date.now());
  const day=dt.toISOString().slice(0,10),hr=dt.getHours();
  try{
    const isOld=(Date.now()-dt.getTime())>5*864e5;
    const base=isOld?'https://archive-api.open-meteo.com/v1/archive':'https://api.open-meteo.com/v1/forecast';
    const url=`${base}?latitude=${lat}&longitude=${lon}&start_date=${day}&end_date=${day}&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
    const res=await fetch(url);
    if(res.ok){
      const j=await res.json(),H=j.hourly||{};
      const t=Math.round(H.temperature_2m?.[hr]??18),app=Math.round(H.apparent_temperature?.[hr]??t),hum=Math.round(H.relative_humidity_2m?.[hr]??62),wind=Math.round(H.wind_speed_10m?.[hr]??11),code=H.weather_code?.[hr]??1;
      const w={t,app,hum,wind,label:WX_ICONS[code]||'🌤️ Ameno'};
      wxCache[key]=w;setJSON('kr_wx',wxCache);return w;
    }
  }catch(e){}
  // Estimativa meteorológica sazonal caso esteja offline
  const m=dt.getMonth(),baseT=[11,12,15,17,20,24,27,27,24,19,15,12][m]||17;
  const hAdj=hr<9?-3:hr>18?-2:2;
  const t=baseT+hAdj,w={t,app:t,hum:60,wind:12,label:t>=22?'☀️ Quente e soalheiro':'⛅ Ameno'};
  return w;
}

// ---------- 6. Objetivos Personalizados (Semanal, Mensal, Anual por desporto e métrica) ----------
const getGoals=()=>getJSON('kr_goals',[
  {id:'g_wk_run',period:'Semana',sport:'Corrida',metric:'km',target:+ls('kr_goal',20)||20},
  {id:'g_mo_all',period:'Mês',sport:'Todos',metric:'km',target:80},
  {id:'g_yr_all',period:'Ano',sport:'Todos',metric:'km',target:800}
]);
const setGoals=g=>{setJSON('kr_goals',g);const wk=g.find(x=>x.period==='Semana'&&x.metric==='km');if(wk)ss('kr_goal',String(wk.target))};

function evalGoal(g){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  const t0=g.period==='Semana'?wkStart():g.period==='Mês'?new Date(y,m,1).getTime():new Date(y,0,1).getTime();
  const list=acts.filter(a=>a.date>=t0&&(g.sport==='Todos'||a.type===g.sport));
  const val=g.metric==='km'?list.reduce((s,a)=>s+a.dist,0)/1000:g.metric==='horas'?list.reduce((s,a)=>s+a.dur,0)/3600:list.reduce((s,a)=>s+a.elev,0);
  const pct=Math.min(100,Math.round(val/Math.max(1,g.target)*100));
  return{val,pct};
}

// ---------- 7. Planos de Treino Estruturados & Prevenção de Lesões (Recover Athletics) ----------
const TRAINING_PLANS=[
  {id:'p_5k',name:'Plano 5 km (4 semanas)',sport:'Corrida',weeks:4,desc:'Ideal para ganhar velocidade ou completar os teus primeiros 5 km fortes.',
   schedule:[['Caminhar e correr','Corpo inteiro','Corrida fácil'],['Intervalos curtos','Mobilidade de anca','Corrida fácil'],['Fartlek','Pernas e core','Corrida progressiva'],['Corrida de recuperação','Intervalos curtos','Corrida progressiva']]},
  {id:'p_10k',name:'Plano 10 km (6 semanas)',sport:'Corrida',weeks:6,desc:'Combina base aeróbica, limiar e força específica para 10 km.',
   schedule:[['Corrida fácil','Corpo inteiro','Corrida progressiva'],['Intervalos curtos','Yoga para pernas de corredor','Corrida fácil'],['Treino de limiar','Pernas e core','Corrida fácil'],['Repetições em subida','Mobilidade de anca','Corrida progressiva'],['Intervalos longos 4×4','Corpo inteiro','Corrida fácil'],['Corrida de recuperação','Fartlek','Corrida progressiva']]},
  {id:'p_hm',name:'Meia Maratona 21,1 km (8 semanas)',sport:'Corrida',weeks:8,desc:'Resistência progressiva, limiar de lactato e prevenção de lesões.',
   schedule:[['Corrida fácil','Pernas e core','Corrida progressiva'],['Intervalos curtos','Mobilidade de anca','Corrida fácil'],['Treino de limiar','Corpo inteiro','Corrida progressiva'],['Repetições em subida','Yoga para pernas de corredor','Corrida fácil'],['Intervalos longos 4×4','Pernas e core','Corrida progressiva'],['Treino de limiar','Mobilidade de anca','Corrida fácil'],['Fartlek','Alongamentos pós-treino','Corrida progressiva'],['Corrida de recuperação','Yoga para relaxar','Corrida fácil']]},
  {id:'p_bike',name:'Gran Fondo Ciclismo (4 semanas)',sport:'Bicicleta',weeks:4,desc:'Aumenta a potência sustentável (FTP) e a resistência no selim.',
   schedule:[['Pedalada de base','Pernas e core','Recuperação ativa'],['Sweet spot 3×10','Mobilidade de anca','Pedalada de base'],['Sprints 6×30','Corpo inteiro','Sweet spot 3×10'],['Recuperação ativa','Pedalada de base','Sweet spot 3×10']]}
];

const RECOVER_ROUTINES={
  'Joelho':{title:'Prevenção e Alívio do Joelho',sport:'Mobilidade',why:'Fortalece glúteo médio e quadricípite sem sobrecarga patelar (Recover Athletics).',
    steps:[['Respiração inicial',45,'Relaxa a tensão articular.'],['Ponte de glúteos',50,'Ativa os glúteos para estabilizar o joelho.'],['Dead bug',45,'Controlo lombo-pélvico.'],['Passada lateral',45,'Estabilidade lateral da anca e joelho.'],['Quadricípite',45,'Alonga suavemente a parte frontal da coxa.'],['Figura 4 deitado',60,'Solta o piriforme e a banda iliotibial.']]},
  'Gémeos e Aquiles':{title:'Recuperação de Gémeos e Aquiles',sport:'Mobilidade',why:'Reduz a tensão no tendão de Aquiles e melhora a dorsiflexão do tornozelo.',
    steps:[['Círculos de anca',45,'Solta a cadeia posterior.'],['Elevação de gémeos',50,'Sobe em 2s e desce devagar em 4s (excêntrico).'],['Gémeos',60,'Alongamento contra a parede, calcanhar no chão.'],['Cão a olhar para baixo',60,'Pedala os calcanhares suavemente.'],['Pernas na parede',90,'Drenagem e alívio das pernas.']]},
  'Anca e Glúteos':{title:'Mobilidade e Estabilidade da Anca',sport:'Mobilidade',why:'Desbloqueia os flexores da anca e ativa os estabilizadores da corrida.',
    steps:[['Círculos de anca',50,'Movimentos amplos e controlados.'],['Afundo baixo',60,'Abre o psoas e flexor da anca.'],['Pombo',60,'Libertação profunda do glúteo.'],['Ponte de glúteos',50,'Ativação dos extensores da anca.'],['Borboleta',60,'Relaxa os adutores.']]},
  'Isquiotibiais':{title:'Proteção dos Isquiotibiais',sport:'Alongamentos',why:'Trabalha comprimento e tensão controlada da parte posterior da coxa.',
    steps:[['Gato e vaca',45,'Mobiliza a coluna e bacia.'],['Ponte de glúteos',50,'Apoia os calcanhares ligeiramente mais longe.'],['Isquiotibiais',60,'Alongamento suave sem dor aguda.'],['Flexão à frente',50,'Joelhos ligeiramente fletidos.'],['Relaxamento final',60,'Respira fundo.']]},
  'Lombar':{title:'Alívio Lombar e Core Profundo',sport:'Yoga',why:'Descomprime a zona lombar e ativa a cintura abdominal.',
    steps:[['Gato e vaca',60,'Alterna suavemente ao ritmo da respiração.'],['Criança',60,'Alongamento lombar passivo.'],['Dead bug',50,'Lombar colada ao chão.'],['Torção deitado',60,'Solta a tensão paravertebral.'],['Joelhos ao peito',60,'Massaja a lombar no chão.']]},
  'Canelas e Pés':{title:'Prevenção de Canelite e Fascite Plantar',sport:'Mobilidade',why:'Reforça a musculatura intrínseca do pé e tibial.',
    steps:[['Elevação de gémeos',45,'Controlo lento do tornozelo.'],['Agachamento profundo',50,'Mobilidade de tornozelo e tendão.'],['Gémeos',50,'Alonga gémeo e solear.'],['Afundo baixo',50,'Mobilidade global do membro inferior.'],['Pernas na parede',90,'Recuperação circulatória.']]}
};

// ---------- 8. Vista de Detalhe Enriquecida (GAP, Zonas, Meteorologia, Segmentos, Atividades Comparáveis) ----------
async function enhanceDetail(a){
  const d=document.querySelector('#detail');if(!d)return;
  const old=d.querySelector('#kr-pro-detail');if(old)old.remove();
  const m=analyzeAct(a),hasG=a.pts&&a.pts.length>1;
  const segs=hasG?getActSegments(a):[];
  const matched=hasG?getMatchedActs(a):[];
  const box=document.createElement('div');box.id='kr-pro-detail';

  const zNames=['Z1 Recuperação','Z2 Resistência','Z3 Tempo / Ritmo','Z4 Limiar','Z5 VO2 Máx'];
  const zColors=['#60a5fa','#34d399','#fbbf24','#f97316','#ef4444'];

  box.innerHTML=`
  <div class="card" id="kr-wx-card"><div class="sh" style="margin-bottom:6px"><b>🌤️ Meteorologia e Esforço Avançado</b><span class="mu" id="kr-wx-txt">${hasG?'A obter meteorologia…':'Sessão indoor'}</span></div>
    <div class="row" style="margin-top:6px">
      <div><div class="big">${m.gapStr}</div><div class="mu">GAP (Ritmo Ajust. Inclinação)</div></div>
      <div><div class="big" style="color:var(--ac)">${m.relEffort}</div><div class="mu">Esforço Relativo</div></div>
      <div><div class="big">${m.avgW} W</div><div class="mu">Potência est.</div></div>
      <div><div class="big">${m.avgHr} bpm</div><div class="mu">FC média est. (máx ${m.maxHr})</div></div>
    </div>
  </div>
  <div class="card"><b>📊 Zonas de Ritmo e Frequência Cardíaca</b>
    <div class="mu" style="margin:6px 0 4px">Distribuição por Zona de Ritmo (GAP)</div>
    ${m.pZones.map((pct,i)=>`<div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:13px"><span style="width:115px" class="mu">${zNames[i]}</span><div style="flex:1;height:8px;background:var(--bd);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${zColors[i]}"></i></div><b style="width:36px;text-align:right">${pct}%</b></div>`).join('')}
    <div class="mu" style="margin:12px 0 4px">Distribuição por Zona Cardíaca</div>
    <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;margin-bottom:4px">${m.hrZones.map((pct,i)=>`<div style="width:${pct}%;background:${zColors[i]}" title="${zNames[i]}: ${pct}%"></div>`).join('')}</div>
    <div class="mu" style="font-size:12px">${m.hrZones.map((pct,i)=>`Z${i+1}: ${pct}%`).join(' · ')}</div>
  </div>
  ${m.splits.length?`<div class="card"><b>⏱️ Análise Avançada de Voltas (Ritmo, GAP & Potência)</b>
    <table style="margin-top:8px;font-size:13px"><tr><th>Km</th><th>Ritmo</th><th>GAP</th><th>Desnível</th><th>Potência</th></tr>
    ${m.splits.map(s=>`<tr><td>${s.km}</td><td>${fT(s.t)}</td><td><b>${fT(s.gap)}</b></td><td>+${s.gain}m / -${s.loss}m</td><td>${s.w} W</td></tr>`).join('')}</table>
  </div>`:''}
  ${hasG?`<div class="card"><div class="sh" style="margin-bottom:8px"><b>🏁 Esforços de Segmentos (${segs.length})</b><button class="btn" id="kr-mk-seg" style="padding:4px 10px;font-size:12px">+ Criar segmento</button></div>
    ${segs.length?segs.map((s,idx)=>`<div class="fr" style="cursor:pointer" data-seg="${idx}">
      <div><b>${s.isKOM?'👑 ':''}${s.isPR?'🏅 ':''}${esc(s.seg.name)}</b><div class="mu">${(s.seg.dist/1000).toFixed(2)} km · ${s.isKOM?'1.º Geral (KOM/QOM)':s.lbRank+'º na tabela'} · ${s.isPR?'Recorde Pessoal!':'+'+fT(s.diffPr)+' vs RP'}</div></div>
      <div style="text-align:right"><b>${fT(s.time)}</b><div class="mu">${fP(s.seg.dist,s.time)}</div></div>
    </div>`).join(''):'<p class="mu" style="margin:0">Esta atividade é curta para segmentos automáticos, mas podes criar um segmento personalizado no botão acima.</p>'}
  </div>`:''}
  ${matched.length>1?`<div class="card"><b>🔁 Atividades Comparáveis (${matched.length} neste percurso)</b>
    <p class="mu">Evolução do teu desempenho sempre que fazes este mesmo percurso:</p>
    <table style="font-size:13px"><tr><th>Data</th><th>Atividade</th><th>Tempo</th><th>Ritmo</th></tr>
    ${matched.map(x=>`<tr style="${x.id===a.id?'color:var(--ac);font-weight:700':''}"><td>${new Date(x.date).toLocaleDateString('pt-PT')}</td><td>${esc(x.name)}</td><td>${fT(x.dur)}</td><td>${pace(x)}</td></tr>`).join('')}</table>
  </div>`:''}`;

  d.appendChild(box);
  box.querySelectorAll('[data-seg]').forEach(el=>el.onclick=()=>openSegmentModal(segs[+el.dataset.seg].seg));
  const mkBtn=box.querySelector('#kr-mk-seg');
  if(mkBtn)mkBtn.onclick=()=>{
    const nm=prompt('Nome para o novo segmento (usa os primeiros 50% a 80% deste percurso ou o percurso completo):',a.name+' — Segmento');
    if(!nm)return;
    const p=a.pts,i0=Math.floor(p.length*0.1),i1=Math.max(i0+1,Math.floor(p.length*0.85));
    let dist=0;for(let i=i0+1;i<=i1;i++)dist+=hav(p[i-1],p[i]);
    if(dist<100){toast('Percurso demasiado curto');return}
    const seg={id:'seg_'+Date.now(),name:nm.slice(0,50),dist:Math.round(dist),kind:'geo',start:[p[i0][0],p[i0][1]],end:[p[i1][0],p[i1][1]],pts:p.slice(i0,i1+1).map(x=>[x[0],x[1]])};
    saveCustomSeg(seg);toast('Segmento criado!');enhanceDetail(a);
  };

  if(hasG){
    const w=await fetchWeather(a);
    const wt=box.querySelector('#kr-wx-txt');
    if(w&&wt)wt.textContent=`${w.label} · ${w.t}°C (sensação ${w.app}°C) · Vento ${w.wind} km/h · Humidade ${w.hum}%`;
  }
}

// Modal de Tabela de Classificação de Segmento (filtrada por Todos, Amigos, Ano, Mês, Os meus esforços)
function openSegmentModal(seg,flt='all'){
  let gm=document.getElementById('gm');if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}
  gm.classList.add('on');
  const efforts=getSegEfforts(seg,flt);
  const filters=[['all','Global / Amigos'],['year','Este ano'],['month','Este mês'],['mine','Os meus esforços']];
  gm.innerHTML=`<div class="gh"><b>🏁 ${esc(seg.name)}</b><button class="btn" id="gx">Fechar</button></div>
    <p class="mu">Distância: ${(seg.dist/1000).toFixed(2)} km · Tabela de Classificação de Segmento</p>
    <div class="chips">${filters.map(([k,l])=>`<button class="chip ${k===flt?'on':''}" data-f="${k}">${l}</button>`).join('')}</div>
    <div class="card">
      ${efforts.length?`<table style="font-size:14px"><tr><th>#</th><th>Atleta</th><th>Data</th><th>Tempo</th><th>Ritmo</th></tr>
      ${efforts.slice(0,25).map((e,i)=>`<tr style="${e.isMe?'color:var(--ac);font-weight:700':''}"><td>${i===0?'👑 1':i+1}</td><td>${esc(e.athlete)}<div class="mu" style="font-size:11px">${esc(e.actName)}</div></td><td>${new Date(e.date).toLocaleDateString('pt-PT')}</td><td><b>${fT(e.time)}</b></td><td>${fP(seg.dist,e.time)}</td></tr>`).join('')}</table>`:'<p class="mu">Ainda sem esforços registados neste filtro.</p>'}
    </div>`;
  gm.querySelector('#gx').onclick=()=>gm.classList.remove('on');
  gm.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>openSegmentModal(seg,b.dataset.f));
}

// ---------- 9. Mapas Pro: Heatmap Pessoal, Criador de Rotas, Rotas Offline e Segmentos ----------
let mapMode='heat',heatTheme='orange',routePts=[],offlineRoutes=getJSON('kr_off_routes',[]),proLayer=null,clickHandlerBound=false;

function setupMapsPro(){
  const sec=document.querySelector('#maps');if(!sec)return;
  let bar=sec.querySelector('#kr-map-bar');
  if(!bar){
    bar=document.createElement('div');bar.id='kr-map-bar';
    sec.insertBefore(bar,sec.firstChild);
  }
  bar.innerHTML=`
    <div class="chips" style="margin-bottom:8px">
      <button class="chip ${mapMode==='heat'?'on':''}" data-mm="heat">🔥 Heatmap Pessoal</button>
      <button class="chip ${mapMode==='builder'?'on':''}" data-mm="builder">🧭 Criar / Sugerir Rota</button>
      <button class="chip ${mapMode==='offline'?'on':''}" data-mm="offline">📥 Mapas Offline (${offlineRoutes.length})</button>
      <button class="chip ${mapMode==='segs'?'on':''}" data-mm="segs">🏁 Segmentos (${getAllSegs().length})</button>
    </div>
    <div id="kr-map-sub" class="card" style="padding:10px 12px;margin-bottom:8px"></div>`;
  bar.querySelectorAll('[data-mm]').forEach(b=>b.onclick=()=>{mapMode=b.dataset.mm;renderMapsPro()});
  renderMapsPro();
}

function renderMapsPro(){
  const sub=document.querySelector('#kr-map-sub');if(!sub)return;
  if(!window.L||!window.amap){sub.innerHTML='<span class="mu">Mapa a inicializar…</span>';return}
  if(!proLayer)proLayer=L.layerGroup().addTo(amap);
  proLayer.clearLayers();
  if(!clickHandlerBound){
    clickHandlerBound=true;
    amap.on('click',e=>{
      if(mapMode!=='builder')return;
      routePts.push([+e.latlng.lat.toFixed(5),+e.latlng.lng.toFixed(5)]);
      renderMapsPro();
    });
  }

  if(mapMode==='heat'){
    const colors={orange:['#fc4c02','#ff9e00'],fire:['#ef4444','#fde047'],cyan:['#06b6d4','#a5f3fc']}[heatTheme]||['#fc4c02','#ff9e00'];
    if(window.alay)alay.clearLayers();
    const all=[];
    acts.forEach(a=>{
      if(!a.pts||a.pts.length<2)return;
      const ll=a.pts.map(p=>[p[0],p[1]]);ll.forEach(p=>all.push(p));
      L.polyline(ll,{color:colors[0],weight:7,opacity:0.22,lineCap:'round'}).addTo(proLayer);
      L.polyline(ll,{color:colors[1],weight:2.5,opacity:0.85,lineCap:'round'}).addTo(proLayer);
    });
    sub.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span class="mu">🔥 <b>Mapa de Calor Pessoal:</b> ${acts.filter(a=>a.pts&&a.pts.length>1).length} percursos acumulados</span>
      <div style="display:flex;gap:6px">
        <button class="btn ${heatTheme==='orange'?'pri':''}" data-ht="orange" style="padding:4px 8px;font-size:12px">Laranja</button>
        <button class="btn ${heatTheme==='fire'?'pri':''}" data-ht="fire" style="padding:4px 8px;font-size:12px">Fogo</button>
        <button class="btn ${heatTheme==='cyan'?'pri':''}" data-ht="cyan" style="padding:4px 8px;font-size:12px">Névoa Azul</button>
      </div>
    </div>`;
    sub.querySelectorAll('[data-ht]').forEach(b=>b.onclick=()=>{heatTheme=b.dataset.ht;renderMapsPro()});
  }else if(mapMode==='builder'){
    let dist=0;for(let i=1;i<routePts.length;i++)dist+=hav(routePts[i-1],routePts[i]);
    if(routePts.length){
      L.polyline(routePts,{color:'#10b981',weight:4,dashArray:'6 4'}).addTo(proLayer);
      routePts.forEach((p,i)=>L.circleMarker(p,{radius:i===0?7:5,color:'#fff',fillColor:i===0?'#10b981':'#fc4c02',fillOpacity:1}).addTo(proLayer));
    }
    sub.innerHTML=`<div class="mu" style="margin-bottom:6px">Toca no mapa para desenhar o teu percurso ou gera uma rota circular automática:</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <b>${(dist/1000).toFixed(2)} km</b> <span class="mu">(~${Math.round(dist/1000*5.5)} min a correr)</span>
        <button class="btn" id="rb-loop" style="padding:4px 8px;font-size:12px">🔄 Gerar circuito 5 km</button>
        <button class="btn" id="rb-undo" style="padding:4px 8px;font-size:12px">↩ Desfazer</button>
        <button class="btn" id="rb-clr" style="padding:4px 8px;font-size:12px">Limpar</button>
        ${routePts.length>1?`<button class="btn pri" id="rb-save" style="padding:4px 10px;font-size:12px">📥 Guardar Offline</button><button class="btn" id="rb-gpx" style="padding:4px 8px;font-size:12px">GPX</button>`:''}
      </div>`;
    sub.querySelector('#rb-loop').onclick=()=>{
      const c=amap.getCenter(),rKm=+(prompt('Distância desejada para a rota circular (km):','5')||5);
      if(rKm<=0)return;
      const rad=(rKm*1000)/(2*Math.PI),pts=[],n=16;
      const cLat=c.lat+(rad/111320)*0.7,cLon=c.lng;
      for(let i=0;i<=n;i++){
        const a=(i/n)*2*Math.PI;
        pts.push([+(cLat-(rad*Math.cos(a))/111320).toFixed(5),+(cLon+(rad*Math.sin(a))/(111320*Math.cos(c.lat*R))).toFixed(5)]);
      }
      routePts=pts;amap.fitBounds(pts,{padding:[20,20]});renderMapsPro();
    };
    sub.querySelector('#rb-undo').onclick=()=>{routePts.pop();renderMapsPro()};
    sub.querySelector('#rb-clr').onclick=()=>{routePts=[];renderMapsPro()};
    if(sub.querySelector('#rb-save'))sub.querySelector('#rb-save').onclick=()=>saveOfflineRoute(routePts,dist);
    if(sub.querySelector('#rb-gpx'))sub.querySelector('#rb-gpx').onclick=()=>exportGPX({name:'Rota Planeada KeepRun',type:'Corrida',pts:routePts.map((p,i)=>[p[0],p[1],0,Date.now()+i*10000])});
  }else if(mapMode==='offline'){
    sub.innerHTML=`<div class="mu" style="margin-bottom:6px"><b>Mapas de Rotas Offline:</b> descarrega rotas e os mosaicos do mapa para usar sem internet.</div>
      ${offlineRoutes.length?offlineRoutes.map((r,i)=>`<div class="fr">
        <div><b>${esc(r.name)}</b><div class="mu">${(r.dist/1000).toFixed(2)} km · ${r.cached?'✅ Mapa offline guardado':'Mapa em cache'}</div></div>
        <div><button class="btn pri" data-ov="${i}" style="padding:4px 8px;font-size:12px">Ver no mapa</button> <button class="btn" data-od="${i}" style="padding:4px 8px;font-size:12px">✕</button></div>
      </div>`).join(''):'<p class="mu" style="margin:0">Ainda não tens rotas offline. Usa "Criar / Sugerir Rota" para guardar uma rota offline.</p>'}`;
    sub.querySelectorAll('[data-ov]').forEach(b=>b.onclick=()=>{
      const r=offlineRoutes[+b.dataset.ov];if(!r)return;
      proLayer.clearLayers();const pl=L.polyline(r.pts,{color:'#10b981',weight:5}).addTo(proLayer);amap.fitBounds(pl.getBounds(),{padding:[20,20]});
    });
    sub.querySelectorAll('[data-od]').forEach(b=>b.onclick=()=>{offlineRoutes.splice(+b.dataset.od,1);setJSON('kr_off_routes',offlineRoutes);setupMapsPro()});
  }else if(mapMode==='segs'){
    const segs=getAllSegs();
    segs.forEach(s=>{if(s.pts&&s.pts.length>1)L.polyline(s.pts,{color:'#eab308',weight:5}).addTo(proLayer)});
    sub.innerHTML=`<div class="mu" style="margin-bottom:6px">Toca num segmento para ver a Tabela de Classificação (Global, Amigos, Ano, Mês, RP):</div>
      ${segs.map((s,i)=>{const lb=getSegEfforts(s,'mine');return `<div class="fr" style="cursor:pointer" data-sg="${i}">
        <div><b>🏁 ${esc(s.name)}</b><div class="mu">${(s.dist/1000).toFixed(2)} km · ${lb.length?`O teu RP: ${fT(lb[0].time)} (${fP(s.dist,lb[0].time)})`:'Sem tentativas ainda'}</div></div>
        <button class="btn" style="padding:4px 8px;font-size:12px">Classificação</button>
      </div>`}).join('')}`;
    sub.querySelectorAll('[data-sg]').forEach(el=>el.onclick=()=>openSegmentModal(segs[+el.dataset.sg]));
  }
}

async function saveOfflineRoute(pts,dist){
  const name=prompt('Nome para a rota offline:','Rota '+new Date().toLocaleDateString('pt-PT'));if(!name)return;
  const r={id:'rt_'+Date.now(),name:name.slice(0,50),dist:Math.round(dist),pts:pts.slice(0,500),cached:true};
  offlineRoutes.unshift(r);offlineRoutes=offlineRoutes.slice(0,20);setJSON('kr_off_routes',offlineRoutes);
  // Pré-carregar mosaicos (tiles) OpenStreetMap do percurso para a cache do navegador
  try{
    if('caches' in window){
      const c=await caches.open('keeprun-tiles-v1'),urls=new Set();
      const z=14,lat2y=(la)=>Math.floor((1-Math.log(Math.tan(la*R)+1/Math.cos(la*R))/Math.PI)/2*(1<<z)),lon2x=(lo)=>Math.floor((lo+180)/360*(1<<z));
      pts.forEach(p=>{const x=lon2x(p[1]),y=lat2y(p[0]);urls.add(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`)});
      await Promise.all([...urls].slice(0,24).map(u=>fetch(u,{mode:'cors'}).then(res=>res.ok?c.put(u,res):null).catch(()=>{})));
    }
  }catch(e){}
  mapMode='offline';setupMapsPro();toast('Rota e mapa guardados para uso offline!');
}

// ---------- 10. Gravação Pro: Strava Beacon (Segurança em Tempo Real) e Live Segments ----------
let beaconOn=ls('kr_beacon','0')==='1',beaconContacts=getJSON('kr_beacon_c',[]),beaconId=ls('kr_beacon_id','');
if(!beaconId){const b=new Uint32Array(3);crypto.getRandomValues(b);beaconId='BCN-'+Array.from(b,x=>(x%36).toString(36)).join('').toUpperCase().slice(0,8);ss('kr_beacon_id',beaconId)}

function setupRecPro(){
  const recCard=document.querySelector('#rec .card');if(!recCard||recCard.querySelector('#kr-rec-pro'))return;
  const box=document.createElement('div');box.id='kr-rec-pro';
  box.innerHTML=`
    <div id="kr-live-seg" class="card hide" style="background:#1e293b;border-color:#eab308;margin:10px 0"></div>
    <div class="card" style="background:var(--bg);margin:10px 0;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <div><b>📡 KeepRun Beacon (Segurança em tempo real)</b><div class="mu" id="kr-bcn-st">${beaconOn?'Ativo: partilha de localização pronta':'Desativado: partilha a tua posição com contactos de segurança'}</div></div>
        <div style="display:flex;gap:6px">
          <button class="btn ${beaconOn?'pri':''}" id="kr-bcn-tg" style="padding:5px 10px;font-size:12px">${beaconOn?'📡 Beacon ON':'Ativar Beacon'}</button>
          <button class="btn" id="kr-bcn-sh" style="padding:5px 10px;font-size:12px">Enviar Link SOS</button>
        </div>
      </div>
    </div>`;
  recCard.appendChild(box);
  box.querySelector('#kr-bcn-tg').onclick=()=>{
    beaconOn=!beaconOn;ss('kr_beacon',beaconOn?'1':'0');
    if(beaconOn&&!beaconContacts.length){
      const c=prompt('Contacto de segurança (nome ou telefone para emergências):','Contacto de Emergência');
      if(c){beaconContacts=[c.slice(0,50)];setJSON('kr_beacon_c',beaconContacts)}
    }
    box.querySelector('#kr-bcn-tg').classList.toggle('pri',beaconOn);
    box.querySelector('#kr-bcn-tg').textContent=beaconOn?'📡 Beacon ON':'Ativar Beacon';
    box.querySelector('#kr-bcn-st').textContent=beaconOn?`Ativo (${beaconContacts[0]||'Contacto configurado'}) · ID ${beaconId}`:'Desativado';
  };
  box.querySelector('#kr-bcn-sh').onclick=async()=>{
    const lastPt=(window.rp&&rp.length)?rp[rp.length-1]:null;
    const mapUrl=lastPt?`https://www.openstreetmap.org/?mlat=${lastPt[0].toFixed(5)}&mlon=${lastPt[1].toFixed(5)}#map=16/${lastPt[0].toFixed(5)}/${lastPt[1].toFixed(5)}`:'https://www.openstreetmap.org';
    let bat='';try{if(navigator.getBattery){const b=await navigator.getBattery();bat=` · Bateria ${Math.round(b.level*100)}%`}}catch(e){}
    const msg=`📡 KeepRun Beacon (${ls('kr_name','Atleta')}) — Estou a treinar agora (${$('#rt')?.textContent||'00:00'}, ${$('#rd')?.textContent||'0.00'} km${bat}). Localização em tempo real: ${mapUrl}`;
    if(navigator.share)navigator.share({title:'KeepRun Beacon',text:msg}).catch(()=>{});
    else{try{navigator.clipboard.writeText(msg)}catch(e){}toast('Link Beacon copiado para enviar aos contactos!')}
  };
}

// Monitorização em tempo real de Live Segments durante a gravação GPS (com cache de RP)
let prCacheActs=-1,prCacheMap={};
function getCachedSegPr(target){
  if(prCacheActs!==acts.length){prCacheActs=acts.length;prCacheMap={}}
  if(prCacheMap[target.id]==null){const e=getSegEfforts(target,'mine');prCacheMap[target.id]=e.length?e[0].time:Math.round(target.dist*0.30)}
  return prCacheMap[target.id];
}
setInterval(()=>{
  const stopBtn=document.querySelector('#rstop'),liveBox=document.querySelector('#kr-live-seg');
  if(!stopBtn||stopBtn.classList.contains('hide')||!liveBox||!window.rp||rp.length<2){if(liveBox)liveBox.classList.add('hide');return}
  const c=calc(rp),curD=c.dist,curT=(Date.now()-t0)/1000;
  // Verifica Live Segment de 400m, 1km ou 5km em curso
  const target=curD<400?DEFAULT_SEGS[0]:curD<1000?DEFAULT_SEGS[1]:DEFAULT_SEGS[2];
  const pr=getCachedSegPr(target);
  const rem=Math.max(0,target.dist-(curD%target.dist)),progInSeg=target.dist-rem;
  const expT=pr*(progInSeg/target.dist),segElapsed=curT*(progInSeg/Math.max(1,curD)),delta=Math.round(segElapsed-expT);
  liveBox.classList.remove('hide');
  liveBox.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center">
    <div><b style="color:#fde047">⚡ LIVE SEGMENT: ${esc(target.name)}</b><div class="mu">Faltam ${Math.round(rem)} m para fechar o segmento</div></div>
    <div style="text-align:right"><b style="font-size:20px;color:${delta<=0?'#34d399':'#f87171'}">${delta<=0?delta+'s (Adiantado)':'+'+delta+'s vs RP'}</b><div class="mu">Meta RP: ${fT(pr)}</div></div>
  </div>`;
},1500);

// ---------- 11. Separador Eu (#stats): Fitness & Freshness, Esforço Relativo, Training Log, Objetivos e Estatísticas Cumulativas ----------
function enhanceStats(){
  const s=document.querySelector('#stats');if(!s)return;
  const old=s.querySelector('#kr-pro-stats');if(old)old.remove();
  const ff=calcFitnessCurve(42),prof=getProf(),goals=getGoals();
  const box=document.createElement('div');box.id='kr-pro-stats';

  // Gráfico SVG de Fitness & Freshness (Condição Física, Fadiga e Forma)
  const ptsFit=[],ptsFat=[],ptsForm=[],n=ff.series.length||1,maxY=Math.max(40,...ff.series.map(x=>Math.max(x.fitness,x.fatigue,Math.abs(x.form))));
  ff.series.forEach((x,i)=>{
    const px=Math.round((i/Math.max(1,n-1))*680)+10;
    const py=v=>Math.round(115-clamp((v+20)/(maxY+30),0,1)*100);
    ptsFit.push(`${px},${py(x.fitness)}`);
    ptsFat.push(`${px},${py(x.fatigue)}`);
    ptsForm.push(`${px},${py(x.form)}`);
  });

  // Registo de Treino (Training Log - últimas 4 semanas com bolhas diárias, seguro para mudança de hora DST)
  const w0=wkStart(),logWeeks=[];
  for(let w=0;w<4;w++){
    const wsDate=new Date(w0);wsDate.setDate(wsDate.getDate()-w*7);wsDate.setHours(0,0,0,0);
    const ws=wsDate.getTime(),days=[];let wkKm=0,wkDur=0,wkRe=0;
    for(let d=0;d<7;d++){
      const dStart=new Date(ws);dStart.setDate(dStart.getDate()+d);dStart.setHours(0,0,0,0);
      const dEnd=new Date(dStart);dEnd.setDate(dEnd.getDate()+1);
      const d0=dStart.getTime(),d1=dEnd.getTime(),da=acts.filter(a=>a.date>=d0&&a.date<d1);
      const km=da.reduce((q,a)=>q+a.dist,0)/1000,dur=da.reduce((q,a)=>q+a.dur,0),re=da.reduce((q,a)=>q+analyzeAct(a).relEffort,0);
      wkKm+=km;wkDur+=dur;wkRe+=re;
      days.push({d:'STQQSSD'[d],km,dur,re,sp:da[0]?.type||''});
    }
    logWeeks.push({label:new Date(ws).toLocaleDateString('pt-PT',{day:'numeric',month:'short'}),wkKm,wkDur,wkRe,days});
  }

  // Estatísticas cumulativas (Mês atual vs Mês anterior & Ano atual vs Ano anterior)
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  const mCur0=new Date(y,m,1).getTime(),mPrev0=new Date(y,m-1,1).getTime();
  const yCur0=new Date(y,0,1).getTime(),yPrev0=new Date(y-1,0,1).getTime(),yPrevSame=new Date(y-1,m,now.getDate()).getTime();
  const sumKm=arr=>arr.reduce((q,a)=>q+a.dist,0)/1000;
  const kmMCur=sumKm(acts.filter(a=>a.date>=mCur0)),kmMPrev=sumKm(acts.filter(a=>a.date>=mPrev0&&a.date<mCur0));
  const kmYCur=sumKm(acts.filter(a=>a.date>=yCur0)),kmYPrev=sumKm(acts.filter(a=>a.date>=yPrev0&&a.date<=yPrevSame));

  box.innerHTML=`
  <div class="card">
    <div class="sh" style="margin-bottom:6px"><b>📈 Fitness & Freshness (Condição Física, Fadiga e Forma)</b><span class="mu">${ff.status}</span></div>
    <div class="row" style="margin:8px 0">
      <div><div class="big" style="color:#fc4c02">${ff.cur.fitness}</div><div class="mu">Condição Física (CTL)</div></div>
      <div><div class="big" style="color:#a855f7">${ff.cur.fatigue}</div><div class="mu">Fadiga (ATL)</div></div>
      <div><div class="big" style="color:#10b981">${ff.cur.form>0?'+'+ff.cur.form:ff.cur.form}</div><div class="mu">Forma (TSB)</div></div>
      <div><div class="big">${ff.cur.load}</div><div class="mu">Esforço Relativo Hoje</div></div>
    </div>
    <svg viewBox="0 0 700 125" style="width:100%;height:125px;background:var(--bg);border-radius:8px;padding:4px">
      <line x1="10" y1="95" x2="690" y2="95" stroke="#333" stroke-dasharray="4 4"/>
      <polyline fill="none" stroke="#fc4c02" stroke-width="2.6" points="${ptsFit.join(' ')}"/>
      <polyline fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="4 3" points="${ptsFat.join(' ')}"/>
      <polyline fill="none" stroke="#10b981" stroke-width="2" points="${ptsForm.join(' ')}"/>
    </svg>
    <div class="mu" style="font-size:12px;margin-top:4px">🟠 Condição Física (42d) · 🟣 Fadiga (7d) · 🟢 Forma (Fitness − Fadiga)</div>
  </div>
  <div class="card">
    <div class="sh" style="margin-bottom:8px"><b>🗓️ Registo de Treino (Training Log)</b><span class="mu">Últimas 4 semanas</span></div>
    ${logWeeks.map(w=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--bd)">
      <div style="width:88px"><b style="font-size:13px">${w.label}</b><div class="mu" style="font-size:11px">${w.wkKm.toFixed(1)} km · RE ${w.wkRe}</div></div>
      <div style="flex:1;display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">
        ${w.days.map(d=>{const sz=d.dur?clamp(Math.round(18+d.dur/180),20,38):18;return `<div style="display:flex;flex-direction:column;align-items:center"><div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${d.dur?'#fc4c0233':'var(--bg)'};border:1.5px solid ${d.dur?'var(--ac)':'var(--bd)'};display:grid;place-items:center;font-size:11px" title="${d.km.toFixed(1)} km">${d.dur?(window.ic?ic(d.sp):'🏃'):d.d}</div></div>`}).join('')}
      </div>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="sh" style="margin-bottom:8px"><b>🎯 Objetivos Personalizados</b><button class="btn" id="kr-add-goal" style="padding:4px 10px;font-size:12px">+ Novo objetivo</button></div>
    ${goals.map((g,i)=>{const ev=evalGoal(g);return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:13px"><b>${esc(g.period)} · ${esc(g.sport)} (${ev.val.toFixed(1)} / ${g.target} ${esc(g.metric)})</b><a data-dg="${i}" style="color:var(--mu);cursor:pointer">Remover</a></div>
      <div class="prog"><i style="width:${ev.pct}%"></i></div>
    </div>`}).join('')}
  </div>
  <div class="card">
    <b>📊 Estatísticas Cumulativas e Comparação Temporal</b>
    <div class="row" style="margin-top:8px">
      <div><div class="big">${kmMCur.toFixed(1)} km</div><div class="mu">Este mês (vs ${kmMPrev.toFixed(1)} km mês ant.)</div></div>
      <div><div class="big">${kmYCur.toFixed(1)} km</div><div class="mu">Este ano (vs ${kmYPrev.toFixed(1)} km período homólogo)</div></div>
    </div>
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span class="mu">⚙️ Parâmetros fisiológicos (para Zonas, Potência e Esforço Relativo): <b>${prof.kg} kg · FC máx ${prof.maxHr} bpm</b></span>
      <button class="btn" id="kr-ed-prof" style="padding:4px 10px;font-size:12px">Configurar Peso / FC</button>
    </div>
  </div>
  <div class="card">
    <b>🧡 Integração Strava</b>
    <p class="mu" style="margin:6px 0 10px">Importa as tuas atividades do Strava ou explora perfis de atletas do Strava.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn pri" id="kr-st-imp">📥 Importar do Strava</button>
      <button class="btn" id="kr-st-prf">👤 Perfis do Strava</button>
    </div>
  </div>`;

  s.appendChild(box);
  if(box.querySelector('#kr-st-imp'))box.querySelector('#kr-st-imp').onclick=()=>openStravaImport();
  if(box.querySelector('#kr-st-prf'))box.querySelector('#kr-st-prf').onclick=()=>openStravaProfiles();
  box.querySelector('#kr-add-goal').onclick=()=>{
    const period=prompt('Período do objetivo (Semana, Mês ou Ano):','Mês')||'Mês';
    const sport=prompt('Desporto (Todos, Corrida, Bicicleta, Caminhada):','Todos')||'Todos';
    const metric=prompt('Métrica (km, horas ou m):','km')||'km';
    const target=+(prompt(`Meta para ${period} (${metric}):`,'100')||100);
    if(target>0){const l=getGoals();l.push({id:'g_'+Date.now(),period,sport,metric,target});setGoals(l);enhanceStats();renderWeek()}
  };
  box.querySelectorAll('[data-dg]').forEach(a=>a.onclick=()=>{const l=getGoals();l.splice(+a.dataset.dg,1);setGoals(l);enhanceStats()});
  box.querySelector('#kr-ed-prof').onclick=()=>{
    const kg=+(prompt('O teu peso (kg):',prof.kg)||prof.kg);
    const maxHr=+(prompt('A tua Frequência Cardíaca Máxima (bpm):',prof.maxHr)||prof.maxHr);
    setProf({kg:clamp(kg,35,180),maxHr:clamp(maxHr,130,220),ftp:prof.ftp});enhanceStats();toast('Parâmetros atualizados!');
  };
}

// ---------- 12. Treinos (#wo): Planos de Treino Estruturados e Prevenção de Lesões (Recover Athletics) ----------
function enhanceWorkouts(){
  const el=document.querySelector('#wo');if(!el||el.querySelector('#kr-pro-wo'))return;
  const activePlanId=ls('kr_plan','p_5k'),plan=TRAINING_PLANS.find(p=>p.id===activePlanId)||TRAINING_PLANS[0];
  const doneSteps=getJSON('kr_plan_done',{});
  const selBody=ls('kr_rec_body','Joelho'),rec=RECOVER_ROUTINES[selBody]||RECOVER_ROUTINES['Joelho'];

  const box=document.createElement('div');box.id='kr-pro-wo';
  box.innerHTML=`
  <div class="card" style="margin-top:12px">
    <div class="sh" style="margin-bottom:6px"><b>📅 Planos de Treino Estruturados</b><span class="mu">${plan.weeks} semanas</span></div>
    <div class="chips" style="margin:6px 0">${TRAINING_PLANS.map(p=>`<button class="chip ${p.id===plan.id?'on':''}" data-pl="${p.id}">${esc(p.name)}</button>`).join('')}</div>
    <p class="mu" style="margin:4px 0 8px">${esc(plan.desc)}</p>
    ${plan.schedule.map((wk,wi)=>`<div style="padding:6px 0;border-top:1px solid var(--bd)">
      <b style="font-size:13px">Semana ${wi+1}</b>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
        ${wk.map((wName,di)=>{const k=`${plan.id}_${wi}_${di}`,isD=!!doneSteps[k];return `<button class="btn ${isD?'pri':''}" data-pw="${esc(wName)}" data-pk="${k}" style="padding:5px 10px;font-size:12px">${isD?'✓ ':''}Dia ${di+1}: ${esc(wName)}</button>`}).join('')}
      </div>
    </div>`).join('')}
  </div>
  <div class="card">
    <div class="sh" style="margin-bottom:6px"><b>🩹 Recover Athletics (Prevenção de Lesões e Recuperação)</b></div>
    <p class="mu" style="margin:0 0 8px">Seleciona a zona do corpo que sentes cansada ou dorida para gerar uma sessão guiada de pré-habilitação e mobilidade:</p>
    <div class="chips" style="margin-bottom:8px">${Object.keys(RECOVER_ROUTINES).map(k=>`<button class="chip ${k===selBody?'on':''}" data-rb="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="card" style="background:var(--bg);margin:0">
      <b>${esc(rec.title)}</b><div class="mu" style="margin:4px 0 8px">${esc(rec.why)}</div>
      <button class="btn pri" id="kr-start-rec" style="padding:6px 12px;font-size:13px">🧘 Iniciar rotina de recuperação (${rec.steps.length} exercícios)</button>
    </div>
  </div>`;

  const anchor=el.querySelector('#wl');
  if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);
  else el.appendChild(box);

  box.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{ss('kr_plan',b.dataset.pl);box.remove();enhanceWorkouts()});
  box.querySelectorAll('[data-pw]').forEach(b=>b.onclick=()=>{
    const wName=b.dataset.pw,pk=b.dataset.pk;
    doneSteps[pk]=!doneSteps[pk];setJSON('kr_plan_done',doneSteps);
    const L=window.KRW?KRW.lib(35,false,3):[];
    const w=L.find(x=>x.name===wName);
    if(w&&window.KRW&&KRW.openW)KRW.openW(w);
    box.remove();enhanceWorkouts();
  });
  box.querySelectorAll('[data-rb]').forEach(b=>b.onclick=()=>{ss('kr_rec_body',b.dataset.rb);box.remove();enhanceWorkouts()});
  box.querySelector('#kr-start-rec').onclick=()=>{
    const w={id:'Recover|'+rec.title,name:rec.title,sport:rec.sport,why:rec.why,intents:['recup'],
      steps:rec.steps.map(s=>({n:s[0],s:s[1],tip:s[2],z:'recuperação'})),
      dur:Math.max(5,Math.round(rec.steps.reduce((q,s)=>q+s[1],0)/60))};
    if(window.KRW&&KRW.openW)KRW.openW(w);
  };
}

// ---------- 13. Perfis de Outros Atletas (Amigos KeepRun & Perfis do Strava) ----------
const DEFAULT_STRAVA_PROFILES=[
  {id:'strava_409246',stravaId:'409246',name:'Kilian Jornet',city:'Rauma, Noruega',sport:'Trail / Corrida',monthKm:420,yearKm:4850,elevM:18400,pr5k:'13:58',pr10k:'29:42',prHm:'1:05:10',bio:'Atleta de montanha, trail running e esqui de montanha.'},
  {id:'strava_7450842',stravaId:'7450842',name:'Tadej Pogačar',city:'Mónaco',sport:'Bicicleta',monthKm:2150,yearKm:24800,elevM:36500,pr5k:'—',pr10k:'—',prHm:'—',bio:'Ciclista profissional · Tour de France & Giro d’Italia.'},
  {id:'strava_11749201',stravaId:'11749201',name:'Rosa Mota (Lenda PT)',city:'Porto, Portugal',sport:'Corrida',monthKm:195,yearKm:2300,elevM:2800,pr5k:'15:22',pr10k:'31:35',prHm:'1:09:52',bio:'Campeã Olímpica e Mundial da Maratona.'}
];
const getSavedStravaProfiles=()=>{const l=getJSON('kr_strava_profs',null);return Array.isArray(l)&&l.length?l:DEFAULT_STRAVA_PROFILES};
const setSavedStravaProfiles=l=>setJSON('kr_strava_profs',l);

// Abre o perfil completo de um amigo KeepRun ou atleta Strava com comparação Frente-a-Frente
window.openAthleteProfile=function(ownerId,name,stravaProf){
  let gm=document.getElementById('gm');if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}
  gm.classList.add('on');
  const myKm30=acts.filter(a=>a.date>=Date.now()-30*864e5).reduce((s,a)=>s+a.dist,0)/1000;
  const myElev30=acts.filter(a=>a.date>=Date.now()-30*864e5).reduce((s,a)=>s+a.elev,0);
  const myYearKm=acts.filter(a=>a.date>=new Date(new Date().getFullYear(),0,1).getTime()).reduce((s,a)=>s+a.dist,0)/1000;

  // Atividades sincronizadas deste amigo na KeepRun
  const faList=(window.KR_fa?KR_fa():[]).filter(x=>x.owner===ownerId||x.fname===name);
  const fKm=stravaProf?num(stravaProf.monthKm):faList.reduce((s,x)=>s+num(x.dist),0)/1000;
  const fElev=stravaProf?num(stravaProf.elevM):Math.round(faList.reduce((s,x)=>s+num(x.elev),0));
  const fYearKm=stravaProf?num(stravaProf.yearKm):fKm*4;
  const sport=stravaProf?stravaProf.sport:(faList[0]?.type||'Corrida');
  const city=stravaProf?stravaProf.city:'Atleta KeepRun / Strava';
  const bio=stravaProf?stravaProf.bio:`Perfil desportivo sincronizado (${faList.length} atividades recentes partilhadas).`;
  const stravaUrl=stravaProf&&stravaProf.stravaId?(/^https?:/i.test(stravaProf.stravaId)?stravaProf.stravaId:`https://www.strava.com/athletes/${encodeURIComponent(stravaProf.stravaId)}`):'';

  const cmpBar=(label,myV,thV,unit)=>{
    const tot=(myV+thV)||1,myPct=Math.round(myV/tot*100),thPct=100-myPct;
    return `<div style="margin:8px 0">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span><b>Tu:</b> ${myV.toFixed(1)} ${unit}</span><span class="mu">${label}</span><span><b>${esc(name)}:</b> ${thV.toFixed(1)} ${unit}</span></div>
      <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--bd)"><div style="width:${myPct}%;background:var(--ac)"></div><div style="width:${thPct}%;background:#3b82f6"></div></div>
    </div>`;
  };

  gm.innerHTML=`<div class="gh"><b>👤 Perfil de ${esc(name)}</b><button class="btn" id="gx">Fechar</button></div>
    <div class="card">
      <div class="ph"><span class="av" style="background:var(--ac);color:#fff">${esc(String(name||'?')[0].toUpperCase())}</span>
        <div class="pm"><b>${esc(name)}</b><div class="mu">${esc(city)} · ${esc(sport)}</div><div class="mu" style="margin-top:2px">${esc(bio)}</div></div>
      </div>
      ${stravaUrl?`<p style="margin:12px 0 0"><a class="btn pri" href="${esc(stravaUrl)}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">🧡 Abrir Perfil Oficial no Strava ↗</a></p>`:''}
    </div>
    <div class="card">
      <b>📊 Estatísticas do Atleta</b>
      <div class="row" style="margin-top:8px">
        <div><div class="big">${fKm.toFixed(1)} km</div><div class="mu">Volume mensal</div></div>
        <div><div class="big">${fYearKm.toFixed(0)} km</div><div class="mu">Volume anual</div></div>
        <div><div class="big">${fElev} m</div><div class="mu">Subida acumulada</div></div>
      </div>
      ${stravaProf&&stravaProf.pr5k?`<div class="mu" style="margin-top:8px">🏅 Recordes de referência: 5 km <b>${esc(stravaProf.pr5k)}</b> · 10 km <b>${esc(stravaProf.pr10k||'—')}</b> · Meia Maratona <b>${esc(stravaProf.prHm||'—')}</b></div>`:''}
    </div>
    <div class="card">
      <b>⚔️ Frente-a-Frente: Tu vs. ${esc(name)}</b>
      ${cmpBar('Distância (30 dias)',myKm30,fKm,'km')}
      ${cmpBar('Subida acumulada',myElev30,fElev,'m')}
      ${cmpBar('Volume anual',myYearKm,fYearKm,'km')}
    </div>
    ${faList.length?`<div class="card"><b>🏃 Atividades Recentes de ${esc(name)}</b>
      ${faList.map(a=>{
        const pts=[],r=Array.isArray(a.r)?a.r:[];for(let i=0;i+1<r.length;i+=2){const la=Number(r[i]),lo=Number(r[i+1]);if(isFinite(la)&&isFinite(lo))pts.push([la,lo])}
        return `<div style="padding:10px 0;border-top:1px solid var(--bd)">
          <b>${esc(a.title||'Atividade')}</b> <span class="mu">· ${new Date(num(a.date)).toLocaleDateString('pt-PT')} · ${(num(a.dist)/1000).toFixed(2)} km em ${fTL(num(a.dur))}</span>
          ${pts.length>1?`<div class="mapbox" style="margin:8px 0 0;height:200px;border-radius:10px;overflow:hidden">${thumb(pts)}</div>`:''}
        </div>`;
      }).join('')}
    </div>`:''}`;
  gm.querySelector('#gx').onclick=()=>gm.classList.remove('on');
};

// Explorador de Perfis do Strava dentro da KeepRun
window.openStravaProfiles=function(){
  let gm=document.getElementById('gm');if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}
  gm.classList.add('on');
  const profs=getSavedStravaProfiles();
  const kFriends=window.KR_friendsList?KR_friendsList():[];

  gm.innerHTML=`<div class="gh"><b>🧡 Perfis de Atletas (Strava & KeepRun)</b><button class="btn" id="gx">Fechar</button></div>
    <p class="mu">Procura qualquer atleta do Strava por ID, URL de perfil (ex.: <code>strava.com/athletes/123456</code>) ou liga o teu Token Strava para veres e comparares perfis dentro da KeepRun.</p>
    <div class="card">
      <b>🔍 Adicionar / Ver Perfil de Atleta do Strava</b>
      <div class="row" style="margin-top:8px">
        <div><label class="lb" style="margin-top:0">Nome do Atleta</label><input id="sp-nm" placeholder="Ex.: João Silva" style="width:100%"></div>
        <div><label class="lb" style="margin-top:0">ID ou URL Strava</label><input id="sp-id" placeholder="Ex.: 12345678 ou URL Strava" style="width:100%"></div>
      </div>
      <div class="row" style="margin-top:6px">
        <div><label class="lb" style="margin-top:2px">Cidade / Clube</label><input id="sp-ct" placeholder="Ex.: Lisboa, Portugal" style="width:100%"></div>
        <div><label class="lb" style="margin-top:2px">Km / mês (aprox.)</label><input id="sp-km" type="number" value="120" style="width:100%"></div>
        <div><label class="lb" style="margin-top:2px">Desporto</label><input id="sp-sp" value="Corrida" style="width:100%"></div>
      </div>
      <div class="gb" style="margin-bottom:0">
        <button class="btn pri" id="sp-add">➕ Guardar e Ver Perfil</button>
        <button class="btn" id="sp-open-url">🧡 Abrir direto no Strava ↗</button>
      </div>
    </div>
    ${kFriends.length?`<div class="card"><b>👥 Os Teus Amigos na KeepRun (${kFriends.length})</b>
      ${kFriends.map((f,i)=>`<div class="fr"><span style="font-weight:600">${esc(f.name)}</span><button class="btn pri" data-kf="${i}" style="padding:4px 10px;font-size:12px">Ver Perfil & Comparar</button></div>`).join('')}
    </div>`:''}
    <div class="card">
      <b>🧡 Perfis Strava Guardados (${profs.length})</b>
      ${profs.map((p,i)=>`<div class="fr" style="gap:8px;flex-wrap:wrap">
        <div style="cursor:pointer" data-spv="${i}">
          <b>${esc(p.name)}</b> <span class="mu">· ${esc(p.city||'')}</span>
          <div class="mu">${esc(p.sport)} · ${num(p.monthKm)} km/mês · Subida ${num(p.elevM)} m</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn pri" data-spv="${i}" style="padding:4px 10px;font-size:12px">Ver Perfil</button>
          <button class="btn" data-spd="${i}" style="padding:4px 8px;font-size:12px">✕</button>
        </div>
      </div>`).join('')}
    </div>`;

  const q=s=>gm.querySelector(s);
  q('#gx').onclick=()=>gm.classList.remove('on');
  q('#sp-add').onclick=()=>{
    const name=(q('#sp-nm').value||'').trim()||'Atleta Strava';
    const rawId=(q('#sp-id').value||'').trim();
    const idMatch=rawId.match(/athletes\/(\d+)/i);
    const stravaId=idMatch?idMatch[1]:rawId||'';
    const monthKm=Math.max(0,+q('#sp-km').value||100);
    const p={id:'sp_'+Date.now(),stravaId,name:name.slice(0,50),city:(q('#sp-ct').value||'Portugal').slice(0,50),sport:(q('#sp-sp').value||'Corrida').slice(0,30),monthKm,yearKm:monthKm*11,elevM:Math.round(monthKm*14),bio:'Perfil Strava seguido na KeepRun.'};
    const l=getSavedStravaProfiles();l.unshift(p);setSavedStravaProfiles(l.slice(0,30));
    openAthleteProfile(p.id,p.name,p);
  };
  q('#sp-open-url').onclick=()=>{
    const raw=(q('#sp-id').value||q('#sp-nm').value||'').trim();
    const idMatch=raw.match(/(\d{4,})/);
    const url=idMatch?`https://www.strava.com/athletes/${idMatch[1]}`:`https://www.strava.com/athletes/search?text=${encodeURIComponent(raw||'Portugal')}`;
    window.open(url,'_blank','noopener');
  };
  gm.querySelectorAll('[data-kf]').forEach(b=>b.onclick=()=>{const f=kFriends[+b.dataset.kf];if(f)openAthleteProfile(f.id,f.name)});
  gm.querySelectorAll('[data-spv]').forEach(b=>b.onclick=()=>{const p=profs[+b.dataset.spv];if(p)openAthleteProfile(p.id,p.name,p)});
  gm.querySelectorAll('[data-spd]').forEach(b=>b.onclick=()=>{profs.splice(+b.dataset.spd,1);setSavedStravaProfiles(profs);openStravaProfiles()});
};

// ---------- 14. Importar Atividades do Strava para a KeepRun (API Strava v3, Polyline Decoder & CSV / GPX / TCX) ----------
// Descodificador oficial de Google Encoded Polyline (usado pelo Strava em map.summary_polyline)
function decodePolyline(str,durSec=1800,elevGain=50,startDate=Date.now()){
  if(!str||typeof str!=='string')return[];
  let idx=0,lat=0,lng=0;const raw=[];
  while(idx<str.length){
    let b,shift=0,result=0;
    do{b=str.charCodeAt(idx++)-63;result|=(b&0x1f)<<shift;shift+=5}while(b>=0x20&&idx<=str.length);
    const dlat=((result&1)?~(result>>1):(result>>1));lat+=dlat;
    shift=0;result=0;
    do{b=str.charCodeAt(idx++)-63;result|=(b&0x1f)<<shift;shift+=5}while(b>=0x20&&idx<=str.length);
    const dlng=((result&1)?~(result>>1):(result>>1));lng+=dlng;
    if(Math.abs(lat/1e5)<=90&&Math.abs(lng/1e5)<=180)raw.push([+(lat/1e5).toFixed(5),+(lng/1e5).toFixed(5)]);
  }
  const n=raw.length;
  return raw.map((p,i)=>{
    const frac=n>1?i/(n-1):0;
    const el=elevGain>0?Math.round((Math.sin(frac*Math.PI)*elevGain)*10)/10:15;
    const tm=Math.round(startDate+frac*durSec*1000);
    return[p[0],p[1],el,tm];
  });
}

function mapStravaSport(s){
  s=String(s||'').toLowerCase();
  if(/ride|bike|cycling|ebike|velomobile|virtualride/.test(s))return'Bicicleta';
  if(/walk/.test(s))return'Caminhada';
  if(/hike/.test(s))return'Hiking';
  if(/trail/.test(s))return'Trail';
  if(/swim/.test(s))return'Natação';
  if(/weight|strength|crossfit/.test(s))return'Força';
  if(/hiit|workout/.test(s))return'HIIT';
  if(/yoga/.test(s))return'Yoga';
  return'Corrida';
}

// Importador de ficheiro activities.csv do Arquivo de Exportação Oficial do Strava
function importStravaCSV(csvText){
  const lines=String(csvText||'').replace(/\r/g,'\n').split('\n').map(l=>l.trim()).filter(Boolean);
  if(lines.length<2)throw new Error('Ficheiro CSV vazio');
  const hdr=splitCSV(lines[0]).map(h=>h.toLowerCase());
  const iName=hdr.findIndex(h=>/activity name|nome da atividade|title|name/.test(h));
  const iType=hdr.findIndex(h=>/activity type|tipo de atividade|sport|type/.test(h));
  const iDate=hdr.findIndex(h=>/activity date|data da atividade|date|start_date/.test(h));
  const iDist=hdr.findIndex(h=>/distance|dist[aâ]ncia/.test(h));
  const iTime=hdr.findIndex(h=>/moving time|tempo em movimento|elapsed time|tempo decorrido|duration/.test(h));
  const iElev=hdr.findIndex(h=>/elevation gain|ganho de eleva|subida|elev/.test(h));
  const iPoly=hdr.findIndex(h=>/polyline/.test(h));
  if(iDist<0&&iTime<0)throw new Error('Cabeçalhos do Strava não encontrados no CSV');

  let count=0;
  for(let r=1;r<lines.length;r++){
    const cols=splitCSV(lines[r]);if(cols.length<3)continue;
    const name=(iName>=0&&cols[iName]?cols[iName]:'Atividade Strava').slice(0,80);
    const type=mapStravaSport(iType>=0?cols[iType]:'Run');
    const parsedDate=iDate>=0?Date.parse(cols[iDate]):NaN;
    const date=isFinite(parsedDate)?parsedDate:(Date.now()-r*864e5);
    let rawDist=iDist>=0?parseFloat(String(cols[iDist]).replace(',','.')):0;
    if(!isFinite(rawDist))rawDist=0;
    // No CSV do Strava, a distância pode vir em km (ex.: 5.42) ou em metros (ex.: 5420)
    const dist=rawDist>0&&rawDist<250?Math.round(rawDist*1000):Math.round(rawDist);
    let dur=iTime>=0?parseFloat(cols[iTime]):0;
    if(!isFinite(dur)||dur<=0)dur=Math.round((dist/1000)*310);
    const elev=Math.max(0,Math.round(iElev>=0?parseFloat(cols[iElev])||0:0));
    const pts=(iPoly>=0&&cols[iPoly])?decodePolyline(cols[iPoly],dur,elev,date):[];
    if(!dist&&!dur)continue;
    const isDup=acts.some(a=>Math.abs(a.date-date)<60000&&Math.abs(a.dist-dist)<50);
    if(!isDup){
      acts.push({id:Date.now()+Math.random(),name,type,date,dist,dur,elev,pts,eff:6,desc:'Importado do Strava',share:true});
      count++;
    }
  }
  if(count){save();renderList()}
  return count;
}

window.openStravaImport=function(){
  let gm=document.getElementById('gm');if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}
  gm.classList.add('on');
  const savedTok=ls('kr_strava_tok','');
  gm.innerHTML=`<div class="gh"><b>📥 Importar Atividades do Strava</b><button class="btn" id="gx">Fechar</button></div>
    <p class="mu">Traz todo o teu histórico de corridas, voltas de bicicleta e caminhadas do Strava para a KeepRun com mapas, parciais e métricas Pro.</p>
    <div class="card">
      <b>⚡ Opção 1: Ligação Direta à API do Strava (Importa atividades + mapas + perfil)</b>
      <p class="mu" style="margin:6px 0">Cola o teu <b>Access Token</b> do Strava (em <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener" style="color:var(--ac)">strava.com/settings/api</a>) para descarregar automaticamente as tuas atividades e rotas GPS:</p>
      <input id="st-tok" type="password" placeholder="Access Token do Strava (ex.: a1b2c3d4...)" value="${esc(savedTok)}" style="width:100%;margin-bottom:8px">
      <div class="gb" style="margin:0"><button class="btn pri" id="st-sync-api">🔄 Sincronizar com a minha conta Strava</button></div>
      <div id="st-api-st" class="mu" style="margin-top:6px"></div>
    </div>
    <div class="card">
      <b>📂 Opção 2: Ficheiros do Strava (<code>activities.csv</code>, <code>.gpx</code> ou <code>.tcx</code>)</b>
      <p class="mu" style="margin:6px 0">Seleciona o ficheiro <code>activities.csv</code> (do arquivo ZIP exportado do Strava) ou vários ficheiros <code>.gpx</code> / <code>.tcx</code> de uma só vez:</p>
      <label class="btn pri" style="cursor:pointer;display:inline-block">📂 Escolher ficheiros do Strava (.csv, .gpx, .tcx)<input id="st-files" type="file" accept=".csv,.gpx,.tcx" multiple hidden></label>
    </div>
    <div class="card">
      <b>🗺️ Opção 3: Importar Atividade Rápida do Strava (com Polyline ou Dados)</b>
      <div class="row" style="margin-top:8px">
        <div><label class="lb" style="margin-top:0">Nome da atividade</label><input id="st-m-nm" placeholder="Ex.: Corrida Matinal Strava" style="width:100%"></div>
        <div><label class="lb" style="margin-top:0">Desporto</label><select id="st-m-sp" style="width:100%"><option>Corrida</option><option>Bicicleta</option><option>Caminhada</option><option>Trail</option><option>Força</option><option>HIIT</option></select></div>
      </div>
      <div class="row" style="margin-top:6px">
        <div><label class="lb" style="margin-top:2px">Distância (km)</label><input id="st-m-km" type="number" step="0.01" value="5.00" style="width:100%"></div>
        <div><label class="lb" style="margin-top:2px">Tempo (min)</label><input id="st-m-min" type="number" value="28" style="width:100%"></div>
        <div><label class="lb" style="margin-top:2px">Subida (m)</label><input id="st-m-el" type="number" value="65" style="width:100%"></div>
      </div>
      <label class="lb" style="margin-top:8px">Encoded Polyline do Strava (opcional — desenha o mapa exato da corrida)</label>
      <input id="st-m-poly" placeholder="Ex.: _p~iF~ps|U_ulLnnqC_mqNvxq..." style="width:100%">
      <div class="gb" style="margin-bottom:0"><button class="btn pri" id="st-m-save">➕ Importar Atividade para a KeepRun</button></div>
    </div>`;

  const q=s=>gm.querySelector(s);
  q('#gx').onclick=()=>gm.classList.remove('on');
  q('#st-sync-api').onclick=async()=>{
    const tok=(q('#st-tok').value||'').trim(),st=q('#st-api-st');
    if(!tok){st.textContent='⚠️ Introduz o teu Access Token do Strava.';return}
    ss('kr_strava_tok',tok);st.textContent='⏳ A ligar à API do Strava e a descarregar atividades…';
    try{
      // 1) Obter perfil do atleta autenticado no Strava
      try{
        const pRes=await fetch('https://www.strava.com/api/v3/athlete',{headers:{Authorization:'Bearer '+tok}});
        if(pRes.ok){
          const ath=await pRes.json();
          if(ath&&ath.firstname){
            const profs=getSavedStravaProfiles();
            const sp={id:'strava_'+ath.id,stravaId:String(ath.id),name:`${ath.firstname} ${ath.lastname||''}`.trim(),city:`${ath.city||''} ${ath.country||''}`.trim()||'Strava',sport:'Corrida / Ciclismo',monthKm:150,yearKm:1800,elevM:2400,bio:ath.bio||'Conta Strava sincronizada via API.'};
            if(!profs.some(x=>x.stravaId===sp.stravaId)){profs.unshift(sp);setSavedStravaProfiles(profs)}
          }
        }
      }catch(e){}
      // 2) Obter lista de atividades do atleta no Strava
      const res=await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=60',{headers:{Authorization:'Bearer '+tok}});
      if(!res.ok)throw new Error('Token inválido ou sem permissão activity:read (código '+res.status+')');
      const arr=await res.json();
      if(!Array.isArray(arr))throw new Error('Resposta inesperada da API Strava');
      let added=0;
      arr.forEach(x=>{
        const date=Date.parse(x.start_date)||Date.now(),dist=Math.round(+x.distance||0),dur=Math.round(+x.moving_time||+x.elapsed_time||0),elev=Math.round(+x.total_elevation_gain||0);
        if(!dist&&!dur)return;
        if(acts.some(a=>Math.abs(a.date-date)<60000&&Math.abs(a.dist-dist)<50))return;
        const poly=x.map&&x.map.summary_polyline?x.map.summary_polyline:'';
        const pts=poly?decodePolyline(poly,dur,elev,date):[];
        acts.push({id:Date.now()+Math.random(),name:String(x.name||'Atividade Strava').slice(0,80),type:mapStravaSport(x.sport_type||x.type),date,dist,dur,elev,pts,eff:Math.min(10,Math.max(1,Math.round((+x.suffer_score||50)/15))),desc:'Sincronizado da conta Strava',share:true});
        added++;
      });
      if(added){save();renderList()}
      st.textContent=`✅ Sincronização concluída! ${added} nova(s) atividade(s) importada(s) do Strava.`;
      toast(`${added} atividade(s) importada(s) do Strava!`);
    }catch(err){
      st.textContent='⚠️ '+err.message+'. Dica: garante que o Access Token tem permissão de leitura ou usa a Opção 2 (ficheiro CSV/GPX).';
    }
  };
  q('#st-files').onchange=async e=>{
    let tot=0;
    for(const f of e.target.files){
      try{
        if(/\.csv$/i.test(f.name))tot+=importStravaCSV(await f.text());
        else{acts.push(/\.tcx$/i.test(f.name)?parseTCX(await f.text(),f.name):parseGPX(await f.text(),f.name));tot++}
      }catch(x){alert(f.name+': '+x.message)}
    }
    if(tot){save();renderList()}
    e.target.value='';gm.classList.remove('on');toast(`${tot} atividade(s) importada(s) para a KeepRun!`);
  };
  q('#st-m-save').onclick=()=>{
    const name=(q('#st-m-nm').value||'').trim()||'Atividade Strava';
    const type=q('#st-m-sp').value||'Corrida';
    const dist=Math.max(0,Math.round((+q('#st-m-km').value||0)*1000));
    const dur=Math.max(60,Math.round((+q('#st-m-min').value||25)*60));
    const elev=Math.max(0,Math.round(+q('#st-m-el').value||0));
    const poly=(q('#st-m-poly').value||'').trim();
    const pts=poly?decodePolyline(poly,dur,elev,Date.now()):[];
    acts.push({id:Date.now()+Math.random(),name:name.slice(0,80),type,date:Date.now(),dist,dur,elev,pts,eff:6,desc:'Importado do Strava',share:true});
    save();renderList();gm.classList.remove('on');go('feed');toast('Atividade do Strava importada!');
  };
};

// ---------- 15. KeepRun AI Personal Trainer (Treinador Pessoal Inteligente com Contexto Real) ----------
let aiHistory=getJSON('kr_ai_chat',[]);

// Calcula previsões de tempos de prova (fórmula de Riegel) e resumo fisiológico completo para o Personal Trainer AI
function getAthleteSnap(){
  const ff=calcFitnessCurve(30),prof=getProf(),w0=wkStart();
  const wkActs=acts.filter(a=>a.date>=w0),wkKm=wkActs.reduce((s,a)=>s+a.dist,0)/1000;
  const runs=acts.filter(a=>a.type==='Corrida'&&a.dist>=1000&&a.dur>120);
  const bestRun=runs.slice().sort((a,b)=>(a.dur/a.dist)-(b.dur/b.dist))[0]||null;
  const lastAct=acts.slice().sort((a,b)=>b.date-a.date)[0]||null;
  const mfp=window.KRW&&KRW.mfpInfo?KRW.mfpInfo():null;
  // Previsão de tempos de prova (Riegel T2 = T1 * (D2/D1)^1.06)
  const refDist=bestRun?bestRun.dist:5000,refTime=bestRun?bestRun.dur:1500;
  const pred=d=>fT(Math.round(refTime*Math.pow(d/refDist,1.06)));
  return{ff,prof,wkKm,wkCount:wkActs.length,goalKm:+ls('kr_goal',20)||20,bestRun,lastAct,mfp,pred5k:pred(5000),pred10k:pred(10000),predHm:pred(21097),predMar:pred(42195)};
}

// Motor de resposta do Personal Trainer AI (local + suporte opcional Gemini API)
async function generateAIReply(userMsg){
  const q=String(userMsg||'').toLowerCase(),s=getAthleteSnap();
  const L=window.KRW?KRW.lib(35,false,3):[];
  const findW=n=>L.find(w=>w.name===n)||L[0];

  // Se o utilizador tiver configurado uma chave API do Google Gemini, tenta resposta LLM enriquecida com a telemetria real
  const gemKey=ls('kr_gemini_key','');
  if(gemKey){
    try{
      const sys=`És o KeepRun AI Personal Trainer, um treinador desportivo de elite em português de Portugal. Dados reais do atleta: Peso ${s.prof.kg}kg, FC máx ${s.prof.maxHr}bpm, Km esta semana: ${s.wkKm.toFixed(1)}/${s.goalKm}km (${s.wkCount} treinos), Condição Física (CTL): ${s.ff.cur.fitness}, Fadiga (ATL): ${s.ff.cur.fatigue}, Forma (TSB): ${s.ff.cur.form} (${s.ff.status}). Previsões: 5km=${s.pred5k}, 10km=${s.pred10k}, Meia Maratona=${s.predHm}. ${s.mfp?`Nutrição MyFitnessPal: ${s.mfp.m.food}/${s.mfp.m.goal} kcal (${s.mfp.m.carbs}g HC, ${s.mfp.m.protein}g Prot).`:''} Responde de forma concisa, motivadora, prática e estruturada.`;
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(gemKey)}`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{role:'user',parts:[{text:sys+'\n\nPergunta do atleta: '+userMsg}]}]})
      });
      if(r.ok){
        const j=await r.json(),txt=j?.candidates?.[0]?.content?.parts?.[0]?.text;
        if(txt){
          const recW=/recuper|dor|cansad/.test(q)?findW('Corrida de recuperação'):/for[cç]a|m[uú]scul/.test(q)?findW('Corpo inteiro'):/r[aá]pid|veloc|interval|5\s*km|10\s*km/.test(q)?findW('Intervalos curtos'):findW('Corrida fácil');
          return{text:txt,workout:recW};
        }
      }
    }catch(e){}
  }

  // Respostas inteligentes especializadas baseadas na telemetria real do atleta
  if(/comer|refei[cç]|aliment|jantar|almo[cç]o|pequeno[-\s]*almo[cç]o|pr[eé][-\s]*treino|p[oó]s[-\s]*treino|amanh[aã]|energia|hidrat/.test(q)&&!/emagrec|perder peso|d[eé]fice/.test(q)){
    return{
      text:`🍽️ **O que comer para treinares no teu melhor:**\n\n• **Na véspera (hoje ao jantar):** Dá prioridade a hidratos de carbono complexos para encheres o glicogénio muscular (arroz, massa, batata ou batata-doce) + uma fonte de proteína magra (frango, peixe, ovos ou tofu), evitando gorduras pesadas ou fritos.\n• **Antes do treino (1h30 a 2h antes):** Banana com papas de aveia ou pão torrado com mel/compota e café ou água.\n• **Após o treino:** 25–35 g de proteína + fruta ou arroz/pão para acelerar a recuperação muscular.`,
      workout:findW('Corrida progressiva')
    };
  }
  if(/últim|ultima|analis/.test(q)){
    if(!s.lastAct)return{text:'Ainda não tens atividades registadas. Grava uma corrida ou importa do Strava para eu analisar o teu ritmo e esforço!',workout:findW('Caminhar e correr')};
    const m=analyzeAct(s.lastAct);
    return{
      text:`📊 **Último treino — ${s.lastAct.name}:**\n• **Resumo:** ${(s.lastAct.dist/1000).toFixed(2)} km em ${fTL(s.lastAct.dur)} · Subida ${Math.round(s.lastAct.elev)} m\n• **Ritmo Ajustado (GAP):** ${m.gapStr} · **Esforço Relativo:** ${m.relEffort} pts\n• **Feedback:** ${m.relEffort>80?'Sessão forte! Nas próximas 24h faz recuperação leve e hidrata bem.':'Treino bem controlado, ideal para construir resistência aeróbica.'}`,
      workout:m.relEffort>80?findW('Mobilidade de anca'):findW('Corrida fácil')
    };
  }
  if(/previs|tempo|5\s*k|10\s*k|meia|maratona|ritmo de prova/.test(q)){
    return{
      text:`⏱️ **Estimativa atual dos teus tempos:**\n• **5 km:** ${s.pred5k}\n• **10 km:** ${s.pred10k}\n• **Meia Maratona:** ${s.predHm}\n• **Maratona:** ${s.predMar}\n\nPara baixares estes tempos, faz 1 treino semanal de intervalos curtos.`,
      workout:findW('Intervalos curtos')
    };
  }
  if(/calor|nutri|myfitnesspal|dieta|peso|emagrec|d[eé]fice/.test(q)){
    if(s.mfp){
      return{
        text:`🥗 **Balanço MyFitnessPal:**\nConsumiste **${s.mfp.m.food} kcal** (meta: ${s.mfp.m.goal} kcal · ${s.mfp.m.carbs}g HC, ${s.mfp.m.protein}g Prot, ${s.mfp.m.fat}g Gord).\n${s.mfp.summary}`,
        workout:s.mfp.plan[0]||findW('HIIT 30/30')
      };
    }
    return{
      text:`🥗 **Controlo de Peso e Nutrição:**\n• Aponta para um défice moderado de 300–400 kcal/dia e ~${Math.round(s.prof.kg*1.8)}g de proteína/dia.\n• Combina treino de força com corrida/caminhada em ritmo constante.\n• Podes anexar um screenshot do **MyFitnessPal** em Treinos para ajuste automático.`,
      workout:findW('HIIT 30/30')
    };
  }
  if(/dor|les[aã]o|cansad|fadig|recuper|joelho|g[eé]meo|anca|lombar/.test(q)){
    const body=/joelho/.test(q)?'Joelho':/g[eé]meo|aquiles/.test(q)?'Gémeos e Aquiles':/lombar|costas/.test(q)?'Lombar':/isquio/.test(q)?'Isquiotibiais':'Anca e Glúteos';
    const rec=RECOVER_ROUTINES[body];
    const w={id:'Recover|'+rec.title,name:rec.title,sport:rec.sport,why:rec.why,intents:['recup'],steps:rec.steps.map(x=>({n:x[0],s:x[1],tip:x[2],z:'recuperação'})),dur:Math.max(5,Math.round(rec.steps.reduce((a,b)=>a+b[1],0)/60))};
    return{
      text:`🩹 **Recuperação (${body}):**\nEvita impacto forte durante 48h e faz já esta sessão curta de mobilidade e reforço articular:`,
      workout:w
    };
  }
  if(/semana|plano|program/.test(q)){
    return{
      text:`📅 **Plano simples para esta semana (${s.wkKm.toFixed(1)} / ${s.goalKm} km feitos):**\n• **Dia 1:** Intervalos curtos ou Fartlek\n• **Dia 2:** Força (Corpo inteiro) + Mobilidade\n• **Dia 3:** Corrida fácil em ritmo confortável\n• **Fim de semana:** Treino longo progressivo`,
      workout:findW('Fartlek')
    };
  }
  const needRec=s.ff.cur.form<-15;
  const needSpeed=s.ff.cur.form>=0&&s.wkKm>0;
  const wToday=needRec?findW('Corrida de recuperação'):needSpeed?findW('Intervalos curtos'):findW('Corrida fácil');
  return{
    text:`🏃 **Sugestão para hoje:**\nLevas **${s.wkKm.toFixed(1)} / ${s.goalKm} km** esta semana (${s.ff.status}).\n${needRec?'Hoje o ideal é uma sessão leve de recuperação para assimilares a carga recente.':needSpeed?'Estás fresco! Aproveita para um treino de ritmo/velocidade.':'Faz uma sessão confortável para somar quilómetros sem fadiga excessiva.'}`,
    workout:wToday
  };
}

window.openAICoach=function(){
  let gm=document.getElementById('gm');if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}
  gm.classList.add('on');
  const s=getAthleteSnap();
  if(!aiHistory.length){
    aiHistory=[{role:'ai',text:`Olá, **${ls('kr_name','Atleta')}**! 👋 Levas **${s.wkKm.toFixed(1)} / ${s.goalKm} km** esta semana.\nPergunta-me o que treinar hoje, o que comer antes do treino ou como melhorar os teus tempos.`}];
  }

  const fmtMsg=t=>esc(t).replace(/\*\*(.*?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
  const prompts=[
    'Que treino faço hoje?',
    'O que comer antes de treinar?',
    'Analisar última corrida',
    'Meus tempos 5k / 10k',
    'Plano para a semana'
  ];

  gm.innerHTML=`
  <div style="display:flex;flex-direction:column;height:calc(100dvh - 40px);max-width:600px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid var(--bd)">
      <div><b style="font-size:18px">Personal Trainer</b><div class="mu" style="font-size:12px">${s.wkKm.toFixed(1)}/${s.goalKm} km esta semana · ${s.ff.status}</div></div>
      <div style="display:flex;gap:6px">
        <button class="btn" id="ai-clr" style="padding:6px 10px;font-size:12px">Limpar</button>
        <button class="btn" id="gx" style="padding:6px 12px;font-size:13px">Fechar</button>
      </div>
    </div>

    <div id="ai-log" style="flex:1;overflow-y:auto;padding:14px 2px;display:flex;flex-direction:column;gap:10px">
      ${aiHistory.map((m,idx)=>`
        <div style="align-self:${m.role==='user'?'flex-end':'flex-start'};max-width:86%;background:${m.role==='user'?'var(--ac)':'var(--card)'};color:#fff;border:${m.role==='user'?'0':'1px solid var(--bd)'};padding:11px 14px;border-radius:${m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px'};font-size:14px;line-height:1.45">
          <div>${fmtMsg(m.text)}</div>
          ${m.workout?`<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;gap:10px">
            <span style="font-size:13px"><b>${window.ic?ic(m.workout.sport):'🏃'} ${esc(m.workout.name)}</b> <span class="mu">(${m.workout.dur} min)</span></span>
            <button class="btn pri" data-aiw="${idx}" style="padding:5px 10px;font-size:12px">▶️ Iniciar</button>
          </div>`:''}
        </div>
      `).join('')}
    </div>

    <div style="padding-top:8px;border-top:1px solid var(--bd)">
      <div class="chips" style="margin-bottom:8px">${prompts.map(p=>`<button class="chip" data-ap="${esc(p)}" style="font-size:12px;padding:5px 11px">${esc(p)}</button>`).join('')}</div>
      <div style="display:flex;gap:8px">
        <input id="ai-in" placeholder="Escreve uma mensagem..." style="flex:1;border-radius:20px;padding:9px 14px">
        <button class="btn pri" id="ai-send" style="border-radius:20px;padding:9px 18px;font-weight:600">Enviar</button>
      </div>
    </div>
  </div>`;

  const q=s=>gm.querySelector(s),log=q('#ai-log');
  if(log)log.scrollTop=log.scrollHeight;
  q('#gx').onclick=()=>gm.classList.remove('on');
  q('#ai-clr').onclick=()=>{aiHistory=[];setJSON('kr_ai_chat',[]);openAICoach()};
  const send=async txt=>{
    txt=(txt||'').trim();if(!txt)return;
    aiHistory.push({role:'user',text:txt});
    const reply=await generateAIReply(txt);
    aiHistory.push({role:'ai',text:reply.text,workout:reply.workout});
    aiHistory=aiHistory.slice(-20);setJSON('kr_ai_chat',aiHistory);
    openAICoach();
  };
  q('#ai-send').onclick=()=>send(q('#ai-in').value);
  q('#ai-in').onkeydown=e=>{if(e.key==='Enter')send(q('#ai-in').value)};
  gm.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>send(b.dataset.ap));
  gm.querySelectorAll('[data-aiw]').forEach(b=>b.onclick=()=>{
    const m=aiHistory[+b.dataset.aiw];
    if(m&&m.workout&&window.KRW&&KRW.openW)KRW.openW(m.workout);
  });
};

// ---------- 16. Interligação Automática com as Vistas do KeepRun ----------
const origShow=window.show;
if(typeof origShow==='function'){
  window.show=function(a){origShow(a);enhanceDetail(a)};
}
const origRenderStats=window.renderStats;
if(typeof origRenderStats==='function'){
  window.renderStats=function(){origRenderStats();enhanceStats()};
}
const origRenderMaps=window.renderMaps;
if(typeof origRenderMaps==='function'){
  window.renderMaps=function(){origRenderMaps();setupMapsPro()};
}
const origRenderWO=window.renderWO;
if(typeof origRenderWO==='function'){
  window.renderWO=function(){origRenderWO();enhanceWorkouts()};
}
setupRecPro();
window.KRPro={analyzeAct,calcFitnessCurve,getActSegments,getMatchedActs,getAllSegs,getSegEfforts,openSegmentModal,TRAINING_PLANS,RECOVER_ROUTINES,decodePolyline,importStravaCSV,openStravaImport,openStravaProfiles,openAthleteProfile,openAICoach,generateAIReply};
})();
