(function () {
    'use strict';
    if (document.getElementById('zc-panel')) return;

    const style = `
    a.thumb { position: relative !important; }
    :root { --jp-black: #2b2b2b; --jp-bg: rgba(255,255,255,.95); --jp-green: #7fbf9a; --jp-red: #e06a6a; --jp-orange: #f2a65a; --jp-blue: #5a9ef2; }
    .zc-btns { position: absolute; top: 5px; right: 5px; z-index: 999; display: flex; flex-direction: column; gap: 3px; }
    .zc-dl, .zc-cp { width: 28px; height: 28px; border-radius: 6px; border: 2px solid var(--jp-black); display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; opacity: .92; background: var(--jp-bg); color: var(--jp-black); }
    .zc-dl:active { background: var(--jp-orange); color: #fff; }
    .zc-cp:active { background: var(--jp-blue); color: #fff; }
    .zc-cb { position: absolute; top: 5px; left: 5px; width: 22px; height: 22px; cursor: pointer; accent-color: var(--jp-green); opacity: .9; z-index: 999; }
    #zc-panel { position: fixed; right: 12px; top: 50%; transform: translateY(-50%); background: var(--jp-bg); border: 2px solid var(--jp-black); border-radius: 14px; padding: 8px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.2); }
    #zc-panel button { width: 50px; height: 50px; border-radius: 10px; border: 2px solid var(--jp-black); font-size: 20px; cursor: pointer; background: #fff; color: var(--jp-black); }
    #zc-panel button:nth-child(1) { background: #d4f0e0; }
    #zc-panel button:nth-child(2) { background: #fad5d5; }
    #zc-panel button:nth-child(3) { background: #fde8cc; }
    #zc-panel button:nth-child(4) { background: #d5e8fa; font-size: 16px; }
    #zc-toast { position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%); background: #222; color: #fff; padding: 8px 20px; border-radius: 20px; font-size: 13px; z-index: 99999; opacity: 0; transition: opacity .3s; pointer-events: none; white-space: nowrap; }
    #zc-linkbox { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; border: 2px solid #333; border-radius: 14px; padding: 16px; z-index: 99999; width: 88vw; max-width: 480px; box-shadow: 0 8px 32px rgba(0,0,0,.3); }
    #zc-linkbox textarea { width: 100%; height: 160px; font-size: 11px; border: 1px solid #ccc; border-radius: 8px; padding: 8px; box-sizing: border-box; resize: none; font-family: monospace; }
    #zc-linkbox .zc-row { display: flex; gap: 8px; margin-top: 10px; }
    #zc-linkbox .zc-row button { flex: 1; padding: 10px; border-radius: 8px; border: 2px solid #333; cursor: pointer; font-size: 14px; font-weight: bold; }
    #zc-linkbox .zc-row button:first-child { background: #d5e8fa; }
    #zc-linkbox .zc-row button:last-child { background: #fad5d5; }
    `;
    document.head.insertAdjacentHTML('beforeend', `<style>${style}</style>`);

    // Toast
    const toast = document.createElement('div');
    toast.id = 'zc-toast';
    document.body.appendChild(toast);
    function showToast(msg) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.style.opacity = '0', 2500);
    }

    // Ambil URL full dari zerochan JSON API
    async function getFullUrl(id) {
        try {
            const r = await fetch(`https://www.zerochan.net/${id}?json`, { headers: { Accept: 'application/json' } });
            if (r.ok) {
                const d = await r.json();
                if (d.full) return d.full;
            }
        } catch (e) {}
        // fallback scrape
        try {
            const r = await fetch(`https://www.zerochan.net/${id}`);
            const html = await r.text();
            const m = html.match(/https:\/\/static\.zerochan\.net\/[^"'\s]+\.(?:jpg|png|webp)/);
            if (m) return m[0];
        } catch (e) {}
        return null;
    }

    // Copy ke clipboard
    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => showToast('Link disalin!')).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }
    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('Link disalin!'); } catch (e) { showToast('Gagal copy'); }
        ta.remove();
    }

    // Download (buka URL)
    async function doDownload(id) {
        showToast('Mengambil URL...');
        const url = await getFullUrl(id);
        if (!url) { showToast('Gagal mendapat URL'); return; }
        window.open(url, '_blank');
        showToast('Dibuka di tab baru');
    }

    // Copy link satu gambar
    async function doCopy(id) {
        showToast('Mengambil URL...');
        const url = await getFullUrl(id);
        if (!url) { showToast('Gagal mendapat URL'); return; }
        copyText(url);
    }

    // Tampilkan linkbox bulk
    function showLinkBox(urls) {
        const old = document.getElementById('zc-linkbox');
        if (old) old.remove();
        const div = document.createElement('div');
        div.id = 'zc-linkbox';
        div.innerHTML = `
            <div style="font-weight:bold;font-size:15px;margin-bottom:8px">📋 ${urls.length} Link Gambar</div>
            <textarea readonly>${urls.join('\n')}</textarea>
            <div class="zc-row">
                <button id="zc-copyall">Salin Semua</button>
                <button id="zc-close">Tutup</button>
            </div>
        `;
        document.body.appendChild(div);
        document.getElementById('zc-copyall').onclick = () => copyText(urls.join('\n'));
        document.getElementById('zc-close').onclick = () => div.remove();
    }

    // Inject tombol ke tiap thumbnail
    function inject() {
        document.querySelectorAll('a.thumb[href^="/"]').forEach(a => {
            if (a.querySelector('.zc-btns')) return;
            const match = a.getAttribute('href').match(/\/(\d+)/);
            if (!match) return;
            const id = match[1];
            const img = a.querySelector('img');
            if (!img) return;

            // Checkbox
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'zc-cb';
            cb.addEventListener('click', e => e.stopPropagation());

            // Wrapper tombol kanan
            const btns = document.createElement('div');
            btns.className = 'zc-btns';

            // Tombol download
            const btnDl = document.createElement('div');
            btnDl.className = 'zc-dl';
            btnDl.textContent = '⬇';
            btnDl.title = 'Download';
            btnDl.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); doDownload(id); });

            // Tombol copy link
            const btnCp = document.createElement('div');
            btnCp.className = 'zc-cp';
            btnCp.textContent = '🔗';
            btnCp.title = 'Copy Link';
            btnCp.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); doCopy(id); });

            btns.append(btnDl, btnCp);
            a.append(cb, btns);
        });
    }

    // Panel kanan
    const panel = document.createElement('div');
    panel.id = 'zc-panel';
    panel.innerHTML = `
        <button title="Pilih Semua">☑</button>
        <button title="Batal Semua">✕</button>
        <button title="Download Terpilih">⬇</button>
        <button title="Ekstrak Link Terpilih">🔗</button>
    `;
    document.body.appendChild(panel);

    const [btnAll, btnClear, btnDlAll, btnExtract] = panel.querySelectorAll('button');

    btnAll.onclick = () => document.querySelectorAll('.zc-cb').forEach(cb => cb.checked = true);
    btnClear.onclick = () => document.querySelectorAll('.zc-cb').forEach(cb => cb.checked = false);

    btnDlAll.onclick = async () => {
        const cbs = [...document.querySelectorAll('.zc-cb:checked')];
        if (!cbs.length) { showToast('Tidak ada yang dipilih'); return; }
        showToast(`Memproses ${cbs.length} gambar...`);
        for (const cb of cbs) {
            const a = cb.closest('a.thumb');
            const id = a.getAttribute('href').match(/\/(\d+)/)?.[1];
            if (id) {
                await doDownload(id);
                await new Promise(r => setTimeout(r, 900));
            }
        }
    };

    btnExtract.onclick = async () => {
        const cbs = [...document.querySelectorAll('.zc-cb:checked')];
        if (!cbs.length) { showToast('Tidak ada yang dipilih'); return; }
        showToast(`Mengambil ${cbs.length} link...`);
        const urls = [];
        for (const cb of cbs) {
            const a = cb.closest('a.thumb');
            const id = a.getAttribute('href').match(/\/(\d+)/)?.[1];
            if (id) {
                const url = await getFullUrl(id);
                if (url) urls.push(url);
                await new Promise(r => setTimeout(r, 300));
            }
        }
        if (urls.length) {
            showLinkBox(urls);
        } else {
            showToast('Gagal mengambil link');
        }
    };

    inject();
    new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });
})();
