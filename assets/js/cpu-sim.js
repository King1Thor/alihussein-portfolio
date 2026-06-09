/* ============================================================================
   cpu-sim.js — Interactive single-cycle ARMv8 (LEGv8) datapath simulator
   Mounts into #cpuSim on the Playground page. Vanilla JS + SVG, no deps.
   Encodings & control match Ali's Verilog SC_Control project.
   Theme follows the site CSS variables (works in dark & light).
   ============================================================================ */
(function () {
  "use strict";
  var mount = document.getElementById("cpuSim");
  if (!mount) return;

  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- scoped styles (use site tokens so dark/light just works) ---------- */
  var css = document.createElement("style");
  css.textContent = [
    "#cpuSim{--cs-on:var(--steel-2,#7fe3ff);--cs-acc:var(--maroon-2,#b51d35);--cs-good:var(--good,#43e08a);}",
    "#cpuSim .cs-wrap{display:grid;grid-template-columns:1.55fr .95fr;gap:18px;}",
    "@media(max-width:920px){#cpuSim .cs-wrap{grid-template-columns:1fr;}}",
    "#cpuSim .cs-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:14px;}",
    "#cpuSim label.cs-f{display:flex;flex-direction:column;gap:4px;font:600 .7rem/1 var(--font-mono,monospace);letter-spacing:.1em;color:var(--ink-soft);text-transform:uppercase;}",
    "#cpuSim select,#cpuSim input{background:var(--panel-2,#0c101a);color:var(--ink,#eef2fb);border:1px solid var(--line-2,rgba(150,170,210,.22));border-radius:10px;padding:8px 10px;font:500 .9rem var(--font-mono,monospace);}",
    "#cpuSim input.cs-num{width:62px;}",
    "#cpuSim .cs-btns{display:flex;gap:8px;margin-left:auto;}",
    "#cpuSim .cs-chiprow{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 12px;}",
    "#cpuSim .cs-chip{cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink-soft);border-radius:999px;padding:6px 13px;font:600 .72rem var(--font-mono,monospace);letter-spacing:.06em;transition:.18s;}",
    "#cpuSim .cs-chip.on{background:var(--cs-acc);border-color:var(--cs-acc);color:#fff;}",
    "#cpuSim .cs-chip:disabled{opacity:.4;cursor:not-allowed;}",
    "#cpuSim .cs-stage{font:600 .74rem var(--font-mono,monospace);color:var(--cs-on);letter-spacing:.08em;min-height:1.1em;margin-bottom:8px;}",
    "#cpuSim svg.cs-dp{width:100%;height:auto;display:block;background:radial-gradient(120% 90% at 70% -10%,rgba(181,29,53,.10),transparent 55%);border:1px solid var(--line);border-radius:14px;}",
    "#cpuSim .nd rect,#cpuSim .nd ellipse,#cpuSim .nd polygon{fill:var(--panel-2,#0c101a);stroke:var(--line-2,rgba(150,170,210,.3));stroke-width:1.4;transition:stroke .25s,fill .25s,filter .25s;}",
    "#cpuSim .nd text{fill:var(--ink,#eef2fb);font:600 12px var(--font-display,sans-serif);}",
    "#cpuSim .nd .sub{fill:var(--ink-soft,#aeb7cc);font:500 10px var(--font-mono,monospace);}",
    "#cpuSim .nd.dim{opacity:.32;}",
    "#cpuSim .nd.act rect,#cpuSim .nd.act ellipse,#cpuSim .nd.act polygon{stroke:var(--cs-on);stroke-width:2.4;fill:rgba(88,182,255,.10);filter:drop-shadow(0 0 10px var(--steel-glow,rgba(88,182,255,.4)));}",
    "#cpuSim .nd.write rect{stroke:var(--cs-good);filter:drop-shadow(0 0 10px rgba(67,224,138,.5));}",
    "#cpuSim .nd[data-click]{cursor:pointer;}",
    "#cpuSim .ed{fill:none;stroke:var(--line-2,rgba(150,170,210,.3));stroke-width:1.6;transition:stroke .25s,opacity .25s;}",
    "#cpuSim .ed.dim{opacity:.22;}",
    "#cpuSim .ed.act{stroke:var(--cs-on);stroke-width:2.6;}",
    "#cpuSim .ed.pulse{stroke:var(--cs-acc);stroke-width:3;stroke-dasharray:10 14;animation:csflow .9s linear infinite;filter:drop-shadow(0 0 6px var(--maroon-glow));}",
    "@keyframes csflow{to{stroke-dashoffset:-48;}}",
    "#cpuSim .ed-lab{fill:var(--ink-dim,#6f7891);font:600 9px var(--font-mono,monospace);}",
    "#cpuSim .ed-lab.act{fill:var(--cs-on);}",
    "#cpuSim .cs-side{display:flex;flex-direction:column;gap:14px;}",
    "#cpuSim .cs-card{border:1px solid var(--line);border-radius:14px;padding:14px 15px;background:var(--panel,rgba(18,23,36,.55));}",
    "#cpuSim .cs-card h4{margin:0 0 9px;font:700 .7rem var(--font-mono,monospace);letter-spacing:.14em;color:var(--ink-soft);text-transform:uppercase;}",
    "#cpuSim .cs-asm{font:600 1.02rem var(--font-mono,monospace);color:var(--ink);}",
    "#cpuSim .cs-c{font:500 .9rem var(--font-mono,monospace);color:var(--cs-good);margin-top:6px;}",
    "#cpuSim .cs-bits{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}",
    "#cpuSim .cs-field{display:flex;flex-direction:column;align-items:center;gap:3px;}",
    "#cpuSim .cs-field .b{font:600 .82rem var(--font-mono,monospace);letter-spacing:.04em;padding:4px 6px;border-radius:6px;color:#fff;}",
    "#cpuSim .cs-field .n{font:600 .56rem var(--font-mono,monospace);color:var(--ink-dim);text-transform:uppercase;letter-spacing:.04em;}",
    "#cpuSim table.cs-ctrl{width:100%;border-collapse:collapse;font:600 .74rem var(--font-mono,monospace);}",
    "#cpuSim table.cs-ctrl td{padding:3px 4px;color:var(--ink-soft);}",
    "#cpuSim table.cs-ctrl td.v{text-align:right;color:var(--ink-dim);}",
    "#cpuSim table.cs-ctrl tr.hi td{color:var(--cs-on);}",
    "#cpuSim table.cs-ctrl tr.hi td.v{color:var(--cs-on);}",
    "#cpuSim .cs-state{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;font:600 .72rem var(--font-mono,monospace);}",
    "#cpuSim .cs-reg{border:1px solid var(--line);border-radius:8px;padding:5px 6px;color:var(--ink-soft);}",
    "#cpuSim .cs-reg b{color:var(--ink);}",
    "#cpuSim .cs-reg.chg{border-color:var(--cs-good);color:var(--cs-good);}",
    "#cpuSim .cs-reg.chg b{color:var(--cs-good);}",
    "#cpuSim .cs-modal{position:fixed;inset:0;background:rgba(3,5,10,.74);backdrop-filter:blur(6px);display:none;place-items:center;z-index:120;padding:20px;}",
    "#cpuSim .cs-modal.open{display:grid;}",
    "#cpuSim .cs-modal .box{max-width:760px;width:100%;background:var(--bg-2,#080b14);border:1px solid var(--line-2);border-radius:18px;padding:22px;box-shadow:var(--shadow);}",
    "#cpuSim .cs-modal .box h3{margin:0 0 4px;font-family:var(--font-display);}",
    "#cpuSim .cs-modal .box p{color:var(--ink-soft);font-size:.9rem;margin:0 0 14px;}",
    "#cpuSim .cs-x{float:right;cursor:pointer;border:1px solid var(--line-2);background:transparent;color:var(--ink);border-radius:9px;padding:5px 11px;font:600 .8rem var(--font-mono,monospace);}"
  ].join("\n");
  mount.appendChild(css);

  /* ---------------------------- ISA model -------------------------------- */
  // Field colors
  var FC = { op:"#b51d35", rm:"#2f7bd6", rn:"#2f7bd6", rd:"#2f7bd6", rt:"#2f7bd6",
            sh:"#6f7891", imm:"#3a9d6b", hw:"#8a5cc0", addr:"#3a9d6b", op2:"#6f7891" };

  function bin(v, n) { v = (v % Math.pow(2, n) + Math.pow(2, n)) % Math.pow(2, n); var s = v.toString(2); while (s.length < n) s = "0" + s; return s; }

  // Each instruction: fmt, opcode bits, operand schema, encode(), c(), control, alu op, exec()
  var ISA = {
    ADD:  { fmt:"R", op:"10001011000", k:"R-type", alu:"ADD",
            c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + X"+o.Rm+";";},
            exec:function(s,o){return {reg:o.Rd, val:s.reg[o.Rn]+s.reg[o.Rm]};} },
    SUB:  { fmt:"R", op:"11001011000", k:"R-type", alu:"SUB",
            c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - X"+o.Rm+";";},
            exec:function(s,o){return {reg:o.Rd, val:s.reg[o.Rn]-s.reg[o.Rm]};} },
    AND:  { fmt:"R", op:"10001010000", k:"R-type", alu:"AND",
            c:function(o){return "X"+o.Rd+" = X"+o.Rn+" & X"+o.Rm+";";},
            exec:function(s,o){return {reg:o.Rd, val:s.reg[o.Rn]&s.reg[o.Rm]};} },
    ORR:  { fmt:"R", op:"10101010000", k:"R-type", alu:"ORR",
            c:function(o){return "X"+o.Rd+" = X"+o.Rn+" | X"+o.Rm+";";},
            exec:function(s,o){return {reg:o.Rd, val:s.reg[o.Rn]|s.reg[o.Rm]};} },
    ADDI: { fmt:"I", op:"1001000100", k:"I-type", alu:"ADD",
            c:function(o){return "X"+o.Rd+" = X"+o.Rn+" + "+o.imm+";";},
            exec:function(s,o){return {reg:o.Rd, val:s.reg[o.Rn]+o.imm};} },
    SUBI: { fmt:"I", op:"1101000100", k:"I-type", alu:"SUB",
            c:function(o){return "X"+o.Rd+" = X"+o.Rn+" - "+o.imm+";";},
            exec:function(s,o){return {reg:o.Rd, val:s.reg[o.Rn]-o.imm};} },
    LDUR: { fmt:"D", op:"11111000010", k:"Load", alu:"ADD",
            c:function(o){return "X"+o.Rt+" = mem[X"+o.Rn+" + "+o.addr+"];";},
            exec:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {reg:o.Rt, val:s.mem[i], memRead:i};} },
    STUR: { fmt:"D", op:"11111000000", k:"Store", alu:"ADD",
            c:function(o){return "mem[X"+o.Rn+" + "+o.addr+"] = X"+o.Rt+";";},
            exec:function(s,o){var i=((s.reg[o.Rn]+o.addr)>>3)&7;return {mem:i, val:s.reg[o.Rt]};} },
    CBZ:  { fmt:"CB", op:"10110100", k:"Branch", alu:"PASSB",
            c:function(o){return "if (X"+o.Rt+" == 0) goto PC+("+o.addr+"<<2);";},
            exec:function(s,o){return {branch:(s.reg[o.Rt]===0)};} },
    B:    { fmt:"B", op:"000101", k:"Branch", alu:"ADD",
            c:function(o){return "goto PC+("+o.addr+"<<2);";},
            exec:function(s,o){return {branch:true};} },
    MOVZ: { fmt:"IM", op:"110100101", k:"Move", alu:"PASSB",
            c:function(o){return "X"+o.Rd+" = "+o.imm+" << "+(o.hw*16)+";";},
            exec:function(s,o){return {reg:o.Rd, val:(o.imm*Math.pow(2,o.hw*16))};} }
  };

  // operand schema per format -> [{key,label,type,def,min,max,opts}]
  function schema(fmt) {
    if (fmt==="R")  return [reg("Rd",1),reg("Rn",2),reg("Rm",3)];
    if (fmt==="I")  return [reg("Rd",1),reg("Rn",2),imm("imm",5,0,4095)];
    if (fmt==="D")  return [reg("Rt",1),reg("Rn",31),imm("addr",16,0,504,8)];
    if (fmt==="CB") return [reg("Rt",9),imm("addr",2,0,255)];
    if (fmt==="B")  return [imm("addr",4,0,9999)];
    if (fmt==="IM") return [reg("Rd",9),imm("imm",4660,0,65535),{key:"hw",label:"LSL",type:"sel",def:0,opts:[[0,"#0"],[1,"#16"],[2,"#32"],[3,"#48"]]}];
    return [];
  }
  function reg(k,d){return {key:k,label:k,type:"reg",def:d,min:0,max:31};}
  function imm(k,d,min,max,step){return {key:k,label:k,type:"num",def:d,min:min,max:max,step:step||1};}

  // control signals per format (matches SC_Control); '-' = don't care
  function control(fmt) {
    var z={Reg2Loc:0,ALUSrc:0,MemtoReg:0,RegWrite:0,MemRead:0,MemWrite:0,Branch:0,Uncondbranch:0,MovZ:0};
    if (fmt==="R")  return ext(z,{RegWrite:1});
    if (fmt==="I")  return ext(z,{ALUSrc:1,RegWrite:1});
    if (fmt==="IM") return ext(z,{ALUSrc:1,RegWrite:1,MovZ:1});
    if (fmt==="D")  return null; // handled per-mnem below
    if (fmt==="CB") return ext(z,{Reg2Loc:1,Branch:1});
    if (fmt==="B")  return ext(z,{Uncondbranch:1});
    return z;
  }
  function ext(a,b){var o={};for(var k in a)o[k]=a[k];for(var k2 in b)o[k2]=b[k2];return o;}
  function controlFor(mn) {
    var fmt = ISA[mn].fmt;
    if (mn==="LDUR") return {Reg2Loc:0,ALUSrc:1,MemtoReg:1,RegWrite:1,MemRead:1,MemWrite:0,Branch:0,Uncondbranch:0,MovZ:0};
    if (mn==="STUR") return {Reg2Loc:1,ALUSrc:1,MemtoReg:0,RegWrite:0,MemRead:0,MemWrite:1,Branch:0,Uncondbranch:0,MovZ:0};
    return control(fmt);
  }

  // encode -> [{name,bits,color}]
  function encode(mn,o) {
    var I=ISA[mn], f=I.fmt, F=[];
    function add(name,bits,color){F.push({name:name,bits:bits,color:color});}
    if (f==="R"){ add("opcode",I.op,FC.op); add("Rm",bin(o.Rm,5),FC.rm); add("shamt","000000",FC.sh); add("Rn",bin(o.Rn,5),FC.rn); add("Rd",bin(o.Rd,5),FC.rd); }
    else if (f==="I"){ add("opcode",I.op,FC.op); add("immediate",bin(o.imm,12),FC.imm); add("Rn",bin(o.Rn,5),FC.rn); add("Rd",bin(o.Rd,5),FC.rd); }
    else if (f==="D"){ add("opcode",I.op,FC.op); add("DT_addr",bin(o.addr,9),FC.addr); add("op",  "00",FC.op2); add("Rn",bin(o.Rn,5),FC.rn); add("Rt",bin(o.Rt,5),FC.rt); }
    else if (f==="CB"){ add("opcode",I.op,FC.op); add("addr",bin(o.addr,19),FC.addr); add("Rt",bin(o.Rt,5),FC.rt); }
    else if (f==="B"){ add("opcode",I.op,FC.op); add("addr",bin(o.addr,26),FC.addr); }
    else if (f==="IM"){ add("opcode",I.op,FC.op); add("hw",bin(o.hw,2),FC.hw); add("immediate",bin(o.imm,16),FC.imm); add("Rd",bin(o.Rd,5),FC.rd); }
    return F;
  }
  function asmText(mn,o){
    var f=ISA[mn].fmt;
    if (f==="R")  return mn+" X"+o.Rd+", X"+o.Rn+", X"+o.Rm;
    if (f==="I")  return mn+" X"+o.Rd+", X"+o.Rn+", #"+o.imm;
    if (f==="D")  return mn+" X"+o.Rt+", [X"+o.Rn+", #"+o.addr+"]";
    if (f==="CB") return mn+" X"+o.Rt+", #"+o.addr;
    if (f==="B")  return mn+" #"+o.addr;
    if (f==="IM") return mn+" X"+o.Rd+", #"+o.imm+", LSL #"+(o.hw*16);
    return mn;
  }

  /* --------------------------- datapath layout --------------------------- */
  var NODES = {
    pc:      {x:34,  y:250, w:46, h:74,  t:"PC"},
    pc4:     {x:150, y:60,  w:72, h:46,  t:"Add", s:"PC+4"},
    imem:    {x:150, y:244, w:118,h:86,  t:"Instruction", s:"Memory"},
    control: {x:430, y:42,  w:158,h:62,  t:"Control", s:"Unit", ell:true, click:"control"},
    regfile: {x:418, y:226, w:150,h:122, t:"Register", s:"File", click:"regfile"},
    reg2loc: {x:372, y:332, w:26, h:58,  mux:true},
    signext: {x:418, y:404, w:140,h:44,  t:"Sign-extend", click:"signext"},
    alusrc:  {x:598, y:280, w:26, h:74,  mux:true},
    alu:     {x:660, y:222, w:96, h:138, t:"ALU", alu:true, click:"alu"},
    aluctrl: {x:648, y:418, w:110,h:38,  t:"ALU control"},
    dmem:    {x:824, y:248, w:120,h:104, t:"Data", s:"Memory", click:"dmem"},
    memtoreg:{x:984, y:262, w:26, h:74,  mux:true},
    shift2:  {x:600, y:128, w:60, h:34,  t:"<<2"},
    baddr:   {x:700, y:62,  w:72, h:46,  t:"Add", s:"branch"},
    band:    {x:812, y:80,  w:40, h:34,  t:"&"},
    pcsrc:   {x:902, y:54,  w:26, h:74,  mux:true}
  };
  // edges: id -> {pts:[[x,y]...], lab?, lx?, ly?}
  function R(n){return [NODES[n].x+NODES[n].w, NODES[n].y+NODES[n].h/2];}
  function L(n){return [NODES[n].x, NODES[n].y+NODES[n].h/2];}
  function T(n){return [NODES[n].x+NODES[n].w/2, NODES[n].y];}
  function Bt(n){return [NODES[n].x+NODES[n].w/2, NODES[n].y+NODES[n].h];}
  var EDGES = {
    pc_imem:   {pts:[R("pc"),L("imem")]},
    pc_pc4:    {pts:[[57,250],[57,83],L("pc4")]},
    pc4_pcsrc: {pts:[R("pc4"),[902,83]], lab:"PC+4"},
    imem_ctrl: {pts:[[209,244],[209,73],L("control")], lab:"opcode"},
    imem_rf:   {pts:[R("imem"),[300,260],[418,260]], lab:"Rn/Rm"},
    imem_r2:   {pts:[[268,300],[372,348]]},
    imem_se:   {pts:[[268,320],[360,426],L("signext")]},
    r2_rf:     {pts:[R("reg2loc"),[418,330]]},
    rf_a:      {pts:[[568,262],[640,250],[660,250]], lab:"BusA"},
    rf_b:      {pts:[[568,320],[598,317]], lab:"BusB"},
    se_alusrc: {pts:[R("signext"),[590,440],[590,348],L("alusrc")]},
    alusrc_alu:{pts:[R("alusrc"),[660,330]]},
    alu_dmem:  {pts:[R("alu"),[800,291],L("dmem")], lab:"address"},
    b_dmemwr:  {pts:[[582,344],[582,372],[800,372],[824,330]], lab:"write data"},
    alu_m2r0:  {pts:[[756,300],[984,300]]},
    dmem_m2r1: {pts:[R("dmem"),[970,310],[984,310]], lab:"read data"},
    m2r_wb:    {pts:[R("memtoreg"),[1024,299],[1024,470],[400,470],[400,348],[418,344]], lab:"write back"},
    se_shift:  {pts:[[490,404],[490,145],L("shift2")]},
    shift_b:   {pts:[R("shift2"),[680,145],[680,96],L("baddr")]},
    pc_b:      {pts:[[57,250],[57,30],[640,30],[640,73],L("baddr")]},
    b_pcsrc:   {pts:[R("baddr"),[890,85],[902,103]]},
    pcsrc_pc:  {pts:[T("pcsrc"),[915,16],[16,16],[16,250],L("pc")]},
    ctrl_br:   {pts:[Bt("control"),[509,118],[760,118],[812,90]], lab:"Branch"},
    alu_zero:  {pts:[[700,222],[700,200],[820,200],[820,114]], lab:"Zero"},
    band_pcsrc:{pts:[R("band"),[889,97]]}
  };

  // active sets per format/mnemonic
  function profile(mn) {
    var f=ISA[mn].fmt;
    var base=["pc","imem","control","pc4","pcsrc"];
    var be=["pc_imem","pc_pc4","imem_ctrl","pc4_pcsrc","pcsrc_pc"];
    if (f==="R")  return {nodes:base.concat("regfile","alu","aluctrl","memtoreg"),
      edges:be.concat("imem_rf","rf_a","rf_b","alusrc_alu","alu_m2r0","m2r_wb"), seq:rSeq(false)};
    if (f==="I")  return {nodes:base.concat("regfile","signext","alusrc","alu","aluctrl","memtoreg"),
      edges:be.concat("imem_rf","imem_se","rf_a","se_alusrc","alusrc_alu","alu_m2r0","m2r_wb"), seq:rSeq(true)};
    if (f==="IM") return {nodes:base.concat("regfile","signext","alusrc","alu","memtoreg"),
      edges:be.concat("imem_se","se_alusrc","alusrc_alu","alu_m2r0","m2r_wb"), seq:["Fetch","Decode · MovZ=1","Build immediate","ALU pass-through","Write back X register"]};
    if (mn==="LDUR") return {nodes:base.concat("regfile","signext","alusrc","alu","aluctrl","dmem","memtoreg"),
      edges:be.concat("imem_rf","imem_se","rf_a","se_alusrc","alusrc_alu","alu_dmem","dmem_m2r1","m2r_wb"),
      seq:["Fetch","Decode (MemRead, RegWrite)","Read base + sign-extend offset","ALU computes address","Read data memory","Write loaded value to register"]};
    if (mn==="STUR") return {nodes:base.concat("regfile","reg2loc","signext","alusrc","alu","aluctrl","dmem"),
      edges:be.concat("imem_rf","imem_r2","imem_se","r2_rf","rf_a","se_alusrc","alusrc_alu","alu_dmem","b_dmemwr"),
      seq:["Fetch","Decode (MemWrite=1, Reg2Loc=1)","Read base + value (Rt via Reg2Loc mux)","ALU computes address","Write value to data memory","(no register write-back)"]};
    if (f==="CB") return {nodes:base.concat("regfile","reg2loc","alu","signext","shift2","baddr","band"),
      edges:be.concat("imem_rf","imem_r2","r2_rf","rf_a","alusrc_alu","se_shift","shift_b","pc_b","b_pcsrc","ctrl_br","alu_zero","band_pcsrc"),
      seq:["Fetch","Decode (Branch=1, Reg2Loc=1)","Read register, ALU tests for zero","Sign-extend & shift offset <<2","Branch adder forms target","Branch taken iff Zero & Branch → PCSrc"]};
    if (f==="B")  return {nodes:base.concat("signext","shift2","baddr"),
      edges:be.concat("imem_se","se_shift","shift_b","pc_b","b_pcsrc"),
      seq:["Fetch","Decode (Uncondbranch=1)","Sign-extend & shift offset <<2","Branch adder forms target","PCSrc selects branch target — always taken"]};
    return {nodes:base,edges:be,seq:["Fetch"]};
  }
  function rSeq(imm){return ["Fetch instruction","Decode + read register file",(imm?"Sign-extend immediate":"Read second register"),"ALU executes operation","Write result back to register"];}

  /* ------------------------------ build DOM ------------------------------ */
  mount.innerHTML +=
    '<div class="cs-toolbar">' +
      '<label class="cs-f">Instruction<select id="csInst"></select></label>' +
      '<span id="csOps"></span>' +
      '<div class="cs-btns">' +
        '<button class="btn btn-ghost" id="csStep" type="button">Step</button>' +
        '<button class="btn btn-primary" id="csRun" type="button">Run</button>' +
        '<button class="btn btn-ghost" id="csReset" type="button">Reset</button>' +
      '</div>' +
    '</div>' +
    '<div class="cs-chiprow">' +
      '<button class="cs-chip on" id="csLayerCtrl" type="button">Control signals</button>' +
      '<button class="cs-chip" id="csLayerAlu" type="button">ALU internals</button>' +
      '<button class="cs-chip" type="button" disabled title="Planned">RTL view &middot; soon</button>' +
      '<button class="cs-chip" type="button" disabled title="Planned">Timing mode &middot; soon</button>' +
      '<button class="cs-chip" type="button" disabled title="Planned">Pipeline &middot; soon</button>' +
    '</div>' +
    '<div class="cs-wrap">' +
      '<div><div class="cs-stage" id="csStage">Pick an instruction, then Step or Run.</div><div id="csDP"></div></div>' +
      '<div class="cs-side">' +
        '<div class="cs-card"><h4>Assembly &rarr; C</h4><div class="cs-asm" id="csAsm"></div><div class="cs-c" id="csC"></div></div>' +
        '<div class="cs-card"><h4>32-bit encoding</h4><div class="cs-bits" id="csBits"></div></div>' +
        '<div class="cs-card" id="csCtrlCard"><h4>Control signals</h4><table class="cs-ctrl"><tbody id="csCtrl"></tbody></table></div>' +
        '<div class="cs-card"><h4>Machine state</h4><div class="cs-state" id="csState"></div></div>' +
      '</div>' +
    '</div>' +
    '<div class="cs-modal" id="csModal"><div class="box"><button class="cs-x" id="csModalX" type="button">Close</button><div id="csModalBody"></div></div></div>';

  var $ = function (id) { return document.getElementById(id); };

  // populate instruction select
  var selInst = $("csInst");
  Object.keys(ISA).forEach(function (mn) {
    var o = document.createElement("option"); o.value = mn;
    o.textContent = mn + "  (" + ISA[mn].k + ")"; selInst.appendChild(o);
  });

  /* --------------------------- render SVG once --------------------------- */
  var svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "cs-dp");
  svg.setAttribute("viewBox", "0 0 1040 500");
  $("csDP").appendChild(svg);
  var gEdges = mk("g"), gNodes = mk("g");
  svg.appendChild(gEdges); svg.appendChild(gNodes);

  function mk(t){return document.createElementNS(SVGNS,t);}
  function poly(pts){ return pts.map(function(p){return p[0]+","+p[1];}).join(" "); }

  var edgeEls = {};
  Object.keys(EDGES).forEach(function (id) {
    var e = EDGES[id];
    var pl = mk("polyline"); pl.setAttribute("points", poly(e.pts)); pl.setAttribute("class", "ed");
    pl.setAttribute("data-id", id); gEdges.appendChild(pl); edgeEls[id] = pl;
    if (e.lab) {
      var mid = e.pts[Math.floor(e.pts.length/2)];
      var tx = mk("text"); tx.setAttribute("x", (e.lx||mid[0])+4); tx.setAttribute("y",(e.ly||mid[1])-4);
      tx.setAttribute("class","ed-lab"); tx.setAttribute("data-for",id); tx.textContent=e.lab; gEdges.appendChild(tx);
    }
  });

  var nodeEls = {};
  Object.keys(NODES).forEach(function (id) {
    var n = NODES[id], g = mk("g"); g.setAttribute("class","nd"); g.setAttribute("data-id",id);
    if (n.click){ g.setAttribute("data-click", n.click); }
    var shape;
    if (n.mux){ shape = mk("rect"); shape.setAttribute("rx","13"); }
    else if (n.ell){ shape = mk("ellipse"); shape.setAttribute("cx",n.x+n.w/2); shape.setAttribute("cy",n.y+n.h/2); shape.setAttribute("rx",n.w/2); shape.setAttribute("ry",n.h/2); }
    else if (n.alu){ shape = mk("polygon"); shape.setAttribute("points", aluPts(n)); }
    else { shape = mk("rect"); shape.setAttribute("rx","8"); }
    if (!n.ell && !n.alu){ shape.setAttribute("x",n.x); shape.setAttribute("y",n.y); shape.setAttribute("width",n.w); shape.setAttribute("height",n.h); }
    g.appendChild(shape);
    if (n.t){ var t=mk("text"); t.setAttribute("x",n.x+n.w/2); t.setAttribute("y",n.y+n.h/2+(n.s?-2:4)); t.setAttribute("text-anchor","middle"); t.textContent=n.t; g.appendChild(t); }
    if (n.s){ var st=mk("text"); st.setAttribute("class","sub"); st.setAttribute("x",n.x+n.w/2); st.setAttribute("y",n.y+n.h/2+12); st.setAttribute("text-anchor","middle"); st.textContent=n.s; g.appendChild(st); }
    if (n.click){ g.addEventListener("click", function(){ openInternals(n.click); }); }
    gNodes.appendChild(g); nodeEls[id]=g;
  });
  function aluPts(n){ var x=n.x,y=n.y,w=n.w,h=n.h,c=h*0.18; return [
    [x,y],[x+w,y+h*0.22],[x+w,y+h*0.78],[x,y+h],[x,y+h*0.62],[x+w*0.28,y+h/2],[x,y+h*0.38]
  ].map(function(p){return p[0]+","+p[1];}).join(" "); }

  /* ------------------------------- state --------------------------------- */
  var S = freshState();
  function freshState(){
    var reg = new Array(32).fill(0);
    var seed = {1:0,2:10,3:4,4:7,5:20,6:9,7:5,9:0,10:0,11:0,20:64,21:8};
    for (var k in seed) reg[+k]=seed[k];
    reg[31]=0;
    return { reg:reg, mem:[100,200,300,400,500,600,700,800], changed:null, memChanged:null };
  }

  var cur = { mn:null, ops:null, prof:null, stage:-1, layerCtrl:true };

  function operands() {
    var o={}; cur.schema.forEach(function(f){ var el=$("csOp_"+f.key); o[f.key]= el? (+el.value): f.def; });
    return o;
  }

  function buildOps(mn) {
    cur.schema = schema(ISA[mn].fmt);
    var html = cur.schema.map(function(f){
      if (f.type==="sel"){
        return '<label class="cs-f">'+f.label+'<select id="csOp_'+f.key+'">'+
          f.opts.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>';}).join("")+'</select></label>';
      }
      var cls = f.type==="reg" ? "cs-num" : "cs-num";
      return '<label class="cs-f">'+(f.type==="reg"?"X":"")+f.label+
        '<input class="'+cls+'" id="csOp_'+f.key+'" type="number" value="'+f.def+'" min="'+f.min+'" max="'+f.max+'"'+(f.step?' step="'+f.step+'"':'')+'></label>';
    }).join("");
    $("csOps").innerHTML = html;
    cur.schema.forEach(function(f){ $("csOp_"+f.key).addEventListener("input", preview); });
  }

  /* ------------------------------ preview -------------------------------- */
  function preview() {
    var mn = selInst.value, o = operands();
    cur.mn=mn; cur.ops=o; cur.prof=profile(mn); cur.stage=-1;
    $("csAsm").textContent = asmText(mn,o);
    $("csC").textContent = ISA[mn].c(o);
    // encoding
    var F = encode(mn,o);
    $("csBits").innerHTML = F.map(function(f){
      return '<span class="cs-field"><span class="b" style="background:'+f.color+'">'+f.bits+'</span><span class="n">'+f.name+' ('+f.bits.length+')</span></span>';
    }).join("");
    // control signals
    renderCtrl(controlFor(mn));
    // datapath: show full active path, no pulse yet
    paintPath(cur.prof, true);
    $("csStage").textContent = "Ready — " + ISA[mn].k + ". Step to walk the stages, or Run.";
    renderState();
  }

  function renderCtrl(c) {
    var order=["Reg2Loc","ALUSrc","MemtoReg","RegWrite","MemRead","MemWrite","Branch","Uncondbranch","MovZ"];
    $("csCtrl").innerHTML = order.map(function(k){
      var v=c[k], hi = v===1;
      return '<tr class="'+(hi?"hi":"")+'"><td>'+k+'</td><td class="v">'+v+'</td></tr>';
    }).join("");
    var alu = ISA[cur.mn] ? ISA[cur.mn].alu : "";
    $("csCtrl").innerHTML += '<tr class="hi"><td>ALUOp</td><td class="v">'+alu+'</td></tr>';
  }

  function renderState() {
    var show=[0,1,2,3,9,10,11,20,21,31];
    $("csState").innerHTML = show.map(function(i){
      var chg = S.changed===i ? " chg":"";
      return '<div class="cs-reg'+chg+'">X'+i+' <b>'+S.reg[i]+'</b></div>';
    }).join("") + '<div class="cs-reg" style="grid-column:1/3">mem (8 dwords)</div>' +
      '<div class="cs-reg'+(S.memChanged!=null?' chg':'')+'" style="grid-column:3/5">['+S.mem.join(", ")+']</div>';
  }

  /* --------------------------- paint datapath ---------------------------- */
  function paintPath(prof, full) {
    Object.keys(nodeEls).forEach(function(id){
      var g=nodeEls[id]; g.classList.remove("act","dim","write");
      if (prof.nodes.indexOf(id)>=0) { if(full) g.classList.add("act"); } else g.classList.add("dim");
    });
    Object.keys(edgeEls).forEach(function(id){
      var e=edgeEls[id]; e.classList.remove("act","pulse","dim");
      if (prof.edges.indexOf(id)>=0){ if(full) e.classList.add("act"); } else e.classList.add("dim");
    });
    document.querySelectorAll("#cpuSim .ed-lab").forEach(function(t){
      var f=t.getAttribute("data-for"); t.classList.toggle("act", full && prof.edges.indexOf(f)>=0);
    });
  }

  // map each stage index to nodes/edges to pulse
  function stageElems(prof, i) {
    // distribute active nodes/edges across stages roughly by x-position order
    var ns = prof.nodes.slice().sort(byX), es = prof.edges.slice();
    var n = prof.seq.length;
    var per = Math.ceil(ns.length / n);
    var nodes = ns.slice(i*per, i*per+per);
    return { nodes: nodes, edges: es.filter(function(eid){
      var pts=EDGES[eid].pts, mx=pts[0][0];
      var lo=i/n*1040, hi=(i+1)/n*1040;
      return mx>=lo-120 && mx<=hi+200;
    }) };
  }
  function byX(a,b){return (NODES[a].x)-(NODES[b].x);}

  function showStage(i) {
    cur.stage=i;
    paintPath(cur.prof, false);
    // light everything up to & including stage i, pulse stage i
    for (var s=0;s<=i;s++){
      var se=stageElems(cur.prof,s);
      se.nodes.forEach(function(id){ if(nodeEls[id]) nodeEls[id].classList.add("act"); });
      se.edges.forEach(function(id){ if(edgeEls[id]) edgeEls[id].classList.add(s===i?"pulse":"act"); });
    }
    // re-activate label colors for active edges
    document.querySelectorAll("#cpuSim .ed-lab").forEach(function(t){
      var f=t.getAttribute("data-for"); t.classList.toggle("act", cur.prof.edges.indexOf(f)>=0);
    });
    $("csStage").textContent = "Stage "+(i+1)+"/"+cur.prof.seq.length+" — "+cur.prof.seq[i];
    if (i===cur.prof.seq.length-1){ commit(); }
  }

  function commit() {
    var r = ISA[cur.mn].exec(S, cur.ops);
    S.changed=null; S.memChanged=null;
    if (r.reg!=null && r.reg!==31){ S.reg[r.reg]=r.val|0; S.changed=r.reg; markWrite("regfile"); }
    if (r.mem!=null){ S.mem[r.mem]=r.val|0; S.memChanged=r.mem; markWrite("dmem"); }
    if (r.branch!=null){ $("csStage").textContent += r.branch ? "  →  branch TAKEN" : "  →  branch not taken"; }
    renderState();
  }
  function markWrite(id){ if(nodeEls[id]) nodeEls[id].classList.add("write"); }

  /* ------------------------------ controls ------------------------------- */
  function step() {
    if (cur.stage>=cur.prof.seq.length-1){ preview(); return; }
    showStage(cur.stage+1);
  }
  var runTimer=null;
  function run() {
    stopRun(); preview();
    var i=0; runTimer=setInterval(function(){
      if (i>=cur.prof.seq.length){ stopRun(); return; }
      showStage(i); i++;
    }, 850);
  }
  function stopRun(){ if(runTimer){ clearInterval(runTimer); runTimer=null; } }
  function reset() { stopRun(); S=freshState(); preview(); }

  $("csStep").addEventListener("click", step);
  $("csRun").addEventListener("click", run);
  $("csReset").addEventListener("click", reset);
  selInst.addEventListener("change", function(){ stopRun(); buildOps(selInst.value); preview(); });

  // layer toggles
  $("csLayerCtrl").addEventListener("click", function(){
    cur.layerCtrl=!cur.layerCtrl; this.classList.toggle("on",cur.layerCtrl);
    $("csCtrlCard").style.display = cur.layerCtrl ? "" : "none";
  });
  $("csLayerAlu").addEventListener("click", function(){ openInternals("alu"); });

  /* -------------------------- internals modal ---------------------------- */
  var INTERN = {
    alu: { title:"ALU — internal structure", desc:"Per bit: a full adder (with XOR for two's-complement subtract), an AND/OR logic block, and a mux selecting the operation. This is the 4-bit ALU idea from my breadboard project, scaled to 64 bits.",
      svg:'<svg viewBox="0 0 680 230" style="width:100%"><style>text{fill:var(--ink);font:600 12px var(--font-mono,monospace)}rect{fill:var(--panel-2);stroke:var(--line-2)}.w{stroke:var(--steel);fill:none;stroke-width:1.6}</style>'+
        '<rect x="40" y="40" width="90" height="50" rx="6"/><text x="85" y="70" text-anchor="middle">XOR</text>'+
        '<rect x="40" y="120" width="90" height="50" rx="6"/><text x="85" y="150" text-anchor="middle">AND/OR</text>'+
        '<rect x="200" y="40" width="100" height="50" rx="6"/><text x="250" y="70" text-anchor="middle">Full Adder</text>'+
        '<rect x="380" y="70" width="90" height="80" rx="6"/><text x="425" y="115" text-anchor="middle">MUX</text>'+
        '<rect x="540" y="80" width="90" height="50" rx="6"/><text x="585" y="110" text-anchor="middle">Result</text>'+
        '<path class="w" d="M130 65 H200"/><path class="w" d="M300 65 H360 V95 H380"/><path class="w" d="M130 145 H360 V135 H380"/><path class="w" d="M470 110 H540"/>'+
        '<text x="250" y="195" text-anchor="middle" style="fill:var(--ink-soft)">ALUOp selects add / sub / and / orr / pass-B</text></svg>' },
    regfile:{ title:"Register File", desc:"Two read ports and one write port over 32 registers. Read-address decoders drive muxes onto BusA and BusB; RegWrite + a write decoder route BusW into the destination register on the clock edge.", svg:"" },
    control:{ title:"Control Unit", desc:"Decodes the 11-bit opcode (casez with wildcards in my Verilog) into the datapath control lines — RegWrite, ALUSrc, MemRead/Write, MemtoReg, Branch, Reg2Loc, ALUOp, and the MovZ flag — defaulting all to 0 for any unsupported opcode.", svg:"" },
    signext:{ title:"Sign-extend / immediate unit", desc:"Selects the right immediate field by format (I/D/CB/B) and sign- or zero-extends it to 64 bits; branch immediates are shifted left by 2. With MovZ it zero-extends the 16-bit field and shifts it to position hw·16.", svg:"" },
    dmem:{ title:"Data Memory", desc:"Word-addressed read/write memory. MemRead gates the read port onto 'read data'; MemWrite stores 'write data' at the ALU-computed address on the clock edge.", svg:"" }
  };
  function openInternals(key) {
    var d = INTERN[key]; if (!d) return;
    $("csModalBody").innerHTML = '<h3>'+d.title+'</h3><p>'+d.desc+'</p>'+(d.svg||'<p style="color:var(--ink-dim)">Deeper gate- and transistor-level drill-down for this block is on the roadmap.</p>');
    $("csModal").classList.add("open");
  }
  $("csModalX").addEventListener("click", function(){ $("csModal").classList.remove("open"); });
  $("csModal").addEventListener("click", function(e){ if(e.target===this) this.classList.remove("open"); });

  /* ------------------------------- init ---------------------------------- */
  selInst.value = "ADD";
  buildOps("ADD");
  preview();
})();
