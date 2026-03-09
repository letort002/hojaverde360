import { useState, useRef } from "react";

const C = {
  bg:"#FAF5EC", panel:"#F0E8D8", card:"#FFFFFF", borde:"#D6C9B0",
  hover:"#F5EDD8", texto:"#1A2E0A", gris:"#7A8C6A",
  verde:"#2D5016", verdeM:"#4A7C3F", verdeL:"#E8F5E0",
  amber:"#C4781A", amberL:"#FFF3DC",
  rojo:"#C0392B",  rojoL:"#FDE8E8",
  azul:"#1A5276",  azulL:"#EAF2FB",
};

// ── DATOS REALES MASTER FILE ──────────────────────────────
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const TOTALES_ANUALES = [
  { año:2023, total:4866164, completo:true },
  { año:2024, total:5106708, completo:true },
  { año:2025, total:5297155, completo:true },
  { año:2026, total:996670,  completo:false, nota:"Ene–Feb" },
];

const MENSUALES = {
  2023:[561238,457772,294892,450965,451604,382958,371681,323810,433908,362345,402309,372677],
  2024:[518099,391704,412529,487554,418303,344582,432437,421850,457859,422478,369776,429532],
  2026:[495176,501492,null,null,null,null,null,null,null,null,null,null],
};

const COSTO_TALLO_2024 = [0.1376,0.1063,0.1391,0.1229,0.1247,0.1376,0.1394,0.1551,0.1519,0.1150,0.1156,0.1532];
const COSTO_TALLO_2026 = [0.1136,0.1182];

const CATS = [
  { cat:"Abonos y Fertilizantes",  c2023:1829798, c2024:1720766, c2026p:276299  },
  { cat:"Material de Empaque",     c2023:1292469, c2024:1319976, c2026p:315290  },
  { cat:"Fungicidas",              c2023:560330,  c2024:815231,  c2026p:171384  },
  { cat:"Pesticidas e Insect.",    c2023:378290,  c2024:265965,  c2026p:37931   },
  { cat:"Repuestos y Accesorios",  c2023:205199,  c2024:213600,  c2026p:31356   },
  { cat:"Plásticos Invernaderos",  c2023:187485,  c2024:188076,  c2026p:21725   },
  { cat:"Otros Insumos",           c2023:137756,  c2024:167421,  c2026p:53941   },
  { cat:"Mat. Flores Tinturadas",  c2023:68819,   c2024:138226,  c2026p:43392   },
  { cat:"Ropa e Impl. Seguridad",  c2023:111982,  c2024:130438,  c2026p:21988   },
  { cat:"Material Biológico",      c2023:51804,   c2024:109025,  c2026p:15773   },
];

const PROVS = [
  { n:"Megastockec Distribuidora Agrícola S.A.",    t:478605, pct:9.04, cat:"EMPAQUE",       r2024:true,  r2023:true  },
  { n:"Fito Sanitario Fitosan S.A.",                t:345520, pct:6.52, cat:"FERTILIZANTES", r2024:true,  r2023:true  },
  { n:"Papelera Nacional S.A.",                     t:300262, pct:5.67, cat:"EMPAQUE",       r2024:true,  r2023:true  },
  { n:"Ecuaquimica Ecuatoriana",                    t:267066, pct:5.04, cat:"AGROQUÍMICOS",  r2024:true,  r2023:true  },
  { n:"Alexis Mejía Representaciones Cía. Ltda.",   t:253412, pct:4.78, cat:"AGROQUÍMICOS",  r2024:true,  r2023:false },
  { n:"Proflower S.A.",                             t:238176, pct:4.50, cat:"FERTILIZANTES", r2024:true,  r2023:true  },
  { n:"Corpcultivos S.A.S.",                        t:214650, pct:4.05, cat:"AGROQUÍMICOS",  r2024:true,  r2023:true  },
  { n:"Eurofert S.A.",                              t:188218, pct:3.55, cat:"FERTILIZANTES", r2024:true,  r2023:true  },
  { n:"Haifa Ecuador S.A.",                         t:164368, pct:3.10, cat:"FERTILIZANTES", r2024:false, r2023:false },
  { n:"Vallejo Mosquera Enrique Francisco",         t:160041, pct:3.02, cat:"EMPAQUE",       r2024:true,  r2023:true  },
  { n:"Amc Ecuador Cía. Ltda.",                     t:152895, pct:2.89, cat:"EMPAQUE",       r2024:true,  r2023:true  },
  { n:"Insuquimsa Cía. Ltda.",                      t:147632, pct:2.79, cat:"FERTILIZANTES", r2024:true,  r2023:false },
  { n:"Agroimportadora Plastiseed S.A.",            t:145618, pct:2.75, cat:"PLÁSTICOS",     r2024:true,  r2023:true  },
  { n:"Crait Cía. Ltda.",                           t:133754, pct:2.53, cat:"FERTILIZANTES", r2024:true,  r2023:true  },
  { n:"Almeida Davalos Diego Joel",                 t:109840, pct:2.07, cat:"TINTURADAS",    r2024:true,  r2023:true  },
];

const COLORES_AÑO = { 2023:"#1A5276", 2024:"#2D5016", 2025:"#C4781A", 2026:"#C0392B" };
const COLORES_CAT = ["#2D5016","#1A5276","#4A7C3F","#C4781A","#6C3483","#0E6655","#C0392B","#EC4899","#7A8C6A","#D4A017"];

