import { createVideoScrubber } from './vendor/scroll-video-scrubber.js';

const projects = [...document.querySelectorAll('.project:not([hidden])')];
const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
const shortViewport = matchMedia('(max-height: 600px), (max-width: 700px) and (max-height: 700px)');
const motionButton = document.querySelector('#motion-toggle');
const dialog = document.querySelector('#film-dialog');
const dialogVideo = document.querySelector('#dialog-video');
const menu = document.querySelector('.work-menu');
const controllers = new Map();
let userWantsLessMotion = false;
let isReduced = mediaQuery.matches;
const clamp = (n,min=0,max=1) => Math.min(max,Math.max(min,n));
const lerp = (a,b,p) => a+(b-a)*p;

function showProgress(project, progress) {
  const p = clamp(progress);
  const angle = Number(project.dataset.angle);
  const sign = Math.sign(angle);
  const film = project.querySelector('.film-card');
  const turn = p < .52 ? lerp(angle, -angle*.48, p/.52) : lerp(-angle*.48,sign*1.5,(p-.52)/.48);
  const rise = -Math.sin(p*Math.PI)*18;
  const scale = .94 + Math.sin(p*Math.PI)*.065;
  film.style.transform = `translate3d(${Math.sin(p*Math.PI*2)*9}px,${rise}px,0) rotate(${turn}deg) rotateY(${Math.cos(p*Math.PI)*sign*3}deg) scale(${scale})`;
  const beat = p < .32 ? 0 : p < .68 ? 1 : 2;
  project.querySelectorAll('.copy-slide').forEach((slide,i)=>{
    slide.classList.toggle('is-active',i===beat);
    slide.setAttribute('aria-hidden', String(i!==beat));
    const localStart = [0,.32,.68][i];
    const localEnd = [.32,.68,1][i];
    const entrance = i===0 ? 1 : clamp((p-localStart)/.07);
    const leaving = i===2 ? 1 : clamp((localEnd-p)/.055);
    const visible = i===beat;
    slide.style.opacity = visible ? Math.min(entrance,leaving) : 0;
    slide.style.transform = `translate3d(${(1-entrance)*24}px,${(1-entrance)*26-(1-leaving)*18}px,0)`;
  });
  project.querySelectorAll('.beat-button').forEach((button,i)=>{
    button.classList.toggle('is-active',i===beat);
    button.setAttribute('aria-pressed',String(i===beat));
  });
  project.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(Math.round(p*100)));
}

function loadVideo(project) {
  const video = project.querySelector('video');
  // A real source keeps native playback available without JavaScript.
  // Defer preloading until the project is near the viewport.
  if(video.preload==='none') { video.preload='auto'; video.load(); }
  return video;
}

function enableProject(project) {
  const video=loadVideo(project);
  if(isReduced || controllers.has(project)) return;
  const controller=createVideoScrubber({
    root:project.querySelector('.runway'),
    video, sticky:project.querySelector('.stage'),
    progress:project.querySelector('[data-svs-progress]'),
    onProgress:p=>showProgress(project,p),
    // A failed seek can recover; only a media failure needs the fallback.
    onError:()=>{if(video.error) project.querySelector('.film-card').classList.add('media-error');}
  });
  controllers.set(project,controller);
  showProgress(project,controller.progress);
}

const nearViewport = new IntersectionObserver(entries=>{
  for(const entry of entries) if(entry.isIntersecting) enableProject(entry.target);
},{rootMargin:'500px 0px'});

