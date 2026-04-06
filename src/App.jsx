import { useState } from "react";

const C = {
  bg:"#FAF5EC", panel:"#F0E8D8", card:"#FFFFFF", borde:"#D6C9B0",
  hover:"#F5EDD8", texto:"#1A2E0A", gris:"#7A8C6A",
  verde:"#2D5016", verdeM:"#4A7C3F", verdeL:"#E8F5E0",
  amber:"#C4781A", amberL:"#FFF3DC",
  rojo:"#C0392B",  rojoL:"#FDE8E8",
  azul:"#1A5276",  azulL:"#EAF2FB",
  sidebar:"#1A2E0A",
};

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmt$  = v => v==null?"—":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(1)}K`:`$${Number(v).toFixed(2)}`;
const fmtN  = (v,dec=2) => v==null?"—":Number(v).toFixed(dec);
const fmtP  = v => v==null?"—":`${(v*100).toFixed(1)}%`;
const hoy   = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});

// ══════════════════════════════════════════════════════════
//  DATOS KPIs — MATRIZ INDICADORES 2025
// ══════════════════════════════════════════════════════════
const GERENCIAS = [
  {
    id:"produccion", codigo:"MP-1300", icono:"🌱",
    nombre:"Producción de Flores",
    gerente:"Roberto Toscano",
    color:"#2D5016",
    kpis:[
      { nombre:"Productividad Exportable vs Planificada", unidad:"t/m²", meta:null,
        vals:[6.999,6.607,5.193,6.338,6.184,5.313,6.167,5.269,null,null,null,null],
        metas:[7.098,7.051,5.103,6.303,7.203,5.501,6.137,5.965,null,null,null,null] },
      { nombre:"Gasto Fertilización / Hectárea", unidad:"$/ha", meta:1800,
        vals:[2234,2122,2196,2229,1956,1573,1856,1652,null,null,null,null],
        metas:[1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800,1800] },
      { nombre:"Gasto Pesticidas / Hectárea", unidad:"$/ha", meta:1600,
        vals:[1647,1613,1624,1766,1550,1332,1256,1050,null,null,null,null],
        metas:[1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600,1600] },
      { nombre:"No Proceso", unidad:"%", meta:0.0217,
        vals:[0,0.0035,0,0,0.0222,0.0107,0.0457,0.0109,null,null,null,null],
        metas:[0.0218,0.0216,0.0216,0.0160,0.0167,0.0168,0.0343,0.0345,null,null,null,null], isPct:true },
      { nombre:"Bajas", unidad:"%", meta:0.0169,
        vals:[0,0.0276,0.0062,0.0051,0.0194,0.0328,0.0575,0.0490,null,null,null,null],
        metas:[0.0292,0.0068,0.0145,0.0252,0.0078,0.0087,0.0290,0.0174,null,null,null,null], isPct:true },
      { nombre:"Producto No Conforme", unidad:"%", meta:0.173,
        vals:[0.1895,0.1695,0.2057,0.1505,0.1262,0.1391,0.1365,0.1476,null,null,null,null],
        metas:[0.1821,0.1715,0.1655,0.1661,0.1687,0.1574,0.1529,0.1626,null,null,null,null], isPct:true },
      { nombre:"Nacional por Problemas Fitosanitarios", unidad:"%", meta:"≤5%",
        vals:[0.0583,0.0508,0.0386,0.0362,0.0586,0.0628,0.0618,0.0605,null,null,null,null],
        isPct:true },
    ]
  },
  {
    id:"postcosecha", codigo:"MP-1400", icono:"✂️",
    nombre:"Procesamiento y Despacho",
    gerente:"Alexandra Macias",
    color:"#1A5276",
    kpis:[
      { nombre:"Vida en Florero", unidad:"días", meta:12,
        vals:[13.56,12.52,13.56,14.52,14.26,13.32,13.42,14.52,null,null,null,null],
        metas:[12,12,12,12,12,12,12,12,12,12,12,12] },
      { nombre:"Tallos Procesados / Persona / Hora", unidad:"t/p/h", meta:145,
        vals:[140.04,142.37,145.91,142.6,145.91,150.68,149.41,145.48,null,null,null,null],
        metas:[145,145,145,145,145,145,145,145,145,145,145,145] },
      { nombre:"Costo Horas Extras Postcosecha / Tallo", unidad:"$/tallo", meta:0.0771,
        vals:[0.0762,0.0741,0.0682,0.0679,0.0721,0.0682,0.0673,0.0661,null,null,null,null],
        metas:[0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771,0.0771] },
      { nombre:"Calificación Florcontrol", unidad:"%", meta:95,
        vals:[89.33,93,92.67,88.67,89.25,90.75,93.75,93.75,null,null,null,null],
        metas:[95,95,95,95,95,95,95,95,95,95,95,95] },
    ]
  },
  {
    id:"comercial", codigo:"MP-1200", icono:"📈",
    nombre:"Gestión Comercial y Marketing",
    gerente:"Hernán Dávila",
    color:"#C4781A",
    kpis:[
      { nombre:"Volumen de Ventas", unidad:"$",
        vals:[2024799,2473653,1408068,1743637,1910969,1457938,1497149,1591793,1703640,null,null,null],
        metas:[1909734,2023605,1359432,1620883,1730402,1371962,1561741,1349948,1479313,1652520,1522409,1565779] },
      { nombre:"Precio Promedio Flor Fresca", unidad:"$/tallo",
        vals:[0.537,0.5908,0.5065,0.4859,0.4833,0.4778,0.4716,0.4972,0.4972,null,null,null],
        metas:[0.5054,0.5683,0.4873,0.4756,0.5182,0.4801,0.4731,0.4778,0.4760,0.4631,0.4926,0.5370] },
      { nombre:"Precio Promedio Flor Tinturada", unidad:"$/tallo",
        vals:[1.0093,1.07,0.95,0.96,0.97,0.97,0.97,1.02,0.96,null,null,null],
        metas:[0.95,1.0,0.94,0.94,0.94,0.94,0.94,0.94,0.94,0.96,0.94,0.94] },
      { nombre:"Ventas Productos Nuevos", unidad:"%",
        vals:[0.0634,0.0683,0.0662,0.0572,0.0629,0.0649,0.062,0.0846,0.0662,null,null,null],
        metas:[0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10,0.10], isPct:true },
      { nombre:"Clientes Nuevos", unidad:"#",
        vals:[4,4,3,1,9,4,8,12,7,null,null,null],
        metas:[4,4,4,4,4,4,4,4,4,4,4,4] },
      { nombre:"Rentabilidad Nuevos Productos", unidad:"%",
        vals:[0.43,0.48,0.42,0.41,0.43,0.41,0.41,0.39,0.40,null,null,null],
        metas:[0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30,0.30], isPct:true },
      { nombre:"Satisfacción del Cliente", unidad:"/5",
        vals:[null,null,null,null,null,4.67,null,null,4.67,null,null,null],
        metas:[null,null,null,null,null,4.5,null,null,4.5,null,null,null] },
    ]
  },
  {
    id:"finanzas", codigo:"MP-2400", icono:"💰",
    nombre:"Gestión Financiera",
    gerente:"Patricio Mora",
    color:"#6C3483",
    kpis:[
      { nombre:"EBITDA", unidad:"%",
        vals:[null,null,0.28,null,null,0.18,null,null,null,null,null,null],
        metas:[null,null,0.22,null,null,0.17,null,null,null,null,null,null], isPct:true,
        nota:"Cálculo trimestral · 20–30% Excelente · 12–20% Saludable · <10% Alerta" },
      { nombre:"Índice de Productividad Financiera de Costos", unidad:"$/$ invertido",
        vals:[1.26,1.52,1.01,1.18,1.18,0.99,1.01,1.05,null,null,null,null],
        metas:[null,null,null,null,null,null,null,null,null,null,null,null],
        nota:"Ingresos totales / Costos totales. >1 = genera más ingresos que costos" },
    ]
  },
  {
    id:"talentohumano", codigo:"MP-2100", icono:"👥",
    nombre:"Gestión del Talento Humano",
    gerente:"Sofía Ingavelez",
    color:"#0E6655",
    kpis:[
      { nombre:"Eficiencia Financiera de la Mano de Obra", unidad:"%",
        vals:[0.4072,0.3561,0.5178,0.4267,0.4359,0.5334,0.4955,0.4895,null,null,null,null],
        metas:[null,null,null,null,null,null,0.45,0.45,0.45,null,null,null], isPct:true,
        nota:"Costo MO / Ingresos totales. Cálculo mensual" },
      { nombre:"Índice Rotación del Personal (Total GHV)", unidad:"%",
        vals:[1.55,3.1,3.2,1.15,0.7,1.8,0.45,1.95,1.35,null,null,null],
        metas:[1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4,1.4],
        nota:"Meta mensual ≤1.4% · Meta anual ≤17%" },
      { nombre:"NPS Colaboradores (Total GHV)", unidad:"puntos",
        vals:[52.12,52.12,52.12,50.08,50.08,50.08,43.99,43.99,43.99,null,null,null],
        nota:"50+ Excelente · 70+ Clase mundial. Cálculo trimestral" },
      { nombre:"Satisfacción Laboral (Total GHV)", unidad:"/5",
        vals:[4.18,4.18,4.18,4.30,4.30,4.30,4.19,4.19,4.19,null,null,null],
        nota:"Cálculo trimestral · Meta >4.0" },
    ]
  },
  {
    id:"adquisiciones", codigo:"MP-2500", icono:"📦",
    nombre:"Adquisiciones / Supply Chain",
    gerente:"Paulo (Gerente CS)",
    color:"#C4781A",
    kpis:[
      { nombre:"Costo de Compras / Tallo Exportable", unidad:"$/tallo",
        vals:[0.133,0.1115,0.1473,0.1255,0.1094,null,null,null,null,null,null,null],
        nota:"Gasto compras / tallos exportables. Cálculo mensual" },
      { nombre:"Rotación de Inventario", unidad:"veces",
        vals:[1.43,1.01,0.78,0.81,0.79,null,null,null,null,null,null,null],
        nota:"Consumo / Stock promedio. Cálculo mensual" },
      { nombre:"Variación de Precios Proveedores", unidad:"%",
        vals:[-0.14,-0.10,-0.30,-0.14,-0.12,null,null,null,null,null,null,null],
        nota:"% variación precio vs período anterior" },
      { nombre:"Gasto Total Compras 2025", unidad:"$", esAnual:true,
        vals:[497450,464792,407838,null,null,null,null,null,null,null,null,null],
        nota:"Fuente: Master File Procurement" },
    ]
  },
  {
    id:"sostenibilidad", codigo:"MP-3200", icono:"🌍",
    nombre:"Mejora Continua / Sostenibilidad",
    gerente:"N/A",
    color:"#1A5276",
    kpis:[
      { nombre:"Tasa de Cierre Efectivo de No Conformidades", unidad:"%",
        vals:[0,0,0,0,0,0,null,null,null,null,null,null],
        nota:"No conformidades cerradas / total abiertas en auditorías" },
    ]
  },
];

// ══════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ══════════════════════════════════════════════════════════
function Sparkline({vals, metas, color}) {
  const noNull = vals.filter(v=>v!=null);
  if (!noNull.length) return <div style={{fontSize:10,color:C.gris,fontStyle:"italic"}}>Sin datos</div>;
  const max = Math.max(...noNull);
  const min = Math.min(...noNull);
  const rng = max-min || 1;
  return (
    <div style={{display:"flex",gap:2,alignItems:"flex-end",height:32}}>
      {vals.map((v,i)=> {
        if (v==null) return <div key={i} style={{flex:1,height:4,background:C.panel,borderRadius:2}}/>;
        const h = Math.max(((v-min)/rng)*100,8);
        const meta = metas?.[i];
        const ok = meta==null ? true : v<=meta;
        const barColor = meta==null ? color : (ok ? C.verde : C.rojo);
        return <div key={i} style={{flex:1,height:`${h}%`,background:barColor,borderRadius:"2px 2px 0 0",opacity:0.85}}/>;
      })}
    </div>
  );
}

function KPICard({kpi, color}) {
  const noNull = kpi.vals.filter(v=>v!=null);
  const ultimo = noNull[noNull.length-1];
  const ultimoMes = MESES[kpi.vals.lastIndexOf(ultimo)];
  const meta = typeof kpi.meta === 'number' ? kpi.meta : null;
  const ok = meta==null ? null : ultimo <= meta;
  const semColor = ok==null ? color : ok ? C.verde : C.rojo;

  const formatVal = (v) => {
    if (v==null) return "—";
    if (kpi.isPct) return `${(v*100).toFixed(2)}%`;
    if (kpi.unidad==="$"||kpi.unidad==="$/ha"||kpi.unidad==="$/tallo"||kpi.unidad==="$/$ invertido") return fmt$(v);
    if (kpi.unidad==="%") return `${typeof v==='number'&&v<2?fmtP(v):v}`;
    return `${fmtN(v)} ${kpi.unidad}`;
  };

  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"14px 16px",borderLeft:`3px solid ${semColor}`}}>
      <div style={{fontSize:11,fontWeight:700,color:C.texto,marginBottom:8,lineHeight:1.3}}>{kpi.nombre}</div>
      <div style={{fontSize:22,fontWeight:800,color:semColor,fontFamily:"monospace",lineHeight:1}}>{formatVal(ultimo)}</div>
      <div style={{fontSize:10,color:C.gris,margin:"4px 0 10px"}}>{ultimoMes} 2025 · {kpi.unidad}</div>
      <Sparkline vals={kpi.vals} metas={kpi.metas} color={color}/>
      {kpi.nota && <div style={{fontSize:9.5,color:C.gris,marginTop:8,lineHeight:1.4,borderTop:`1px solid ${C.borde}`,paddingTop:6}}>{kpi.nota}</div>}
      {meta!=null && (
        <div style={{fontSize:10,marginTop:6,color:semColor,fontWeight:700}}>
          {ok?"✅":"🔴"} Meta: {kpi.isPct?`${(meta*100).toFixed(1)}%`:meta} · {ok?"En meta":"Fuera de meta"}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VISTA ADQUISICIONES — tabs completos
// ══════════════════════════════════════════════════════════
const COLORES_AÑO = {2023:"#1A5276",2024:"#2D5016",2025:"#C4781A",2026:"#C0392B"};
const TOTALES = [{año:2023,total:4866164},{año:2024,total:5106708},{año:2025,total:5297155},{año:2026,total:996670,nota:"Ene–Feb"}];
const MENSUALES = {
  2023:[561238,457772,294892,450965,451604,382958,371681,323810,433908,362345,402309,372677],
  2024:[518099,391704,412529,487554,418303,344582,432437,421850,457859,422478,369776,429532],
  2026:[495176,501492,null,null,null,null,null,null,null,null,null,null],
};
const CATS = [
  {cat:"Abonos y Fertilizantes",c2023:1829798,c2024:1720766,c2026p:276299},
  {cat:"Material de Empaque",c2023:1292469,c2024:1319976,c2026p:315290},
  {cat:"Fungicidas",c2023:560330,c2024:815231,c2026p:171384},
  {cat:"Pesticidas e Insect.",c2023:378290,c2024:265965,c2026p:37931},
  {cat:"Repuestos y Accesorios",c2023:205199,c2024:213600,c2026p:31356},
  {cat:"Plásticos Invernaderos",c2023:187485,c2024:188076,c2026p:21725},
  {cat:"Otros Insumos",c2023:137756,c2024:167421,c2026p:53941},
  {cat:"Mat. Flores Tinturadas",c2023:68819,c2024:138226,c2026p:43392},
];
const PROVS = [
  {n:"Megastockec Distribuidora Agrícola",t:478605,pct:9.04,cat:"EMPAQUE"},
  {n:"Fito Sanitario Fitosan S.A.",t:345520,pct:6.52,cat:"FERTILIZANTES"},
  {n:"Papelera Nacional S.A.",t:300262,pct:5.67,cat:"EMPAQUE"},
  {n:"Ecuaquimica Ecuatoriana",t:267066,pct:5.04,cat:"AGROQUÍMICOS"},
  {n:"Alexis Mejía Representaciones",t:253412,pct:4.78,cat:"AGROQUÍMICOS"},
  {n:"Proflower S.A.",t:238176,pct:4.50,cat:"FERTILIZANTES"},
  {n:"Corpcultivos S.A.S.",t:214650,pct:4.05,cat:"AGROQUÍMICOS"},
  {n:"Eurofert S.A.",t:188218,pct:3.55,cat:"FERTILIZANTES"},
  {n:"Haifa Ecuador S.A.",t:164368,pct:3.10,cat:"FERTILIZANTES"},
  {n:"Vallejo Mosquera E.F.",t:160041,pct:3.02,cat:"EMPAQUE"},
];
const PPTO_GHV = {
  2024:[{ppto:204869,ejec:224640,pct:105.5},{ppto:204869,ejec:205479,pct:96.5},{ppto:204869,ejec:195035,pct:91.6},{ppto:204869,ejec:209919,pct:98.5},{ppto:204869,ejec:211057,pct:99.1},{ppto:204869,ejec:191200,pct:89.8},{ppto:204869,ejec:206533,pct:97.0},{ppto:185708,ejec:198600,pct:103.9},{ppto:185708,ejec:179173,pct:96.5},{ppto:207677,ejec:207638,pct:97.5},{ppto:207677,ejec:180771,pct:83.8},{ppto:204869,ejec:214444,pct:100.7}],
  2025:[{ppto:187682,ejec:215060,pct:114.2},{ppto:187022,ejec:206989,pct:109.9},{ppto:186899,ejec:211670,pct:112.3},{ppto:186432,ejec:221389,pct:121.1},{ppto:187682,ejec:194283,pct:103.1},{ppto:187022,ejec:160984,pct:85.5},{ppto:198798,ejec:181930,pct:91.5},{ppto:205530,ejec:163301,pct:79.5},{ppto:205530,ejec:183555,pct:89.3},{ppto:205530,ejec:215475,pct:104.8},{ppto:205530,ejec:199450,pct:97.0},{ppto:207672,ejec:203941,pct:99.2}],
  2026:[{ppto:207672,ejec:217013,pct:104.5},{ppto:207672,ejec:101030,pct:48.6}],
};

const SC_TABS = [
  {id:"resumen",label:"Resumen",icono:"📊"},
  {id:"tendencias",label:"Tendencias",icono:"📈"},
  {id:"categorias",label:"Categorías",icono:"📦"},
  {id:"proveedores",label:"Proveedores",icono:"🏭"},
  {id:"presupuesto",label:"Ejec. vs Ppto",icono:"🎯"},
];

function ViewAdquisiciones() {
  const [tab, setTab] = useState("resumen");
  const semPpto = (p) => p==null?C.gris:p<=95?C.verde:p<=105?C.amber:C.rojo;

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:2,marginBottom:20,borderBottom:`1px solid ${C.borde}`,overflowX:"auto"}}>
        {SC_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"transparent",border:"none",borderBottom:`3px solid ${tab===t.id?C.amber:"transparent"}`,padding:"10px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:400,color:tab===t.id?C.amber:C.gris,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
            {t.icono} {t.label}
          </button>
        ))}
      </div>

      {tab==="resumen" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {TOTALES.map(a=>(
              <div key={a.año} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"16px",borderTop:`3px solid ${COLORES_AÑO[a.año]}`}}>
                <div style={{fontSize:10,color:C.gris,textTransform:"uppercase",marginBottom:4}}>Total {a.año}{a.nota?` (${a.nota})`:""}</div>
                <div style={{fontSize:22,fontWeight:800,color:COLORES_AÑO[a.año],fontFamily:"monospace"}}>{fmt$(a.total)}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14}}>
            <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px"}}>
              <h3 style={{fontSize:13,fontWeight:700,color:C.texto,marginBottom:12}}>Top 10 Proveedores 2025</h3>
              {PROVS.map((p,i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:11,color:C.texto,fontWeight:i<3?700:400}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`} {p.n}</span>
                    <span style={{fontSize:11,fontWeight:700,color:C.verde,fontFamily:"monospace"}}>{fmt$(p.t)}</span>
                  </div>
                  <div style={{height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(p.t/PROVS[0].t)*100}%`,background:i<3?C.amber:C.verde,borderRadius:3}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px"}}>
              <h3 style={{fontSize:13,fontWeight:700,color:C.texto,marginBottom:12}}>Top Categorías 2024</h3>
              {CATS.slice(0,6).map((c,i)=>{
                const pct=(c.c2024/5106708*100);
                return (
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                      <span style={{fontSize:11,color:C.texto}}>{c.cat}</span>
                      <span style={{fontSize:11,fontWeight:700,color:C.azul}}>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(c.c2024/CATS[0].c2024)*100}%`,background:C.azul,borderRadius:3,opacity:0.7}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab==="tendencias" && (
        <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px"}}>
          <h3 style={{fontSize:13,fontWeight:700,color:C.texto,marginBottom:16}}>Gasto Total Anual — Tendencia</h3>
          <div style={{display:"flex",gap:16,alignItems:"flex-end",height:180,marginBottom:12}}>
            {TOTALES.map((a,i,arr)=>{
              const h=(a.total/Math.max(...TOTALES.map(x=>x.total)))*100;
              const col=COLORES_AÑO[a.año];
              const prev=arr[i-1];
              const d=prev&&!a.nota?((a.total-prev.total)/prev.total*100):null;
              return (
                <div key={a.año} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  {d!=null&&<div style={{fontSize:11,fontWeight:700,color:d>0?C.rojo:C.verde}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(1)}%</div>}
                  <div style={{fontSize:11,fontWeight:800,color:col,fontFamily:"monospace"}}>{fmt$(a.total)}</div>
                  <div style={{width:"80%",height:`${h}%`,background:a.nota?col+"55":col,borderRadius:"6px 6px 0 0",border:a.nota?`2px dashed ${col}`:"none"}}/>
                  <div style={{fontSize:13,fontWeight:700,color:col}}>{a.año}</div>
                  {a.nota&&<div style={{fontSize:9,color:C.gris}}>{a.nota}</div>}
                </div>
              );
            })}
          </div>
          <div style={{overflowX:"auto",marginTop:8}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.panel}}>
                <th style={{padding:"7px 10px",textAlign:"left",fontSize:10,color:C.gris,fontWeight:600,textTransform:"uppercase"}}>Mes</th>
                {[2023,2024,2026].map(a=><th key={a} style={{padding:"7px 10px",textAlign:"right",fontSize:10,color:COLORES_AÑO[a],fontWeight:600,textTransform:"uppercase"}}>{a}</th>)}
              </tr></thead>
              <tbody>
                {MESES.map((m,i)=>(
                  <tr key={m} style={{borderTop:`1px solid ${C.borde}`}}>
                    <td style={{padding:"7px 10px",fontSize:12,fontWeight:700}}>{m}</td>
                    {[2023,2024,2026].map(a=>{
                      const v=MENSUALES[a]?.[i];
                      return <td key={a} style={{padding:"7px 10px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:v?COLORES_AÑO[a]:C.gris}}>{v?fmt$(v):"—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="categorias" && (
        <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px"}}>
          <h3 style={{fontSize:13,fontWeight:700,color:C.texto,marginBottom:16}}>Categorías de Gasto — Comparativo 2023 vs 2024 vs 2026</h3>
          {CATS.map((c,i)=>{
            const d=((c.c2024-c.c2023)/c.c2023*100);
            const maxV=Math.max(c.c2023,c.c2024,c.c2026p);
            return (
              <div key={i} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.texto}}>{c.cat}</span>
                  <span style={{fontSize:11,fontWeight:700,color:d>0?C.rojo:C.verde}}>{d>0?"▲":"▼"} {Math.abs(d).toFixed(1)}%</span>
                </div>
                {[{k:"c2023",a:2023},{k:"c2024",a:2024},{k:"c2026p",a:2026}].map(({k,a})=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:9.5,fontWeight:700,color:COLORES_AÑO[a],width:28,flexShrink:0}}>{a}</span>
                    <div style={{flex:1,height:7,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${(c[k]/maxV)*100}%`,background:COLORES_AÑO[a],borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:10,fontFamily:"monospace",color:COLORES_AÑO[a],width:55,textAlign:"right",flexShrink:0}}>{fmt$(c[k])}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {tab==="proveedores" && (
        <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px"}}>
          <h3 style={{fontSize:13,fontWeight:700,color:C.texto,marginBottom:16}}>Ranking Proveedores 2025</h3>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:C.panel}}>
              {["#","Proveedor","Total","% Part.","Categoría","Pareto"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {PROVS.map((p,i)=>{
                const cum=PROVS.slice(0,i+1).reduce((a,b)=>a+b.pct,0);
                return (
                  <tr key={i} style={{borderTop:`1px solid ${C.borde}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"8px 10px",fontWeight:800,color:i<3?C.amber:C.gris}}>{i+1}</td>
                    <td style={{padding:"8px 10px",fontSize:11.5,fontWeight:i<3?700:400}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":""} {p.n}</td>
                    <td style={{padding:"8px 10px",fontFamily:"monospace",fontWeight:700,color:C.verde}}>{fmt$(p.t)}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:C.gris}}>{p.pct.toFixed(2)}%</td>
                    <td style={{padding:"8px 10px"}}><span style={{background:C.verdeM+"22",color:C.verdeM,border:`1px solid ${C.verdeM}33`,fontSize:9.5,padding:"2px 8px",borderRadius:10,fontWeight:700}}>{p.cat}</span></td>
                    <td style={{padding:"8px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:44,height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.min(cum,100)}%`,background:cum>80?C.rojo:cum>60?C.amber:C.verde,borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:10,fontWeight:700,color:cum>80?C.rojo:cum>60?C.amber:C.verde}}>{cum.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab==="presupuesto" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[2025,2024].map(año=>{
            const datos=PPTO_GHV[año]||[];
            const mesesConDatos=datos.filter(d=>d.ejec!=null);
            const totalE=mesesConDatos.reduce((a,b)=>a+b.ejec,0);
            const totalP=mesesConDatos.reduce((a,b)=>a+b.ppto,0);
            const pctG=totalP>0?(totalE/totalP*100):0;
            const col=pctG<=95?C.verde:pctG<=105?C.amber:C.rojo;
            return (
              <div key={año} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <h3 style={{fontSize:13,fontWeight:700,color:C.texto}}>Ejec. vs Presupuesto Agroquímicos+Fertilizantes — {año}</h3>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:800,color:col}}>{pctG.toFixed(1)}%</div>
                    <div style={{fontSize:10,color:C.gris}}>Ejec: {fmt$(totalE)} / Ppto: {fmt$(totalP)}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:3,alignItems:"flex-end",height:100,marginBottom:8}}>
                  {datos.map((d,i)=>{
                    const maxV=Math.max(...datos.map(x=>Math.max(x.ppto,x.ejec||0)));
                    const hp=(d.ppto/maxV)*100;
                    const he=d.ejec?(d.ejec/maxV)*100:0;
                    const c=d.pct==null?C.gris:d.pct<=95?C.verde:d.pct<=105?C.amber:C.rojo;
                    return (
                      <div key={i} style={{flex:1,display:"flex",gap:1,alignItems:"flex-end",height:90}}>
                        <div style={{flex:1,height:`${hp}%`,background:C.azul+"44",borderRadius:"2px 2px 0 0",minHeight:3}}/>
                        {d.ejec&&<div style={{flex:1,height:`${he}%`,background:c,borderRadius:"2px 2px 0 0",minHeight:3,opacity:0.85}}/>}
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {datos.map((d,i)=>d.ejec?(
                    <span key={i} style={{fontSize:9.5,background:d.pct<=95?C.verdeL:d.pct<=105?C.amberL:C.rojoL,color:d.pct<=95?C.verde:d.pct<=105?C.amber:C.rojo,padding:"2px 8px",borderRadius:8,fontWeight:700}}>
                      {MESES[i]}: {d.pct}%
                    </span>
                  ):null)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  VISTA GENÉRICA DE GERENCIA
// ══════════════════════════════════════════════════════════
function ViewGerencia({g}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Banner gerencia */}
      <div style={{background:g.color,borderRadius:12,padding:"18px 22px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:2,opacity:0.8,textTransform:"uppercase",marginBottom:4}}>{g.codigo}</div>
          <div style={{fontSize:20,fontWeight:800}}>{g.icono} {g.nombre}</div>
          <div style={{fontSize:12,opacity:0.8,marginTop:4}}>Gerente: {g.gerente} · Indicadores 2025</div>
        </div>
        <div style={{fontSize:11,opacity:0.7,textAlign:"right"}}>
          <div>{g.kpis.length} KPIs monitoreados</div>
          <div>{g.kpis.filter(k=>k.vals.some(v=>v!=null)).length} con datos</div>
        </div>
      </div>

      {/* Resumen de última lectura */}
      <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(g.kpis.length,3)},1fr)`,gap:12}}>
        {g.kpis.filter(k=>k.vals.some(v=>v!=null)).slice(0,3).map((k,i)=>{
          const noNull=k.vals.filter(v=>v!=null);
          const ultimo=noNull[noNull.length-1];
          const meta=typeof k.meta==='number'?k.meta:null;
          const ok=meta==null?null:ultimo<=meta;
          const col=ok==null?g.color:ok?C.verde:C.rojo;
          const fmt=(v)=>k.isPct?`${(v*100).toFixed(2)}%`:k.unidad==="$"?fmt$(v):k.unidad==="%"&&v<2?`${(v*100).toFixed(1)}%`:`${fmtN(v)} ${k.unidad}`;
          return (
            <div key={i} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"14px 16px",borderTop:`3px solid ${col}`}}>
              <div style={{fontSize:10,color:C.gris,marginBottom:4}}>{k.nombre.slice(0,45)}{k.nombre.length>45?"...":""}</div>
              <div style={{fontSize:22,fontWeight:800,color:col,fontFamily:"monospace"}}>{fmt(ultimo)}</div>
              {ok!=null&&<div style={{fontSize:10,color:col,fontWeight:700,marginTop:4}}>{ok?"✅ En meta":"🔴 Fuera de meta"}</div>}
            </div>
          );
        })}
      </div>

      {/* Cards de KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {g.kpis.map((k,i)=><KPICard key={i} kpi={k} color={g.color}/>)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function App() {
  const [gerSelId, setGerSelId] = useState("adquisiciones");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const gerSel = GERENCIAS.find(g=>g.id===gerSelId);

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:C.texto,overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:sidebarOpen?260:60,background:C.sidebar,flexShrink:0,display:"flex",flexDirection:"column",transition:"width 0.2s",overflow:"hidden"}}>
        {/* Logo */}
        <div style={{padding:"18px 16px",borderBottom:"1px solid #ffffff15",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:24,flexShrink:0}}>🌿</span>
          {sidebarOpen && (
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#fff",lineHeight:1.2}}>Hoja Verde</div>
              <div style={{fontSize:9,color:"#95D5B2",letterSpacing:1}}>360° PORTAL</div>
            </div>
          )}
          <button onClick={()=>setSidebarOpen(!sidebarOpen)}
            style={{marginLeft:"auto",background:"transparent",border:"none",color:"#ffffff66",cursor:"pointer",fontSize:16,flexShrink:0}}>
            {sidebarOpen?"◀":"▶"}
          </button>
        </div>

        {/* Menu */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 0"}}>
          {sidebarOpen && <div style={{fontSize:9,color:"#ffffff44",padding:"8px 16px 4px",letterSpacing:2,textTransform:"uppercase"}}>Gerencias</div>}
          {GERENCIAS.map(g=>(
            <button key={g.id} onClick={()=>setGerSelId(g.id)}
              style={{
                width:"100%",background:gerSelId===g.id?g.color+"33":"transparent",
                border:"none",borderLeft:`3px solid ${gerSelId===g.id?g.color:"transparent"}`,
                padding:sidebarOpen?"10px 16px":"10px",
                cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                textAlign:"left",transition:"all 0.15s",
              }}>
              <span style={{fontSize:18,flexShrink:0}}>{g.icono}</span>
              {sidebarOpen && (
                <div>
                  <div style={{fontSize:11,fontWeight:gerSelId===g.id?700:400,color:gerSelId===g.id?"#fff":"#ffffffaa"}}>{g.nombre}</div>
                  <div style={{fontSize:9,color:"#ffffff44"}}>{g.codigo}</div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{padding:"12px 16px",borderTop:"1px solid #ffffff15",fontSize:9.5,color:"#ffffff44"}}>
            {hoy()}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${gerSel.color} 0%,${gerSel.color}cc 100%)`,padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{gerSel.icono} {gerSel.nombre}</div>
            <div style={{fontSize:10,color:"#ffffff99"}}>{gerSel.codigo} · Gerente: {gerSel.gerente}</div>
          </div>
          <div style={{fontSize:11,color:"#ffffff88"}}>{hoy()}</div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"24px 28px 40px"}}>
          {gerSelId==="adquisiciones"
            ? <ViewAdquisiciones/>
            : <ViewGerencia g={gerSel}/>
          }
        </div>
      </div>

      <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#FAF5EC;}::-webkit-scrollbar-thumb{background:#D6C9B0;border-radius:4px;}`}</style>
    </div>
  );
}