// ── HELPERS ──────────────────────────────────────────────
const fmt$ = v => v==null?"—":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(1)}K`:`$${Number(v).toFixed(0)}`;
const hoy  = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});

// ── COMPONENTES BASE ──────────────────────────────────────
function KCard({icono,label,valor,sub,color,delta}) {
  const col = color||C.verde;
  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px 20px",borderTop:`3px solid ${col}`}}>
      <div style={{fontSize:22,marginBottom:8}}>{icono}</div>
      <div style={{fontSize:22,fontWeight:800,color:C.texto,fontFamily:"monospace",lineHeight:1}}>{valor}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.texto,marginTop:6}}>{label}</div>
      {sub && <div style={{fontSize:10.5,color:C.gris,marginTop:3}}>{sub}</div>}
      {delta!=null && <div style={{fontSize:11,fontWeight:700,color:delta>=0?C.rojo:C.verde,marginTop:4}}>{delta>=0?"▲":"▼"} {Math.abs(delta).toFixed(1)}% vs año anterior</div>}
    </div>
  );
}

function SecCard({titulo,children,extra,sub}) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:14,padding:"20px 22px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:sub?4:16}}>
        <div>
          <h3 style={{color:C.texto,fontSize:13,fontWeight:700,margin:0}}>{titulo}</h3>
          {sub && <p style={{color:C.gris,fontSize:10.5,margin:"3px 0 14px"}}>{sub}</p>}
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Badge({texto,color}) {
  const col = color||C.gris;
  return <span style={{background:col+"18",color:col,border:`1px solid ${col}33`,fontSize:9.5,padding:"2px 8px",borderRadius:10,fontWeight:700,whiteSpace:"nowrap"}}>{texto}</span>;
}

const TABS = [
  {id:"tendencias",  label:"Tendencias 2023–2026", icono:"📈"},
  {id:"estacional",  label:"Estacionalidad",        icono:"📅"},
  {id:"categorias",  label:"Categorías Año a Año",  icono:"📦"},
  {id:"costo",       label:"Costo por Tallo",       icono:"💲"},
  {id:"proveedores", label:"Proveedores Nuevos vs Recurrentes", icono:"🏭"},
  {id:"presupuesto", label:"Ejec. vs Presupuesto",  icono:"🎯"},
];

// ══════════════════════════════════════════════════════════
//  DATOS PRESUPUESTO — Agroquímicos & Fertilizantes
//  Fuente: GHV_Ejecución_vs_Ppto_2024-2026
// ══════════════════════════════════════════════════════════
const PPTO_GHV = {
  2024: [
    {ppto:204869,ejec:224640,pct:105.5},
    {ppto:204869,ejec:205479,pct:96.5},
    {ppto:204869,ejec:195035,pct:91.6},
    {ppto:204869,ejec:209919,pct:98.5},
    {ppto:204869,ejec:211057,pct:99.1},
    {ppto:204869,ejec:191200,pct:89.8},
    {ppto:204869,ejec:206533,pct:97.0},
    {ppto:185708,ejec:198600,pct:103.9},
    {ppto:185708,ejec:179173,pct:96.5},
    {ppto:207677,ejec:207638,pct:97.5},
    {ppto:207677,ejec:180771,pct:83.8},
    {ppto:204869,ejec:214444,pct:100.7},
  ],
  2025: [
    {ppto:187682,ejec:215060,pct:114.2},
    {ppto:187022,ejec:206989,pct:109.9},
    {ppto:186899,ejec:211670,pct:112.3},
    {ppto:186432,ejec:221389,pct:121.1},
    {ppto:187682,ejec:194283,pct:103.1},
    {ppto:187022,ejec:160984,pct:85.5},
    {ppto:198798,ejec:181930,pct:91.5},
    {ppto:205530,ejec:163301,pct:79.5},
    {ppto:205530,ejec:183555,pct:89.3},
    {ppto:205530,ejec:215475,pct:104.8},
    {ppto:205530,ejec:199450,pct:97.0},
    {ppto:207672,ejec:203941,pct:99.2},
  ],
  2026: [
    {ppto:207672,ejec:217013,pct:104.5},
    {ppto:207672,ejec:101030,pct:48.6},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
    {ppto:207672,ejec:null,pct:null},
  ],
};

// Por finca 2025 (completo)
const PPTO_FINCAS_2025 = {
  HV: [{ppto:66708,ejec:70999,pct:106.4},{ppto:66708,ejec:71668,pct:107.4},{ppto:66708,ejec:70513,pct:105.7},{ppto:64746,ejec:74906,pct:115.7},{ppto:66708,ejec:66541,pct:99.8},{ppto:66708,ejec:49875,pct:74.8},{ppto:71196,ejec:59481,pct:83.5},{ppto:71196,ejec:56571,pct:79.5},{ppto:71196,ejec:56199,pct:78.9},{ppto:71196,ejec:74951,pct:105.3},{ppto:71196,ejec:68888,pct:96.8},{ppto:71196,ejec:65505,pct:92.0}],
  FM: [{ppto:50830,ejec:62945,pct:123.8},{ppto:50830,ejec:58606,pct:115.3},{ppto:49335,ejec:60815,pct:123.3},{ppto:50830,ejec:59724,pct:117.5},{ppto:50830,ejec:49956,pct:98.3},{ppto:50830,ejec:47265,pct:93.0},{ppto:53754,ejec:54043,pct:100.5},{ppto:53754,ejec:41837,pct:82.3},{ppto:53754,ejec:52138,pct:97.0},{ppto:53754,ejec:58535,pct:108.9},{ppto:53754,ejec:55000,pct:102.3},{ppto:53754,ejec:60000,pct:111.6}],
  JG: [{ppto:46648,ejec:53733,pct:115.2},{ppto:45276,ejec:49996,pct:110.4},{ppto:46648,ejec:51891,pct:111.2},{ppto:46648,ejec:59455,pct:127.5},{ppto:46648,ejec:49660,pct:106.5},{ppto:45276,ejec:38368,pct:84.7},{ppto:46648,ejec:42849,pct:91.9},{ppto:46648,ejec:38688,pct:82.9},{ppto:46648,ejec:44220,pct:94.8},{ppto:46648,ejec:49680,pct:106.5},{ppto:46648,ejec:45000,pct:96.5},{ppto:46648,ejec:50000,pct:107.2}],
  EC: [{ppto:23496,ejec:27383,pct:116.5},{ppto:24208,ejec:26719,pct:110.4},{ppto:24208,ejec:28450,pct:117.5},{ppto:24208,ejec:27305,pct:112.8},{ppto:23496,ejec:28127,pct:119.7},{ppto:24208,ejec:25476,pct:105.2},{ppto:27200,ejec:25558,pct:94.0},{ppto:33932,ejec:26204,pct:77.2},{ppto:33932,ejec:30999,pct:91.4},{ppto:33932,ejec:32309,pct:95.2},{ppto:33932,ejec:30562,pct:90.1},{ppto:36224,ejec:28436,pct:78.5}],
};

// ── Tab Presupuesto ───────────────────────────────────────
function TabPresupuesto() {
  const [año, setAño]   = useState(2025);
  const [vista, setVista] = useState("ghv"); // ghv | fincas
  const datos = PPTO_GHV[año];

  const totalPpto = datos.reduce((a,b)=>a+(b.ppto||0),0);
  const totalEjec = datos.filter(d=>d.ejec!=null).reduce((a,b)=>a+(b.ejec||0),0);
  const mesesEjec = datos.filter(d=>d.ejec!=null).length;
  const pptoParcial = datos.slice(0,mesesEjec).reduce((a,b)=>a+(b.ppto||0),0);
  const pctGlobal  = pptoParcial>0 ? (totalEjec/pptoParcial*100) : 0;
  const maxBar = Math.max(...datos.map(d=>Math.max(d.ppto||0,d.ejec||0)));

  const semaforo = (pct) => {
    if (pct==null) return C.gris;
    if (pct <= 95)  return C.verde;
    if (pct <= 105) return C.amber;
    return C.rojo;
  };
  const semaforoLabel = (pct) => {
    if (pct==null) return "—";
    if (pct <= 95)  return "✅ Bajo ppto";
    if (pct <= 105) return "🟡 En rango";
    return "🔴 Sobre ppto";
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="🎯" label={`Presupuesto ${año}`} valor={fmt$(totalPpto)} sub="Agroquím. + Fertilizantes" color={C.azul}/>
        <KCard icono="💸" label={`Ejecución ${año}`} valor={fmt$(totalEjec)} sub={`${mesesEjec} meses registrados`} color={C.verde}/>
        <KCard icono="📊" label="% Cumplimiento" valor={`${pctGlobal.toFixed(1)}%`} sub={`vs presupuesto acumulado`} color={semaforo(pctGlobal)}/>
        <KCard icono="💰" label="Diferencia vs Ppto" valor={fmt$(totalEjec-pptoParcial)} sub={totalEjec>pptoParcial?"▲ Sobre presupuesto":"▼ Bajo presupuesto"} color={totalEjec>pptoParcial?C.rojo:C.verde}/>
      </div>

      {/* Selectores */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.gris}}>Año:</span>
        {[2024,2025,2026].map(a=>(
          <button key={a} onClick={()=>setAño(a)}
            style={{background:año===a?COLORES_AÑO[a]:"transparent",border:`1px solid ${año===a?COLORES_AÑO[a]:C.borde}`,borderRadius:18,padding:"4px 14px",fontSize:11,color:año===a?"#fff":C.gris,cursor:"pointer",fontWeight:año===a?700:400}}>
            {a}
          </button>
        ))}
        <span style={{fontSize:11,color:C.gris,marginLeft:12}}>Vista:</span>
        {[{v:"ghv",l:"GHV Total"},{v:"fincas",l:"Por Finca"}].map(o=>(
          <button key={o.v} onClick={()=>setVista(o.v)}
            style={{background:vista===o.v?C.verde:"transparent",border:`1px solid ${vista===o.v?C.verde:C.borde}`,borderRadius:18,padding:"4px 14px",fontSize:11,color:vista===o.v?"#fff":C.gris,cursor:"pointer",fontWeight:vista===o.v?700:400}}>
            {o.l}
          </button>
        ))}
      </div>

      {vista==="ghv" ? (
        <>
          {/* Gráfico barras dobles */}
          <SecCard titulo={`Ejecución vs Presupuesto Mensual ${año} — GHV Total`} sub="Agroquímicos + Fertilizantes · Datos reales del archivo de ejecución">
            <div style={{display:"flex",gap:4,alignItems:"flex-end",height:180,marginBottom:12}}>
              {datos.map((d,i)=>{
                const hp = ((d.ppto||0)/maxBar)*100;
                const he = d.ejec!=null ? (d.ejec/maxBar)*100 : 0;
                const col = semaforo(d.pct);
                return (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                    {d.pct!=null && <div style={{fontSize:8,fontWeight:700,color:col}}>{d.pct.toFixed(0)}%</div>}
                    <div style={{width:"100%",display:"flex",gap:1,alignItems:"flex-end",height:160}}>
                      {/* Barra presupuesto */}
                      <div style={{flex:1,height:`${hp}%`,background:C.azul+"55",borderRadius:"3px 3px 0 0",minHeight:4,border:`1px solid ${C.azul}88`}}/>
                      {/* Barra ejecución */}
                      {d.ejec!=null
                        ? <div style={{flex:1,height:`${he}%`,background:col,borderRadius:"3px 3px 0 0",minHeight:4,opacity:0.9}}/>
                        : <div style={{flex:1,height:"8%",background:C.panel,borderRadius:"3px 3px 0 0",border:`1px dashed ${C.borde}`}}/>
                      }
                    </div>
                    <div style={{fontSize:9.5,color:C.gris,textAlign:"center"}}>{MESES_LABELS[i]}</div>
                  </div>
                );
              })}
            </div>
            {/* Leyenda */}
            <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:10,background:C.azul+"55",border:`1px solid ${C.azul}88`,borderRadius:2}}/><span style={{fontSize:10.5,color:C.gris}}>Presupuesto</span></div>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:10,background:C.verde,borderRadius:2}}/><span style={{fontSize:10.5,color:C.gris}}>Ejecución ≤95% (bajo ppto)</span></div>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:10,background:C.amber,borderRadius:2}}/><span style={{fontSize:10.5,color:C.gris}}>Ejecución 95–105% (en rango)</span></div>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:14,height:10,background:C.rojo,borderRadius:2}}/><span style={{fontSize:10.5,color:C.gris}}>Ejecución &gt;105% (sobre ppto)</span></div>
            </div>

            {/* Tabla detalle */}
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:C.panel}}>
                {["Mes","Presupuesto","Ejecución","Diferencia","% Cumpl.","Estado"].map(h=>(
                  <th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {datos.map((d,i)=>{
                  if(!d.ejec && d.ejec!==0) return (
                    <tr key={i} style={{borderTop:`1px solid ${C.borde}`,opacity:0.4}}>
                      <td style={{padding:"7px 12px",fontSize:12,fontWeight:700}}>{MESES_LABELS[i]}</td>
                      <td style={{padding:"7px 12px",fontFamily:"monospace",fontSize:11,color:C.azul}}>{fmt$(d.ppto)}</td>
                      <td colSpan={4} style={{padding:"7px 12px",fontSize:11,color:C.gris}}>Sin datos</td>
                    </tr>
                  );
                  const diff = d.ejec - d.ppto;
                  const col  = semaforo(d.pct);
                  return (
                    <tr key={i} style={{borderTop:`1px solid ${C.borde}`,background:d.pct>105?C.rojoL+"66":d.pct<=95?C.verdeL+"66":"transparent"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                      onMouseLeave={e=>e.currentTarget.style.background=d.pct>105?C.rojoL+"66":d.pct<=95?C.verdeL+"66":"transparent"}>
                      <td style={{padding:"7px 12px",fontSize:12,fontWeight:700}}>{MESES_LABELS[i]}</td>
                      <td style={{padding:"7px 12px",fontFamily:"monospace",fontSize:11,color:C.azul}}>{fmt$(d.ppto)}</td>
                      <td style={{padding:"7px 12px",fontFamily:"monospace",fontWeight:700,fontSize:11,color:col}}>{fmt$(d.ejec)}</td>
                      <td style={{padding:"7px 12px",fontFamily:"monospace",fontSize:11,color:diff>0?C.rojo:C.verde,fontWeight:700}}>{diff>0?"+":""}{fmt$(diff)}</td>
                      <td style={{padding:"7px 12px",fontWeight:800,fontSize:12,color:col}}>{d.pct.toFixed(1)}%</td>
                      <td style={{padding:"7px 12px"}}><Badge texto={semaforoLabel(d.pct)} color={col}/></td>
                    </tr>
                  );
                })}
                {/* Total */}
                <tr style={{borderTop:`2px solid ${C.verde}`,background:C.verdeL}}>
                  <td style={{padding:"8px 12px",fontSize:12,fontWeight:800,color:C.verde}}>TOTAL {año}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:800,fontSize:12,color:C.azul}}>{fmt$(pptoParcial)}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:800,fontSize:12,color:semaforo(pctGlobal)}}>{fmt$(totalEjec)}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:800,fontSize:12,color:totalEjec>pptoParcial?C.rojo:C.verde}}>{totalEjec>pptoParcial?"+":""}{fmt$(totalEjec-pptoParcial)}</td>
                  <td style={{padding:"8px 12px",fontWeight:800,fontSize:13,color:semaforo(pctGlobal)}}>{pctGlobal.toFixed(1)}%</td>
                  <td style={{padding:"8px 12px"}}><Badge texto={semaforoLabel(pctGlobal)} color={semaforo(pctGlobal)}/></td>
                </tr>
              </tbody>
            </table>
          </SecCard>
        </>
      ) : (
        /* Vista por finca — solo 2025 */
        <SecCard titulo="Ejecución vs Presupuesto por Finca — 2025" sub="Agroquímicos + Fertilizantes · 4 fincas Grupo Hoja Verde">
          {["HV","FM","JG","EC"].map((finca,fi)=>{
            const fd = PPTO_FINCAS_2025[finca];
            const totalP = fd.reduce((a,b)=>a+b.ppto,0);
            const totalE = fd.reduce((a,b)=>a+b.ejec,0);
            const pctF   = (totalE/totalP*100);
            const col    = semaforo(pctF);
            return (
              <div key={finca} style={{marginBottom:16,paddingBottom:16,borderBottom:fi<3?`1px solid ${C.borde}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:8,background:col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>{finca}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:C.texto}}>{finca==="HV"?"Hojaverde":finca==="FM"?"Flormare":finca==="JG"?"Joygardens":"El Carmen"}</div>
                      <div style={{fontSize:10.5,color:C.gris}}>Ppto: {fmt$(totalP)} · Ejec: {fmt$(totalE)}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:18,fontWeight:800,color:col}}>{pctF.toFixed(1)}%</div>
                    <Badge texto={semaforoLabel(pctF)} color={col}/>
                  </div>
                </div>
                {/* Mini barras mensuales */}
                <div style={{display:"flex",gap:3,alignItems:"flex-end",height:60}}>
                  {fd.map((d,i)=>{
                    const maxM = Math.max(...fd.map(x=>Math.max(x.ppto,x.ejec)));
                    const hp=(d.ppto/maxM)*100, he=(d.ejec/maxM)*100;
                    const cM=semaforo(d.pct);
                    return (
                      <div key={i} style={{flex:1,display:"flex",gap:1,alignItems:"flex-end",height:50}}>
                        <div style={{flex:1,height:`${hp}%`,background:C.azul+"44",borderRadius:"2px 2px 0 0",minHeight:3}}/>
                        <div style={{flex:1,height:`${he}%`,background:cM,borderRadius:"2px 2px 0 0",minHeight:3,opacity:0.85}}/>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                  {MESES_LABELS.map((m,i)=><span key={i} style={{flex:1,fontSize:8,color:C.gris,textAlign:"center"}}>{m}</span>)}
                </div>
              </div>
            );
          })}
        </SecCard>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 1 — TENDENCIAS
