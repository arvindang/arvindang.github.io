// Redraws the hero title as SVG outlines that stretch toward the pointer and spring back.
(()=>{
const data=window.TITLE_GLYPHS;
const title=document.querySelector('.hero h1');
const textRoot=title&&title.querySelector('.title-text');
if(!data||!textRoot||!window.ResizeObserver||!document.fonts) return;

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const motionButton=document.querySelector('[data-motion-toggle]');
const SVG='http://www.w3.org/2000/svg';
const SEGMENT=55; // longest cubic, in font units, so straight stems can bend
const STIFFNESS=170, DAMPING=7, PULL=260, DRAG=5.5;

function subdivide(contour) {
  const out=[contour[0],contour[1]];
  for(let i=2;i<contour.length;i+=6) {
    let x0=contour[i-2],y0=contour[i-1],[x1,y1,x2,y2,x3,y3]=contour.slice(i,i+6);
    const n=Math.max(1,Math.ceil((Math.hypot(x1-x0,y1-y0)+Math.hypot(x2-x1,y2-y1)+Math.hypot(x3-x2,y3-y2))/SEGMENT));
    for(let k=n;k>1;k--) {
      const t=1/k,l=(a,b)=>a+(b-a)*t;
      const ax=l(x0,x1),ay=l(y0,y1),bx=l(x1,x2),by=l(y1,y2),cx=l(x2,x3),cy=l(y2,y3);
      const dx=l(ax,bx),dy=l(ay,by),ex=l(bx,cx),ey=l(by,cy),fx=l(dx,ex),fy=l(dy,ey);
      out.push(ax,ay,dx,dy,fx,fy);
      x0=fx;y0=fy;x1=ex;y1=ey;x2=cx;y2=cy;
    }
    out.push(x1,y1,x2,y2,x3,y3);
  }
  return out;
}
const shapes={};
for(const ch in data.glyphs) shapes[ch]=data.glyphs[ch].map(subdivide);

const svg=document.createElementNS(SVG,'svg');
// Inline styles so a stale cached stylesheet can't leave the overlay unpositioned.
svg.setAttribute('class','title-glyphs');
svg.setAttribute('aria-hidden','true');
svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;fill:currentColor';
const bodyPath=document.createElementNS(SVG,'path');
const accentPath=document.createElementNS(SVG,'path');
accentPath.style.fill='#e83262';
svg.append(bodyPath,accentPath);

let rest,pos,vel,contours=[],radius=60,raf=0,last=0,ready=false;
const pointer={x:0,y:0,vx:0,vy:0,t:0,active:false};

function layout() {
  const size=parseFloat(getComputedStyle(title).fontSize),scale=size/data.unitsPerEm;
  const box=title.getBoundingClientRect(),range=document.createRange(),placed=[];
  const walker=document.createTreeWalker(textRoot,NodeFilter.SHOW_TEXT);
  let total=0;
  for(let node;(node=walker.nextNode());) {
    for(let i=0;i<node.data.length;i++) {
      const ch=node.data[i];
      if(/\s/.test(ch)) continue;
      if(!shapes[ch]) return false;
      range.setStart(node,i); range.setEnd(node,i+1);
      const rect=range.getClientRects()[0];
      if(!rect) continue;
      const accent=!!node.parentElement.closest('.title-period');
      placed.push({shape:shapes[ch],x:rect.left-box.left,y:rect.top-box.top+data.ascender*scale,accent});
      for(const c of shapes[ch]) total+=c.length;
    }
  }
  rest=new Float32Array(total); contours=[]; radius=size*.6;
  let j=0;
  for(const {shape,x,y,accent} of placed) for(const c of shape) {
    contours.push({start:j,end:j+c.length,accent});
    for(let i=0;i<c.length;i+=2) {rest[j++]=x+c[i]*scale; rest[j++]=y-c[i+1]*scale;}
  }
  pos=rest.slice(); vel=new Float32Array(total);
  return placed.length>0;
}

const r=v=>Math.round(v*10)/10;
function render() {
  let body='',accent='';
  for(const {start,end,accent:isAccent} of contours) {
    let d='M'+r(pos[start])+' '+r(pos[start+1]);
    for(let i=start+2;i<end;i+=6) d+='C'+r(pos[i])+' '+r(pos[i+1])+' '+r(pos[i+2])+' '+r(pos[i+3])+' '+r(pos[i+4])+' '+r(pos[i+5]);
    d+='Z';
    if(isAccent) accent+=d; else body+=d;
  }
  bodyPath.setAttribute('d',body); accentPath.setAttribute('d',accent);
}

function step(dt) {
  const {x:px,y:py,vx,vy,active}=pointer,r2=radius*radius;
  let energy=0;
  for(let i=0;i<rest.length;i+=2) {
    const x=pos[i],y=pos[i+1];
    let ax=STIFFNESS*(rest[i]-x)-DAMPING*vel[i],ay=STIFFNESS*(rest[i+1]-y)-DAMPING*vel[i+1];
    if(active) {
      const dx=px-rest[i],dy=py-rest[i+1],w=Math.exp(-(dx*dx+dy*dy)/r2);
      if(w>.003) {ax+=w*(PULL*(px-x)+DRAG*vx); ay+=w*(PULL*(py-y)+DRAG*vy);}
    }
    vel[i]+=ax*dt; vel[i+1]+=ay*dt;
    pos[i]+=vel[i]*dt; pos[i+1]+=vel[i+1]*dt;
    energy+=Math.abs(vel[i])+Math.abs(vel[i+1])+Math.abs(rest[i]-pos[i])+Math.abs(rest[i+1]-pos[i+1]);
  }
  return energy/rest.length;
}

function frame(now) {
  const dt=Math.min(.034,(now-last)/1000||.016); last=now;
  const energy=step(dt/2)+step(dt/2);
  pointer.vx*=.86; pointer.vy*=.86;
  if(pointer.active||energy>.02) {render(); raf=requestAnimationFrame(frame);}
  else {pos.set(rest); vel.fill(0); render(); raf=0;}
}
function wake() {if(!raf) {last=performance.now(); raf=requestAnimationFrame(frame);}}

function motionAllowed() {
  const lessMotion=motionButton&&!motionButton.disabled&&motionButton.getAttribute('aria-pressed')==='true';
  return ready&&!reducedMotion.matches&&!lessMotion;
}
function track(event,withVelocity) {
  const box=title.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top;
  const dt=Math.max(.008,(event.timeStamp-pointer.t)/1000);
  if(withVelocity) {pointer.vx=pointer.vx*.5+(x-pointer.x)/dt*.5; pointer.vy=pointer.vy*.5+(y-pointer.y)/dt*.5;}
  Object.assign(pointer,{x,y,t:event.timeStamp});
}
title.addEventListener('pointerenter',event=>{track(event,false); pointer.vx=pointer.vy=0;});
title.addEventListener('pointermove',event=>{
  if(!motionAllowed()) return;
  track(event,pointer.active); pointer.active=true; wake();
});
for(const type of ['pointerleave','pointercancel']) title.addEventListener(type,()=>{pointer.active=false;});

function rebuild() {
  cancelAnimationFrame(raf); raf=0; pointer.active=false;
  ready=layout();
  title.style.position='relative';
  textRoot.style.setProperty('-webkit-text-fill-color',ready?'transparent':'');
  if(ready) {if(!svg.isConnected) title.append(svg); render();}
  else svg.remove();
}
const face='800 1em "Bricolage Grotesque"';
document.fonts.load(face).then(()=>{
  if(!document.fonts.check(face)) return;
  new ResizeObserver(rebuild).observe(title);
}).catch(()=>{});
})();
