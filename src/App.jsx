import { useState } from "react";

// ── PALETA ──────────────────────────────────────────────
const C = {
  bg:"#F7F8FA", card:"#FFFFFF", borde:"#E5E7EB",
  texto:"#111827", sub:"#6B7280", muted:"#9CA3AF",
  verde:"#166534", verdeL:"#DCFCE7", verdeT:"#16A34A",
  amber:"#92400E", amberL:"#FEF3C7", amberT:"#D97706",
  rojo:"#991B1B",  rojoL:"#FEE2E2",  rojoT:"#DC2626",
  azul:"#1E40AF",  azulL:"#DBEAFE",  azulT:"#2563EB",
  nav:"#1A2E0A",
};

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmt$  = v => v==null?"—":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(1)}K`:`$${Number(v).toFixed(2)}`;
const hoy   = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});

function fmtVal(v, kpi) {
  if (v == null) return "—";
  if (kpi.isPct) return `${(v * 100).toFixed(1)}%`;
  if (["$","$/ha","$/tallo"].includes(kpi.unidad)) return fmt$(v);
  if (kpi.unidad === "%" && v < 2) return `${(v * 100).toFixed(1)}%`;
  return `${Number(v).toFixed(2)} ${kpi.unidad}`;
}

// ── DATOS ───────────────────────────────────────────────
const GERENCIAS = [
  {
    id:"produccion", codigo:"MP-1300", icono:"🌱", color:"#166534", colorBg:"#DCFCE7",
    nombre:"Producción de Flores", gerente:"Roberto Toscano",
    kpisHome:[0,6],
    kpis:[
      {nombre:"Productividad Exportable vs Planificada", unidad:"t/m²",
       vals:[6.999,6.607,5.193,6.338,6.184,5.313,6.167,5.269,null,null,null,null],
       metas:[7.098,7.051,5.103,6.303,7.203,5.501,6.137,5.965,null,null,null,null], menorMejor:false},
      {nombre:"Gasto Fertilización / Hectárea", unidad:"$/ha",
       vals:[2234,2122,2196,2229,1956,1573,1856,1652,null,null,null,null],
       metas:[1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800], menorMejor:true},
      {nombre:"Gasto Pesticidas / Hectárea", unidad:"$/ha",
       vals:[1647,1613,1624,1766,1550,1332,1256,1050,null,null,null,null],
       metas:[1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600], menorMejor:true},
      {nombre:"No Proceso", unidad:"%", isPct:true,
       vals:[0,0.0035,0,0,0.0222,0.0107,0.0457,0.0109,null,null,null,null],
       metas:[0.0218,0.0216,0.0216,0.0160,0.0167,0.0168,0.0343,0.0345,null,null,null,null], menorMejor:true},
      {nombre:"Bajas", unidad:"%", isPct:true,
       vals:[0,0.0276,0.0062,0.0051,0.0194,0.0328,0.0575,0.0490,null,null,null,null],
       metas:[0.0292,0.0068,0.0145,0.0252,0.0078,0.0087,0.0290,0.0174,null,null,null,null], menorMejor:true},
      {nombre:"Producto No Conforme", unidad:"%", isPct:true,
       vals:[0.1895,0.1695,0.2057,0.1505,0.1262,0.1391,0.1365,0.1476,null,null,null,null],
       metas:[0.1821,0.1715,0.1655,0.1661,0.1687,0.1574,0.1529,0.1626,null,null,null,null], menorMejor:true},
      {nombre:"Nacional por Prob. Fitosanitarios", unidad:"%", isPct:true, nota:"Meta ≤5%",
       vals:[0.0583,0.0508,0.0386,0.0362,0.0586,0.0628,0.0618,0.0605,null,null,null,null], menorMejor:true},
    ]
  },
  {
    id:"postcosecha", codigo:"MP-1400", icono:"✂️", color:"#1E40AF", colorBg:"#DBEAFE",
    nombre:"Procesamiento y Despacho", gerente:"Alexandra Macias",
    kpisHome:[1,2],
    kpis:[
      {nombre:"Vida en Florero", unidad:"días",
       vals:[13.56,12.52,13.56,14.52,14.26,13.32,13.42,14.52,null,null,null,null],
       metas:[12,12,12,12,12,12,12,12,12,12,12,12], menorMejor:false},
      {nombre:"Tallos Procesados / Persona / Hora", unidad:"t/p/h",
       vals:[140.04,142.37,145.91,142.6,145.91,150.68,149.41,145.48,null,null,null,null],
       metas:[145,145,145,145,145,145,145,145,145,145,145,145], menorMejor:false},
      {nombre:"Costo Horas Extras / Tallo", unidad:"$/tallo",
       vals:[0.0762,0.0741,0.0682,0.0679,0.0721,0.0682,0.0673,0.0661,null,null,null,null],
       metas:[0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771], menorMejor:true},
      {nombre:"Calificación Florcontrol", unidad:"%",
       vals:[89.33,93,92.67,88.67,89.25,90.75,93.75,93.75,null,null,null,null],
       metas:[95,95,95,95,95,95,95,95,95,95,95,95], menorMejor:false},
    ]
  },
  {
    id:"comercial", codigo:"MP-1200", icono:"📈", color:"#92400E", colorBg:"#FEF3C7",
    nombre:"Gestión Comercial y Marketing", gerente:"Hernán Dávila",
    kpisHome:[0,1],
    kpis:[
      {nombre:"Volumen de Ventas", unidad:"$",
       vals:[2024799,2473653,1408068,1743637,1910969,1457938,1497149,1591793,1703640,null,null,null],
       metas:[1909734,2023605,1359432,1620883,1730402,1371962,1561741,1349948,1479313,null,null,null], menorMejor:false},
      {nombre:"Precio Promedio Flor Fresca", unidad:"$/tallo",
       vals:[0.537,0.5908,0.5065,0.4859,0.4833,0.4778,0.4716,0.4972,0.4972,null,null,null],
       metas:[0.5054,0.5683,0.4873,0.4756,0.5182,0.4801,0.4731,0.4778,0.4760,null,null,null], menorMejor:false},
      {nombre:"Precio Promedio Flor Tinturada", unidad:"$/tallo",
       vals:[1.0093,1.07,0.95,0.96,0.97,0.97,0.97,1.02,0.96,null,null,null],
       metas:[0.95,1.0,0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.96,0.94,0.94], menorMejor:false},
      {nombre:"Ventas Productos Nuevos", unidad:"%", isPct:true,
       vals:[0.0634,0.0683,0.0662,0.0572,0.0629,0.0649,0.062,0.0846,0.0662,null,null,null],
       metas:[0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10], menorMejor:false},
      {nombre:"Clientes Nuevos", unidad:"#",
       vals:[4,4,3,1,9,4,8,12,7,null,null,null],
       metas:[4,4,4,4,4,4,4,4,4,4,4,4], menorMejor:false},
      {nombre:"Rentabilidad Nuevos Productos", unidad:"%", isPct:true,
       vals:[0.43,0.48,0.42,0.41,0.43,0.41,0.41,0.39,0.40,null,null,null],
       metas:[0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30], menorMejor:false},
      {nombre:"Satisfacción del Cliente", unidad:"/5",
       vals:[null,null,null,null,null,4.67,null,null,4.67,null,null,null],
       metas:[null,null,null,null,null,4.5,null,null,4.5,null,null,null], menorMejor:false},
    ]
  },
  {
    id:"finanzas", codigo:"MP-2400", icono:"💰", color:"#5B21B6", colorBg:"#EDE9FE",
    nombre:"Gestión Financiera", gerente:"Patricio Mora",
    kpisHome:[0,1],
    kpis:[
      {nombre:"EBITDA", unidad:"%", isPct:true, nota:"Trimestral · >20% Excelente · 12–20% Saludable",
       vals:[null,null,0.28,null,null,0.18,null,null,null,null,null,null],
       metas:[null,null,0.22,null,null,0.17,null,null,null,null,null,null], menorMejor:false},
      {nombre:"Índice Productividad Financiera", unidad:"$/$ invertido", nota:"Ingresos / Costos. >1 = eficiente",
       vals:[1.26,1.52,1.01,1.18,1.18,0.99,1.01,1.05,null,null,null,null], menorMejor:false},
    ]
  },
  {
    id:"talentohumano", codigo:"MP-2100", icono:"👥", color:"#065F46", colorBg:"#D1FAE5",
    nombre:"Gestión del Talento Humano", gerente:"Sofía Ingavelez",
    kpisHome:[0,1],
    kpis:[
      {nombre:"Eficiencia Financiera de la MO", unidad:"%", isPct:true, nota:"Costo MO / Ingresos totales",
       vals:[0.4072,0.3561,0.5178,0.4267,0.4359,0.5334,0.4955,0.4895,null,null,null,null],
       metas:[null,null,null,null,null,null,0.45,0.45,0.45,null,null,null], menorMejor:true},
      {nombre:"Índice de Rotación del Personal", unidad:"%", nota:"Meta mensual ≤1.4% · Meta anual ≤17%",
       vals:[1.55,3.1,3.2,1.15,0.7,1.8,0.45,1.95,1.35,null,null,null],
       metas:[1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4], menorMejor:true},
      {nombre:"NPS Colaboradores (GHV)", unidad:"pts", nota:"50+ Excelente · 70+ Clase mundial",
       vals:[52.12,52.12,52.12,50.08,50.08,50.08,43.99,43.99,43.99,null,null,null], menorMejor:false},
      {nombre:"Satisfacción Laboral", unidad:"/5", nota:"Meta >4.0",
       vals:[4.18,4.18,4.18,4.30,4.30,4.30,4.19,4.19,4.19,null,null,null], menorMejor:false},
    ]
  },
  {
    id:"adquisiciones", codigo:"MP-2500", icono:"📦", color:"#7C2D12", colorBg:"#FFEDD5",
    nombre:"Adquisiciones / Supply Chain", gerente:"Paulo",
    kpisHome:[0,1],
    kpis:[
      {nombre:"Costo Compras / Tallo Exportable", unidad:"$/tallo", nota:"Gasto compras / tallos exportables",
       vals:[0.133,0.1115,0.1473,0.1255,0.1094,null,null,null,null,null,null,null], menorMejor:true},
      {nombre:"Rotación de Inventario", unidad:"veces", nota:"Consumo / Stock promedio",
       vals:[1.43,1.01,0.78,0.81,0.79,null,null,null,null,null,null,null], menorMejor:false},
      {nombre:"Variación de Precios Proveedores", unidad:"%",
       vals:[-0.14,-0.10,-0.30,-0.14,-0.12,null,null,null,null,null,null,null], menorMejor:true},
      {nombre:"Gasto Total Compras 2025", unidad:"$", nota:"Fuente: Master File Procurement",
       vals:[497450,464792,407838,null,null,null,null,null,null,null,null,null], menorMejor:false},
    ]
  },
  {
    id:"sostenibilidad", codigo:"MP-3200", icono:"🌍", color:"#0C4A6E", colorBg:"#E0F2FE",
    nombre:"Mejora Continua / Sostenibilidad", gerente:"N/A",
    kpisHome:[0],
    kpis:[
      {nombre:"Tasa Cierre de No Conformidades", unidad:"%", nota:"NC cerradas / total abiertas",
       vals:[0,0,0,0,0,0,null,null,null,null,null,null], menorMejor:false},
    ]
  },
];

// ── LÓGICA SEMÁFORO ────────────────────────────────────
function getUlt(kpi) {
  for(let i=kpi.vals.length-1;i>=0;i--) if(kpi.vals[i]!=null) return {v:kpi.vals[i],i};
  return null;
}
function getSem(kpi) {
  const ult = getUlt(kpi);
  if(!ult) return "gray";
  const meta = kpi.metas?.[ult.i] ?? kpi.meta ?? null;
  if(meta==null) return "blue";
  const cumple = kpi.menorMejor ? ult.v<=meta : ult.v>=meta;
  if(cumple) return "green";
  const diff = Math.abs((ult.v-meta)/meta);
  return diff<0.10 ? "amber" : "red";
}
const SEM_COLOR = {green:C.verdeT, amber:C.amberT, red:C.rojoT, blue:C.azulT, gray:C.muted};
const SEM_BG    = {green:C.verdeL, amber:C.amberL, red:C.rojoL, blue:C.azulL, gray:"#F3F4F6"};
const SEM_LABEL = {green:"En meta", amber:"En seguimiento", red:"Atención", blue:"Sin meta", gray:"Sin datos"};

// ── SPARKLINE MINI ────────────────────────────────────
function Spark({vals, metas, menorMejor, h=24}) {
  const nn = vals.filter(v=>v!=null);
  if(!nn.length) return <div style={{height:h,background:"#F3F4F6",borderRadius:4}}/>;
  const max=Math.max(...nn), min=Math.min(...nn), rng=max-min||max||1;
  return (
    <div style={{display:"flex",gap:1.5,alignItems:"flex-end",height:h}}>
      {vals.map((v,i)=>{
        if(v==null) return <div key={i} style={{flex:1,height:3,background:"#E5E7EB",borderRadius:1,alignSelf:"flex-end"}}/>;
        const pct = Math.max(((v-min)/rng)*100,8);
        const meta = metas?.[i];
        const ok = meta==null ? null : menorMejor ? v<=meta : v>=meta;
        const col = ok==null ? "#93C5FD" : ok ? "#4ADE80" : "#F87171";
        return <div key={i} style={{flex:1,height:`${pct}%`,background:col,borderRadius:"1.5px 1.5px 0 0"}}/>;
      })}
    </div>
  );
}

// ── KPI CARD HOME ──────────────────────────────────────
function KPIHome({kpi, color}) {
  const ult = getUlt(kpi);
  const sem = getSem(kpi);
  return (
    <div style={{padding:"14px 16px",background:C.card,borderRadius:10,border:`1px solid ${C.borde}`}}>
      <div style={{fontSize:10.5,color:C.sub,marginBottom:8,lineHeight:1.3,fontWeight:500}}>
        {kpi.nombre}
      </div>
      <div style={{fontSize:20,fontWeight:800,color:SEM_COLOR[sem],fontFamily:"'SF Mono','Consolas',monospace",lineHeight:1,marginBottom:4}}>
        {ult ? fmtVal(ult.v,kpi) : "—"}
      </div>
      <div style={{fontSize:9.5,color:C.muted,marginBottom:8}}>{ult ? `${MESES[ult.i]} 2025` : "Sin datos"}</div>
      <Spark vals={kpi.vals} metas={kpi.metas} menorMejor={kpi.menorMejor}/>
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:SEM_COLOR[sem],flexShrink:0}}/>
        <span style={{fontSize:9.5,color:SEM_COLOR[sem],fontWeight:600}}>{SEM_LABEL[sem]}</span>
      </div>
    </div>
  );
}

// ── CARD GERENCIA (HOME) ───────────────────────────────
function CardGerencia({g, onSelect}) {
  const kpisShow = g.kpisHome.map(i=>g.kpis[i]).filter(Boolean);
  const sems = kpisShow.map(getSem);
  const worst = sems.includes("red")?"red":sems.includes("amber")?"amber":sems.includes("green")?"green":"blue";

  return (
    <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.borde}`,
      overflow:"hidden",boxShadow:"0 1px 3px #0000000d",transition:"box-shadow 0.2s"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px #00000015"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px #0000000d"}>
      
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.borde}`,
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:8,background:g.colorBg,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
            {g.icono}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.texto,lineHeight:1.2}}>{g.nombre}</div>
            <div style={{fontSize:10.5,color:C.muted,marginTop:2}}>{g.codigo} · {g.gerente}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <span style={{fontSize:10,fontWeight:600,color:SEM_COLOR[worst],background:SEM_BG[worst],
            padding:"3px 10px",borderRadius:20,border:`1px solid ${SEM_COLOR[worst]}30`}}>
            {SEM_LABEL[worst]}
          </span>
          <button onClick={()=>onSelect(g.id)}
            style={{fontSize:10,fontWeight:600,color:g.color,background:"transparent",
              border:`1px solid ${g.color}40`,borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>
            Ver detalle →
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{padding:"14px 16px",display:"grid",gridTemplateColumns:`repeat(${kpisShow.length},1fr)`,gap:10}}>
        {kpisShow.map((k,i)=><KPIHome key={i} kpi={k} color={g.color}/>)}
      </div>
    </div>
  );
}

// ── KPI DETAIL CARD ────────────────────────────────────
function KPIDetail({kpi, color}) {
  const ult = getUlt(kpi);
  const sem = getSem(kpi);
  const conDatos = kpi.vals.map((v,i)=>({v,i,m:kpi.metas?.[i]})).filter(x=>x.v!=null);

  return (
    <div style={{background:C.card,borderRadius:12,border:`1px solid ${C.borde}`,padding:"18px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{flex:1,marginRight:12}}>
          <div style={{fontSize:12.5,fontWeight:700,color:C.texto,lineHeight:1.3}}>{kpi.nombre}</div>
          {kpi.nota && <div style={{fontSize:10,color:C.muted,marginTop:3}}>{kpi.nota}</div>}
        </div>
        <span style={{fontSize:10,fontWeight:600,color:SEM_COLOR[sem],background:SEM_BG[sem],
          padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap",border:`1px solid ${SEM_COLOR[sem]}30`}}>
          {SEM_LABEL[sem]}
        </span>
      </div>

      {/* Valor principal */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:28,fontWeight:800,color:SEM_COLOR[sem],fontFamily:"'SF Mono','Consolas',monospace",lineHeight:1}}>
          {ult ? fmtVal(ult.v,kpi) : "—"}
        </div>
        <div style={{fontSize:10.5,color:C.muted,marginTop:4}}>{ult ? `Último dato: ${MESES[ult.i]} 2025` : "Sin datos disponibles"}</div>
      </div>

      {/* Sparkline grande */}
      <div style={{marginBottom:14}}>
        <Spark vals={kpi.vals} metas={kpi.metas} menorMejor={kpi.menorMejor} h={40}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:9,color:C.muted}}>Ene</span>
          <span style={{fontSize:9,color:C.muted}}>Dic</span>
        </div>
      </div>

      {/* Tabla mensual */}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              {conDatos.map(({i})=>(
                <th key={i} style={{padding:"4px 6px",textAlign:"center",fontSize:9.5,
                  color:C.muted,fontWeight:500,whiteSpace:"nowrap"}}>{MESES[i]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {conDatos.map(({v,i,m})=>{
                const ok = m==null?null:kpi.menorMejor?v<=m:v>=m;
                return (
                  <td key={i} style={{padding:"4px 6px",textAlign:"center"}}>
                    <div style={{fontSize:11,fontWeight:700,color:ok==null?C.azulT:ok?C.verdeT:C.rojoT,
                      fontFamily:"monospace",whiteSpace:"nowrap"}}>
                      {fmtVal(v,kpi)}
                    </div>
                    {m!=null && <div style={{fontSize:8.5,color:C.muted,marginTop:1}}>/{fmtVal(m,kpi)}</div>}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── VISTA DETALLE GERENCIA ─────────────────────────────
function DetalleGerencia({g}) {
  const sems = g.kpis.map(getSem);
  const enMeta = sems.filter(s=>s==="green").length;
  const atencion = sems.filter(s=>s==="red").length;

  return (
    <div>
      {/* Banner */}
      <div style={{background:`linear-gradient(135deg,${g.color} 0%,${g.color}cc 100%)`,
        borderRadius:14,padding:"22px 26px",marginBottom:20,
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:12,background:"#ffffff20",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
            {g.icono}
          </div>
          <div>
            <div style={{fontSize:11,color:"#ffffff80",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{g.codigo}</div>
            <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>{g.nombre}</div>
            <div style={{fontSize:12,color:"#ffffff80",marginTop:2}}>Gerente: {g.gerente} · Indicadores 2025</div>
          </div>
        </div>
        <div style={{display:"flex",gap:16}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:"#4ADE80"}}>{enMeta}</div>
            <div style={{fontSize:10,color:"#ffffff80"}}>En meta</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:"#F87171"}}>{atencion}</div>
            <div style={{fontSize:10,color:"#ffffff80"}}>Atención</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:26,fontWeight:800,color:"#fff"}}>{g.kpis.length}</div>
            <div style={{fontSize:10,color:"#ffffff80"}}>Total KPIs</div>
          </div>
        </div>
      </div>

      {/* Grid KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {g.kpis.map((k,i)=><KPIDetail key={i} kpi={k} color={g.color}/>)}
      </div>
    </div>
  );
}

// ── NAVBAR ─────────────────────────────────────────────
function Navbar({vista, setVista}) {
  const [open, setOpen] = useState(null);
  return (
    <nav style={{background:C.nav,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 0 #ffffff10"}}>
      <div style={{display:"flex",alignItems:"center",padding:"0 20px",height:54,maxWidth:1440,margin:"0 auto"}}>
        {/* Logo */}
        <button onClick={()=>setVista("home")} style={{background:"none",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",gap:8,padding:"0 4px",marginRight:20,flexShrink:0}}>
          <span style={{fontSize:20}}>🌿</span>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:"#fff",lineHeight:1}}>Hoja Verde 360°</div>
            <div style={{fontSize:8,color:"#4ADE80",letterSpacing:1.5}}>PANEL EJECUTIVO</div>
          </div>
        </button>

        <div style={{width:1,height:24,background:"#ffffff18",marginRight:12,flexShrink:0}}/>

        {/* Items */}
        <div style={{display:"flex",flex:1,overflowX:"auto",gap:0}}>
          {GERENCIAS.map(g=>{
            const isOpen = open===g.id;
            const isActive = vista===g.id;
            const sem = getSem(g.kpis[g.kpisHome[0]]);
            return (
              <div key={g.id} style={{position:"relative",flexShrink:0}}>
                <button onClick={()=>setOpen(isOpen?null:g.id)}
                  style={{background:isOpen||isActive?"#ffffff12":"transparent",
                    border:"none",borderBottom:`2px solid ${isActive?"#4ADE80":"transparent"}`,
                    padding:"0 14px",height:54,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:7,
                    color:isActive?"#fff":"#ffffffaa",fontSize:12,
                    fontWeight:isActive?700:400,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                  <span style={{fontSize:15}}>{g.icono}</span>
                  <span style={{maxWidth:110,overflow:"hidden",textOverflow:"ellipsis"}}>{g.nombre}</span>
                  <div style={{width:7,height:7,borderRadius:"50%",background:SEM_COLOR[sem],flexShrink:0,
                    boxShadow:`0 0 4px ${SEM_COLOR[sem]}`}}/>
                  <span style={{fontSize:9,opacity:0.5,marginLeft:-2}}>{isOpen?"▲":"▼"}</span>
                </button>

                {isOpen && (
                  <>
                    <div style={{position:"fixed",inset:0,zIndex:149}} onClick={()=>setOpen(null)}/>
                    <div style={{position:"absolute",top:54,left:0,zIndex:150,
                      background:C.card,border:`1px solid ${C.borde}`,borderRadius:"0 0 12px 12px",
                      boxShadow:"0 12px 32px #00000025",minWidth:260,overflow:"hidden"}}>
                      {/* Header dropdown */}
                      <div style={{background:g.color,padding:"12px 16px"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{g.icono} {g.nombre}</div>
                        <div style={{fontSize:10,color:"#ffffff80",marginTop:2}}>{g.codigo} · {g.gerente}</div>
                      </div>
                      {/* KPIs rápidos */}
                      <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                        {g.kpisHome.map(ki=>{
                          const k=g.kpis[ki]; if(!k) return null;
                          const ult=getUlt(k); const sem=getSem(k);
                          return (
                            <div key={ki} style={{display:"flex",justifyContent:"space-between",
                              alignItems:"center",padding:"8px 10px",background:"#F9FAFB",
                              borderRadius:8,border:`1px solid ${C.borde}`}}>
                              <span style={{fontSize:11,color:C.sub,flex:1,overflow:"hidden",
                                textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{k.nombre}</span>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                                <div style={{width:6,height:6,borderRadius:"50%",background:SEM_COLOR[sem]}}/>
                                <span style={{fontSize:12,fontWeight:800,color:SEM_COLOR[sem],fontFamily:"monospace"}}>
                                  {ult?fmtVal(ult.v,k):"—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{padding:"0 12px 12px"}}>
                        <button onClick={()=>{setVista(g.id);setOpen(null);}}
                          style={{width:"100%",background:g.color,border:"none",borderRadius:8,
                            padding:"9px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                          Ver todos los KPIs →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{fontSize:10.5,color:"#ffffff50",marginLeft:12,flexShrink:0,whiteSpace:"nowrap"}}>{hoy()}</div>
      </div>
    </nav>
  );
}

// ── DASHBOARD HOME ─────────────────────────────────────
function DashboardHome({setVista}) {
  const total = GERENCIAS.length;
  const enMeta = GERENCIAS.filter(g=>getSem(g.kpis[g.kpisHome[0]])==="green").length;
  const atencion = GERENCIAS.filter(g=>getSem(g.kpis[g.kpisHome[0]])==="red").length;
  const seguimiento = GERENCIAS.filter(g=>getSem(g.kpis[g.kpisHome[0]])==="amber").length;

  return (
    <div>
      {/* Banner */}
      <div style={{background:"linear-gradient(135deg,#1A2E0A 0%,#2D5016 100%)",borderRadius:16,
        padding:"24px 28px",marginBottom:22,display:"flex",justifyContent:"space-between",
        alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontSize:10,color:"#4ADE80",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Panel Ejecutivo 2025</div>
          <h1 style={{fontSize:24,fontWeight:800,color:"#fff",margin:0,lineHeight:1.2}}>Dashboard General</h1>
          <p style={{fontSize:12.5,color:"#ffffff70",margin:"6px 0 0"}}>Grupo Hoja Verde · {total} Gerencias · Indicadores de Macroprocesos</p>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[
            {n:enMeta,     l:"En Meta",        c:"#4ADE80"},
            {n:seguimiento,l:"En Seguimiento",  c:"#FCD34D"},
            {n:atencion,   l:"Atención",        c:"#F87171"},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:"center",padding:"0 8px"}}>
              <div style={{fontSize:32,fontWeight:800,color:s.c,lineHeight:1}}>{s.n}</div>
              <div style={{fontSize:10,color:"#ffffff70",marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid gerencias */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {GERENCIAS.map(g=><CardGerencia key={g.id} g={g} onSelect={setVista}/>)}
      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────
export default function App() {
  const [vista, setVista] = useState("home");
  const gerSel = GERENCIAS.find(g=>g.id===vista);

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:C.texto}}>
      <Navbar vista={vista} setVista={setVista}/>
      <div style={{padding:"24px 24px 48px",maxWidth:1440,margin:"0 auto"}}>
        {vista==="home" ? (
          <DashboardHome setVista={setVista}/>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
              <button onClick={()=>setVista("home")}
                style={{background:"none",border:"none",color:C.azulT,cursor:"pointer",
                  fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                ← Panel General
              </button>
              <span style={{color:C.muted,fontSize:12}}>/</span>
              <span style={{fontSize:12,color:C.sub,fontWeight:500}}>{gerSel?.nombre}</span>
            </div>
            {gerSel && <DetalleGerencia g={gerSel}/>}
          </>
        )}
      </div>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#F7F8FA;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px;}
        nav *::-webkit-scrollbar{display:none;}
      `}</style>
    </div>
  );
}
 