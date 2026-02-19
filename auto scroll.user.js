// ==UserScript==
// @name         🌸 Sakura Auto Scroll v11 (Vertical / Horizontal)
// @namespace    sakura.scroll.v11
// @version      11.0
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function(){
'use strict';

let speed = parseFloat(localStorage.getItem("sakura_speed")) || 2;
let horizontal = localStorage.getItem("sakura_horizontal") === "true";
let running = false;
let scrollTarget = null;

const sakura = "#ff6fa5";

//////////////////////////////////////////////////
// 🌸 DETECT SCROLL CONTAINER
//////////////////////////////////////////////////

function detectScrollContainer(){
let elements = [...document.querySelectorAll("*")];
let best = document.documentElement;
let maxSize = 0;

elements.forEach(el=>{
let style = getComputedStyle(el);
if(
(style.overflowY === "auto" || style.overflowY === "scroll" ||
 style.overflowX === "auto" || style.overflowX === "scroll")
){
let size = horizontal ? el.scrollWidth : el.scrollHeight;
if(size > maxSize && size > el.clientHeight + 200){
maxSize = size;
best = el;
}
}
});

return best;
}

//////////////////////////////////////////////////
// 🌸 PANEL UI
//////////////////////////////////////////////////

const panel = document.createElement("div");
panel.style = `
position:fixed;
top:50%;
left:50%;
transform:translate(-50%,-50%) scale(0.85);
width:310px;
background:rgba(40,20,30,0.96);
backdrop-filter:blur(20px);
color:white;
padding:24px;
border-radius:28px;
z-index:999999;
transition:all .25s ease;
box-shadow:0 0 50px rgba(255,105,180,.5);
font-family:sans-serif;
opacity:0;
pointer-events:none;
`;

panel.innerHTML = `
<div style="position:relative;">

<div id="closeBtn" style="
position:absolute;
top:-10px;
right:-10px;
width:34px;
height:34px;
background:${sakura};
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
font-size:18px;
cursor:pointer;">
✕
</div>

<div style="text-align:center;color:${sakura};font-size:20px;margin-bottom:18px;">
🌸 Sakura Scroll 🌸
</div>

<label>Speed</label>
<input type="range" min="0.5" max="10" step="0.1"
value="${speed}" id="sakura_speed"
style="width:100%;accent-color:${sakura};">

<div id="speedVal" style="text-align:center;margin:12px 0;">
${speed}
</div>

<label style="display:flex;align-items:center;gap:8px;margin-bottom:15px;">
<input type="checkbox" id="directionToggle" ${horizontal?"checked":""}>
Horizontal Mode
</label>

<button id="toggle"
style="width:100%;padding:15px;border:none;border-radius:24px;
background:linear-gradient(145deg,#ff9ac9,#ff6fa5);
color:white;font-size:18px;">
Start
</button>

</div>
`;

document.body.appendChild(panel);

function showPanel(){
panel.style.opacity="1";
panel.style.pointerEvents="auto";
panel.style.transform="translate(-50%,-50%) scale(1)";
}

function hidePanel(){
panel.style.opacity="0";
panel.style.pointerEvents="none";
panel.style.transform="translate(-50%,-50%) scale(0.85)";
}

//////////////////////////////////////////////////
// 🌸 CONTROL
//////////////////////////////////////////////////

document.getElementById("closeBtn").onclick = hidePanel;

document.getElementById("sakura_speed").oninput = function(){
speed = parseFloat(this.value);
document.getElementById("speedVal").textContent = speed;
localStorage.setItem("sakura_speed", speed);
};

document.getElementById("directionToggle").onchange = function(){
horizontal = this.checked;
localStorage.setItem("sakura_horizontal", horizontal);
};

document.getElementById("toggle").onclick = function(){
running ? stop() : start();
};

//////////////////////////////////////////////////
// 🌊 ULTRA SMOOTH ENGINE
//////////////////////////////////////////////////

let virtualPos = 0;
let velocity = 0;
let lastTime = null;

function start(){
scrollTarget = detectScrollContainer();
virtualPos = horizontal ? scrollTarget.scrollLeft : scrollTarget.scrollTop;
velocity = 0;
running = true;
hidePanel();
lastTime = null;
requestAnimationFrame(loop);
}

function stop(){
running = false;
velocity = 0;
showPanel();
}

function loop(timestamp){
if(!running) return;

if(!lastTime) lastTime = timestamp;
let delta = (timestamp - lastTime) / 16;
lastTime = timestamp;

let target = speed * 5;

velocity += (target - velocity) * 0.06 * delta;
velocity *= 0.99;

virtualPos += velocity;

if(horizontal){
let maxScroll = scrollTarget.scrollWidth - scrollTarget.clientWidth;
if(virtualPos > maxScroll) virtualPos = maxScroll;
scrollTarget.scrollLeft = virtualPos;
}else{
let maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
if(virtualPos > maxScroll) virtualPos = maxScroll;
scrollTarget.scrollTop = virtualPos;
}

requestAnimationFrame(loop);
}

//////////////////////////////////////////////////
// 🌸 SWIPE LEFT HOLD TRIGGER
//////////////////////////////////////////////////

let startX=0, startY=0;
let holdTimer=null;
let swipedLeft=false;

function isMiddleArea(x,y){
return (
x > window.innerWidth*0.3 &&
x < window.innerWidth*0.7 &&
y > window.innerHeight*0.3 &&
y < window.innerHeight*0.7
);
}

document.addEventListener("touchstart",(e)=>{
let t=e.touches[0];

if(isMiddleArea(t.clientX,t.clientY)){
startX=t.clientX;
startY=t.clientY;
swipedLeft=false;
}

if(running) stop();
});

document.addEventListener("touchmove",(e)=>{
let t=e.touches[0];
let dx=t.clientX-startX;
let dy=Math.abs(t.clientY-startY);

if(dx < -80 && dy < 60 && !swipedLeft){
swipedLeft=true;
holdTimer=setTimeout(showPanel,1000);
}
});

document.addEventListener("touchend",()=>{
if(holdTimer){
clearTimeout(holdTimer);
holdTimer=null;
}
swipedLeft=false;
});

})();
