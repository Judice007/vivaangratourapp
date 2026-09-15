document.addEventListener('DOMContentLoaded',()=>{
 const days=document.querySelector('.route-days');if(!days)return;
 const add=document.createElement('button');add.textContent='Adicionar dia';
 const share=document.createElement('button');share.textContent='Copiar roteiro';
 for(const b of [add,share]){b.className='route-share';days.parentElement.appendChild(b)}
 function refresh(){[...days.children].filter(r=>r.querySelector('strong')).forEach((r,i)=>{r.querySelector('b').textContent='Dia '+(i+1);if(!r.querySelector('.route-remove')){const b=document.createElement('button');b.className='route-remove';b.textContent='Remover dia';r.appendChild(b)}})}
 days.addEventListener('click',e=>{const b=e.target.closest('.route-remove');if(b){b.parentElement.remove();refresh()}});
 add.onclick=()=>{days.querySelector('.route-empty')?.remove();const r=document.createElement('div');r.innerHTML='<b></b><strong>Dia livre</strong><small>Adicione um lugar salvo.</small>';days.appendChild(r);refresh()};
 share.onclick=async()=>{const text='Meu roteiro em Angra:\n'+[...days.children].filter(r=>r.querySelector('strong')).map(r=>r.querySelector('b').textContent+' — '+r.querySelector('strong').textContent).join('\n');try{await navigator.clipboard.writeText(text);share.textContent='Copiado'}catch{window.prompt('Copie seu roteiro:',text)}};
 refresh();setTimeout(refresh,0);
 const s=document.createElement('style');s.textContent='.day-picker[hidden]{display:none!important}.briefing-card{max-height:90dvh;overflow:auto}.route-share,.route-remove{font:inherit;padding:10px;border:1px solid #c3d7d2;border-radius:10px;background:white;color:#142b3a;cursor:pointer;margin:5px}.route-share{width:100%}';document.head.appendChild(s);
});
