(function(){
'use strict';
if(document.getElementById('zc-panel'))return;
const style=`
a.thumb{position:relative!important}
:root{--jp-black:#2b2b2b;--jp-bg:rgba(255,255,255,.94);--jp-green:#7fbf9a;--jp-red:#e06a6a;--jp-orange:#f2a65a}
.zc-dl{position:absolute;top:6px;right:6px;z-index:999;background:var(--jp-bg);color:var(--jp-black);width:30px;height:30px;border-radius:6px;border:2px solid var(--jp-black);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;opacity:.9}
.zc-dl:active{background:var(--jp-orange);color:#fff}
.zc-cb{position:absolute;top:6px;left:6px;width:24px;height:24px;cursor:pointer;accent-color:var(--jp-green);opacity:.85;z-index:999}
#zc-panel{position:fixed;right:14px;top:50%;transform:translateY(-50%);background:var(--jp-bg);border:2px solid var(--jp-black);border-radius:14px;padding:8px;z-index:9999;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
#zc-panel button{width:52px;height:52px;border-radius:10px;border:2px solid var(--jp-black);font-size:22px;cursor:pointer;background:#fff;color:var(--jp-black)}
#zc-panel button:nth-child(1){background:#d4f0e0}
#zc-panel button:nth-child(2){background:#fad5d5}
#zc-panel button:nth-child(3){background:#fde8cc}
#zc-link-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid #333;border-radius:12px;padding:16px;z-index:99999;max-width:92vw;box-shadow:0 8px 24px rgba(0,0,0,.3)}
`;
document.head.insertAdjacentHTML('beforeend',`<style>${style}</style>`);

async function resolveUrl(urls){
  for(const url of urls){
    try{
      const r=await fetch(url,{method:'HEAD'});
      if(r.ok)return url;
    }catch(e){}
  }
  return null;
}

function getUrls(id,title){
  const s=title.replace(/[^\w.-]+/g,'.');
  return[
    `https://static.zerochan.net/${s}.full.${id}.jpg`,
    `https://static.zerochan.net/${s}.full.${id}.png`,
    `https://static.zerochan.net/${s}.full.${id}.webp`
  ];
}

function showLinks(urls){
  const old=document.getElementById('zc-link-popup');
  if(old)old.remove();
  const div=document.createElement('div');
  div.id='zc-link-popup';
  div.innerHTML=`<div style="font-weight:bold;margin-bottom:10px;font-size:15px">Tap link untuk download:</div>`
    +urls.map(u=>`<a href="${u}" target="_blank" style="display:block;margin:8px 0;color:#1a6fbf;word-break:break-all;font-size:13px">${u.split('/').pop()}</a>`).join('')
    +`<button onclick="this.parentElement.remove()" style="margin-top:12px;padding:8px 20px;border-radius:8px;border:2px solid #333;cursor:pointer;font-size:14px">Tutup</button>`;
  document.body.appendChild(div);
}

async function doDownload(id,title){
  const urls=getUrls(id,title);
  const url=await resolveUrl(urls);
  if(url){
    window.open(url,'_blank');
  }else{
    showLinks(urls);
  }
}

function inject(){
  document.querySelectorAll('a.thumb[href^="/"]').forEach(a=>{
    if(a.querySelector('.zc-dl'))return;
    const match=a.getAttribute('href').match(/\/(\d+)/);
    if(!match)return;
    const id=match[1];
    const img=a.querySelector('img');
    if(!img)return;
    const title=img.alt||'zerochan';
    const cb=document.createElement('input');
    cb.type='checkbox';
    cb.className='zc-cb';
    cb.addEventListener('click',e=>e.stopPropagation());
    const btn=document.createElement('div');
    btn.className='zc-dl';
    btn.textContent='⬇';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();doDownload(id,title)});
    a.append(cb,btn);
  });
}

const panel=document.createElement('div');
panel.id='zc-panel';
panel.innerHTML=`
  <button title="Pilih Semua">☑</button>
  <button title="Batal Semua">✕</button>
  <button title="Download Terpilih">⬇</button>
`;
document.body.appendChild(panel);
const[btnAll,btnClear,btnDl]=panel.querySelectorAll('button');
btnAll.onclick=()=>document.querySelectorAll('.zc-cb').forEach(cb=>cb.checked=true);
btnClear.onclick=()=>document.querySelectorAll('.zc-cb').forEach(cb=>cb.checked=false);
btnDl.onclick=async()=>{
  const cbs=[...document.querySelectorAll('.zc-cb:checked')];
  if(!cbs.length){alert('Tidak ada thumbnail dipilih');return;}
  for(const cb of cbs){
    const a=cb.closest('a.thumb');
    const id=a.getAttribute('href').match(/\/(\d+)/)?.[1];
    const title=a.querySelector('img')?.alt||'zerochan';
    if(id)await doDownload(id,title);
  }
};

inject();
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
})();
