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
const hiit=()=>{const tab=(a,b)=>{const o=[];for(let i=1;i<=8;i++){o.push(st(i%2?a:b,20,'Dá tudo!','máximo'));if(i<8)o.push(st('Descanso',10,'Respira.','descanso'))}return o};
const ts=[wu(5,'Mobilidade e saltinhos leves.'),...tab('Agachamentos com salto','Mountain climbers'),st('Pausa entre blocos',60,'Bebe água.','leve'),...tab('Burpees','Joelhos altos'),cd(4)];
const ex=[['Burpees','10 repetições.'],['Agachamentos com salto','15 repetições.'],['Mountain climbers','40 segundos.']],em=[wu(5)];
for(let i=1;i<=12;i++)em.push(st(ex[(i-1)%3][0],60,`Minuto ${i}: ${ex[(i-1)%3][1]} Descansa o que sobrar do minuto.`,'forte'));em.push(cd(4));
const nm=['Burpees','Mountain climbers','Agachamentos com salto','Joelhos altos','Polichinelos'],t30=[wu(5)];
for(let i=1;i<=10;i++){t30.push(st(nm[(i-1)%5],30,'Forte e com boa técnica.','forte'));if(i<10)t30.push(st('Descanso',30,'Respira.','descanso'))}t30.push(cd(4));
return[W('Tabata 2 blocos','HIIT','Alta intensidade em pouco tempo.',['veloc','forca'],ts),W('HIIT 30/30','HIIT','30 segundos fortes, 30 de descanso.',['veloc','diversao'],t30),W('EMOM 12','HIIT','Um exercício por minuto, durante 12 minutos.',['forca','diversao'],em)]};
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
const l7=a7.reduce((q,a)=>q+a.dur,0),l28=a28.reduce((q,a)=>q+a.dur,0)/4,cnt={};a28.forEach(a=>cnt[AL[a.type]||a.type]=(cnt[AL[a.type]||a.type]||0)+1);
const fav=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x])[0]||'Corrida',last=acts.length?Math.max(...acts.map(a=>a.date)):0,rc=acts.slice(0,10);
const av=rc.length?rc.reduce((q,a)=>q+a.dur,0)/rc.length/60:40;
const nv=a28.length<3&&acts.length<10,ret=a28.length<3&&acts.length>=10;return{nov:nv,ret,rn:a28.filter(a=>(AL[a.type]||a.type)==='Corrida').length,fat:a28.length>=4&&l7>l28*1.35&&l7>3600,fav,gap:last?Math.floor((now-last)/864e5):99,dur:nv?20:ret?Math.min(60,Math.max(25,Math.round(av*0.7/5)*5)):Math.min(70,Math.max(25,Math.round(av/5)*5))}}
const intent=()=>INT[ls('kr_intent','base')]?ls('kr_intent','base'):'base';
function picks(it){const c=ctx(),L=lib(c.dur,c.nov,c.rn),r=rngf(wkId(Date.now())%100000+it.charCodeAt(0)*13),B=c.nov?L.filter(w=>NOV.has(w.name)):L;
let P=B.filter(w=>w.intents.includes(it));if(P.length<3)P=B;let pool=shuf(P,r).sort((a,b)=>(a.sport===c.fav?0:1)-(b.sport===c.fav?0:1));
const cnt={},out=[];if(c.fat&&it!=='recup'){const rc=L.filter(w=>w.intents.includes('recup')&&w.sport===c.fav)[0]||L.find(w=>w.intents.includes('recup'));if(rc)out.push(rc)}
pool.forEach(w=>{cnt[w.sport]=(cnt[w.sport]||0);if(out.length<6&&cnt[w.sport]<3&&!out.includes(w)){cnt[w.sport]++;out.push(w)}});return out}
const msg=()=>{const c=ctx();return c.ret?'Bem-vindo de volta! Começa com treinos um pouco mais curtos e vai subindo.':c.nov?'Para começar, sugerimos treinos curtos e suaves. Aumentamos aos poucos à medida que treinas.':c.fat?'Fizeste bastante esta semana: sugerimos começar por um treino de recuperação.':(acts.length&&c.gap>=5?`Há ${c.gap} dias que não treinas. Começa com algo leve.`:'Sugestões novas todas as segundas-feiras, a pensar na tua intenção e no teu histórico.')};
// ---------- animações dos exercícios ----------
const NM={'Agachamentos':'squat','Flexões':'pushup','Flexões diamante':'pushup','Afundos alternados':'lunge','Prancha':'plank','Ponte de glúteos':'bridge','Remada com mochila':'row','Agachamento búlgaro':'bulgarian','Elevação de gémeos':'calf','Prancha lateral':'sideplank','Dead bug':'deadbug','Passada lateral':'latlunge','Superman':'superman','Mergulhos em cadeira':'dips','Prancha com toque no ombro':'plankTap','Pike push-up':'pike','Burpees':'burpee','Agachamentos com salto':'squatjump','Mountain climbers':'climbers','Polichinelos':'jacks','Joelhos altos':'highknees','Respiração inicial':'seated','Montanha':'mountain','Flexão à frente':'fold','Cobra':'cobra','Cão a olhar para baixo':'downdog','Afundo baixo':'lowlunge','Pombo':'pigeon','Borboleta':'butterfly','Figura 4 deitado':'fig4','Pernas na parede':'legsup','Criança':'child','Gato e vaca':'catcow','Torção deitado':'twist','Joelhos ao peito':'kneehug','Relaxamento final':'savasana','Círculos de anca':'hipcircle','Agachamento profundo':'deepsquat','Afundo com rotação':'lungetwist','Círculos de ombros':'shouldercircle','Rotação torácica':'thoracic','Abertura de peito':'chestopen','Quadricípite':'quadstretch','Isquiotibiais':'hamstring','Gémeos':'calfstretch','Glúteos':'fig4','Peito':'chestopen','Costas':'child'};
function animFor(w,x){const n=x.n.replace(/\s*\(.*\)$/,'');if(NM[n])return NM[n];if(/^(Descanso|Pausa)/.test(n))return'rest';
  const sp=AL[w.sport]||w.sport,z=x.z||'';if(sp==='Bicicleta')return'bike';if(sp==='Caminhada')return'walk';
  if(sp==='Corrida'){if(z==='caminhada'||/^Retorno/.test(n)||(/^Aquecimento/.test(n)&&w.name==='Caminhar e correr'))return'walk';return/forte|máximo|rápido/.test(z)?'run':'jog'}
  if(/^Aquecimento/.test(n))return sp==='Força'?'hipcircle':['Yoga','Mobilidade','Alongamentos'].includes(sp)?'seated':'jacks';
  if(/^Retorno/.test(n))return'fold';return null}
