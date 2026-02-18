// ==UserScript==
// @name         GIF Terbang ULTIMATE v14
// @namespace    http://tampermonkey.net/
// @version      14.0
// @description  Full ultimate version: random, airplane, rotate, size, speed, position, upload
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

/* =========================
   PANEL CONTROL MODE
   1  = FORCE ON
   0  = FORCE OFF
   -1 = AUTO (ikut status tersimpan)
========================= */
const FORCE_PANEL = -1;

(function() {
'use strict';

// ===== LOAD SETTINGS =====
let savedGif = GM_getValue("gif_src", null);
let size = GM_getValue("gif_size", 150);
let speedMultiplier = GM_getValue("gif_speed", 1);
let savedPanel = GM_getValue("gif_panel", 1);
let randomFly = GM_getValue("gif_random", 1);
let airplaneMode = GM_getValue("gif_airplane", 1);
let posX = GM_getValue("gif_posX", window.innerWidth/2);
let posY = GM_getValue("gif_posY", window.innerHeight/2);

let PANEL_MODE = FORCE_PANEL === -1 ? savedPanel : FORCE_PANEL;

// ===== CREATE IMAGE =====
const img = document.createElement("img");
img.src = savedGif || "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif";
img.style.position = "fixed";
img.style.width = size + "px";
img.style.zIndex = "999999";
img.style.pointerEvents = "none";
img.style.transformOrigin = "center center";
document.body.appendChild(img);

let x = posX;
let y = posY;

let baseSpeed = 2 + Math.random()*2;
let angle = Math.random()*Math.PI*2;
let dx = Math.cos(angle)*baseSpeed;
let dy = Math.sin(angle)*baseSpeed;

let currentRotation = 0;

function animate(){

    if(randomFly===1){
        x += dx*speedMultiplier;
        y += dy*speedMultiplier;

        if(x<=0 || x+size>=window.innerWidth) dx*=-1;
        if(y<=0 || y+size>=window.innerHeight) dy*=-1;
    }

    img.style.left = x+"px";
    img.style.top = y+"px";

    if(airplaneMode===1){

        let target = Math.atan2(dy,dx)*(180/Math.PI)+90;

        let diff = target-currentRotation;
        diff=((diff+180)%360)-180;
        currentRotation+=diff*0.08;

        let banking = diff*0.3;
        let tilt = dy*3;

        img.style.transform=
        `rotate(${currentRotation}deg) skewX(${banking*0.2}deg) skewY(${tilt*0.2}deg)`;

    }else{
        img.style.transform="rotate(0deg)";
    }

    requestAnimationFrame(animate);
}

animate();

// ===== PANEL =====
const panel=document.createElement("div");
panel.style.position="fixed";
panel.style.top="20px";
panel.style.right="20px";
panel.style.background="rgba(0,0,0,0.9)";
panel.style.color="white";
panel.style.padding="15px";
panel.style.borderRadius="12px";
panel.style.zIndex="1000000";
panel.style.width="280px";
panel.style.fontFamily="Arial";
panel.style.display=PANEL_MODE===1?"block":"none";

panel.innerHTML=`
<div style="display:flex;justify-content:space-between;">
<b>GIF Ultimate Control</b>
<span id="closePanel" style="cursor:pointer;">❌</span>
</div>
<hr>

<label><input type="checkbox" id="randomToggle" ${randomFly?"checked":""}> Random Terbang</label><br>
<label><input type="checkbox" id="airplaneToggle" ${airplaneMode?"checked":""}> Mode Pesawat Realistis</label><br><br>

<label>Select Image (GIF / PNG / JPG)</label>
<input type="file" id="gifInput" accept="image/gif,image/png,image/jpeg"><br><br>

<label>Size</label>
<input type="range" id="sizeSlider" min="50" max="400" value="${size}"><br><br>

<label>Speed</label>
<input type="range" id="speedSlider" min="0.2" max="5" step="0.1" value="${speedMultiplier}"><br><br>

<label>Horizontal</label>
<input type="range" id="xSlider" min="0" max="${window.innerWidth-size}" value="${x}"><br>

<label>Vertical</label>
<input type="range" id="ySlider" min="0" max="${window.innerHeight-size}" value="${y}">
`;

document.body.appendChild(panel);

// ===== PANEL EVENTS =====
panel.querySelector("#closePanel").onclick=()=>{
panel.style.display="none";
GM_setValue("gif_panel",0);
};

panel.querySelector("#randomToggle").onchange=function(){
randomFly=this.checked?1:0;
GM_setValue("gif_random",randomFly);
};

panel.querySelector("#airplaneToggle").onchange=function(){
airplaneMode=this.checked?1:0;
GM_setValue("gif_airplane",airplaneMode);
};

panel.querySelector("#gifInput").addEventListener("change",e=>{
let file=e.target.files[0];
if(!file)return;
let reader=new FileReader();
reader.onload=ev=>{
img.src=ev.target.result;
GM_setValue("gif_src",ev.target.result);
};
reader.readAsDataURL(file);
});

panel.querySelector("#sizeSlider").oninput=function(){
size=parseInt(this.value);
img.style.width=size+"px";
GM_setValue("gif_size",size);
};

panel.querySelector("#speedSlider").oninput=function(){
speedMultiplier=parseFloat(this.value);
GM_setValue("gif_speed",speedMultiplier);
};

panel.querySelector("#xSlider").oninput=function(){
x=parseInt(this.value);
GM_setValue("gif_posX",x);
};

panel.querySelector("#ySlider").oninput=function(){
y=parseInt(this.value);
GM_setValue("gif_posY",y);
};

})();
