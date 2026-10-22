// ==UserScript==
// @name        MS Store to RG-Adguard
// @namespace   Violentmonkey Scripts
// @icon        https://apps.microsoft.com/favicon.ico
// @version     3.1.0
//
// @match       https://apps.microsoft.com/detail/*
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_download
// @connect     store.rg-adguard.net
//
// @author      Raven
// @description Menambahkan tombol RG-Adguard di sebelah tombol Download MS Store.
// ==/UserScript==

const logError = (title, detail) => {
    console.log(
        `%c 🚨 RG-Adguard Error %c ${title} `,
        'background: #d32f2f; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
        'color: #d32f2f; font-weight: bold;',
        '\nDetail:', detail
    );
};

(function() {
    'use strict';

    const container = document.createElement('div');
    container.style.cssText = 'padding:10px; background:#181818; color:#fff; display:flex; flex-wrap:wrap; gap:8px; position:relative; z-index:999999; border-bottom: 2px solid #005FB8; align-items:center;';

    const ringSelect = document.createElement('select');
    ringSelect.style.cssText = 'padding:6px; background:#333; color:#fff; border:1px solid #555; border-radius:4px; font-family:sans-serif; cursor:pointer; outline:none;';

    const rings = [
        { text: 'Retail', value: 'Retail' },
        { text: 'RP', value: 'RP' },
        { text: 'Slow', value: 'WIS' },
        { text: 'Fast', value: 'WIF' }
    ];

    rings.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.value;
        opt.textContent = r.text;
        ringSelect.appendChild(opt);
    });

    const fetchBtn = document.createElement('button');
    fetchBtn.textContent = 'Store RG-Adguard';
    fetchBtn.style.cssText = 'padding:6px 12px; background:#005FB8; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:sans-serif; font-weight:bold;';

    fetchBtn.onclick = () => {
        fetchBtn.textContent = 'Memuat...';
        fetchBtn.disabled = true;
        ringSelect.disabled = true;

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://store.rg-adguard.net/api/GetFiles",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://store.rg-adguard.net/"
            },
            data: `type=url&url=${encodeURIComponent(location.href)}&ring=${ringSelect.value}&lang=en-US`,
            onload: res => {
                const files = [...res.responseText.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)];

                if (!files.length) {
                    fetchBtn.textContent = 'Store RG-Adguard';
                    fetchBtn.disabled = false;
                    ringSelect.disabled = false;

                    const errorMatch = res.responseText.match(/<p>(.*?)<\/p>/is) || res.responseText.match(/<div[^>]*alert[^>]*>(.*?)<\/div>/is);
                    const reason = errorMatch ? errorMatch[1].replace(/<[^>]+>/g, '').trim() : 'Respons HTML diterima, tapi tidak mengandung link file.';

                    logError('File Tidak Ditemukan', reason);
                    return alert('File tidak ditemukan dari RG-Adguard!');
                }

                container.innerHTML = '';

                files.forEach(([_, url, name]) => {
                    const btn = document.createElement('button');
                    btn.textContent = name;

                    const isAppx = /\.(appx|msix)/i.test(name);
                    const bgColor = isAppx ? '#28a745' : '#005FB8';

                    btn.style.cssText = `padding:6px 12px; background:${bgColor}; color:#fff; border:none; border-radius:4px; cursor:pointer; font-family:sans-serif; font-size:12px;`;

                    btn.onclick = () => {
                        btn.style.background = '#0C620C';
                        GM_download({ url, name });
                    };

                    container.appendChild(btn);
                });

                const closeBtn = document.createElement('button');
                closeBtn.textContent = '✖ Tutup';
                closeBtn.style.cssText = 'padding:6px 12px; background:#d32f2f; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; margin-left:auto;';
                closeBtn.onclick = () => container.remove();
                container.appendChild(closeBtn);
            },
            onerror: (err) => {
                fetchBtn.textContent = 'Store RG-Adguard';
                fetchBtn.disabled = false;
                ringSelect.disabled = false;
                logError('Network / Blokir Ekstensi', err);
                alert('Gagal melakukan fetch. Cek console (F12).');
            }
        });
    };

    container.appendChild(ringSelect);
    container.appendChild(fetchBtn);
    document.body.prepend(container);
})();