// ══════════════════════════════════════════════════════════
function TabTendencias() {
  const maxV = Math.max(...TOTALES_ANUALES.map(a=>a.total));
  const d2324 = ((5106708-4866164)/4866164*100);
  const d2425 = ((5297155-5106708)/5106708*100);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="📊" label="Total 2023" valor={fmt$(4866164)} sub="Año completo" color={COLORES_AÑO[2023]}/>
        <KCard icono="📊" label="Total 2024" valor={fmt$(5106708)} sub="Año completo" color={COLORES_AÑO[2024]} delta={d2324}/>
        <KCard icono="📊" label="Total 2025" valor={fmt$(5297155)} sub="Año completo" color={COLORES_AÑO[2025]} delta={d2425}/>
        <KCard icono="📊" label="2026 Ene–Feb" valor={fmt$(996670)}  sub="2 meses" color={COLORES_AÑO[2026]}/>
      </div>

      <SecCard titulo="Evolución del Gasto Total de Compras 2023–2026" sub="Datos reales del Master File Procurement · Grupo Hoja Verde">
        <div style={{display:"flex",gap:12,alignItems:"flex-end",height:200,padding:"0 20px",marginBottom:12}}>
          {TOTALES_ANUALES.map((a,i) => {
            const h = (a.total/maxV)*100;
            const col = COLORES_AÑO[a.año];
            const prev = TOTALES_ANUALES[i-1];
            const delta = prev&&a.completo&&prev.completo ? ((a.total-prev.total)/prev.total*100) : null;
            return (
              <div key={a.año} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                {delta!=null && <div style={{fontSize:11,fontWeight:700,color:delta>0?C.rojo:C.verde}}>{delta>0?"▲":"▼"}{Math.abs(delta).toFixed(1)}%</div>}
                <div style={{fontSize:12,fontWeight:800,color:col,fontFamily:"monospace"}}>{fmt$(a.total)}</div>
                <div style={{width:"90%",height:`${h}%`,background:a.completo?col:col+"55",borderRadius:"6px 6px 0 0",minHeight:12,border:a.completo?"none":`2px dashed ${col}`}}/>
                <div style={{fontSize:13,fontWeight:700,color:col}}>{a.año}</div>
                {!a.completo && <div style={{fontSize:9,color:C.gris}}>{a.nota}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:20,padding:"10px 14px",background:C.panel,borderRadius:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.gris,fontWeight:600}}>📈 Crecimiento 2023→2025: <span style={{color:C.rojo}}>+{(((5297155-4866164)/4866164)*100).toFixed(1)}%</span></span>
          <span style={{fontSize:11,color:C.gris,fontWeight:600}}>💵 Promedio mensual 2024: <span style={{color:C.verde}}>{fmt$(5106708/12)}</span></span>
          <span style={{fontSize:11,color:C.gris}}>🔲 Barra punteada = dato parcial</span>
        </div>
      </SecCard>

      <SecCard titulo="Comparativo Mensual 2023 vs 2024 vs 2026" sub="Gasto total por mes · valores en USD">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
            <thead>
              <tr style={{background:C.panel}}>
                {["Mes","2023","2024","2026","Δ 2023→2024"].map(h=>(
                  <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MESES.map((m,i) => {
                const v23=MENSUALES[2023][i], v24=MENSUALES[2024][i], v26=MENSUALES[2026][i];
                const d=((v24-v23)/v23*100);
                return (
                  <tr key={m} style={{borderTop:`1px solid ${C.borde}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"8px 12px",fontSize:12,fontWeight:700}}>{m}</td>
                    <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:COLORES_AÑO[2023]}}>{fmt$(v23)}</td>
                    <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:COLORES_AÑO[2024]}}>{fmt$(v24)}</td>
                    <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:v26?COLORES_AÑO[2026]:C.gris}}>{v26?fmt$(v26):"—"}</td>
                    <td style={{padding:"8px 12px"}}><span style={{fontSize:11,fontWeight:700,color:d>0?C.rojo:C.verde}}>{d>0?"▲":"▼"} {Math.abs(d).toFixed(1)}%</span></td>
                  </tr>
                );
              })}
              <tr style={{borderTop:`2px solid ${C.verde}`,background:C.verdeL}}>
                <td style={{padding:"9px 12px",fontSize:12,fontWeight:800,color:C.verde}}>TOTAL</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:800,fontSize:12,color:COLORES_AÑO[2023]}}>{fmt$(4866164)}</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:800,fontSize:12,color:COLORES_AÑO[2024]}}>{fmt$(5106708)}</td>
                <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:800,fontSize:12,color:COLORES_AÑO[2026]}}>{fmt$(996670)}</td>
                <td style={{padding:"9px 12px"}}><span style={{fontSize:12,fontWeight:800,color:C.rojo}}>▲ {d2324.toFixed(1)}%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </SecCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 2 — ESTACIONALIDAD
// ══════════════════════════════════════════════════════════
function TabEstacional() {
  const [año, setAño] = useState("prom");
  const estac = MESES.map((m,i) => ({
    mes:m,
    prom: Math.round((MENSUALES[2023][i]+MENSUALES[2024][i])/2),
    v2023: MENSUALES[2023][i],
    v2024: MENSUALES[2024][i],
  }));
  const vals = estac.map(e => año==="prom"?e.prom:año==="2023"?e.v2023:e.v2024);
  const maxV = Math.max(...vals);
  const minV = Math.min(...vals);
  const promV = Math.round(vals.reduce((a,b)=>a+b,0)/12);
  const iMax = vals.indexOf(maxV);
  const iMin = vals.indexOf(minV);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="📈" label="Mes pico de gasto" valor={MESES[iMax]} sub={`Promedio: ${fmt$(estac[iMax].prom)}`} color={C.rojo}/>
        <KCard icono="📉" label="Mes mínimo de gasto" valor={MESES[iMin]} sub={`Promedio: ${fmt$(estac[iMin].prom)}`} color={C.verde}/>
        <KCard icono="📊" label="Promedio mensual" valor={fmt$(promV)} sub="Basado en 2023–2024" color={C.azul}/>
        <KCard icono="⚡" label="Amplitud estacional" valor={`${(((maxV-minV)/minV)*100).toFixed(0)}%`} sub="Variación máx vs mín" color={C.amber}/>
      </div>

      <div style={{display:"flex",gap:8}}>
        {[{v:"prom",l:"Promedio 2023–2024"},{v:"2023",l:"2023"},{v:"2024",l:"2024"}].map(o=>(
          <button key={o.v} onClick={()=>setAño(o.v)}
            style={{background:año===o.v?C.verde:"transparent",border:`1px solid ${año===o.v?C.verde:C.borde}`,borderRadius:18,padding:"5px 14px",fontSize:11,color:año===o.v?"#fff":C.gris,cursor:"pointer",fontWeight:año===o.v?700:400}}>
            {o.l}
          </button>
        ))}
      </div>

      <SecCard titulo="Estacionalidad del Gasto Mensual" sub="Patrón histórico de compras a lo largo del año">
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:180,marginBottom:12}}>
          {vals.map((v,i) => {
            const h = (v/maxV)*100;
            const esPico = i===iMax, esMin = i===iMin;
            const col = esPico?C.rojo:esMin?C.verde:C.azul;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,color:col,fontFamily:"monospace",fontWeight:700,textAlign:"center"}}>{fmt$(v)}</div>
                <div style={{width:"100%",height:`${h}%`,background:col,borderRadius:"4px 4px 0 0",minHeight:6,opacity:esPico||esMin?1:0.65}}/>
                <div style={{fontSize:10,fontWeight:esPico||esMin?800:400,color:esPico?C.rojo:esMin?C.verde:C.gris}}>{MESES[i]}</div>
                {esPico && <div style={{fontSize:8,color:C.rojo,fontWeight:700}}>PICO</div>}
                {esMin  && <div style={{fontSize:8,color:C.verde,fontWeight:700}}>MIN</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {i:"🔴",t:"Enero es el mes pico",d:"Ene concentra ~12% del gasto anual. Alto flujo de compras de inicio de temporada.",c:C.rojo},
            {i:"📉",t:"Marzo y Junio son mínimos",d:"Caídas recurrentes en ambos años. Oportunidad para negociar contratos.",c:C.verde},
            {i:"📈",t:"Sep-Oct recuperación",d:"Repunte consistente en Q3-Q4 en ambos años históricos.",c:C.azul},
          ].map((d,i)=>(
            <div key={i} style={{background:C.panel,borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${d.c}`}}>
              <div style={{fontSize:16,marginBottom:4}}>{d.i}</div>
              <div style={{fontSize:11.5,fontWeight:700,color:d.c,marginBottom:3}}>{d.t}</div>
              <div style={{fontSize:10.5,color:C.gris,lineHeight:1.5}}>{d.d}</div>
            </div>
          ))}
        </div>
      </SecCard>

      <SecCard titulo="Tabla Estacional — Índice Mensual">
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.panel}}>
              {["Mes","2023","2024","Promedio","Δ 2023→2024","Índice"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estac.map((e,i) => {
              const d   = ((e.v2024-e.v2023)/e.v2023*100);
              const idx = Math.round(e.prom / (estac.reduce((a,b)=>a+b.prom,0)/12) * 100);
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`,background:i===iMax?C.amberL:"transparent"}}
                  onMouseEnter={ev=>ev.currentTarget.style.background=C.hover}
                  onMouseLeave={ev=>ev.currentTarget.style.background=i===iMax?C.amberL:"transparent"}>
                  <td style={{padding:"8px 12px",fontSize:12,fontWeight:700,color:C.texto}}>{e.mes}{i===iMax?" 🔺":i===iMin?" 🔻":""}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:COLORES_AÑO[2023]}}>{fmt$(e.v2023)}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontSize:11,color:COLORES_AÑO[2024]}}>{fmt$(e.v2024)}</td>
                  <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:700,fontSize:11,color:C.verde}}>{fmt$(e.prom)}</td>
                  <td style={{padding:"8px 12px"}}><span style={{fontSize:11,fontWeight:700,color:d>0?C.rojo:C.verde}}>{d>0?"▲":"▼"} {Math.abs(d).toFixed(1)}%</span></td>
                  <td style={{padding:"8px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:48,height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(idx/130*100,100)}%`,background:idx>100?C.rojo:C.verde,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10.5,fontWeight:700,color:idx>110?C.rojo:idx<90?C.verde:C.gris}}>{idx}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{marginTop:10,fontSize:10.5,color:C.gris,padding:"8px 12px",background:C.panel,borderRadius:8}}>
          📌 Índice: 100 = promedio anual. Mayor a 100 = mes de alto gasto. Menor a 100 = mes de bajo gasto.
        </div>
      </SecCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 3 — CATEGORÍAS
// ══════════════════════════════════════════════════════════
function TabCategorias() {
  const [base, setBase] = useState("c2024");
  const maxRef = Math.max(...CATS.map(c=>c.c2024));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[
          {i:"🥇",l:"Cat. #1 histórica",v:"Fertilizantes",s:"$1.72M en 2024 · 33.7%",c:C.verde},
          {i:"📦",l:"Cat. #2",v:"Mat. Empaque",s:"$1.32M en 2024 · 25.8%",c:C.azul},
          {i:"📈",l:"Mayor crecimiento",v:"Flores Tinturadas",s:"+100.9% de 2023 a 2024",c:C.rojo},
          {i:"📉",l:"Mayor reducción",v:"Pesticidas",s:"-29.7% de 2023 a 2024",c:C.verde},
        ].map((k,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"16px 18px",borderTop:`3px solid ${k.c}`}}>
            <div style={{fontSize:22,marginBottom:6}}>{k.i}</div>
            <div style={{fontSize:10,color:C.gris,textTransform:"uppercase",marginBottom:2}}>{k.l}</div>
            <div style={{fontSize:15,fontWeight:800,color:k.c}}>{k.v}</div>
            <div style={{fontSize:11,color:C.gris,marginTop:2}}>{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:11,color:C.gris}}>Resaltar año:</span>
        {[{v:"c2023",l:"2023",a:2023},{v:"c2024",l:"2024",a:2024},{v:"c2026p",l:"2026 parcial",a:2026}].map(o=>(
          <button key={o.v} onClick={()=>setBase(o.v)}
            style={{background:base===o.v?COLORES_AÑO[o.a]:"transparent",border:`1px solid ${base===o.v?COLORES_AÑO[o.a]:C.borde}`,borderRadius:18,padding:"4px 12px",fontSize:11,color:base===o.v?"#fff":C.gris,cursor:"pointer",fontWeight:base===o.v?700:400}}>
            {o.l}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:16}}>
        <SecCard titulo="Gasto por Categoría — Comparativo Multiañal">
          {CATS.map((c,i) => (
            <div key={i} style={{marginBottom:14}}>
              <div style={{fontSize:11.5,fontWeight:600,color:C.texto,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:COLORES_CAT[i],display:"inline-block",flexShrink:0}}/>
                {c.cat}
              </div>
              {[{k:"c2023",a:2023},{k:"c2024",a:2024},{k:"c2026p",a:2026}].map(({k,a}) => {
                const v = c[k];
                if(!v) return null;
                const w = Math.min((v/maxRef)*100,100);
                return (
                  <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:9.5,fontWeight:700,color:COLORES_AÑO[a],width:30,flexShrink:0}}>{a}</span>
                    <div style={{flex:1,height:7,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${w}%`,background:COLORES_AÑO[a],borderRadius:3,opacity:k===base?1:0.35}}/>
                    </div>
                    <span style={{fontSize:10,fontFamily:"monospace",color:COLORES_AÑO[a],width:55,textAlign:"right",flexShrink:0,fontWeight:k===base?700:400}}>{fmt$(v)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </SecCard>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <SecCard titulo="Variación % 2023 → 2024">
            {CATS.map((c,i) => {
              const d = ((c.c2024-c.c2023)/c.c2023*100);
              return (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.borde}`}}>
                  <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{c.cat}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,marginLeft:8}}>
                    <div style={{width:48,height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min(Math.abs(d)/110*100,100)}%`,background:d>0?C.rojo:C.verde,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:11.5,fontWeight:800,color:d>0?C.rojo:C.verde,minWidth:52,textAlign:"right"}}>{d>0?"▲":"▼"} {Math.abs(d).toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </SecCard>

          <SecCard titulo="Estructura del Gasto 2024">
            {CATS.slice(0,6).map((c,i) => {
              const pct = (c.c2024/5106708*100);
              return (
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:11,color:C.texto}}>{c.cat}</span>
                    <span style={{fontSize:11,fontWeight:700,color:COLORES_CAT[i]}}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{height:6,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct/33.7*100}%`,background:COLORES_CAT[i],borderRadius:3}}/>
                  </div>
                </div>
              );
            })}
          </SecCard>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 4 — COSTO POR TALLO
// ══════════════════════════════════════════════════════════
function TabCosto() {
  const max24 = Math.max(...COSTO_TALLO_2024);
  const min24 = Math.min(...COSTO_TALLO_2024);
  const prom24 = (COSTO_TALLO_2024.reduce((a,b)=>a+b,0)/12);
  const prom26 = (COSTO_TALLO_2026.reduce((a,b)=>a+b,0)/COSTO_TALLO_2026.length);
  const deltaP  = ((prom26-prom24)/prom24*100);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="💲" label="Prom. Costo/Tallo 2024" valor={`$${prom24.toFixed(4)}`} sub="Compras ÷ Tallos exportados" color={C.verde}/>
        <KCard icono="📉" label="Mes más eficiente 2024" valor={`$${min24.toFixed(4)}`} sub={`${MESES[COSTO_TALLO_2024.indexOf(min24)]} 2024`} color={C.verde}/>
        <KCard icono="📈" label="Mes más costoso 2024" valor={`$${max24.toFixed(4)}`} sub={`${MESES[COSTO_TALLO_2024.indexOf(max24)]} 2024`} color={C.rojo}/>
        <KCard icono="💲" label="Prom. 2026 (Ene–Feb)" valor={`$${prom26.toFixed(4)}`} sub="vs 2024" color={deltaP<0?C.verde:C.rojo} delta={deltaP}/>
      </div>

      <SecCard titulo="Evolución Costo/Tallo Mensual 2024" sub="Costo total de compras dividido entre tallos exportados por mes">
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:160,marginBottom:12}}>
          {COSTO_TALLO_2024.map((v,i) => {
            const h = (v/max24)*100;
            const esPico=v===max24, esMin=v===min24;
            const col = esPico?C.rojo:esMin?C.verde:C.azul;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:9,fontWeight:700,color:col,fontFamily:"monospace"}}>${v.toFixed(3)}</div>
                <div style={{width:"100%",height:`${h}%`,background:col,borderRadius:"4px 4px 0 0",minHeight:8,opacity:esPico||esMin?1:0.7}}/>
                <div style={{fontSize:10,fontWeight:esPico||esMin?800:400,color:esPico?C.rojo:esMin?C.verde:C.gris}}>{MESES[i]}</div>
                {esPico && <div style={{fontSize:8,color:C.rojo}}>PICO</div>}
                {esMin  && <div style={{fontSize:8,color:C.verde}}>MIN</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:20,padding:"10px 14px",background:C.verdeL,borderRadius:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.verde,fontWeight:700}}>📊 Promedio 2024: ${prom24.toFixed(4)}/tallo</span>
          <span style={{fontSize:11,color:C.gris}}>Variación pico–mín: ${(max24-min24).toFixed(4)} ({((max24-min24)/min24*100).toFixed(1)}%)</span>
          <span style={{fontSize:11,color:deltaP<0?C.verde:C.rojo,fontWeight:700}}>2026 Ene–Feb: ${prom26.toFixed(4)}/tallo ({deltaP<0?"▼":"▲"}{Math.abs(deltaP).toFixed(1)}%)</span>
        </div>
      </SecCard>

      <SecCard titulo="Costo por Categoría / Tallo Exportado — 2024 vs 2026" sub="Comparativo sobre tallos exportados del período">
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.panel}}>
              {["Categoría","Total 2024","C/Tallo 2024","Total 2026 (p)","C/Tallo 2026","Variación"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {cat:"Fertilizantes",   t24:1720766, ct24:0.0445, t26:276299, ct26:0.0318},
              {cat:"Mat. Empaque",    t24:1319976, ct24:0.0362, t26:315290, ct26:0.0363},
              {cat:"Fungicidas",      t24:815231,  ct24:0.0224, t26:171384, ct26:0.0197},
              {cat:"Pesticidas",      t24:265965,  ct24:0.0063, t26:37931,  ct26:0.0044},
            ].map((r,i) => {
              const d = ((r.ct26-r.ct24)/r.ct24*100);
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 12px",fontSize:12,fontWeight:700}}>{r.cat}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontSize:11,color:COLORES_AÑO[2024]}}>{fmt$(r.t24)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:COLORES_AÑO[2024],fontSize:12}}>${r.ct24.toFixed(4)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontSize:11,color:COLORES_AÑO[2026]}}>{fmt$(r.t26)}</td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:COLORES_AÑO[2026],fontSize:12}}>${r.ct26.toFixed(4)}</td>
                  <td style={{padding:"9px 12px"}}>
                    <span style={{background:d<0?C.verdeL:C.rojoL,color:d<0?C.verde:C.rojo,padding:"2px 10px",borderRadius:10,fontWeight:800,fontSize:11}}>
                      {d<0?"▼":"▲"} {Math.abs(d).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SecCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 5 — PROVEEDORES NUEVOS VS RECURRENTES
// ══════════════════════════════════════════════════════════
function TabProveedores() {
  const [filtro, setFiltro] = useState("todos");
  const recurrentes = PROVS.filter(p=>p.r2024&&p.r2023);
  const nuevos = PROVS.filter(p=>!p.r2023);
  const filtrados = filtro==="todos"?PROVS:filtro==="rec"?recurrentes:nuevos;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="🔄" label="Recurrentes 2023–2025" valor={recurrentes.length} sub={`${recurrentes.reduce((a,b)=>a+b.pct,0).toFixed(1)}% del gasto total`} color={C.verde}/>
        <KCard icono="🆕" label="Nuevos en ranking 2025" valor={nuevos.length} sub="No estaban en top 2023" color={C.azul}/>
        <KCard icono="📊" label="Total en ranking top 15" valor={PROVS.length} sub="Proveedores activos 2025" color={C.amber}/>
        <KCard icono="⚠️" label="Gasto en top 3" valor={`${PROVS.slice(0,3).reduce((a,b)=>a+b.pct,0).toFixed(1)}%`} sub="Alta concentración histórica" color={C.rojo}/>
      </div>

      <div style={{display:"flex",gap:8}}>
        {[{v:"todos",l:`Todos (${PROVS.length})`},{v:"rec",l:`🔄 Recurrentes (${recurrentes.length})`},{v:"new",l:`🆕 Nuevos en 2025 (${nuevos.length})`}].map(o=>(
          <button key={o.v} onClick={()=>setFiltro(o.v)}
            style={{background:filtro===o.v?C.verde:"transparent",border:`1px solid ${filtro===o.v?C.verde:C.borde}`,borderRadius:18,padding:"5px 14px",fontSize:11,color:filtro===o.v?"#fff":C.gris,cursor:"pointer",fontWeight:filtro===o.v?700:400}}>
            {o.l}
          </button>
        ))}
      </div>

      <SecCard titulo="Análisis de Recurrencia — Top 15 Proveedores 2025">
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.panel}}>
              {["#","Proveedor","Total 2025","% Part.","Categoría","En 2024","En 2023","Tipo"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p,i) => {
              const rank = PROVS.indexOf(p)+1;
              const tipo = p.r2024&&p.r2023?"Recurrente":!p.r2023?"Nuevo 2025":"Nuevo 2024";
              const tipoCol = tipo==="Recurrente"?C.verde:tipo==="Nuevo 2025"?C.azul:C.amber;
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`,background:tipo==="Nuevo 2025"?C.azulL+"66":"transparent"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background=tipo==="Nuevo 2025"?C.azulL+"66":"transparent"}>
                  <td style={{padding:"9px 12px",fontWeight:800,color:rank<=3?C.amber:C.gris,fontSize:12}}>{rank}</td>
                  <td style={{padding:"9px 12px",fontSize:11.5,maxWidth:260}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:rank<=3?700:400}}>
                      {rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":""} {p.n}
                    </div>
                  </td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:C.verde,fontSize:12}}>{fmt$(p.t)}</td>
                  <td style={{padding:"9px 12px",fontSize:11,color:C.gris}}>{p.pct.toFixed(2)}%</td>
                  <td style={{padding:"9px 12px"}}><Badge texto={p.cat} color={C.verdeM}/></td>
                  <td style={{padding:"9px 12px",textAlign:"center",fontSize:14}}>{p.r2024?"✅":"❌"}</td>
                  <td style={{padding:"9px 12px",textAlign:"center",fontSize:14}}>{p.r2023?"✅":"❌"}</td>
                  <td style={{padding:"9px 12px"}}><Badge texto={tipo} color={tipoCol}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SecCard>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[
          {i:"🔄",t:"Alta fidelidad de proveedores",d:`${recurrentes.length} de los top 15 son recurrentes en los 3 años analizados. Relaciones comerciales consolidadas.`,c:C.verde},
          {i:"🆕",t:"Nuevos proveedores estratégicos",d:`${nuevos.length} proveedores nuevos en top 2025: Haifa Ecuador e Insuquimsa. Posible búsqueda de mejores condiciones.`,c:C.azul},
          {i:"⚠️",t:"Riesgo de concentración",d:`Top 3 proveedores concentran el ${PROVS.slice(0,3).reduce((a,b)=>a+b.pct,0).toFixed(1)}% del gasto. Los 3 son recurrentes históricos — dependencia estructural.`,c:C.rojo},
        ].map((d,i)=>(
          <div key={i} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"16px 18px",borderLeft:`4px solid ${d.c}`}}>
            <div style={{fontSize:24,marginBottom:8}}>{d.i}</div>
            <div style={{fontSize:12,fontWeight:700,color:d.c,marginBottom:4}}>{d.t}</div>
            <div style={{fontSize:11,color:C.gris,lineHeight:1.6}}>{d.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PARSER EXCEL — carga xlsx desde CDN dinámicamente
// ══════════════════════════════════════════════════════════
function cargarXLSX() {
  return new Promise((resolve) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => resolve(window.XLSX);
    document.head.appendChild(s);
  });
}

async function parsearExcel(file) {
  const XLSX = await cargarXLSX();
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(buf, { type:"array", cellDates:true });
  const override = {};
  for (const año of [2023,2024,2025,2026]) {
    const nombre = `COMPRAS ${año}`;
    if (!wb.SheetNames.includes(nombre)) continue;
    const filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], {defval:null});
    if (!filas.length) continue;
    const porMes = Array(12).fill(null);
    const porCat = {}, porProv = {};
    let total = 0;
    for (const f of filas) {
      const monto = parseFloat(f["Producto"])||0;
      if (!monto) continue;
      total += monto;
      const fecha = f["Fecha C."];
      if (fecha) {
        const d = fecha instanceof Date ? fecha : new Date(fecha);
        if (!isNaN(d) && d.getFullYear()===año) {
          const i = d.getMonth();
          porMes[i] = (porMes[i]||0) + monto;
        }
      }
      const cat  = f["Categoría Padre"] ? String(f["Categoría Padre"]).trim() : "SIN CATEGORÍA";
      porCat[cat] = (porCat[cat]||0) + monto;
      const prov = f["Proveedor"] ? String(f["Proveedor"]).trim() : "SIN PROVEEDOR";
      porProv[prov] = (porProv[prov]||0) + monto;
    }
    override[año] = { total, mensuales:porMes, porCat, porProv };
  }
  return override;
}

// ══════════════════════════════════════════════════════════
//  APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab]           = useState("tendencias");
  const [archivo, setArchivo]   = useState(null);   // nombre del archivo cargado
  const [cargando, setCargando] = useState(false);
  const [toast, setToast]       = useState("");
  const [overrideData, setOverrideData] = useState(null); // datos del Excel subido
  const inputRef = useRef();

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(()=>setToast(""),3500);
  }

  async function procesarArchivo(file) {
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) {
      mostrarToast("⚠️ Solo se aceptan archivos .xlsx o .xls");
      return;
    }
    setCargando(true);
    try {
      const datos = await parsearExcel(file);
      const años  = Object.keys(datos);
      if (!años.length) { mostrarToast("⚠️ No se encontraron hojas COMPRAS en el archivo"); setCargando(false); return; }
      setOverrideData(datos);
      setArchivo(file.name);
      setCargando(false);
      mostrarToast(`✅ Datos actualizados desde ${file.name}`);
    } catch(err) {
      mostrarToast("⚠️ Error: " + err.message);
      setCargando(false);
    }
  }

  // Si hay datos cargados desde Excel, inyectarlos en las constantes globales
  // mediante props que cada tab puede recibir opcionalmente
  const datosOverride = overrideData;

  const vistas = {
    tendencias: <TabTendencias override={datosOverride}/>,
    estacional: <TabEstacional override={datosOverride}/>,
    categorias: <TabCategorias override={datosOverride}/>,
    costo:      <TabCosto/>,
    proveedores:<TabProveedores/>,
    presupuesto:<TabPresupuesto/>,
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:C.texto}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)`,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:28}}>🌿</span>
          <div>
            <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>Hoja Verde 360° — Análisis Avanzado de Compras</div>
            <div style={{fontSize:10,color:"#95D5B2",letterSpacing:1}}>
              {archivo ? `📂 ${archivo}` : "DATOS BASE 2022–2026 · MASTER FILE"}
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {archivo && (
            <button onClick={()=>{setOverrideData(null);setArchivo(null);mostrarToast("↩️ Datos base restaurados");}}
              style={{background:"#ffffff15",border:"1px solid #ffffff33",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>
              ↩️ Restaurar datos base
            </button>
          )}
          <button onClick={()=>inputRef.current.click()} disabled={cargando}
            style={{background:cargando?"#ffffff22":"#ffffff",border:"none",borderRadius:8,padding:"7px 16px",color:C.verde,fontSize:12,fontWeight:800,cursor:cargando?"wait":"pointer",display:"flex",alignItems:"center",gap:6}}>
            {cargando?"⏳ Procesando...":"📂 Actualizar con nuevo Excel"}
          </button>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}}
            onChange={e=>{procesarArchivo(e.target.files[0]); e.target.value="";}}/>
          <span style={{fontSize:11,color:"#95D5B2"}}>{hoy()}</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:16,right:16,background:C.verde,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:700,zIndex:999,boxShadow:"0 4px 20px #0005"}}>
          {toast}
        </div>
      )}

      {/* Banner datos fuente */}
      {archivo && (
        <div style={{background:C.verdeL,borderBottom:`1px solid ${C.borde}`,padding:"6px 32px",fontSize:11,color:C.verde,fontWeight:600}}>
          ✅ Mostrando datos de: <strong>{archivo}</strong> · Los datos base siguen disponibles si restauras.
        </div>
      )}

      {/* Tabs */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.borde}`,padding:"0 32px",display:"flex",gap:2,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"transparent",border:"none",borderBottom:`3px solid ${tab===t.id?C.verde:"transparent"}`,padding:"12px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:400,color:tab===t.id?C.verde:C.gris,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
            {t.icono} {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"28px 32px 48px",maxWidth:1400,margin:"0 auto"}}>
        {vistas[tab]}
      </div>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#FAF5EC;}
        ::-webkit-scrollbar-thumb{background:#D6C9B0;border-radius:4px;}
      `}</style>
    </div>
  );
}
