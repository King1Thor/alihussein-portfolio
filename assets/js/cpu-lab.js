/* ============================================================================
   cpu-lab.js — ARMv8 Single-Cycle Datapath Explorer (professional 2D).
   Mounts into #cpuSim.
     • Full LEGv8 datapath: all components, muxes, buses, control signals.
     • Right panel: assembly, colored binary fields, field table, control
       signals, C-equivalent, live component inspector.
     • Bottom execution timeline: Step / Auto-run, stage chips, active-path
       highlight + animated signal flow.  Zoom / pan / fit.
     • In-canvas drill-down (no modal): click a component to descend
       component -> submodule -> logic gate -> CMOS transistor, with breadcrumb.
     • Code tab: C / Assembly / Binary editor (two-way, cross-highlight,
       big/little-endian).
   ============================================================================ */
(function () {
  "use strict";
  var mount = document.getElementById("cpuSim");
  if (!mount) return;
  var NS = "http://www.w3.org/2000/svg";
  var LH = 22;

  /* =============================== STYLES ================================ */
  var st = document.createElement("style");
  st.textContent = [
    "#cpuSim{--on:var(--steel-2,#7fe3ff);--on2:var(--steel,#58b6ff);--acc:var(--maroon-2,#b51d35);--good:var(--good,#43e08a);--mono:var(--font-mono,monospace);}",
    "#cpuSim .lab-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}",
    "#cpuSim .lab-tab{cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink-soft);border-radius:10px;padding:7px 14px;font:700 .74rem var(--mono);letter-spacing:.05em;}",
    "#cpuSim .lab-tab.on{background:var(--acc);border-color:var(--acc);color:#fff;}",
    "#cpuSim .lab-pane{display:none;} #cpuSim .lab-pane.on{display:block;}",
    /* shell */
    "#cpuSim .shell{display:grid;grid-template-columns:1fr 312px;gap:14px;} @media(max-width:980px){#cpuSim .shell{grid-template-columns:1fr;}}",
    "#cpuSim .stagewrap{position:relative;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#070b13;}",
    "#cpuSim .canvas{position:relative;width:100%;height:480px;background:radial-gradient(120% 120% at 60% -10%,rgba(181,29,53,.10),transparent 55%);} @media(max-width:700px){#cpuSim .canvas{height:360px;}}",
    "#cpuSim svg.dp{width:100%;height:100%;display:block;cursor:grab;touch-action:none;} #cpuSim svg.dp.drag{cursor:grabbing;}",
    "#cpuSim .crumb{position:absolute;left:12px;top:10px;z-index:4;display:flex;gap:6px;align-items:center;background:rgba(8,11,20,.8);border:1px solid var(--line-2);border-radius:10px;padding:6px 10px;font:700 .72rem var(--mono);}",
    "#cpuSim .crumb a{color:var(--on);cursor:pointer;} #cpuSim .crumb b{color:var(--ink);} #cpuSim .crumb span{color:var(--ink-dim);}",
    "#cpuSim .zoomctl{position:absolute;right:12px;top:10px;z-index:4;display:flex;gap:6px;}",
    "#cpuSim .zb{cursor:pointer;width:30px;height:30px;display:grid;place-items:center;background:rgba(8,11,20,.8);border:1px solid var(--line-2);color:var(--ink-soft);border-radius:8px;font:700 .9rem var(--mono);}",
    "#cpuSim .hint{position:absolute;left:12px;bottom:10px;z-index:4;color:var(--ink-dim);font:600 .66rem var(--mono);background:rgba(8,11,20,.65);padding:4px 9px;border-radius:8px;}",
    /* timeline */
    "#cpuSim .timeline{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--line);padding:11px 12px;background:rgba(10,14,22,.6);}",
    "#cpuSim .stages{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:200px;}",
    "#cpuSim .schip{font:700 .66rem var(--mono);color:var(--ink-dim);border:1px solid var(--line-2);border-radius:999px;padding:4px 9px;white-space:nowrap;}",
    "#cpuSim .schip.on{color:#fff;background:var(--on2);border-color:var(--on2);}",
    "#cpuSim .schip.done{color:var(--on);border-color:var(--on);}",
    "#cpuSim .tbtns{display:flex;gap:7px;}",
    /* right panel */
    "#cpuSim .side{display:flex;flex-direction:column;gap:12px;}",
    "#cpuSim .card{border:1px solid var(--line);border-radius:13px;padding:12px 13px;background:var(--panel,rgba(18,23,36,.5));}",
    "#cpuSim .card h4{margin:0 0 9px;font:800 .64rem var(--mono);letter-spacing:.14em;color:var(--ink-soft);text-transform:uppercase;display:flex;justify-content:space-between;align-items:center;}",
    "#cpuSim .selrow{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:9px;}",
    "#cpuSim select,#cpuSim input.num{background:var(--panel-2,#0c101a);color:var(--ink);border:1px solid var(--line-2);border-radius:8px;padding:6px 8px;font:500 .8rem var(--mono);}",
    "#cpuSim input.num{width:58px;} #cpuSim label.f{display:flex;flex-direction:column;gap:3px;font:700 .6rem var(--mono);letter-spacing:.08em;color:var(--ink-dim);text-transform:uppercase;}",
    "#cpuSim .asm{font:700 .92rem var(--mono);color:var(--on);background:var(--panel-2);border:1px solid var(--line-2);border-radius:8px;padding:8px 10px;}",
    "#cpuSim .ceq{font:600 .82rem var(--mono);color:var(--good);}",
    "#cpuSim .bits{display:flex;flex-wrap:wrap;gap:2px;font:600 .7rem var(--mono);} #cpuSim .bf{padding:3px 4px;border-radius:4px;color:#fff;}",
    "#cpuSim table.kv{width:100%;border-collapse:collapse;font:600 .72rem var(--mono);} #cpuSim table.kv td{padding:2px 3px;color:var(--ink-soft);border-bottom:1px solid rgba(150,170,210,.08);} #cpuSim table.kv td.v{text-align:right;color:var(--ink-dim);}",
    "#cpuSim table.kv tr.hi td{color:var(--on);}",
    "#cpuSim .insp{font:600 .76rem var(--mono);color:var(--ink-soft);line-height:1.5;} #cpuSim .insp b{color:var(--ink);} #cpuSim .insp .io{color:var(--ink-dim);font-size:.72rem;}",
    "#cpuSim .state{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;font:700 .68rem var(--mono);} #cpuSim .reg{border:1px solid var(--line);border-radius:7px;padding:4px 5px;color:var(--ink-soft);} #cpuSim .reg b{color:var(--ink);} #cpuSim .reg.chg{border-color:var(--good);color:var(--good);} #cpuSim .reg.chg b{color:var(--good);}",
    /* datapath svg classes */
    "#cpuSim .nd rect,#cpuSim .nd polygon,#cpuSim .nd ellipse{fill:var(--panel-2,#0c101a);stroke:var(--line-2,rgba(150,170,210,.34));stroke-width:1.4;transition:.2s;filter:drop-shadow(0 3px 5px rgba(0,0,0,.45));}",
    "#cpuSim .nd text{fill:var(--ink);font:600 12px var(--font-display,sans-serif);pointer-events:none;} #cpuSim .nd .sub{fill:var(--ink-soft);font:500 10px var(--mono);}",
    "#cpuSim .nd.mux rect{fill:#15203a;stroke:#3a5180;} #cpuSim .nd.ctrl ellipse{fill:#2a1320;stroke:#7a2740;} #cpuSim .nd.alu polygon{fill:#10283f;stroke:#2f6390;}",
    "#cpuSim .nd[data-click]{cursor:pointer;} #cpuSim .nd[data-click]:hover rect,#cpuSim .nd[data-click]:hover polygon,#cpuSim .nd[data-click]:hover ellipse{stroke:var(--good);}",
    "#cpuSim .nd.sel rect,#cpuSim .nd.sel polygon,#cpuSim .nd.sel ellipse{stroke:var(--good);stroke-width:2.2;}",
    "#cpuSim .nd.dim{opacity:.32;}",
    "#cpuSim .nd.act rect,#cpuSim .nd.act ellipse,#cpuSim .nd.act polygon{stroke:var(--on);stroke-width:2.3;fill:rgba(88,182,255,.10);filter:drop-shadow(0 0 9px rgba(88,182,255,.5));}",
    "#cpuSim .nd.wr rect{stroke:var(--good);filter:drop-shadow(0 0 9px rgba(67,224,138,.55));}",
    "#cpuSim .musel{fill:var(--ink-dim);font:700 9px var(--mono);} #cpuSim .port{fill:var(--ink-dim,#6f7891);font:600 8.4px var(--mono);} #cpuSim .tap{fill:var(--on);font:600 8.4px var(--mono);opacity:.85;}",
    "#cpuSim .ed{fill:none;stroke:var(--line-2,rgba(150,170,210,.3));stroke-width:1.5;transition:.2s;} #cpuSim .ed.dim{opacity:.18;} #cpuSim .ed.act{stroke:var(--on);stroke-width:2.4;} #cpuSim .ed.pulse{stroke:var(--acc);stroke-width:3;stroke-dasharray:9 13;animation:cflow .9s linear infinite;}",
    "@keyframes cflow{to{stroke-dashoffset:-44;}}",
    "#cpuSim .elab{fill:var(--ink-dim);font:600 9px var(--mono);} #cpuSim .elab.act{fill:var(--on);}",
    "#cpuSim .gridbg{stroke:rgba(120,150,200,.06);stroke-width:1;}",
    /* scene svg (drill) */
    "#cpuSim .scene text{fill:var(--ink);font:600 12px var(--mono);} #cpuSim .scene .sm{font-size:10px;fill:var(--ink-soft);}",
    "#cpuSim .scene .wire{stroke:var(--on);stroke-width:1.7;fill:none;} #cpuSim .scene .rail{stroke:var(--ink-dim);stroke-width:1.6;}",
    "#cpuSim .scene .blk{fill:var(--panel-2);stroke:var(--line-2);stroke-width:1.4;} #cpuSim .scene .hot{cursor:pointer;} #cpuSim .scene .hot:hover *{stroke:var(--good);}",
    "#cpuSim .scene .gate{fill:rgba(88,182,255,.07);stroke:var(--on);stroke-width:1.8;} #cpuSim .scene .tx{stroke:var(--ink);stroke-width:1.7;fill:none;} #cpuSim .scene .ttl{fill:var(--good);font-weight:700;}",
    "#cpuSim .scenehead{position:absolute;left:12px;bottom:34px;z-index:4;max-width:62%;color:var(--ink-soft);font:600 .72rem var(--mono);background:rgba(8,11,20,.72);padding:6px 10px;border-radius:9px;border:1px solid var(--line);}",
    /* in-place expansion overlay */
    "#cpuSim .exbg{fill:rgba(4,6,12,.5);cursor:pointer;}",
    "#cpuSim .expanel .bg{fill:#0a1120;stroke:var(--on);stroke-width:1.6;filter:drop-shadow(0 10px 26px rgba(0,0,0,.6));}",
    "#cpuSim .expanel .exhead{fill:#101a2c;stroke:none;}",
    "#cpuSim .extitle{fill:var(--ink);font:700 12px var(--mono);} #cpuSim .excrumbt{fill:var(--on);cursor:pointer;}",
    "#cpuSim .exclose circle{fill:#1a2336;} #cpuSim .exclose text{fill:#cfe0ff;} #cpuSim .exclose{cursor:pointer;}",
    "#cpuSim .exwire{fill:none;stroke:var(--on);stroke-width:2.6;filter:drop-shadow(0 0 5px rgba(127,227,255,.55));}",
    "#cpuSim .expin circle{fill:var(--on);} #cpuSim .expin text{fill:var(--ink-soft);font:600 9px var(--mono);} #cpuSim .expin.ctrl circle{fill:var(--good);} #cpuSim .expin.ctrl text{fill:var(--good);}",
    /* editor */
    "#cpuSim .opbar{display:flex;gap:8px;align-items:center;font:600 .7rem var(--mono);color:var(--ink-soft);margin-bottom:10px;flex-wrap:wrap;}",
    "#cpuSim .chip{cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink-soft);border-radius:999px;padding:6px 12px;font:700 .7rem var(--mono);} #cpuSim .chip.on{background:var(--acc);border-color:var(--acc);color:#fff;}",
    "#cpuSim .ed3{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:12px;} @media(max-width:960px){#cpuSim .ed3{grid-template-columns:1fr;}}",
    "#cpuSim .epanel{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel-2,#0c101a);}",
    "#cpuSim .ehead{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;border-bottom:1px solid var(--line);font:800 .72rem var(--mono);letter-spacing:.08em;}",
    "#cpuSim .ehead .tagc{color:var(--good);} #cpuSim .ehead .taga{color:#7fa7ff;} #cpuSim .ehead .tagb{color:var(--acc);}",
    "#cpuSim .ebody{position:relative;height:220px;overflow:auto;}",
    "#cpuSim textarea.code{position:absolute;inset:0;width:100%;height:100%;border:0;resize:none;background:transparent;color:var(--ink);font:500 13px/" + LH + "px var(--mono);padding:6px 10px;outline:none;white-space:pre;overflow:auto;}",
    "#cpuSim .hlbar{position:absolute;left:0;right:0;height:" + LH + "px;background:rgba(127,227,255,.13);border-left:3px solid var(--on);display:none;pointer-events:none;}",
    "#cpuSim .rows{font:500 13px/" + LH + "px var(--mono);padding:6px 0;} #cpuSim .rows .r{padding:0 10px;white-space:pre;color:var(--ink-soft);} #cpuSim .rows .r .ln{color:var(--ink-dim);display:inline-block;width:1.4em;}",
    "#cpuSim .rows .r.hl{background:rgba(127,227,255,.13);border-left:3px solid var(--on);padding-left:7px;color:var(--ink);} #cpuSim .rows .r.err{color:var(--acc);} #cpuSim .rows.bin .r{font-size:12px;} #cpuSim .rows.bin .byte{padding:1px 3px;border-radius:3px;background:rgba(127,227,255,.10);}"
  ].join("\n");
  mount.appendChild(st);

  /* ============================ ISA MODEL =============================== */
  function bin(v,n){v=((v%Math.pow(2,n))+Math.pow(2,n))%Math.pow(2,n);var s=v.toString(2);while(s.length<n)s="0"+s;return s;}
  var FC={op:"#b51d35",reg:"#2f7bd6",sh:"#6f7891",imm:"#3a9d6b",hw:"#8a5cc0",addr:"#3a9d6b",op2:"#566179"};
  var ISA={
    ADD:{fmt:"R",cat:"R-type",op:"10001011000",k:"R-type",alu:"ADD",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]+s.reg[o.Rm]};}},
    SUB:{fmt:"R",cat:"R-type",op:"11001011000",k:"R-type",alu:"SUB",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]-s.reg[o.Rm]};}},
    AND:{fmt:"R",cat:"R-type",op:"10001010000",k:"R-type",alu:"AND",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" & X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]&s.reg[o.Rm]};}},
    ORR:{fmt:"R",cat:"R-type",op:"10101010000",k:"R-type",alu:"ORR",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" | X"+o.Rm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]|s.reg[o.Rm]};}},
    ADDI:{fmt:"I",cat:"I-type",op:"1001000100",k:"I-type",alu:"ADD",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + "+o.imm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]+o.imm};}},
    SUBI:{fmt:"I",cat:"I-type",op:"1101000100",k:"I-type",alu:"SUB",c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - "+o.imm+";";},ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]-o.imm};}},
    LDUR:{fmt:"D",cat:"D-type",op:"11111000010",k:"Load",alu:"ADD",c:function(o){return "X"+o.Rt+" = Memory[X"+o.Rn+" + "+o.addr+"];";},ex:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {reg:o.Rt,val:s.mem[i]};}},
    STUR:{fmt:"D",cat:"D-type",op:"11111000000",k:"Store",alu:"ADD",c:function(o){return "Memory[X"+o.Rn+" + "+o.addr+"] = X"+o.Rt+";";},ex:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {mem:i,val:s.reg[o.Rt]};}},
    CBZ:{fmt:"CB",cat:"CB-type",op:"10110100",k:"Branch",alu:"PASSB",c:function(o){return "if (X"+o.Rt+" == 0) goto "+o.addr+";";},ex:function(s,o){return {branch:s.reg[o.Rt]===0};}},
    B:{fmt:"B",cat:"B-type",op:"000101",k:"Branch",alu:"ADD",c:function(o){return "goto "+o.addr+";";},ex:function(s,o){return {branch:true};}},
    MOVZ:{fmt:"IM",cat:"MOVZ",op:"110100101",k:"Move",alu:"PASSB",c:function(o){return "X"+o.Rd+" = "+o.imm+(o.hw?(" << "+(o.hw*16)):"")+";";},ex:function(s,o){return {reg:o.Rd,val:o.imm*Math.pow(2,o.hw*16)};}}
  };
  var CATS={"R-type":["ADD","SUB","AND","ORR"],"I-type":["ADDI","SUBI"],"D-type":["LDUR","STUR"],"CB-type":["CBZ"],"B-type":["B"],"MOVZ":["MOVZ"]};
  function defaults(mn){var f=ISA[mn].fmt;if(f==="R")return{Rd:1,Rn:2,Rm:3};if(f==="I")return{Rd:1,Rn:2,imm:5};if(f==="D")return{Rt:1,Rn:31,addr:16};if(f==="CB")return{Rt:9,addr:2};if(f==="B")return{addr:4};if(f==="IM")return{Rd:9,imm:4660,hw:0};return{};}
  function schemaOf(mn){var f=ISA[mn].fmt;if(f==="R")return[["Rd",1,"reg"],["Rn",2,"reg"],["Rm",3,"reg"]];if(f==="I")return[["Rd",1,"reg"],["Rn",2,"reg"],["imm",5,"num"]];if(f==="D")return[["Rt",1,"reg"],["Rn",31,"reg"],["addr",16,"num"]];if(f==="CB")return[["Rt",9,"reg"],["addr",2,"num"]];if(f==="B")return[["addr",4,"num"]];if(f==="IM")return[["Rd",9,"reg"],["imm",4660,"num"],["hw",0,"sel"]];return[];}
  function asmText(mn,o){var f=ISA[mn].fmt;if(f==="R")return mn+" X"+o.Rd+", X"+o.Rn+", X"+o.Rm;if(f==="I")return mn+" X"+o.Rd+", X"+o.Rn+", #"+o.imm;if(f==="D")return mn+" X"+o.Rt+", [X"+o.Rn+", #"+o.addr+"]";if(f==="CB")return mn+" X"+o.Rt+", #"+o.addr;if(f==="B")return mn+" #"+o.addr;if(f==="IM")return mn+" X"+o.Rd+", #"+o.imm+", LSL #"+(o.hw*16);return mn;}
  function controlFor(mn){var z={Reg2Loc:0,ALUSrc:0,MemtoReg:0,RegWrite:0,MemRead:0,MemWrite:0,Branch:0,Uncondbranch:0,MovZ:0};function e(b){var o={};for(var k in z)o[k]=z[k];for(var j in b)o[j]=b[j];return o;}var f=ISA[mn].fmt;if(mn==="LDUR")return e({ALUSrc:1,MemtoReg:1,RegWrite:1,MemRead:1});if(mn==="STUR")return e({Reg2Loc:1,ALUSrc:1,MemWrite:1});if(f==="R")return e({RegWrite:1});if(f==="I")return e({ALUSrc:1,RegWrite:1});if(f==="IM")return e({ALUSrc:1,RegWrite:1,MovZ:1});if(f==="CB")return e({Reg2Loc:1,Branch:1});if(f==="B")return e({Uncondbranch:1});return z;}
  function encode(mn,o){var I=ISA[mn],f=I.fmt,F=[];function a(n,b,c){F.push({n:n,b:b,c:c});}
    if(f==="R"){a("opcode",I.op,FC.op);a("Rm",bin(o.Rm,5),FC.reg);a("shamt","000000",FC.sh);a("Rn",bin(o.Rn,5),FC.reg);a("Rd",bin(o.Rd,5),FC.reg);}
    else if(f==="I"){a("opcode",I.op,FC.op);a("immediate",bin(o.imm,12),FC.imm);a("Rn",bin(o.Rn,5),FC.reg);a("Rd",bin(o.Rd,5),FC.reg);}
    else if(f==="D"){a("opcode",I.op,FC.op);a("DT_address",bin(o.addr,9),FC.addr);a("op","00",FC.op2);a("Rn",bin(o.Rn,5),FC.reg);a("Rt",bin(o.Rt,5),FC.reg);}
    else if(f==="CB"){a("opcode",I.op,FC.op);a("br_address",bin(o.addr,19),FC.addr);a("Rt",bin(o.Rt,5),FC.reg);}
    else if(f==="B"){a("opcode",I.op,FC.op);a("br_address",bin(o.addr,26),FC.addr);}
    else if(f==="IM"){a("opcode",I.op,FC.op);a("hw",bin(o.hw,2),FC.hw);a("MOV_imm",bin(o.imm,16),FC.imm);a("Rd",bin(o.Rd,5),FC.reg);}
    return F;}
  function bits32(mn,o){return encode(mn,o).map(function(f){return f.b;}).join("");}
  function parseAsm(line){var s=line.trim();if(!s||s[0]===";"||s[0]==="/")return null;var m=s.match(/^([A-Za-z]+)\s*(.*)$/);if(!m)return{error:"?"};var mn=m[1].toUpperCase();if(!ISA[mn])return{error:"unknown op "+mn};var rest=m[2],f=ISA[mn].fmt;var regs=(rest.match(/X\d+/gi)||[]).map(function(x){return +x.slice(1);});var imms=(rest.match(/#(-?\d+)/g)||[]).map(function(x){return +x.slice(1);});
    if(f==="R")return{mn:mn,ops:{Rd:regs[0],Rn:regs[1],Rm:regs[2]}};if(f==="I")return{mn:mn,ops:{Rd:regs[0],Rn:regs[1],imm:imms[0]}};if(f==="D")return{mn:mn,ops:{Rt:regs[0],Rn:regs[1],addr:imms[0]||0}};if(f==="CB")return{mn:mn,ops:{Rt:regs[0],addr:imms[0]||0}};if(f==="B")return{mn:mn,ops:{addr:imms[0]||0}};if(f==="IM")return{mn:mn,ops:{Rd:regs[0],imm:imms[0],hw:(imms[1]?(imms[1]/16)|0:0)}};return{error:"?"};}
  function compileC(line){var s=line.trim().replace(/;$/,"");if(!s||s[0]==="/")return null;var m;
    if((m=s.match(/^X(\d+)\s*=\s*X(\d+)\s*([+\-&|])\s*X(\d+)$/))){var op={"+":"ADD","-":"SUB","&":"AND","|":"ORR"}[m[3]];return op+" X"+m[1]+", X"+m[2]+", X"+m[4];}
    if((m=s.match(/^X(\d+)\s*=\s*X(\d+)\s*([+\-])\s*(\d+)$/)))return (m[3]==="+"?"ADDI":"SUBI")+" X"+m[1]+", X"+m[2]+", #"+m[4];
    if((m=s.match(/^X(\d+)\s*=\s*(?:mem|Memory)\[\s*X(\d+)\s*\+\s*(\d+)\s*\]$/i)))return "LDUR X"+m[1]+", [X"+m[2]+", #"+m[3]+"]";
    if((m=s.match(/^(?:mem|Memory)\[\s*X(\d+)\s*\+\s*(\d+)\s*\]\s*=\s*X(\d+)$/i)))return "STUR X"+m[3]+", [X"+m[1]+", #"+m[2]+"]";
    if((m=s.match(/^X(\d+)\s*=\s*(\d+)$/)))return "MOVZ X"+m[1]+", #"+m[2]+", LSL #0";
    if((m=s.match(/^if\s*\(\s*X(\d+)\s*==\s*0\s*\)\s*goto\s*(\d+)$/)))return "CBZ X"+m[1]+", #"+m[2];
    if((m=s.match(/^goto\s*(\d+)$/)))return "B #"+m[1];
    return "; (unsupported C)";}

  /* ========================== DATAPATH LAYOUT =========================== */
  var N={
    pc:{x:30,y:250,w:46,h:74,t:"PC"},
    pc4:{x:150,y:58,w:74,h:46,t:"Add",s:"PC+4"},
    imem:{x:150,y:244,w:120,h:88,t:"Instruction",s:"Memory",click:"imem"},
    control:{x:430,y:40,w:158,h:60,t:"Control",ell:true,click:"control"},
    regfile:{x:420,y:224,w:150,h:124,t:"Register File",titleTop:true,click:"regfile"},
    reg2loc:{x:372,y:332,w:26,h:60,mux:true},
    signext:{x:420,y:406,w:140,h:44,t:"Sign-extend",click:"signext"},
    alusrc:{x:600,y:282,w:26,h:74,mux:true},
    alu:{x:660,y:222,w:96,h:138,t:"ALU",alu:true,click:"alu"},
    aluctrl:{x:646,y:420,w:112,h:38,t:"ALU control",click:"aluctrl"},
    dmem:{x:826,y:248,w:120,h:104,t:"Data",s:"Memory",click:"dmem"},
    memtoreg:{x:986,y:262,w:26,h:74,mux:true},
    shift2:{x:600,y:126,w:60,h:34,t:"Shift L2"},
    baddr:{x:700,y:60,w:72,h:46,t:"Add",s:"branch"},
    band:{x:812,y:80,w:40,h:34,t:"AND"},
    pcsrc:{x:902,y:54,w:26,h:74,mux:true}
  };
  function R(n){return [N[n].x+N[n].w,N[n].y+N[n].h/2];}
  function L(n){return [N[n].x,N[n].y+N[n].h/2];}
  function Tt(n){return [N[n].x+N[n].w/2,N[n].y];}
  function Bt(n){return [N[n].x+N[n].w/2,N[n].y+N[n].h];}
  var E={
    pc_imem:{p:[R("pc"),L("imem")]},
    pc_pc4:{p:[[53,250],[53,81],L("pc4")]},
    pc4_pcsrc:{p:[R("pc4"),[902,81]],l:"PC+4"},
    imem_ctrl:{p:[[209,244],[209,70],L("control")],l:"Instr[31-21]"},
    imem_rf:{p:[R("imem"),[300,258],[420,258]],l:"Instr[9-5]"},
    imem_r2:{p:[[270,300],[372,348]],l:"Instr[20-16]/[4-0]"},
    imem_se:{p:[[270,322],[360,428],L("signext")],l:"Instr[31-0]"},
    r2_rf:{p:[R("reg2loc"),[420,330]]},
    rf_a:{p:[[570,260],[640,250],[660,250]],l:"BusA"},
    rf_b:{p:[[570,318],[600,319]],l:"BusB"},
    se_alusrc:{p:[R("signext"),[592,440],[592,350],L("alusrc")]},
    alusrc_alu:{p:[R("alusrc"),[660,330]]},
    alu_dmem:{p:[R("alu"),[800,291],L("dmem")],l:"address"},
    b_dmemwr:{p:[[584,342],[584,372],[800,372],[826,330]],l:"write data"},
    alu_m2r0:{p:[[756,300],[986,300]]},
    dmem_m2r1:{p:[R("dmem"),[972,310],[986,310]],l:"read data"},
    m2r_wb:{p:[R("memtoreg"),[1026,299],[1026,474],[402,474],[402,348],[420,344]],l:"write back data"},
    se_shift:{p:[[492,406],[492,143],L("shift2")]},
    shift_b:{p:[R("shift2"),[680,143],[680,94],L("baddr")]},
    pc_b:{p:[[53,250],[53,28],[642,28],[642,71],L("baddr")]},
    b_pcsrc:{p:[R("baddr"),[890,83],[902,101]]},
    pcsrc_pc:{p:[Tt("pcsrc"),[915,14],[14,14],[14,250],L("pc")]},
    ctrl_br:{p:[Bt("control"),[509,116],[762,116],[812,90]],l:"Branch"},
    alu_zero:{p:[[700,222],[700,198],[820,198],[820,114]],l:"Zero"},
    band_pcsrc:{p:[R("band"),[889,95]]}
  };
  var PORTS=[
    [424,250,"Read reg 1","port"],[424,273,"Read reg 2","port"],[424,299,"Write reg","port"],[424,322,"Write data","port"],
    [512,262,"Read data 1","port"],[512,340,"Read data 2","port"],
    [760,232,"ALU result","port"],[702,212,"Zero","port"],
    [950,264,"Address","port"],[950,332,"Write data","port"],
    [158,234,"Read addr","port"],[630,298,"ALUSrc","musel"],[332,392,"Reg2Loc","musel"],[992,258,"MemtoReg","musel"],[906,50,"PCSrc","musel"],
    [646,414,"ALUOp","tap"]
  ];
  function profile(mn){var f=ISA[mn].fmt,base=["pc","imem","control","pc4","pcsrc"],be=["pc_imem","pc_pc4","imem_ctrl","pc4_pcsrc","pcsrc_pc"];
    if(f==="R")return {nodes:base.concat("regfile","alu","aluctrl","memtoreg"),edges:be.concat("imem_rf","imem_r2","rf_a","rf_b","alusrc_alu","alu_m2r0","m2r_wb"),seq:["Fetch instruction","Decode + read registers","Read second operand","ALU executes","Write back result"]};
    if(f==="I")return {nodes:base.concat("regfile","signext","alusrc","alu","aluctrl","memtoreg"),edges:be.concat("imem_rf","imem_se","rf_a","se_alusrc","alusrc_alu","alu_m2r0","m2r_wb"),seq:["Fetch","Decode + read Rn","Sign-extend immediate","ALU add/subtract","Write back result"]};
    if(f==="IM")return {nodes:base.concat("regfile","signext","alusrc","alu","memtoreg"),edges:be.concat("imem_se","se_alusrc","alusrc_alu","alu_m2r0","m2r_wb"),seq:["Fetch","Decode (MovZ=1)","Build immediate << hw","ALU passes value","Write to register"]};
    if(mn==="LDUR")return {nodes:base.concat("regfile","signext","alusrc","alu","aluctrl","dmem","memtoreg"),edges:be.concat("imem_rf","imem_se","rf_a","se_alusrc","alusrc_alu","alu_dmem","dmem_m2r1","m2r_wb"),seq:["Fetch","Decode (MemRead)","Read base + offset","ALU computes address","Read data memory","Write loaded value"]};
    if(mn==="STUR")return {nodes:base.concat("regfile","reg2loc","signext","alusrc","alu","aluctrl","dmem"),edges:be.concat("imem_rf","imem_r2","imem_se","r2_rf","rf_a","se_alusrc","alusrc_alu","alu_dmem","b_dmemwr"),seq:["Fetch","Decode (MemWrite)","Read base + value","ALU computes address","Write to data memory","(no write-back)"]};
    if(f==="CB")return {nodes:base.concat("regfile","reg2loc","alu","signext","shift2","baddr","band"),edges:be.concat("imem_rf","imem_r2","r2_rf","rf_a","alusrc_alu","se_shift","shift_b","pc_b","b_pcsrc","ctrl_br","alu_zero","band_pcsrc"),seq:["Fetch","Decode (Branch=1)","ALU tests for zero","Shift offset <<2","Branch adder","Branch if Zero & Branch"]};
    if(f==="B")return {nodes:base.concat("signext","shift2","baddr"),edges:be.concat("imem_se","se_shift","shift_b","pc_b","b_pcsrc"),seq:["Fetch","Decode (Uncondbranch=1)","Shift offset <<2","Branch adder","PCSrc selects branch"]};
    return {nodes:base,edges:be,seq:["Fetch"]};
  }
  var INFO={
    pc:{t:"Program Counter",d:"64-bit register holding the address of the current instruction. Updated each cycle by PCSrc.",io:"in: next address &middot; out: instruction address"},
    pc4:{t:"PC + 4 Adder",d:"Computes the sequential next address (PC+4) for non-branch flow.",io:"in: PC &middot; out: PC+4"},
    imem:{t:"Instruction Memory",d:"Read-only array; returns the 32-bit instruction at the PC address. Click to open its internals.",io:"in: address &middot; out: Instruction[31-0]"},
    control:{t:"Main Control Unit",d:"Decodes Instr[31-21] into all datapath control signals. Click for the decoder + signal map.",io:"in: opcode &middot; out: Reg2Loc, ALUSrc, MemtoReg, RegWrite, MemRead, MemWrite, Branch, ALUOp..."},
    regfile:{t:"Register File",d:"32 x 64-bit registers, two read ports + one write port. Click for decoders, array and read muxes.",io:"in: Read reg 1/2, Write reg, Write data, RegWrite &middot; out: Read data 1/2"},
    reg2loc:{t:"Reg2Loc MUX",d:"Selects which instruction field drives Read register 2 (Rm for R-type, Rt for stores/branches).",io:"sel: Reg2Loc"},
    signext:{t:"Sign-Extend / Immediate",d:"Selects and sign/zero-extends the immediate to 64 bits; branch offsets are shifted left by 2.",io:"in: Instr[31-0] &middot; out: imm[63:0]"},
    alusrc:{t:"ALUSrc MUX",d:"Chooses the ALU's second operand: Read data 2 (0) or the sign-extended immediate (1).",io:"sel: ALUSrc"},
    alu:{t:"ALU",d:"64-bit arithmetic/logic unit. Click to see the bit-slice: full adders, AND/OR/XOR, op mux and zero detect.",io:"in: BusA, operand &middot; out: ALU result, Zero"},
    aluctrl:{t:"ALU Control",d:"Combines ALUOp with the function field to pick the exact ALU operation.",io:"in: ALUOp, funct &middot; out: ALU operation"},
    dmem:{t:"Data Memory",d:"Byte/doubleword addressed memory for loads & stores. Click for decoder, cells and cache view.",io:"in: Address, Write data, MemRead, MemWrite &middot; out: Read data"},
    memtoreg:{t:"MemToReg MUX",d:"Selects the write-back value: ALU result (0) or data-memory read (1).",io:"sel: MemtoReg"},
    shift2:{t:"Shift-Left-2",d:"Shifts the branch offset left by 2 (word-aligned byte offset).",io:"in: imm &middot; out: imm<<2"},
    baddr:{t:"Branch Target Adder",d:"Adds PC to the shifted offset to form the branch target address.",io:"in: PC, imm<<2 &middot; out: branch target"},
    band:{t:"Branch AND",d:"ANDs the Branch control with the ALU Zero flag to decide a conditional branch.",io:"in: Branch, Zero &middot; out: PCSrc (cond)"},
    pcsrc:{t:"PCSrc MUX",d:"Selects the next PC: PC+4 (0) or the branch/jump target (1).",io:"sel: PCSrc"}
  };

  /* ===================== DRILL SCENES (verified) ======================== */
  function mosfet(x,y,type,gateLab,labels){var bub=type==="p"?'<circle cx="'+(x-16)+'" cy="'+y+'" r="3.5" class="tx" fill="#070b13"/>':'';var Lb=labels||{};
    return '<line class="tx" x1="'+(x-40)+'" y1="'+y+'" x2="'+(x-(type==="p"?20:13))+'" y2="'+y+'"/>'+'<line class="tx" x1="'+(x-13)+'" y1="'+(y-16)+'" x2="'+(x-13)+'" y2="'+(y+16)+'"/>'+bub+'<line class="tx" x1="'+x+'" y1="'+(y-22)+'" x2="'+x+'" y2="'+(y+22)+'"/>'+'<line class="tx" x1="'+(x-13)+'" y1="'+(y-11)+'" x2="'+x+'" y2="'+(y-11)+'"/>'+'<line class="tx" x1="'+(x-13)+'" y1="'+(y+11)+'" x2="'+x+'" y2="'+(y+11)+'"/>'+'<line class="tx" x1="'+x+'" y1="'+(y-22)+'" x2="'+(x+26)+'" y2="'+(y-22)+'"/>'+'<line class="tx" x1="'+x+'" y1="'+(y+22)+'" x2="'+(x+26)+'" y2="'+(y+22)+'"/>'+'<text class="sm" x="'+(x-44)+'" y="'+(y-4)+'" text-anchor="end">G '+(gateLab||"")+'</text>'+'<text class="sm" x="'+(x+30)+'" y="'+(y-20)+'">D '+(Lb.d||"")+'</text>'+'<text class="sm" x="'+(x+30)+'" y="'+(y+26)+'">S '+(Lb.s||"")+'</text>';}
  function gateSym(kind,x,y){var w=58,h=44,cy=y+h/2,out=[x+w+(kind==="not"?8:0),cy],bub='',body='';
    if(kind==="and"||kind==="nand"){body='<path class="gate" d="M'+x+' '+y+' h'+(w*0.45)+' a'+(h/2)+' '+(h/2)+' 0 0 1 0 '+h+' h-'+(w*0.45)+' z"/>';if(kind==="nand"){bub='<circle class="gate" cx="'+(x+w+6)+'" cy="'+cy+'" r="5" fill="#070b13"/>';out=[x+w+11,cy];}}
    else if(kind==="or"||kind==="nor"||kind==="xor"){var ox=kind==="xor"?x+6:x;body='<path class="gate" d="M'+ox+' '+y+' q'+(w*0.7)+' 4 '+(w)+' '+(h/2)+' q-'+(w*0.3)+' '+(h/2-2)+' -'+w+' '+(h/2)+' q'+(w*0.28)+' -'+(h/2)+' 0 -'+h+' z"/>';if(kind==="xor")body+='<path class="gate" fill="none" d="M'+(x)+' '+y+' q'+(w*0.28)+' '+(h/2)+' 0 '+h+'"/>';if(kind==="nor")bub='<circle class="gate" cx="'+(x+w+6)+'" cy="'+cy+'" r="5" fill="#070b13"/>';out=[kind==="nor"?x+w+11:x+w,cy];}
    else if(kind==="not"){body='<path class="gate" d="M'+x+' '+y+' L'+(x+w-6)+' '+cy+' L'+x+' '+(y+h)+' z"/><circle class="gate" cx="'+(x+w)+'" cy="'+cy+'" r="5" fill="#070b13"/>';out=[x+w+5,cy];}
    var inP=kind==="not"?[[x,cy]]:[[x+2,y+h*0.3],[x+2,y+h*0.7]];return {svg:body+bub,inP:inP,out:out};}
  function scene(w,h,fn){var out=[];var api={
    raw:function(s){out.push(s);},
    label:function(x,y,t,sz){out.push('<text x="'+x+'" y="'+y+'" font-size="'+(sz||12)+'">'+t+'</text>');},
    wire:function(pts){out.push('<polyline class="wire" points="'+pts.map(function(p){return p[0]+","+p[1];}).join(" ")+'"/>');},
    rail:function(pts,lab){out.push('<polyline class="rail" points="'+pts.map(function(p){return p[0]+","+p[1];}).join(" ")+'"/>');out.push('<text class="sm" x="'+(pts[0][0]-30)+'" y="'+(pts[0][1]+4)+'">'+lab+'</text>');},
    blk:function(x,y,w2,h2,t,link){out.push('<g class="blk'+(link?" hot":"")+'"'+(link?' data-scene="'+link+'"':'')+'><rect class="blk" x="'+x+'" y="'+y+'" width="'+w2+'" height="'+h2+'" rx="7"/><text x="'+(x+w2/2)+'" y="'+(y+h2/2+4)+'" text-anchor="middle" font-size="11">'+t+'</text></g>');},
    hotrect:function(x,y,w2,h2,t,link){out.push('<g class="hot" data-scene="'+link+'"><rect class="gate" x="'+x+'" y="'+y+'" width="'+w2+'" height="'+h2+'" rx="7"/><text x="'+(x+w2/2)+'" y="'+(y+h2/2+4)+'" text-anchor="middle" font-size="11" class="ttl">'+t+'</text></g>');},
    gate:function(kind,x,y,link){var g=gateSym(kind,x,y);out.push('<g class="'+(link?"hot":"")+'"'+(link?' data-scene="'+link+'"':'')+'>'+g.svg+'</g>');return g;}
  };fn(api);return {w:w,h:h,inner:out.join("")};}
  function truth(s,kind,x,y){var rows;if(kind==="not")rows=[["A","Y"],["0","1"],["1","0"]];else{var f={and:function(a,b){return a&b;},or:function(a,b){return a|b;},xor:function(a,b){return a^b;},nand:function(a,b){return 1-(a&b);},nor:function(a,b){return 1-(a|b);}}[kind];rows=[["A","B","Y"]];[[0,0],[0,1],[1,0],[1,1]].forEach(function(p){rows.push([p[0]+"",p[1]+"",f(p[0],p[1])+""]);});}rows.forEach(function(r,i){r.forEach(function(c,j){s.label(x+j*34,y+18+i*20,c,i===0?11:10);});});}
  function gateScene(kind,title,eq,txid){return {title:title+" — gate",desc:eq+".  Click View transistors to drop to the CMOS level.",scene:scene(520,240,function(s){var g=gateSym(kind,200,90);s.raw(g.svg);s.label(40,108,"A",12);if(kind!=="not")s.label(40,150,"B",12);s.wire([[60,100],g.inP[0]]);if(g.inP[1])s.wire([[60,144],g.inP[1]]);s.wire([g.out,[g.out[0]+70,g.out[1]]]);s.label(g.out[0]+76,g.out[1]+4,"Y",12);s.hotrect(40,190,180,34,"View transistors →",txid);truth(s,kind,330,40);})};}
  function composed(title,desc,childIds){return {title:title,desc:desc,scene:scene(560,150,function(s){var x=40;childIds.forEach(function(id,i){s.hotrect(x,50,150,48,id.split(":")[1].toUpperCase(),id);if(i<childIds.length-1)s.wire([[x+150,74],[x+170,74]]);x+=170;});s.label(40,30,"Click a block to open its CMOS transistors",10);})};}
  var SCENES={
    alu:function(){return {title:"ALU — 1-bit slice",desc:"Each bit pairs a full adder with AND/OR logic; a mux picks the result by ALUOp. Click the Full Adder or a gate to go deeper.",scene:scene(680,300,function(s){s.label(20,28,"A, B, Cin",10);s.blk(120,40,120,56,"Full Adder","fulladder");s.blk(120,120,120,40,"AND","gate:and");s.blk(120,176,120,40,"OR","gate:or");s.blk(360,90,110,90,"4:1 MUX","mux");s.label(500,120,"Result",12);s.label(500,60,"Cout",12);s.wire([[100,68],[120,68]]);s.wire([[100,140],[120,140]]);s.wire([[100,196],[120,196]]);s.wire([[240,60],[360,108]]);s.wire([[240,140],[360,135]]);s.wire([[240,196],[360,162]]);s.wire([[240,52],[300,52],[300,40],[470,40],[470,60]]);s.wire([[470,135],[498,120]]);s.label(360,210,"sel = ALUOp",10);})};},
    fulladder:function(){return {title:"Full Adder — gate level",desc:"Sum = A xor B xor Cin.  Cout = (A and B) or (Cin and (A xor B)). Click any gate for its CMOS transistors.",scene:scene(700,300,function(s){s.label(16,40,"A",12);s.label(16,80,"B",12);s.label(16,150,"Cin",12);s.gate("xor",120,40,"gate:xor");s.gate("xor",300,90,"gate:xor");s.gate("and",120,150,"gate:and");s.gate("and",300,180,"gate:and");s.gate("or",470,170,"gate:or");s.label(600,120,"Sum",12);s.label(600,190,"Cout",12);s.wire([[40,46],[120,53]]);s.wire([[40,86],[120,75]]);s.wire([[186,62],[300,103]]);s.wire([[40,150],[300,125]]);s.wire([[366,112],[596,112]]);s.wire([[40,52],[80,52],[80,160],[120,160]]);s.wire([[40,92],[90,92],[90,176],[120,176]]);s.wire([[186,62],[250,62],[250,190],[300,190]]);s.wire([[40,150],[260,150],[260,206],[300,206]]);s.wire([[366,172],[440,172],[440,180],[470,180]]);s.wire([[366,196],[470,196]]);s.wire([[540,186],[596,186]]);})};},
    mux:function(){return {title:"2:1 MUX — gate level",desc:"Y = (A and sel') or (B and sel). A 4:1 mux chains three of these. Click a gate for transistors.",scene:scene(640,260,function(s){s.label(16,40,"A",12);s.label(16,150,"B",12);s.label(16,210,"sel",12);s.gate("not",110,200,"gate:not");s.gate("and",230,40,"gate:and");s.gate("and",230,150,"gate:and");s.gate("or",420,95,"gate:or");s.label(560,118,"Y",12);s.wire([[40,46],[230,53]]);s.wire([[40,150],[230,163]]);s.wire([[40,210],[110,222]]);s.wire([[174,222],[200,222],[200,75],[230,75]]);s.wire([[40,210],[210,210],[210,186],[230,186]]);s.wire([[296,62],[420,107]]);s.wire([[296,172],[420,131]]);s.wire([[490,119],[556,119]]);})};},
    "gate:not":function(){return gateScene("not","NOT (inverter)","Y = NOT A","tx:not");},
    "gate:and":function(){return gateScene("and","AND","Y = A and B","tx:and");},
    "gate:or":function(){return gateScene("or","OR","Y = A or B","tx:or");},
    "gate:xor":function(){return gateScene("xor","XOR","Y = A xor B","tx:xor");},
    "gate:nand":function(){return gateScene("nand","NAND","Y = NOT(A and B)","tx:nand");},
    "gate:nor":function(){return gateScene("nor","NOR","Y = NOT(A or B)","tx:nor");},
    "tx:not":function(){return {title:"Inverter — CMOS transistors",desc:"One PMOS pulls the output HIGH when A=0; one NMOS pulls it LOW when A=1. Note the gate (G), source (S) and drain (D) terminals.",scene:scene(520,320,function(s){s.rail([[60,40],[460,40]],"VDD");s.rail([[60,290],[460,290]],"GND");s.raw(mosfet(300,90,"p","A",{d:"Y",s:"VDD"}));s.raw(mosfet(300,230,"n","A",{d:"Y",s:"GND"}));s.wire([[300,68],[300,40]]);s.wire([[300,252],[300,290]]);s.wire([[326,112],[360,112],[360,208],[326,208]]);s.wire([[360,160],[470,160]]);s.label(474,164,"Y",12);s.wire([[260,90],[150,90],[150,230],[260,230]]);s.wire([[150,160],[40,160]]);s.label(20,164,"A",12);})};},
    "tx:nand":function(){return {title:"NAND2 — CMOS transistors",desc:"Two PMOS in parallel pull HIGH; two NMOS in series pull LOW. Output is low only when A and B are both high.",scene:scene(560,340,function(s){s.rail([[60,40],[500,40]],"VDD");s.rail([[60,310],[500,310]],"GND");s.raw(mosfet(250,90,"p","A",{d:"Y",s:"VDD"}));s.raw(mosfet(360,90,"p","B",{d:"Y",s:"VDD"}));s.wire([[250,68],[250,40]]);s.wire([[360,68],[360,40]]);s.wire([[276,112],[276,150],[386,150],[386,112]]);s.wire([[331,150],[331,170]]);s.raw(mosfet(300,210,"n","A",{d:"Y",s:""}));s.raw(mosfet(300,280,"n","B",{d:"",s:"GND"}));s.wire([[300,188],[300,150]]);s.wire([[300,232],[300,258]]);s.wire([[300,302],[300,310]]);s.wire([[331,150],[470,150]]);s.label(474,154,"Y",12);s.label(60,200,"A,B gates",10);})};},
    "tx:nor":function(){return {title:"NOR2 — CMOS transistors",desc:"Two PMOS in series pull HIGH; two NMOS in parallel pull LOW. Output is high only when A and B are both low.",scene:scene(560,340,function(s){s.rail([[60,40],[500,40]],"VDD");s.rail([[60,310],[500,310]],"GND");s.raw(mosfet(300,80,"p","A",{d:"",s:"VDD"}));s.raw(mosfet(300,150,"p","B",{d:"Y",s:""}));s.wire([[300,58],[300,40]]);s.wire([[300,102],[300,128]]);s.wire([[300,172],[300,200]]);s.raw(mosfet(250,250,"n","A",{d:"Y",s:"GND"}));s.raw(mosfet(370,250,"n","B",{d:"Y",s:"GND"}));s.wire([[300,172],[470,172]]);s.label(474,176,"Y",12);s.wire([[250,228],[250,200],[370,200],[370,228]]);s.wire([[250,272],[250,310]]);s.wire([[370,272],[370,310]]);})};},
    "tx:and":function(){return composed("AND = NAND + INV","An AND gate is a NAND followed by an inverter.",["gate:nand","gate:not"]);},
    "tx:or":function(){return composed("OR = NOR + INV","An OR gate is a NOR followed by an inverter.",["gate:nor","gate:not"]);},
    "tx:xor":function(){return composed("XOR from primitives","XOR is built from AND/OR/NOT (or NANDs). Drill those for transistors.",["gate:and","gate:or","gate:not"]);},
    imem:function(){return {title:"Instruction Memory",desc:"A read-only array addressed by the PC. The 32-bit word is the instruction; its bit-fields tap off to control and the register file.",scene:scene(640,220,function(s){s.blk(40,70,120,70,"Address decoder","");s.blk(220,40,150,130,"ROM array","");s.blk(430,80,150,50,"Instruction[31-0]","");s.wire([[10,105],[40,105]]);s.label(8,100,"PC",10);s.wire([[160,105],[220,105]]);s.wire([[370,105],[430,105]]);s.label(430,160,"→ opcode, Rn, Rm, Rt, imm taps",10);})};},
    regfile:function(){return {title:"Register File",desc:"32 registers, two read ports + one write port. Read decoders select registers onto BusA/BusB through muxes; RegWrite + a write decoder route the write-back on the clock edge. Click a port mux for its gates.",scene:scene(680,300,function(s){s.blk(40,30,120,40,"Read decoder 1","");s.blk(40,90,120,40,"Read decoder 2","");s.blk(40,200,120,40,"Write decoder","");s.blk(230,30,150,210,"32 × register array","");s.blk(450,40,120,40,"Read mux 1","mux");s.blk(450,110,120,40,"Read mux 2","mux");s.label(600,64,"BusA",11);s.label(600,134,"BusB",11);s.wire([[380,60],[450,60]]);s.wire([[380,130],[450,130]]);s.wire([[570,60],[596,60]]);s.wire([[570,130],[596,130]]);s.wire([[160,50],[230,50]]);s.wire([[160,110],[230,110]]);s.wire([[160,220],[230,220]]);s.label(40,270,"RegWrite + Clock enable the write port",10);})};},
    dmem:function(){return {title:"Data Memory + Cache",desc:"Loads/stores hit the L1 cache first (tag/index/offset split). A miss falls through to L2, then main memory. MemRead/MemWrite gate the ports. Click a cache for its sets and ways.",scene:scene(700,260,function(s){s.label(16,30,"address",10);s.blk(40,50,120,50,"Tag | Index | Offset","");s.blk(210,40,120,70,"L1 cache","cache");s.blk(380,40,120,70,"L2 cache","cache");s.blk(550,40,120,70,"Main memory","");s.wire([[160,75],[210,75]]);s.wire([[330,75],[380,75]]);s.wire([[500,75],[550,75]]);s.label(210,135,"hit → read data",10);s.label(380,135,"miss →",10);s.label(40,180,"MemRead gates the read port · MemWrite stores write-data on the clock edge",9);})};},
    cache:function(){return {title:"Cache — set-associative",desc:"The index picks a set; tags in each way are compared to the address tag; a hit selects that way's data block by the offset. Misses trigger a fill and (LRU) replacement.",scene:scene(640,240,function(s){s.blk(40,40,120,150,"Sets","");s.blk(220,40,90,60,"Way 0 tag|data","");s.blk(220,120,90,60,"Way 1 tag|data","");s.blk(360,70,90,60,"Tag compare","");s.blk(500,80,110,50,"Hit? → data","");s.wire([[160,115],[220,70]]);s.wire([[160,115],[220,150]]);s.wire([[310,70],[360,95]]);s.wire([[310,150],[360,105]]);s.wire([[450,100],[500,105]]);})};},
    control:function(){return {title:"Control Unit",desc:"Decodes the 11-bit opcode (casez with wildcards in the Verilog) into datapath control lines. Unsupported opcodes fall through to all-zero defaults so the machine safely does nothing.",scene:scene(680,260,function(s){s.blk(40,90,140,60,"Opcode decoder","");s.label(16,80,"Instr[31-21]",9);var outs=["RegWrite","ALUSrc","MemRead","MemWrite","MemtoReg","Reg2Loc","Branch","ALUOp","MovZ"];for(var i=0;i<outs.length;i++){var yy=24+i*24;s.wire([[180,120],[300,yy]]);s.label(306,yy+4,outs[i],10);}})};},
    signext:function(){return {title:"Sign-Extend / Immediate",desc:"Selects the right immediate field by format (I/D/CB/B), then sign- or zero-extends it to 64 bits; branch offsets shift left by 2. With MovZ it zero-extends the 16-bit field to hw·16.",scene:scene(640,200,function(s){s.blk(40,60,130,70,"Format select","");s.blk(230,40,150,50,"Sign / zero extend","");s.blk(230,110,150,50,"Shift left 2","");s.blk(440,70,130,50,"imm[63:0]","");s.wire([[170,80],[230,65]]);s.wire([[170,110],[230,135]]);s.wire([[380,65],[440,90]]);s.wire([[380,135],[440,100]]);})};},
    aluctrl:function(){return SCENES.alu();}
  };

  /* ============================== DOM SHELL ============================= */
  mount.innerHTML +=
    '<div class="lab-tabs">'+
      '<button class="lab-tab on" data-pane="dp" type="button">Datapath</button>'+
      '<button class="lab-tab" data-pane="code" type="button">C / Assembly / Binary</button>'+
    '</div>'+
    '<div class="lab-pane on" data-pane="dp"><div class="shell">'+
      '<div class="stagewrap">'+
        '<div class="canvas" id="lbCanvas">'+
          '<div class="crumb" id="lbCrumb"><b>CPU datapath</b></div>'+
          '<div class="zoomctl"><button class="zb" id="lbZin" type="button">+</button><button class="zb" id="lbZout" type="button">&minus;</button><button class="zb" id="lbFit" type="button" title="fit">&#9633;</button></div>'+
          '<div class="hint" id="lbHint">drag to pan &middot; scroll to zoom &middot; click a component to open it</div>'+
          '<div class="scenehead" id="lbSceneHead" style="display:none"></div>'+
        '</div>'+
        '<div class="timeline">'+
          '<div class="stages" id="lbStages"></div>'+
          '<div class="tbtns">'+
            '<button class="btn btn-ghost" id="lbBack" type="button" style="display:none">&larr; Back</button>'+
            '<button class="btn btn-ghost" id="lbStep" type="button">Step</button>'+
            '<button class="btn btn-primary" id="lbRun" type="button">Auto-run</button>'+
            '<button class="btn btn-ghost" id="lbReset" type="button">Reset</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="side">'+
        '<div class="card"><h4>Instruction</h4>'+
          '<div class="selrow">'+
            '<label class="f">Type<select id="lbCat"></select></label>'+
            '<label class="f">Op<select id="lbInst"></select></label>'+
          '</div><div class="selrow" id="lbOps"></div>'+
          '<div class="asm" id="lbAsm"></div>'+
          '<div style="margin-top:8px" class="ceq" id="lbCeq"></div>'+
        '</div>'+
        '<div class="card"><h4>Binary encoding <span style="color:var(--ink-dim);font-weight:600" id="lbHex"></span></h4>'+
          '<div class="bits" id="lbBits"></div>'+
          '<table class="kv" id="lbFields" style="margin-top:9px"></table>'+
        '</div>'+
        '<div class="card"><h4>Control signals</h4><table class="kv" id="lbCtrl"></table></div>'+
        '<div class="card"><h4>Inspector</h4><div class="insp" id="lbInsp">Hover or click a component to inspect it.</div></div>'+
        '<div class="card"><h4>Machine state</h4><div class="state" id="lbState"></div></div>'+
      '</div>'+
    '</div></div>'+
    '<div class="lab-pane" data-pane="code">'+
      '<div class="opbar"><span>Write in:</span><button class="chip on" id="lbEditAsm" type="button">Assembly</button><button class="chip" id="lbEditC" type="button">C</button>'+
        '<span style="margin-left:14px">Binary:</span><button class="chip on" id="lbEndBig" type="button">Big-endian</button><button class="chip" id="lbEndLit" type="button">Little-endian</button>'+
        '<span style="margin-left:auto;color:var(--ink-dim)">hover any line to trace it across C &middot; ASM &middot; binary</span></div>'+
      '<div class="ed3">'+
        '<div class="epanel"><div class="ehead"><span class="tagc">C</span><span>high-level</span></div><div class="ebody" id="cBody"><div class="hlbar" id="cHl"></div><textarea class="code" id="cText" spellcheck="false"></textarea><div class="rows" id="cRows" style="display:none"></div></div></div>'+
        '<div class="epanel"><div class="ehead"><span class="taga">ARMv8 ASSEMBLY</span><span>instructions</span></div><div class="ebody" id="aBody"><div class="hlbar" id="aHl"></div><textarea class="code" id="aText" spellcheck="false"></textarea><div class="rows" id="aRows" style="display:none"></div></div></div>'+
        '<div class="epanel"><div class="ehead"><span class="tagb">BINARY</span><span>machine code</span></div><div class="ebody"><div class="rows bin" id="bRows"></div></div></div>'+
      '</div>'+
      '<div class="card" style="margin-top:12px"><h4>Selected line &rarr; datapath</h4><div id="lbPick" style="font:600 .8rem var(--mono);color:var(--ink-soft)">Click a line to load it into the Datapath tab.</div></div>'+
    '</div>';

  var $=function(id){return document.getElementById(id);};

  /* fill category + instruction selects */
  var catSel=$("lbCat"),instSel=$("lbInst");
  Object.keys(CATS).forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c;catSel.appendChild(o);});
  function fillInst(cat){instSel.innerHTML="";CATS[cat].forEach(function(mn){var o=document.createElement("option");o.value=mn;o.textContent=mn;instSel.appendChild(o);});}
  fillInst("R-type");

  /* ===== build datapath svg ===== */
  var svg=document.createElementNS(NS,"svg");svg.setAttribute("class","dp");svg.setAttribute("viewBox","0 0 1050 500");svg.setAttribute("preserveAspectRatio","xMidYMid meet");$("lbCanvas").appendChild(svg);
  var vp=el("g");svg.appendChild(vp);
  function el(t){return document.createElementNS(NS,t);}
  function aluPts(n){var x=n.x,y=n.y,w=n.w,h=n.h;return [[x,y],[x+w,y+h*0.22],[x+w,y+h*0.78],[x,y+h],[x,y+h*0.62],[x+w*0.28,y+h/2],[x,y+h*0.38]].map(function(p){return p[0]+","+p[1];}).join(" ");}

  var dpGroup=null,exGroup=null,nodeEl={},edgeEl={};
  function buildDatapath(){
    vp.innerHTML="";dpGroup=el("g");vp.appendChild(dpGroup);
    // grid
    var g0=el("g");for(var gx=0;gx<=1050;gx+=42){var l=el("line");l.setAttribute("x1",gx);l.setAttribute("y1",0);l.setAttribute("x2",gx);l.setAttribute("y2",500);l.setAttribute("class","gridbg");g0.appendChild(l);}for(var gy=0;gy<=500;gy+=42){var l2=el("line");l2.setAttribute("x1",0);l2.setAttribute("y1",gy);l2.setAttribute("x2",1050);l2.setAttribute("y2",gy);l2.setAttribute("class","gridbg");g0.appendChild(l2);}dpGroup.appendChild(g0);
    var gE=el("g"),gN=el("g"),gP=el("g");dpGroup.appendChild(gE);dpGroup.appendChild(gN);dpGroup.appendChild(gP);
    edgeEl={};Object.keys(E).forEach(function(id){var e=E[id];var pl=el("polyline");pl.setAttribute("points",poly(e.p));pl.setAttribute("class","ed");gE.appendChild(pl);edgeEl[id]=pl;if(e.l){var mid=e.p[Math.floor(e.p.length/2)];var tx=el("text");tx.setAttribute("x",mid[0]+4);tx.setAttribute("y",mid[1]-4);tx.setAttribute("class","elab");tx.setAttribute("data-for",id);tx.textContent=e.l;gE.appendChild(tx);}});
    nodeEl={};Object.keys(N).forEach(function(id){var n=N[id],g=el("g");g.setAttribute("class","nd"+(n.mux?" mux":"")+(n.ell?" ctrl":"")+(n.alu?" alu":""));if(n.click)g.setAttribute("data-click",n.click);
      var shape;if(n.mux){shape=el("rect");shape.setAttribute("rx","12");}else if(n.ell){shape=el("ellipse");shape.setAttribute("cx",n.x+n.w/2);shape.setAttribute("cy",n.y+n.h/2);shape.setAttribute("rx",n.w/2);shape.setAttribute("ry",n.h/2);}else if(n.alu){shape=el("polygon");shape.setAttribute("points",aluPts(n));}else{shape=el("rect");shape.setAttribute("rx","8");}
      if(!n.ell&&!n.alu){shape.setAttribute("x",n.x);shape.setAttribute("y",n.y);shape.setAttribute("width",n.w);shape.setAttribute("height",n.h);}g.appendChild(shape);
      if(n.t){var t=el("text");t.setAttribute("x",n.x+n.w/2);t.setAttribute("y",n.titleTop?(n.y+15):(n.y+n.h/2+(n.s?-2:4)));t.setAttribute("text-anchor","middle");t.textContent=n.t;g.appendChild(t);}
      if(n.s){var s2=el("text");s2.setAttribute("class","sub");s2.setAttribute("x",n.x+n.w/2);s2.setAttribute("y",n.y+n.h/2+12);s2.setAttribute("text-anchor","middle");s2.textContent=n.s;g.appendChild(s2);}
      if(n.mux){[["0",n.y+16],["1",n.y+n.h-8]].forEach(function(p){var mt=el("text");mt.setAttribute("class","musel");mt.setAttribute("x",n.x+7);mt.setAttribute("y",p[1]);mt.textContent=p[0];g.appendChild(mt);});}
      if(INFO[id]){g.addEventListener("mouseenter",function(){inspect(id);});}
      if(n.click)g.addEventListener("click",function(ev){ev.stopPropagation();if(!panMoved)openEx(id,n.click);});
      gN.appendChild(g);nodeEl[id]=g;
    });
    PORTS.forEach(function(p){var t=el("text");t.setAttribute("x",p[0]);t.setAttribute("y",p[1]);t.setAttribute("class",p[3]);t.textContent=p[2];gP.appendChild(t);});
    exGroup=el("g");exGroup.setAttribute("class","exlayer");vp.appendChild(exGroup);
  }
  function poly(p){return p.map(function(q){return q[0]+","+q[1];}).join(" ");}

  /* ===== zoom / pan ===== */
  var k=1,tx=0,ty=0,VBW=1050,VBH=500;
  function applyVP(){vp.setAttribute("transform","translate("+tx+","+ty+") scale("+k+")");}
  function fit(){k=1;tx=0;ty=0;applyVP();}
  var panning=false,panMoved=false,sx=0,sy=0;
  svg.addEventListener("pointerdown",function(e){panning=true;panMoved=false;sx=e.clientX;sy=e.clientY;svg.classList.add("drag");svg.setPointerCapture&&svg.setPointerCapture(e.pointerId);});
  svg.addEventListener("pointermove",function(e){if(!panning)return;var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>4)panMoved=true;var r=svg.getBoundingClientRect();var scale=VBW/r.width;tx+=dx*scale;ty+=dy*scale;sx=e.clientX;sy=e.clientY;applyVP();});
  svg.addEventListener("pointerup",function(){panning=false;svg.classList.remove("drag");});
  svg.addEventListener("wheel",function(e){e.preventDefault();var r=svg.getBoundingClientRect();var mx=(e.clientX-r.left)/r.width*VBW,my=(e.clientY-r.top)/r.height*VBH;var f=e.deltaY>0?0.9:1.1;var nk=Math.max(0.5,Math.min(4,k*f));tx=mx-(mx-tx)*(nk/k);ty=my-(my-ty)*(nk/k);k=nk;applyVP();},{passive:false});
  $("lbZin").addEventListener("click",function(){k=Math.min(4,k*1.2);applyVP();});
  $("lbZout").addEventListener("click",function(){k=Math.max(0.5,k/1.2);applyVP();});
  $("lbFit").addEventListener("click",fit);

  /* ===== in-place expansion ===== */
  var ex=null;                       // {node, path:[sceneId...]}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function boxOf(id){var n=N[id];return {x:n.x,y:n.y,w:n.w,h:n.h,cx:n.x+n.w/2,cy:n.y+n.h/2};}
  function inBox(p,b,m){m=m||22;return p[0]>=b.x-m&&p[0]<=b.x+b.w+m&&p[1]>=b.y-m&&p[1]<=b.y+b.h+m;}
  function nodeAt(p,excl){var best="",bd=1e9;for(var id in N){if(id===excl)continue;var b=boxOf(id);if(inBox(p,b,8))return id;var d=Math.hypot(p[0]-b.cx,p[1]-b.cy);if(d<bd){bd=d;best=id;}}return best;}
  function sideOf(p,b){var dx=p[0]-b.cx,dy=p[1]-b.cy;return Math.abs(dx)>=Math.abs(dy)?(dx<0?"L":"R"):(dy<0?"T":"B");}
  var MUXNM={reg2loc:"Reg2Loc mux",alusrc:"ALUSrc mux",memtoreg:"MemToReg mux",pcsrc:"PCSrc mux"};
  function nm(id){if(!id)return"";if(MUXNM[id])return MUXNM[id];var n=N[id];if(!n)return id;return (n.t||id)+(n.s?" "+n.s:"");}
  var IOEXTRA={alu:[{side:"B",label:"ALUOp",neigh:"aluctrl",ctrl:1}],aluctrl:[{side:"B",label:"ALUOp",neigh:"aluctrl",ctrl:1}],regfile:[{side:"B",label:"RegWrite + Clock",neigh:"control",ctrl:1}],dmem:[{side:"B",label:"MemRead / MemWrite",neigh:"control",ctrl:1}],control:[{side:"R",label:"all control signals",neigh:"",ctrl:1}]};
  function connectionsFor(id){var b=boxOf(id),res=[];for(var eid in E){var p=E[eid].p,a=p[0],z=p[p.length-1];var ia=inBox(a,b),iz=inBox(z,b);if(ia===iz)continue;var near=ia?a:z,far=ia?z:a;res.push({label:E[eid].l||"",near:near,far:far,side:sideOf(near,b),neigh:nodeAt(far,id),pts:p});}return res;}
  function sceneTitle(id){return SCENES[id]().title.split(" —")[0];}

  function renderEx(){
    if(!ex)return;
    var node=ex.node, o=SCENES[ex.path[ex.path.length-1]](), b=boxOf(node);
    var PW=520,PH=320,px=clamp(b.cx-PW/2,168,1050-178-PW),py=clamp(b.cy-PH/2,118,500-14-PH);
    var conns=ex.path.length===1?connectionsFor(node):[];
    var bySide={L:[],R:[],T:[],B:[]};conns.forEach(function(c){bySide[c.side].push(c);});
    if(ex.path.length===1)(IOEXTRA[node]||[]).forEach(function(x){bySide[x.side].push(x);});
    var out=['<rect class="exbg" x="0" y="0" width="1050" height="500"/>'];
    conns.forEach(function(c){out.push('<polyline class="exwire" points="'+poly(c.pts)+'"/>');});
    out.push('<g class="expanel"><rect class="bg" x="'+px+'" y="'+py+'" width="'+PW+'" height="'+PH+'" rx="12"/><rect class="exhead" x="'+px+'" y="'+py+'" width="'+PW+'" height="30" rx="12"/>');
    var titles=ex.path.map(sceneTitle);
    out.push('<text class="extitle" x="'+(px+12)+'" y="'+(py+20)+'">'+titles.map(function(tt,i){return i<titles.length-1?'<tspan class="excrumbt" data-i="'+i+'">'+tt+' &#8250; </tspan>':'<tspan>'+tt+'</tspan>';}).join("")+'</text>');
    out.push('<g class="exclose" data-close="1"><circle cx="'+(px+PW-16)+'" cy="'+(py+15)+'" r="9"/><text x="'+(px+PW-16)+'" y="'+(py+19)+'" text-anchor="middle" font-size="13">&times;</text></g>');
    var iw=PW-28,ih=PH-50,sct=Math.min(iw/o.scene.w,ih/o.scene.h),ox=px+(PW-o.scene.w*sct)/2,oy=py+34+(ih-o.scene.h*sct)/2;
    out.push('<g class="scene" transform="translate('+ox+','+oy+') scale('+sct+')">'+o.scene.inner+'</g></g>');
    function pinRow(list,side){var n=list.length;list.forEach(function(c,i){var lx,ly,labx,laby,anc,frac=n>1?i/(n-1):0.5;
      if(side==="L"){lx=px;ly=py+50+(PH-72)*frac;labx=px-8;laby=ly+3;anc="end";}
      else if(side==="R"){lx=px+PW;ly=py+50+(PH-72)*frac;labx=px+PW+8;laby=ly+3;anc="start";}
      else if(side==="T"){lx=px+74+(PW-148)*frac;ly=py;labx=lx;laby=py-7;anc="middle";}
      else{lx=px+74+(PW-148)*frac;ly=py+PH;labx=lx;laby=py+PH+15;anc="middle";}
      var txt=(c.label||"")+(c.neigh?((c.label?" ":"")+"("+nm(c.neigh)+")"):"");
      out.push('<g class="expin'+(c.ctrl?" ctrl":"")+'"><circle cx="'+lx+'" cy="'+ly+'" r="3.2"/><text x="'+labx+'" y="'+laby+'" text-anchor="'+anc+'">'+txt+'</text></g>');});}
    pinRow(bySide.L,"L");pinRow(bySide.R,"R");pinRow(bySide.T,"T");pinRow(bySide.B,"B");
    exGroup.innerHTML=out.join("");
    exGroup.querySelector(".exbg").addEventListener("click",function(){if(!panMoved)closeEx();});
    exGroup.querySelector("[data-close]").addEventListener("click",function(ev){ev.stopPropagation();closeEx();});
    Array.prototype.forEach.call(exGroup.querySelectorAll(".scene [data-scene]"),function(g){g.addEventListener("click",function(ev){ev.stopPropagation();if(!panMoved)pushEx(g.getAttribute("data-scene"));});});
    Array.prototype.forEach.call(exGroup.querySelectorAll(".excrumbt"),function(t){t.addEventListener("click",function(ev){ev.stopPropagation();ex.path=ex.path.slice(0,(+t.getAttribute("data-i"))+1);renderEx();syncCrumb();});});
    dpGroup.style.opacity=".18";
    $("lbSceneHead").style.display="";$("lbSceneHead").innerHTML="<b style='color:var(--on)'>"+o.title+"</b><br>"+o.desc;
    syncCrumb();
  }
  function openEx(nodeId,sceneId){if(ex&&ex.node===nodeId){closeEx();return;}stopRun();ex={node:nodeId,path:[sceneId]};renderEx();}
  function pushEx(sceneId){if(!ex)return;ex.path.push(sceneId);renderEx();}
  function popEx(){if(!ex)return;if(ex.path.length>1){ex.path.pop();renderEx();}else closeEx();}
  function closeEx(){ex=null;if(exGroup)exGroup.innerHTML="";dpGroup.style.opacity="";$("lbSceneHead").style.display="none";paint(curProf,true);syncCrumb();}
  function syncCrumb(){var top=$("lbCrumb");if(!ex){top.innerHTML="<b>CPU datapath</b>";$("lbBack").style.display="none";$("lbHint").style.display="";return;}
    var titles=ex.path.map(sceneTitle);
    top.innerHTML='<a data-c="-1">CPU datapath</a><span>&#8250;</span>'+titles.map(function(tt,i){return i<titles.length-1?'<a data-c="'+i+'">'+tt+'</a><span>&#8250;</span>':'<b>'+tt+'</b>';}).join("");
    Array.prototype.forEach.call(top.querySelectorAll("a"),function(a){a.addEventListener("click",function(){var c=+a.getAttribute("data-c");if(c<0)closeEx();else{ex.path=ex.path.slice(0,c+1);renderEx();}});});
    $("lbBack").style.display="";$("lbHint").style.display="none";}
  $("lbBack").addEventListener("click",popEx);

  /* ===== state ===== */
  function fresh(){var reg=new Array(32).fill(0);var seed={1:0,2:10,3:4,4:7,5:20,6:9,7:5,9:0,10:0,11:0,20:64,21:8};for(var key in seed)reg[+key]=seed[key];reg[31]=0;return{reg:reg,mem:[100,200,300,400,500,600,700,800],changed:null,memChanged:null};}
  var S=fresh();
  var cur={mn:"ADD",ops:defaults("ADD"),schema:null},curProf=profile("ADD"),stageIdx=-1;

  function buildOps(mn){cur.schema=schemaOf(mn);$("lbOps").innerHTML=cur.schema.map(function(f){if(f[2]==="sel")return '<label class="f">LSL<select id="op_'+f[0]+'"><option value="0">#0</option><option value="1">#16</option><option value="2">#32</option><option value="3">#48</option></select></label>';return '<label class="f">'+(f[2]==="reg"?"X":"")+f[0]+'<input class="num" id="op_'+f[0]+'" type="number" value="'+f[1]+'"></label>';}).join("");cur.schema.forEach(function(f){var e=$("op_"+f[0]);if(e)e.addEventListener("input",refresh);});}
  function readOps(){var o={};cur.schema.forEach(function(f){var e=$("op_"+f[0]);o[f[0]]=e?(+e.value):f[1];});return o;}
  function renderDetails(){
    var mn=cur.mn,o=cur.ops;
    $("lbAsm").textContent=asmText(mn,o);
    $("lbCeq").textContent="// "+ISA[mn].c(o);
    var F=encode(mn,o),hx=parseInt(F.map(function(x){return x.b;}).join(""),2).toString(16).toUpperCase();while(hx.length<8)hx="0"+hx;$("lbHex").textContent="0x"+hx;
    $("lbBits").innerHTML=F.map(function(f){return '<span class="bf" style="background:'+f.c+'" title="'+f.n+'">'+f.b+'</span>';}).join("");
    $("lbFields").innerHTML=F.map(function(f){return '<tr><td>'+f.n+'</td><td class="v">'+f.b.length+'b</td><td class="v" style="color:'+f.c+'">'+f.b+'</td></tr>';}).join("");
    var c=controlFor(mn),order=["Reg2Loc","ALUSrc","MemtoReg","RegWrite","MemRead","MemWrite","Branch","Uncondbranch","MovZ"];
    $("lbCtrl").innerHTML=order.map(function(kk){return '<tr class="'+(c[kk]===1?"hi":"")+'"><td>'+kk+'</td><td class="v">'+c[kk]+'</td></tr>';}).join("")+'<tr class="hi"><td>ALUOp</td><td class="v">'+ISA[mn].alu+'</td></tr>';
    renderState();
  }
  function renderState(){var show=[0,1,2,3,9,10,11,20,21,31];$("lbState").innerHTML=show.map(function(i){return '<div class="reg'+(S.changed===i?" chg":"")+'">X'+i+' <b>'+S.reg[i]+'</b></div>';}).join("")+'<div class="reg" style="grid-column:1/2">mem</div><div class="reg'+(S.memChanged!=null?" chg":"")+'" style="grid-column:2/4">['+S.mem.join(",")+']</div>';}
  function inspect(id){var n=INFO[id];if(!n)return;Array.prototype.forEach.call(svg.querySelectorAll(".nd.sel"),function(g){g.classList.remove("sel");});if(nodeEl[id])nodeEl[id].classList.add("sel");$("lbInsp").innerHTML='<b>'+n.t+'</b><br>'+n.d+'<br><span class="io">'+n.io+'</span>';}
  function renderStages(){$("lbStages").innerHTML=curProf.seq.map(function(s,i){return '<span class="schip" data-s="'+i+'">'+(i+1)+'. '+s+'</span>';}).join("");}

  function refresh(){cur.mn=instSel.value;cur.ops=readOps();curProf=profile(cur.mn);stageIdx=-1;renderDetails();renderStages();if(!ex)paint(curProf,true);}

  /* ===== animation ===== */
  function paint(prof,full){
    Object.keys(nodeEl).forEach(function(id){var g=nodeEl[id];g.classList.remove("act","dim","wr");if(prof.nodes.indexOf(id)>=0){if(full)g.classList.add("act");}else g.classList.add("dim");});
    Object.keys(edgeEl).forEach(function(id){var e=edgeEl[id];e.classList.remove("act","pulse","dim");if(prof.edges.indexOf(id)>=0){if(full)e.classList.add("act");}else e.classList.add("dim");});
    Array.prototype.forEach.call(svg.querySelectorAll(".elab"),function(t){t.classList.toggle("act",full&&prof.edges.indexOf(t.getAttribute("data-for"))>=0);});
  }
  function stageElems(prof,i){var ns=prof.nodes.slice().sort(function(a,b){return N[a].x-N[b].x;});var per=Math.ceil(ns.length/prof.seq.length);var nodes=ns.slice(i*per,i*per+per);var lo=i/prof.seq.length*1050,hi=(i+1)/prof.seq.length*1050;var edges=prof.edges.filter(function(eid){var mx=E[eid].p[0][0];return mx>=lo-150&&mx<=hi+240;});return {nodes:nodes,edges:edges};}
  function showStage(i){if(ex)return;stageIdx=i;paint(curProf,false);for(var s=0;s<=i;s++){var se=stageElems(curProf,s);se.nodes.forEach(function(id){if(nodeEl[id])nodeEl[id].classList.add("act");});se.edges.forEach(function(id){if(edgeEl[id])edgeEl[id].classList.add(s===i?"pulse":"act");});}Array.prototype.forEach.call(svg.querySelectorAll(".elab"),function(t){t.classList.toggle("act",curProf.edges.indexOf(t.getAttribute("data-for"))>=0);});
    Array.prototype.forEach.call($("lbStages").children,function(ch,idx){ch.classList.toggle("on",idx===i);ch.classList.toggle("done",idx<i);});
    if(i===curProf.seq.length-1)commit();
  }
  function commit(){var r=ISA[cur.mn].ex(S,cur.ops);S.changed=null;S.memChanged=null;if(r.reg!=null&&r.reg!==31){S.reg[r.reg]=r.val|0;S.changed=r.reg;if(nodeEl.regfile)nodeEl.regfile.classList.add("wr");}if(r.mem!=null){S.mem[r.mem]=r.val|0;S.memChanged=r.mem;if(nodeEl.dmem)nodeEl.dmem.classList.add("wr");}renderState();}
  var runT=null;function stopRun(){if(runT){clearInterval(runT);runT=null;}}
  $("lbStep").addEventListener("click",function(){if(ex)return;if(stageIdx>=curProf.seq.length-1){refresh();return;}showStage(stageIdx+1);});
  $("lbRun").addEventListener("click",function(){if(ex)return;stopRun();refresh();var i=0;runT=setInterval(function(){if(i>=curProf.seq.length){stopRun();return;}showStage(i);i++;},850);});
  $("lbReset").addEventListener("click",function(){stopRun();S=fresh();closeEx();refresh();});

  catSel.addEventListener("change",function(){fillInst(catSel.value);buildOps(instSel.value);closeEx();refresh();});
  instSel.addEventListener("change",function(){stopRun();buildOps(instSel.value);closeEx();refresh();});

  /* tabs */
  Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-tab"),function(t){t.addEventListener("click",function(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-tab"),function(x){x.classList.remove("on");});Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-pane"),function(x){x.classList.remove("on");});t.classList.add("on");document.querySelector('#cpuSim .lab-pane[data-pane="'+t.dataset.pane+'"]').classList.add("on");});});

  /* ============================== EDITOR ================================ */
  var editLang="asm",endian="big",prog=[];
  var DEMO=["MOVZ X9, #4660, LSL #0","ADD X1, X2, X3","SUBI X4, X4, #1","LDUR X10, [X31, #16]","STUR X1, [X31, #24]","CBZ X4, #2","B #0"].join("\n");
  function recompute(){var src=(editLang==="asm"?$("aText").value:$("cText").value).replace(/\r/g,"").split("\n");prog=src.map(function(line){var c,asm,p;if(editLang==="asm"){asm=line;p=parseAsm(line);c=(p&&!p.error)?ISA[p.mn].c(p.ops):(line.trim()?(p&&p.error?"// "+p.error:""):"");}else{c=line;var a=compileC(line);asm=a||"";p=a?parseAsm(a):null;}var bits=(p&&!p.error)?bits32(p.mn,p.ops):null;return{c:c||"",asm:asm||"",bits:bits,ok:!!(p&&!p.error),mn:p&&p.mn,ops:p&&p.ops};});renderRows();}
  function endianBytes(bits){var b=[bits.slice(0,8),bits.slice(8,16),bits.slice(16,24),bits.slice(24,32)];return endian==="big"?b:b.slice().reverse();}
  function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");}
  function renderRows(){var cR=[],aR=[],bR=[];prog.forEach(function(p,i){var ln='<span class="ln">'+i+'</span>';cR.push('<div class="r" data-i="'+i+'">'+ln+esc(p.c)+'</div>');aR.push('<div class="r'+(p.asm.trim()&&!p.ok?' err':'')+'" data-i="'+i+'">'+ln+esc(p.asm)+'</div>');if(p.bits){var by=endianBytes(p.bits);bR.push('<div class="r" data-i="'+i+'">'+ln+by.map(function(x){return '<span class="byte">'+x+'</span>';}).join(" ")+'  <span style="color:var(--ink-dim)">0x'+parseInt(by.join(""),2).toString(16).toUpperCase().padStart(8,"0")+'</span></div>');}else bR.push('<div class="r" data-i="'+i+'"><span class="ln">'+i+'</span><span style="color:var(--ink-dim)">'+(p.asm.trim()?"—":"")+'</span></div>');});
    $("cRows").innerHTML=cR.join("");$("aRows").innerHTML=aR.join("");$("bRows").innerHTML=bR.join("");$("cRows").style.display=editLang==="c"?"none":"block";$("aRows").style.display=editLang==="asm"?"none":"block";$("cText").style.display=editLang==="c"?"block":"none";$("aText").style.display=editLang==="asm"?"block":"none";bindHover();}
  function bindHover(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .rows .r"),function(r){r.addEventListener("mouseenter",function(){hil(+r.dataset.i);});r.addEventListener("mouseleave",clearHil);r.addEventListener("click",function(){pickLine(+r.dataset.i);});});}
  function hil(i){clearHil();Array.prototype.forEach.call(document.querySelectorAll('#cpuSim .rows .r[data-i="'+i+'"]'),function(r){r.classList.add("hl");});var bar=editLang==="asm"?$("aHl"):$("cHl");var body=editLang==="asm"?$("aBody"):$("cBody");if(bar&&body){bar.style.display="block";bar.style.top=(i*LH+6-body.scrollTop)+"px";}}
  function clearHil(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .rows .r.hl"),function(r){r.classList.remove("hl");});$("aHl").style.display="none";$("cHl").style.display="none";}
  function pickLine(i){var p=prog[i];if(!p||!p.ok)return;catSel.value=ISA[p.mn].cat;fillInst(ISA[p.mn].cat);instSel.value=p.mn;buildOps(p.mn);cur.schema.forEach(function(f){var e=$("op_"+f[0]);if(e&&p.ops[f[0]]!=null)e.value=p.ops[f[0]];});closeEx();refresh();$("lbPick").innerHTML='Loaded <b style="color:var(--on)">'+esc(p.asm.trim())+'</b> into the Datapath tab.';}
  $("aText").addEventListener("input",function(){if(editLang==="asm")recompute();});
  $("cText").addEventListener("input",function(){if(editLang==="c")recompute();});
  $("lbEditAsm").addEventListener("click",function(){editLang="asm";this.classList.add("on");$("lbEditC").classList.remove("on");if(!$("aText").value.trim())$("aText").value=DEMO;recompute();});
  $("lbEditC").addEventListener("click",function(){editLang="c";this.classList.add("on");$("lbEditAsm").classList.remove("on");if(!$("cText").value.trim())$("cText").value=prog.map(function(p){return p.c;}).filter(Boolean).join("\n");recompute();});
  $("lbEndBig").addEventListener("click",function(){endian="big";this.classList.add("on");$("lbEndLit").classList.remove("on");renderRows();});
  $("lbEndLit").addEventListener("click",function(){endian="little";this.classList.add("on");$("lbEndBig").classList.remove("on");renderRows();});

  /* ============================== INIT ================================== */
  buildDatapath();buildOps("ADD");refresh();$("aText").value=DEMO;recompute();syncCrumb();
})();
