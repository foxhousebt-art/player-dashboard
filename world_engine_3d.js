(() => {
"use strict";
const canvas=document.getElementById("world3d"); if(!canvas) return;
const ctx=canvas.getContext("2d",{alpha:true});
let W=0,H=0,DPR=1,last=0,acc=0;
function resize(){DPR=Math.min(window.devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize); resize();

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
function proj(x,y,z){ // z 0=near, 1=far
 const f=lerp(1.16,.43,clamp(z,0,1));
 return {x:W*.5+(x-W*.5)*f,y:H*.54+(y-H*.54)*f,s:f};
}
function shade(hex,k,a=1){
 const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
 return `rgba(${clamp(r*k,0,255)|0},${clamp(g*k,0,255)|0},${clamp(b*k,0,255)|0},${a})`;
}
function poly(points,fill,stroke="rgba(210,230,225,.22)"){
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();
}
function glow(x,y,r,c,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c.replace("A",a));g.addColorStop(1,c.replace("A","0"));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}

function ship(o,t){
 const q=proj(o.x,o.y,o.z),s=q.s*o.scale, yaw=o.yaw;
 ctx.save();ctx.translate(q.x,q.y);ctx.rotate(yaw);
 const fog=lerp(.95,.34,o.z);
 // shadow/exhaust
 glow(-30*s,4*s,32*s,"rgba(255,137,45,A)",.22*fog);
 // actual volumetric-looking hull: top/side/bottom faces
 const top=[[-38,-4],[-12,-13],[24,-9],[43,-1],[14,4],[-25,4]].map(([x,y])=>({x:x*s,y:y*s}));
 const side=[[-38,-4],[-25,4],[14,4],[43,-1],[25,8],[-14,10]].map(([x,y])=>({x:x*s,y:y*s}));
 const wing=[[-8,-3],[8,-2],[30,-17],[12,-7],[-16,-7],[-31,-14]].map(([x,y])=>({x:x*s,y:y*s}));
 poly(side,shade("#263638",.58,fog)); poly(wing,shade("#526568",.72,fog)); poly(top,shade("#718487",.86,fog));
 // canopy
 ctx.fillStyle=`rgba(105,205,235,${.62*fog})`;ctx.beginPath();ctx.ellipse(9*s,-7*s,10*s,4*s,0,0,Math.PI*2);ctx.fill();
 glow(31*s,-2*s,8*s,"rgba(104,211,255,A)",.30*fog);
 ctx.restore();
}
function limb(x1,y1,x2,y2,w,s,col,a){
 ctx.strokeStyle=shade(col,.72,a);ctx.lineWidth=w*s;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
 ctx.strokeStyle=shade(col,1.15,a);ctx.lineWidth=Math.max(1,w*s*.18);ctx.stroke();
}
function mech(o,t){
 const q=proj(o.x,o.y,o.z),s=q.s*o.scale, fog=lerp(.95,.38,o.z);
 const walk=Math.sin(t*o.speed+o.phase),bob=Math.abs(Math.sin(t*o.speed+o.phase))*2.2*s;
 ctx.save();ctx.translate(q.x,q.y-bob);
 // terrain contact shadow
 ctx.fillStyle=`rgba(0,0,0,${.24*fog})`;ctx.beginPath();ctx.ellipse(0,20*s,14*s,4*s,0,0,Math.PI*2);ctx.fill();
 const hipY=5*s, shoulderY=-13*s;
 limb(-4*s,hipY,-8*s+walk*5*s,20*s,5,s,"#485657",fog);
 limb(4*s,hipY,8*s-walk*5*s,20*s,5,s,"#485657",fog);
 limb(-9*s,shoulderY,-15*s-walk*4*s,5*s,4,s,"#536263",fog);
 limb(9*s,shoulderY,15*s+walk*4*s,4*s,4,s,"#536263",fog);
 // torso faceted
 poly([{x:-10*s,y:-15*s},{x:9*s,y:-15*s},{x:12*s,y:5*s},{x:-8*s,y:7*s}],shade("#526263",.74,fog));
 poly([{x:-10*s,y:-15*s},{x:-4*s,y:-21*s},{x:7*s,y:-20*s},{x:9*s,y:-15*s}],shade("#758789",.92,fog));
 // head
 ctx.fillStyle=shade("#66787a",.86,fog);ctx.fillRect(-6*s,-28*s,12*s,9*s);
 glow(2*s,-24*s,6*s,"rgba(91,204,255,A)",.45*fog);
 // carried cargo for workers
 if(o.cargo){ctx.fillStyle=shade("#8a714c",.72,fog);ctx.fillRect(12*s,-3*s,12*s,10*s);ctx.strokeStyle=`rgba(220,190,125,${.35*fog})`;ctx.strokeRect(12*s,-3*s,12*s,10*s)}
 ctx.restore();
}
function bez(a,b,c,t){const u=1-t;return u*u*a+2*u*t*b+t*t*c}
const ships=[
 {period:31,off:0,scale:1.0,path:[[-.08,.17,.78],[.54,.21,.55],[1.10,.12,.34]]},
 {period:43,off:15,scale:.72,path:[[-.10,.28,.92],[.48,.18,.72],[1.08,.24,.48]]},
 {period:37,off:26,scale:.86,path:[[1.08,.10,.68],[.56,.15,.52],[-.08,.22,.38]],reverse:true}
];
const mechs=[
 {baseX:.60,baseY:.72,z:.58,scale:.72,speed:4.4,phase:0,cargo:true,range:.055},
 {baseX:.72,baseY:.77,z:.40,scale:.88,speed:4.8,phase:2,cargo:false,range:.045},
 {baseX:.50,baseY:.66,z:.72,scale:.58,speed:4.1,phase:4,cargo:true,range:.035},
 {baseX:.83,baseY:.69,z:.64,scale:.64,speed:4.6,phase:1,cargo:false,range:.030}
];
function frame(ms){
 requestAnimationFrame(frame); if(document.hidden)return;
 const dt=Math.min(50,ms-last);last=ms;acc+=dt;
 if(acc<16)return; acc=0; const t=ms/1000;
 ctx.clearRect(0,0,W,H);
 // Far to near sorting for proper depth feel.
 const actors=[];
 ships.forEach((s,i)=>{
   let u=((t+s.off)%s.period)/s.period; if(s.reverse)u=1-u;
   const p=s.path;
   const nx=bez(p[0][0],p[1][0],p[2][0],u), ny=bez(p[0][1],p[1][1],p[2][1],u), nz=bez(p[0][2],p[1][2],p[2][2],u);
   const eps=.002,ue=clamp(u+eps,0,1),nx2=bez(p[0][0],p[1][0],p[2][0],ue),ny2=bez(p[0][1],p[1][1],p[2][1],ue);
   actors.push({kind:"ship",z:nz,x:nx*W,y:ny*H,scale:s.scale,yaw:Math.atan2((ny2-ny)*H,(nx2-nx)*W)});
 });
 mechs.forEach((m,i)=>{
   // Walk -> pause -> work -> return, instead of constant sliding.
   const cyc=(t/14+i*.21)%1; let travel;
   if(cyc<.32) travel=cyc/.32; else if(cyc<.55)travel=1; else if(cyc<.87)travel=1-(cyc-.55)/.32; else travel=0;
   actors.push({...m,kind:"mech",x:(m.baseX+m.range*travel)*W,y:m.baseY*H});
 });
 actors.sort((a,b)=>b.z-a.z);
 actors.forEach(a=>a.kind==="ship"?ship(a,t):mech(a,t));
}
requestAnimationFrame(frame);
})();