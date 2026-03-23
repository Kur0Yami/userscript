// ==UserScript==
// @name         Image Search Multi Engine (Endfield FULL FINAL)
// @namespace    https://image-search-simple-panel
// @version      9.0
// @description  FAB tab trigger (kanan atas). Toggle on/off per-site. Long press/double tap search gambar.
// @match        *://*/*
// @grant        none
// ==/UserScript==

const DEFAULT_SETTINGS = {
    SEARCH_ENGINE: 0,
    ENABLE_TWO_FINGER_TAP: 0,
    ENABLE_DOUBLE_TAP_MOBILE: 0,
    ENABLE_LONG_PRESS_MOBILE: 1,
    ENABLE_DOUBLE_CLICK_PC: 0,
    HUE: 48
};

const STORAGE_KEY = 'IMG_SEARCH_SETTINGS';
const BL_KEY = 'IMG_SEARCH_BL';

function currentHost() {
    return location.hostname.replace(/^www\./, '');
}
function isDisabled() {
    try { return JSON.parse(localStorage.getItem(BL_KEY) || '[]').includes(currentHost()); }
    catch { return false; }
}
function setDisabled(val) {
    try {
        const host = currentHost();
        let list = JSON.parse(localStorage.getItem(BL_KEY) || '[]');
        if (val) { if (!list.includes(host)) list.push(host); }
        else { list = list.filter(h => h !== host); }
        localStorage.setItem(BL_KEY, JSON.stringify(list));
    } catch {}
}

const DOUBLE_TAP_DELAY = 350;
const LONG_PRESS_DELAY = 550;

(function () {
'use strict';

let settings = loadSettings();
let panel = null;
let sliderPanel = null;

let lastTapTime = 0;
let lastTarget = null;
let longPressTimer = null;
let longPressTriggered = false;

applyColor();
buildFAB();

/* ================= CORE IMAGE FUNCTION ================= */

function findImage(el) {
    return el ? (el.closest('img') || el.closest('[role="img"]')) : null;
}

function getImageUrl(img) {
    if (!img) return null;
    if (img.tagName === 'IMG') return img.currentSrc || img.src;

    const bg = getComputedStyle(img).backgroundImage;
    if (bg && bg.startsWith('url')) return bg.slice(5, -2);
    return null;
}

function searchImage(img) {

    const url = getImageUrl(img);

    if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
        alert('URL gambar dibatasi.\nGunakan desktop mode.');
        return;
    }

    const u = encodeURIComponent(url);

    const engines = [
        'https://iqdb.org/?url=',
        'https://ascii2d.net/search/url/',
        'https://yandex.com/images/search?rpt=imageview&url=',
        'https://www.google.com/searchbyimage?image_url=',
        'https://trace.moe/?url='
    ];

    window.open(engines[settings.SEARCH_ENGINE] + u, '_blank');
}

/* ================= IMAGE TRIGGERS ================= */

// Long Press
document.addEventListener('touchstart', e => {

    if (!settings.ENABLE_LONG_PRESS_MOBILE || isDisabled()) return;

    const img = findImage(e.target);
    if (!img) return;

    longPressTriggered = false;

    longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        searchImage(img);
    }, LONG_PRESS_DELAY);

}, { passive: true });

document.addEventListener('touchmove', () => clearTimeout(longPressTimer), { passive: true });
document.addEventListener('touchend', () => clearTimeout(longPressTimer));

// Double Tap
document.addEventListener('touchend', e => {

    if (!settings.ENABLE_DOUBLE_TAP_MOBILE || longPressTriggered || isDisabled()) return;

    const now = Date.now();
    const img = findImage(e.target);
    if (!img) return;

    if (lastTarget === img && (now - lastTapTime) < DOUBLE_TAP_DELAY) {
        e.preventDefault();
        searchImage(img);
        lastTapTime = 0;
        lastTarget = null;
        return;
    }

    lastTapTime = now;
    lastTarget = img;
});

// Desktop Double Click
document.addEventListener('dblclick', e => {

    if (!settings.ENABLE_DOUBLE_CLICK_PC || isDisabled()) return;

    const img = findImage(e.target);
    if (!img) return;

    e.preventDefault();
    searchImage(img);
});

/* ================= SETTINGS ================= */

