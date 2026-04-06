import { useState } from "react";

const C = {
  bg:"#FAF5EC", panel:"#F0E8D8", card:"#FFFFFF", borde:"#D6C9B0",
  hover:"#F5EDD8", texto:"#1A2E0A", gris:"#7A8C6A",
  verde:"#2D5016", verdeM:"#4A7C3F", verdeL:"#E8F5E0",
  amber:"#C4781A", amberL:"#FFF3DC",
  rojo:"#C0392B", rojoL:"#FDE8E8",
  azul:"#1A5276", azulL:"#EAF2FB",
};
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmt$  = v => v==null?"—":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(1)}K`:`$${Number(v).toFixed(2)}`;
const fmtV  = (v,kpi) => {
  if(v==null) return "—";
  if(kpi.isPct) return `${(v*100).toFixed(2)}%`;
  if(kpi.unidad==="$"||kpi.unidad==="$/ha"||kpi.unidad==="$/tallo") return fmt$(v);
  if(kpi.unidad==="%"&&v<2) return `${(v*100).toFixed(1)}%`;
  return `${Number(v).toFixed(2)} ${kpi.unidad}`;
};
const hoy = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});
const colores_AÑO = {2023:"#1A5276",2024:"#2D5016",2025:"#C4781A",2026:"#C0392B"};

// ══════════════════════════════════════════════════════════
//  DATOS KPIs
// ══════════════════════════════════════════════════════════
const GERENCIAS = [
  {
    id:"produccion", codigo:"MP-1300", icono:"🌱", color:"#2D5016",
    nombre:"Producción de Flores", gerente:"Roberto Toscano",
    kpisDestacados:[0,6],
    kpis:[
      {nombre:"Productividad Exportable vs Planificada",unidad:"t/m²",
       vals:[6.999,6.607,5.193,6.338,6.184,5.313,6.167,5.269,null,null,null,null],
       metas:[7.098,7.051,5.103,6.303,7.203,5.501,6.137,5.965,null,null,null,null]},
      {nombre:"Gasto Fertilización / Hectárea",unidad:"$/ha",meta:1800,
       vals:[2234,2122,2196,2229,1956,1573,1856,1652,null,null,null,null],
       metas:[1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800]},
      {nombre:"Gasto Pesticidas / Hectárea",unidad:"$/ha",meta:1600,
       vals:[1647,1613,1624,1766,1550,1332,1256,1050,null,null,null,null],
       metas:[1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600]},
      {nombre:"No Proceso",unidad:"%",isPct:true,
       vals:[0,0.0035,0,0,0.0222,0.0107,0.0457,0.0109,null,null,null,null],
       metas:[0.0218,0.0216,0.0216,0.0160,0.0167,0.0168,0.0343,0.0345,null,null,null,null]},
      {nombre:"Bajas",unidad:"%",isPct:true,
       vals:[0,0.0276,0.0062,0.0051,0.0194,0.0328,0.0575,0.0490,null,null,null,null],
       metas:[0.0292,0.0068,0.0145,0.0252,0.0078,0.0087,0.0290,0.0174,null,null,null,null]},
      {nombre:"Producto No Conforme",unidad:"%",isPct:true,
       vals:[0.1895,0.1695,0.2057,0.1505,0.1262,0.1391,0.1365,0.1476,null,null,null,null],
       metas:[0.1821,0.1715,0.1655,0.1661,0.1687,0.1574,0.1529,0.1626,null,null,null,null]},
      {nombre:"Nacional por Prob. Fitosanitarios",unidad:"%",isPct:true,nota:"Meta ≤5%",
       vals:[0.0583,0.0508,0.0386,0.0362,0.0586,0.0628,0.0618,0.0605,null,null,null,null]},
    ]
  },
  {
    id:"postcosecha", codigo:"MP-1400", icono:"✂️", color:"#1A5276",
    nombre:"Procesamiento y Despacho", gerente:"Alexandra Macias",
    kpisDestacados:[1,2],
    kpis:[
      {nombre:"Vida en Florero",unidad:"días",meta:12,
       vals:[13.56,12.52,13.56,14.52,14.26,13.32,13.42,14.52,null,null,null,null],
       metas:[12,12,12,12,12,12,12,12,12,12,12,12]},
      {nombre:"Tallos Procesados / Persona / Hora",unidad:"t/p/h",meta:145,
       vals:[140.04,142.37,145.91,142.6,145.91,150.68,149.41,145.48,null,null,null,null],
       metas:[145,145,145,145,145,145,145,145,145,145,145,145]},
      {nombre:"Costo HE Postcosecha / Tallo",unidad:"$/tallo",meta:0.0771,
       vals:[0.0762,0.0741,0.0682,0.0679,0.0721,0.0682,0.0673,0.0661,null,null,null,null],
       metas:[0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771]},
      {nombre:"Calificación Florcontrol",unidad:"%",meta:95,
       vals:[89.33,93,92.67,88.67,89.25,90.75,93.75,93.75,null,null,null,null],
       metas:[95,95,95,95,95,95,95,95,95,95,95,95]},
    ]
  },
  {
    id:"comercial", codigo:"MP-1200", icono:"📈", color:"#C4781A",
    nombre:"Gestión Comercial y Marketing", gerente:"Hernán Dávila",
    kpisDestacados:[0,1],
    kpis:[
      {nombre:"Volumen de Ventas",unidad:"$",
       vals:[2024799,2473653,1408068,1743637,1910969,1457938,1497149,1591793,1703640,null,null,null],
       metas:[1909734,2023605,1359432,1620883,1730402,1371962,1561741,1349948,1479313,null,null,null]},
      {nombre:"Precio Promedio Flor Fresca",unidad:"$/tallo",
       vals:[0.537,0.5908,0.5065,0.4859,0.4833,0.4778,0.4716,0.4972,0.4972,null,null,null],
       metas:[0.5054,0.5683,0.4873,0.4756,0.5182,0.4801,0.4731,0.4778,0.4760,null,null,null]},
      {nombre:"Precio Promedio Flor Tinturada",unidad:"$/tallo",
       vals:[1.0093,1.07,0.95,0.96,0.97,0.97,0.97,1.02,0.96,null,null,null],
       metas:[0.95,1.0,0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.96,0.94,0.94]},
      {nombre:"Ventas Productos Nuevos",unidad:"%",isPct:true,
       vals:[0.0634,0.0683,0.0662,0.0572,0.0629,0.0649,0.062,0.0846,0.0662,null,null,null],
       metas:[0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10]},
      {nombre:"Clientes Nuevos",unidad:"#",
       vals:[4,4,3,1,9,4,8,12,7,null,null,null],
       metas:[4,4,4,4,4,4,4,4,4,4,4,4]},
      {nombre:"Rentabilidad Nuevos Productos",unidad:"%",isPct:true,
       vals:[0.43,0.48,0.42,0.41,0.43,0.41,0.41,0.39,0.40,null,null,null],
       metas:[0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30]},
      {nombre:"Satisfacción del Cliente",unidad:"/5",
       vals:[null,null,null,null,null,4.67,null,null,4.67,null,null,null],
       metas:[null,null,null,null,null,4.5,null,null,4.5,null,null,null]},
    ]
  },
  {
    id:"finanzas", codigo:"MP-2400", icono:"💰", color:"#6C3483",
    nombre:"Gestión Financiera", gerente:"Patricio Mora",
    kpisDestacados:[0,1],
    kpis:[
      {nombre:"EBITDA",unidad:"%",isPct:true,nota:"Trimestral · >20% Excelente · 12–20% Saludable",
       vals:[null,null,0.28,null,null,0.18,null,null,null,null,null,null],
       metas:[null,null,0.22,null,null,0.17,null,null,null,null,null,null]},
      {nombre:"Índice Productividad Financiera de Costos",unidad:"$/$ invertido",nota:"Ingresos / Costos totales. >1 genera más que gasta",
       vals:[1.26,1.52,1.01,1.18,1.18,0.99,1.01,1.05,null,null,null,null]},
    ]
  },
  {
    id:"talentohumano", codigo:"MP-2100", icono:"👥", color:"#0E6655",
    nombre:"Gestión del Talento Humano", gerente:"Sofía Ingavelez",
    kpisDestacados:[0,1],
    kpis:[
      {nombre:"Eficiencia Financiera de la Mano de Obra",unidad:"%",isPct:true,nota:"Costo MO / Ingresos totales",
       vals:[0.4072,0.3561,0.5178,0.4267,0.4359,0.5334,0.4955,0.4895,null,null,null,null],
       metas:[null,null,null,null,null,null,0.45,0.45,0.45,null,null,null]},
      {nombre:"Índice de Rotación del Personal",unidad:"%",nota:"Meta mensual ≤1.4% · Meta anual ≤17%",
       vals:[1.55,3.1,3.2,1.15,0.7,1.8,0.45,1.95,1.35,null,null,null],
       metas:[1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4]},
      {nombre:"NPS Colaboradores",unidad:"pts",nota:"50+ Excelente · 70+ Clase mundial",
       vals:[52.12,52.12,52.12,50.08,50.08,50.08,43.99,43.99,43.99,null,null,null]},
      {nombre:"Satisfacción Laboral",unidad:"/5",nota:"Meta >4.0",
       vals:[4.18,4.18,4.18,4.30,4.30,4.30,4.19,4.19,4.19,null,null,null]},
    ]
  },
  {
    id:"adquisiciones", codigo:"MP-2500", icono:"📦", color:"#C4781A",
    nombre:"Adquisiciones / Supply Chain", gerente:"Paulo",
    kpisDestacados:[0,1],
    kpis:[
      {nombre:"Costo de Compras / Tallo Exportable",unidad:"$/tallo",nota:"Gasto compras / tallos exportables",
       vals:[0.133,0.1115,0.1473,0.1255,0.1094,null,null,null,null,null,null,null]},
      {nombre:"Rotación de Inventario",unidad:"veces",nota:"Consumo / Stock promedio",
       vals:[1.43,1.01,0.78,0.81,0.79,null,null,null,null,null,null,null]},
      {nombre:"Variación de Precios Proveedores",unidad:"%",
       vals:[-0.14,-0.10,-0.30,-0.14,-0.12,null,null,null,null,null,null,null]},
      {nombre:"Gasto Total Compras",unidad:"$",nota:"Fuente: Master File Procurement",
       vals:[497450,464792,407838,null,null,null,null,null,null,null,null,null]},
    ]
  },
  {
    id:"sostenibilidad", codigo:"MP-3200", icono:"🌍", color:"#1A5276",
    nombre:"Mejora Continua / Sostenibilidad", gerente:"N/A",
    kpisDestacados:[0],
    kpis:[
      {nombre:"Tasa de Cierre de No Conformidades",unidad:"%",nota:"NC cerradas / total abiertas en auditorías",
       vals:[0,0,0,0,0,0,null,null,null,null,null,null]},
    ]
  },
];

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
function getUltimoValor(kpi) {
  const noNull = kpi.vals.map((v,i)=>({v,i})).filter(x=>x.v!=null);
  return noNull.length ? noNull[noNull.length-1] : null;
}
function getSemaforo(kpi) {
  const ult = getUltimoValor(kpi);
  if(!ult) return C.gris;
  const {v, i} = ult;
  const meta = kpi.metas?.[i] ?? kpi.meta;
  if(meta==null) return C.azul;
  // Para indicadores donde menor es mejor
  const menorEsMejor = ["Bajas","No Proceso","Producto No Conforme","Nacional","Rotación del Personal",
    "Eficiencia Financiera","Costo HE","Costo de Compras","Variación"].some(k=>kpi.nombre.includes(k));
  const cumple = menorEsMejor ? v<=meta : v>=meta;
  if(cumple) return C.verde;
  const diff = Math.abs((v-meta)/meta);
  return diff<0.10 ? C.amber : C.rojo;
}

// ══════════════════════════════════════════════════════════
//  SPARKLINE
// ══════════════════════════════════════════════════════════
function Sparkline({vals, metas, color, height=28}) {
  const noNull = vals.filter(v=>v!=null);
  if(!noNull.length) return <div style={{height,background:C.panel,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:C.gris}}>Sin datos</span></div>;
  const max = Math.max(...noNull);
  const min = Math.min(...noNull);
  const rng = max-min||max||1;
  return (
    <div style={{display:"flex",gap:2,alignItems:"flex-end",height}}>
      {vals.map((v,i)=>{
        if(v==null) return <div key={i} style={{flex:1,height:3,background:C.panel,borderRadius:2,alignSelf:"flex-end"}}/>;
        const h = Math.max(((v-min)/rng)*100,8);
        const meta = metas?.[i];
        const col = meta==null ? color : (v<=meta ? C.verde : C.rojo);
        return <div key={i} style={{flex:1,height:`${h}%`,background:col,borderRadius:"2px 2px 0 0",opacity:0.85}}/>;
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MINI KPI CARD — para dashboard principal
// ══════════════════════════════════════════════════════════
function MiniKPI({kpi, color}) {
  const ult = getUltimoValor(kpi);
  const sem = getSemaforo(kpi);
  if(!ult) return (
    <div style={{background:C.panel,borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${C.gris}`}}>
      <div style={{fontSize:10,color:C.gris,marginBottom:4}}>{kpi.nombre}</div>
      <div style={{fontSize:14,fontWeight:700,color:C.gris}}>Sin datos</div>
    </div>
  );
  return (
    <div style={{background:C.card,borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${sem}`}}>
      <div style={{fontSize:10,color:C.gris,marginBottom:4,lineHeight:1.3}}>{kpi.nombre}</div>
      <div style={{fontSize:17,fontWeight:800,color:sem,fontFamily:"monospace",lineHeight:1}}>{fmtV(ult.v,kpi)}</div>
      <div style={{fontSize:9,color:C.gris,marginTop:2}}>{MESES[ult.i]} 2025</div>
      <div style={{marginTop:6}}><Sparkline vals={kpi.vals} metas={kpi.metas} color={color} height={20}/></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TARJETA GERENCIA — en dashboard principal
// ══════════════════════════════════════════════════════════
function TarjetaGerencia({g, onSelect}) {
  const kpisDestacados = g.kpisDestacados.map(i=>g.kpis[i]).filter(Boolean);
  const semGlobal = kpisDestacados.map(getSemaforo);
  const hayRojo = semGlobal.some(s=>s===C.rojo);
  const hayAmber = semGlobal.some(s=>s===C.amber);
  const estadoG = hayRojo ? C.rojo : hayAmber ? C.amber : C.verde;
  const estadoLabel = hayRojo ? "Atención" : hayAmber ? "En seguimiento" : "En meta";

  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:14,overflow:"hidden",
      boxShadow:"0 2px 8px #0000080a"}}>
      {/* Header gerencia */}
      <div style={{background:g.color,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{g.icono}</span>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:"#fff",lineHeight:1.2}}>{g.nombre}</div>
            <div style={{fontSize:9,color:"#ffffff88"}}>{g.codigo} · {g.gerente}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
          <span style={{background:estadoG,color:"#fff",fontSize:9,padding:"2px 8px",borderRadius:10,fontWeight:700}}>{estadoLabel}</span>
          <button onClick={()=>onSelect(g.id)}
            style={{background:"#ffffff22",border:"1px solid #ffffff44",borderRadius:6,padding:"3px 10px",color:"#fff",fontSize:10,cursor:"pointer",fontWeight:600}}>
            Ver detalle →
          </button>
        </div>
      </div>
      {/* KPIs destacados */}
      <div style={{padding:"12px",display:"grid",gridTemplateColumns:`repeat(${kpisDestacados.length},1fr)`,gap:8}}>
        {kpisDestacados.map((k,i)=><MiniKPI key={i} kpi={k} color={g.color}/>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VISTA DETALLE GERENCIA
// ══════════════════════════════════════════════════════════
function DetalleGerencia({g}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:g.color,borderRadius:12,padding:"18px 22px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:2,opacity:0.75,textTransform:"uppercase",marginBottom:4}}>{g.codigo} · Indicadores 2025</div>
          <div style={{fontSize:20,fontWeight:800}}>{g.icono} {g.nombre}</div>
          <div style={{fontSize:12,opacity:0.8,marginTop:3}}>Gerente: {g.gerente}</div>
        </div>
        <div style={{textAlign:"right",opacity:0.8}}>
          <div style={{fontSize:11}}>{g.kpis.length} KPIs monitoreados</div>
          <div style={{fontSize:11}}>{g.kpis.filter(k=>k.vals.some(v=>v!=null)).length} con datos 2025</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {g.kpis.map((k,i)=>{
          const ult=getUltimoValor(k);
          const sem=getSemaforo(k);
          return (
            <div key={i} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"14px 16px",borderLeft:`3px solid ${sem}`}}>
              <div style={{fontSize:11,fontWeight:700,color:C.texto,marginBottom:8,lineHeight:1.3}}>{k.nombre}</div>
              <div style={{fontSize:22,fontWeight:800,color:sem,fontFamily:"monospace",lineHeight:1}}>
                {ult ? fmtV(ult.v,k) : "—"}
              </div>
              <div style={{fontSize:10,color:C.gris,margin:"4px 0 10px"}}>{ult?`${MESES[ult.i]} 2025`:"Sin datos"} · {k.unidad}</div>
              <Sparkline vals={k.vals} metas={k.metas} color={g.color}/>
              {k.nota && <div style={{fontSize:9.5,color:C.gris,marginTop:8,borderTop:`1px solid ${C.borde}`,paddingTop:6,lineHeight:1.4}}>{k.nota}</div>}
              {/* Tabla mensual */}
              <div style={{marginTop:10,overflowX:"auto"}}>
                <div style={{display:"flex",gap:2}}>
                  {k.vals.map((v,mi)=>v!=null?(
                    <div key={mi} style={{flex:1,minWidth:28,textAlign:"center"}}>
                      <div style={{fontSize:8,color:C.gris}}>{MESES[mi]}</div>
                      <div style={{fontSize:9.5,fontWeight:700,color:getSemaforo({...k,vals:k.vals.map((_,j)=>j===mi?v:null)}),fontFamily:"monospace"}}>{fmtV(v,k)}</div>
                    </div>
                  ):null)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function App() {
  const [vista, setVista]       = useState("home");   // "home" | gerencia.id
  const [dropdown, setDropdown] = useState(null);     // id del dropdown abierto

  const gerSel = GERENCIAS.find(g=>g.id===vista);

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Inter','Segoe UI',sans-serif",color:C.texto}}>

      {/* ── NAVBAR ── */}
      <nav style={{background:C.verde,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px #00000030"}}>
        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",padding:"0 24px",height:52}}>
          {/* Logo */}
          <button onClick={()=>setVista("home")}
            style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginRight:16}}>
            <span style={{fontSize:22}}>🌿</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#fff",lineHeight:1}}>Hoja Verde 360°</div>
              <div style={{fontSize:8,color:"#95D5B2",letterSpacing:1}}>PORTAL EJECUTIVO</div>
            </div>
          </button>

          <div style={{width:1,height:28,background:"#ffffff22",margin:"0 12px"}}/>

          {/* Gerencias dropdown */}
          <div style={{display:"flex",gap:2,flex:1,overflowX:"auto"}}>
            {GERENCIAS.map(g=>{
              const isOpen = dropdown===g.id;
              const isActive = vista===g.id;
              const semG = getSemaforo(g.kpis[g.kpisDestacados[0]]);
              return (
                <div key={g.id} style={{position:"relative"}}>
                  <button
                    onClick={()=>setDropdown(isOpen?null:g.id)}
                    style={{
                      background:isActive?"#ffffff22":isOpen?"#ffffff15":"transparent",
                      border:"none",borderBottom:`2px solid ${isActive?"#fff":"transparent"}`,
                      padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
                      color:"#fff",fontSize:11,fontWeight:isActive?700:400,whiteSpace:"nowrap",
                      borderRadius:"4px 4px 0 0",
                    }}>
                    <span>{g.icono}</span>
                    <span style={{maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>{g.nombre}</span>
                    <span style={{width:6,height:6,borderRadius:"50%",background:semG,flexShrink:0}}/>
                    <span style={{fontSize:9,opacity:0.7}}>{isOpen?"▲":"▼"}</span>
                  </button>

                  {/* Dropdown */}
                  {isOpen && (
                    <div style={{position:"absolute",top:"100%",left:0,background:C.card,border:`1px solid ${C.borde}`,
                      borderRadius:"0 8px 8px 8px",boxShadow:"0 8px 24px #00000020",minWidth:240,zIndex:200}}>
                      {/* Header */}
                      <div style={{background:g.color,padding:"10px 14px",borderRadius:"0 8px 0 0"}}>
                        <div style={{fontSize:12,fontWeight:800,color:"#fff"}}>{g.icono} {g.nombre}</div>
                        <div style={{fontSize:9.5,color:"#ffffff99"}}>{g.codigo} · {g.gerente}</div>
                      </div>
                      {/* KPIs rápidos */}
                      <div style={{padding:"8px"}}>
                        {g.kpisDestacados.map(ki=>{
                          const k=g.kpis[ki];
                          const ult=getUltimoValor(k);
                          const sem=getSemaforo(k);
                          return (
                            <div key={ki} style={{padding:"6px 8px",borderRadius:6,marginBottom:4,background:C.panel,
                              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <span style={{fontSize:10,color:C.texto,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginRight:8}}>{k.nombre}</span>
                              <span style={{fontSize:12,fontWeight:800,color:sem,fontFamily:"monospace",flexShrink:0}}>{ult?fmtV(ult.v,k):"—"}</span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Botón ver detalle */}
                      <div style={{padding:"4px 8px 8px"}}>
                        <button onClick={()=>{setVista(g.id);setDropdown(null);}}
                          style={{width:"100%",background:g.color,border:"none",borderRadius:6,padding:"7px",
                            color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                          Ver todos los KPIs →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{fontSize:10,color:"#95D5B2",marginLeft:12,flexShrink:0}}>{hoy()}</div>
        </div>
      </nav>

      {/* Cerrar dropdown al hacer clic fuera */}
      {dropdown && <div style={{position:"fixed",inset:0,zIndex:99}} onClick={()=>setDropdown(null)}/>}

      {/* ── CONTENIDO ── */}
      <div style={{padding:"24px 28px 48px",maxWidth:1400,margin:"0 auto"}}>

        {vista==="home" ? (
          <>
            {/* Banner ejecutivo */}
            <div style={{background:`linear-gradient(135deg,${C.verde} 0%,${C.verdeM} 100%)`,borderRadius:14,
              padding:"22px 28px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:11,color:"#95D5B2",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Panel Ejecutivo</div>
                <h1 style={{fontSize:22,fontWeight:800,color:"#fff",margin:0}}>Dashboard General — Grupo Hoja Verde</h1>
                <p style={{fontSize:12,color:"#ffffff99",margin:"4px 0 0"}}>7 Gerencias · Indicadores de Macroprocesos 2025</p>
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                {[
                  {l:"En Meta",v:GERENCIAS.filter(g=>!getSemaforo(g.kpis[g.kpisDestacados[0]]).includes("C0")||getSemaforo(g.kpis[g.kpisDestacados[0]])===C.verde).length,c:C.verde},
                  {l:"Atención",v:GERENCIAS.filter(g=>getSemaforo(g.kpis[g.kpisDestacados[0]])===C.rojo).length,c:C.rojo},
                ].map((s,i)=>(
                  <div key={i} style={{textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:10,color:"#ffffff88"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid de gerencias */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
              {GERENCIAS.map(g=>(
                <TarjetaGerencia key={g.id} g={g} onSelect={(id)=>setVista(id)}/>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Breadcrumb */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <button onClick={()=>setVista("home")}
                style={{background:"transparent",border:"none",color:C.verde,cursor:"pointer",fontSize:12,fontWeight:600}}>
                ← Panel General
              </button>
              <span style={{color:C.gris,fontSize:12}}>/ {gerSel?.nombre}</span>
            </div>
            {gerSel && <DetalleGerencia g={gerSel}/>}
          </>
        )}
      </div>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#FAF5EC;}
        ::-webkit-scrollbar-thumb{background:#D6C9B0;border-radius:4px;}
        nav::-webkit-scrollbar{display:none;}
      `}</style>
    </div>
  );
}