// ---------- áudio ----------
let ac;const AC=()=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){}return ac};
const tone=(f,t0,d)=>{const a=AC();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+t0;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.05)};
const chime=k=>{if(ls('kr_audio','1')!=='1')return;try{
if(k==='work'){tone(660,0,.35);tone(880,.16,.5)}else if(k==='rest'){tone(880,0,.35);tone(660,.16,.5)}else if(k==='km'){tone(784,0,.4);tone(784,.25,.5)}else if(k==='done'){tone(523,0,.4);tone(659,.18,.4);tone(784,.36,.4);tone(1047,.54,.8)}
navigator.vibrate&&navigator.vibrate(k==='done'?[200,100,200]:150)}catch(e){}};
const isRest=x=>/^(Recuperação|Descanso|Pausa|Retorno|Relaxamento|Leve)/.test(x.n);
// ---------- sobreposição (pré-visualização e modo guiado) ----------
let gm;const G=()=>{if(!gm){gm=document.createElement('div');gm.id='gm';gm.className='ov';document.body.appendChild(gm)}return gm};
const txt=w=>`${w.name} (${w.dur} min) — KeepRun\n`+w.steps.map((x,i)=>`${i+1}. ${x.n} — ${fT(x.s)}${x.tip?' ('+x.tip+')':''}`).join('\n');
function openW(w){const g=G();g.classList.add('on');
g.innerHTML=`<div class="gh"><b>${esc(w.name)}</b><button class="btn" id="gx">Fechar</button></div><p class="mu">${ic(w.sport)} ${esc(w.sport)} · ${w.dur} min · ${w.steps.length} passos<br>${esc(w.why)}</p>
${OUT.has(w.sport)?'<label class="ck"><input type="checkbox" id="gpsb" checked> Gravar percurso com GPS</label>':''}<div class="gb"><button class="btn pri" id="gg">Iniciar treino</button> <button class="btn" id="gsh">Partilhar</button></div>
${w.steps.map((x,i)=>`<div class="gst"><div class="gth"></div><div><b>${esc(x.n)}</b><div class="mu">${esc(x.tip)}</div></div><em>${fT(x.s)}</em></div>`).join('')}`;
g.querySelectorAll('.gth').forEach((e,i)=>{const k=animFor(w,w.steps[i]);if(k&&window.KRAnim&&KRAnim.has(k))KRAnim.mount(e,k);else e.textContent=ic(w.sport)});
g.querySelector('#gx').onclick=()=>g.classList.remove('on');g.querySelector('#gg').onclick=()=>{const b=g.querySelector('#gpsb');runW(w,!!(b&&b.checked))};
g.querySelector('#gsh').onclick=()=>{if(navigator.share)navigator.share({title:w.name,text:txt(w)}).catch(()=>{});else{try{navigator.clipboard.writeText(txt(w))}catch(e){}toast('Treino copiado')}}}
const EFF=n=>n<=2?'Muito fácil':n<=4?'Fácil':n<=6?'Moderado':n<=8?'Difícil':'Máximo';
const OUT=new Set(['Corrida','Trail','Caminhada','Caminhada nórdica','Hiking','Bicicleta','Ciclismo de montanha','Patinagem','Remo','Caiaque','Stand-up paddle','Esqui de fundo','Triatlo']);
function saveForm(w,o){const g=G(),hasZ=(()=>{try{return !!JSON.parse(ls('kr_pz','null'))}catch(e){return false}})(),gps=o.pts.length>1,c=gps?calc(o.pts):{dist:0,elev:0};
g.classList.add('on');
g.innerHTML=`<div class="gh"><b>Guardar atividade</b></div><p class="mu">${ic(w.sport)} ${esc(w.sport)} · ${fT(o.elapsed)}${c.dist?' · '+(c.dist/1000).toFixed(2)+' km':''}</p>
<label class="lb">Título</label><input id="sf-t" value="${esc(w.name)}" maxlength="60" style="width:100%">
<label class="lb">Descrição</label><textarea id="sf-d" rows="3" maxlength="300" placeholder="Como correu?" style="width:100%"></textarea>
<label class="lb">Esforço percebido: <b id="sf-ev" style="color:var(--tx)">5</b>/10 · <span id="sf-el">Moderado</span></label><input id="sf-e" type="range" min="1" max="10" value="5" style="width:100%">
<label class="lb">Visibilidade</label><label class="ck"><input type="checkbox" id="sf-s" ${ls('kr_share','1')==='1'?'checked':''}> Partilhar com amigos</label>
${gps?`<label class="ck"><input type="checkbox" id="sf-m" ${hasZ?'checked':''}> Mostrar o percurso no mapa aos amigos</label>${hasZ?'':'<div class="mu">Define uma zona de privacidade em Eu para esconder a tua casa.</div>'}`:''}
<div class="gb"><button class="btn pri" id="sf-ok">Guardar atividade</button> <button class="btn" id="sf-no">Descartar</button></div>`;
const q=x=>g.querySelector(x);
q('#sf-e').oninput=e=>{q('#sf-ev').textContent=e.target.value;q('#sf-el').textContent=EFF(+e.target.value)};
q('#sf-no').onclick=()=>{if(confirm('Descartar esta atividade?'))g.classList.remove('on')};
q('#sf-ok').onclick=()=>{const a={id:Date.now()+Math.random(),name:(q('#sf-t').value.trim()||w.name).slice(0,60),type:w.sport,date:o.start,pts:thin(o.pts),dist:c.dist,dur:Math.round(o.elapsed),elev:c.elev,eff:+q('#sf-e').value,desc:q('#sf-d').value.trim().slice(0,300),share:q('#sf-s').checked,showMap:q('#sf-m')?q('#sf-m').checked:false,workout:w.name};
acts.push(a);save();let d=[];try{d=JSON.parse(ls('kr_done','[]'))}catch(e){}d.unshift({name:a.name,sport:w.sport,date:a.date,dur:Math.max(1,Math.round(a.dur/60))});ss('kr_done',JSON.stringify(d.slice(0,50)));
g.classList.remove('on');renderList();go('feed');toast('Atividade guardada')}}
let running=false;
async function runW(w,gps){if(running)return;running=true;const g=G();AC();let i=0,left=0,pause=false,pS=0,pt=0,off=0,last=-1,tm,wl=null,wid2=null,curK,ctl=null;const start=Date.now(),pts=[],cum=[0];
w.steps.forEach(x=>cum.push(cum[cum.length-1]+x.s));const tot=cum[cum.length-1];
const getWL=async()=>{try{wl=await navigator.wakeLock.request('screen')}catch(e){}},vc=()=>{if(!document.hidden)getWL()};
await getWL();document.addEventListener('visibilitychange',vc);
if(gps&&navigator.geolocation)wid2=navigator.geolocation.watchPosition(p=>{if(p.coords.accuracy<=40&&!pause)pts.push([p.coords.latitude,p.coords.longitude,p.coords.altitude,p.timestamp])},()=>{},{enableHighAccuracy:true});
g.innerHTML=`<div class="gh"><b>${esc(w.name)}</b><button class="btn" id="gx">Terminar</button></div><div class="gz" id="gz"></div><div class="gn" id="gn"></div><div class="gan" id="gan"></div><div class="gt" id="gt"></div><p class="mu" id="gp"></p><div class="prog"><i id="gpr"></i></div><p class="mu" id="gnx"></p>
<div class="gb"><button class="btn" id="gpa">Pausa</button> <button class="btn" id="gsk">Saltar</button></div>`;
const q=x=>g.querySelector(x),sched=()=>((pause?pS:Date.now())-start-pt+off)/1000,idxAt=t=>{for(let k=0;k<w.steps.length;k++)if(t<cum[k+1])return k;return w.steps.length};
const stop=()=>{running=false;if(ctl)ctl.stop();clearInterval(tm);document.removeEventListener('visibilitychange',vc);try{wl&&wl.release()}catch(e){}if(wid2!=null)navigator.geolocation.clearWatch(wid2)};
const prog=()=>{q('#gpr').style.width=Math.min(100,sched()/tot*100)+'%'};
const paint=()=>{const x=w.steps[i],k=animFor(w,x);if(k!==curK){curK=k;if(ctl)ctl.stop();ctl=null;const bx=q('#gan');bx.innerHTML='';if(k&&window.KRAnim&&KRAnim.has(k))ctl=KRAnim.mount(bx,k);else bx.innerHTML=`<div class="gem">${ic(w.sport)}</div>`}
q('#gz').textContent=x.z;q('#gn').textContent=x.n;q('#gp').textContent=x.tip;q('#gt').textContent=fT(left);prog();q('#gnx').textContent=w.steps[i+1]?'A seguir: '+w.steps[i+1].n+' ('+fT(w.steps[i+1].s)+')':'Último passo'};
const fin=early=>{stop();const el=Math.round((Date.now()-start-pt-(pause?Date.now()-pS:0))/1000);
if(early&&el<60){g.classList.remove('on');return}
if(!early)chime('done');
saveForm(w,{start,elapsed:el,pts})};
const set=n=>{i=n;if(i>=w.steps.length)return fin(false);const x=w.steps[i];left=Math.max(0,Math.ceil(cum[i+1]-sched()));last=-1;paint();chime(isRest(x)?'rest':'work')};
q('#gx').onclick=()=>{if(confirm('Terminar o treino?'))fin(true)};
q('#gsk').onclick=()=>{off+=(cum[i+1]-sched())*1000;set(i+1)};
q('#gpa').onclick=()=>{pause=!pause;q('#gpa').textContent=pause?'Continuar':'Pausa';if(pause){pS=Date.now();if(ctl)ctl.stop()}else{pt+=Date.now()-pS;if(ctl)ctl.play()}};
tm=setInterval(()=>{if(pause)return;const t=sched(),k=idxAt(t);if(k!==i)return set(k);left=Math.max(0,Math.ceil(cum[i+1]-t));if(left===last)return;last=left;q('#gt').textContent=fT(left);prog()},300);
set(0)}
// ---------- interface ----------
let sel='Sugestões',pos=null;
const wcard=(w,i)=>`<div class="card wc" data-i="${i}"><div class="top"><span class="badge">${ic(w.sport)}</span><div><b>${esc(w.name)}</b><div class="mu">${esc(w.sport)} · ${w.dur} min · ~${estKcal(w)} kcal</div></div></div><div class="mu">${esc(w.why)}</div></div>`;
// ---------- MyFitnessPal (screenshot OCR + plano de treino nutricional) ----------
const estKcal=w=>Math.round(w.steps.reduce((s,x)=>{const z=x.z||'',r=/máximo|forte|rápido/.test(z)?10.5:/moderado|fácil/.test(z)?7.8:['Yoga','Mobilidade','Alongamentos'].includes(w.sport)?3.6:5.2;return s+(x.s/60)*r},0));
const getMFP=()=>{try{const m=JSON.parse(ls('kr_mfp','null'));return m&&isFinite(+m.food)&&isFinite(+m.goal)?{food:Math.max(0,Math.round(+m.food)),goal:Math.max(800,Math.round(+m.goal)),carbs:Math.max(0,Math.round(+m.carbs||0)),protein:Math.max(0,Math.round(+m.protein||0)),fat:Math.max(0,Math.round(+m.fat||0)),meals:Array.isArray(m.meals)?m.meals.slice(0,6).map(x=>String(x).slice(0,50)):[],ts:+m.ts||Date.now()}:null}catch(e){return null}};
const setMFP=m=>{ss('kr_mfp',m?JSON.stringify(m):'null');if(window.renderWO)renderWO();if(window.renderWP)renderWP()};
function mfpInfo(){const m=getMFP();if(!m)return null;const c=ctx(),diff=m.food-m.goal,totM=(m.carbs*4+m.protein*4+m.fat*9)||1,cPct=Math.round(m.carbs*400/totM),pPct=Math.round(m.protein*400/totM),fPct=Math.max(0,100-cPct-pPct);
  const L=lib(c.dur,c.nov,c.rn),byName=n=>L.find(w=>w.name===n);
  if(diff>150){
    const targetMin=Math.min(75,Math.max(25,Math.round(diff/8.5/5)*5));
    const burnW=W('Queima Calórica MyFitnessPal','Corrida',`Ajustado para compensar o excedente de +${diff} kcal do teu registo alimentar.`,['veloc','base'],[wu(5),...rep(Math.max(4,Math.round((targetMin-10)/4)),120,60,'forte','fácil','Ritmo vivo para elevar o gasto energético.','Trote suave em movimento.'),cd(5)]);
    return{m,diff,cPct,pPct,fPct,badge:'🔥 Excedente +'+diff+' kcal',title:`Excedente calórico (+${diff} kcal)`,
      summary:`Registaste ${m.food} kcal (meta: ${m.goal} kcal). Tens energia extra disponível: sugerimos treinos de maior gasto calórico (~${targetMin} min) ou HIIT para equilibrar o balanço diário.`,
      plan:[burnW,byName('HIIT 30/30'),byName('Corrida progressiva'),byName('Corpo inteiro')].filter(Boolean)}
  }
  if(diff<-300||m.food<1200){
    return{m,diff,cPct,pPct,fPct,badge:'🛡️ Défice '+diff+' kcal',title:`Défice calórico (${m.food} / ${m.goal} kcal)`,
      summary:`Estás ${Math.abs(diff)} kcal abaixo da meta. Para preservar massa muscular e evitar fadiga excessiva, recomendamos cardio leve (Zona 2), força controlada e mobilidade.`,
      plan:[byName('Corrida de recuperação'),byName('Caminhada rápida'),strength(2)[0],byName('Yoga para relaxar')].filter(Boolean)}
  }
  if(m.carbs>=180||(cPct>=50&&m.food>=1600)){
    return{m,diff,cPct,pPct,fPct,badge:'⚡ Hidratos altos ('+m.carbs+'g)',title:`Reservas de glicogénio altas (${m.carbs}g HC)`,
      summary:`As tuas refeições têm ótimo aporte de hidratos (${m.carbs}g · ${cPct}%). É o combustível ideal para sessões intensas de velocidade, limiar ou subidas.`,
      plan:[byName('Intervalos curtos'),byName('Treino de limiar'),byName('Repetições em subida'),byName('Sweet spot 3×10')].filter(Boolean)}
  }
  if(m.protein>=100||(pPct>=25&&m.food>=1400)){
    return{m,diff,cPct,pPct,fPct,badge:'💪 Proteína alta ('+m.protein+'g)',title:`Foco em força e síntese muscular (${m.protein}g Prot)`,
      summary:`Excelente suporte proteico (${m.protein}g · ${pPct}%). Aproveita para estimular força muscular, core e potência.`,
      plan:[byName('Corpo inteiro'),byName('Pernas e core'),byName('Parte superior'),byName('EMOM 12')].filter(Boolean)}
  }
  return{m,diff,cPct,pPct,fPct,badge:'🥗 Nutrição equilibrada',title:`Balanço energético equilibrado (${m.food} / ${m.goal} kcal)`,
    summary:`Refeições alinhadas com a tua meta diária (${m.carbs}g HC · ${m.protein}g Prot · ${m.fat}g Gord). Plano equilibrado de resistência, força e mobilidade.`,
    plan:[byName('Corrida fácil'),byName('Fartlek'),byName('Corpo inteiro'),byName('Mobilidade de anca')].filter(Boolean)}
}
function parseMFPText(raw){
  const txt=String(raw||'').replace(/\r/g,'\n'),cleanNum=s=>parseInt(String(s).replace(/[.,\s]/g,''),10);
  let goal=0,food=0,carbs=0,protein=0,fat=0;const meals=[];
  // 0) Suporte para exportação CSV estruturada do MyFitnessPal (colunas Date, Meal, Calories, Fat (g), Carbohydrates (g), Protein (g))
  const lines=txt.split('\n').map(l=>l.trim()).filter(Boolean);
  if(lines.length>=2&&/,/.test(lines[0])&&/calor/i.test(lines[0])){
    const splitCSV=l=>{const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(c.trim());c=''}else c+=ch}o.push(c.trim());return o};
    const hdr=splitCSV(lines[0]).map(h=>h.toLowerCase()),iCal=hdr.findIndex(h=>/calor/.test(h)),iCarb=hdr.findIndex(h=>/carb|hidrato/.test(h)),iProt=hdr.findIndex(h=>/prot/.test(h)),iFat=hdr.findIndex(h=>/^(fat|gordura|l[ií]pido)/.test(h)),iDate=hdr.findIndex(h=>/date|data/.test(h)),iMeal=hdr.findIndex(h=>/meal|refei/.test(h));
    if(iCal>=0){
      const rows=lines.slice(1).map(splitCSV).filter(r=>r.length>iCal&&isFinite(parseFloat(r[iCal])));
      if(rows.length){
        const lastDate=iDate>=0?rows[rows.length-1][iDate]:null,dayRows=lastDate?rows.filter(r=>r[iDate]===lastDate):rows;
        dayRows.forEach(r=>{const kc=Math.round(parseFloat(r[iCal])||0);food+=kc;if(iCarb>=0)carbs+=Math.round(parseFloat(r[iCarb])||0);if(iProt>=0)protein+=Math.round(parseFloat(r[iProt])||0);if(iFat>=0)fat+=Math.round(parseFloat(r[iFat])||0);if(iMeal>=0&&r[iMeal]&&kc>0)meals.push(`${r[iMeal]}: ${kc} kcal`)});
      }
    }
  }
  // 1) Tentar encontrar a equação clássica do MyFitnessPal: Meta - Alimentos + Exercício = Restantes
  const nums=(txt.match(/\b\d{1,2}[.,]\d{3}\b|\b\d{1,4}\b/g)||[]).map(cleanNum).filter(n=>isFinite(n)&&n>=0&&n<=12000);
  for(let i=0;i+3<nums.length;i++){
    const G=nums[i],F=nums[i+1],E=nums[i+2],R=nums[i+3];
    if(G>=1000&&G<=5500&&F>=100&&F<=8000&&E<=3500&&(Math.abs((G-F+E)-R)<=15||Math.abs(Math.abs(G-F+E)-R)<=15)){goal=G;if(!food)food=F;break}
  }
  // 2) Refeições individuais (PT / EN)
  let mealSum=0;
  if(!meals.length){
    for(const [label,rx] of [['Pequeno-almoço',/(?:pequeno[-\s]*almo[cç]o|caf[eé]\s*da\s*manh[aã]|breakfast)[^\d\n]{0,30}(\d{1,2}[.,]\d{3}|\d{2,4})/i],['Almoço',/(?:^|[\n\r\s])(?:almo[cç]o|lunch)[^\d\n]{0,30}(\d{1,2}[.,]\d{3}|\d{2,4})/i],['Jantar',/(?:jantar|dinner)[^\d\n]{0,30}(\d{1,2}[.,]\d{3}|\d{2,4})/i],['Lanches',/(?:lanches?|snacks?)[^\d\n]{0,30}(\d{1,2}[.,]\d{3}|\d{2,4})/i]]){
      const m=txt.match(rx);if(m){const v=cleanNum(m[1]);if(v>0&&v<4500){mealSum+=v;meals.push(`${label}: ${v} kcal`)}}
    }
  }
  if(!food&&mealSum>0)food=mealSum;
  // 3) Macros (Hidratos / Carbs, Proteína / Protein, Gordura / Fat) em gramas
  const mCarb=txt.match(/(?:hidratos(?:\s*de\s*carbono)?|carboidratos|carbohydrates|carbs)[^\d\n]{0,35}(\d{1,4})\s*g\b/i)||txt.match(/(\d{1,4})\s*g\s*(?:hidratos|carboidratos|carbs|carbohydrates)/i);
  const mProt=txt.match(/(?:prote[ií]nas?|protein)[^\d\n]{0,35}(\d{1,4})\s*g\b/i)||txt.match(/(\d{1,4})\s*g\s*(?:prote[ií]nas?|protein)/i);
  const mFat=txt.match(/(?:gorduras?|l[ií]pidos|fat)[^\d\n]{0,35}(\d{1,4})\s*g\b/i)||txt.match(/(\d{1,4})\s*g\s*(?:gorduras?|l[ií]pidos|fat)/i);
  if(!carbs&&mCarb)carbs=Math.min(1200,cleanNum(mCarb[1]));
  if(!protein&&mProt)protein=Math.min(600,cleanNum(mProt[1]));
  if(!fat&&mFat)fat=Math.min(500,cleanNum(mFat[1]));
  // 4) Fallback de calorias / meta se ainda não encontrados
  if(!goal){const mg=txt.match(/(?:meta|goal|objetivo)[^\d\n]{0,25}(\d{1,2}[.,]\d{3}|\d{3,4})/i);if(mg)goal=cleanNum(mg[1])}
  if(!food){const mf=txt.match(/(?:alimentos|comida|food|total|consumid[oa]s?)[^\d\n]{0,25}(\d{1,2}[.,]\d{3}|\d{3,4})/i);if(mf)food=cleanNum(mf[1])}
  if(!food&&(carbs||protein||fat))food=carbs*4+protein*4+fat*9;
  if(!goal){const cands=nums.filter(n=>n>=1200&&n<=4500);goal=cands[0]||2000}
  if(!food){const cands=nums.filter(n=>n>=200&&n<=5000&&n!==goal);food=cands[0]||1800}
  if(!carbs&&!protein&&!fat&&food>0){carbs=Math.round(food*0.48/4);protein=Math.round(food*0.24/4);fat=Math.round(food*0.28/9)}
  return{food:Math.max(100,Math.min(10000,food)),goal:Math.max(800,Math.min(8000,goal)),carbs:Math.min(1200,carbs),protein:Math.min(600,protein),fat:Math.min(500,fat),meals:meals.slice(0,6),ts:Date.now()}
}
let tessP=null;
function loadTess(){if(window.Tesseract)return Promise.resolve(window.Tesseract);if(tessP)return tessP;
  tessP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.crossOrigin='anonymous';s.onload=()=>res(window.Tesseract);s.onerror=()=>{tessP=null;rej(new Error('Sem ligação ao motor OCR'))};document.head.appendChild(s)});return tessP}
