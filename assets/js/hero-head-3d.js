/* hero-head-3d.js — true-3D particle head from a baked point file (pos,color,normal).
   Turns and dissolves on scroll. mono+glow gives the white/steel look on dark. */
(function(root){
"use strict";
root.HeroHead3D={init:init};
function init(opt){
  opt=opt||{}; var canvas=document.querySelector(opt.canvas||"#heroHead"); if(!canvas) return;
  if(!root.THREE){return;}
  try{var t=document.createElement("canvas"); if(!(t.getContext("webgl")||t.getContext("experimental-webgl")))throw 0;}catch(e){return;}
  var reduce=root.matchMedia&&root.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile=root.innerWidth<760;
  var cfg={turn:opt.turn!=null?opt.turn:1.3, pointSize:(opt.pointSize||1.5)*(mobile?1.15:1),
    fadeWith:opt.fadeWith||null, reduce:reduce, stride:(opt.density||1)*(mobile?2:1),
    glow:opt.glow!==false, mono:opt.mono!==false, tex:opt.tex||null};
  function go(f){ try{ run(canvas,cfg,f);}catch(e){ if(root.console)console.error("[hero-head-3d]",e);} }
  if(cfg.tex){ cfg._tex=new root.THREE.TextureLoader().load(cfg.tex); }
  if(opt.embedded){ go(opt.embedded); }
  else { fetch(opt.data||"assets/data/head-points.bin").then(function(r){return r.arrayBuffer();})
         .then(function(b){ go(new Float32Array(b)); }).catch(function(e){ if(root.console)console.error(e); }); }
}
function run(canvas,cfg,f32){
  var T=root.THREE;
  function box(){return [canvas.clientWidth||root.innerWidth, canvas.clientHeight||root.innerHeight];}
  var wh=box(),W=wh[0],H=wh[1];
  var total=f32.length/9, pos=[],col=[],nor=[],scat=[],rnd=[];
  for(var i=0;i<total;i+=cfg.stride){ var o=i*9;
    pos.push(f32[o],f32[o+1],f32[o+2]); col.push(f32[o+3],f32[o+4],f32[o+5]); nor.push(f32[o+6],f32[o+7],f32[o+8]);
    var a=Math.random()*6.2831, ph=Math.acos(2*Math.random()-1), R=1.5+Math.random()*1.7;
    scat.push(Math.sin(ph)*Math.cos(a)*R,Math.sin(ph)*Math.sin(a)*R,Math.cos(ph)*R);
    rnd.push(Math.random(),Math.random());
  }
  var geom=new T.BufferGeometry();
  geom.setAttribute("position",new T.Float32BufferAttribute(pos,3));
  geom.setAttribute("aColor",new T.Float32BufferAttribute(col,3));
  geom.setAttribute("aNormal",new T.Float32BufferAttribute(nor,3));
  geom.setAttribute("aScatter",new T.Float32BufferAttribute(scat,3));
  geom.setAttribute("aRnd",new T.Float32BufferAttribute(rnd,2));
  var scene=new T.Scene();
  var camera=new T.PerspectiveCamera(42,W/H,0.01,100); camera.position.set(0,0,2.7);
  var renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,2)); renderer.setSize(W,H,false); renderer.setClearColor(0x000000,0);
  var uni={uTime:{value:0},uProg:{value:0},uYaw:{value:0},uSize:{value:cfg.pointSize},uFade:{value:1},uMono:{value:cfg.mono?1:0},uPix:{value:renderer.getPixelRatio()},uTex:{value:cfg._tex||null},uHasTex:{value:cfg._tex?1:0}};
  var mat=new T.ShaderMaterial({uniforms:uni,transparent:true,depthTest:!cfg.glow,depthWrite:!cfg.glow,
    blending:cfg.glow?T.AdditiveBlending:T.NormalBlending,
    vertexShader:[
      "attribute vec3 aScatter; attribute vec3 aColor; attribute vec3 aNormal; attribute vec2 aRnd;",
      "uniform float uTime,uProg,uYaw,uSize,uPix;",
      "varying vec3 vColor; varying float vSh;",
      "mat3 rotY(float a){float s=sin(a),c=cos(a);return mat3(c,0.,-s, 0.,1.,0., s,0.,c);}",
      "void main(){ mat3 R=rotY(uYaw); vec3 hp=R*position; vec3 hn=R*aNormal;",
      " vColor=aColor; vSh=clamp(0.5+0.6*hn.z,0.25,1.2);",
      " float e=uProg*uProg*(3.0-2.0*uProg);",
      " vec3 p=mix(hp,aScatter,e);",
      " float sw=e*6.2831*aRnd.x+uTime*0.2*e; float s=sin(sw),c=cos(sw); p.xy=mat2(c,-s,s,c)*p.xy;",
      " p+=sin(uTime*0.6+aRnd.x*6.28)*0.05*e;",
      " float show=max(step(-0.05,hn.z), e);",
      " vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;",
      " gl_PointSize=uSize*uPix*(7.0/-mv.z)*show; }"
    ].join("\n"),
    fragmentShader:[
      "uniform float uFade,uMono,uHasTex; uniform sampler2D uTex; varying vec3 vColor; varying float vSh;",
      "void main(){ vec2 d=gl_PointCoord-vec2(0.5); float r=dot(d,d);",
      " float soft=smoothstep(0.25,0.02,r);",
      " float spr=texture2D(uTex, gl_PointCoord).r;",
      " float mask=mix(soft, spr, uHasTex); if(mask<0.02) discard;",
      " float a=mask*uFade;",
      " vec3 mono=mix(vec3(0.95,0.97,1.0), vec3(0.5,0.72,1.0), 0.4)*vSh;",
      " vec3 col=mix(vColor*vSh, mono, uMono);",
      " gl_FragColor=vec4(col, a); }"
    ].join("\n")});
  var points=new T.Points(geom,mat); scene.add(points);
  var prog=0,mx=0,mlx=0;
  var fadeEl=cfg.fadeWith?document.querySelector(cfg.fadeWith):null;
  function onScroll(){var span=fadeEl?fadeEl.offsetHeight:root.innerHeight; prog=Math.min(1,Math.max(0,(root.scrollY||root.pageYOffset||0)/Math.max(1,span)));}
  function onResize(){var w=box();W=w[0];H=w[1];camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H,false);}
  root.addEventListener("scroll",onScroll,{passive:true}); root.addEventListener("resize",onResize);
  if(!cfg.reduce) root.addEventListener("mousemove",function(e){mx=e.clientX/root.innerWidth-0.5;});
  onScroll();
  var t0=root.performance.now();
  (function loop(){ root.requestAnimationFrame(loop);
    var t=(root.performance.now()-t0)/1000; uni.uTime.value=t;
    var dissolve=Math.max(0,(prog-0.5)/0.5); uni.uProg.value+=(dissolve-uni.uProg.value)*0.07;
    uni.uFade.value=1-Math.min(1,Math.max(0,(prog-0.62)/0.38));
    mlx+=(mx-mlx)*0.05;
    uni.uYaw.value=(cfg.reduce?0:Math.sin(t*0.35)*0.12)+prog*cfg.turn+mlx*0.5;
    if(uni.uFade.value>0.001) renderer.render(scene,camera);
  })();
}
})(window);
