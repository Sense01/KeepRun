// KeepRun: treinos personalizados, modo guiado com avisos de áudio e rotas sugeridas.
(()=>{
const SPORTS='Corrida,Trail,Passadeira,Caminhada,Caminhada nórdica,Hiking,Bicicleta,Ciclismo de montanha,Spinning,Natação,Remo,Caiaque,Stand-up paddle,Surf,Yoga,Pilates,Alongamentos,Mobilidade,Força,Calistenia,HIIT,Crossfit,Boxe,Artes marciais,Dança,Elíptica,Escalada,Patinagem,Skate,Esqui,Snowboard,Esqui de fundo,Padel,Ténis,Ténis de mesa,Badminton,Squash,Futebol,Basquetebol,Voleibol,Râguebi,Golfe,Triatlo'.split(',');
const AL={Trail:'Corrida',Passadeira:'Corrida',Spinning:'Bicicleta','Ciclismo de montanha':'Bicicleta',Hiking:'Caminhada','Caminhada nórdica':'Caminhada',Crossfit:'HIIT',Calistenia:'Força'};
const INT={base:'Resistência',veloc:'Velocidade',recup:'Recuperar',forca:'Força',diversao:'Divertir-me'};
const SI={Corrida:'🏃',Bicicleta:'🚴',Caminhada:'🥾',Força:'🏋️',HIIT:'🔥',Yoga:'🧘',Mobilidade:'🤸',Alongamentos:'🤸',Pilates:'🤸',Natação:'🏊',Remo:'🚣',Escalada:'🧗',Futebol:'⚽',Basquetebol:'🏀',Ténis:'🎾',Padel:'🎾',Boxe:'🥊',Surf:'🏄',Esqui:'⛷️',Snowboard:'🏂',Golfe:'⛳',Dança:'💃'};
const ic=s=>SI[s]||SI[AL[s]]||'🏅';
const rngf=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const shuf=(a,r)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const st=(n,s,tip,z)=>({n,s:Math.round(s),tip:tip||'',z:z||''});
const W=(name,sport,why,intents,steps)=>({id:sport+'|'+name,name,sport,why,intents,steps,dur:Math.round(steps.reduce((q,x)=>q+x.s,0)/60)});
const wu=(m,t)=>st('Aquecimento',m*60,t||'Começa devagar e solta o corpo.','leve'),cd=(m,t)=>st('Retorno à calma',m*60,t||'Abranda e respira fundo.','leve');
const rep=(k,w,r,wz,rz,wt,rt)=>{const o=[];for(let i=1;i<=k;i++){o.push(st(`Repetição ${i} de ${k}`,w,wt,wz));if(r&&i<k)o.push(st('Recuperação',r,rt,rz))}return o};
const circ=(name,why,ex,rounds)=>{const o=[wu(5,'Mobilidade e ativação suave.')];for(let r=1;r<=rounds;r++){ex.forEach(e=>{o.push(st(e[0],40,e[1],'forte'));o.push(st('Descanso',20,'Respira e prepara o próximo.','leve'))});if(r<rounds)o.push(st('Pausa entre rondas',60,'Bebe água.','leve'))}o.push(cd(4,'Alongamentos suaves.'));return W(name,'Força',why,['forca','base'],o)};
const flow=(name,sport,why,intents,poses,sec)=>W(name,sport,why,intents,[st('Respiração inicial',60,'Senta-te e respira fundo.','leve'),...poses.map(p=>st(p,sec,'Respira devagar e não forces.','leve')),st('Relaxamento final',120,'Deita-te e deixa o corpo soltar.','leve')]);
const runs=d=>{const m=Math.max(25,d),k=Math.max(5,Math.round((m-10)/4)),B=[90,60,120,60,90],f=[];for(let i=0;i<k;i++){f.push(st('Acelera',B[i%5],'Sobe o ritmo à vontade.','forte'),st('Leve',B[i%5]*1.5,'Recupera a trote.','leve'))}
const th=Math.round((m-10)/3)*60;return[
W('Corrida fácil','Corrida','Constrói base aeróbica sem cansaço a mais.',['base','diversao'],[wu(5),st('Corrida fácil',(m-10)*60,'Ritmo de conversa. Se perderes o fôlego, abranda.','fácil'),cd(5)]),
W('Corrida de recuperação','Corrida','Solta as pernas depois de dias mais puxados.',['recup'],[wu(3),st('Trote muito leve',Math.max(12,Math.round(m*.5))*60,'Devagar, sem olhar ao ritmo.','muito leve'),cd(3)]),
W('Intervalos curtos','Corrida','Melhora a velocidade e a eficiência da passada.',['veloc'],[wu(10,'Termina com 2 ou 3 acelerações curtas.'),...rep(Math.max(6,Math.round((m-15)/2.5)),60,90,'forte','leve','Forte, mas controlado.','Trote leve.'),cd(5)]),
W('Intervalos longos 4×4','Corrida','Aumenta o ritmo que aguentas durante mais tempo.',['veloc'],[wu(10),...rep(4,240,180,'forte','leve','Difícil mas sustentável.','Trote leve para recuperar.'),cd(8)]),
W('Fartlek','Corrida','Variações de ritmo ao teu gosto, sem pressão.',['diversao','veloc'],[wu(5),...f,cd(5)]),
W('Treino de limiar','Corrida','Treina a manter um ritmo forte durante mais tempo.',['veloc','base'],[wu(10),st('Ritmo de limiar',1200,'Esforço confortavelmente difícil.','forte'),cd(8)]),
W('Corrida progressiva','Corrida','Começa leve e termina rápido.',['base','veloc'],[wu(5),st('Primeiro terço',th,'Fácil.','fácil'),st('Segundo terço',th,'Moderado.','moderado'),st('Último terço',th,'Mais forte.','forte'),cd(5)]),
W('Repetições em subida','Corrida','Ganha força nas pernas e potência.',['forca','veloc'],[wu(10),...rep(8,45,90,'forte','leve','Passada curta e braços ativos.','Desce a trote.'),cd(5)])]};
const bikes=d=>{const m=Math.max(40,d+10);return[
W('Pedalada de base','Bicicleta','Pedalada constante para ganhar resistência.',['base','diversao'],[wu(10,'Cadência leve e fluida.'),st('Pedalada constante',(m-15)*60,'Esforço moderado, consegues falar.','moderado'),cd(5)]),
W('Sweet spot 3×10','Bicicleta','Blocos fortes mas sustentáveis para subir de nível.',['veloc','forca'],[wu(15),...rep(3,600,300,'forte','leve','Esforço duro, ritmo constante.','Pedala leve.'),cd(10)]),
W('Sprints 6×30','Bicicleta','Potência e explosão.',['veloc'],[wu(15,'Faz 2 acelerações curtas no fim.'),...rep(6,30,210,'máximo','muito leve','Dá tudo!','Recupera bem.'),cd(10)]),
W('Recuperação ativa','Bicicleta','Pedalada leve para soltar as pernas.',['recup'],[wu(5),st('Pedalada leve',25*60,'Cadência alta, sem esforço.','muito leve'),cd(5)])]};
const walks=d=>{const m=Math.max(20,d);return[
W('Caminhada rápida','Caminhada','Boa para base e recuperação.',['base','recup','diversao'],[wu(5),st('Passo rápido',(m-10)*60,'Braços ativos, passada firme.','moderado'),cd(5)]),
W('Caminhada com intervalos','Caminhada','Alterna passo rápido e leve.',['veloc','diversao'],[wu(5),...rep(8,120,120,'rápido','leve','Passo rápido.','Passo leve.'),cd(5)])]};
const strength=n=>[
circ('Corpo inteiro','Circuito simples sem equipamento.',[['Agachamentos','Joelhos alinhados com os pés.'],['Flexões','Apoia os joelhos se precisares.'],['Afundos alternados','Passo largo e tronco direito.'],['Prancha','Corpo em linha reta.'],['Ponte de glúteos','Sobe a anca e aperta os glúteos.'],['Remada com mochila','Costas retas, puxa os cotovelos.']],n),
circ('Pernas e core','Força para correr e pedalar melhor.',[['Agachamento búlgaro','Pé de trás num sofá ou cadeira.'],['Elevação de gémeos','Sobe devagar e desce com controlo.'],['Prancha lateral','Alterna o lado a meio.'],['Dead bug','Lombar colada ao chão.'],['Passada lateral','Mantém o peito aberto.'],['Superman','Eleva braços e pernas em simultâneo.']],n),
circ('Parte superior','Peito, costas, ombros e braços.',[['Flexões','Corpo alinhado.'],['Mergulhos em cadeira','Cotovelos para trás.'],['Remada com mochila','Aproxima as omoplatas.'],['Flexões diamante','Mãos juntas.'],['Prancha com toque no ombro','Anca estável.'],['Pike push-up','Anca no ar, cabeça entre os braços.']],n)];
const hiit=()=>{const ts=[wu(5,'Mobilidade e saltinhos leves.'),...rep(8,20,10,'máximo','descanso','Dá tudo!','Respira.'),st('Pausa entre blocos',60,'Bebe água.','leve'),...rep(8,20,10,'máximo','descanso','Dá tudo!','Respira.'),cd(4)];
const ex=['Burpees (10)','Agachamentos com salto (15)','Mountain climbers (40 s)'],em=[wu(5)];for(let i=1;i<=12;i++)em.push(st(`Minuto ${i}`,60,ex[(i-1)%3]+'. Descansa o que sobrar do minuto.','forte'));em.push(cd(4));
return[W('Tabata 2 blocos','HIIT','Alta intensidade em pouco tempo.',['veloc','forca'],ts),W('HIIT 30/30','HIIT','30 segundos fortes, 30 de descanso.',['veloc','diversao'],[wu(5),...rep(10,30,30,'forte','descanso','Forte e com boa técnica.','Respira.'),cd(4)]),W('EMOM 12','HIIT','Um exercício por minuto, durante 12 minutos.',['forca','diversao'],em)]};
const yoga=()=>[
flow('Saudação ao sol','Yoga','Desperta o corpo todo.',['diversao','recup'],['Montanha','Flexão à frente','Prancha','Cobra','Cão a olhar para baixo','Flexão à frente','Montanha','Flexão à frente','Prancha','Cobra','Cão a olhar para baixo'],45),
flow('Yoga para pernas de corredor','Yoga','Alivia ancas, coxas e gémeos.',['recup','base'],['Afundo baixo','Pombo','Borboleta','Cão a olhar para baixo','Figura 4 deitado','Pernas na parede'],90),
flow('Yoga para relaxar','Yoga','Fim de dia, sem pressa.',['recup','diversao'],['Criança','Gato e vaca','Torção deitado','Joelhos ao peito','Pernas na parede'],90)];
const mob=()=>[
flow('Mobilidade de anca','Mobilidade','Mais amplitude para correr e agachar.',['recup','base'],['Círculos de anca','Agachamento profundo','Afundo com rotação','Borboleta','Ponte de glúteos','Figura 4 deitado'],60),
flow('Mobilidade de ombros e coluna','Mobilidade','Solta a parte superior do corpo.',['recup','forca'],['Círculos de ombros','Gato e vaca','Rotação torácica','Abertura de peito','Torção deitado'],60),
flow('Alongamentos pós-treino','Alongamentos','Para fazer logo a seguir a treinar.',['recup'],['Quadricípite','Isquiotibiais','Gémeos','Glúteos','Peito','Costas'],45)];
const NOV=new Set(['Caminhar e correr','Caminhada rápida','Corpo inteiro','Saudação ao sol','Yoga para pernas de corredor','Yoga para relaxar','Mobilidade de anca','Mobilidade de ombros e coluna','Alongamentos pós-treino']);
const nov=rn=>{const [w,r]=rn<2?[60,120]:rn<5?[120,90]:[180,60];return W('Caminhar e correr','Corrida','Alterna corrida leve e caminhada: ideal para começar ou voltar aos treinos.',['base','recup','diversao'],[wu(5,'Caminha a passo rápido.'),...rep(6,w,r,'trote leve','caminhada','Corre devagar: tens de conseguir falar.','Caminha e recupera o fôlego.'),cd(3,'Caminha e respira fundo.')])};
const lib=(d,nv,rn)=>[nov(rn||0),...runs(d),...bikes(d),...walks(d),...strength(nv?2:3),...hiit(),...yoga(),...mob()];
const gen=(s,d)=>W(`Sessão de ${s}`,s,'Estrutura simples para a tua prática.',['diversao','base'],[wu(d<=25?5:10,'Prepara articulações e ritmo cardíaco.'),st('Parte principal',Math.max(15,d)*60,'Pratica ao teu ritmo e cuida da técnica.','moderado'),cd(5,'Alongamentos suaves.')]);
const forSport=(s,d,nv,rn)=>{const b=AL[s]||s;const l=lib(d,nv,rn).filter(w=>w.sport===b&&(!nv||NOV.has(w.name))).map(w=>({...w,sport:s,id:s+'|'+w.name}));return l.length?l:[gen(s,d),{...gen(s,15),name:`Sessão curta de ${s}`,id:s+'|curta'}]};
function ctx(){const now=Date.now(),a28=acts.filter(a=>a.date>=now-28*864e5),a7=a28.filter(a=>a.date>=now-7*864e5);
const l7=a7.reduce((q,a)=>q+a.dur,0),l28=a28.reduce((q,a)=>q+a.dur,0)/4,cnt={};a28.forEach(a=>cnt[a.type]=(cnt[a.type]||0)+1);
const fav=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x])[0]||'Corrida',last=acts.length?Math.max(...acts.map(a=>a.date)):0,rc=acts.slice(0,10);
const av=rc.length?rc.reduce((q,a)=>q+a.dur,0)/rc.length/60:40;
const nv=a28.length<3;return{nov:nv,rn:a28.filter(a=>a.type==='Corrida').length,fat:a28.length>=4&&l7>l28*1.35&&l7>3600,fav,gap:last?Math.floor((now-last)/864e5):99,dur:nv?20:Math.min(70,Math.max(25,Math.round(av/5)*5))}}
const intent=()=>INT[ls('kr_intent','base')]?ls('kr_intent','base'):'base';
function picks(it){const c=ctx(),L=lib(c.dur,c.nov,c.rn),r=rngf(wkId(Date.now())%100000+it.charCodeAt(0)*13),B=c.nov?L.filter(w=>NOV.has(w.name)):L;
let P=B.filter(w=>w.intents.includes(it));if(P.length<3)P=B;let pool=shuf(P,r).sort((a,b)=>(a.sport===c.fav?0:1)-(b.sport===c.fav?0:1));
const cnt={},out=[];if(c.fat&&it!=='recup'){const rc=L.filter(w=>w.intents.includes('recup')&&w.sport===c.fav)[0]||L.find(w=>w.intents.includes('recup'));if(rc)out.push(rc)}
pool.forEach(w=>{cnt[w.sport]=(cnt[w.sport]||0);if(out.length<6&&cnt[w.sport]<3&&!out.includes(w)){cnt[w.sport]++;out.push(w)}});return out}
const msg=()=>{const c=ctx();return c.nov?'Para começar, sugerimos treinos curtos e suaves. Aumentamos aos poucos à medida que treinas.':c.fat?'Fizeste bastante esta semana: sugerimos começar por um treino de recuperação.':(acts.length&&c.gap>=5?`Há ${c.gap} dias que não treinas. Começa com algo leve.`:'Sugestões novas todas as segundas-feiras, a pensar na tua intenção e no teu histórico.')};
// ---------- áudio ----------
const say=t=>{if(ls('kr_audio','1')!=='1'||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='pt-PT';speechSynthesis.speak(u)}catch(e){}};
let ac;const beep=(f,ms)=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.15;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+ms/1000)}catch(e){}};
const spoken=s=>{const m=Math.floor(s/60),x=s%60;return m?`${m} minuto${m>1?'s':''}${x?` e ${x} segundos`:''}`:`${x} segundos`};
// ---------- sobreposição (pré-visualização e modo guiado) ----------
let gm;const G=()=>{if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}return gm};
const txt=w=>`${w.name} (${w.dur} min) — KeepRun\n`+w.steps.map((x,i)=>`${i+1}. ${x.n} — ${fT(x.s)}${x.tip?' ('+x.tip+')':''}`).join('\n');
function openW(w){const g=G();g.classList.add('on');
g.innerHTML=`<div class="gh"><b>${esc(w.name)}</b><button class="btn" id="gx">Fechar</button></div><p class="mu">${ic(w.sport)} ${esc(w.sport)} · ${w.dur} min · ${w.steps.length} passos<br>${esc(w.why)}</p>
<div class="gb"><button class="btn pri" id="gg">Iniciar treino</button> <button class="btn" id="gsh">Partilhar</button></div>
${w.steps.map((x,i)=>`<div class="gst"><span>${i+1}</span><div><b>${esc(x.n)}</b><div class="mu">${esc(x.tip)}</div></div><em>${fT(x.s)}</em></div>`).join('')}`;
g.querySelector('#gx').onclick=()=>g.classList.remove('on');g.querySelector('#gg').onclick=()=>runW(w);
g.querySelector('#gsh').onclick=()=>{if(navigator.share)navigator.share({title:w.name,text:txt(w)}).catch(()=>{});else{try{navigator.clipboard.writeText(txt(w))}catch(e){}toast('Treino copiado')}}}
async function runW(w){const g=G();let i=0,end=0,left=0,pause=false,last=-1,tm,wl;const tot=w.steps.reduce((q,x)=>q+x.s,0);
try{wl=await navigator.wakeLock.request('screen')}catch(e){}
g.innerHTML=`<div class="gh"><b>${esc(w.name)}</b><button class="btn" id="gx">Terminar</button></div><div class="gz" id="gz"></div><div class="gn" id="gn"></div><div class="gt" id="gt"></div><p class="mu" id="gp"></p><div class="prog"><i id="gpr"></i></div><p class="mu" id="gnx"></p>
<div class="gb"><button class="btn" id="gpa">Pausa</button> <button class="btn" id="gsk">Saltar</button></div>`;
const q=s=>g.querySelector(s),stop=()=>{clearInterval(tm);try{wl&&wl.release()}catch(e){}window.speechSynthesis&&speechSynthesis.cancel()};
const paint=()=>{const x=w.steps[i],pre=w.steps.slice(0,i).reduce((a,b)=>a+b.s,0);q('#gz').textContent=x.z;q('#gn').textContent=x.n;q('#gp').textContent=x.tip;q('#gt').textContent=fT(left);
q('#gpr').style.width=Math.min(100,(pre+x.s-left)/tot*100)+'%';q('#gnx').textContent=w.steps[i+1]?'A seguir: '+w.steps[i+1].n+' ('+fT(w.steps[i+1].s)+')':'Último passo'};
const fin=()=>{stop();say('Treino concluído. Bom trabalho!');beep(990,400);navigator.vibrate&&navigator.vibrate([200,100,200]);let d=[];try{d=JSON.parse(ls('kr_done','[]'))}catch(e){}d.unshift({name:w.name,sport:w.sport,date:Date.now(),dur:w.dur});ss('kr_done',JSON.stringify(d.slice(0,50)));
g.innerHTML=`<div class="gh"><b>Treino concluído 🎉</b></div><p>${esc(w.name)} · ${w.dur} min</p><div class="gb"><button class="btn pri" id="gx">Fechar</button></div>`;q('#gx').onclick=()=>{g.classList.remove('on');renderWO();renderWP()}};
const set=n=>{i=n;if(i>=w.steps.length)return fin();const x=w.steps[i];left=x.s;end=Date.now()+left*1000;last=-1;paint();say(`${x.n}. ${spoken(x.s)}. ${x.tip}`);beep(660,200);navigator.vibrate&&navigator.vibrate(200)};
q('#gx').onclick=()=>{if(confirm('Terminar o treino?')){stop();g.classList.remove('on')}};
q('#gsk').onclick=()=>set(i+1);
q('#gpa').onclick=()=>{pause=!pause;q('#gpa').textContent=pause?'Continuar':'Pausa';if(!pause)end=Date.now()+left*1000};
tm=setInterval(()=>{if(pause)return;left=Math.max(0,Math.ceil((end-Date.now())/1000));if(left===last)return;last=left;const x=w.steps[i];q('#gt').textContent=fT(left);
if(left>0&&left<=3)beep(880,90);if(x.s>=240&&left===Math.round(x.s/2))say('Metade do tempo');if(x.s>=90&&left===30)say('Faltam trinta segundos');
q('#gpr').style.width=Math.min(100,(w.steps.slice(0,i).reduce((a,b)=>a+b.s,0)+x.s-left)/tot*100)+'%';if(left===0)set(i+1)},300);
set(0)}
// ---------- interface ----------
let sel='Sugestões',pos=null;
const wcard=(w,i)=>`<div class="card wc" data-i="${i}"><div class="top"><span class="badge">${ic(w.sport)}</span><div><b>${esc(w.name)}</b><div class="mu">${esc(w.sport)} · ${w.dur} min</div></div></div><div class="mu">${esc(w.why)}</div></div>`;
function routes(){const c=ctx(),b=AL[sel]||sel,ty=['Corrida','Bicicleta','Caminhada'].includes(b)?b:c.fav,out=[];
acts.filter(a=>a.type===ty).slice(0,8).forEach(a=>out.push({t:a.name,d:a.dist,src:'Tu',pts:a.pts,a}));
(window.KR_fa?KR_fa():[]).filter(x=>x.type===ty&&x.r&&x.r.length>3).forEach(x=>{const p=[];for(let i=0;i+1<x.r.length;i+=2)p.push([x.r[i],x.r[i+1]]);out.push({t:x.title,d:x.dist,src:x.fname,pts:p})});
if(pos)out.forEach(o=>o.near=hav(pos,o.pts[0]));out.sort((a,b)=>pos?a.near-b.near:0);return{ty,out:out.slice(0,6)}}
function renderRoutes(){const el=$('#wr');if(!el)return;const {ty,out}=routes();
el.innerHTML=`<p class="mu">Percursos de ${ty.toLowerCase()} feitos por ti e pelos teus amigos. <button class="btn" id="wnear">Perto de mim</button></p>`+(out.length?out.map((o,i)=>`<div class="card wr" data-i="${i}">${thumb(o.pts)}<div><b>${esc(o.t)}</b><div class="mu">${(o.d/1000).toFixed(1)} km · ${esc(o.src)}${o.near!=null?' · a '+(o.near/1000).toFixed(1)+' km de ti':''}</div></div></div>`).join(''):'<p class="mu">Ainda não há percursos. Grava ou importa atividades, e os percursos dos amigos também aparecem aqui.</p>');
el.querySelectorAll('.wr').forEach(e=>e.onclick=()=>{const o=out[+e.dataset.i];if(o.a)show(o.a)});
$('#wnear').onclick=()=>{if(!navigator.geolocation)return toast('Sem GPS');navigator.geolocation.getCurrentPosition(p=>{pos=[p.coords.latitude,p.coords.longitude];renderRoutes()},()=>toast('Não consegui obter a localização'))}}
window.renderWO=function(){const el=$('#wo');if(!el)return;const c=ctx(),it=intent(),list=sel==='Sugestões'?picks(it):forSport(sel,c.dur,c.nov,c.rn);let dn=[];try{dn=JSON.parse(ls('kr_done','[]'))}catch(e){}
el.innerHTML=`<p><button class="btn" id="wb">← Voltar</button></p><div class="card"><b>Treinos para ti</b><p class="mu">${msg()}</p><div class="mu">A tua intenção:</div><div class="chips" style="margin:8px 0 0">${Object.keys(INT).map(k=>`<button class="chip ${k===it?'on':''}" data-in="${k}">${INT[k]}</button>`).join('')}</div></div>
<div class="chips">${['Sugestões',...SPORTS].map(s=>`<button class="chip ${s===sel?'on':''}" data-sp="${esc(s)}">${esc(s)}</button>`).join('')}</div>
<div id="wl">${list.map(wcard).join('')}</div><h3>Onde treinar</h3><div id="wr"></div>
<h3>Treinos concluídos</h3>${dn.length?dn.slice(0,5).map(d=>`<div class="fr"><span>${ic(d.sport)} ${esc(d.name)}</span><span class="mu">${d.dur} min · ${new Date(d.date).toLocaleDateString('pt-PT')}</span></div>`).join(''):'<p class="mu">Ainda sem treinos concluídos.</p>'}
<p style="margin-top:16px"><label><input type="checkbox" id="waud" ${ls('kr_audio','1')==='1'?'checked':''}> Avisos de áudio (treinos e corridas gravadas)</label></p>`;
el.querySelector('#wb').onclick=()=>go('feed');
el.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>{ss('kr_intent',b.dataset.in);renderWO();renderWP()});
el.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{sel=b.dataset.sp;renderWO()});
el.querySelectorAll('.wc').forEach(e=>e.onclick=()=>openW(list[+e.dataset.i]));
el.querySelector('#waud').onchange=e=>ss('kr_audio',e.target.checked?'1':'0');renderRoutes()};
window.renderWP=function(){const el=$('#wp');if(!el)return;const p=picks(intent()).slice(0,3);
el.innerHTML=`<div class="wpc"><div class="sh"><b>Treinos para ti</b><a id="wpall">Ver todos</a></div><div class="wph">${p.map((w,i)=>`<div class="wmini" data-i="${i}"><span>${ic(w.sport)}</span><b>${esc(w.name)}</b><small>${esc(w.sport)} · ${w.dur} min</small></div>`).join('')}</div></div>`;
el.querySelector('#wpall').onclick=()=>go('wo');el.querySelectorAll('.wmini').forEach(e=>e.onclick=()=>openW(p[+e.dataset.i]))};
// avisos de áudio por quilómetro nas gravações
let lk=0;setInterval(()=>{try{const s=$('#rstop');if(!s||s.classList.contains('hide')){lk=0;return}const c=calc(rp),km=Math.floor(c.dist/1000);
if(km>lk){lk=km;const t=(Date.now()-t0)/1000,p=t/(c.dist/1000),bike=$('#rtype').value==='Bicicleta';
say(`${km} quilómetro${km>1?'s':''}. Tempo ${spoken(Math.round(t))}. `+(bike?`Velocidade média ${(c.dist/t*3.6).toFixed(1)} quilómetros por hora.`:`Ritmo médio ${Math.floor(p/60)} minutos e ${Math.round(p%60)} segundos por quilómetro.`))}}catch(e){}},3000);
const rs=$('#rstart');if(rs)rs.addEventListener('click',()=>say('Gravação iniciada'));
const stl=document.createElement('style');stl.textContent=`.ov{position:fixed;inset:0;background:var(--bg);z-index:2500;display:none;overflow:auto;padding:calc(14px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))}.ov.on{display:block}
.gh{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:20px;margin-bottom:8px}.gb{margin:14px 0;display:flex;gap:10px;flex-wrap:wrap}
.gst{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--bd)}.gst span{width:26px;height:26px;border-radius:50%;background:var(--card);display:grid;place-items:center;font-size:13px;flex:none}.gst div{flex:1}.gst em{font-style:normal;color:var(--mu)}
.gz{margin-top:30px;text-transform:uppercase;letter-spacing:2px;color:var(--ac);font-weight:700;text-align:center}.gn{font-size:28px;font-weight:700;text-align:center;margin:8px 0}.gt{font-size:84px;font-weight:800;text-align:center;font-variant-numeric:tabular-nums}
#gp,#gnx{text-align:center}.wc{cursor:pointer}.wr{display:flex;gap:12px;align-items:center;cursor:pointer}.wr .th{width:80px;height:80px}
.wpc{background:var(--card);padding:14px 16px;margin-bottom:8px;border-radius:12px}.wpc .sh{margin-bottom:10px}.wph{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none}
.wmini{flex:0 0 150px;background:var(--bg);border-radius:12px;padding:12px;cursor:pointer}.wmini span{font-size:24px;display:block}.wmini b{display:block;margin:4px 0 2px;font-size:15px}.wmini small{color:var(--mu)}
@media(max-width:640px){.wpc{border-radius:0}}`;document.head.appendChild(stl);
window.KRW={lib,picks,forSport,SPORTS};renderWP();
})();
