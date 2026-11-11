import {HEROES,ZONES,WORLD,QCOLORS,hash,zoneAt,dist,clamp} from './data.js?v=19';
export async function loadAssets(target){const assets=target||{};await Promise.all([...HEROES.map(h=>[h.photo,h.photo]),['beasts','beasts.webp'],['scenery','scenery.webp']].map(([key,file])=>new Promise(resolve=>{const img=new Image();let settled=false;const done=()=>{if(settled)return;settled=true;resolve();};img.onload=()=>{assets[key]=img;done();};img.onerror=()=>{img.onerror=null;setTimeout(()=>{img.src=`assets/${file}?retry=${Date.now()}`;setTimeout(done,15000);},600);};setTimeout(done,15000);img.src=window.__OFFLINE_ASSETS?.[file]||`assets/${file}?v=19`;})));return assets;}
export function portrait(canvas,hero,assets){const ctx=canvas.getContext('2d'),img=assets[hero.photo];ctx.clearRect(0,0,canvas.width,canvas.height);if(!img)return;const [x,y,w,h]=hero.crop;ctx.drawImage(img,x,y,w,h,0,0,canvas.width,canvas.height);}
export function atlas(ctx,img,index,cols,rows,x,y,w,h){if(!img||!img.complete||!img.naturalWidth)return false;const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows;ctx.drawImage(img,(index%cols)*sw+1,Math.floor(index/cols)*sh+1,sw-2,sh-2,x-w/2,y-h,w,h);return true;}
export function drawMap(canvas,game,full=false){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#101d18';c.fillRect(0,0,w,h);for(const z of ZONES){const x=z.x/WORLD.w*w,y=z.y/WORLD.h*h,zw=4096/WORLD.w*w,zh=4096/WORLD.h*h;c.fillStyle=game.save.discovered[z.id]?z.color:'#26312b';c.fillRect(x+1,y+1,zw-2,zh-2);c.strokeStyle='#8b8b603b';c.lineWidth=full?2:1;c.beginPath();c.moveTo(x,y+zh/2);c.lineTo(x+zw,y+zh/2);c.moveTo(x+zw*.18,y);c.lineTo(x+zw*.18,y+zh);c.stroke();if(full){c.fillStyle=game.save.discovered[z.id]?'#e6d2a3':'#84907e';c.font='15px serif';c.textAlign='center';c.fillText(z.name,x+zw/2,y+zh*.3);c.font='10px sans-serif';c.fillStyle='#b2bba2';c.fillText(`Lv.${z.min}–${z.max}`,x+zw/2,y+zh*.74);}if(game.save.discovered[z.id]){c.fillStyle='#cfb57b';c.fillRect(z.camp[0]/WORLD.w*w-2,z.camp[1]/WORLD.h*h-2,4,4);}if(full){c.fillStyle=game.save.bosses[z.id]?'#b9a267':'#ad7161';c.beginPath();c.arc(z.boss[0]/WORLD.w*w,z.boss[1]/WORLD.h*h,4,0,Math.PI*2);c.fill();}}
 const x=game.hero.x/WORLD.w*w,y=game.hero.y/WORLD.h*h;c.fillStyle='#fff0bb';c.shadowColor='#fff0bb';c.shadowBlur=7;c.beginPath();c.arc(x,y,full?4:2.5,0,Math.PI*2);c.fill();c.shadowBlur=0;}