async function preprocessImg(file){
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
    const sc=Math.min(2,Math.max(1,1400/Math.max(img.width,img.height,1))),w=Math.round(img.width*sc),h=Math.round(img.height*sc);
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.drawImage(img,0,0,w,h);
    const previewUrl=cv.toDataURL('image/jpeg',0.82);
    const id=cx.getImageData(0,0,w,h),d=id.data;let sum=0;
    for(let i=0;i<d.length;i+=4)sum+=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
    const dark=(sum/(d.length/4))<115;
    for(let i=0;i<d.length;i+=4){let y=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];if(dark)y=255-y;y=Math.max(0,Math.min(255,(y-128)*1.35+128));d[i]=d[i+1]=d[i+2]=y}
    cx.putImageData(id,0,0);URL.revokeObjectURL(url);return{dataUrl:previewUrl,ocrSource:cv.toDataURL('image/png')}
  }catch(e){return{dataUrl:url,ocrSource:url}}
}
let mfpPreviewUrl='';
window.openMFP=function(){
  const g=G(),cur=getMFP()||{food:1950,goal:2000,carbs:220,protein:115,fat:65,meals:[]},inf=mfpInfo();
  g.classList.add('on');
  g.innerHTML=`<div class="gh"><b>🥗 MyFitnessPal → Plano de Treino</b><button class="btn" id="gx">Fechar</button></div>
  <p class="mu">Anexa um screenshot do diário de refeições ou de macronutrientes do MyFitnessPal (ou ficheiro CSV). O KeepRun lê os dados da imagem e adapta os teus treinos ao teu estado energético.</p>
  <div class="gb"><label class="btn pri" style="cursor:pointer">📸 Anexar screenshot MyFitnessPal<input id="mfp-f" type="file" accept="image/*,.csv,text/csv" hidden></label>${getMFP()?'<button class="btn" id="mfp-clr">Limpar dados</button>':''}</div>
  <div id="mfp-st" class="mu" style="margin:6px 0"></div>
  ${mfpPreviewUrl?`<div style="margin:8px 0;text-align:center"><img src="${esc(mfpPreviewUrl)}" alt="Screenshot MyFitnessPal" style="max-height:180px;max-width:100%;border-radius:10px;border:1px solid var(--bd)"></div>`:''}
  <div class="card" style="margin-top:10px"><b>Dados nutricionais do dia</b><div class="mu" id="mfp-meals">${cur.meals&&cur.meals.length?'Refeições lidas: '+cur.meals.map(esc).join(' · '):'Podes anexar um screenshot acima ou ajustar os valores abaixo:'}</div>
  <div class="row" style="margin-top:8px">
    <div><label class="lb" style="margin-top:4px">Consumido (kcal)</label><input id="mfp-food" type="number" min="0" max="12000" value="${cur.food}" style="width:100%"></div>
    <div><label class="lb" style="margin-top:4px">Meta (kcal)</label><input id="mfp-goal" type="number" min="800" max="8000" value="${cur.goal}" style="width:100%"></div>
  </div>
  <div class="row" style="margin-top:6px">
    <div><label class="lb" style="margin-top:4px">Hidratos (g)</label><input id="mfp-c" type="number" min="0" max="1200" value="${cur.carbs}" style="width:100%"></div>
    <div><label class="lb" style="margin-top:4px">Proteína (g)</label><input id="mfp-p" type="number" min="0" max="600" value="${cur.protein}" style="width:100%"></div>
    <div><label class="lb" style="margin-top:4px">Gordura (g)</label><input id="mfp-fat" type="number" min="0" max="500" value="${cur.fat}" style="width:100%"></div>
  </div>
  <div class="gb" style="margin-bottom:0"><button class="btn pri" id="mfp-save">Gerar plano de exercícios</button></div></div>
  ${inf?`<div class="card"><b>${esc(inf.title)}</b><p class="mu">${esc(inf.summary)}</p>
  <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin:8px 0"><div style="width:${inf.cPct}%;background:#3b82f6" title="Hidratos"></div><div style="width:${inf.pPct}%;background:#10b981" title="Proteína"></div><div style="width:${inf.fPct}%;background:#f59e0b" title="Gordura"></div></div>
  <div class="mu" style="margin-bottom:10px">🔵 Hidratos ${inf.cPct}% (${inf.m.carbs}g) · 🟢 Proteína ${inf.pPct}% (${inf.m.protein}g) · 🟡 Gordura ${inf.fPct}% (${inf.m.fat}g)</div>
  <b>Plano de exercícios recomendado:</b><div style="margin-top:8px">${inf.plan.map((w,i)=>`<div class="card wc mfp-w" data-i="${i}" style="background:var(--bg)"><div class="top"><span class="badge">${ic(w.sport)}</span><div><b>${esc(w.name)}</b><div class="mu">${esc(w.sport)} · ${w.dur} min · ~${estKcal(w)} kcal</div></div></div><div class="mu">${esc(w.why)}</div></div>`).join('')}</div></div>`:''}`;
  const q=s=>g.querySelector(s);
  q('#gx').onclick=()=>g.classList.remove('on');
  if(q('#mfp-clr'))q('#mfp-clr').onclick=()=>{mfpPreviewUrl='';setMFP(null);openMFP();toast('Dados MyFitnessPal removidos')};
  q('#mfp-save').onclick=()=>{
    const m={food:Math.max(0,+q('#mfp-food').value||0),goal:Math.max(800,+q('#mfp-goal').value||2000),carbs:Math.max(0,+q('#mfp-c').value||0),protein:Math.max(0,+q('#mfp-p').value||0),fat:Math.max(0,+q('#mfp-fat').value||0),meals:(getMFP()||{}).meals||[],ts:Date.now()};
    setMFP(m);openMFP();toast('Plano de treino atualizado!')
  };
  if(inf)g.querySelectorAll('.mfp-w').forEach(e=>e.onclick=()=>openW(inf.plan[+e.dataset.i]));
  q('#mfp-f').onchange=async e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    const st=q('#mfp-st');
    if(/\.csv$/i.test(f.name)||f.type==='text/csv'){
      try{const parsed=parseMFPText(await f.text());setMFP(parsed);openMFP();toast('CSV do MyFitnessPal analisado!')}catch(x){toast('Erro ao ler CSV')}
      return;
    }
    st.textContent='⏳ A analisar o screenshot do MyFitnessPal…';
    try{
      const {dataUrl,ocrSource}=await preprocessImg(f);mfpPreviewUrl=dataUrl;
      const T=await loadTess();
      const res=await T.recognize(ocrSource,'por+eng',{logger:m=>{if(m.status==='recognizing text'&&st)st.textContent=`⏳ A ler dados da imagem (${Math.round((m.progress||0)*100)}%)…`}});
      const parsed=parseMFPText(res&&res.data&&res.data.text?res.data.text:'');
      setMFP(parsed);openMFP();toast('Screenshot analisado! Plano de treino gerado.')
    }catch(err){
      openMFP();const st2=g.querySelector('#mfp-st');if(st2)st2.textContent='⚠️ Sem ligação ao motor OCR automático: confirma ou introduz os valores da imagem abaixo.';
    }
  };
};
function routes(){const c=ctx(),b=AL[sel]||sel,ty=['Corrida','Bicicleta','Caminhada'].includes(b)?b:c.fav,out=[];
acts.filter(a=>(AL[a.type]||a.type)===ty&&a.pts&&a.pts.length>1).slice(0,8).forEach(a=>out.push({t:a.name,d:a.dist,src:'Tu',pts:a.pts,a}));
(window.KR_fa?KR_fa():[]).filter(x=>(AL[x.type]||x.type)===ty&&x.r&&x.r.length>3).forEach(x=>{const p=[];for(let i=0;i+1<x.r.length;i+=2)p.push([x.r[i],x.r[i+1]]);out.push({t:x.title,d:x.dist,src:x.fname,pts:p})});
if(pos)out.forEach(o=>o.near=hav(pos,o.pts[0]));out.sort((a,b)=>pos?a.near-b.near:0);return{ty,out:out.slice(0,6)}}
let rmap2;
function openRoute(o){const g=G();g.classList.add('on');
if(rmap2){try{rmap2.remove()}catch(e){}rmap2=null}
g.innerHTML=`<div class="gh"><b>${esc(o.t)}</b><button class="btn" id="gx">Fechar</button></div><p class="mu">${(Number(o.d)/1000||0).toFixed(1)} km · ${esc(o.src)}</p><div id="rm2" style="height:55vh;border-radius:12px"></div>`;
g.querySelector('#gx').onclick=()=>{if(rmap2){try{rmap2.remove()}catch(e){}rmap2=null}g.classList.remove('on')};
if(!window.L){g.querySelector('#rm2').innerHTML='<p class="mu" style="padding:16px">O mapa não está disponível sem ligação.</p>';return}
const m=rmap2=L.map('rm2');L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:ATTR}).addTo(m);
const pl=L.polyline(o.pts.map(p=>[p[0],p[1]]),{color:'#fc4c02',weight:4}).addTo(m);setTimeout(()=>{m.invalidateSize();m.fitBounds(pl.getBounds(),{padding:[20,20]})},50)}
function renderRoutes(){const el=$('#wr');if(!el)return;const {ty,out}=routes();
el.innerHTML=`<p class="mu">Percursos de ${esc(ty.toLowerCase())} feitos por ti e pelos teus amigos. <button class="btn" id="wnear">Perto de mim</button></p>`+(out.length?out.map((o,i)=>`<div class="card wr" data-i="${i}">${thumb(o.pts)}<div><b>${esc(o.t)}</b><div class="mu">${(Number(o.d)/1000||0).toFixed(1)} km · ${esc(o.src)}${o.near!=null?' · a '+(o.near/1000).toFixed(1)+' km de ti':''}</div></div></div>`).join(''):'<p class="mu">Ainda não há percursos. Grava ou importa atividades, e os percursos dos amigos também aparecem aqui.</p>');
el.querySelectorAll('.wr').forEach(e=>e.onclick=()=>{const o=out[+e.dataset.i];if(o.a)show(o.a);else openRoute(o)});
$('#wnear').onclick=()=>{if(!navigator.geolocation)return toast('Sem GPS');navigator.geolocation.getCurrentPosition(p=>{pos=[p.coords.latitude,p.coords.longitude];renderRoutes()},()=>toast('Não consegui obter a localização'))}}
window.renderWO=function(){const el=$('#wo');if(!el)return;const oldC=el.querySelector('#spc'),sx=oldC?oldC.scrollLeft:0,oy=window.scrollY;const c=ctx(),it=intent(),inf=mfpInfo(),baseList=sel==='Sugestões'?picks(it):forSport(sel,c.dur,c.nov,c.rn),list=(sel==='Sugestões'&&inf)?[...inf.plan,...baseList.filter(w=>!inf.plan.some(p=>p.name===w.name))].slice(0,6):baseList;let dn=[];try{dn=JSON.parse(ls('kr_done','[]'))}catch(e){}
el.innerHTML=`<p><button class="btn" id="wb">← Voltar</button></p><div class="card"><b>Treinos para ti</b><p class="mu">${msg()}</p><div class="mu">A tua intenção:</div><div class="chips" style="margin:8px 0 0">${Object.keys(INT).map(k=>`<button class="chip ${k===it?'on':''}" data-in="${k}">${INT[k]}</button>`).join('')}</div></div>
<div class="card"><div class="sh" style="margin-bottom:6px"><b>🥗 Nutrição (MyFitnessPal)</b><button class="btn pri" id="mfp-btn" style="padding:5px 10px;font-size:13px">📸 Anexar screenshot</button></div>${inf?`<div class="mu" style="margin-bottom:4px"><b style="color:var(--ac)">${esc(inf.title)}</b> — ${esc(inf.summary)}</div><div class="mu">🔵 HC ${inf.m.carbs}g (${inf.cPct}%) · 🟢 Prot ${inf.m.protein}g (${inf.pPct}%) · 🟡 Gord ${inf.m.fat}g (${inf.fPct}%)</div>`:`<p class="mu" style="margin:0">Anexa um screenshot dos teus meal logs do MyFitnessPal para receberes um plano de exercícios adaptado às tuas calorias e macronutrientes.</p>`}</div>
<div class="chips" id="spc">${['Sugestões',...SPORTS].map(s=>`<button class="chip ${s===sel?'on':''}" data-sp="${esc(s)}">${esc(s)}</button>`).join('')}</div>
<div id="wl">${list.map(wcard).join('')}</div><h3>Onde treinar</h3><div id="wr"></div>
<h3>Treinos concluídos</h3>${dn.length?dn.slice(0,5).map(d=>`<div class="fr"><span>${ic(d.sport)} ${esc(d.name)}</span><span class="mu">${d.dur} min · ${new Date(d.date).toLocaleDateString('pt-PT')}</span></div>`).join(''):'<p class="mu">Ainda sem treinos concluídos.</p>'}
<p style="margin-top:16px"><label><input type="checkbox" id="waud" ${ls('kr_audio','1')==='1'?'checked':''}> Sons (mudança de exercício e quilómetros gravados)</label></p>`;
el.querySelector('#wb').onclick=()=>go('feed');
el.querySelector('#mfp-btn').onclick=()=>openMFP();
el.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>{ss('kr_intent',b.dataset.in);renderWO();renderWP()});
el.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{sel=b.dataset.sp;renderWO()});
el.querySelectorAll('.wc').forEach(e=>e.onclick=()=>openW(list[+e.dataset.i]));
const spc=el.querySelector('#spc');if(oldC)spc.scrollLeft=sx;else{const on=spc.querySelector('.on');if(on)spc.scrollLeft=Math.max(0,on.offsetLeft-20)}window.scrollTo(0,oy);
el.querySelector('#waud').onchange=e=>ss('kr_audio',e.target.checked?'1':'0');renderRoutes()};
window.renderWP=function(){const el=$('#wp');if(!el)return;const inf=mfpInfo(),p=(inf?inf.plan:picks(intent())).slice(0,3);
el.innerHTML=`<div class="wpc"><div class="sh"><b>Treinos para ti</b><span><a id="wpmfp" style="margin-right:12px">${inf?esc(inf.badge):'📸 MyFitnessPal'}</a><a id="wpall">Ver todos</a></span></div>${inf?`<div class="mu" style="margin:-4px 0 8px;font-size:12px">${esc(inf.title)} · plano ajustado à tua nutrição</div>`:''}<div class="wph">${p.map((w,i)=>`<div class="wmini" data-i="${i}"><span>${ic(w.sport)}</span><b>${esc(w.name)}</b><small>${esc(w.sport)} · ${w.dur} min · ~${estKcal(w)} kcal</small></div>`).join('')}</div></div>`;
el.querySelector('#wpmfp').onclick=()=>openMFP();el.querySelector('#wpall').onclick=()=>go('wo');el.querySelectorAll('.wmini').forEach(e=>e.onclick=()=>openW(p[+e.dataset.i]))};
// avisos de áudio por quilómetro nas gravações
let lk=0;setInterval(()=>{try{const s=$('#rstop');if(!s||s.classList.contains('hide')){lk=0;return}const c=calc(rp),km=Math.floor(c.dist/1000);
if(km>lk){lk=km;chime('km')}}catch(e){}},3000);
const rs=$('#rstart');if(rs)rs.addEventListener('click',()=>AC());
const stl=document.createElement('style');stl.textContent=`.ov{position:fixed;inset:0;background:var(--bg);z-index:2500;display:none;overflow:auto;padding:calc(14px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom))}.ov.on{display:block}
.gh{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:20px;margin-bottom:8px}.gb{margin:14px 0;display:flex;gap:10px;flex-wrap:wrap}
.gst{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--bd)}.gst span{width:26px;height:26px;border-radius:50%;background:var(--card);display:grid;place-items:center;font-size:13px;flex:none}.gst div{flex:1}.gst em{font-style:normal;color:var(--mu)}
.gan{height:min(34vh,280px);max-width:340px;margin:6px auto 0}.gan svg{width:100%;height:100%;display:block}.gem{font-size:96px;text-align:center;line-height:2.6}.gst .gth{width:56px;height:62px;flex:none;display:grid;place-items:center;font-size:26px}.gth svg{width:100%;height:100%}
.gz{margin-top:14px;text-transform:uppercase;letter-spacing:2px;color:var(--ac);font-weight:700;text-align:center}.gn{font-size:28px;font-weight:700;text-align:center;margin:8px 0}.gt{font-size:68px;font-weight:800;text-align:center;font-variant-numeric:tabular-nums}
#gp,#gnx{text-align:center}.wc{cursor:pointer}.wr{display:flex;gap:12px;align-items:center;cursor:pointer}.wr .th{width:80px;height:80px}
.wpc{background:var(--card);padding:14px 16px;margin-bottom:8px;border-radius:12px}.wpc .sh{margin-bottom:10px}.wph{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none}
.wmini{flex:0 0 150px;background:var(--bg);border-radius:12px;padding:12px;cursor:pointer}.wmini span{font-size:24px;display:block}.wmini b{display:block;margin:4px 0 2px;font-size:15px}.wmini small{color:var(--mu)}
textarea{font:inherit;padding:7px;border-radius:8px;border:1px solid var(--bd);background:var(--card);color:var(--tx);-webkit-user-select:text;user-select:text}.ib{position:relative}.nb{position:absolute;top:-4px;right:-6px;background:#e0245e;color:#fff;border-radius:10px;font-size:11px;font-weight:700;padding:1px 5px;min-width:18px;text-align:center}
.lb{display:block;margin:16px 0 6px;color:var(--mu);font-size:14px}.ck{display:block;margin:10px 0}input[type=range]{padding:0}
@media(max-width:640px){.wpc{border-radius:0}}`;document.head.appendChild(stl);

