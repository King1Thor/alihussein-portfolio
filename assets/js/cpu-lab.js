/* ============================================================================
   cpu-lab.js — ARMv8 CPU Lab (3D).  Mounts into #cpuSim.
   • Real 3D datapath (Three.js): components as 3D blocks wired with 3D buses,
     orbit camera, instruction flow animated along the active path.
   • Click a block to FLY INTO it (same canvas, no modal) and reveal its
     internals as 3D objects: ALU -> full adder -> gate -> CMOS transistors,
     plus register file / control / data memory+cache / sign-extend.
   • Second tab: live C / Assembly / Binary editor (two-way, cross-highlight,
     big/little-endian).  Falls back gracefully if WebGL is unavailable.
   ============================================================================ */
(function () {
  "use strict";
  var mount = document.getElementById("cpuSim");
  if (!mount) return;
  var LH = 22;
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

  /* ------------------------------- styles -------------------------------- */
  var st = document.createElement("style");
  st.textContent = [
    "#cpuSim{--on:var(--steel-2,#7fe3ff);--acc:var(--maroon-2,#b51d35);--good:var(--good,#43e08a);--mono:var(--font-mono,monospace);}",
    "#cpuSim .lab-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}",
    "#cpuSim .lab-tab{cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink-soft);border-radius:10px;padding:7px 14px;font:700 .74rem var(--mono);letter-spacing:.05em;}",
    "#cpuSim .lab-tab.on{background:var(--acc);border-color:var(--acc);color:#fff;}",
    "#cpuSim .lab-pane{display:none;} #cpuSim .lab-pane.on{display:block;}",
    "#cpuSim .toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:12px;}",
    "#cpuSim label.f{display:flex;flex-direction:column;gap:4px;font:700 .68rem var(--mono);letter-spacing:.1em;color:var(--ink-soft);text-transform:uppercase;}",
    "#cpuSim select,#cpuSim input.num{background:var(--panel-2,#0c101a);color:var(--ink);border:1px solid var(--line-2);border-radius:9px;padding:7px 9px;font:500 .85rem var(--mono);}",
    "#cpuSim input.num{width:62px;}",
    "#cpuSim .btns{display:flex;gap:8px;margin-left:auto;}",
    "#cpuSim .stage{font:700 .76rem var(--mono);color:var(--on);letter-spacing:.04em;min-height:1.1em;margin:6px 0 8px;}",
    "#cpuSim .scene3d{position:relative;width:100%;height:540px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:radial-gradient(120% 120% at 60% -10%,rgba(181,29,53,.12),transparent 55%),#05070d;}",
    "@media(max-width:700px){#cpuSim .scene3d{height:420px;}}",
    "#cpuSim .scene3d canvas{display:block;width:100%!important;height:100%!important;touch-action:none;}",
    "#cpuSim .ovl{position:absolute;left:12px;top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:3;}",
    "#cpuSim .crumb{display:flex;gap:6px;align-items:center;background:rgba(8,11,20,.74);border:1px solid var(--line-2);border-radius:10px;padding:6px 10px;font:700 .72rem var(--mono);}",
    "#cpuSim .crumb a{color:var(--on);cursor:pointer;} #cpuSim .crumb b{color:var(--ink);} #cpuSim .crumb span{color:var(--ink-dim);}",
    "#cpuSim .ovl-r{position:absolute;right:12px;top:12px;z-index:3;display:flex;gap:8px;}",
    "#cpuSim .miniBtn{cursor:pointer;background:rgba(8,11,20,.74);border:1px solid var(--line-2);color:var(--ink-soft);border-radius:9px;padding:6px 11px;font:700 .7rem var(--mono);}",
    "#cpuSim .hint{position:absolute;left:12px;bottom:10px;z-index:3;color:var(--ink-dim);font:600 .68rem var(--mono);background:rgba(8,11,20,.6);padding:4px 9px;border-radius:8px;}",
    "#cpuSim .fallback{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:var(--ink-soft);font:600 .85rem var(--mono);padding:24px;}",
    "#cpuSim .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;} @media(max-width:760px){#cpuSim .grid2{grid-template-columns:1fr;}}",
    "#cpuSim .card{border:1px solid var(--line);border-radius:13px;padding:13px 14px;background:var(--panel,rgba(18,23,36,.5));}",
    "#cpuSim .card h4{margin:0 0 9px;font:800 .68rem var(--mono);letter-spacing:.13em;color:var(--ink-soft);text-transform:uppercase;}",
    "#cpuSim table.ctrl{width:100%;border-collapse:collapse;font:700 .72rem var(--mono);} #cpuSim table.ctrl td{padding:3px 4px;color:var(--ink-soft);} #cpuSim table.ctrl td.v{text-align:right;color:var(--ink-dim);} #cpuSim table.ctrl tr.hi td{color:var(--on);}",
    "#cpuSim .state{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;font:700 .7rem var(--mono);}",
    "#cpuSim .reg{border:1px solid var(--line);border-radius:7px;padding:5px;color:var(--ink-soft);} #cpuSim .reg b{color:var(--ink);} #cpuSim .reg.chg{border-color:var(--good);color:var(--good);} #cpuSim .reg.chg b{color:var(--good);}",
    "#cpuSim .ed3{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:12px;} @media(max-width:960px){#cpuSim .ed3{grid-template-columns:1fr;}}",
    "#cpuSim .epanel{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel-2,#0c101a);}",
    "#cpuSim .ehead{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;border-bottom:1px solid var(--line);font:800 .72rem var(--mono);letter-spacing:.08em;}",
    "#cpuSim .ehead .tagc{color:var(--good);} #cpuSim .ehead .taga{color:#7fa7ff;} #cpuSim .ehead .tagb{color:var(--acc);}",
    "#cpuSim .ebody{position:relative;height:228px;overflow:auto;}",
    "#cpuSim textarea.code{position:absolute;inset:0;width:100%;height:100%;border:0;resize:none;background:transparent;color:var(--ink);font:500 13px/" + LH + "px var(--mono);padding:6px 10px;outline:none;white-space:pre;overflow:auto;}",
    "#cpuSim .hlbar{position:absolute;left:0;right:0;height:" + LH + "px;background:rgba(127,227,255,.13);border-left:3px solid var(--on);display:none;pointer-events:none;}",
    "#cpuSim .rows{font:500 13px/" + LH + "px var(--mono);padding:6px 0;}",
    "#cpuSim .rows .r{padding:0 10px;white-space:pre;color:var(--ink-soft);} #cpuSim .rows .r .ln{color:var(--ink-dim);display:inline-block;width:1.4em;}",
    "#cpuSim .rows .r.hl{background:rgba(127,227,255,.13);border-left:3px solid var(--on);padding-left:7px;color:var(--ink);} #cpuSim .rows .r.err{color:var(--acc);}",
    "#cpuSim .rows.bin .r{font-size:12px;} #cpuSim .rows.bin .byte{padding:1px 3px;border-radius:3px;background:rgba(127,227,255,.10);}",
    "#cpuSim .opbar{display:flex;gap:8px;align-items:center;font:600 .7rem var(--mono);color:var(--ink-soft);margin-bottom:10px;flex-wrap:wrap;}",
    "#cpuSim .chip{cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink-soft);border-radius:999px;padding:6px 12px;font:700 .7rem var(--mono);} #cpuSim .chip.on{background:var(--acc);border-color:var(--acc);color:#fff;}"
  ].join("\n");
  mount.appendChild(st);

  /* ===================== ISA model (matches SC_Control) ================== */
  function bin(v,n){v=((v%Math.pow(2,n))+Math.pow(2,n))%Math.pow(2,n);var s=v.toString(2);while(s.length<n)s="0"+s;return s;}
  var ISA={
    ADD:{fmt:"R",op:"10001011000",k:"R-type",alu:"ADD",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]+s.reg[o.Rm]};}},
    SUB:{fmt:"R",op:"11001011000",k:"R-type",alu:"SUB",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]-s.reg[o.Rm]};}},
    AND:{fmt:"R",op:"10001010000",k:"R-type",alu:"AND",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" & X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]&s.reg[o.Rm]};}},
    ORR:{fmt:"R",op:"10101010000",k:"R-type",alu:"ORR",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" | X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]|s.reg[o.Rm]};}},
    ADDI:{fmt:"I",op:"1001000100",k:"I-type",alu:"ADD",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + "+o.imm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]+o.imm};}},
    SUBI:{fmt:"I",op:"1101000100",k:"I-type",alu:"SUB",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - "+o.imm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]-o.imm};}},
    LDUR:{fmt:"D",op:"11111000010",k:"Load",alu:"ADD",c:function(o){return "X"+o.Rt+" = mem[X"+o.Rn+" + "+o.addr+"];";},ex:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {reg:o.Rt,val:s.mem[i]};}},
    STUR:{fmt:"D",op:"11111000000",k:"Store",alu:"ADD",c:function(o){return "mem[X"+o.Rn+" + "+o.addr+"] = X"+o.Rt+";";},ex:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {mem:i,val:s.reg[o.Rt]};}},
    CBZ:{fmt:"CB",op:"10110100",k:"Branch",alu:"PASSB",c:function(o){return "if (X"+o.Rt+" == 0) goto "+o.addr+";";},ex:function(s,o){return {branch:s.reg[o.Rt]===0};}},
    B:{fmt:"B",op:"000101",k:"Branch",alu:"ADD",c:function(o){return "goto "+o.addr+";";},ex:function(s,o){return {branch:true};}},
    MOVZ:{fmt:"IM",op:"110100101",k:"Move",alu:"PASSB",c:function(o){return "X"+o.Rd+" = "+o.imm+(o.hw?(" << "+(o.hw*16)):"")+";";},ex:function(s,o){return {reg:o.Rd,val:o.imm*Math.pow(2,o.hw*16)};}}
  };
  function defaults(mn){var f=ISA[mn].fmt;if(f==="R")return{Rd:1,Rn:2,Rm:3};if(f==="I")return{Rd:1,Rn:2,imm:5};if(f==="D")return{Rt:1,Rn:31,addr:16};if(f==="CB")return{Rt:9,addr:2};if(f==="B")return{addr:4};if(f==="IM")return{Rd:9,imm:4660,hw:0};return{};}
  function asmText(mn,o){var f=ISA[mn].fmt;if(f==="R")return mn+" X"+o.Rd+", X"+o.Rn+", X"+o.Rm;if(f==="I")return mn+" X"+o.Rd+", X"+o.Rn+", #"+o.imm;if(f==="D")return mn+" X"+o.Rt+", [X"+o.Rn+", #"+o.addr+"]";if(f==="CB")return mn+" X"+o.Rt+", #"+o.addr;if(f==="B")return mn+" #"+o.addr;if(f==="IM")return mn+" X"+o.Rd+", #"+o.imm+", LSL #"+(o.hw*16);return mn;}
  function controlFor(mn){var z={Reg2Loc:0,ALUSrc:0,MemtoReg:0,RegWrite:0,MemRead:0,MemWrite:0,Branch:0,Uncondbranch:0,MovZ:0};function e(b){var o={};for(var k in z)o[k]=z[k];for(var j in b)o[j]=b[j];return o;}var f=ISA[mn].fmt;if(mn==="LDUR")return e({ALUSrc:1,MemtoReg:1,RegWrite:1,MemRead:1});if(mn==="STUR")return e({Reg2Loc:1,ALUSrc:1,MemWrite:1});if(f==="R")return e({RegWrite:1});if(f==="I")return e({ALUSrc:1,RegWrite:1});if(f==="IM")return e({ALUSrc:1,RegWrite:1,MovZ:1});if(f==="CB")return e({Reg2Loc:1,Branch:1});if(f==="B")return e({Uncondbranch:1});return z;}
  function encode(mn,o){var I=ISA[mn],f=I.fmt,F=[];function a(n,b,c){F.push({n:n,b:b,c:c});}
    if(f==="R"){a("opcode",I.op,"#b51d35");a("Rm",bin(o.Rm,5),"#2f7bd6");a("shamt","000000","#6f7891");a("Rn",bin(o.Rn,5),"#2f7bd6");a("Rd",bin(o.Rd,5),"#2f7bd6");}
    else if(f==="I"){a("opcode",I.op,"#b51d35");a("ALU_imm",bin(o.imm,12),"#3a9d6b");a("Rn",bin(o.Rn,5),"#2f7bd6");a("Rd",bin(o.Rd,5),"#2f7bd6");}
    else if(f==="D"){a("opcode",I.op,"#b51d35");a("DT_addr",bin(o.addr,9),"#3a9d6b");a("op","00","#6f7891");a("Rn",bin(o.Rn,5),"#2f7bd6");a("Rt",bin(o.Rt,5),"#2f7bd6");}
    else if(f==="CB"){a("opcode",I.op,"#b51d35");a("addr19",bin(o.addr,19),"#3a9d6b");a("Rt",bin(o.Rt,5),"#2f7bd6");}
    else if(f==="B"){a("opcode",I.op,"#b51d35");a("addr26",bin(o.addr,26),"#3a9d6b");}
    else if(f==="IM"){a("opcode",I.op,"#b51d35");a("hw",bin(o.hw,2),"#8a5cc0");a("MOV_imm",bin(o.imm,16),"#3a9d6b");a("Rd",bin(o.Rd,5),"#2f7bd6");}
    return F;}
  function bits32(mn,o){return encode(mn,o).map(function(f){return f.b;}).join("");}
  function parseAsm(line){var s=line.trim();if(!s||s[0]===";"||s[0]==="/")return null;var m=s.match(/^([A-Za-z]+)\s*(.*)$/);if(!m)return{error:"?"};var mn=m[1].toUpperCase();if(!ISA[mn])return{error:"unknown op "+mn};var rest=m[2],f=ISA[mn].fmt;var regs=(rest.match(/X\d+/gi)||[]).map(function(x){return +x.slice(1);});var imms=(rest.match(/#(-?\d+)/g)||[]).map(function(x){return +x.slice(1);});
    if(f==="R")return{mn:mn,ops:{Rd:regs[0],Rn:regs[1],Rm:regs[2]}};if(f==="I")return{mn:mn,ops:{Rd:regs[0],Rn:regs[1],imm:imms[0]}};if(f==="D")return{mn:mn,ops:{Rt:regs[0],Rn:regs[1],addr:imms[0]||0}};if(f==="CB")return{mn:mn,ops:{Rt:regs[0],addr:imms[0]||0}};if(f==="B")return{mn:mn,ops:{addr:imms[0]||0}};if(f==="IM")return{mn:mn,ops:{Rd:regs[0],imm:imms[0],hw:(imms[1]?(imms[1]/16)|0:0)}};return{error:"?"};}
  function compileC(line){var s=line.trim().replace(/;$/,"");if(!s||s[0]==="/")return null;var m;
    if((m=s.match(/^X(\d+)\s*=\s*X(\d+)\s*([+\-&|])\s*X(\d+)$/))){var op={"+":"ADD","-":"SUB","&":"AND","|":"ORR"}[m[3]];return op+" X"+m[1]+", X"+m[2]+", X"+m[4];}
    if((m=s.match(/^X(\d+)\s*=\s*X(\d+)\s*([+\-])\s*(\d+)$/)))return (m[3]==="+"?"ADDI":"SUBI")+" X"+m[1]+", X"+m[2]+", #"+m[4];
    if((m=s.match(/^X(\d+)\s*=\s*mem\[\s*X(\d+)\s*\+\s*(\d+)\s*\]$/)))return "LDUR X"+m[1]+", [X"+m[2]+", #"+m[3]+"]";
    if((m=s.match(/^mem\[\s*X(\d+)\s*\+\s*(\d+)\s*\]\s*=\s*X(\d+)$/)))return "STUR X"+m[3]+", [X"+m[1]+", #"+m[2]+"]";
    if((m=s.match(/^X(\d+)\s*=\s*(\d+)$/)))return "MOVZ X"+m[1]+", #"+m[2]+", LSL #0";
    if((m=s.match(/^if\s*\(\s*X(\d+)\s*==\s*0\s*\)\s*goto\s*(\d+)$/)))return "CBZ X"+m[1]+", #"+m[2];
    if((m=s.match(/^goto\s*(\d+)$/)))return "B #"+m[1];
    return "; (unsupported C)";}
  function activeNodes(mn){var f=ISA[mn].fmt,base=["pc","imem","control","pc4","pcsrc"];
    if(f==="R")return base.concat("regfile","alu","memtoreg");
    if(f==="I"||f==="IM")return base.concat("regfile","signext","alusrc","alu","memtoreg");
    if(mn==="LDUR")return base.concat("regfile","signext","alusrc","alu","dmem","memtoreg");
    if(mn==="STUR")return base.concat("regfile","reg2loc","signext","alusrc","alu","dmem");
    if(f==="CB")return base.concat("regfile","reg2loc","alu","signext","shift2","baddr");
    if(f==="B")return base.concat("signext","shift2","baddr");
    return base;}
  function stages(mn){var f=ISA[mn].fmt;
    if(mn==="LDUR")return ["Fetch","Decode (MemRead, RegWrite)","Read base + sign-extend offset","ALU computes address","Read data memory","Write loaded value to register"];
    if(mn==="STUR")return ["Fetch","Decode (MemWrite, Reg2Loc=1)","Read base + value","ALU computes address","Write value to data memory","(no register write-back)"];
    if(f==="CB")return ["Fetch","Decode (Branch=1)","ALU tests register for zero","Sign-extend & shift offset","Branch adder forms target","Branch taken iff Zero & Branch"];
    if(f==="B")return ["Fetch","Decode (Uncondbranch=1)","Sign-extend & shift offset","Branch adder forms target","PCSrc selects branch target"];
    if(f==="I"||f==="IM")return ["Fetch","Decode + read register","Build/extend operand","ALU operation","Write result to register"];
    return ["Fetch","Decode + read registers","Read operands","ALU operation","Write result to register"];}

  /* ============================== DOM shell ============================== */
  mount.innerHTML +=
    '<div class="lab-tabs">'+
      '<button class="lab-tab on" data-pane="dp" type="button">3D Datapath</button>'+
      '<button class="lab-tab" data-pane="code" type="button">C / Assembly / Binary</button>'+
    '</div>'+
    '<div class="lab-pane on" data-pane="dp">'+
      '<div class="toolbar">'+
        '<label class="f">Instruction<select id="lbInst"></select></label>'+
        '<span id="lbOps"></span>'+
        '<div class="btns">'+
          '<button class="btn btn-ghost" id="lbStep" type="button">Step</button>'+
          '<button class="btn btn-primary" id="lbRun" type="button">Run</button>'+
          '<button class="btn btn-ghost" id="lbReset" type="button">Reset</button>'+
        '</div>'+
      '</div>'+
      '<div class="stage" id="lbStage">Drag to orbit &middot; scroll to zoom &middot; click any block to fly inside.</div>'+
      '<div class="scene3d" id="lbScene">'+
        '<div class="ovl"><div class="crumb" id="lbCrumb"><b>CPU</b></div></div>'+
        '<div class="ovl-r"><button class="miniBtn" id="lbBack" style="display:none" type="button">&larr; Back</button><button class="miniBtn" id="lbHome" type="button">Reset view</button></div>'+
        '<div class="hint">click a component to open it &middot; ALU &rarr; full adder &rarr; gate &rarr; transistors</div>'+
      '</div>'+
      '<div class="grid2">'+
        '<div class="card"><h4>Control signals</h4><table class="ctrl"><tbody id="lbCtrlTbl"></tbody></table></div>'+
        '<div class="card"><h4>Machine state</h4><div class="state" id="lbState"></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="lab-pane" data-pane="code">'+
      '<div class="opbar">'+
        '<span>Write in:</span>'+
        '<button class="chip on" id="lbEditAsm" type="button">Assembly</button>'+
        '<button class="chip" id="lbEditC" type="button">C</button>'+
        '<span style="margin-left:14px">Binary:</span>'+
        '<button class="chip on" id="lbEndBig" type="button">Big-endian</button>'+
        '<button class="chip" id="lbEndLit" type="button">Little-endian</button>'+
        '<span style="margin-left:auto;color:var(--ink-dim)">hover any line to trace it across C &middot; ASM &middot; binary</span>'+
      '</div>'+
      '<div class="ed3">'+
        '<div class="epanel"><div class="ehead"><span class="tagc">C</span><span>high-level</span></div><div class="ebody" id="cBody"><div class="hlbar" id="cHl"></div><textarea class="code" id="cText" spellcheck="false"></textarea><div class="rows" id="cRows" style="display:none"></div></div></div>'+
        '<div class="epanel"><div class="ehead"><span class="taga">ARMv8 ASSEMBLY</span><span>instructions</span></div><div class="ebody" id="aBody"><div class="hlbar" id="aHl"></div><textarea class="code" id="aText" spellcheck="false"></textarea><div class="rows" id="aRows" style="display:none"></div></div></div>'+
        '<div class="epanel"><div class="ehead"><span class="tagb">BINARY</span><span>machine code</span></div><div class="ebody"><div class="rows bin" id="bRows"></div></div></div>'+
      '</div>'+
      '<div class="card" style="margin-top:12px"><h4>Selected line &rarr; datapath</h4><div id="lbPick" style="font:600 .8rem var(--mono);color:var(--ink-soft)">Click a line to load it into the 3D datapath.</div></div>'+
    '</div>';

  var $=function(id){return document.getElementById(id);};
  var sel=$("lbInst");
  Object.keys(ISA).forEach(function(mn){var o=document.createElement("option");o.value=mn;o.textContent=mn+"  ("+ISA[mn].k+")";sel.appendChild(o);});

  function fresh(){var reg=new Array(32).fill(0);var seed={1:0,2:10,3:4,4:7,5:20,6:9,7:5,9:0,10:0,11:0,20:64,21:8};for(var k in seed)reg[+k]=seed[k];reg[31]=0;return{reg:reg,mem:[100,200,300,400,500,600,700,800],changed:null,memChanged:null};}
  var S=fresh();
  var cur={mn:"ADD",ops:defaults("ADD"),schema:null,stageList:[],stage:-1};
  function schemaOf(mn){var f=ISA[mn].fmt;if(f==="R")return[["Rd",1,"reg"],["Rn",2,"reg"],["Rm",3,"reg"]];if(f==="I")return[["Rd",1,"reg"],["Rn",2,"reg"],["imm",5,"num"]];if(f==="D")return[["Rt",1,"reg"],["Rn",31,"reg"],["addr",16,"num"]];if(f==="CB")return[["Rt",9,"reg"],["addr",2,"num"]];if(f==="B")return[["addr",4,"num"]];if(f==="IM")return[["Rd",9,"reg"],["imm",4660,"num"],["hw",0,"sel"]];return[];}
  function buildOps(mn){cur.schema=schemaOf(mn);$("lbOps").innerHTML=cur.schema.map(function(f){if(f[2]==="sel")return '<label class="f">LSL<select id="op_'+f[0]+'"><option value="0">#0</option><option value="1">#16</option><option value="2">#32</option><option value="3">#48</option></select></label>';return '<label class="f">'+(f[2]==="reg"?"X":"")+f[0]+'<input class="num" id="op_'+f[0]+'" type="number" value="'+f[1]+'"></label>';}).join("");cur.schema.forEach(function(f){var e=$("op_"+f[0]);if(e)e.addEventListener("input",refresh);});}
  function readOps(){var o={};cur.schema.forEach(function(f){var e=$("op_"+f[0]);o[f[0]]=e?(+e.value):f[1];});return o;}
  function renderCtrl(c){var order=["Reg2Loc","ALUSrc","MemtoReg","RegWrite","MemRead","MemWrite","Branch","Uncondbranch","MovZ"];$("lbCtrlTbl").innerHTML=order.map(function(k){return '<tr class="'+(c[k]===1?"hi":"")+'"><td>'+k+'</td><td class="v">'+c[k]+'</td></tr>';}).join("")+'<tr class="hi"><td>ALUOp</td><td class="v">'+ISA[cur.mn].alu+'</td></tr>';}
  function renderState(){var show=[0,1,2,3,9,10,11,20,21,31];$("lbState").innerHTML=show.map(function(i){return '<div class="reg'+(S.changed===i?" chg":"")+'">X'+i+' <b>'+S.reg[i]+'</b></div>';}).join("")+'<div class="reg" style="grid-column:1/3">mem[0..7]</div><div class="reg'+(S.memChanged!=null?" chg":"")+'" style="grid-column:3/5">['+S.mem.join(", ")+']</div>';}
  function commit(){var r=ISA[cur.mn].ex(S,cur.ops);S.changed=null;S.memChanged=null;if(r.reg!=null&&r.reg!==31){S.reg[r.reg]=r.val|0;S.changed=r.reg;}if(r.mem!=null){S.mem[r.mem]=r.val|0;S.memChanged=r.mem;}if(r.branch!=null)$("lbStage").textContent+=r.branch?"  →  branch TAKEN":"  →  branch not taken";renderState();}
  function refresh(){cur.mn=sel.value;cur.ops=readOps();cur.stageList=stages(cur.mn);cur.stage=-1;renderCtrl(controlFor(cur.mn));renderState();if(window.__lab3d)window.__lab3d.setActive(activeNodes(cur.mn));$("lbStage").textContent="Ready — "+ISA[cur.mn].k+": "+asmText(cur.mn,cur.ops)+". Step or Run to animate.";}

  sel.addEventListener("change",function(){stopRun();buildOps(sel.value);refresh();});
  $("lbStep").addEventListener("click",function(){if(!window.__lab3d)return;if(cur.stage>=cur.stageList.length-1){refresh();return;}cur.stage++;window.__lab3d.showStage(cur.stage);$("lbStage").textContent="Stage "+(cur.stage+1)+"/"+cur.stageList.length+" — "+cur.stageList[cur.stage];if(cur.stage===cur.stageList.length-1)commit();});
  var runT=null;function stopRun(){if(runT){clearInterval(runT);runT=null;}}
  $("lbRun").addEventListener("click",function(){if(!window.__lab3d)return;stopRun();refresh();var i=0;runT=setInterval(function(){if(i>=cur.stageList.length){stopRun();return;}cur.stage=i;window.__lab3d.showStage(i);$("lbStage").textContent="Stage "+(i+1)+"/"+cur.stageList.length+" — "+cur.stageList[i];if(i===cur.stageList.length-1)commit();i++;},900);});
  $("lbReset").addEventListener("click",function(){stopRun();S=fresh();refresh();if(window.__lab3d)window.__lab3d.home();});

  Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-tab"),function(t){t.addEventListener("click",function(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-tab"),function(x){x.classList.remove("on");});Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-pane"),function(x){x.classList.remove("on");});t.classList.add("on");document.querySelector('#cpuSim .lab-pane[data-pane="'+t.dataset.pane+'"]').classList.add("on");if(window.__lab3d)window.__lab3d.resize();});});

  /* ============================== EDITOR ================================= */
  var editLang="asm",endian="big",prog=[];
  var DEMO=["MOVZ X9, #4660, LSL #0","ADD X1, X2, X3","SUBI X4, X4, #1","LDUR X10, [X31, #16]","STUR X1, [X31, #24]","CBZ X4, #2","B #0"].join("\n");
  function recompute(){var src=(editLang==="asm"?$("aText").value:$("cText").value).replace(/\r/g,"").split("\n");prog=src.map(function(line){var c,asm,p;if(editLang==="asm"){asm=line;p=parseAsm(line);c=(p&&!p.error)?ISA[p.mn].c(p.ops):(line.trim()?(p&&p.error?"// "+p.error:""):"");}else{c=line;var a=compileC(line);asm=a||"";p=a?parseAsm(a):null;}var bits=(p&&!p.error)?bits32(p.mn,p.ops):null;return{c:c||"",asm:asm||"",bits:bits,ok:!!(p&&!p.error),mn:p&&p.mn,ops:p&&p.ops};});renderRows();}
  function endianBytes(bits){var b=[bits.slice(0,8),bits.slice(8,16),bits.slice(16,24),bits.slice(24,32)];return endian==="big"?b:b.slice().reverse();}
  function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");}
  function renderRows(){var cR=[],aR=[],bR=[];prog.forEach(function(p,i){var ln='<span class="ln">'+i+'</span>';cR.push('<div class="r" data-i="'+i+'">'+ln+esc(p.c)+'</div>');aR.push('<div class="r'+(p.asm.trim()&&!p.ok?' err':'')+'" data-i="'+i+'">'+ln+esc(p.asm)+'</div>');if(p.bits){var by=endianBytes(p.bits);bR.push('<div class="r" data-i="'+i+'">'+ln+by.map(function(x){return '<span class="byte">'+x+'</span>';}).join(" ")+'  <span style="color:var(--ink-dim)">0x'+parseInt(by.join(""),2).toString(16).toUpperCase().padStart(8,"0")+'</span></div>');}else bR.push('<div class="r" data-i="'+i+'"><span class="ln">'+i+'</span><span style="color:var(--ink-dim)">'+(p.asm.trim()?"— (not encodable)":"")+'</span></div>');});
    $("cRows").innerHTML=cR.join("");$("aRows").innerHTML=aR.join("");$("bRows").innerHTML=bR.join("");
    $("cRows").style.display=editLang==="c"?"none":"block";$("aRows").style.display=editLang==="asm"?"none":"block";
    $("cText").style.display=editLang==="c"?"block":"none";$("aText").style.display=editLang==="asm"?"block":"none";bindHover();}
  function bindHover(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .rows .r"),function(r){r.addEventListener("mouseenter",function(){hil(+r.dataset.i);});r.addEventListener("mouseleave",clearHil);r.addEventListener("click",function(){pickLine(+r.dataset.i);});});}
  function hil(i){clearHil();Array.prototype.forEach.call(document.querySelectorAll('#cpuSim .rows .r[data-i="'+i+'"]'),function(r){r.classList.add("hl");});var bar=editLang==="asm"?$("aHl"):$("cHl");var body=editLang==="asm"?$("aBody"):$("cBody");if(bar&&body){bar.style.display="block";bar.style.top=(i*LH+6-body.scrollTop)+"px";}}
  function clearHil(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .rows .r.hl"),function(r){r.classList.remove("hl");});$("aHl").style.display="none";$("cHl").style.display="none";}
  function pickLine(i){var p=prog[i];if(!p||!p.ok)return;sel.value=p.mn;buildOps(p.mn);cur.schema.forEach(function(f){var e=$("op_"+f[0]);if(e&&p.ops[f[0]]!=null)e.value=p.ops[f[0]];});refresh();$("lbPick").innerHTML='Loaded <b style="color:var(--on)">'+esc(p.asm.trim())+'</b> into the 3D datapath — switch to that tab and press Run.';}
  $("aText").addEventListener("input",function(){if(editLang==="asm")recompute();});
  $("cText").addEventListener("input",function(){if(editLang==="c")recompute();});
  $("lbEditAsm").addEventListener("click",function(){editLang="asm";this.classList.add("on");$("lbEditC").classList.remove("on");if(!$("aText").value.trim())$("aText").value=DEMO;recompute();});
  $("lbEditC").addEventListener("click",function(){editLang="c";this.classList.add("on");$("lbEditAsm").classList.remove("on");if(!$("cText").value.trim())$("cText").value=prog.map(function(p){return p.c;}).filter(Boolean).join("\n");recompute();});
  $("lbEndBig").addEventListener("click",function(){endian="big";this.classList.add("on");$("lbEndLit").classList.remove("on");renderRows();});
  $("lbEndLit").addEventListener("click",function(){endian="little";this.classList.add("on");$("lbEndBig").classList.remove("on");renderRows();});

  sel.value="ADD";buildOps("ADD");renderCtrl(controlFor("ADD"));renderState();$("aText").value=DEMO;recompute();

  /* =============================== 3D SCENE ============================== */
  function loadThree(cb){if(window.THREE){cb();return;}var s=document.createElement("script");s.src=THREE_URL;s.onload=cb;s.onerror=function(){fallback("3D engine could not load (offline?). The C / Assembly / Binary tab still works.");};document.head.appendChild(s);}
  function fallback(msg){var host=$("lbScene");if(host&&!host.querySelector(".fallback")){var d=document.createElement("div");d.className="fallback";d.textContent=msg;host.appendChild(d);}}
  loadThree(function(){try{build3D();}catch(e){if(window.console)console.error("[cpu-lab 3d]",e);fallback("3D view hit an error on this device. The C / Assembly / Binary tab still works.");}});

  function build3D(){
    var T=window.THREE,host=$("lbScene");
    var W=host.clientWidth||800,H=host.clientHeight||540;
    var scene=new T.Scene();scene.fog=new T.Fog(0x05070d,28,64);
    var camera=new T.PerspectiveCamera(46,W/H,0.1,200);
    var renderer=new T.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(W,H);host.appendChild(renderer.domElement);
    scene.add(new T.AmbientLight(0x8899bb,0.75));
    var key=new T.DirectionalLight(0xffffff,0.9);key.position.set(6,14,8);scene.add(key);
    var rim=new T.DirectionalLight(0xb51d35,0.5);rim.position.set(-8,6,-6);scene.add(rim);
    var COL={base:0x14233a,mux:0x243150,alu:0x244466,add:0x1b2740,ctrl:0x3a1422,on:0x7fe3ff,wire:0x46506a,wireOn:0x7fe3ff,acc:0xb51d35};

    function label(text,scale,color){var c=document.createElement("canvas");c.width=256;c.height=64;var x=c.getContext("2d");x.fillStyle=color||"#cfe0ff";x.font="bold 30px ui-monospace, monospace";x.textAlign="center";x.textBaseline="middle";x.fillText(text,128,34);var tex=new T.CanvasTexture(c);tex.minFilter=T.LinearFilter;var sp=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.scale.set(scale||3,(scale||3)*0.25,1);return sp;}
    function block(w,h,d,color,text,drill){var g=new T.Group();var mat=new T.MeshStandardMaterial({color:color,metalness:0.3,roughness:0.55});var mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);g.add(mesh);var ed=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w,h,d)),new T.LineBasicMaterial({color:0x9fb4d8,transparent:true,opacity:0.5}));g.add(ed);if(text){var lb=label(text,Math.max(2.2,w*1.2));lb.position.set(0,h/2+0.5,0);g.add(lb);}g.userData={mat:mat,ed:ed,drill:drill||null};return g;}
    function tube(p1,p2,r,color){var d=new T.Vector3().subVectors(p2,p1);var len=d.length()||0.001;var m=new T.Mesh(new T.CylinderGeometry(r,r,len,8),new T.MeshBasicMaterial({color:color}));m.position.copy(p1).add(p2).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());m.userData.mat=m.material;return m;}
    function mosfet(type){var g=new T.Group();g.add(new T.Mesh(new T.BoxGeometry(0.5,1,0.5),new T.MeshStandardMaterial({color:type==="p"?0x3a2440:0x223a44,metalness:0.3,roughness:0.5})));
      function lead(x,y,lab){var c=new T.Mesh(new T.CylinderGeometry(0.06,0.06,0.7,6),new T.MeshBasicMaterial({color:0xcfe0ff}));c.position.set(x,y,0);if(x!==0)c.rotation.z=Math.PI/2;g.add(c);var l=label(lab,1);l.position.set(x*1.6,y,0.25);g.add(l);}
      lead(-0.6,0,"G");lead(0,0.85,"D");lead(0,-0.85,"S");
      if(type==="p"){var b=new T.Mesh(new T.SphereGeometry(0.08,8,8),new T.MeshBasicMaterial({color:0xcfe0ff}));b.position.set(-0.33,0,0);g.add(b);}
      var nm=label(type==="p"?"PMOS":"NMOS",1.4);nm.position.set(0,-1.5,0);g.add(nm);return g;}

    var NODES={
      pc:{x:-10,z:0,w:0.9,h:1.3,d:1.6,c:COL.add,t:"PC"},
      pc4:{x:-7.5,z:-5,w:1.6,h:1,d:1.3,c:COL.add,t:"Add +4"},
      imem:{x:-7,z:0,w:2,h:1.1,d:2.6,c:COL.base,t:"Instr Mem",drill:"imem"},
      control:{x:-3,z:-5,w:2.6,h:0.9,d:1.5,c:COL.ctrl,t:"Control",drill:"control"},
      reg2loc:{x:-4.6,z:2,w:0.6,h:1.1,d:1.6,c:COL.mux,t:"Reg2Loc"},
      regfile:{x:-2.6,z:0,w:2,h:1.2,d:2.8,c:COL.base,t:"Reg File",drill:"regfile"},
      signext:{x:-2.6,z:4,w:2,h:0.8,d:1.1,c:COL.base,t:"Sign-ext",drill:"signext"},
      alusrc:{x:0.1,z:1.4,w:0.6,h:1.1,d:1.6,c:COL.mux,t:"ALUSrc"},
      alu:{x:2.2,z:0,w:1.8,h:1.4,d:2.3,c:COL.alu,t:"ALU",drill:"alu"},
      aluctrl:{x:2.2,z:4,w:1.8,h:0.8,d:1.1,c:COL.base,t:"ALU ctrl",drill:"alu"},
      dmem:{x:6,z:0,w:2,h:1.1,d:2.6,c:COL.base,t:"Data Mem",drill:"dmem"},
      memtoreg:{x:8.3,z:0,w:0.6,h:1.1,d:1.6,c:COL.mux,t:"MemtoReg"},
      shift2:{x:-0.3,z:-5,w:1.3,h:0.9,d:1.1,c:COL.add,t:"<<2"},
      baddr:{x:2.4,z:-5,w:1.6,h:1,d:1.3,c:COL.add,t:"Add br"},
      pcsrc:{x:9.6,z:-5,w:0.6,h:1.1,d:1.6,c:COL.mux,t:"PCSrc"}
    };
    var BUS=[["pc","imem"],["pc","pc4"],["imem","control"],["imem","regfile"],["imem","signext"],["regfile","alu"],["regfile","alusrc"],["signext","alusrc"],["alusrc","alu"],["alu","dmem"],["alu","memtoreg"],["dmem","memtoreg"],["memtoreg","regfile"],["signext","shift2"],["shift2","baddr"],["pc","baddr"],["baddr","pcsrc"],["pc4","pcsrc"],["pcsrc","pc"],["control","alu"],["reg2loc","regfile"]];

    var root=new T.Group();scene.add(root);
    var board=new T.Mesh(new T.BoxGeometry(26,0.3,16),new T.MeshStandardMaterial({color:0x0a0f1a,metalness:0.4,roughness:0.75}));board.position.y=-1.1;root.add(board);
    var blocks={},buses=[];
    Object.keys(NODES).forEach(function(id){var n=NODES[id];var g=block(n.w,n.h,n.d,n.c,n.t,n.drill);g.position.set(n.x,0,n.z);g.userData.id=id;root.add(g);blocks[id]=g;});
    BUS.forEach(function(p){var a=NODES[p[0]],b=NODES[p[1]];var pa=new T.Vector3(a.x,0,a.z),pb=new T.Vector3(b.x,0,b.z);var tb=tube(pa,pb,0.05,COL.wire);root.add(tb);buses.push({a:p[0],b:p[1],mesh:tb,pa:pa,pb:pb});});
    var pulse=new T.Mesh(new T.SphereGeometry(0.18,12,12),new T.MeshBasicMaterial({color:COL.acc}));pulse.visible=false;root.add(pulse);

    var target=new T.Vector3(0,0,0),radius=22,theta=0.7,phi=0.95,tT=target.clone(),tR=radius;
    function applyCam(){var x=target.x+radius*Math.sin(phi)*Math.sin(theta);var y=target.y+radius*Math.cos(phi);var z=target.z+radius*Math.sin(phi)*Math.cos(theta);camera.position.set(x,y,z);camera.lookAt(target);}
    applyCam();
    var dom=renderer.domElement,dragging=false,moved=false,px=0,py=0;
    dom.addEventListener("pointerdown",function(e){dragging=true;moved=false;px=e.clientX;py=e.clientY;if(dom.setPointerCapture)dom.setPointerCapture(e.pointerId);});
    dom.addEventListener("pointermove",function(e){if(!dragging)return;var dx=e.clientX-px,dy=e.clientY-py;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;theta-=dx*0.006;phi-=dy*0.006;phi=Math.max(0.25,Math.min(1.45,phi));px=e.clientX;py=e.clientY;});
    dom.addEventListener("pointerup",function(e){dragging=false;if(!moved)pick(e);});
    dom.addEventListener("wheel",function(e){e.preventDefault();radius=Math.max(6,Math.min(46,radius*(1+(e.deltaY>0?0.12:-0.12))));tR=radius;},{passive:false});

    var ray=new T.Raycaster(),mouse=new T.Vector2();
    function pick(e){var r=dom.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);var hits=ray.intersectObjects(curGroup().children,true);for(var i=0;i<hits.length;i++){var o=hits[i].object;while(o){if(o.userData&&o.userData.drill){drill(o.userData.drill);return;}o=o.parent;}}}

    var stack=[{id:"CPU",group:root}];
    function curGroup(){return stack[stack.length-1].group;}
    function frame(g){var box=new T.Box3().setFromObject(g);var c=box.getCenter(new T.Vector3());var size=box.getSize(new T.Vector3());var maxd=Math.max(size.x,size.y,size.z);tT=c.clone();tR=Math.max(7,maxd*1.7);}
    function drill(id){var g=buildInternal(id);if(!g)return;curGroup().visible=false;scene.add(g);stack.push({id:id,group:g});frame(g);renderCrumb();$("lbBack").style.display="";}
    function back(){if(stack.length<=1)return;var top=stack.pop();scene.remove(top.group);disposeGroup(top.group);curGroup().visible=true;if(stack.length===1)home();else frame(curGroup());renderCrumb();$("lbBack").style.display=stack.length>1?"":"none";}
    function home(){target.set(0,0,0);tT=target.clone();theta=0.7;phi=0.95;tR=22;}
    function popAll(){while(stack.length>1){var t=stack.pop();scene.remove(t.group);disposeGroup(t.group);}root.visible=true;renderCrumb();$("lbBack").style.display="none";home();}
    function renderCrumb(){$("lbCrumb").innerHTML=stack.map(function(s,i){var nm=TITLES[s.id]||s.id;return i<stack.length-1?'<a data-i="'+i+'">'+nm+'</a><span>›</span>':'<b>'+nm+'</b>';}).join("");Array.prototype.forEach.call($("lbCrumb").querySelectorAll("a"),function(a){a.addEventListener("click",function(){var to=+a.dataset.i;while(stack.length-1>to)back();});});}
    function disposeGroup(g){g.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}});}
    $("lbBack").addEventListener("click",back);
    $("lbHome").addEventListener("click",popAll);

    var TITLES={CPU:"CPU",alu:"ALU",fulladder:"Full Adder",mux:"2:1 MUX","gate:and":"AND","gate:or":"OR","gate:xor":"XOR","gate:not":"NOT","gate:nand":"NAND","gate:nor":"NOR","tx:not":"Inverter (CMOS)","tx:nand":"NAND (CMOS)","tx:nor":"NOR (CMOS)",regfile:"Register File",control:"Control Unit",dmem:"Data Memory",cache:"Cache",signext:"Sign-extend",imem:"Instruction Memory"};

    function row(items,gap,y){var g=new T.Group();var x=-(items.length-1)*gap/2;items.forEach(function(it){var b=block(it.w||2,it.h||1,it.d||1.4,it.c||COL.base,it.t,it.drill);b.position.set(x,y||0,0);g.add(b);x+=gap;});return g;}
    function buildInternal(id){
      if(id==="alu"){var g=new T.Group();g.add(row([{t:"Full Adder",drill:"fulladder",w:2.4,c:COL.alu},{t:"AND",drill:"gate:and",w:1.8},{t:"OR",drill:"gate:or",w:1.8},{t:"MUX",drill:"mux",w:1.8,c:COL.mux}],3.2,0));["A","B","Cin"].forEach(function(t,i){var l=label(t,1.4);l.position.set(-7.6,1.4-i*0.9,0);g.add(l);});var o=label("Result",1.8);o.position.set(7,0,0);g.add(o);return g;}
      if(id==="fulladder"){var g=new T.Group();g.add(row([{t:"XOR",drill:"gate:xor",w:1.7},{t:"XOR",drill:"gate:xor",w:1.7}],3.4,1.4));g.add(row([{t:"AND",drill:"gate:and",w:1.7},{t:"AND",drill:"gate:and",w:1.7},{t:"OR",drill:"gate:or",w:1.7}],3,-1.6));var s=label("Sum",1.5);s.position.set(6,1.4,0);g.add(s);var c=label("Cout",1.5);c.position.set(6,-1.6,0);g.add(c);["A","B","Cin"].forEach(function(t,i){var l=label(t,1.3);l.position.set(-6.6,1.5-i*0.8,0);g.add(l);});return g;}
      if(id==="mux"){var g=new T.Group();g.add(row([{t:"NOT",drill:"gate:not",w:1.6},{t:"AND",drill:"gate:and",w:1.7},{t:"AND",drill:"gate:and",w:1.7},{t:"OR",drill:"gate:or",w:1.7}],2.7,0));var y=label("Y",1.5);y.position.set(6,0,0);g.add(y);return g;}
      if(id&&id.indexOf("gate:")===0){var g=new T.Group();var nm=id.split(":")[1];g.add(block(3,1.4,1.6,COL.alu,nm.toUpperCase(),null));var prim={and:"tx:nand",or:"tx:nor",xor:"tx:nand",nand:"tx:nand",nor:"tx:nor","not":"tx:not"}[nm];var tb=block(3.6,1,1.4,COL.add,"View transistors →",prim);tb.position.set(0,-2.5,0);g.add(tb);return g;}
      if(id==="tx:not"){var g=new T.Group();rail(g,4,"VDD");rail(g,-4,"GND");var p=mosfet("p");p.position.set(0,2,0);g.add(p);var n=mosfet("n");n.position.set(0,-2,0);g.add(n);var a=label("A",1.4);a.position.set(-4,0,0);g.add(a);var y=label("Y",1.4);y.position.set(3,0,0);g.add(y);return g;}
      if(id==="tx:nand"){var g=new T.Group();rail(g,4.5,"VDD");rail(g,-4.5,"GND");var p1=mosfet("p");p1.position.set(-1.6,2.4,0);g.add(p1);var p2=mosfet("p");p2.position.set(1.6,2.4,0);g.add(p2);var n1=mosfet("n");n1.position.set(0,-0.4,0);g.add(n1);var n2=mosfet("n");n2.position.set(0,-2.6,0);g.add(n2);var t=label("A,B → gates",1.5);t.position.set(-4.6,0.4,0);g.add(t);var y=label("Y",1.4);y.position.set(3.4,1,0);g.add(y);return g;}
      if(id==="tx:nor"){var g=new T.Group();rail(g,4.5,"VDD");rail(g,-4.5,"GND");var p1=mosfet("p");p1.position.set(0,2.6,0);g.add(p1);var p2=mosfet("p");p2.position.set(0,0.6,0);g.add(p2);var n1=mosfet("n");n1.position.set(-1.6,-2.4,0);g.add(n1);var n2=mosfet("n");n2.position.set(1.6,-2.4,0);g.add(n2);var y=label("Y",1.4);y.position.set(3.4,-0.4,0);g.add(y);return g;}
      if(id==="regfile"){var g=new T.Group();g.add(row([{t:"Read dec 1",w:1.9},{t:"Read dec 2",w:1.9},{t:"Reg array",w:2.2,c:COL.alu},{t:"Read mux 1",drill:"mux",w:1.9,c:COL.mux},{t:"Read mux 2",drill:"mux",w:1.9,c:COL.mux}],3,0));var w=block(2,0.9,1.2,COL.base,"Write dec",null);w.position.set(-3,-2.4,0);g.add(w);var ba=label("BusA",1.4);ba.position.set(8,0.6,0);g.add(ba);var bb=label("BusB",1.4);bb.position.set(8,-0.6,0);g.add(bb);return g;}
      if(id==="control"){var g=new T.Group();g.add(block(3,1.4,1.6,COL.ctrl,"Opcode decoder",null));var outs=["RegWrite","ALUSrc","MemRead","MemWrite","MemtoReg","Reg2Loc","Branch","ALUOp","MovZ"];outs.forEach(function(o,i){var l=label(o,1.5);l.position.set(5,2.2-i*0.55,0);g.add(l);g.add(tube(new T.Vector3(1.5,0,0),new T.Vector3(3.6,2.2-i*0.55,0),0.04,COL.wire));});return g;}
      if(id==="dmem"){var g=new T.Group();g.add(row([{t:"Tag|Index|Off",w:2.4},{t:"L1 cache",drill:"cache",w:2,c:COL.alu},{t:"L2 cache",drill:"cache",w:2},{t:"Main memory",w:2.4}],3.4,0));var rd=label("read data",1.5);rd.position.set(0,-2.2,0);g.add(rd);return g;}
      if(id==="cache"){var g=new T.Group();g.add(row([{t:"Sets",w:1.8},{t:"Way 0",w:1.6},{t:"Way 1",w:1.6},{t:"Tag compare",w:2.2,c:COL.alu},{t:"Hit → data",w:2}],2.8,0));return g;}
      if(id==="signext"){var g=new T.Group();g.add(row([{t:"Format select",w:2.2},{t:"Sign/zero ext",w:2.2,c:COL.alu},{t:"<<2 (branch)",w:2.2}],3.4,0));var o=label("imm[63:0]",1.5);o.position.set(6.5,0,0);g.add(o);return g;}
      if(id==="imem"){var g=new T.Group();g.add(row([{t:"Addr decode",w:2.2},{t:"ROM array",w:2.2,c:COL.alu},{t:"Instr[31-0]",w:2.2}],3.4,0));var o=label("→ opcode / Rn / Rm / Rt / imm",1.6);o.position.set(0,-2.2,0);g.add(o);return g;}
      return null;
    }
    function rail(g,y,name){var bar=new T.Mesh(new T.BoxGeometry(10,0.12,0.4),new T.MeshBasicMaterial({color:0x6f7891}));bar.position.set(0,y,0);g.add(bar);var l=label(name,1.6);l.position.set(-5.6,y,0);g.add(l);}

    var activeSet=[];
    function setActive(ids){activeSet=ids||[];Object.keys(blocks).forEach(function(id){var on=activeSet.indexOf(id)>=0;var ud=blocks[id].userData;ud.mat.emissive.setHex(on?0x16344e:0x000000);ud.ed.material.color.setHex(on?COL.on:0x9fb4d8);ud.ed.material.opacity=on?0.9:0.4;});buses.forEach(function(b){var on=activeSet.indexOf(b.a)>=0&&activeSet.indexOf(b.b)>=0;b.mesh.userData.mat.color.setHex(on?COL.wireOn:COL.wire);});pulse.visible=false;}
    var pulseSeq=[],pulseI=0,pulseT=0;
    function showStage(i){if(stack.length>1)return;pulseSeq=buses.filter(function(b){return activeSet.indexOf(b.a)>=0&&activeSet.indexOf(b.b)>=0;}).sort(function(a,b){return NODES[a.a].x-NODES[b.a].x;});var idx=Math.min(i,pulseSeq.length-1);if(idx<0){pulse.visible=false;return;}pulseI=idx;pulseT=0;pulse.visible=true;}

    window.__lab3d={setActive:setActive,showStage:showStage,home:popAll,resize:doResize};
    setActive(activeNodes("ADD"));

    function doResize(){var w=host.clientWidth||800,h=host.clientHeight||540;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
    window.addEventListener("resize",doResize);

    var clock=new T.Clock();
    function loop(){requestAnimationFrame(loop);var dt=clock.getDelta();target.lerp(tT,0.12);radius+=(tR-radius)*0.12;applyCam();
      if(pulse.visible&&pulseSeq.length){var b=pulseSeq[pulseI];if(b){pulseT+=dt*1.6;if(pulseT>=1){pulseT=0;pulseI=Math.min(pulseI+1,pulseSeq.length-1);b=pulseSeq[pulseI];}pulse.position.copy(new T.Vector3().lerpVectors(b.pa,b.pb,Math.min(pulseT,1)));}}
      renderer.render(scene,camera);}
    loop();setTimeout(doResize,60);refresh();
  }
})();
