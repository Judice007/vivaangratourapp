(() => {
'use strict';
const $ = id => document.getElementById(id);
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const curatedByName = new Map((AngraData.curated||[]).map(c=>[c.name,c]));
const orderedNames = [...curatedByName.keys(), ...AngraData.names.filter(n=>!curatedByName.has(n))];
const places = orderedNames.map(name => {
 const c = curatedByName.get(name);
 return c ? {id:slug(name),name,lat:c.lat,lng:c.lng,description:c.description,photoUrl:c.photoUrl,photoCredit:c.photoCredit,access:c.access,verified:true} : {id:slug(name),name};
});
const byId = new Map(places.map(p=>[p.id,p]));
const approximateCoordinates = {'praia-do-aventureiro':[-23.188,-44.315],'ilha-da-gipoia':[-23.047,-44.290],'vila-do-abraao':[-23.143,-44.166],'lagoa-azul':[-23.105,-44.255],'praia-de-lopes-mendes':[-23.174,-44.143],'pico-do-papagaio':[-23.155,-44.185]};
const read = key => {try{return JSON.parse(localStorage.getItem(key))}catch{return null}};
const defaults = {days:3,stay:'Ainda não sei',hotel:'Ainda estou procurando',boat:'Ainda não sei',party:'2 pessoas',budget:'Ainda não defini',tripDate:''};
const stored=read('angra-state-v2');
const profile={...defaults,...(stored?.profile||read('angra-briefing')||{})};
profile.days=Math.max(1,Math.min(30,parseInt(profile.days)||3));
let state={version:2,profile,current:byId.has(stored?.current)?stored.current:places[0].id,
 favorites:Array.isArray(stored?.favorites)?[...new Set(stored.favorites.filter(id=>byId.has(id)))]:[],
 route:[]};
const validItem = item => item && (byId.has(item.placeId)||typeof item.note==='string');
if(Array.isArray(stored?.route)) state.route=stored.route.filter(d=>d&&Array.isArray(d.items)).map(d=>({id:typeof d.id==='string'?d.id:crypto.randomUUID(),items:d.items.filter(validItem).map(i=>byId.has(i.placeId)?{placeId:i.placeId}:{note:i.note.slice(0,2000)})}));
else {
 const old=localStorage.getItem('angra-route');
 if(old) {
  const parsed=new DOMParser().parseFromString(old,'text/html');
  state.route=[...parsed.querySelectorAll('strong')].map(n=>({id:crypto.randomUUID(),items:[{note:n.textContent.slice(0,2000)}]}));
 }
 if(!state.route.length) state.route=Array.from({length:profile.days},()=>({id:crypto.randomUUID(),items:[]}));
}
let map, marker, busy=false, suppressClick=false, drag=null;
function notice(text){$('notice').textContent=text;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('notice').textContent='',3500)}
function save(){try{localStorage.setItem('angra-state-v2',JSON.stringify(state))}catch{notice('Não foi possível salvar neste navegador. Copie seu roteiro antes de sair.')} }
function node(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function button(text,fn){const b=node('button',text);b.type='button';b.onclick=fn;return b}
function selected(){return byId.get(state.current)}
function select(id){if(!byId.has(id))return;state.current=id;save();renderCard()}
function renderCard(){
 const p=selected();$('title').textContent=p.name;$('kind').textContent=p.verified?'Angra dos Reis · verificado':'Angra dos Reis';
 $('card').setAttribute('aria-label','Ver detalhes de '+p.name);
 $('card').classList.toggle('has-photo',!!p.photoUrl);
 $('card-photo').style.backgroundImage=p.photoUrl?'url('+p.photoUrl+')':'';
 $('card-desc').textContent=p.description?p.description.split(/(?<=[.!?])\s/)[0]:'Toque para ver informações';
 $('counter').textContent=(places.findIndex(x=>x.id===p.id)+1)+' de '+places.length+' lugares';
 $('discovery-progress').max=places.length;$('discovery-progress').value=places.findIndex(x=>x.id===p.id)+1;
 $('map-status').textContent=p.name+' · coordenadas ainda não conferidas';
 $('map-link').href='https://www.openstreetmap.org/search?query='+encodeURIComponent(p.name+', Angra dos Reis');
 if(marker){map.removeLayer(marker);marker=null}
 const coords=(p.lat!=null?[p.lat,p.lng]:approximateCoordinates[p.id]);
 if(coords&&map){marker=L.marker(coords).addTo(map).bindPopup(node('span',p.name+(p.verified?' · localização verificada':' · localização aproximada')));marker.on('click',()=>details(p.id));map.setView(coords,13);$('map-status').textContent=p.name+(p.verified?' · localização verificada':' · localização aproximada, a conferir');}
 else if(map)map.setView([-23.10,-44.30],10);
}
function favorite(id){if(!state.favorites.includes(id))state.favorites.push(id);save();renderFavorites()}
function advance(like){
 if(busy)return;busy=true;const id=state.current;
 if(like)favorite(id);
 const index=places.findIndex(p=>p.id===id);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const animation=!reduced?$('card').animate([{transform:'translateX(0)'},{transform:'translateX('+(like?120:-120)+'px) rotate('+(like?8:-8)+'deg)',opacity:0}],{duration:180}):null;
 const finish=()=>{select(places[(index+1)%places.length].id);animation?.cancel();busy=false};
 if(animation)animation.finished.then(finish,finish);else finish();
}
function open(title){
 $('modal-content').replaceChildren(node('h2',title));$('modal-content').firstChild.id='modal-title';
 if(!$('modal').open)$('modal').showModal();
 return $('modal-content');
}
function details(id){
 const p=byId.get(id);if(!p)return;
 const c=open(p.name);
 if(p.photoUrl){
  const img=node('img');img.src=p.photoUrl;img.alt=p.name;img.loading='lazy';img.className='modal-photo';c.append(img);
  if(p.photoCredit)c.append(node('small',p.photoCredit));
 }
 c.append(node('p',p.description||'Descrição, fotos, acesso, duração e valores estão em conferência para este local.'));
 if(p.access){const acc=node('p',p.access);acc.className='access-note';c.append(acc)}
 const a=node('a','Consultar portal oficial de turismo');a.href='https://visite.angra.rj.gov.br/pontos-turisticos';a.target='_blank';a.rel='noopener';c.append(a);
 c.append(button(state.favorites.includes(id)?'Já está nos favoritos':'Salvar nos favoritos',()=>{favorite(id);details(id)}));
 c.append(button('Adicionar a um dia',()=>chooseDay(id)));
}
function chooseDay(id){
 const c=open('Adicionar '+byId.get(id).name);
 if(!state.route.length)c.append(node('p','Adicione um dia ao roteiro primeiro.'));
 state.route.forEach((d,index)=>c.append(button('Dia '+(index+1),()=>{
  if(!d.items.some(i=>i.placeId===id))d.items.push({placeId:id});
  save();renderRoute();$('modal').close();notice('Lugar adicionado ao roteiro.');
 })));
}
function renderFavorites(){
 const target=$('favorites');target.replaceChildren();
 if(!state.favorites.length)target.append(node('p','Salve um destino para começar.'));
 state.favorites.forEach(id=>{
  const row=node('div');row.append(button(byId.get(id).name,()=>details(id)),button('Adicionar ao dia',()=>chooseDay(id)),button('Remover favorito',()=>{
   state.favorites=state.favorites.filter(x=>x!==id);save();renderFavorites();
  }));target.append(row);
 });
}
function renderRoute(){
 const target=$('route');target.replaceChildren();
 if(!state.route.length)target.append(node('p','Seu roteiro está vazio. Adicione um dia.'));
 state.route.forEach((day,index)=>{
  const row=node('div');row.className='day';row.append(node('h3','Dia '+(index+1)));
  if(!day.items.length)row.append(node('p','Dia livre. Adicione um favorito.'));
  day.items.forEach((item,j)=>{
   const r=node('div');r.className='item';r.append(node('span',item.placeId?byId.get(item.placeId).name:item.note));
   const up=button('↑',()=>{[day.items[j-1],day.items[j]]=[day.items[j],day.items[j-1]];save();renderRoute()});up.disabled=j===0;up.setAttribute('aria-label','Mover atividade para cima');
   const down=button('↓',()=>{[day.items[j+1],day.items[j]]=[day.items[j],day.items[j+1]];save();renderRoute()});down.disabled=j===day.items.length-1;down.setAttribute('aria-label','Mover atividade para baixo');
   r.append(up,down,button('Remover',()=>{day.items.splice(j,1);save();renderRoute()}));row.append(r);
  });
  row.append(button('Remover dia',()=>{
   if(day.items.length&&!confirm('Remover este dia e suas atividades do roteiro?'))return;
   state.route=state.route.filter(d=>d.id!==day.id);save();renderRoute();
  }));target.append(row);
 });$('copy').disabled=!state.route.length;
}
function field(form,label,key,options){
 const l=node('label',label),input=node(options?'select':'input');input.name=key;
 if(options)options.forEach(v=>{const o=node('option',v);o.value=v;input.append(o)});
 input.value=String(state.profile[key]||'');l.append(input);form.append(l);return input;
}
function editTrip(){
 const c=open('Sua viagem'),f=node('form');
 const days=field(f,'Quantos dias?', 'days');days.type='number';days.min=1;days.max=30;days.required=true;
 const stays=['Ainda não sei',...Object.values(AngraData.neighborhoods).flat()];
 if(!stays.includes(state.profile.stay))stays.unshift(state.profile.stay);
 field(f,'Bairro ou localidade da hospedagem','stay',stays);
 field(f,'Hospedagem','hotel',['Sim, já reservei','Ainda estou procurando']);
 field(f,'Passeio de barco','boat',['Ainda não sei','Sim, quero falar com um parceiro','Vou resolver por conta própria']);
 field(f,'Mês da viagem','tripDate').type='month';
 field(f,'Grupo','party',['1 pessoa','2 pessoas','3 a 4 pessoas','5 ou mais pessoas']);
 field(f,'Orçamento por pessoa','budget',['Ainda não defini','Até R$ 300','R$ 300 a R$ 700','R$ 700 a R$ 1.500','Acima de R$ 1.500']);
 const submit=node('button','Salvar viagem');submit.type='submit';f.append(submit);c.append(f);
 f.onsubmit=e=>{
  e.preventDefault();const previous=state.profile.days;
  state.profile={...Object.fromEntries(new FormData(f)),days:Number(days.value)};
  if(state.profile.days>state.route.length)while(state.route.length<state.profile.days)state.route.push({id:crypto.randomUUID(),items:[]});
  save();render();$('modal').close();
  if(state.profile.days<previous)notice('Seus dias existentes foram preservados. Remova os que não precisar.');
 };
}
function renderCatalog(){
 const q=slug($('search').value),target=$('catalog');target.replaceChildren();
 const filtered=places.filter(p=>slug(p.name).includes(q));
 if(!filtered.length)target.append(node('p','Nenhum lugar encontrado.'));
 filtered.forEach(p=>target.append(button(p.name,()=>{select(p.id);details(p.id)})));
}
function render(){renderCard();renderFavorites();renderRoute();$('trip-summary').textContent=state.profile.days+' dias · '+state.profile.stay;$('catalog-label').textContent='Todos os lugares ('+places.length+')';renderCatalog()}
$('close').onclick=()=>$('modal').close();
$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close()}});
$('edit-trip').onclick=editTrip;$('pass').onclick=()=>advance(false);$('like').onclick=()=>advance(true);
$('search').oninput=renderCatalog;
$('card').onclick=()=>{if(!suppressClick&&!busy)details(state.current)};
$('card').onpointerdown=e=>{if(e.button!==0||busy)return;drag={x:e.clientX,y:e.clientY,dx:0};$('card').setPointerCapture(e.pointerId)};
$('card').onpointermove=e=>{if(!drag)return;drag.dx=e.clientX-drag.x;if(Math.abs(drag.dx)>10)suppressClick=true;$('card').style.transform='translateX('+Math.max(-100,Math.min(100,drag.dx))+'px) rotate('+drag.dx/35+'deg)'};
function endDrag(e,cancel=false){
 if(!drag)return;const dx=drag.dx,dy=e.clientY-drag.y;drag=null;$('card').style.transform='';
 if(!cancel&&Math.abs(dx)>85&&Math.abs(dx)>Math.abs(dy))advance(dx>0);
 setTimeout(()=>suppressClick=false,0);
}
$('card').onpointerup=e=>endDrag(e);$('card').onpointercancel=e=>endDrag(e,true);
document.addEventListener('keydown',e=>{if($('modal').open||e.target!==$('card'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();advance(e.key==='ArrowRight')}});
$('add-day').onclick=()=>{state.route.push({id:crypto.randomUUID(),items:[]});save();renderRoute()};
function routeText(){return 'Minha viagem para Angra\nBase: '+state.profile.stay+'\n\n'+state.route.map((d,i)=>'Dia '+(i+1)+'\n'+(d.items.map(item=>'• '+(item.placeId?byId.get(item.placeId).name:item.note)).join('\n')||'Dia livre')).join('\n\n')}
async function copy(text){try{await navigator.clipboard.writeText(text);notice('Copiado!')}catch{const c=open('Copie o texto'),t=node('textarea');t.value=text;t.rows=12;c.append(t);t.select()}}
$('copy').onclick=()=>copy(routeText());
$('request').onclick=()=>{
 const c=open('Preparar pedido de orçamento');c.append(node('p','Nenhum pedido será enviado automaticamente.'));
 const f=node('form');field(f,'Serviço','service',['Passeio de barco','Transfer','Guia local','Hospedagem']);
 const b=node('button','Copiar pedido');b.type='submit';f.append(b);c.append(f);
 f.onsubmit=e=>{e.preventDefault();copy('Olá! Gostaria de opções de '+f.elements.service.value+'.\nGrupo: '+state.profile.party+'\nMês: '+(state.profile.tripDate||'A definir')+'\nOrçamento: '+state.profile.budget+'\n'+routeText())};
};
save();render();
$('previous').onclick=()=>{if(busy)return;const i=places.findIndex(p=>p.id===state.current);select(places[(i-1+places.length)%places.length].id)};
$('map-current').onclick=()=>{renderCard();if(!approximateCoordinates[state.current])notice('Este destino ainda não tem coordenadas conferidas. Use a busca de localização.')};
$('map-expand').onclick=()=>{const expanded=document.querySelector('.discover').classList.toggle('expanded');$('map-expand').textContent=expanded?'Recolher mapa':'Ampliar mapa';$('map-expand').setAttribute('aria-expanded',String(expanded));if(map)requestAnimationFrame(()=>map.invalidateSize())};
const script=node('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
script.onload=()=>{
 map=L.map('map',{scrollWheelZoom:false}).setView([-23.10,-44.30],10);
 const streets=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19});
 const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',maxZoom:19}).addTo(map);
 L.control.layers({'Satélite':satellite,'Mapa':streets},null,{collapsed:false}).addTo(map);
 let failed=false;satellite.on('tileerror',()=>{if(failed)return;failed=true;if(map.hasLayer(satellite)){map.removeLayer(satellite);streets.addTo(map);notice('Satélite indisponível. Exibindo mapa convencional.')}});
 $('map-overview').onclick=()=>map.fitBounds([[-23.25,-44.60],[-22.88,-44.08]]);
 renderCard();map.fitBounds([[-23.25,-44.60],[-22.88,-44.08]]);setTimeout(()=>map.invalidateSize(),0);
};
script.onerror=()=>{$('map').textContent='Mapa indisponível. Use o link de localização abaixo.'};document.head.append(script);
})();