const pzOn=()=>{try{return !!JSON.parse(ls('kr_pz','null'))}catch(e){return false}};
window.KR_edit=a=>{const g=G(),hasG=a.pts&&a.pts.length>1,e0=Math.min(10,Math.max(1,a.eff||5));let et=!!a.eff;g.classList.add('on');
g.innerHTML=`<div class="gh"><b>Editar atividade</b></div><label class="lb">Título</label><input id="ed-t" value="${esc(a.name)}" maxlength="80" style="width:100%">
<label class="lb">Descrição</label><textarea id="ed-d" rows="3" maxlength="300" style="width:100%">${esc(a.desc||'')}</textarea>
<label class="lb">Esforço percebido: <b id="ed-ev" style="color:var(--tx)">${e0}</b>/10 · <span id="ed-el">${EFF(e0)}</span></label><input id="ed-e" type="range" min="1" max="10" value="${e0}" style="width:100%">
<label class="lb">Visibilidade</label><label class="ck"><input type="checkbox" id="ed-s" ${a.share!==false?'checked':''}> Partilhar com amigos</label>
${hasG?`<label class="ck"><input type="checkbox" id="ed-m" ${a.showMap===true||(a.showMap===undefined&&pzOn())?'checked':''}> Mostrar o percurso no mapa aos amigos</label><p><button class="btn" id="ed-r">Recalcular subida</button> <span class="mu" id="ed-rv"></span></p>`:''}
<div class="gb"><button class="btn pri" id="ed-ok">Guardar</button> <button class="btn" id="ed-no">Cancelar</button></div>`;
const q=x=>g.querySelector(x);
q('#ed-e').oninput=e=>{et=true;q('#ed-ev').textContent=e.target.value;q('#ed-el').textContent=EFF(+e.target.value)};
if(hasG)q('#ed-r').onclick=()=>{const v=recalcElev(a);save();q('#ed-rv').textContent='Subida: '+Math.round(v)+' m'};
q('#ed-no').onclick=()=>g.classList.remove('on');
q('#ed-ok').onclick=()=>{a.name=(q('#ed-t').value.trim()||a.name).slice(0,80);a.desc=q('#ed-d').value.trim().slice(0,300);if(et)a.eff=+q('#ed-e').value;a.share=q('#ed-s').checked;if(hasG)a.showMap=q('#ed-m').checked;a.dirty=true;
save();g.classList.remove('on');renderList();show(a);toast('Atividade atualizada')}};
window.KR_policy=()=>{const g=G();g.classList.add('on');
g.innerHTML=`<div class="gh"><b>Política de privacidade</b><button class="btn" id="gx">Fechar</button></div>
<p class="mu">Texto-modelo. Quem publica a app deve revê-lo e indicar o contacto antes de ter utilizadores. Não substitui aconselhamento jurídico.</p>
<h3>Quem trata os dados</h3><p>O KeepRun é uma app gratuita. Responsável: [nome]. Contacto: [email de contacto].</p>
<h3>No teu dispositivo</h3><p>As atividades (percursos GPS, tempos, notas) e as definições ficam guardadas no navegador do teu dispositivo e não saem dele enquanto não ligares uma conta e partilhares.</p>
<h3>Na nuvem (só se entrares)</h3><p>Se entrares com Google ou email, guardamos no Firebase (Google Cloud): nome, email, foto, código de amigo, lista de amigos, pedidos, e as atividades que partilhares (resumo e, apenas se escolheres, um percurso simplificado), com gostos e comentários. Estes serviços podem tratar dados fora da União Europeia, com as garantias previstas na lei.</p>
<h3>Para que usamos</h3><p>Para o login, os amigos e a partilha que pediste. A partilha de atividades e de localização depende da tua escolha, em cada atividade e na zona de privacidade.</p>
<h3>Localização</h3><p>O GPS só é usado enquanto gravas. Podes definir uma zona de privacidade; os pontos dentro dela não são partilhados. Esta proteção reduz o risco, mas não o elimina.</p>
<h3>Mapas</h3><p>Os mapas vêm do OpenStreetMap. Ao ver um mapa, o teu navegador contacta os servidores deles, que recebem o teu endereço IP.</p>
<h3>Com quem partilhamos</h3><p>Só com os amigos que aceitaste. Não vendemos dados e não há publicidade.</p>
<h3>Quanto tempo guardamos</h3><p>Até apagares a atividade ou os teus dados. Em Eu > Conta, o botão "Apagar os meus dados na nuvem" remove tudo o que está na nuvem e a conta.</p>
<h3>Os teus direitos</h3><p>Podes aceder (Eu > Cópia de segurança), corrigir (Editar), apagar (botão acima), levar os dados contigo (exportar) e opor-te ao tratamento. Para outros pedidos, usa o contacto acima.</p>
<h3>Menores</h3><p>A app não se destina a menores de 16 anos sem autorização de quem tem a responsabilidade parental.</p>`;
g.querySelector('#gx').onclick=()=>g.classList.remove('on')};
window.KR_IC=IC;
window.animFor=animFor;window.ic=ic;window.KR_extra=a=>(a.eff?`<div class="mu" style="margin:-4px 0 12px">💪 Esforço ${+a.eff}/10 · ${EFF(+a.eff)}${a.workout?' · '+esc(a.workout):''}</div>`:'')+(a.desc?`<p style="margin:0 0 12px">${esc(a.desc)}</p>`:'');
window.KRW={lib,picks,forSport,SPORTS,parseMFPText,mfpInfo,openMFP,openW};renderWP();if(window.renderCards)renderCards();
})();