export class Renderer{
 constructor(canvas,assets){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.assets=assets;this.w=1;this.h=1;this.scale=1;this.textures=[];for(const z of ZONES){const t=document.createElement('canvas');t.width=t.height=256;const c=t.getContext('2d');c.fillStyle=z.color;c.fillRect(0,0,256,256);for(let i=0;i<2500;i++){const x=hash(i,z.id)*256,y=hash(i+991,z.id+3)*256;c.fillStyle=i%3===0?'#00000016':'#e5e7c211';c.fillRect(x,y,i%4+1,i%3+1);}for(let i=0;i<12;i++){c.strokeStyle='#091d1229';const x=hash(i+21,z.id)*256,y=hash(i+9912,z.id)*256;c.beginPath();c.moveTo(x,y);c.lineTo(x+hash(i,11)*18,y+hash(i,27)*12);c.stroke();}this.textures.push(this.ctx.createPattern(t,'repeat'));}}
 resize(){const dpr=Math.min(devicePixelRatio||1,1.5),w=innerWidth,h=innerHeight;if(this.w!==w||this.h!==h){this.w=w;this.h=h;this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.dpr=dpr;}this.ctx.setTransform(dpr,0,0,dpr,0,0);this.scale=clamp(h/600,.6,1.1);}
 project(x,y,z=0){return{x:this.w/2+(x-y-this.camX)*.8*this.scale,y:this.h*.48+(x+y-this.camY)*.4*this.scale-z*this.scale};}
 visible(p,margin=200){return p.x>-margin&&p.x<this.w+margin&&p.y>-margin&&p.y<this.h+margin;}
 ground(game){const c=this.ctx,s=this.scale;c.save();c.transform(.8*s,.4*s,-.8*s,.4*s,this.w/2-this.camX*.8*s,this.h*.48-this.camY*.4*s);for(const z of ZONES){c.fillStyle=this.textures[z.id];c.fillRect(z.x,z.y,4096,4096);c.fillStyle=z.id===4?'#8b96904a':z.id===3?'#ae805333':'#998d6b24';c.fillRect(z.x,z.y+1965,4096,170);c.fillRect(z.x+680,z.y,140,4096);c.fillStyle='#d4c2a410';c.fillRect(z.x,z.y+1993,4096,20);c.fillRect(z.x+720,z.y,15,4096);}
 const bx=Math.floor(game.hero.x/256),by=Math.floor(game.hero.y/256);for(let x=bx-10;x<=bx+10;x++)for(let y=by-10;y<=by+10;y++){const wx=x*256,wy=y*256;if(wx<0||wy<0||wx>WORLD.w||wy>WORLD.h)continue;const h=hash(x,y);c.fillStyle=h>.5?'#17271b25':'#bdb08d0e';c.beginPath();c.ellipse(wx+110,wy+120,40+h*100,15+h*55,h*3,0,Math.PI*2);c.fill();if(h>.85){c.strokeStyle='#12201b60';c.lineWidth=1.5;c.beginPath();c.moveTo(wx+30,wy+100);c.lineTo(wx+90,wy+130);c.lineTo(wx+150,wy+120);c.stroke();}}
 const z=game.zone;c.strokeStyle='#b7ac7a40';c.lineWidth=4;c.beginPath();c.ellipse(z.camp[0],z.camp[1],190,190,0,0,Math.PI*2);c.stroke();c.fillStyle='#aaaa9030';for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){const x=z.camp[0]+i*40,y=z.camp[1]+j*40;if(Math.hypot(i,j)<4)c.fillRect(x,y,36,36);}c.restore();}
 shadow(x,y,r=30,opacity=.5){const c=this.ctx,p=this.project(x,y);c.save();c.fillStyle=`rgba(3,9,10,${opacity})`;c.beginPath();c.ellipse(p.x,p.y+4,r*this.scale,r*.38*this.scale,0,0,Math.PI*2);c.fill();c.restore();}
 scenery(index,x,y,size,game){const p=this.project(x,y);if(!this.visible(p,size*this.scale))return;this.shadow(x,y,size*.18,.35);const c=this.ctx;c.save();if((index===5||index===6)&&dist(game.hero,{x,y})<170&&x+y>game.hero.x+game.hero.y)c.globalAlpha=.35;atlas(c,this.assets.scenery,index,4,4,p.x,p.y+8*this.scale,size*this.scale,size*this.scale);c.restore();}
 animPose(game,time,s){
  // --- detect a fresh attack / skill from engine cooldowns ---
  const cd=game.attackCD||0;
  if(this._pcd!==undefined&&cd>this._pcd+.05)this._anim={kind:'attack',t:0,dur:.26};
  this._pcd=cd;
  const cds=game.cooldowns||[];
  if(this._pc&&this._pc.length===cds.length)for(let i=0;i<cds.length;i++){if(cds[i]>this._pc[i]+.05){this._anim={kind:'skill',t:0,dur:.62,i};break;}}
  this._pc=cds.slice();
  const dt=this._last!==undefined?Math.min(.1,Math.max(0,time-this._last)):0;this._last=time;
  if(this._anim){this._anim.t+=dt;if(this._anim.t>=this._anim.dur)this._anim=null;}
  const a=this._anim,ctx=this.ctx,col=game.def.color||'#d6b06a';
  if(!a){if(!game.isMoving)return{rot:0,sx:1,sy:1+Math.sin(time*2)*.008};const sp=Math.min(1,(game.vel?Math.hypot(game.vel.x,game.vel.y):0)/Math.max(1,game.stats.speed));return{rot:Math.sin(time*(7+6*sp))*.035,sx:1,sy:1+Math.sin(time*(15+9*sp))*.014};}
  const u=Math.min(1,a.t/a.dur);
  if(a.kind==='attack'){
    const k=Math.sin(u*Math.PI);
    // 横扫：等距视角下的水平挥砍投影是扁椭圆，所以把整段特效压扁 .42 后按角度扫
    const cy=-72*s,px=8*s,r0=36*s,r1=90*s,flat=.42,lead=Math.PI*(1-u);
    const wedge=(a0,a1,alpha,tint)=>{
      ctx.globalAlpha=alpha;
      const gw=ctx.createRadialGradient(px,cy,r0,px,cy,r1);
      gw.addColorStop(0,'#ffffff00');
      gw.addColorStop(.45,tint?'#ffffff88':'#fff8e4d0');
      gw.addColorStop(1,'#fff8e400');
      ctx.fillStyle=gw;
      ctx.beginPath();ctx.arc(px,cy,r1,a0,a1);ctx.arc(px,cy,r0*.82,a1,a0,true);ctx.closePath();ctx.fill();
    };
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.translate(px,cy);ctx.scale(1,flat);ctx.translate(-px,-cy);
    wedge(lead,lead+1.15,.45*(1-u*.45));                // long faint trail
    wedge(lead,lead+.58,.55*(1-u*.3),true);             // hot inner trail
    ctx.globalAlpha=1;ctx.strokeStyle='#fffdf4';ctx.lineWidth=9*s;ctx.lineCap='round';
    ctx.shadowColor=col;ctx.shadowBlur=22;
    ctx.beginPath();ctx.arc(px,cy,r1*.95,lead,lead+.3);ctx.stroke();   // cutting edge
    // 手臂 + 刀身：沿当前挥砍角度从肩部伸出，让"手"真的在动
    ctx.save();
    ctx.translate(px,cy);ctx.rotate(lead+Math.PI/2);
    ctx.shadowBlur=12;ctx.shadowColor=col;
    ctx.lineCap='round';
    ctx.globalAlpha=.95*(1-u*.35);
    ctx.strokeStyle='#e8dcc0';ctx.lineWidth=7*s;                       // 手臂
    ctx.beginPath();ctx.moveTo(r1*.55,0);ctx.lineTo(r1*.78,0);ctx.stroke();
    ctx.strokeStyle='#fffaf0';ctx.lineWidth=6.5*s;                     // 刀身
    ctx.beginPath();ctx.moveTo(r1*.8,0);ctx.lineTo(r1*1.3,0);ctx.stroke();
    ctx.strokeStyle=col;ctx.lineWidth=2.4*s;ctx.globalAlpha=.85*(1-u); // 刀脊高光
    ctx.beginPath();ctx.moveTo(r1*.84,-2.4*s);ctx.lineTo(r1*1.26,-2.4*s);ctx.stroke();
    ctx.restore();
    ctx.globalAlpha=.85*(1-u);ctx.strokeStyle=col;ctx.lineWidth=4*s;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(px,cy,r1*.62,lead,lead+.9);ctx.stroke();   // weapon glow
    ctx.restore();
    return{rot:k*-.17,sx:1+k*.05,sy:1-k*.06};
  }
  // ---- per-skill signature: every skill kind gets its own shape --------------
  const sk=(game.def.skills&&game.def.skills[a.i])||{};
  const kind=sk.kind||'nova';
  const FAM={cone:'melee',double:'melee',spin:'melee',stun:'shout',taunt:'shout',
    dash:'dash',roll:'dash',fire:'shot',pierce:'shot',burst:'shot',barrage:'shot',
    chain:'chain',meteor:'aoe',nova:'aoe',bomb:'aoe',slow:'slow',
    fury:'buff',haste:'buff',leech:'buff',shield:'shield',guard:'shield'};
  const fam=FAM[kind]||'aoe';
  const tint={shot:'#ffd08a',chain:'#bcd4ff',shield:'#9fd8d0',slow:'#a8c8e8',
    melee:col,dash:'#d6e6c6',shout:'#e8c98f',aoe:col,buff:col}[fam]||col;
  const wind=Math.min(1,u/.42),rel=Math.max(0,u-.42)/.58;
  ctx.save();ctx.globalCompositeOperation='lighter';
  if(rel<=0){
    // ---- wind-up differs too ----
    if(fam==='shield'){
      ctx.globalAlpha=.55*wind;ctx.strokeStyle=tint;ctx.lineWidth=3*s;
      ctx.beginPath();ctx.arc(0,-72*s,(56+12*wind)*s,Math.PI*1.02,Math.PI*1.98);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-72*s,(64+16*wind)*s,Math.PI*1.15,Math.PI*1.85);ctx.stroke();
    }else if(fam==='buff'){
      ctx.globalAlpha=.6*wind;ctx.strokeStyle=tint;ctx.lineWidth=2.5*s;ctx.lineCap='round';
      for(let i=0;i<5;i++){const x=(i-2)*24*s;
        ctx.beginPath();ctx.moveTo(x,-2*s);ctx.lineTo(x*1.15,-(56+46*wind)*s);ctx.stroke();}
    }else if(fam==='shot'){
      ctx.globalAlpha=.6*wind;ctx.fillStyle=tint;
      ctx.beginPath();ctx.arc(10*s,-96*s,(4+7*wind)*s,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.35*wind;ctx.strokeStyle=tint;ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo(10*s,-96*s);ctx.lineTo(-16*s,-84*s);ctx.stroke();
    }else{
      const g=ctx.createRadialGradient(0,-50*s,4*s,0,-50*s,88*s);
      g.addColorStop(0,'#fff6dcbb');g.addColorStop(.45,tint+'99');g.addColorStop(1,'#00000000');
      ctx.fillStyle=g;ctx.globalAlpha=.9*wind;
      ctx.beginPath();ctx.arc(0,-50*s,88*s,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff3cf';ctx.lineWidth=3*s;ctx.globalAlpha=.8*wind;
      ctx.beginPath();ctx.ellipse(0,-4*s,(30+70*wind)*s,(10+24*wind)*s,0,0,Math.PI*2);ctx.stroke();
    }
  }else{
    // ---- release: one shape per family ----
    const a1=(1-rel);
    if(fam==='melee'){
      const spin=kind==='spin'||kind==='double';
      ctx.globalAlpha=.9*a1;ctx.strokeStyle='#fffaf0';ctx.lineWidth=7*s;ctx.lineCap='round';
      ctx.shadowColor=tint;ctx.shadowBlur=20;
      const base=(spin?rel*Math.PI*2:rel*2.4)-2.1,len=spin?2.2:1.5;
      ctx.beginPath();ctx.arc(4*s,-74*s,(72+18*rel)*s,base,base+len);ctx.stroke();
      ctx.shadowBlur=0;ctx.globalAlpha=.5*a1;ctx.strokeStyle=tint;ctx.lineWidth=3*s;
      ctx.beginPath();ctx.arc(4*s,-74*s,(48+10*rel)*s,base+.2,base+len-.2);ctx.stroke();
    }else if(fam==='dash'){
      ctx.globalAlpha=.8*a1;ctx.strokeStyle=tint;ctx.lineWidth=3*s;ctx.lineCap='round';
      for(let i=0;i<4;i++){const y=(-30-i*24)*s;
        ctx.beginPath();ctx.moveTo((-20-i*10)*s,y);ctx.lineTo((-(90+90*rel)-i*22)*s,y);ctx.stroke();}
      ctx.globalAlpha=.5*a1;ctx.strokeStyle='#ffffff';ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo((-10)*s,-96*s);ctx.lineTo((-(120+140*rel))*s,-96*s);ctx.stroke();
    }else if(fam==='shot'){
      const px=14*s,py=-96*s;
      ctx.globalAlpha=.95*(1-rel*.6);ctx.fillStyle='#fff8e0';
      ctx.beginPath();ctx.arc(px,py,(8+16*rel)*s,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.85*a1;ctx.strokeStyle=tint;ctx.lineWidth=3*s;ctx.lineCap='round';
      for(let i=0;i<3;i++){const y=py+(i-1)*9*s;
        ctx.beginPath();ctx.moveTo(px+14*s,y);ctx.lineTo(px+(70+210*rel)*s,y+((i-1)*16)*rel);ctx.stroke();}
      ctx.globalAlpha=.6*a1;ctx.strokeStyle='#ffffff';ctx.lineWidth=2*s;
      ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+(120+260*rel)*s,py);ctx.stroke();
    }else if(fam==='chain'){
      ctx.globalAlpha=.9*a1;ctx.strokeStyle=tint;ctx.lineWidth=3*s;ctx.lineJoin='round';
      ctx.shadowColor=tint;ctx.shadowBlur=14;
      for(let i=0;i<5;i++){
        const ang=-Math.PI/2+(i-2)*.42+rel*.5,r=52*s;
        ctx.beginPath();ctx.moveTo(0,-80*s);
        let x=0,y=-80*s;
        for(let seg=1;seg<=4;seg++){const f=seg/4;
          x=Math.cos(ang)*r*4*f+Math.sin(seg*7+i)*14*s;
          y=-80*s+Math.sin(ang)*r*4*f+Math.cos(seg*5+i)*14*s;
          ctx.lineTo(x,y);}
        ctx.stroke();}
      ctx.shadowBlur=0;
    }else if(fam==='shield'){
      ctx.globalAlpha=.45*a1;ctx.fillStyle=tint;
      ctx.beginPath();ctx.arc(0,-78*s,74*s,Math.PI,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.95*a1;ctx.strokeStyle='#dff3ee';ctx.lineWidth=4*s;ctx.shadowColor=tint;ctx.shadowBlur=16;
      ctx.beginPath();ctx.arc(0,-78*s,(74+8*rel)*s,Math.PI,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
    }else if(fam==='shout'){
      for(let i=0;i<3;i++){
        const rr=(40+150*Math.max(0,rel-i*.18))*s;
        ctx.globalAlpha=.8*a1*(1-i*.22);ctx.strokeStyle=tint;ctx.lineWidth=(5-i)*s;
        ctx.beginPath();ctx.ellipse(0,-70*s,rr,rr*.42,0,0,Math.PI*2);ctx.stroke();}
    }else if(fam==='slow'){
      ctx.globalAlpha=.9*a1;ctx.strokeStyle='#fff6dc';ctx.lineWidth=6*s;ctx.shadowColor=tint;ctx.shadowBlur=18;
      ctx.beginPath();ctx.ellipse(0,-6*s,(40+170*rel)*s,(15+70*rel)*s,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
      ctx.globalAlpha=.75*a1;ctx.strokeStyle=tint;ctx.lineWidth=2.5*s;ctx.lineCap='round';
      for(let i=0;i<8;i++){const ang=i/8*Math.PI*2;
        ctx.beginPath();ctx.moveTo(Math.cos(ang)*40*s,-6*s+Math.sin(ang)*14*s);
        ctx.lineTo(Math.cos(ang)*(78+120*rel)*s,-6*s+Math.sin(ang)*(26+50*rel)*s);ctx.stroke();}
    }else if(fam==='buff'){
      ctx.globalAlpha=.85*a1;ctx.strokeStyle=tint;ctx.lineWidth=3*s;ctx.lineCap='round';
      for(let i=0;i<6;i++){const x=(i-2.5)*20*s;
        ctx.beginPath();ctx.moveTo(x,-6*s);ctx.lineTo(x*1.1,-(80+120*rel)*s);ctx.stroke();}
      ctx.globalAlpha=.6*a1;ctx.strokeStyle='#fff6dc';ctx.lineWidth=3*s;
      ctx.beginPath();ctx.ellipse(0,-70*s,(46+12*rel)*s,(58+12*rel)*s,0,0,Math.PI*2);ctx.stroke();
    }else{
      ctx.globalAlpha=.9*a1;ctx.strokeStyle='#fff6dc';ctx.lineWidth=6*s;ctx.shadowColor=tint;ctx.shadowBlur=20;
      ctx.beginPath();ctx.ellipse(0,-6*s,(40+190*rel)*s,(15+80*rel)*s,0,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
      const g2=ctx.createLinearGradient(0,-215*s,0,10*s);
      g2.addColorStop(0,'#00000000');g2.addColorStop(.55,tint+'cc');g2.addColorStop(1,'#fff6dc00');
      ctx.globalAlpha=.7*a1;ctx.fillStyle=g2;
      ctx.beginPath();ctx.moveTo(-24*s,10*s);ctx.lineTo(-6*s,-215*s);ctx.lineTo(6*s,-215*s);ctx.lineTo(24*s,10*s);ctx.closePath();ctx.fill();
      ctx.globalAlpha=.75*a1;ctx.strokeStyle='#fff6dc';ctx.lineWidth=2.5*s;ctx.lineCap='round';
      for(let i=0;i<7;i++){const ang=-Math.PI/2+(i-3)*.33;
        ctx.beginPath();ctx.moveTo(Math.cos(ang)*46*s,-12*s+Math.sin(ang)*46*s);
        ctx.lineTo(Math.cos(ang)*(80+130*rel)*s,-12*s+Math.sin(ang)*(80+130*rel)*s);ctx.stroke();}
    }
  }
  ctx.restore();
  // each family settles into its own posture
  const POSE={melee:[0,1.08,.95],dash:[-.06,1.14,.9],shot:[.04,.96,1.03],chain:[.03,1.04,.98],
    shield:[0,1.02,1.05],shout:[0,1.09,.96],slow:[0,1.0,1.02],buff:[0,.97,1.12],aoe:[0,1.06,1.14]}[fam]||[0,1,1];
  return{rot:POSE[0]*(rel>0?1:0),sx:1+(POSE[1]-1)*wind-((POSE[1]-1))*.6*rel,sy:1+(POSE[2]-1)*wind-((POSE[2]-1))*.6*rel};
 }
 actor(game,time){const c=this.ctx,h=game.hero,def=game.def,s=this.scale,p=this.project(h.x,h.y);this.shadow(h.x,h.y,34,.6);if(game.isMoving){const ph=(time*2.6)%1;c.save();c.globalAlpha=.2*(1-ph);c.fillStyle='#cfc9ad';c.beginPath();c.ellipse(p.x-9*s,p.y+3*s,(6+11*ph)*s,(2.4+4*ph)*s,0,0,Math.PI*2);c.fill();const p2=(ph+.5)%1;c.globalAlpha=.16*(1-p2);c.beginPath();c.ellipse(p.x+11*s,p.y+4*s,(5+9*p2)*s,(2+3.4*p2)*s,0,0,Math.PI*2);c.fill();c.restore();}if(game.shield>0){c.strokeStyle='#b7d7d088';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y-50*s,42*s,75*s,0,0,Math.PI*2);c.stroke();}const bob=game.isMoving?Math.sin(time*11)*2:Math.sin(time*2)*.7;c.save();c.translate(p.x,p.y+bob*s);const fc=game.facing||{x:0,y:0};if(game.isMoving&&fc.x<-.25)c.scale(-1,1);const pose=this.animPose(game,time,s);if(game.isMoving&&fc.x)c.rotate(fc.x*.055);if(pose.rot){c.translate(0,-70*s);c.rotate(pose.rot);c.translate(0,70*s);}if(pose.sx!==1||pose.sy!==1)c.scale(pose.sx,pose.sy);const size=175*s;const shown=atlas(c,this.assets.scenery,def.id,4,4,0,12*s,size,size);const an2=this._anim;if(shown&&an2){const au=Math.min(1,an2.t/an2.dur);const fl=an2.kind==='attack'?Math.sin(au*Math.PI):(au>.42?(1-(au-.42)/.58):au/.42*.45);if(fl>.02){c.save();c.globalCompositeOperation='lighter';if(an2.kind==='attack'){c.save();c.rotate(-.3*fl);c.globalAlpha=.2*fl;atlas(c,this.assets.scenery,def.id,4,4,0,12*s,size,size);c.restore();c.save();c.rotate(-.15*fl);c.globalAlpha=.3*fl;atlas(c,this.assets.scenery,def.id,4,4,0,12*s,size,size);c.restore();c.globalAlpha=.45*fl;atlas(c,this.assets.scenery,def.id,4,4,0,12*s,size,size);}else{c.globalAlpha=.5*fl;atlas(c,this.assets.scenery,def.id,4,4,0,12*s,size,size);}c.restore();}}if(!shown){c.fillStyle='#1f2c28';c.beginPath();c.moveTo(-18*s,-90*s);c.lineTo(18*s,-90*s);c.lineTo(25*s,-20*s);c.lineTo(-25*s,-20*s);c.closePath();c.fill();c.strokeStyle='#9d9c87';c.lineWidth=7*s;c.beginPath();c.moveTo(-10*s,-25*s);c.lineTo(-15*s,0);c.moveTo(10*s,-25*s);c.lineTo(17*s,0);c.stroke();c.strokeStyle='#cac9ba';c.lineWidth=3*s;c.beginPath();c.moveTo(25*s,-50*s);c.lineTo(50*s,-105*s);c.stroke();}
 const img=this.assets[def.photo];if(img){c.save();c.beginPath();c.ellipse(0,-126*s,12*s,16*s,0,0,Math.PI*2);c.clip();const [x,y,w,h]=def.crop;c.drawImage(img,x,y,w,h,-13*s,-143*s,26*s,34*s);c.restore();}c.restore();c.font=`${Math.max(10,12*s)}px serif`;c.textAlign='center';c.fillStyle='#e4dbb9';c.shadowColor='#000';c.shadowBlur=4;c.fillText(`${def.name} · Lv.${h.level}`,p.x,p.y-158*s);c.shadowBlur=0;
 if(game.buffs.fury>0||game.buffs.leech>0||game.buffs.haste>0){c.strokeStyle=def.color+'88';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,45*s,18*s,time*2,0,Math.PI*1.65);c.stroke();}}
 beast(e,game,time){const c=this.ctx,s=this.scale,p=this.project(e.x,e.y);if(!this.visible(p,210))return;const size=(e.world?360:e.boss?285:e.elite?170:130)*s;this.shadow(e.x,e.y,e.boss?75:35,.48);if(game.target===e){c.strokeStyle=e.boss?'#b35f46':'#baa773';c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,40*s*(e.boss?2:1),16*s*(e.boss?2:1),0,0,Math.PI*2);c.stroke();}const bounce=Math.sin(time*(e.boss?2:4)+e.homeX)*1.5*s;c.save();if(e.flash>0)c.filter='brightness(1.7)';atlas(c,this.assets.beasts,e.type,6,4,p.x,p.y+size*.09+bounce,size,size);c.restore();if(e.elite&&!e.boss){c.strokeStyle='#c7b16477';c.lineWidth=1;c.beginPath();c.ellipse(p.x,p.y-25*s,45*s,14*s,0,0,Math.PI*2);c.stroke();}if(e.boss||e.hp<e.maxHp||dist(e,game.hero)<220){const w=(e.boss?125:62)*s,yy=p.y-size*.83;c.fillStyle='#09120ee6';c.fillRect(p.x-w/2,yy,w,4);c.fillStyle=e.boss?'#b58755':e.elite?'#a28c5b':'#827c59';c.fillRect(p.x-w/2,yy,w*e.hp/e.maxHp,4);c.font=`${Math.max(9,11*s)}px serif`;c.textAlign='center';c.fillStyle=e.boss?'#e1c38a':'#d0d0b8';c.shadowColor='#000';c.shadowBlur=4;c.fillText(e.boss?(e.name||ZONES[e.zone].bossName):`${e.elite?'精英·':''}${['青丘灵狐','山狰','狌狌','鹿蜀','泽蛇','蛊雕','毕方','炎獒','北冥狼','雪犀','雷夔','雷鹰','金角兽','青羽玄鸟','影兽','玄鳞蛇'][e.type]} Lv.${e.level}`,p.x,yy-7);c.shadowBlur=0;}}
 effect(e,game,time){const c=this.ctx,s=this.scale,p=this.project(e.x,e.y),a=clamp(e.ttl/(e.max||1),0,1),r=e.r*s;c.save();c.translate(p.x,p.y);c.scale(1,.5);if(e.kind==='warning'){c.fillStyle=e.player?'#c6b17c28':'#af3f342f';c.strokeStyle=e.player?'#e7d8a5':'#e29a76';c.lineWidth=2;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.stroke();c.globalAlpha=.5;c.beginPath();c.arc(0,0,r*(1-a),0,Math.PI*2);c.stroke();c.rotate(time);for(let i=0;i<6;i++){c.rotate(Math.PI/3);c.fillRect(r*.75,-1,r*.13,2);}c.restore();return;}
 c.globalAlpha=a;const color=e.color||'#d4c291';if(['slash','spin'].includes(e.kind)){c.rotate(time*7);c.strokeStyle=color;c.lineWidth=(e.kind==='spin'?8:12)*s*a;c.shadowBlur=14;c.shadowColor=color;for(let i=0;i<(e.kind==='spin'?3:1);i++){c.beginPath();c.arc(0,0,r*(1.1-a*.45),i*2,i*2+Math.PI*1.35);c.stroke();}}else{const gradient=c.createRadialGradient(0,0,0,0,0,Math.max(1,r));gradient.addColorStop(0,e.kind==='frost'?'#bcdbe280':'#e6bf7a90');gradient.addColorStop(.5,color+'55');gradient.addColorStop(1,color+'00');c.fillStyle=gradient;c.beginPath();c.arc(0,0,r*(1.3-a*.4),0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(0,0,r*(1.3-a*.7),0,Math.PI*2);c.stroke();}c.restore();
 if(e.kind==='lightning'){c.save();c.strokeStyle='#d0e2ff';c.shadowBlur=20;c.shadowColor='#b9d9ff';c.lineWidth=3*s;c.beginPath();c.moveTo(p.x-20*s,p.y-230*s);c.lineTo(p.x+20*s,p.y-150*s);c.lineTo(p.x-10*s,p.y-110*s);c.lineTo(p.x,p.y);c.stroke();c.restore();}if(e.kind==='meteor'){c.save();c.fillStyle='#ffc17a';c.shadowColor='#ff9f3d';c.shadowBlur=20;c.beginPath();c.arc(p.x,p.y-15,18*s*a,0,Math.PI*2);c.fill();c.restore();}}
 draw(game,time){this.resize();const c=this.ctx;this.camX=game.hero.x-game.hero.y;this.camY=game.hero.x+game.hero.y;c.fillStyle='#0c1919';c.fillRect(0,0,this.w,this.h);this.ground(game);
 for(const e of game.effects)if(e.kind==='warning'||e.kind==='guard')this.effect(e,game,time);
 const objects=[],bx=Math.floor(game.hero.x/240),by=Math.floor(game.hero.y/240);for(let x=bx-8;x<=bx+8;x++)for(let y=by-8;y<=by+8;y++){const wx=x*240+hash(x,y)*100,wy=y*240+hash(y+8,x)*100;if(wx<100||wy<100||wx>WORLD.w-100||wy>WORLD.h-100)continue;const z=zoneAt(wx,wy),lx=wx-z.x,ly=wy-z.y;if(Math.abs(ly-2050)<190||Math.abs(lx-750)<150||Math.hypot(lx-3150,ly-2050)<350)continue;const r=hash(x+9,y+7);if(r<.48)continue;const idx=r>.84?(z.id===3||z.id===7?6:5):r>.65?(z.id===4?8:7):14;objects.push({x:wx,y:wy,type:'scenery',index:idx,size:idx===5?360:idx===6?290:idx===14?115:170});}
 for(const z of ZONES){if(dist(game.hero,{x:z.camp[0],y:z.camp[1]})<1600){objects.push({x:z.camp[0]-120,y:z.camp[1]-90,type:'scenery',index:11,size:240});objects.push({x:z.camp[0]+90,y:z.camp[1]-30,type:'scenery',index:10,size:145});}if(dist(game.hero,{x:z.boss[0],y:z.boss[1]})<1600){objects.push({x:z.boss[0]-160,y:z.boss[1]-150,type:'scenery',index:9,size:330});objects.push({x:z.boss[0]+110,y:z.boss[1]+100,type:'scenery',index:12,size:130});}}
 for(const chest of game.chests())if(!game.save.chests.includes(chest.id))objects.push({...chest,type:'scenery',index:13,size:90});for(const e of game.enemies)if(e.alive&&dist(e,game.hero)<1800)objects.push({...e,type:'beast',entity:e});objects.push({x:game.hero.x,y:game.hero.y,type:'hero'});objects.sort((a,b)=>(a.x+a.y)-(b.x+b.y));for(const o of objects){if(o.type==='hero')this.actor(game,time);else if(o.type==='beast')this.beast(o.entity,game,time);else this.scenery(o.index,o.x,o.y,o.size,game);}
 for(const l of game.loot){const p=this.project(l.x,l.y);if(!this.visible(p))continue;c.save();c.strokeStyle=QCOLORS[l.item.quality];c.shadowColor=c.strokeStyle;c.shadowBlur=12;c.lineWidth=2;c.globalAlpha=.7+.3*Math.sin(time*3);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-45*this.scale);c.stroke();c.fillStyle=c.strokeStyle;c.fillRect(p.x-3,p.y-5,6,5);c.restore();}
 for(const e of game.effects)if(e.kind!=='warning'&&e.kind!=='guard')this.effect(e,game,time);
 for(const p of game.projectiles){if(p.delay>0)continue;const point=this.project(p.x,p.y,30);c.save();const color=p.enemy?'#9bb88b':p.kind==='fire'?'#efb66c':'#e6dfb5';c.strokeStyle=c.fillStyle=c.shadowColor=color;c.shadowBlur=10;c.lineWidth=p.kind==='fire'?6:3;c.beginPath();c.moveTo(point.x,point.y);c.lineTo(point.x-(p.dx-p.dy)*14*this.scale,point.y-(p.dx+p.dy)*7*this.scale);c.stroke();c.restore();}
 for(const f of game.floaters){const p=this.project(f.x,f.y,f.z);c.save();c.globalAlpha=Math.min(1,f.ttl*2);c.textAlign='center';c.font=`${f.crit?'bold ':''}${Math.max(12,(f.crit?23:17)*this.scale)}px Georgia`;c.fillStyle=f.color;c.strokeStyle='#14221adb';c.lineWidth=3;c.strokeText(f.text,p.x,p.y);c.fillText(f.text,p.x,p.y);c.restore();}
 const light=c.createRadialGradient(this.w*.5,this.h*.35,20,this.w*.5,this.h*.5,Math.max(this.w,this.h)*.8);light.addColorStop(0,'#b4c7a20a');light.addColorStop(.6,'#05151b18');light.addColorStop(1,'#020a1be6');c.fillStyle=light;c.fillRect(0,0,this.w,this.h);if(game.zone.id===4){c.fillStyle='#d6e1dc66';for(let i=0;i<35;i++){const x=(hash(i,2)*this.w+time*9)%this.w,y=(hash(i,7)*this.h+time*16)%this.h;c.fillRect(x,y,1,2);}}if(game.zone.id===3){c.fillStyle='#cb9c5c88';for(let i=0;i<22;i++){const x=(hash(i,9)*this.w+time*4)%this.w,y=(hash(i,1)*this.h-time*12+this.h*100)%this.h;c.fillRect(x,y,1,2);}}
 }
}
