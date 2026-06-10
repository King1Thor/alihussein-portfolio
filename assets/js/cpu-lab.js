/* ============================================================================
   cpu-lab.js — ARMv8 CPU Lab (single-cycle) for the Playground.
   Upgrades over cpu-sim:
     • datapath with muxes + input/output port labels + instruction field taps
     • recursive drill-down: component → gates → CMOS transistors (real G/S/D)
     • C / Assembly / Binary editor: two-way C<->ASM, editable, big-endian /
       little-endian, cross-highlight (hover a binary line -> ASM + C light up)
     • stage-by-stage animation on Run
     • 3D perspective mode (drag to rotate)
   Mounts into #cpuSim. Vanilla JS + SVG. Themed via site CSS variables.
   ============================================================================ */
(function () {
  "use strict";
  var mount = document.getElementById("cpuSim");
  if (!mount) return;
  var NS = "http://www.w3.org/2000/svg";
  var LH = 22; // editor line-height (px)

  /* ----------------------------- styles ---------------------------------- */
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
    "#cpuSim .chiprow{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 12px;}",
    "#cpuSim .chip{cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink-soft);border-radius:999px;padding:6px 12px;font:700 .7rem var(--mono);letter-spacing:.05em;}",
    "#cpuSim .chip.on{background:var(--acc);border-color:var(--acc);color:#fff;}",
    "#cpuSim .chip:disabled{opacity:.4;cursor:not-allowed;}",
    "#cpuSim .stage{font:700 .76rem var(--mono);color:var(--on);letter-spacing:.06em;min-height:1.1em;margin-bottom:8px;}",
    "#cpuSim .dpwrap{position:relative;perspective:1600px;}",
    "#cpuSim svg.dp{width:100%;height:auto;display:block;background:radial-gradient(120% 90% at 70% -10%,rgba(181,29,53,.10),transparent 55%);border:1px solid var(--line);border-radius:14px;transition:transform .25s;}",
    "#cpuSim .dpwrap.d3 svg.dp{transform:rotateX(16deg) rotateY(-14deg) scale(.96);box-shadow:0 40px 80px rgba(0,0,0,.5);cursor:grab;}",
    "#cpuSim .nd rect,#cpuSim .nd ellipse,#cpuSim .nd polygon{fill:var(--panel-2,#0c101a);stroke:var(--line-2,rgba(150,170,210,.3));stroke-width:1.4;transition:.25s;}",
    "#cpuSim .nd text{fill:var(--ink);font:600 12px var(--font-display,sans-serif);}",
    "#cpuSim .nd .sub{fill:var(--ink-soft);font:500 10px var(--mono);}",
    "#cpuSim .nd.dim{opacity:.3;} #cpuSim .nd[data-click]{cursor:pointer;}",
    "#cpuSim .nd[data-click]:hover rect,#cpuSim .nd[data-click]:hover polygon,#cpuSim .nd[data-click]:hover ellipse{stroke:var(--good);}",
    "#cpuSim .nd.act rect,#cpuSim .nd.act ellipse,#cpuSim .nd.act polygon{stroke:var(--on);stroke-width:2.4;fill:rgba(88,182,255,.10);filter:drop-shadow(0 0 9px rgba(88,182,255,.45));}",
    "#cpuSim .nd.write rect{stroke:var(--good);filter:drop-shadow(0 0 9px rgba(67,224,138,.5));}",
    "#cpuSim .port{fill:var(--ink-dim,#6f7891);font:600 8.5px var(--mono);}",
    "#cpuSim .tap{fill:var(--on);font:600 8.5px var(--mono);opacity:.85;}",
    "#cpuSim .musel{fill:var(--ink-dim);font:700 9px var(--mono);}",
    "#cpuSim .ed{fill:none;stroke:var(--line-2,rgba(150,170,210,.3));stroke-width:1.6;transition:.25s;}",
    "#cpuSim .ed.dim{opacity:.2;} #cpuSim .ed.act{stroke:var(--on);stroke-width:2.6;}",
    "#cpuSim .ed.pulse{stroke:var(--acc);stroke-width:3;stroke-dasharray:9 13;animation:flow .9s linear infinite;}",
    "@keyframes flow{to{stroke-dashoffset:-44;}}",
    "#cpuSim .elab{fill:var(--ink-dim);font:600 9px var(--mono);} #cpuSim .elab.act{fill:var(--on);}",
    "#cpuSim .grid2{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;} @media(max-width:960px){#cpuSim .grid2{grid-template-columns:1fr;}}",
    "#cpuSim .card{border:1px solid var(--line);border-radius:13px;padding:13px 14px;background:var(--panel,rgba(18,23,36,.5));}",
    "#cpuSim .card h4{margin:0 0 9px;font:800 .68rem var(--mono);letter-spacing:.13em;color:var(--ink-soft);text-transform:uppercase;}",
    "#cpuSim table.ctrl{width:100%;border-collapse:collapse;font:700 .72rem var(--mono);} #cpuSim table.ctrl td{padding:3px 4px;color:var(--ink-soft);} #cpuSim table.ctrl td.v{text-align:right;color:var(--ink-dim);} #cpuSim table.ctrl tr.hi td{color:var(--on);}",
    "#cpuSim .state{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;font:700 .7rem var(--mono);}",
    "#cpuSim .reg{border:1px solid var(--line);border-radius:7px;padding:5px;color:var(--ink-soft);} #cpuSim .reg b{color:var(--ink);} #cpuSim .reg.chg{border-color:var(--good);color:var(--good);} #cpuSim .reg.chg b{color:var(--good);}",
    /* editor */
    "#cpuSim .ed3{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:12px;} @media(max-width:960px){#cpuSim .ed3{grid-template-columns:1fr;}}",
    "#cpuSim .epanel{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel-2,#0c101a);}",
    "#cpuSim .ehead{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;border-bottom:1px solid var(--line);font:800 .72rem var(--mono);letter-spacing:.08em;}",
    "#cpuSim .ehead .lang{color:var(--on);} #cpuSim .ehead .tagc{color:var(--good);} #cpuSim .ehead .taga{color:#7fa7ff;} #cpuSim .ehead .tagb{color:var(--acc);}",
    "#cpuSim .ebody{position:relative;height:228px;overflow:auto;}",
    "#cpuSim textarea.code{position:absolute;inset:0;width:100%;height:100%;border:0;resize:none;background:transparent;color:var(--ink);font:500 13px/" + LH + "px var(--mono);padding:6px 10px;outline:none;white-space:pre;overflow:auto;}",
    "#cpuSim .hlbar{position:absolute;left:0;right:0;height:" + LH + "px;background:rgba(127,227,255,.13);border-left:3px solid var(--on);display:none;pointer-events:none;}",
    "#cpuSim .rows{font:500 13px/" + LH + "px var(--mono);padding:6px 0;}",
    "#cpuSim .rows .r{padding:0 10px;white-space:pre;color:var(--ink-soft);cursor:default;}",
    "#cpuSim .rows .r .ln{color:var(--ink-dim);display:inline-block;width:1.4em;}",
    "#cpuSim .rows .r.hl{background:rgba(127,227,255,.13);border-left:3px solid var(--on);padding-left:7px;color:var(--ink);}",
    "#cpuSim .rows .r.err{color:var(--acc);}",
    "#cpuSim .rows.bin .r{font-size:12px;} #cpuSim .rows.bin .byte{padding:1px 3px;border-radius:3px;}",
    "#cpuSim .opbar{display:flex;gap:8px;align-items:center;font:600 .7rem var(--mono);color:var(--ink-soft);margin-bottom:10px;flex-wrap:wrap;}",
    /* modal */
    "#cpuSim .modal{position:fixed;inset:0;background:rgba(3,5,10,.78);backdrop-filter:blur(7px);display:none;place-items:center;z-index:140;padding:18px;} #cpuSim .modal.open{display:grid;}",
    "#cpuSim .modal .box{max-width:900px;width:100%;max-height:90vh;overflow:auto;background:var(--bg-2,#080b14);border:1px solid var(--line-2);border-radius:18px;padding:20px;}",
    "#cpuSim .crumb{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font:700 .72rem var(--mono);margin-bottom:12px;}",
    "#cpuSim .crumb a{color:var(--on);cursor:pointer;} #cpuSim .crumb span{color:var(--ink-dim);}",
    "#cpuSim .modal h3{margin:0 0 4px;font-family:var(--font-display);} #cpuSim .modal p.d{color:var(--ink-soft);font-size:.88rem;margin:0 0 12px;}",
    "#cpuSim .modal .x{float:right;cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink);border-radius:9px;padding:5px 11px;font:700 .78rem var(--mono);}",
    "#cpuSim svg.scene{width:100%;height:auto;background:#070b13;border:1px solid var(--line);border-radius:12px;}",
    "#cpuSim svg.scene text{fill:var(--ink);font:600 12px var(--mono);} #cpuSim svg.scene .sm{font-size:10px;fill:var(--ink-soft);}",
    "#cpuSim svg.scene .wire{stroke:var(--on);stroke-width:1.8;fill:none;} #cpuSim svg.scene .rail{stroke:var(--ink-dim);stroke-width:1.6;}",
    "#cpuSim svg.scene .blk{fill:var(--panel-2);stroke:var(--line-2);stroke-width:1.4;} #cpuSim svg.scene .hot{cursor:pointer;} #cpuSim svg.scene .hot:hover *{stroke:var(--good);}",
    "#cpuSim svg.scene .gate{fill:rgba(88,182,255,.07);stroke:var(--on);stroke-width:1.8;} #cpuSim svg.scene .tx{stroke:var(--ink);stroke-width:1.7;fill:none;} #cpuSim svg.scene .pin{fill:var(--acc);}",
    "#cpuSim svg.scene .ttl{fill:var(--good);font-weight:700;}"
  ].join("\n");
  mount.appendChild(st);

  /* ======================================================================
     ISA: encodings + execution + C<->ASM  (matches Ali's SC_Control)
     ====================================================================== */
  var FC = { op:"#b51d35", reg:"#2f7bd6", sh:"#6f7891", imm:"#3a9d6b", hw:"#8a5cc0", addr:"#3a9d6b", op2:"#6f7891" };
  function bin(v,n){ v=((v%Math.pow(2,n))+Math.pow(2,n))%Math.pow(2,n); var s=v.toString(2); while(s.length<n)s="0"+s; return s; }

  var ISA = {
    ADD:{fmt:"R",op:"10001011000",k:"R-type",alu:"ADD", c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + X"+o.Rm+";";}, ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]+s.reg[o.Rm]};}},
    SUB:{fmt:"R",op:"11001011000",k:"R-type",alu:"SUB", c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - X"+o.Rm+";";}, ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]-s.reg[o.Rm]};}},
    AND:{fmt:"R",op:"10001010000",k:"R-type",alu:"AND", c:function(o){return "X"+o.Rd+" = X"+o.Rn+" & X"+o.Rm+";";}, ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]&s.reg[o.Rm]};}},
    ORR:{fmt:"R",op:"10101010000",k:"R-type",alu:"ORR", c:function(o){return "X"+o.Rd+" = X"+o.Rn+" | X"+o.Rm+";";}, ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]|s.reg[o.Rm]};}},
    ADDI:{fmt:"I",op:"1001000100",k:"I-type",alu:"ADD", c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + "+o.imm+";";}, ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]+o.imm};}},
    SUBI:{fmt:"I",op:"1101000100",k:"I-type",alu:"SUB", c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - "+o.imm+";";}, ex:function(s,o){return {reg:o.Rd,val:s.reg[o.Rn]-o.imm};}},
    LDUR:{fmt:"D",op:"11111000010",k:"Load",alu:"ADD", c:function(o){return "X"+o.Rt+" = mem[X"+o.Rn+" + "+o.addr+"];";}, ex:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {reg:o.Rt,val:s.mem[i]};}},
    STUR:{fmt:"D",op:"11111000000",k:"Store",alu:"ADD", c:function(o){return "mem[X"+o.Rn+" + "+o.addr+"] = X"+o.Rt+";";}, ex:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {mem:i,val:s.reg[o.Rt]};}},
    CBZ:{fmt:"CB",op:"10110100",k:"Branch",alu:"PASSB", c:function(o){return "if (X"+o.Rt+" == 0) goto "+o.addr+";";}, ex:function(s,o){return {branch:s.reg[o.Rt]===0};}},
    B:{fmt:"B",op:"000101",k:"Branch",alu:"ADD", c:function(o){return "goto "+o.addr+";";}, ex:function(s,o){return {branch:true};}},
    MOVZ:{fmt:"IM",op:"110100101",k:"Move",alu:"PASSB", c:function(o){return "X"+o.Rd+" = "+o.imm+(o.hw?(" << "+(o.hw*16)):"")+";";}, ex:function(s,o){return {reg:o.Rd,val:o.imm*Math.pow(2,o.hw*16)};}}
  };
  function defaults(mn){
    var f=ISA[mn].fmt;
    if(f==="R")return {Rd:1,Rn:2,Rm:3};
    if(f==="I")return {Rd:1,Rn:2,imm:5};
    if(f==="D")return {Rt:1,Rn:31,addr:16};
    if(f==="CB")return {Rt:9,addr:2};
    if(f==="B")return {addr:4};
    if(f==="IM")return {Rd:9,imm:4660,hw:0};
    return {};
  }
  function asmText(mn,o){var f=ISA[mn].fmt;
    if(f==="R")return mn+" X"+o.Rd+", X"+o.Rn+", X"+o.Rm;
    if(f==="I")return mn+" X"+o.Rd+", X"+o.Rn+", #"+o.imm;
    if(f==="D")return mn+" X"+o.Rt+", [X"+o.Rn+", #"+o.addr+"]";
    if(f==="CB")return mn+" X"+o.Rt+", #"+o.addr;
    if(f==="B")return mn+" #"+o.addr;
    if(f==="IM")return mn+" X"+o.Rd+", #"+o.imm+", LSL #"+(o.hw*16);
    return mn;
  }
  function controlFor(mn){
    var z={Reg2Loc:0,ALUSrc:0,MemtoReg:0,RegWrite:0,MemRead:0,MemWrite:0,Branch:0,Uncondbranch:0,MovZ:0};
    function e(b){var o={};for(var k in z)o[k]=z[k];for(var j in b)o[j]=b[j];return o;}
    var f=ISA[mn].fmt;
    if(mn==="LDUR")return e({ALUSrc:1,MemtoReg:1,RegWrite:1,MemRead:1});
    if(mn==="STUR")return e({Reg2Loc:1,ALUSrc:1,MemWrite:1});
    if(f==="R")return e({RegWrite:1});
    if(f==="I")return e({ALUSrc:1,RegWrite:1});
    if(f==="IM")return e({ALUSrc:1,RegWrite:1,MovZ:1});
    if(f==="CB")return e({Reg2Loc:1,Branch:1});
    if(f==="B")return e({Uncondbranch:1});
    return z;
  }
  function encode(mn,o){var I=ISA[mn],f=I.fmt,F=[];
    function a(n,b,c){F.push({n:n,b:b,c:c});}
    if(f==="R"){a("opcode",I.op,FC.op);a("Rm",bin(o.Rm,5),FC.reg);a("shamt","000000",FC.sh);a("Rn",bin(o.Rn,5),FC.reg);a("Rd",bin(o.Rd,5),FC.reg);}
    else if(f==="I"){a("opcode",I.op,FC.op);a("ALU_imm",bin(o.imm,12),FC.imm);a("Rn",bin(o.Rn,5),FC.reg);a("Rd",bin(o.Rd,5),FC.reg);}
    else if(f==="D"){a("opcode",I.op,FC.op);a("DT_addr",bin(o.addr,9),FC.addr);a("op","00",FC.op2);a("Rn",bin(o.Rn,5),FC.reg);a("Rt",bin(o.Rt,5),FC.reg);}
    else if(f==="CB"){a("opcode",I.op,FC.op);a("addr19",bin(o.addr,19),FC.addr);a("Rt",bin(o.Rt,5),FC.reg);}
    else if(f==="B"){a("opcode",I.op,FC.op);a("addr26",bin(o.addr,26),FC.addr);}
    else if(f==="IM"){a("opcode",I.op,FC.op);a("hw",bin(o.hw,2),FC.hw);a("MOV_imm",bin(o.imm,16),FC.imm);a("Rd",bin(o.Rd,5),FC.reg);}
    return F;
  }
  function bits32(mn,o){return encode(mn,o).map(function(f){return f.b;}).join("");}

  /* ---- assembler: parse one assembly line -> {mn,ops} or {error} ---- */
  function parseAsm(line){
    var s=line.trim(); if(!s||s[0]===";"||s[0]==="/")return null;
    var m=s.match(/^([A-Za-z]+)\s*(.*)$/); if(!m)return {error:"?"};
    var mn=m[1].toUpperCase(); if(!ISA[mn])return {error:"unknown op "+mn};
    var rest=m[2], f=ISA[mn].fmt, R=/X(\d+)/gi, nums=[], r;
    var regs=(rest.match(/X\d+/gi)||[]).map(function(x){return +x.slice(1);});
    var imms=(rest.match(/#(-?\d+)/g)||[]).map(function(x){return +x.slice(1);});
    try{
      if(f==="R")return {mn:mn,ops:{Rd:regs[0],Rn:regs[1],Rm:regs[2]}};
      if(f==="I")return {mn:mn,ops:{Rd:regs[0],Rn:regs[1],imm:imms[0]}};
      if(f==="D")return {mn:mn,ops:{Rt:regs[0],Rn:regs[1],addr:imms[0]||0}};
      if(f==="CB")return {mn:mn,ops:{Rt:regs[0],addr:imms[0]||0}};
      if(f==="B")return {mn:mn,ops:{addr:imms[0]||0}};
      if(f==="IM")return {mn:mn,ops:{Rd:regs[0],imm:imms[0],hw:(imms[1]?(imms[1]/16)|0:0)}};
    }catch(e){return {error:"bad operands"};}
    return {error:"?"};
  }
  /* ---- tiny C compiler (subset) -> one assembly line ---- */
  function compileC(line){
    var s=line.trim().replace(/;$/,""); if(!s||s[0]==="/")return null;
    var m;
    if((m=s.match(/^X(\d+)\s*=\s*X(\d+)\s*([+\-&|])\s*X(\d+)$/))){var op={"+":"ADD","-":"SUB","&":"AND","|":"ORR"}[m[3]];return op+" X"+m[1]+", X"+m[2]+", X"+m[4];}
    if((m=s.match(/^X(\d+)\s*=\s*X(\d+)\s*([+\-])\s*(\d+)$/))){return (m[3]==="+"?"ADDI":"SUBI")+" X"+m[1]+", X"+m[2]+", #"+m[4];}
    if((m=s.match(/^X(\d+)\s*=\s*mem\[\s*X(\d+)\s*\+\s*(\d+)\s*\]$/)))return "LDUR X"+m[1]+", [X"+m[2]+", #"+m[3]+"]";
    if((m=s.match(/^mem\[\s*X(\d+)\s*\+\s*(\d+)\s*\]\s*=\s*X(\d+)$/)))return "STUR X"+m[3]+", [X"+m[1]+", #"+m[2]+"]";
    if((m=s.match(/^X(\d+)\s*=\s*(\d+)$/)))return "MOVZ X"+m[1]+", #"+m[2]+", LSL #0";
    if((m=s.match(/^if\s*\(\s*X(\d+)\s*==\s*0\s*\)\s*goto\s*(\d+)$/)))return "CBZ X"+m[1]+", #"+m[2];
    if((m=s.match(/^goto\s*(\d+)$/)))return "B #"+m[1];
    return "; (unsupported C)";
  }

  /* ======================================================================
     DATAPATH layout (with ports, taps, muxes)
     ====================================================================== */
  var N={
    pc:{x:30,y:250,w:46,h:74,t:"PC"},
    pc4:{x:150,y:58,w:74,h:46,t:"Add",s:"PC+4"},
    imem:{x:150,y:244,w:120,h:88,t:"Instruction",s:"Memory",click:"imem"},
    control:{x:430,y:40,w:158,h:60,t:"Control",s:"Unit",ell:true,click:"control"},
    regfile:{x:420,y:224,w:150,h:124,t:"Register",s:"File",click:"regfile"},
    reg2loc:{x:372,y:332,w:26,h:60,mux:true,s0:"0",s1:"1"},
    signext:{x:420,y:406,w:140,h:44,t:"Sign-extend",click:"signext"},
    alusrc:{x:600,y:282,w:26,h:74,mux:true,s0:"0",s1:"1"},
    alu:{x:660,y:222,w:96,h:138,t:"ALU",alu:true,click:"alu"},
    aluctrl:{x:646,y:420,w:112,h:38,t:"ALU control",click:"aluctrl"},
    dmem:{x:826,y:248,w:120,h:104,t:"Data",s:"Memory",click:"dmem"},
    memtoreg:{x:986,y:262,w:26,h:74,mux:true,s0:"0",s1:"1"},
    shift2:{x:600,y:126,w:60,h:34,t:"<<2"},
    baddr:{x:700,y:60,w:72,h:46,t:"Add",s:"branch"},
    band:{x:812,y:80,w:40,h:34,t:"&"},
    pcsrc:{x:902,y:54,w:26,h:74,mux:true,s0:"0",s1:"1"}
  };
  function R(n){return [N[n].x+N[n].w,N[n].y+N[n].h/2];}
  function L(n){return [N[n].x,N[n].y+N[n].h/2];}
  function T(n){return [N[n].x+N[n].w/2,N[n].y];}
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
    pcsrc_pc:{p:[T("pcsrc"),[915,14],[14,14],[14,250],L("pc")]},
    ctrl_br:{p:[Bt("control"),[509,116],[762,116],[812,90]],l:"Branch"},
    alu_zero:{p:[[700,222],[700,198],[820,198],[820,114]],l:"Zero"},
    band_pcsrc:{p:[R("band"),[889,95]]}
  };
  // ports drawn near nodes [x,y,text,class]
  var PORTS=[
    [424,250,"Read reg 1","port"],[424,273,"Read reg 2","port"],[424,299,"Write reg","port"],[424,322,"Write data","port"],
    [512,242,"Read data 1","port"],[512,340,"Read data 2","port"],
    [760,232,"ALU result","port"],[702,212,"Zero","port"],
    [950,264,"Address","port"],[950,332,"Write data","port"],
    [158,234,"Read addr","port"],[630,298,"ALUSrc","musel"],[332,392,"Reg2Loc","musel"],[992,258,"MemtoReg","musel"],[906,50,"PCSrc","musel"],
    [646,414,"ALUOp","tap"]
  ];
  function profile(mn){
    var f=ISA[mn].fmt, base=["pc","imem","control","pc4","pcsrc"], be=["pc_imem","pc_pc4","imem_ctrl","pc4_pcsrc","pcsrc_pc"];
    if(f==="R")return {nodes:base.concat("regfile","alu","aluctrl","memtoreg"),edges:be.concat("imem_rf","imem_r2","rf_a","rf_b","alusrc_alu","alu_m2r0","m2r_wb"),seq:["Fetch instruction","Decode + read register file","Read second register (ALUSrc=0)","ALU executes operation","Write result to register"]};
    if(f==="I")return {nodes:base.concat("regfile","signext","alusrc","alu","aluctrl","memtoreg"),edges:be.concat("imem_rf","imem_se","rf_a","se_alusrc","alusrc_alu","alu_m2r0","m2r_wb"),seq:["Fetch","Decode + read Rn","Sign-extend immediate (ALUSrc=1)","ALU adds/subtracts","Write result to register"]};
    if(f==="IM")return {nodes:base.concat("regfile","signext","alusrc","alu","memtoreg"),edges:be.concat("imem_se","se_alusrc","alusrc_alu","alu_m2r0","m2r_wb"),seq:["Fetch","Decode (MovZ=1)","Build 16-bit immediate << hw","ALU passes it through","Write to register"]};
    if(mn==="LDUR")return {nodes:base.concat("regfile","signext","alusrc","alu","aluctrl","dmem","memtoreg"),edges:be.concat("imem_rf","imem_se","rf_a","se_alusrc","alusrc_alu","alu_dmem","dmem_m2r1","m2r_wb"),seq:["Fetch","Decode (MemRead, RegWrite)","Read base + sign-extend offset","ALU computes address","Read data memory","Write loaded value to register"]};
    if(mn==="STUR")return {nodes:base.concat("regfile","reg2loc","signext","alusrc","alu","aluctrl","dmem"),edges:be.concat("imem_rf","imem_r2","imem_se","r2_rf","rf_a","se_alusrc","alusrc_alu","alu_dmem","b_dmemwr"),seq:["Fetch","Decode (MemWrite, Reg2Loc=1)","Read base + value","ALU computes address","Write value to data memory","(no register write-back)"]};
    if(f==="CB")return {nodes:base.concat("regfile","reg2loc","alu","signext","shift2","baddr","band"),edges:be.concat("imem_rf","imem_r2","r2_rf","rf_a","alusrc_alu","se_shift","shift_b","pc_b","b_pcsrc","ctrl_br","alu_zero","band_pcsrc"),seq:["Fetch","Decode (Branch=1, Reg2Loc=1)","ALU tests register for zero","Sign-extend & shift offset <<2","Branch adder forms target","Branch taken iff Zero & Branch"]};
    if(f==="B")return {nodes:base.concat("signext","shift2","baddr"),edges:be.concat("imem_se","se_shift","shift_b","pc_b","b_pcsrc"),seq:["Fetch","Decode (Uncondbranch=1)","Sign-extend & shift offset <<2","Branch adder forms target","PCSrc selects branch — always taken"]};
    return {nodes:base,edges:be,seq:["Fetch"]};
  }

  /* ======================================================================
     DRILL-DOWN SCENES (gate & transistor schematics)
     ====================================================================== */
  function mosfet(x,y,type,gateLab,labels){ // type 'n'|'p'; returns svg string
    var bub = type==="p" ? '<circle cx="'+(x-16)+'" cy="'+y+'" r="3.5" class="tx" fill="#070b13"/>' : '';
    var L=labels||{};
    return ''+
      '<line class="tx" x1="'+(x-40)+'" y1="'+y+'" x2="'+(x-(type==="p"?20:13))+'" y2="'+y+'"/>'+ // gate lead
      '<line class="tx" x1="'+(x-13)+'" y1="'+(y-16)+'" x2="'+(x-13)+'" y2="'+(y+16)+'"/>'+        // gate plate
      bub+
      '<line class="tx" x1="'+x+'" y1="'+(y-22)+'" x2="'+x+'" y2="'+(y+22)+'"/>'+                   // channel
      '<line class="tx" x1="'+(x-13)+'" y1="'+(y-11)+'" x2="'+x+'" y2="'+(y-11)+'"/>'+              // drain link
      '<line class="tx" x1="'+(x-13)+'" y1="'+(y+11)+'" x2="'+x+'" y2="'+(y+11)+'"/>'+              // source link
      '<line class="tx" x1="'+x+'" y1="'+(y-22)+'" x2="'+(x+26)+'" y2="'+(y-22)+'"/>'+              // drain lead
      '<line class="tx" x1="'+x+'" y1="'+(y+22)+'" x2="'+(x+26)+'" y2="'+(y+22)+'"/>'+              // source lead
      '<text class="sm" x="'+(x-44)+'" y="'+(y-4)+'" text-anchor="end">G '+(gateLab||"")+'</text>'+
      '<text class="sm" x="'+(x+30)+'" y="'+(y-20)+'">D '+(L.d||"")+'</text>'+
      '<text class="sm" x="'+(x+30)+'" y="'+(y+26)+'">S '+(L.s||"")+'</text>';
  }
  // gate symbols (distinctive shapes) at box (x,y,w,h); returns {svg, inP:[[x,y]..], outP:[x,y]}
  function gateSym(kind,x,y){
    var w=58,h=44, cy=y+h/2, out=[x+w+ (kind==="not"?8:0), cy], bub='';
    var body='';
    if(kind==="and"||kind==="nand"){ body='<path class="gate" d="M'+x+' '+y+' h'+(w*0.45)+' a'+(h/2)+' '+(h/2)+' 0 0 1 0 '+h+' h-'+(w*0.45)+' z"/>'; if(kind==="nand"){bub='<circle class="gate" cx="'+(x+w+6)+'" cy="'+cy+'" r="5" fill="#070b13"/>';out=[x+w+11,cy];} }
    else if(kind==="or"||kind==="nor"||kind==="xor"){
      var ox = kind==="xor"? x+6 : x;
      body='<path class="gate" d="M'+ox+' '+y+' q'+(w*0.7)+' 4 '+(w)+' '+(h/2)+' q-'+(w*0.3)+' '+(h/2-2)+' -'+w+' '+(h/2)+' q'+(w*0.28)+' -'+(h/2)+' 0 -'+h+' z"/>';
      if(kind==="xor")body+='<path class="gate" fill="none" d="M'+(x)+' '+y+' q'+(w*0.28)+' '+(h/2)+' 0 '+h+'"/>';
      if(kind==="nor"){bub='<circle class="gate" cx="'+(x+w+6)+'" cy="'+cy+'" r="5" fill="#070b13"/>';out=[x+w+11,cy];}
      out=[ kind==="nor"?x+w+11:x+w, cy];
    }
    else if(kind==="not"){ body='<path class="gate" d="M'+x+' '+y+' L'+(x+w-6)+' '+cy+' L'+x+' '+(y+h)+' z"/><circle class="gate" cx="'+(x+w)+'" cy="'+cy+'" r="5" fill="#070b13"/>'; out=[x+w+5,cy]; }
    var inP = kind==="not" ? [[x, cy]] : [[x+2,y+h*0.3],[x+2,y+h*0.7]];
    return {svg:body+bub, inP:inP, out:out};
  }

  var SCENES = {
    alu:function(){ return {title:"ALU — 1-bit slice", desc:"Each bit pairs a full adder (add/sub via two's-complement) with AND/OR logic; a mux picks the result by ALUOp. Click the Full Adder or a gate to go deeper.",
      svg:scene(680,300,function(s){
        s.label(20,28,"A, B, Cin",10);
        s.blk(120,40,120,56,"Full Adder","fulladder");
        s.blk(120,120,120,40,"AND","gate:and");
        s.blk(120,176,120,40,"OR","gate:or");
        s.blk(360,90,110,90,"4:1 MUX","mux");
        s.label(500,120,"Result",12); s.label(500,60,"Cout",12);
        s.wire([[100,68],[120,68]]); s.wire([[100,140],[120,140]]); s.wire([[100,196],[120,196]]);
        s.wire([[240,60],[360,108]]); s.wire([[240,140],[360,135]]); s.wire([[240,196],[360,162]]);
        s.wire([[240,52],[300,52],[300,40],[470,40],[470,60]]);
        s.wire([[470,135],[498,120]]);
        s.label(360,210,"sel = ALUOp",10);
      })}; },
    fulladder:function(){ return {title:"Full Adder — gate level", desc:"Sum = A ⊕ B ⊕ Cin.  Cout = (A·B) + (Cin·(A⊕B)). Click any gate to see its CMOS transistors.",
      svg:scene(700,300,function(s){
        s.label(16,40,"A",12); s.label(16,80,"B",12); s.label(16,150,"Cin",12);
        s.gate("xor",120,40,"gate:xor"); s.label(120,30,"⊕",10);
        s.gate("xor",300,90,"gate:xor");
        s.gate("and",120,150,"gate:and");
        s.gate("and",300,180,"gate:and");
        s.gate("or",470,170,"gate:or");
        s.label(600,120,"Sum",12); s.label(600,190,"Cout",12);
        s.wire([[40,46],[120,53]]); s.wire([[40,86],[120,75]]);
        s.wire([[186,62],[300,103]]); s.wire([[40,150],[300,125]]);
        s.wire([[366,112],[596,112]]);
        s.wire([[40,52],[80,52],[80,160],[120,160]]); s.wire([[40,92],[90,92],[90,176],[120,176]]);
        s.wire([[186,62],[250,62],[250,190],[300,190]]); s.wire([[40,150],[260,150],[260,206],[300,206]]);
        s.wire([[366,172],[440,172],[440,180],[470,180]]); s.wire([[366,196],[470,196]]);
        s.wire([[540,186],[596,186]]);
      })}; },
    mux:function(){ return {title:"2:1 MUX — gate level", desc:"Y = (A · sel') + (B · sel). A 4:1 mux chains three of these. Click a gate for transistors.",
      svg:scene(640,260,function(s){
        s.label(16,40,"A",12); s.label(16,150,"B",12); s.label(16,210,"sel",12);
        s.gate("not",110,200,"gate:not");
        s.gate("and",230,40,"gate:and"); s.gate("and",230,150,"gate:and");
        s.gate("or",420,95,"gate:or"); s.label(560,118,"Y",12);
        s.wire([[40,46],[230,53]]); s.wire([[40,150],[230,163]]);
        s.wire([[40,210],[110,222]]); s.wire([[174,222],[200,222],[200,75],[230,75]]);
        s.wire([[40,210],[80,210],[80,185],[200,185],[200,185]]); s.wire([[40,210],[210,210],[210,186],[230,186]]);
        s.wire([[296,62],[420,107]]); s.wire([[296,172],[420,131]]); s.wire([[490,119],[556,119]]);
      })}; },
    "gate:not":function(){return gateScene("not","NOT (inverter)","Y = A'","tx:not");},
    "gate:and":function(){return gateScene("and","AND","Y = A · B","tx:and");},
    "gate:or":function(){return gateScene("or","OR","Y = A + B","tx:or");},
    "gate:xor":function(){return gateScene("xor","XOR","Y = A ⊕ B","tx:xor");},
    "gate:nand":function(){return gateScene("nand","NAND","Y = (A · B)'","tx:nand");},
    "gate:nor":function(){return gateScene("nor","NOR","Y = (A + B)'","tx:nor");},
    "tx:not":function(){return {title:"Inverter — CMOS transistors", desc:"One PMOS pulls the output HIGH when A=0; one NMOS pulls it LOW when A=1. Note the gate (G), source (S) and drain (D) terminals.",
      svg:scene(520,320,function(s){
        s.rail([[60,40],[460,40]],"VDD"); s.rail([[60,290],[460,290]],"GND");
        s.raw(mosfet(300,90,"p","A",{d:"Y",s:"VDD"}));
        s.raw(mosfet(300,230,"n","A",{d:"Y",s:"GND"}));
        s.wire([[300,68],[300,40]]); s.wire([[300,252],[300,290]]);
        s.wire([[326,112],[360,112],[360,208],[326,208]]); s.wire([[360,160],[470,160]]); s.label(474,164,"Y",12);
        s.wire([[260,90],[150,90],[150,230],[260,230]]); s.wire([[150,160],[40,160]]); s.label(20,164,"A",12);
      })};},
    "tx:nand":function(){return {title:"NAND2 — CMOS transistors", desc:"Two PMOS in parallel pull HIGH; two NMOS in series pull LOW. Output is low only when A and B are both high.",
      svg:scene(560,340,function(s){
        s.rail([[60,40],[500,40]],"VDD"); s.rail([[60,310],[500,310]],"GND");
        s.raw(mosfet(250,90,"p","A",{d:"Y",s:"VDD"})); s.raw(mosfet(360,90,"p","B",{d:"Y",s:"VDD"}));
        s.wire([[250,68],[250,40]]); s.wire([[360,68],[360,40]]);
        s.wire([[276,112],[276,150],[386,150],[386,112]]); s.wire([[331,150],[331,170]]);
        s.raw(mosfet(300,210,"n","A",{d:"Y",s:""})); s.raw(mosfet(300,280,"n","B",{d:"",s:"GND"}));
        s.wire([[300,188],[300,150]]); s.wire([[300,232],[300,258]]); s.wire([[300,302],[300,310]]);
        s.wire([[331,150],[470,150]]); s.label(474,154,"Y",12);
        s.label(60,200,"A,B gates",10);
      })};},
    "tx:nor":function(){return {title:"NOR2 — CMOS transistors", desc:"Two PMOS in series pull HIGH; two NMOS in parallel pull LOW. Output is high only when A and B are both low.",
      svg:scene(560,340,function(s){
        s.rail([[60,40],[500,40]],"VDD"); s.rail([[60,310],[500,310]],"GND");
        s.raw(mosfet(300,80,"p","A",{d:"",s:"VDD"})); s.raw(mosfet(300,150,"p","B",{d:"Y",s:""}));
        s.wire([[300,58],[300,40]]); s.wire([[300,102],[300,128]]); s.wire([[300,172],[300,200]]);
        s.raw(mosfet(250,250,"n","A",{d:"Y",s:"GND"})); s.raw(mosfet(370,250,"n","B",{d:"Y",s:"GND"}));
        s.wire([[300,172],[470,172]]); s.label(474,176,"Y",12);
        s.wire([[250,228],[250,200],[370,200],[370,228]]); s.wire([[250,272],[250,310]]); s.wire([[370,272],[370,310]]);
      })};},
    "tx:and":function(){return composed("AND = NAND + INV","An AND gate is a NAND followed by an inverter.",["gate:nand","gate:not"]);},
    "tx:or":function(){return composed("OR = NOR + INV","An OR gate is a NOR followed by an inverter.",["gate:nor","gate:not"]);},
    "tx:xor":function(){return composed("XOR from primitives","XOR is built from AND/OR/NOT (or NANDs). Drill those for transistors.",["gate:and","gate:or","gate:not"]);},
    imem:function(){return {title:"Instruction Memory", desc:"A read-only array addressed by the PC. The 32-bit word at that address is the instruction; its bit-fields are tapped off to the control unit and register file (combinational read in this single-cycle model).",
      svg:scene(640,220,function(s){
        s.blk(40,70,120,70,"Address decoder",""); s.blk(220,40,150,130,"ROM array","");
        s.blk(430,80,150,50,"Instruction[31-0]","");
        s.wire([[10,105],[40,105]]); s.label(8,100,"PC",10);
        s.wire([[160,105],[220,105]]); s.wire([[370,105],[430,105]]);
        s.label(430,160,"→ opcode, Rn, Rm, Rt, imm taps",10);
      })};},
    regfile:function(){return {title:"Register File", desc:"32 registers, two read ports and one write port. Read-address decoders select registers onto BusA / BusB through multiplexers; RegWrite + a write decoder route BusW back on the clock edge. Click a port mux for its gates.",
      svg:scene(680,300,function(s){
        s.blk(40,30,120,40,"Read decoder 1",""); s.blk(40,90,120,40,"Read decoder 2",""); s.blk(40,200,120,40,"Write decoder","");
        s.blk(230,30,150,210,"32 × register array","");
        s.blk(450,40,120,40,"Read mux 1","mux"); s.blk(450,110,120,40,"Read mux 2","mux");
        s.label(600,64,"BusA",11); s.label(600,134,"BusB",11);
        s.wire([[380,60],[450,60]]); s.wire([[380,130],[450,130]]); s.wire([[570,60],[596,60]]); s.wire([[570,130],[596,130]]);
        s.wire([[160,50],[230,50]]); s.wire([[160,110],[230,110]]); s.wire([[160,220],[230,220]]);
        s.label(40,270,"RegWrite enables the write port",10);
      })};},
    dmem:function(){return {title:"Data Memory + Cache hierarchy", desc:"Loads/stores hit the L1 cache first (tag/index/offset split of the address). A miss falls through to L2, then main memory. MemRead/MemWrite gate the ports. Click to imagine deeper — sets, ways, and replacement live here.",
      svg:scene(700,260,function(s){
        s.label(16,30,"address",10);
        s.blk(40,50,120,50,"Tag | Index | Offset","");
        s.blk(210,40,120,70,"L1 cache","cache"); s.blk(380,40,120,70,"L2 cache","cache"); s.blk(550,40,120,70,"Main memory","");
        s.wire([[160,75],[210,75]]); s.wire([[330,75],[380,75]]); s.wire([[500,75],[550,75]]);
        s.label(210,135,"hit → read data",10); s.label(380,135,"miss ↓",10);
        s.label(40,180,"MemRead gates the read port · MemWrite stores write-data on the clock edge",9);
      })};},
    cache:function(){return {title:"Cache — set-associative", desc:"The index picks a set; tags in each way are compared to the address tag; a hit selects that way's data block by the offset. Misses trigger a fill and (LRU) replacement.",
      svg:scene(640,240,function(s){
        s.blk(40,40,120,150,"Sets","");
        s.blk(220,40,90,60,"Way 0: tag|data","hot"); s.blk(220,120,90,60,"Way 1: tag|data","hot");
        s.blk(360,70,90,60,"Tag compare","");
        s.blk(500,80,110,50,"Hit? → data","");
        s.wire([[160,115],[220,70]]); s.wire([[160,115],[220,150]]); s.wire([[310,70],[360,95]]); s.wire([[310,150],[360,105]]); s.wire([[450,100],[500,105]]);
      })};},
    control:function(){return {title:"Control Unit", desc:"Decodes the 11-bit opcode (casez with wildcards in the Verilog) into datapath control lines. Unsupported opcodes fall through to all-zero defaults so the machine safely does nothing.",
      svg:scene(680,260,function(s){
        s.blk(40,90,140,60,"Opcode decoder","");
        s.label(16,80,"Instr[31-21]",9);
        var outs=["RegWrite","ALUSrc","MemRead","MemWrite","MemtoReg","Reg2Loc","Branch","ALUOp","MovZ"];
        for(var i=0;i<outs.length;i++){ var yy=24+i*24; s.wire([[180,120],[300,yy]]); s.label(306,yy+4,outs[i],10); }
      })};},
    signext:function(){return {title:"Sign-extend / immediate unit", desc:"Selects the right immediate field by format (I/D/CB/B), then sign- or zero-extends it to 64 bits; branch offsets are shifted left by 2. With MovZ it zero-extends the 16-bit field to position hw·16.",
      svg:scene(640,200,function(s){
        s.blk(40,60,130,70,"Format select","");
        s.blk(230,40,150,50,"Sign / zero extend","");
        s.blk(230,110,150,50,"<<2 (branches)","");
        s.blk(440,70,130,50,"imm[63:0]","");
        s.wire([[170,80],[230,65]]); s.wire([[170,110],[230,135]]); s.wire([[380,65],[440,90]]); s.wire([[380,135],[440,100]]);
      })};},
    aluctrl:function(){return SCENES.alu();}
  };
  function gateScene(kind,title,eq,txid){ return {title:title+" — gate", desc:eq+".  Click 'View transistors' to drop to the CMOS level.",
    svg:scene(520,240,function(s){
      var g=gateSym(kind,200,90); s.raw(g.svg);
      s.label(40,108,"A",12); if(kind!=="not")s.label(40,150,"B",12);
      s.wire([[60,100],g.inP[0]]); if(g.inP[1])s.wire([[60,144],g.inP[1]]);
      s.wire([g.out,[g.out[0]+70,g.out[1]]]); s.label(g.out[0]+76,g.out[1]+4,"Y",12);
      s.hotrect(40,190,180,34,"View transistors →",txid);
      truth(s,kind,330,40);
    })}; }
  function composed(title,desc,childIds){ return {title:title, desc:desc,
    svg:scene(560,150,function(s){
      var x=40; childIds.forEach(function(id,i){ s.hotrect(x,50,150,48,id.split(":")[1].toUpperCase(),id); if(i<childIds.length-1)s.wire([[x+150,74],[x+170,74]]); x+=170; });
      s.label(40,30,"Click a block to open its CMOS transistors",10);
    })}; }
  function truth(s,kind,x,y){
    var rows;
    if(kind==="not")rows=[["A","Y"],["0","1"],["1","0"]];
    else{ var f={and:function(a,b){return a&b;},or:function(a,b){return a|b;},xor:function(a,b){return a^b;},nand:function(a,b){return 1-(a&b);},nor:function(a,b){return 1-(a|b);}}[kind];
      rows=[["A","B","Y"]]; [[0,0],[0,1],[1,0],[1,1]].forEach(function(p){rows.push([p[0]+"",p[1]+"",f(p[0],p[1])+""]);}); }
    rows.forEach(function(r,i){ r.forEach(function(c,j){ s.label(x+j*34, y+18+i*20, c, i===0?11:10); }); });
  }

  /* tiny scene builder -> svg string */
  function scene(w,h,fn){
    var out=[]; var api={
      raw:function(svg){out.push(svg);},
      label:function(x,y,t,sz){out.push('<text x="'+x+'" y="'+y+'" font-size="'+(sz||12)+'">'+t+'</text>');},
      wire:function(pts){out.push('<polyline class="wire" points="'+pts.map(function(p){return p[0]+","+p[1];}).join(" ")+'"/>');},
      rail:function(pts,lab){out.push('<polyline class="rail" points="'+pts.map(function(p){return p[0]+","+p[1];}).join(" ")+'"/>');out.push('<text class="sm" x="'+(pts[0][0]-30)+'" y="'+(pts[0][1]+4)+'">'+lab+'</text>');},
      blk:function(x,y,w2,h2,t,link){var hot=link?' hot" data-scene="'+link+'"':'"';out.push('<g class="blk'+(link?" hot":"")+'"'+(link?' data-scene="'+link+'"':'')+'><rect class="blk" x="'+x+'" y="'+y+'" width="'+w2+'" height="'+h2+'" rx="7"/><text x="'+(x+w2/2)+'" y="'+(y+h2/2+4)+'" text-anchor="middle" font-size="11">'+t+'</text></g>');},
      hotrect:function(x,y,w2,h2,t,link){out.push('<g class="hot" data-scene="'+link+'"><rect class="gate" x="'+x+'" y="'+y+'" width="'+w2+'" height="'+h2+'" rx="7"/><text x="'+(x+w2/2)+'" y="'+(y+h2/2+4)+'" text-anchor="middle" font-size="11" class="ttl">'+t+'</text></g>');},
      gate:function(kind,x,y,link){var g=gateSym(kind,x,y);out.push('<g class="'+(link?"hot":"")+'"'+(link?' data-scene="'+link+'"':'')+'>'+g.svg+'</g>');this._last=g;return g;}
    };
    fn(api);
    return '<svg class="scene" viewBox="0 0 '+w+' '+h+'" xmlns="'+NS+'">'+out.join("")+'</svg>';
  }

  /* ======================================================================
     BUILD DOM
     ====================================================================== */
  mount.innerHTML +=
    '<div class="lab-tabs">'+
      '<button class="lab-tab on" data-pane="dp" type="button">Datapath</button>'+
      '<button class="lab-tab" data-pane="code" type="button">C / Assembly / Binary</button>'+
    '</div>'+
    /* DATAPATH PANE */
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
      '<div class="chiprow">'+
        '<button class="chip on" id="lbCtrl" type="button">Control signals</button>'+
        '<button class="chip" id="lb3d" type="button">3D view</button>'+
        '<span class="chip" style="cursor:default;border-style:dashed">tip: click any block to look inside →</span>'+
      '</div>'+
      '<div class="stage" id="lbStage">Pick an instruction, then Step or Run. Click ALU, Register File, Control, Memory… to drill into gates and transistors.</div>'+
      '<div class="dpwrap" id="lbWrap"><div id="lbDP"></div></div>'+
      '<div class="grid2" style="margin-top:14px;">'+
        '<div class="card" id="lbCtrlCard"><h4>Control signals</h4><table class="ctrl"><tbody id="lbCtrlTbl"></tbody></table></div>'+
        '<div class="card"><h4>Machine state</h4><div class="state" id="lbState"></div></div>'+
      '</div>'+
    '</div>'+
    /* CODE PANE */
    '<div class="lab-pane" data-pane="code">'+
      '<div class="opbar">'+
        '<span>Write in:</span>'+
        '<button class="chip on" id="lbEditAsm" type="button">Assembly</button>'+
        '<button class="chip" id="lbEditC" type="button">C</button>'+
        '<span style="margin-left:14px">Binary:</span>'+
        '<button class="chip on" id="lbEndBig" type="button">Big-endian</button>'+
        '<button class="chip" id="lbEndLit" type="button">Little-endian</button>'+
        '<span style="margin-left:auto;color:var(--ink-dim)">hover any line to see it across C · ASM · binary</span>'+
      '</div>'+
      '<div class="ed3">'+
        '<div class="epanel"><div class="ehead"><span class="lang tagc">C</span><span>high-level</span></div>'+
          '<div class="ebody" id="cBody"><div class="hlbar" id="cHl"></div><textarea class="code" id="cText" spellcheck="false"></textarea><div class="rows" id="cRows" style="display:none"></div></div></div>'+
        '<div class="epanel"><div class="ehead"><span class="lang taga">ARMv8 ASSEMBLY</span><span>instructions</span></div>'+
          '<div class="ebody" id="aBody"><div class="hlbar" id="aHl"></div><textarea class="code" id="aText" spellcheck="false"></textarea><div class="rows" id="aRows" style="display:none"></div></div></div>'+
        '<div class="epanel"><div class="ehead"><span class="lang tagb">BINARY</span><span>machine code</span></div>'+
          '<div class="ebody"><div class="rows bin" id="bRows"></div></div></div>'+
      '</div>'+
      '<div class="card" style="margin-top:12px"><h4>Selected line → datapath</h4><div id="lbPick" style="font:600 .8rem var(--mono);color:var(--ink-soft)">Click a line to load it into the Datapath tab.</div></div>'+
    '</div>'+
    /* MODAL */
    '<div class="modal" id="lbModal"><div class="box"><button class="x" id="lbX" type="button">Close</button><div class="crumb" id="lbCrumb"></div><div id="lbModalBody"></div></div></div>';

  var $=function(id){return document.getElementById(id);};

  /* populate instruction select */
  var sel=$("lbInst");
  Object.keys(ISA).forEach(function(mn){var o=document.createElement("option");o.value=mn;o.textContent=mn+"  ("+ISA[mn].k+")";sel.appendChild(o);});

  /* ---- render datapath SVG ---- */
  var svg=document.createElementNS(NS,"svg"); svg.setAttribute("class","dp"); svg.setAttribute("viewBox","0 0 1050 500");
  $("lbDP").appendChild(svg);
  var gE=el("g"), gN=el("g"), gP=el("g"); svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(gP);
  function el(t){return document.createElementNS(NS,t);}
  function poly(p){return p.map(function(q){return q[0]+","+q[1];}).join(" ");}
  var edgeEl={};
  Object.keys(E).forEach(function(id){var e=E[id];var pl=el("polyline");pl.setAttribute("points",poly(e.p));pl.setAttribute("class","ed");gE.appendChild(pl);edgeEl[id]=pl;
    if(e.l){var mid=e.p[Math.floor(e.p.length/2)];var tx=el("text");tx.setAttribute("x",mid[0]+4);tx.setAttribute("y",mid[1]-4);tx.setAttribute("class","elab");tx.setAttribute("data-for",id);tx.textContent=e.l;gE.appendChild(tx);}
  });
  var nodeEl={};
  Object.keys(N).forEach(function(id){var n=N[id],g=el("g");g.setAttribute("class","nd");if(n.click)g.setAttribute("data-click",n.click);
    var shape;
    if(n.mux){shape=el("rect");shape.setAttribute("rx","13");}
    else if(n.ell){shape=el("ellipse");shape.setAttribute("cx",n.x+n.w/2);shape.setAttribute("cy",n.y+n.h/2);shape.setAttribute("rx",n.w/2);shape.setAttribute("ry",n.h/2);}
    else if(n.alu){shape=el("polygon");shape.setAttribute("points",aluPts(n));}
    else{shape=el("rect");shape.setAttribute("rx","8");}
    if(!n.ell&&!n.alu){shape.setAttribute("x",n.x);shape.setAttribute("y",n.y);shape.setAttribute("width",n.w);shape.setAttribute("height",n.h);}
    g.appendChild(shape);
    if(n.t){var t=el("text");t.setAttribute("x",n.x+n.w/2);t.setAttribute("y",n.y+n.h/2+(n.s?-2:4));t.setAttribute("text-anchor","middle");t.textContent=n.t;g.appendChild(t);}
    if(n.s){var s2=el("text");s2.setAttribute("class","sub");s2.setAttribute("x",n.x+n.w/2);s2.setAttribute("y",n.y+n.h/2+12);s2.setAttribute("text-anchor","middle");s2.textContent=n.s;g.appendChild(s2);}
    if(n.mux){[["0",n.y+16],["1",n.y+n.h-8]].forEach(function(p){var mt=el("text");mt.setAttribute("class","musel");mt.setAttribute("x",n.x+7);mt.setAttribute("y",p[1]);mt.textContent=p[0];g.appendChild(mt);});}
    if(n.click)g.addEventListener("click",function(){openScene(n.click);});
    gN.appendChild(g);nodeEl[id]=g;
  });
  PORTS.forEach(function(p){var t=el("text");t.setAttribute("x",p[0]);t.setAttribute("y",p[1]);t.setAttribute("class",p[3]);t.textContent=p[2];gP.appendChild(t);});
  function aluPts(n){var x=n.x,y=n.y,w=n.w,h=n.h;return [[x,y],[x+w,y+h*0.22],[x+w,y+h*0.78],[x,y+h],[x,y+h*0.62],[x+w*0.28,y+h/2],[x,y+h*0.38]].map(function(p){return p[0]+","+p[1];}).join(" ");}

  /* ---- state ---- */
  function fresh(){var reg=new Array(32).fill(0);var seed={1:0,2:10,3:4,4:7,5:20,6:9,7:5,9:0,10:0,11:0,20:64,21:8};for(var k in seed)reg[+k]=seed[k];reg[31]=0;return {reg:reg,mem:[100,200,300,400,500,600,700,800],changed:null,memChanged:null};}
  var S=fresh();
  var cur={mn:"ADD",ops:defaults("ADD"),prof:null,stage:-1,schema:null};

  function schemaOf(mn){var f=ISA[mn].fmt;
    if(f==="R")return [["Rd",1,"reg"],["Rn",2,"reg"],["Rm",3,"reg"]];
    if(f==="I")return [["Rd",1,"reg"],["Rn",2,"reg"],["imm",5,"num"]];
    if(f==="D")return [["Rt",1,"reg"],["Rn",31,"reg"],["addr",16,"num"]];
    if(f==="CB")return [["Rt",9,"reg"],["addr",2,"num"]];
    if(f==="B")return [["addr",4,"num"]];
    if(f==="IM")return [["Rd",9,"reg"],["imm",4660,"num"],["hw",0,"sel"]];
    return [];
  }
  function buildOps(mn){cur.schema=schemaOf(mn);
    $("lbOps").innerHTML=cur.schema.map(function(f){
      if(f[2]==="sel")return '<label class="f">LSL<select id="op_'+f[0]+'"><option value="0">#0</option><option value="1">#16</option><option value="2">#32</option><option value="3">#48</option></select></label>';
      return '<label class="f">'+(f[2]==="reg"?"X":"")+f[0]+'<input class="num" id="op_'+f[0]+'" type="number" value="'+f[1]+'"></label>';
    }).join("");
    cur.schema.forEach(function(f){var e=$("op_"+f[0]); if(e)e.addEventListener("input",previewDP);});
  }
  function readOps(){var o={};cur.schema.forEach(function(f){var e=$("op_"+f[0]);o[f[0]]=e?(+e.value):f[1];});return o;}

  function previewDP(){
    cur.mn=sel.value; cur.ops=readOps(); cur.prof=profile(cur.mn); cur.stage=-1;
    renderCtrl(controlFor(cur.mn)); paint(cur.prof,true); renderState();
    $("lbStage").textContent="Ready — "+ISA[cur.mn].k+": "+asmText(cur.mn,cur.ops)+". Step to walk the stages.";
  }
  function renderCtrl(c){var order=["Reg2Loc","ALUSrc","MemtoReg","RegWrite","MemRead","MemWrite","Branch","Uncondbranch","MovZ"];
    $("lbCtrlTbl").innerHTML=order.map(function(k){return '<tr class="'+(c[k]===1?"hi":"")+'"><td>'+k+'</td><td class="v">'+c[k]+'</td></tr>';}).join("")+'<tr class="hi"><td>ALUOp</td><td class="v">'+ISA[cur.mn].alu+'</td></tr>';
  }
  function renderState(){var show=[0,1,2,3,9,10,11,20,21,31];
    $("lbState").innerHTML=show.map(function(i){return '<div class="reg'+(S.changed===i?" chg":"")+'">X'+i+' <b>'+S.reg[i]+'</b></div>';}).join("")+
      '<div class="reg" style="grid-column:1/3">mem[0..7]</div><div class="reg'+(S.memChanged!=null?" chg":"")+'" style="grid-column:3/5">['+S.mem.join(", ")+']</div>';
  }
  function paint(prof,full){
    Object.keys(nodeEl).forEach(function(id){var g=nodeEl[id];g.classList.remove("act","dim","write");if(prof.nodes.indexOf(id)>=0){if(full)g.classList.add("act");}else g.classList.add("dim");});
    Object.keys(edgeEl).forEach(function(id){var e=edgeEl[id];e.classList.remove("act","pulse","dim");if(prof.edges.indexOf(id)>=0){if(full)e.classList.add("act");}else e.classList.add("dim");});
    Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .elab"),function(t){t.classList.toggle("act",full&&prof.edges.indexOf(t.getAttribute("data-for"))>=0);});
  }
  function stageElems(prof,i){var ns=prof.nodes.slice().sort(function(a,b){return N[a].x-N[b].x;});var per=Math.ceil(ns.length/prof.seq.length);
    var nodes=ns.slice(i*per,i*per+per);var lo=i/prof.seq.length*1050,hi=(i+1)/prof.seq.length*1050;
    var edges=prof.edges.filter(function(eid){var mx=E[eid].p[0][0];return mx>=lo-130&&mx<=hi+220;});return {nodes:nodes,edges:edges};
  }
  function showStage(i){cur.stage=i;paint(cur.prof,false);
    for(var s=0;s<=i;s++){var se=stageElems(cur.prof,s);se.nodes.forEach(function(id){if(nodeEl[id])nodeEl[id].classList.add("act");});se.edges.forEach(function(id){if(edgeEl[id])edgeEl[id].classList.add(s===i?"pulse":"act");});}
    Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .elab"),function(t){t.classList.toggle("act",cur.prof.edges.indexOf(t.getAttribute("data-for"))>=0);});
    $("lbStage").textContent="Stage "+(i+1)+"/"+cur.prof.seq.length+" — "+cur.prof.seq[i];
    if(i===cur.prof.seq.length-1)commit();
  }
  function commit(){var r=ISA[cur.mn].ex(S,cur.ops);S.changed=null;S.memChanged=null;
    if(r.reg!=null&&r.reg!==31){S.reg[r.reg]=r.val|0;S.changed=r.reg;if(nodeEl.regfile)nodeEl.regfile.classList.add("write");}
    if(r.mem!=null){S.mem[r.mem]=r.val|0;S.memChanged=r.mem;if(nodeEl.dmem)nodeEl.dmem.classList.add("write");}
    if(r.branch!=null)$("lbStage").textContent+=r.branch?"  →  branch TAKEN":"  →  branch not taken";
    renderState();
  }
  var timer=null;
  function step(){if(cur.stage>=cur.prof.seq.length-1){previewDP();return;}showStage(cur.stage+1);}
  function run(){stop();previewDP();var i=0;timer=setInterval(function(){if(i>=cur.prof.seq.length){stop();return;}showStage(i);i++;},850);}
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function reset(){stop();S=fresh();previewDP();}

  $("lbStep").addEventListener("click",step);
  $("lbRun").addEventListener("click",run);
  $("lbReset").addEventListener("click",reset);
  sel.addEventListener("change",function(){stop();buildOps(sel.value);previewDP();});
  $("lbCtrl").addEventListener("click",function(){this.classList.toggle("on");$("lbCtrlCard").style.display=this.classList.contains("on")?"":"none";});

  /* ---- 3D drag ---- */
  var d3=false,rx=16,ry=-14,drag=false,px=0,py=0;
  $("lb3d").addEventListener("click",function(){d3=!d3;this.classList.toggle("on",d3);$("lbWrap").classList.toggle("d3",d3);applyTilt();});
  function applyTilt(){svg.style.transform=d3?("rotateX("+rx+"deg) rotateY("+ry+"deg) scale(.96)"):"";}
  $("lbWrap").addEventListener("pointerdown",function(e){if(!d3)return;drag=true;px=e.clientX;py=e.clientY;});
  window.addEventListener("pointermove",function(e){if(!drag)return;ry+=(e.clientX-px)*0.3;rx-=(e.clientY-py)*0.3;rx=Math.max(-40,Math.min(60,rx));px=e.clientX;py=e.clientY;applyTilt();});
  window.addEventListener("pointerup",function(){drag=false;});

  /* ---- drill-down modal ---- */
  var crumb=[];
  function openScene(id){crumb=[id];renderScene();$("lbModal").classList.add("open");}
  function renderScene(){var id=crumb[crumb.length-1];var sc=SCENES[id]?SCENES[id]():{title:id,desc:"",svg:""};
    $("lbCrumb").innerHTML=crumb.map(function(c,i){var name=(SCENES[c]?(SCENES[c]().title.split(" —")[0]):c);return i<crumb.length-1?'<a data-i="'+i+'">'+name+'</a><span>›</span>':'<span style="color:var(--on)">'+name+'</span>';}).join("");
    $("lbModalBody").innerHTML='<h3>'+sc.title+'</h3><p class="d">'+sc.desc+'</p>'+sc.svg;
    Array.prototype.forEach.call($("lbCrumb").querySelectorAll("a"),function(a){a.addEventListener("click",function(){crumb=crumb.slice(0,+a.dataset.i+1);renderScene();});});
    Array.prototype.forEach.call($("lbModalBody").querySelectorAll("[data-scene]"),function(g){g.addEventListener("click",function(){crumb.push(g.getAttribute("data-scene"));renderScene();});});
  }
  $("lbX").addEventListener("click",function(){$("lbModal").classList.remove("open");});
  $("lbModal").addEventListener("click",function(e){if(e.target===this)this.classList.remove("open");});

  /* ======================================================================
     CODE EDITOR (C / ASM / Binary) with cross-highlight + endianness
     ====================================================================== */
  var editLang="asm", endian="big";
  var prog=[]; // [{c,asm,mn,ops,bits,err}]
  var DEMO_ASM=["MOVZ X9, #4660, LSL #0","ADD X1, X2, X3","SUBI X4, X4, #1","LDUR X10, [X31, #16]","STUR X1, [X31, #24]","CBZ X4, #2","B #0"].join("\n");

  function recompute(){
    var src=(editLang==="asm"?$("aText").value:$("cText").value).replace(/\r/g,"").split("\n");
    prog=src.map(function(line){
      var c,asm,parsed;
      if(editLang==="asm"){ asm=line; parsed=parseAsm(line);
        if(parsed&&!parsed.error){c=ISA[parsed.mn].c(parsed.ops);} else {c=line.trim()?(parsed&&parsed.error?"// "+parsed.error:""):"";}
      } else { c=line; var a=compileC(line); asm=a||""; parsed=a?parseAsm(a):null; }
      var bits=(parsed&&!parsed.error)?bits32(parsed.mn,parsed.ops):null;
      return {c:(c||"").replace(/^\/\/.*/,function(m){return m;}), asm:(asm||""), bits:bits, ok:!!(parsed&&!parsed.error), mn:parsed&&parsed.mn, ops:parsed&&parsed.ops};
    });
    renderRows();
  }
  function endianBytes(bits){ // 32-bit string -> array of 4 byte-strings in display order
    var b=[bits.slice(0,8),bits.slice(8,16),bits.slice(16,24),bits.slice(24,32)];
    return endian==="big"?b:b.slice().reverse();
  }
  function renderRows(){
    // C + ASM rendered rows (the non-edited ones) + editable textarea mirror
    var cR=[],aR=[],bR=[];
    prog.forEach(function(p,i){
      var ln='<span class="ln">'+i+'</span>';
      cR.push('<div class="r" data-i="'+i+'">'+ln+esc(p.c)+'</div>');
      aR.push('<div class="r'+(p.asm.trim()&&!p.ok?' err':'')+'" data-i="'+i+'">'+ln+esc(p.asm)+'</div>');
      if(p.bits){var by=endianBytes(p.bits);bR.push('<div class="r" data-i="'+i+'">'+ln+by.map(function(x){return '<span class="byte" style="background:rgba(127,227,255,.10)">'+x+'</span>';}).join(" ")+'  <span style="color:var(--ink-dim)">0x'+parseInt(by.join(""),2).toString(16).toUpperCase().padStart(8,"0")+'</span></div>');}
      else bR.push('<div class="r" data-i="'+i+'"><span class="ln">'+i+'</span><span style="color:var(--ink-dim)">'+(p.asm.trim()?"— (not encodable)":"")+'</span></div>');
    });
    // show rendered rows for the non-edited languages; editable one keeps textarea
    $("cRows").innerHTML=cR.join(""); $("aRows").innerHTML=aR.join(""); $("bRows").innerHTML=bR.join("");
    $("cRows").style.display = editLang==="c" ? "none":"block";
    $("aRows").style.display = editLang==="asm"? "none":"block";
    $("cText").style.display = editLang==="c" ? "block":"none";
    $("aText").style.display = editLang==="asm"? "block":"none";
    bindHover();
  }
  function esc(s){return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");}
  function bindHover(){
    Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .rows .r"),function(r){
      r.addEventListener("mouseenter",function(){hi(+r.dataset.i);});
      r.addEventListener("mouseleave",clearHi);
      r.addEventListener("click",function(){pickLine(+r.dataset.i);});
    });
  }
  function hi(i){clearHi();
    Array.prototype.forEach.call(document.querySelectorAll('#cpuSim .rows .r[data-i="'+i+'"]'),function(r){r.classList.add("hl");});
    // editable textarea highlight bar
    var bar = editLang==="asm"?$("aHl"):$("cHl");
    var body = editLang==="asm"?$("aBody"):$("cBody");
    if(bar&&body){bar.style.display="block";bar.style.top=(i*LH+6-body.scrollTop)+"px";}
  }
  function clearHi(){Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .rows .r.hl"),function(r){r.classList.remove("hl");});$("aHl").style.display="none";$("cHl").style.display="none";}
  function pickLine(i){var p=prog[i];if(!p||!p.ok)return;
    sel.value=p.mn;buildOps(p.mn);cur.schema.forEach(function(f){var e=$("op_"+f[0]);if(e&&p.ops[f[0]]!=null)e.value=p.ops[f[0]];});previewDP();
    $("lbPick").innerHTML='Loaded <b style="color:var(--on)">'+esc(p.asm.trim())+'</b> into the Datapath tab — switch to it and press Run.';
  }

  $("aText").addEventListener("input",function(){if(editLang==="asm")recompute();});
  $("cText").addEventListener("input",function(){if(editLang==="c")recompute();});
  $("aBody").addEventListener("scroll",function(){if($("aHl").style.display==="block")$("aHl").style.top=(parseFloat($("aHl").dataset.i||0));});
  $("lbEditAsm").addEventListener("click",function(){editLang="asm";this.classList.add("on");$("lbEditC").classList.remove("on");
    // keep asm content; ensure textarea has it
    if(!$("aText").value.trim())$("aText").value=DEMO_ASM; recompute();});
  $("lbEditC").addEventListener("click",function(){editLang="c";this.classList.add("on");$("lbEditAsm").classList.remove("on");
    // seed C from current program if C textarea empty
    if(!$("cText").value.trim())$("cText").value=prog.map(function(p){return p.c;}).filter(Boolean).join("\n"); recompute();});
  $("lbEndBig").addEventListener("click",function(){endian="big";this.classList.add("on");$("lbEndLit").classList.remove("on");renderRows();});
  $("lbEndLit").addEventListener("click",function(){endian="little";this.classList.add("on");$("lbEndBig").classList.remove("on");renderRows();});

  /* ---- tabs ---- */
  Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-tab"),function(t){
    t.addEventListener("click",function(){
      Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-tab"),function(x){x.classList.remove("on");});
      Array.prototype.forEach.call(document.querySelectorAll("#cpuSim .lab-pane"),function(x){x.classList.remove("on");});
      t.classList.add("on");document.querySelector('#cpuSim .lab-pane[data-pane="'+t.dataset.pane+'"]').classList.add("on");
    });
  });

  /* ---- init ---- */
  sel.value="ADD"; buildOps("ADD"); previewDP();
  $("aText").value=DEMO_ASM; recompute();
})();