function applyMotionMode() {
  isReduced=mediaQuery.matches||userWantsLessMotion||shortViewport.matches;
  controllers.forEach(controller=>controller.destroy()); controllers.clear();
  document.documentElement.classList.toggle('enhanced',!isReduced);
  document.documentElement.classList.toggle('no-motion',isReduced);
  const forcedReading=mediaQuery.matches||shortViewport.matches;
  motionButton.textContent=isReduced&&!forcedReading?'More motion':'Less motion';
  motionButton.setAttribute('aria-pressed',String(isReduced));
  motionButton.disabled=forcedReading;
  motionButton.title=mediaQuery.matches?'Reduced motion follows your system preference':shortViewport.matches?'A shorter screen uses the reading layout':'';
  for(const project of projects) {
    const video=project.querySelector('video'); video.controls=isReduced;
    project.querySelectorAll('.copy-slide').forEach(slide=>{
      slide.removeAttribute('aria-hidden'); slide.style.opacity=''; slide.style.transform='';
    });
    project.querySelector('.film-card').style.transform='';
    nearViewport.unobserve(project); nearViewport.observe(project);
    if(!isReduced) showProgress(project,0);
  }
}

function refreshMotionLayout() {
  const current=projects.find(project=>{const r=project.getBoundingClientRect();return r.top<=150&&r.bottom>150;});
  applyMotionMode();
  if(current) window.scrollTo({top:scrollY+current.getBoundingClientRect().top-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),behavior:'instant'});
}
motionButton.addEventListener('click',()=>{
  userWantsLessMotion=!userWantsLessMotion;
  refreshMotionLayout();
});
mediaQuery.addEventListener('change',refreshMotionLayout);
shortViewport.addEventListener('change',refreshMotionLayout);
applyMotionMode();

for(const project of projects) {
  for(const button of project.querySelectorAll('[data-beat-target]')) button.addEventListener('click',()=>{
    const runway=project.querySelector('.runway');
    const stage=project.querySelector('.stage');
    const stickyTop=parseFloat(getComputedStyle(stage).top)||0;
    const travel=runway.getBoundingClientRect().height-stage.getBoundingClientRect().height;
    const target=[.08,.43,.79][Number(button.dataset.beatTarget)];
    window.scrollTo({top:scrollY+runway.getBoundingClientRect().top-stickyTop+travel*target,behavior:isReduced?'instant':'smooth'});
  });
  const video=project.querySelector('video');
  video.addEventListener('error',()=>project.querySelector('.film-card').classList.add('media-error'));
  video.addEventListener('loadeddata',()=>project.querySelector('.film-card').classList.remove('media-error'));
}

const sources={evaluate:'https://github.com/arvindang/evaluate-product-designers',math:'https://github.com/arvindang/math-collective-skills'};
for(const button of document.querySelectorAll('[data-watch]')) button.addEventListener('click',event=>{
  if(typeof dialog.showModal!=='function') return;
  event.preventDefault();
  const id=button.dataset.watch;
  const project=document.getElementById(id);
  document.querySelector('#film-dialog-title').textContent=project?project.querySelector('.project-title').textContent.replace(/^\s*\d+\s*\/\s*\d+/,'').trim():id==='evaluate'?'Evaluate Product Designers':'MATH Founder Stack';
  document.querySelector('#dialog-capture-note').textContent=project?project.querySelector('.film-caption>span').textContent+'.':'Public guide walkthrough.';
  const link=document.querySelector('#dialog-source');
  link.href=project?project.querySelector('.visit-link').href:sources[id];
  dialogVideo.src=`./media/${id}.mp4`; dialogVideo.poster=`./media/${id}.jpg`;
  dialog.showModal();
  dialogVideo.play().catch(()=>{});
});
document.querySelector('#close-film').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{dialogVideo.pause();dialogVideo.removeAttribute('src');dialogVideo.load();});
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
for(const link of menu.querySelectorAll('a')) link.addEventListener('click',()=>{menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')menu.open=false;});
document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});

let heroFrame=0;
const collage=document.querySelector('.hero-collage');
function moveHero(){heroFrame=0;if(isReduced)return;const p=clamp(scrollY/650);collage.style.transform=`translateY(${30-p*65}px) rotate(${p*5}deg)`;}
addEventListener('scroll',()=>{if(scrollY<1000&&!heroFrame)heroFrame=requestAnimationFrame(moveHero);},{passive:true});
document.documentElement.classList.add('js-ready');
