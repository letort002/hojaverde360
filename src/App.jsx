import { useState } from "react";

const T = {
  bg:"#F7F6F3", surface:"#FFFFFF", border:"#E5E3DC", borderHover:"#C8C6BC",
  text:"#1A1916", textSub:"#6B6860", textMute:"#9B9990",
  green:"#1D6B45", greenBg:"#EAF4ED",
  amber:"#8A5C00", amberBg:"#FEF7E6",
  red:"#9B1C1C",  redBg:"#FEF0F0",
  blue:"#1A4E8A", blueBg:"#EDF4FF",
  nav:"#1A1916",
};
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmt$  = v => v==null?"—":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}K`:`$${Number(v).toFixed(0)}`;
const fmtV  = (v,kpi) => {
  if(v==null) return "—";
  if(kpi.isPct) return `${(v*100).toFixed(1)}%`;
  if(["$","$/ha"].includes(kpi.unidad)) return fmt$(v);
  if(kpi.unidad==="$/tallo") return `$${v.toFixed(4)}`;
  if(kpi.unidad==="%"&&v<2) return `${(v*100).toFixed(1)}%`;
  return `${Number(v).toFixed(2)} ${kpi.unidad}`;
};
const hoy = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});
const MENOR_ES_MEJOR = ["Bajas","No Proceso","Producto No Conforme","Nacional","Rotación del Personal",
  "Eficiencia Financiera","Costo HE","Costo de Compras","Variación"];
const CA = {2023:"#1A5276",2024:"#2D5016",2025:"#C4781A",2026:"#C0392B"};
const CC = ["#2D5016","#1A5276","#4A7C3F","#C4781A","#6C3483","#0E6655","#C0392B","#EC4899"];

function getUlt(kpi){const p=kpi.vals.map((v,i)=>({v,i})).filter(x=>x.v!=null);return p.length?p[p.length-1]:null;}
function getSem(kpi){
  const u=getUlt(kpi);if(!u)return"mute";
  const {v,i}=u;const meta=kpi.metas?.[i]??kpi.meta;if(meta==null)return"blue";
  const ok=MENOR_ES_MEJOR.some(k=>kpi.nombre.includes(k))?v<=meta:v>=meta;
  if(ok)return"green";return Math.abs((v-meta)/meta)<0.08?"amber":"red";
}
const SC={green:{dot:T.green,bg:T.greenBg,text:T.green},amber:{dot:T.amber,bg:T.amberBg,text:T.amber},
  red:{dot:T.red,bg:T.redBg,text:T.red},blue:{dot:T.blue,bg:T.blueBg,text:T.blue},
  mute:{dot:T.textMute,bg:T.bg,text:T.textMute}};
const SL={green:"En meta",amber:"Seguimiento",red:"Atención",blue:"Sin meta",mute:"Sin datos"};

// ── KPI DATA ─────────────────────────────────────────────
const GERENCIAS = [
  {id:"produccion",codigo:"MP-1300",icono:"🌱",color:"#1D6B45",nombre:"Producción",nombreCompleto:"Producción de Flores",gerente:"Roberto Toscano",kpisDestacados:[0,6],
   kpis:[
    {nombre:"Productividad Exportable vs Planificada",unidad:"t/m²",vals:[6.999,6.607,5.193,6.338,6.184,5.313,6.167,5.269,null,null,null,null],metas:[7.098,7.051,5.103,6.303,7.203,5.501,6.137,5.965,null,null,null,null]},
    {nombre:"Gasto Fertilización / Hectárea",unidad:"$/ha",meta:1800,vals:[2234,2122,2196,2229,1956,1573,1856,1652,null,null,null,null],metas:[1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800]},
    {nombre:"Gasto Pesticidas / Hectárea",unidad:"$/ha",meta:1600,vals:[1647,1613,1624,1766,1550,1332,1256,1050,null,null,null,null],metas:[1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600]},
    {nombre:"No Proceso",unidad:"%",isPct:true,vals:[0,0.0035,0,0,0.0222,0.0107,0.0457,0.0109,null,null,null,null],metas:[0.0218,0.0216,0.0216,0.0160,0.0167,0.0168,0.0343,0.0345,null,null,null,null]},
    {nombre:"Bajas",unidad:"%",isPct:true,vals:[0,0.0276,0.0062,0.0051,0.0194,0.0328,0.0575,0.0490,null,null,null,null],metas:[0.0292,0.0068,0.0145,0.0252,0.0078,0.0087,0.0290,0.0174,null,null,null,null]},
    {nombre:"Producto No Conforme",unidad:"%",isPct:true,vals:[0.1895,0.1695,0.2057,0.1505,0.1262,0.1391,0.1365,0.1476,null,null,null,null],metas:[0.1821,0.1715,0.1655,0.1661,0.1687,0.1574,0.1529,0.1626,null,null,null,null]},
    {nombre:"Nacional por Prob. Fitosanitarios",unidad:"%",isPct:true,nota:"Meta ≤5%",vals:[0.0583,0.0508,0.0386,0.0362,0.0586,0.0628,0.0618,0.0605,null,null,null,null]},
  ]},
  {id:"postcosecha",codigo:"MP-1400",icono:"✂️",color:"#1A4E8A",nombre:"Postcosecha",nombreCompleto:"Procesamiento y Despacho",gerente:"Alexandra Macias",kpisDestacados:[1,2],
   kpis:[
    {nombre:"Vida en Florero",unidad:"días",meta:12,vals:[13.56,12.52,13.56,14.52,14.26,13.32,13.42,14.52,null,null,null,null],metas:[12,12,12,12,12,12,12,12,12,12,12,12]},
    {nombre:"Tallos Procesados / Persona / Hora",unidad:"t/p/h",meta:145,vals:[140.04,142.37,145.91,142.6,145.91,150.68,149.41,145.48,null,null,null,null],metas:[145,145,145,145,145,145,145,145,145,145,145,145]},
    {nombre:"Costo Horas Extras / Tallo",unidad:"$/tallo",meta:0.0771,vals:[0.0762,0.0741,0.0682,0.0679,0.0721,0.0682,0.0673,0.0661,null,null,null,null],metas:[0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771]},
    {nombre:"Calificación Florcontrol",unidad:"%",meta:95,vals:[89.33,93,92.67,88.67,89.25,90.75,93.75,93.75,null,null,null,null],metas:[95,95,95,95,95,95,95,95,95,95,95,95]},
  ]},
  {id:"comercial",codigo:"MP-1200",icono:"📈",color:"#7C4A00",nombre:"Comercial",nombreCompleto:"Gestión Comercial y Marketing",gerente:"Hernán Dávila",kpisDestacados:[0,1],
   kpis:[
    {nombre:"Volumen de Ventas",unidad:"$",vals:[2024799,2473653,1408068,1743637,1910969,1457938,1497149,1591793,1703640,null,null,null],metas:[1909734,2023605,1359432,1620883,1730402,1371962,1561741,1349948,1479313,null,null,null]},
    {nombre:"Precio Promedio Flor Fresca",unidad:"$/tallo",vals:[0.537,0.5908,0.5065,0.4859,0.4833,0.4778,0.4716,0.4972,0.4972,null,null,null],metas:[0.5054,0.5683,0.4873,0.4756,0.5182,0.4801,0.4731,0.4778,0.4760,null,null,null]},
    {nombre:"Precio Promedio Flor Tinturada",unidad:"$/tallo",vals:[1.0093,1.07,0.95,0.96,0.97,0.97,0.97,1.02,0.96,null,null,null],metas:[0.95,1.0,0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.96,0.94,0.94]},
    {nombre:"Ventas Productos Nuevos",unidad:"%",isPct:true,vals:[0.0634,0.0683,0.0662,0.0572,0.0629,0.0649,0.062,0.0846,0.0662,null,null,null],metas:[0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10]},
    {nombre:"Clientes Nuevos",unidad:"#",vals:[4,4,3,1,9,4,8,12,7,null,null,null],metas:[4,4,4,4,4,4,4,4,4,4,4,4]},
    {nombre:"Rentabilidad Nuevos Productos",unidad:"%",isPct:true,vals:[0.43,0.48,0.42,0.41,0.43,0.41,0.41,0.39,0.40,null,null,null],metas:[0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30]},
    {nombre:"Satisfacción del Cliente",unidad:"/5",vals:[null,null,null,null,null,4.67,null,null,4.67,null,null,null],metas:[null,null,null,null,null,4.5,null,null,4.5,null,null,null]},
  ]},
  {id:"finanzas",codigo:"MP-2400",icono:"💰",color:"#4A2080",nombre:"Finanzas",nombreCompleto:"Gestión Financiera",gerente:"Patricio Mora",kpisDestacados:[0,1],
   kpis:[
    {nombre:"EBITDA",unidad:"%",isPct:true,nota:"Trimestral · >20% Excelente · 12–20% Saludable",vals:[null,null,0.28,null,null,0.18,null,null,null,null,null,null],metas:[null,null,0.22,null,null,0.17,null,null,null,null,null,null]},
    {nombre:"Productividad Financiera de Costos",unidad:"$/$ invertido",nota:"Ingresos / Costos. >1.0 saludable",vals:[1.26,1.52,1.01,1.18,1.18,0.99,1.01,1.05,null,null,null,null]},
  ]},
  {id:"talentohumano",codigo:"MP-2100",icono:"👥",color:"#0A5C4A",nombre:"Talento Humano",nombreCompleto:"Gestión del Talento Humano",gerente:"Sofía Ingavelez",kpisDestacados:[0,1],
   kpis:[
    {nombre:"Eficiencia Financiera de la Mano de Obra",unidad:"%",isPct:true,nota:"Costo MO / Ingresos totales",vals:[0.4072,0.3561,0.5178,0.4267,0.4359,0.5334,0.4955,0.4895,null,null,null,null],metas:[null,null,null,null,null,null,0.45,0.45,0.45,null,null,null]},
    {nombre:"Índice de Rotación del Personal",unidad:"%",nota:"Meta mensual ≤1.4%",vals:[1.55,3.1,3.2,1.15,0.7,1.8,0.45,1.95,1.35,null,null,null],metas:[1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4]},
    {nombre:"NPS Colaboradores",unidad:"pts",nota:"50+ Excelente · 70+ Clase mundial",vals:[52.12,52.12,52.12,50.08,50.08,50.08,43.99,43.99,43.99,null,null,null]},
    {nombre:"Satisfacción Laboral",unidad:"/5",nota:"Meta >4.0",vals:[4.18,4.18,4.18,4.30,4.30,4.30,4.19,4.19,4.19,null,null,null]},
  ]},
  {id:"adquisiciones",codigo:"MP-2500",icono:"📦",color:"#7C4A00",nombre:"Adquisiciones",nombreCompleto:"Adquisiciones / Supply Chain",gerente:"Paulo",kpisDestacados:[0,1],
   kpis:[
    {nombre:"Costo de Compras / Tallo Exportable",unidad:"$/tallo",nota:"Mensual",vals:[0.133,0.1115,0.1473,0.1255,0.1094,null,null,null,null,null,null,null]},
    {nombre:"Rotación de Inventario",unidad:"veces",vals:[1.43,1.01,0.78,0.81,0.79,null,null,null,null,null,null,null]},
    {nombre:"Variación de Precios Proveedores",unidad:"%",vals:[-0.14,-0.10,-0.30,-0.14,-0.12,null,null,null,null,null,null,null]},
    {nombre:"Gasto Total Compras 2025",unidad:"$",vals:[497450,464792,407838,null,null,null,null,null,null,null,null,null]},
  ]},
  {id:"sostenibilidad",codigo:"MP-3200",icono:"🌍",color:"#1A4E8A",nombre:"Sostenibilidad",nombreCompleto:"Mejora Continua / Sostenibilidad",gerente:"N/A",kpisDestacados:[0],
   kpis:[
    {nombre:"Tasa de Cierre de No Conformidades",unidad:"%",nota:"NC cerradas / total abiertas",vals:[0,0,0,0,0,0,null,null,null,null,null,null]},
  ]},
];

// ── SC DASHBOARD DATA ─────────────────────────────────────
const TOTALES_SC=[{año:2023,total:4866164},{año:2024,total:5106708},{año:2025,total:5297155},{año:2026,total:996670,nota:"Ene–Feb"}];
const MENS_SC={2023:[561238,457772,294892,450965,451604,382958,371681,323810,433908,362345,402309,372677],2024:[518099,391704,412529,487554,418303,344582,432437,421850,457859,422478,369776,429532],2026:[495176,501492,null,null,null,null,null,null,null,null,null,null]};
const CATS_SC=[{cat:"Abonos y Fertilizantes",c2023:1829798,c2024:1720766,c2026p:276299},{cat:"Material de Empaque",c2023:1292469,c2024:1319976,c2026p:315290},{cat:"Fungicidas",c2023:560330,c2024:815231,c2026p:171384},{cat:"Pesticidas e Insect.",c2023:378290,c2024:265965,c2026p:37931},{cat:"Repuestos y Accesorios",c2023:205199,c2024:213600,c2026p:31356},{cat:"Plásticos Invernaderos",c2023:187485,c2024:188076,c2026p:21725},{cat:"Otros Insumos",c2023:137756,c2024:167421,c2026p:53941},{cat:"Mat. Flores Tinturadas",c2023:68819,c2024:138226,c2026p:43392}];
const PROVS_SC=[{n:"Megastockec Distribuidora Agrícola",t:478605,pct:9.04,cat:"EMPAQUE",r24:true,r23:true},{n:"Fito Sanitario Fitosan S.A.",t:345520,pct:6.52,cat:"FERTILIZANTES",r24:true,r23:true},{n:"Papelera Nacional S.A.",t:300262,pct:5.67,cat:"EMPAQUE",r24:true,r23:true},{n:"Ecuaquimica Ecuatoriana",t:267066,pct:5.04,cat:"AGROQUÍMICOS",r24:true,r23:true},{n:"Alexis Mejía Representaciones",t:253412,pct:4.78,cat:"AGROQUÍMICOS",r24:true,r23:false},{n:"Proflower S.A.",t:238176,pct:4.50,cat:"FERTILIZANTES",r24:true,r23:true},{n:"Corpcultivos S.A.S.",t:214650,pct:4.05,cat:"AGROQUÍMICOS",r24:true,r23:true},{n:"Eurofert S.A.",t:188218,pct:3.55,cat:"FERTILIZANTES",r24:true,r23:true},{n:"Haifa Ecuador S.A.",t:164368,pct:3.10,cat:"FERTILIZANTES",r24:false,r23:false},{n:"Vallejo Mosquera E.F.",t:160041,pct:3.02,cat:"EMPAQUE",r24:true,r23:true}];
const PPTO_SC={2024:[{p:204869,e:224640,pct:105.5},{p:204869,e:205479,pct:96.5},{p:204869,e:195035,pct:91.6},{p:204869,e:209919,pct:98.5},{p:204869,e:211057,pct:99.1},{p:204869,e:191200,pct:89.8},{p:204869,e:206533,pct:97.0},{p:185708,e:198600,pct:103.9},{p:185708,e:179173,pct:96.5},{p:207677,e:207638,pct:97.5},{p:207677,e:180771,pct:83.8},{p:204869,e:214444,pct:100.7}],2025:[{p:187682,e:215060,pct:114.2},{p:187022,e:206989,pct:109.9},{p:186899,e:211670,pct:112.3},{p:186432,e:221389,pct:121.1},{p:187682,e:194283,pct:103.1},{p:187022,e:160984,pct:85.5},{p:198798,e:181930,pct:91.5},{p:205530,e:163301,pct:79.5},{p:205530,e:183555,pct:89.3},{p:205530,e:215475,pct:104.8},{p:205530,e:199450,pct:97.0},{p:207672,e:203941,pct:99.2}]};

// ── COMPONENTES BASE ──────────────────────────────────────
function Pill({sem}){const c=SC[sem];return(<span style={{display:"inline-flex",alignItems:"center",gap:5,background:c.bg,color:c.text,fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20}}><span style={{width:6,height:6,borderRadius:"50%",background:c.dot,flexShrink:0}}/>{SL[sem]}</span>);}

function MiniBar({vals,metas,color}){
  const nn=vals.filter(v=>v!=null);if(!nn.length)return null;
  const max=Math.max(...nn),min=Math.min(...nn),rng=max-min||max||1;
  return(<div style={{display:"flex",gap:2,alignItems:"flex-end",height:24}}>{vals.map((v,i)=>{if(v==null)return<div key={i} style={{flex:1,height:3,background:T.border,borderRadius:1,alignSelf:"flex-end"}}/>;const h=Math.max(((v-min)/rng)*100,10);const meta=metas?.[i];const bc=meta==null?color:(v<=meta?T.green:T.red);return<div key={i} style={{flex:1,height:`${h}%`,background:bc,borderRadius:"1px 1px 0 0",opacity:0.75}}/>;})}</div>);
}

function KPICardMini({kpi,color}){
  const u=getUlt(kpi),sem=getSem(kpi),c=SC[sem];
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",borderTop:`2px solid ${c.dot}`}}>
    <div style={{fontSize:10.5,color:T.textSub,marginBottom:6,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={kpi.nombre}>{kpi.nombre}</div>
    <div style={{fontSize:20,fontWeight:700,color:T.text,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{u?fmtV(u.v,kpi):"—"}</div>
    <div style={{fontSize:10,color:T.textMute,marginTop:3,marginBottom:8}}>{u?`${MESES[u.i]} 2025`:"Sin datos"}</div>
    <MiniBar vals={kpi.vals} metas={kpi.metas} color={color}/>
  </div>);
}

function TarjetaGerencia({g,onSelect}){
  const kd=g.kpisDestacados.map(i=>g.kpis[i]).filter(Boolean);
  const sems=kd.map(getSem);
  const semG=sems.includes("red")?"red":sems.includes("amber")?"amber":"green";
  const c=SC[semG];
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
    <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:8,background:g.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{g.icono}</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1.2}}>{g.nombreCompleto}</div>
          <div style={{fontSize:11,color:T.textMute,marginTop:2}}>{g.codigo} · {g.gerente}</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
        <Pill sem={semG}/>
        <button onClick={()=>onSelect(g.id)} style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",fontSize:11,color:T.textSub,cursor:"pointer",fontWeight:500}}>Ver detalle →</button>
      </div>
    </div>
    <div style={{padding:"12px 14px",display:"grid",gridTemplateColumns:`repeat(${kd.length},1fr)`,gap:10}}>
      {kd.map((k,i)=><KPICardMini key={i} kpi={k} color={g.color}/>)}
    </div>
  </div>);
}

function Sparkline({vals,metas,color}){
  const nn=vals.filter(v=>v!=null);
  if(!nn.length)return<div style={{height:40,background:T.bg,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:T.textMute}}>Sin datos</div>;
  const max=Math.max(...nn),min=Math.min(...nn),rng=max-min||max||1;
  return(<div style={{display:"flex",gap:3,alignItems:"flex-end",height:40}}>{vals.map((v,i)=>{if(v==null)return<div key={i} style={{flex:1,height:4,background:T.border,borderRadius:1,alignSelf:"flex-end"}}/>;const h=Math.max(((v-min)/rng)*100,8);const meta=metas?.[i];const bc=meta==null?color:(v<=meta?T.green:T.red);return<div key={i} style={{flex:1,height:`${h}%`,background:bc,borderRadius:"2px 2px 0 0",opacity:0.8}}/>;})}</div>);
}

function KPICardDetalle({kpi,color}){
  const u=getUlt(kpi),sem=getSem(kpi),c=SC[sem];
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,gap:8}}>
      <div style={{fontSize:12,fontWeight:600,color:T.text,lineHeight:1.4,flex:1}}>{kpi.nombre}</div>
      <Pill sem={sem}/>
    </div>
    <div style={{fontSize:26,fontWeight:700,color:c.dot,fontVariantNumeric:"tabular-nums",lineHeight:1,marginBottom:4}}>{u?fmtV(u.v,kpi):"—"}</div>
    <div style={{fontSize:11,color:T.textMute,marginBottom:12}}>{u?`${MESES[u.i]} 2025`:"Sin datos"} · {kpi.unidad}</div>
    <Sparkline vals={kpi.vals} metas={kpi.metas} color={color}/>
    <div style={{marginTop:10,display:"flex",gap:0,borderTop:`1px solid ${T.border}`,paddingTop:8,flexWrap:"wrap"}}>
      {kpi.vals.map((v,i)=>v!=null?(<div key={i} style={{flex:"0 0 calc(100%/9)",minWidth:36,textAlign:"center",padding:"2px 0"}}>
        <div style={{fontSize:9,color:T.textMute}}>{MESES[i]}</div>
        <div style={{fontSize:10,fontWeight:600,color:T.text,fontVariantNumeric:"tabular-nums"}}>{fmtV(v,kpi)}</div>
      </div>):null)}
    </div>
    {kpi.nota&&<div style={{marginTop:10,fontSize:10.5,color:T.textMute,borderTop:`1px solid ${T.border}`,paddingTop:8,lineHeight:1.5}}>{kpi.nota}</div>}
  </div>);
}

function DetalleGenerico({g}){
  const kd=g.kpisDestacados.map(i=>g.kpis[i]).filter(Boolean);
  const sems=kd.map(getSem);
  const semG=sems.includes("red")?"red":sems.includes("amber")?"amber":"green";
  return(<div>
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 24px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:48,height:48,borderRadius:10,background:g.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{g.icono}</div>
        <div>
          <div style={{fontSize:10,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{g.codigo}</div>
          <div style={{fontSize:18,fontWeight:700,color:T.text}}>{g.nombreCompleto}</div>
          <div style={{fontSize:12,color:T.textSub,marginTop:2}}>Gerente: {g.gerente} · Indicadores 2025</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
        <Pill sem={semG}/>
        <div style={{fontSize:11,color:T.textMute}}>{g.kpis.length} indicadores</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      {g.kpis.map((k,i)=><KPICardDetalle key={i} kpi={k} color={g.color}/>)}
    </div>
  </div>);
}

// ── SC DASHBOARD COMPLETO ─────────────────────────────────
const SC_TABS=[{id:"kpis",l:"KPIs",i:"📊"},{id:"tendencias",l:"Tendencias",i:"📈"},{id:"categorias",l:"Categorías",i:"📦"},{id:"proveedores",l:"Proveedores",i:"🏭"},{id:"presupuesto",l:"Ejec. vs Ppto",i:"🎯"}];

function DetalleAdquisiciones(){
  const [tab,setTab]=useState("kpis");
  const g=GERENCIAS.find(x=>x.id==="adquisiciones");
  const semPpto=(p)=>p==null?T.textMute:p<=95?T.green:p<=105?T.amber:T.red;

  return(<div>
    {/* Banner */}
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:9,background:"#7C4A0018",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>📦</div>
        <div>
          <div style={{fontSize:10,color:T.textMute,textTransform:"uppercase",letterSpacing:1,marginBottom:1}}>MP-2500</div>
          <div style={{fontSize:17,fontWeight:700,color:T.text}}>Adquisiciones / Supply Chain</div>
          <div style={{fontSize:11,color:T.textSub}}>Gerente: Paulo · Datos 2023–2026</div>
        </div>
      </div>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.border}`,overflowX:"auto"}}>
        {SC_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?"#7C4A00":"transparent"}`,
              padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:400,
              color:tab===t.id?"#7C4A00":T.textSub,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
            {t.i} {t.l}
          </button>
        ))}
      </div>
    </div>

    {/* TAB: KPIs */}
    {tab==="kpis"&&(
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {g.kpis.map((k,i)=><KPICardDetalle key={i} kpi={k} color="#7C4A00"/>)}
      </div>
    )}

    {/* TAB: TENDENCIAS */}
    {tab==="tendencias"&&(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {TOTALES_SC.map(a=>(
            <div key={a.año} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",borderTop:`2px solid ${CA[a.año]}`}}>
              <div style={{fontSize:10,color:T.textMute,marginBottom:4}}>Total {a.año}{a.nota?` (${a.nota})`:""}</div>
              <div style={{fontSize:20,fontWeight:700,color:CA[a.año],fontVariantNumeric:"tabular-nums"}}>{fmt$(a.total)}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Evolución Anual del Gasto de Compras</div>
          <div style={{display:"flex",gap:16,alignItems:"flex-end",height:160,marginBottom:12}}>
            {TOTALES_SC.map((a,i,arr)=>{const h=(a.total/Math.max(...TOTALES_SC.map(x=>x.total)))*100;const col=CA[a.año];const prev=arr[i-1];const d=prev&&!a.nota?((a.total-prev.total)/prev.total*100):null;
              return(<div key={a.año} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                {d!=null&&<div style={{fontSize:11,fontWeight:600,color:d>0?T.red:T.green}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(1)}%</div>}
                <div style={{fontSize:11,fontWeight:700,color:col,fontVariantNumeric:"tabular-nums"}}>{fmt$(a.total)}</div>
                <div style={{width:"80%",height:`${h}%`,background:a.nota?col+"55":col,borderRadius:"6px 6px 0 0",border:a.nota?`2px dashed ${col}`:"none"}}/>
                <div style={{fontSize:13,fontWeight:700,color:col}}>{a.año}</div>
                {a.nota&&<div style={{fontSize:9,color:T.textMute}}>{a.nota}</div>}
              </div>);})}
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:T.bg}}>
                <th style={{padding:"7px 10px",textAlign:"left",fontSize:10,color:T.textMute,fontWeight:600,textTransform:"uppercase"}}>Mes</th>
                {[2023,2024,2026].map(a=><th key={a} style={{padding:"7px 10px",textAlign:"right",fontSize:10,color:CA[a],fontWeight:600,textTransform:"uppercase"}}>{a}</th>)}
              </tr></thead>
              <tbody>
                {MESES.map((m,i)=>(
                  <tr key={m} style={{borderTop:`1px solid ${T.border}`}}>
                    <td style={{padding:"7px 10px",fontSize:12,fontWeight:600}}>{m}</td>
                    {[2023,2024,2026].map(a=>{const v=MENS_SC[a]?.[i];return<td key={a} style={{padding:"7px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums",fontSize:11,color:v?CA[a]:T.textMute}}>{v?fmt$(v):"—"}</td>;})}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {/* TAB: CATEGORÍAS */}
    {tab==="categorias"&&(
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:16}}>Categorías de Gasto — Comparativo 2023 vs 2024 vs 2026</div>
        {CATS_SC.map((c,i)=>{
          const d=((c.c2024-c.c2023)/c.c2023*100);
          const maxV=Math.max(c.c2023,c.c2024,c.c2026p);
          return(<div key={i} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,fontWeight:600,color:T.text,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:CC[i%8],display:"inline-block"}}/>
                {c.cat}
              </span>
              <span style={{fontSize:11,fontWeight:600,color:d>0?T.red:T.green}}>{d>0?"▲":"▼"} {Math.abs(d).toFixed(1)}%</span>
            </div>
            {[{k:"c2023",a:2023},{k:"c2024",a:2024},{k:"c2026p",a:2026}].map(({k,a})=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <span style={{fontSize:9.5,fontWeight:700,color:CA[a],width:28,flexShrink:0}}>{a}</span>
                <div style={{flex:1,height:7,background:T.bg,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(c[k]/maxV)*100}%`,background:CA[a],borderRadius:3,opacity:0.8}}/>
                </div>
                <span style={{fontSize:10,fontVariantNumeric:"tabular-nums",color:CA[a],width:55,textAlign:"right",flexShrink:0}}>{fmt$(c[k])}</span>
              </div>
            ))}
          </div>);
        })}
      </div>
    )}

    {/* TAB: PROVEEDORES */}
    {tab==="proveedores"&&(
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Ranking Proveedores 2025 — Top 10</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:T.bg}}>
            {["#","Proveedor","Total","% Part.","Categoría","Recurrencia","Pareto"].map(h=>(
              <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textMute,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {PROVS_SC.map((p,i)=>{
              const cum=PROVS_SC.slice(0,i+1).reduce((a,b)=>a+b.pct,0);
              const tipo=p.r24&&p.r23?"Recurrente":!p.r23?"Nuevo 2025":"Nuevo 2024";
              return(<tr key={i} style={{borderTop:`1px solid ${T.border}`,background:!p.r23?"#EDF4FF55":"transparent"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                onMouseLeave={e=>e.currentTarget.style.background=!p.r23?"#EDF4FF55":"transparent"}>
                <td style={{padding:"9px 10px",fontWeight:700,color:i<3?T.amber:T.textMute,fontSize:12}}>{i+1}</td>
                <td style={{padding:"9px 10px",fontSize:11.5,fontWeight:i<3?700:400}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":""} {p.n}</td>
                <td style={{padding:"9px 10px",fontVariantNumeric:"tabular-nums",fontWeight:700,color:T.green,fontSize:12}}>{fmt$(p.t)}</td>
                <td style={{padding:"9px 10px",fontSize:11,color:T.textSub}}>{p.pct.toFixed(2)}%</td>
                <td style={{padding:"9px 10px"}}><span style={{background:"#1D6B4518",color:"#1D6B45",fontSize:9.5,padding:"2px 8px",borderRadius:10,fontWeight:600}}>{p.cat}</span></td>
                <td style={{padding:"9px 10px"}}><span style={{background:tipo==="Recurrente"?T.greenBg:T.blueBg,color:tipo==="Recurrente"?T.green:T.blue,fontSize:9.5,padding:"2px 8px",borderRadius:10,fontWeight:600}}>{tipo}</span></td>
                <td style={{padding:"9px 10px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:44,height:4,background:T.bg,borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(cum,100)}%`,background:cum>80?T.red:cum>60?T.amber:T.green,borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:10,fontWeight:600,color:cum>80?T.red:cum>60?T.amber:T.green}}>{cum.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    )}

    {/* TAB: PRESUPUESTO */}
    {tab==="presupuesto"&&(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[2025,2024].map(año=>{
          const datos=PPTO_SC[año]||[];
          const conDatos=datos.filter(d=>d.e!=null);
          const totE=conDatos.reduce((a,b)=>a+b.e,0);
          const totP=conDatos.reduce((a,b)=>a+b.p,0);
          const pctG=totP>0?(totE/totP*100):0;
          const colG=semPpto(pctG);
          return(<div key={año} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text}}>Agroquímicos + Fertilizantes {año}</div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:20,fontWeight:800,color:colG,fontVariantNumeric:"tabular-nums"}}>{pctG.toFixed(1)}%</div>
                <div style={{fontSize:10,color:T.textMute}}>Ejec: {fmt$(totE)} / Ppto: {fmt$(totP)}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:3,alignItems:"flex-end",height:80,marginBottom:10}}>
              {datos.map((d,i)=>{
                const maxV=Math.max(...datos.map(x=>Math.max(x.p,x.e||0)));
                const hp=(d.p/maxV)*100;const he=d.e?(d.e/maxV)*100:0;
                const col=semPpto(d.pct);
                return(<div key={i} style={{flex:1,display:"flex",gap:1,alignItems:"flex-end",height:70}}>
                  <div style={{flex:1,height:`${hp}%`,background:T.blue+"33",borderRadius:"2px 2px 0 0",minHeight:3}}/>
                  {d.e&&<div style={{flex:1,height:`${he}%`,background:col,borderRadius:"2px 2px 0 0",minHeight:3,opacity:0.8}}/>}
                </div>);
              })}
            </div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {datos.map((d,i)=>d.e?(
                <span key={i} style={{fontSize:9.5,background:d.pct<=95?T.greenBg:d.pct<=105?T.amberBg:T.redBg,
                  color:d.pct<=95?T.green:d.pct<=105?T.amber:T.red,padding:"2px 8px",borderRadius:8,fontWeight:600}}>
                  {MESES[i]}: {d.pct}%
                </span>
              ):null)}
            </div>
          </div>);
        })}
      </div>
    )}
  </div>);
}

// ── APP ───────────────────────────────────────────────────
export default function App(){
  const [vista,setVista]=useState("home");
  const [open,setOpen]=useState(null);
  const gerSel=GERENCIAS.find(g=>g.id===vista);
  const enMeta=GERENCIAS.filter(g=>{const k=g.kpis[g.kpisDestacados[0]];return k&&getSem(k)==="green";}).length;
  const conAlerta=GERENCIAS.filter(g=>{const k=g.kpis[g.kpisDestacados[0]];return k&&getSem(k)==="red";}).length;

  return(<div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",color:T.text,fontSize:14}}>
    {/* NAVBAR */}
    <header style={{background:T.nav,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1360,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",height:50,gap:0}}>
        <button onClick={()=>{setVista("home");setOpen(null);}} style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"0 16px 0 0",borderRight:"1px solid #ffffff18",marginRight:16}}>
          <span style={{fontSize:18}}>🌿</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1}}>Hoja Verde</div>
            <div style={{fontSize:9,color:"#ffffff60",letterSpacing:1.5}}>360°</div>
          </div>
        </button>
        <div style={{display:"flex",flex:1,height:"100%",overflow:"hidden"}}>
          {GERENCIAS.map(g=>{
            const isActive=vista===g.id;
            const k0=g.kpis[g.kpisDestacados[0]];
            const sem=k0?getSem(k0):"mute";
            const dotColor=SC[sem].dot;
            return(<button key={g.id} onClick={()=>{setVista(g.id);setOpen(null);}}
              style={{background:isActive?"#ffffff12":"transparent",border:"none",borderBottom:`2px solid ${isActive?"#fff":"transparent"}`,height:"100%",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:isActive?"#fff":"#ffffffbb",fontSize:12,fontWeight:isActive?600:400,whiteSpace:"nowrap"}}>
              <span style={{fontSize:14}}>{g.icono}</span>
              <span>{g.nombre}</span>
              <span style={{width:5,height:5,borderRadius:"50%",background:dotColor,flexShrink:0}}/>
            </button>);
          })}
        </div>
        <div style={{fontSize:10,color:"#ffffff50",marginLeft:12,flexShrink:0,whiteSpace:"nowrap"}}>{hoy()}</div>
      </div>
    </header>

    <main style={{maxWidth:1360,margin:"0 auto",padding:"24px 24px 60px"}}>
      {vista==="home"?(
        <>
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:T.textMute,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Panel Ejecutivo · 2025</div>
                <h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0,lineHeight:1.2}}>Grupo Hoja Verde — Indicadores de Macroprocesos</h1>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{l:"En meta",n:enMeta,s:"green"},{l:"Seguimiento",n:GERENCIAS.length-enMeta-conAlerta,s:"amber"},{l:"Atención",n:conAlerta,s:"red"}].map((s,i)=>(
                  <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 14px",textAlign:"center",minWidth:76}}>
                    <div style={{fontSize:20,fontWeight:700,color:SC[s.s].dot}}>{s.n}</div>
                    <div style={{fontSize:10.5,color:T.textMute,marginTop:2}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{height:1,background:T.border,marginTop:16}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {GERENCIAS.map(g=><TarjetaGerencia key={g.id} g={g} onSelect={id=>setVista(id)}/>)}
          </div>
        </>
      ):(
        <>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20,fontSize:12,color:T.textMute}}>
            <button onClick={()=>setVista("home")} style={{background:"transparent",border:"none",cursor:"pointer",color:T.textSub,fontSize:12,fontWeight:500,padding:0}}>← Panel general</button>
            <span>/</span>
            <span style={{color:T.text,fontWeight:600}}>{gerSel?.nombreCompleto}</span>
          </div>
          {vista==="adquisiciones"?<DetalleAdquisiciones/>:<DetalleGenerico g={gerSel}/>}
        </>
      )}
    </main>
    <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:${T.bg};}::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px;}button:hover{opacity:0.88;}`}</style>
  </div>);
}