function loadSettings() {
    try {
        return Object.assign({}, DEFAULT_SETTINGS,
            JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
        );
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyColor(){
    const accent = `hsl(${settings.HUE}, 100%, 50%)`;
    const bg = `hsl(${settings.HUE}, 30%, 10%)`;
    const line = `hsl(${settings.HUE}, 20%, 20%)`;

    document.documentElement.style.setProperty('--ef-accent', accent);
    document.documentElement.style.setProperty('--ef-bg', bg);
    document.documentElement.style.setProperty('--ef-line', line);
}



/* ================= FAB TRIGGER ================= */

function buildFAB() {
    if (document.getElementById('ef-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'ef-fab';
    fab.setAttribute('aria-label', 'Image Search Settings');
    fab.textContent = '‹';

    Object.assign(fab.style, {
        position:     'fixed',
        right:        '0',
        top:          '18px',
        zIndex:       '2147483647',
        width:        '22px',
        height:       '52px',
        borderRadius: '10px 0 0 10px',
        border:       'none',
        cursor:       'pointer',
        fontSize:     '16px',
        fontWeight:   '800',
        lineHeight:   '1',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        background:   'var(--ef-bg, #1a1a2e)',
        color:        'var(--ef-accent, hsl(48,100%,50%))',
        boxShadow:    '-4px 0 14px rgba(0,0,0,.4)',
        transition:   'width .18s',
        outline:      'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect:   'none',
        padding:      '0',
        transform:    'translateZ(0)',
        willChange:   'transform',
    });

    // tetap nempel saat zoom
    function anchorFab() {
        const vv = window.visualViewport;
        if (!vv) return;
        const s = 1 / vv.scale;
        fab.style.transform = 'translateZ(0) scale(' + s + ')';
        fab.style.transformOrigin = 'top right';
        fab.style.top  = (vv.offsetTop  + 18) + 'px';
        fab.style.left = (vv.offsetLeft + vv.width - 22) + 'px';
        fab.style.right = 'auto';
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', anchorFab);
        window.visualViewport.addEventListener('scroll', anchorFab);
    }

    fab.addEventListener('mouseenter', () => { fab.style.width = '28px'; });
    fab.addEventListener('mouseleave', () => { if (!panel) fab.style.width = '22px'; });
    fab.addEventListener('click', e => {
        e.stopPropagation();
        togglePanel();
        fab.textContent = panel ? '›' : '‹';
    });

    document.body.appendChild(fab);
}

/* ================= PANEL ================= */

function togglePanel(){

    if(panel){
        panel.remove();
        if(sliderPanel) sliderPanel.remove();
        panel = null;
        sliderPanel = null;
        return;
    }

    injectStyle();

    panel = document.createElement('div');
    panel.className = "endfield-panel";

    panel.innerHTML = `
        <div class="ef-header">
            <div>IMAGE SEARCH</div>
            <span>SYS-01</span>
        </div>

        <div class="ef-section">
            <div class="ef-title">SEARCH ENGINE</div>
            ${['IQDB','ASCII2D','Yandex','Google','WhatAnime']
                .map((n,i)=>`
                <div class="ef-option">
                    <span>${n}</span>
                    <input type="radio" name="se" value="${i}">
                </div>
            `).join('')}
        </div>

        <div class="ef-section">
            <div class="ef-title">TRIGGER CONFIG</div>
            ${[
                ["Two Finger Tap","t2"],
                ["Double Tap","dt"],
                ["Long Press","lp"],
                ["Desktop Double Click","pc"]
            ].map(o=>`
                <div class="ef-option">
                    <span>${o[0]}</span>
                    <input type="checkbox" id="${o[1]}">
                </div>
            `).join('')}
        </div>

        <div class="ef-section">
            <div class="ef-title">SITE CONTROL</div>
            <div class="ef-option">
                <span id="ef-site-host" style="font-size:11px;opacity:.7"></span>
                <input type="checkbox" id="ef-site-toggle">
            </div>
            <div style="font-size:10px;color:#7c8794;margin-top:4px" id="ef-site-label">Search aktif di site ini</div>
        </div>

        <button id="openColor">COLOR SETTING</button>
        <button id="ef-close">EXIT PANEL</button>
    `;

    document.body.appendChild(panel);

    panel.querySelectorAll('input[name="se"]').forEach(r=>{
        r.checked = Number(r.value)===settings.SEARCH_ENGINE;
        r.onchange = ()=>{
            settings.SEARCH_ENGINE = +r.value;
            saveSettings();
        };
    });

    panel.querySelector('#t2').checked=settings.ENABLE_TWO_FINGER_TAP;
    panel.querySelector('#dt').checked=settings.ENABLE_DOUBLE_TAP_MOBILE;
    panel.querySelector('#lp').checked=settings.ENABLE_LONG_PRESS_MOBILE;
    panel.querySelector('#pc').checked=settings.ENABLE_DOUBLE_CLICK_PC;

    panel.querySelector('#t2').onchange=e=>{settings.ENABLE_TWO_FINGER_TAP=e.target.checked?1:0;saveSettings();};
    panel.querySelector('#dt').onchange=e=>{settings.ENABLE_DOUBLE_TAP_MOBILE=e.target.checked?1:0;saveSettings();};
    panel.querySelector('#lp').onchange=e=>{settings.ENABLE_LONG_PRESS_MOBILE=e.target.checked?1:0;saveSettings();};
    panel.querySelector('#pc').onchange=e=>{settings.ENABLE_DOUBLE_CLICK_PC=e.target.checked?1:0;saveSettings();};

    panel.querySelector('#ef-close').onclick=togglePanel;
    panel.querySelector('#openColor').onclick=toggleSliderPanel;

    // ── Site toggle ──────────────────────────────────────
    const siteHost    = panel.querySelector('#ef-site-host');
    const siteToggle  = panel.querySelector('#ef-site-toggle');
    const siteLabel   = panel.querySelector('#ef-site-label');
    const host        = currentHost();

    siteHost.textContent = host;

    function syncSiteToggle() {
        const off = isDisabled();
        siteToggle.checked = !off;
        siteLabel.textContent = off ? 'Search NONAKTIF di site ini' : 'Search aktif di site ini';
        siteLabel.style.color = off ? 'var(--ef-accent)' : '#7c8794';
        // ubah warna fab juga sebagai indikator
        const fab = document.getElementById('ef-fab');
        if (fab) fab.style.opacity = off ? '0.45' : '1';
    }

    siteToggle.onchange = () => {
        setDisabled(!siteToggle.checked);
        syncSiteToggle();
    };

    syncSiteToggle();
}

/* ================= COLOR SLIDER ================= */

function toggleSliderPanel(){

    if(sliderPanel){
        sliderPanel.remove();
        sliderPanel=null;
        return;
    }

    sliderPanel=document.createElement('div');
    sliderPanel.className="slider-panel";

    sliderPanel.innerHTML=`
        <div class="ef-title">ACCENT HUE</div>
        <input type="range" min="0" max="360" value="${settings.HUE}" id="hueSlider">
    `;

    panel.insertBefore(sliderPanel, panel.querySelector('#ef-close'));

    const slider=sliderPanel.querySelector('#hueSlider');
    slider.oninput=e=>{
        settings.HUE=+e.target.value;
        applyColor();
buildFAB();
        saveSettings();
    };
}

/* ================= STYLE ================= */

function injectStyle(){

if(document.getElementById('ef-style'))return;

const style=document.createElement('style');
style.id='ef-style';

style.textContent=`
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');

:root{
    --ef-accent:hsl(${settings.HUE},100%,50%);
    --ef-bg:hsl(${settings.HUE},30%,10%);
    --ef-line:hsl(${settings.HUE},20%,20%);
}

.endfield-panel{
    position:fixed;
    top:50%;
    left:50%;
    transform:translate(-50%,-50%);
    width:88vw;
    max-width:320px;
    background:var(--ef-bg);
    border:1px solid var(--ef-line);
    border-radius:20px;
    padding:18px;
    font-family:'Rajdhani',sans-serif;
    color:#e8e8e8;
    z-index:999999;
}

.ef-header{
    font-weight:700;
    letter-spacing:2px;
    font-size:14px;
    margin-bottom:14px;
    display:flex;
    justify-content:space-between;
}

.ef-header span{
    color:var(--ef-accent);
}

.ef-title{
    font-size:11px;
    letter-spacing:2px;
    margin-bottom:8px;
    color:#7c8794;
}

.ef-option{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:6px 0;
    border-bottom:1px solid var(--ef-line);
    font-size:13px;
}

input[type="radio"],
input[type="checkbox"]{
    appearance:none;
    -webkit-appearance:none;
    width:16px;
    height:16px;
    border:2px solid var(--ef-line);
    cursor:pointer;
    position:relative;
    background:transparent;
    transition:all 0.2s ease;
}

input[type="radio"]{
    border-radius:50%;
}

input[type="checkbox"]{
    border-radius:4px;
}

input:checked{
    border-color:var(--ef-accent);
}

input:checked::after{
    content:"";
    position:absolute;
    inset:3px;
    background:var(--ef-accent);
    border-radius:inherit;
}

button{
    width:100%;
    padding:9px;
    margin-top:10px;
    border-radius:14px;
    font-family:'Rajdhani',sans-serif;
    font-weight:700;
    letter-spacing:2px;
    cursor:pointer;
    transition:0.2s ease;
}

#openColor{
    background:transparent;
    border:1px solid var(--ef-accent);
    color:var(--ef-accent);
}

#openColor:hover{
    background:var(--ef-accent);
    color:#000;
}

#ef-close{
    background:var(--ef-accent);
    border:none;
    color:#000;
}

.slider-panel{
    margin-top:10px;
}

input[type="range"]{
    width:100%;
}
`;

document.head.appendChild(style);
}

})();