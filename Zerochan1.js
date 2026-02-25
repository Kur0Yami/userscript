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
#zc-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;z-index:99999;opacity:0;transition:opacity .3s;pointer-events:none}
`;
document.head.insertAdjacentHTML('beforeend',`<style>${style}</style>`);

const toast=document.createElement('div');
toast.id='zc-toast';
document.body.appendChild(toast);
function showToast(msg){
  toast.textContent=msg;toast.style.opacity='1';
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>toast.style.opacity='0',2500);
}

// Ambil URL full image dari halaman detail zerochan
async function getFullImageUrl(id){
  try{
    const res=await fetch(`https://www.zerochan.net/${id}?json`,{headers:{Accept:'application/json'}});
    if(res.ok){
      const data=await res.json();
      if(data.full)return data.full;
    }
  }catch(e){}
  // fallback: scrape halaman
  try{
    const res=await fetch(`https://www.zerochan.net/${id}`);
    const html=await res.text();
    const match=html.match(/https:\/\/static\.zerochan\.net\/[^"'\s]+\.(?:jpg|png|webp)/);
    if(match)return match[0];
  }catch(e){}
  return null;
}

async function doDownload(id,title){
  showToast('Mengambil URL...');
  const url=await getFullImageUrl(id);
  if(!url){showToast('Gagal mendapatkan URL');return;}
  showToast('Membuka IDM+...');
  // Buat link dengan download attribute, klik programatik
  const a=document.createElement('a');
  a.href=url;
  a.target='_blank';
  a.rel='noopener';
  // download attribute hint untuk IDM+
  const ext=url.split('.').pop().split('?')[0];
  a.download=(title||'zerochan').replace(/[^\w.-]+/g,'.')+'.'+ext;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>a.remove(),1000);
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
  if(!cbs.length){showToast('Tidak ada thumbnail dipilih');return;}
  showToast(`Memproses ${cbs.length} gambar...`);
  for(const cb of cbs){
    const a=cb.closest('a.thumb');
    const id=a.getAttribute('href').match(/\/(\d+)/)?.[1];
    const title=a.querySelector('img')?.alt||'zerochan';
    if(id){
      await doDownload(id,title);
      await new Promise(r=>setTimeout(r,800)); // jeda antar download
    }
  }
};

inject();
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});
})();
