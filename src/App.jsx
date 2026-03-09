import { useState } from "react";

// ── PALETA ────────────────────────────────────────────────
const C = {
  bg:"#FAF5EC", panel:"#F0E8D8", card:"#FFFFFF", borde:"#D6C9B0",
  hover:"#F5EDD8", texto:"#1A2E0A", gris:"#7A8C6A",
  verde:"#2D5016", verdeM:"#4A7C3F", verdeL:"#E8F5E0",
  amber:"#C4781A", amberL:"#FFF3DC",
  rojo:"#C0392B",  rojoL:"#FDE8E8",
  azul:"#1A5276",  azulL:"#EAF2FB",
  morado:"#6C3483",moradoL:"#F5EEF8",
};

// ── DATOS REALES DEL MASTER FILE ─────────────────────────

// KPIs mensuales 2026
const KPIS_2026 = [
  { mes:"Ene",  compras:494864.60, exportado:2297452.53, tallos:4354855, precio:0.5276, costoTallo:0.1136, prodBruta:5112061 },
  { mes:"Feb",  compras:501492.94, exportado:2465284.06, tallos:4241496, precio:0.5812, costoTallo:0.1182, prodBruta:null },
];

const META_COSTO_TALLO = 0.0338;

// Categorías 2026
const CATS_2026 = [
  { cat:"Material de Empaque",         ene:177023.97, feb:138266.92 },
  { cat:"Abonos y Fertilizantes",      ene:121729.13, feb:154570.41 },
  { cat:"Fungicidas",                  ene: 82679.67, feb: 88705.03 },
  { cat:"Otros Insumos",               ene: 30614.72, feb: 23327.11 },
  { cat:"Mat. Flores Tinturadas",      ene: 24173.10, feb: 19219.12 },
  { cat:"Pesticidas e Insecticidas",   ene: 16620.68, feb: 21310.45 },
  { cat:"Repuestos y Accesorios",      ene: 17637.27, feb: 13719.60 },
  { cat:"Ropa e Implementos Seg.",     ene: 10191.97, feb: 11796.93 },
  { cat:"Material Biológico",          ene:  8500.24, feb:  7273.15 },
  { cat:"Plásticos Invernaderos",      ene:  1733.13, feb: 19992.31 },
  { cat:"Herramientas Agrícolas",      ene:  2329.22, feb:  1532.05 },
  { cat:"Suministros Oficina",         ene:  1502.25, feb:  1472.98 },
];

// Ranking proveedores 2025 (datos reales)
const RANKING_2025 = [
  { nombre:"Megastockec Distribuidora Agrícola S.A.",                    total:478605.61, pct:9.04,  cat:"EMPAQUE"        },
  { nombre:"Fito Sanitario Fitosan S.A.",                                total:345520.50, pct:6.52,  cat:"FERTILIZANTES"  },
  { nombre:"Papelera Nacional S.A.",                                     total:300262.89, pct:5.67,  cat:"EMPAQUE"        },
  { nombre:"Ecuaquimica Ecuatoriana De Productos Quimicos Ca",           total:267066.35, pct:5.04,  cat:"AGROQUÍMICOS"   },
  { nombre:"Alexis Mejía Representaciones Cía. Ltda.",                   total:253412.17, pct:4.78,  cat:"AGROQUÍMICOS"   },
  { nombre:"Proflower S.A.",                                             total:238176.54, pct:4.50,  cat:"FERTILIZANTES"  },
  { nombre:"Corporación Internacional de Cultivos Corpcultivos S.A.S.", total:214650.77, pct:4.05,  cat:"AGROQUÍMICOS"   },
  { nombre:"Fertilizantes Y Agroquímicos Europeos Eurofert S.A.",        total:188218.51, pct:3.55,  cat:"FERTILIZANTES"  },
  { nombre:"Haifa Ecuador S.A.",                                         total:164368.40, pct:3.10,  cat:"FERTILIZANTES"  },
  { nombre:"Vallejo Mosquera Enrique Francisco",                         total:160041.22, pct:3.02,  cat:"EMPAQUE"        },
  { nombre:"Amc Ecuador Cía. Ltda.",                                     total:152895.62, pct:2.89,  cat:"EMPAQUE"        },
  { nombre:"Insumos Químicos Santander Insuquimsa Cía. Ltda.",           total:147632.25, pct:2.79,  cat:"FERTILIZANTES"  },
  { nombre:"Agroimportadora Plastiseed S.A.",                            total:145618.93, pct:2.75,  cat:"PLÁSTICOS"      },
  { nombre:"Crait Cía. Ltda.",                                           total:133754.30, pct:2.53,  cat:"FERTILIZANTES"  },
  { nombre:"Almeida Davalos Diego Joel",                                 total:109840.06, pct:2.07,  cat:"TINTURADAS"     },
];

// Totales 2025 (calculado del ranking)
const TOTAL_2025 = 5297155.0;

// Proveedores Enero 2026 (del CSV anterior)
const PROVS_ENE_2026 = [
  { nombre:"Megastockec Distribuidora Agrícola S.A.",  monto:59785.83 },
  { nombre:"Papelera Nacional S.A.",                   monto:39816.00 },
  { nombre:"Fito Sanitario Fitosan S.A.",              monto:33647.00 },
  { nombre:"Vallejo Mosquera Enrique Francisco",       monto:24003.60 },
  { nombre:"Ecuaquimica Ecuatoriana",                  monto:22776.87 },
  { nombre:"Corpcultivos S.A.S.",                      monto:21707.66 },
  { nombre:"Paillacho Marmol Diego Fernando",          monto:16376.30 },
  { nombre:"Almeida Davalos Diego Joel",               monto:14667.95 },
  { nombre:"Crait Cía. Ltda.",                         monto:14381.54 },
  { nombre:"Eurofert S.A.",                            monto:14353.00 },
];

// ── HELPERS ──────────────────────────────────────────────
const fmt$ = v => v>=1e6?`$${(v/1e6).toFixed(3)}M`:v>=1e3?`$${(v/1e3).toFixed(1)}K`:`$${Number(v).toLocaleString("es-EC",{minimumFractionDigits:2})}`;
const fmtN = v => Number(v).toLocaleString("es-EC");
const pctFmt = v => `${(v*100).toFixed(2)}%`;
const hoy = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});

const CAT_COLORES = {
  "EMPAQUE":C.azul, "FERTILIZANTES":C.verde, "AGROQUÍMICOS":C.verdeM,
  "PLÁSTICOS":C.amber, "TINTURADAS":"#EC4899", "default":C.gris
};
const catColor = c => CAT_COLORES[c] || CAT_COLORES.default;

// ── COMPONENTES ──────────────────────────────────────────
function KCard({icono,label,valor,sub,color,ok,meta}) {
  const col = color || C.verde;
  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px 20px",borderTop:`3px solid ${col}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:24}}>{icono}</span>
        {ok!==undefined && <span style={{fontSize:20}}>{ok?"🟢":"🔴"}</span>}
      </div>
      <div style={{fontSize:26,fontWeight:800,color:C.texto,fontFamily:"monospace",lineHeight:1}}>{valor}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.texto,marginTop:6}}>{label}</div>
      {sub  && <div style={{fontSize:10.5,color:C.gris,marginTop:3}}>{sub}</div>}
      {meta && <div style={{fontSize:10,color:col,fontWeight:600,marginTop:3}}>Meta: {meta}</div>}
    </div>
  );
}

function BarraH({label,valor,max,color,sufijo,pct,rank}) {
  const col = color || C.verde;
  const w   = pct!=null ? pct : Math.min((valor/max)*100,100);
  return (
    <div style={{marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
          {rank && <span style={{fontSize:10,fontWeight:800,color:rank<=3?C.amber:C.gris,width:16,flexShrink:0}}>#{rank}</span>}
          <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
        </div>
        <span style={{fontSize:11,fontWeight:700,color:col,fontFamily:"monospace",flexShrink:0}}>{typeof valor==="number"?valor.toLocaleString("es-EC"):valor}{sufijo||""}</span>
      </div>
      <div style={{height:7,background:C.panel,borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${w}%`,background:col,borderRadius:4}}/>
      </div>
    </div>
  );
}

function SecCard({titulo,children,extra,sub}) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:14,padding:"20px 22px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:sub?6:16}}>
        <div>
          <h3 style={{color:C.texto,fontSize:13,fontWeight:700,margin:0}}>{titulo}</h3>
          {sub && <p style={{color:C.gris,fontSize:10.5,margin:"2px 0 14px"}}>{sub}</p>}
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

function Badge({texto,color}) {
  const col = color || C.gris;
  return <span style={{background:col+"18",color:col,border:`1px solid ${col}33`,fontSize:9.5,padding:"2px 8px",borderRadius:10,fontWeight:700,whiteSpace:"nowrap"}}>{texto}</span>;
}

// ── TABS ─────────────────────────────────────────────────
const TABS = [
  {id:"resumen",   label:"Resumen Ejecutivo", icono:"📊"},
  {id:"gasto",     label:"Gasto & Evolución",  icono:"💵"},
  {id:"proveedores",label:"Proveedores",       icono:"🏭"},
  {id:"categorias",label:"Categorías",         icono:"📦"},
  {id:"kpis",      label:"KPIs Compras",       icono:"🎯"},
];

// ══════════════════════════════════════════════════════════
//  TAB 1 — RESUMEN EJECUTIVO
// ══════════════════════════════════════════════════════════
function TabResumen() {
  const ene = KPIS_2026[0];
  const feb = KPIS_2026[1];
  const deltaCompras = ((feb.compras - ene.compras) / ene.compras * 100).toFixed(1);
  const totalAcum = ene.compras + feb.compras;
  const top3pct = PROVS_ENE_2026.slice(0,3).reduce((a,b)=>a+b.monto,0) / ene.compras * 100;
  const top10pct = PROVS_ENE_2026.reduce((a,b)=>a+b.monto,0) / ene.compras * 100;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Banner */}
      <div style={{background:`linear-gradient(135deg, ${C.verde} 0%, ${C.verdeM} 100%)`,borderRadius:14,padding:"24px 28px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",opacity:0.8,marginBottom:4}}>Dashboard Ejecutivo</div>
          <h2 style={{fontSize:24,fontWeight:800,margin:"0 0 4px"}}>Procurement · Grupo Hoja Verde</h2>
          <p style={{fontSize:12,opacity:0.7,margin:0}}>Datos reales al {hoy()} · Enero–Febrero 2026</p>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,opacity:0.7}}>Gasto acumulado 2026</div>
          <div style={{fontSize:32,fontWeight:800,fontFamily:"monospace"}}>{fmt$(totalAcum)}</div>
          <div style={{fontSize:11,opacity:0.7,marginTop:2}}>2 meses registrados</div>
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="💵" label="Gasto Enero 2026"  valor={fmt$(ene.compras)} sub="Mes más reciente completo" color={C.verde}/>
        <KCard icono="📈" label="Gasto Febrero 2026" valor={fmt$(feb.compras)} sub={`${deltaCompras>0?"▲":"▼"} ${Math.abs(deltaCompras)}% vs Enero`} color={parseFloat(deltaCompras)<10?C.verde:C.amber}/>
        <KCard icono="⚠️" label="Concentración Top 3" valor={`${top3pct.toFixed(1)}%`} sub="Ene 2026 · Riesgo alto" color={top3pct>30?C.rojo:C.amber} ok={top3pct<25}/>
        <KCard icono="🏭" label="Total 2025 gestionado" valor={fmt$(TOTAL_2025)} sub={`${RANKING_2025.length}+ proveedores activos`} color={C.azul}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16}}>
        {/* Top proveedores enero */}
        <SecCard titulo="Top 10 Proveedores — Enero 2026" sub={`Total: ${fmt$(PROVS_ENE_2026.reduce((a,b)=>a+b.monto,0))} · Top 10 concentra ${top10pct.toFixed(1)}%`}>
          {PROVS_ENE_2026.map((p,i) => (
            <BarraH key={i} rank={i+1}
              label={p.nombre} valor={p.monto}
              max={PROVS_ENE_2026[0].monto}
              color={i===0?C.amber:i<3?C.verdeM:C.verde}
              sufijo=" USD"/>
          ))}
        </SecCard>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Costo por tallo */}
          <SecCard titulo="Costo Compras / Tallo Exportado">
            {KPIS_2026.map((k,i) => {
              const ok = k.costoTallo <= META_COSTO_TALLO * 4; // referencia
              const col = C.verdeM;
              return (
                <div key={i} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:C.texto}}>{k.mes} 2026</span>
                    <span style={{fontSize:14,fontWeight:800,color:col,fontFamily:"monospace"}}>${k.costoTallo.toFixed(4)}/tallo</span>
                  </div>
                  <div style={{height:8,background:C.panel,borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(k.costoTallo/0.15*100,100)}%`,background:col,borderRadius:4}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:10,color:C.gris}}>Compras: {fmt$(k.compras)}</span>
                    <span style={{fontSize:10,color:C.gris}}>Tallos: {fmtN(k.tallos)}</span>
                  </div>
                </div>
              );
            })}
            <div style={{background:C.verdeL,borderRadius:8,padding:"8px 12px",fontSize:11,color:C.verde,fontWeight:600,marginTop:4}}>
              Meta costo/tallo exportado: ${META_COSTO_TALLO} (referencia interna)
            </div>
          </SecCard>

          {/* Insights clave */}
          <SecCard titulo="Puntos Clave">
            {[
              {i:"🏆",t:"Proveedor ancla",d:"Megastockec: $478K en 2025 (9% del gasto)",c:C.amber},
              {i:"📦",t:"Cat. más grande 2026",d:"Material de Empaque: $177K en Ene",c:C.azul},
              {i:"⬆️",t:"Gasto acumulado 2026",d:`${fmt$(totalAcum)} en 2 meses`,c:C.verde},
              {i:"💲",t:"Precio exportación Feb",d:`$${KPIS_2026[1].precio.toFixed(4)}/tallo (+10.2%)`,c:C.verdeM},
            ].map((d,i) => (
              <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i<3?`1px solid ${C.borde}`:"none"}}>
                <span style={{fontSize:18,flexShrink:0}}>{d.i}</span>
                <div>
                  <div style={{fontSize:11.5,fontWeight:700,color:d.c}}>{d.t}</div>
                  <div style={{fontSize:10.5,color:C.gris,marginTop:1}}>{d.d}</div>
                </div>
              </div>
            ))}
          </SecCard>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 2 — GASTO & EVOLUCIÓN
// ══════════════════════════════════════════════════════════
function TabGasto() {
  const maxCompras = Math.max(...KPIS_2026.map(k=>k.compras));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {KPIS_2026.map((k,i) => (
          <div key={i} style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px 20px",borderLeft:`4px solid ${C.verde}`}}>
            <div style={{fontSize:11,color:C.gris,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{k.mes} 2026</div>
            <div style={{fontSize:28,fontWeight:800,color:C.verde,fontFamily:"monospace"}}>{fmt$(k.compras)}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
              {[
                ["Tallos export.",fmtN(k.tallos)],
                ["Precio/tallo",`$${k.precio.toFixed(4)}`],
                ["Ventas",fmt$(k.exportado)],
                ["Costo/tallo",`$${k.costoTallo.toFixed(4)}`],
              ].map(([l,v]) => (
                <div key={l} style={{background:C.panel,borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:C.gris,textTransform:"uppercase"}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:C.texto,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px 20px",borderLeft:`4px solid ${C.amber}`}}>
          <div style={{fontSize:11,color:C.gris,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Acumulado 2026</div>
          <div style={{fontSize:28,fontWeight:800,color:C.amber,fontFamily:"monospace"}}>{fmt$(KPIS_2026.reduce((a,b)=>a+b.compras,0))}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
            {[
              ["Total tallos",fmtN(KPIS_2026.reduce((a,b)=>a+b.tallos,0))],
              ["Total ventas",fmt$(KPIS_2026.reduce((a,b)=>a+b.exportado,0))],
              ["Prom costo/t",`$${(KPIS_2026.reduce((a,b)=>a+b.costoTallo,0)/KPIS_2026.length).toFixed(4)}`],
              ["Meses registr.","2 de 12"],
            ].map(([l,v]) => (
              <div key={l} style={{background:C.panel,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:C.gris,textTransform:"uppercase"}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:C.texto,fontFamily:"monospace"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de barras comparativo */}
      <SecCard titulo="Comparativo Mensual — Gasto Total de Compras">
        <div style={{display:"flex",gap:12,alignItems:"flex-end",height:160,padding:"0 10px"}}>
          {KPIS_2026.map((k,i) => {
            const h = (k.compras / maxCompras) * 100;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{fontSize:11,fontWeight:700,color:C.verde,fontFamily:"monospace"}}>{fmt$(k.compras)}</div>
                <div style={{width:"100%",height:`${h}%`,background:C.verde,borderRadius:"6px 6px 0 0",minHeight:20,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:4}}>
                  <span style={{fontSize:9,color:"#fff",fontWeight:700}}>{((k.compras/maxCompras)*100).toFixed(0)}%</span>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:C.texto}}>{k.mes} 2026</div>
              </div>
            );
          })}
          {/* Proyección meses sin datos */}
          {["Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m,i) => (
            <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{fontSize:9,color:C.gris}}>—</div>
              <div style={{width:"100%",height:"15%",background:C.panel,borderRadius:"6px 6px 0 0",border:`1px dashed ${C.borde}`}}/>
              <div style={{fontSize:11,color:C.gris}}>{m}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16,marginTop:12,padding:"10px 14px",background:C.panel,borderRadius:8}}>
          <span style={{fontSize:11,color:C.gris}}>📌 Los meses en blanco serán completados conforme se registren compras.</span>
        </div>
      </SecCard>

      {/* Relación compras vs ventas */}
      <SecCard titulo="Relación Compras vs Exportaciones">
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.panel}}>
              {["Mes","Total Compras","Total Exportado","Ratio C/E","Tallos Export.","Precio/Tallo","Costo/Tallo"].map(h=>(
                <th key={h} style={{padding:"8px 14px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KPIS_2026.map((k,i) => {
              const ratio = (k.compras/k.exportado*100).toFixed(1);
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"10px 14px",fontWeight:700,color:C.verde,fontSize:12}}>{k.mes} 2026</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",fontWeight:700,color:C.texto,fontSize:12}}>{fmt$(k.compras)}</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",color:C.azul,fontSize:12}}>{fmt$(k.exportado)}</td>
                  <td style={{padding:"10px 14px",fontSize:12}}>
                    <span style={{background:parseFloat(ratio)<25?C.verdeL:C.amberL,color:parseFloat(ratio)<25?C.verde:C.amber,padding:"2px 10px",borderRadius:10,fontWeight:700,fontSize:11}}>{ratio}%</span>
                  </td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",color:C.gris,fontSize:12}}>{fmtN(k.tallos)}</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",fontWeight:700,color:C.verdeM,fontSize:12}}>${k.precio.toFixed(4)}</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",fontWeight:700,color:C.verde,fontSize:12}}>${k.costoTallo.toFixed(4)}</td>
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
//  TAB 3 — PROVEEDORES
// ══════════════════════════════════════════════════════════
function TabProveedores() {
  const [busqueda, setBusqueda] = useState("");
  const [catFiltro, setCatFiltro] = useState("Todas");
  const cats = ["Todas", ...new Set(RANKING_2025.map(p=>p.cat))];
  const filtrados = RANKING_2025.filter(p =>
    (catFiltro==="Todas" || p.cat===catFiltro) &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const top3total = RANKING_2025.slice(0,3).reduce((a,b)=>a+b.total,0);
  const top5total = RANKING_2025.slice(0,5).reduce((a,b)=>a+b.total,0);
  const top10total = RANKING_2025.slice(0,10).reduce((a,b)=>a+b.total,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="🏭" label="Proveedores Ranking 2025" valor={`${RANKING_2025.length}+`} sub="Proveedores activos" color={C.verde}/>
        <KCard icono="⚠️" label="Concentración Top 3" valor={`${(top3total/TOTAL_2025*100).toFixed(1)}%`} sub={fmt$(top3total)} color={C.rojo} ok={false}/>
        <KCard icono="📊" label="Concentración Top 5" valor={`${(top5total/TOTAL_2025*100).toFixed(1)}%`} sub={fmt$(top5total)} color={C.amber}/>
        <KCard icono="✅" label="Concentración Top 10" valor={`${(top10total/TOTAL_2025*100).toFixed(1)}%`} sub={fmt$(top10total)} color={C.azul}/>
      </div>

      {/* Pareto */}
      <SecCard titulo="Análisis de Pareto — Top 10 Proveedores 2025" sub="Curva de concentración de gasto">
        {RANKING_2025.slice(0,10).map((p,i) => {
          const cumPct = RANKING_2025.slice(0,i+1).reduce((a,b)=>a+b.pct,0);
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{width:20,fontSize:10.5,fontWeight:800,color:i<3?C.amber:C.gris,flexShrink:0,textAlign:"right"}}>#{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8}}>
                  <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:i<3?700:400}}>{p.nombre}</span>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <Badge texto={p.cat} color={catColor(p.cat)}/>
                    <span style={{fontSize:11,fontWeight:700,color:C.verde,fontFamily:"monospace"}}>{fmt$(p.total)}</span>
                    <span style={{fontSize:10.5,color:C.gris,minWidth:38}}>{p.pct.toFixed(2)}%</span>
                  </div>
                </div>
                <div style={{height:6,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${p.pct/9.04*100}%`,background:i===0?C.amber:i<3?C.verdeM:C.verde,borderRadius:3}}/>
                </div>
              </div>
              <span style={{fontSize:10,color:cumPct>80?C.rojo:cumPct>60?C.amber:C.verde,fontWeight:700,minWidth:40,flexShrink:0}}>↑{cumPct.toFixed(0)}%</span>
            </div>
          );
        })}
        <div style={{marginTop:12,padding:"10px 14px",background:C.rojoL,borderRadius:8,border:`1px solid ${C.rojo}33`}}>
          <span style={{fontSize:11,color:C.rojo,fontWeight:700}}>⚠️ Alerta: </span>
          <span style={{fontSize:11,color:C.texto}}>Los primeros 3 proveedores concentran el {(top3total/TOTAL_2025*100).toFixed(1)}% del gasto total 2025. Se recomienda diversificar.</span>
        </div>
      </SecCard>

      {/* Tabla completa */}
      <SecCard titulo="Ranking Completo de Proveedores — 2025"
        extra={
          <div style={{display:"flex",gap:8}}>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="🔍 Buscar..."
              style={{background:C.panel,border:`1px solid ${C.borde}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.texto,outline:"none",width:180}}/>
            <select value={catFiltro} onChange={e=>setCatFiltro(e.target.value)}
              style={{background:C.panel,border:`1px solid ${C.borde}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.texto,outline:"none"}}>
              {cats.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        }>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.panel}}>
              {["#","Proveedor","Total 2025","% Participación","Categoría","Riesgo"].map(h=>(
                <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p,i) => {
              const rank = RANKING_2025.indexOf(p) + 1;
              const riesgo = rank<=3?"Crítico":rank<=5?"Alto":rank<=10?"Medio":"Bajo";
              const riesgoCol = rank<=3?C.rojo:rank<=5?C.amber:rank<=10?C.verdeM:C.gris;
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 12px",fontWeight:800,color:rank<=3?C.amber:C.gris,fontSize:12}}>{rank}</td>
                  <td style={{padding:"9px 12px",fontSize:11.5,fontWeight:rank<=3?700:400,color:C.texto,maxWidth:280}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {rank===1&&"🥇 "}{rank===2&&"🥈 "}{rank===3&&"🥉 "}{p.nombre}
                    </div>
                  </td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:C.verde,fontSize:12}}>{fmt$(p.total)}</td>
                  <td style={{padding:"9px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:60,height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${p.pct/9.04*100}%`,background:rank<=3?C.amber:C.verde,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:11,color:C.gris,fontFamily:"monospace"}}>{p.pct.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 12px"}}><Badge texto={p.cat} color={catColor(p.cat)}/></td>
                  <td style={{padding:"9px 12px"}}><Badge texto={riesgo} color={riesgoCol}/></td>
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
//  TAB 4 — CATEGORÍAS
// ══════════════════════════════════════════════════════════
function TabCategorias() {
  const [mes, setMes] = useState("ene");
  const datos = CATS_2026.map(c => ({...c, actual: mes==="ene"?c.ene:c.feb})).sort((a,b)=>b.actual-a.actual);
  const total = datos.reduce((a,b)=>a+b.actual,0);
  const maxV  = datos[0].actual;

  const CAT_ICONO = {
    "Material de Empaque":"📦","Abonos y Fertilizantes":"🌱","Fungicidas":"🔬",
    "Otros Insumos":"🔧","Mat. Flores Tinturadas":"🎨","Pesticidas e Insecticidas":"🧪",
    "Repuestos y Accesorios":"⚙️","Ropa e Implementos Seg.":"🦺","Material Biológico":"🧬",
    "Plásticos Invernaderos":"🏠","Herramientas Agrícolas":"🔨","Suministros Oficina":"📎",
  };
  const CAT_COLOR = [C.azul,C.verde,C.verdeM,C.amber,C.morado,C.rojo,C.azul,C.gris,C.verdeM,C.amber,C.verde,C.gris];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",gap:8}}>
        {["ene","feb"].map(m => (
          <button key={m} onClick={()=>setMes(m)}
            style={{background:mes===m?C.verde:"transparent",border:`1px solid ${mes===m?C.verde:C.borde}`,borderRadius:18,padding:"5px 16px",fontSize:12,color:mes===m?"#fff":C.gris,cursor:"pointer",fontWeight:mes===m?700:400}}>
            {m==="ene"?"Enero 2026":"Febrero 2026"}
          </button>
        ))}
        <div style={{marginLeft:"auto",background:C.verdeL,borderRadius:8,padding:"5px 14px",fontSize:12,color:C.verde,fontWeight:700}}>
          Total: {fmt$(total)}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:16}}>
        <SecCard titulo={`Gasto por Categoría — ${mes==="ene"?"Enero":"Febrero"} 2026`}>
          {datos.map((c,i) => (
            <div key={i} style={{marginBottom:11}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,gap:8}}>
                <span style={{fontSize:12,color:C.texto,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:CAT_COLOR[i],display:"inline-block",flexShrink:0}}/>
                  <span>{CAT_ICONO[c.cat]||"📋"} {c.cat}</span>
                </span>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <span style={{fontSize:11.5,fontWeight:700,color:CAT_COLOR[i],fontFamily:"monospace"}}>{fmt$(c.actual)}</span>
                  <span style={{fontSize:11,color:C.gris}}>{(c.actual/total*100).toFixed(1)}%</span>
                </div>
              </div>
              <div style={{height:7,background:C.panel,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(c.actual/maxV)*100}%`,background:CAT_COLOR[i],borderRadius:4}}/>
              </div>
            </div>
          ))}
        </SecCard>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Comparativo ene vs feb */}
          <SecCard titulo="Variación Enero vs Febrero">
            {CATS_2026.map((c,i) => {
              const delta = ((c.feb - c.ene) / c.ene * 100);
              const col   = delta > 0 ? C.rojo : C.verde;
              if (Math.abs(delta) < 1) return null;
              return (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.borde}`}}>
                  <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{CAT_ICONO[c.cat]||"📋"} {c.cat}</span>
                  <span style={{fontSize:11.5,fontWeight:700,color:col,marginLeft:8,flexShrink:0}}>{delta>0?"▲":"▼"} {Math.abs(delta).toFixed(1)}%</span>
                </div>
              );
            }).filter(Boolean)}
          </SecCard>

          {/* Top 3 categorías */}
          <SecCard titulo="Top 3 Categorías">
            {datos.slice(0,3).map((c,i) => (
              <div key={i} style={{background:i===0?C.azulL:i===1?C.verdeL:C.amberL,borderRadius:10,padding:"12px 14px",marginBottom:8,border:`1px solid ${CAT_COLOR[i]}33`}}>
                <div style={{fontSize:18,marginBottom:4}}>{CAT_ICONO[c.cat]}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.texto}}>{c.cat}</div>
                <div style={{fontSize:18,fontWeight:800,color:CAT_COLOR[i],fontFamily:"monospace"}}>{fmt$(c.actual)}</div>
                <div style={{fontSize:10,color:C.gris,marginTop:2}}>{(c.actual/total*100).toFixed(1)}% del gasto total</div>
              </div>
            ))}
          </SecCard>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TAB 5 — KPIs DE COMPRAS
// ══════════════════════════════════════════════════════════
function TabKPIs() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:C.amberL,border:`1px solid ${C.amber}44`,borderRadius:10,padding:"12px 16px",fontSize:12,color:C.texto}}>
        <span style={{fontWeight:700,color:C.amber}}>📌 Nota: </span>
        Estos KPIs están basados en datos reales del Master File. Los indicadores de % compras planificadas vs urgentes y contratos próximos a vencer requieren campos adicionales en el sistema fuente.
      </div>

      {/* KPIs con datos reales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[
          {i:"💵",l:"Gasto Total Ene 2026",v:fmt$(KPIS_2026[0].compras),s:"Mes base 2026",c:C.verde},
          {i:"💵",l:"Gasto Total Feb 2026",v:fmt$(KPIS_2026[1].compras),s:"+1.3% vs Enero",c:C.verde},
          {i:"📈",l:"Gasto Acumulado 2026",v:fmt$(KPIS_2026.reduce((a,b)=>a+b.compras,0)),s:"Ene–Feb 2026",c:C.azul},
          {i:"💲",l:"Costo/Tallo Ene",v:`$${KPIS_2026[0].costoTallo.toFixed(4)}`,s:"vs exportación",c:C.verdeM},
          {i:"💲",l:"Costo/Tallo Feb",v:`$${KPIS_2026[1].costoTallo.toFixed(4)}`,s:"+4.1% vs Enero",c:C.verdeM},
          {i:"🌹",l:"Tallos Export. Ene",v:fmtN(KPIS_2026[0].tallos),s:"Producción",c:C.verdeM},
        ].map((k,i) => <KCard key={i} icono={k.i} label={k.l} valor={k.v} sub={k.s} color={k.c}/>)}
      </div>

      {/* Costos por categoría / tallo */}
      <SecCard titulo="Costo por Categoría / Tallo Exportado" sub="Calculado sobre tallos exportados Ene 2026">
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:C.panel}}>
              {["Categoría","Costo Total","Costo/Tallo Ene","Costo/Tallo Feb","Variación"].map(h=>(
                <th key={h} style={{padding:"8px 14px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {cat:"Fertilizantes",ene:0.027953,feb:0.036442},
              {cat:"Fungicidas",    ene:0.018986,feb:0.020914},
              {cat:"Pesticidas",    ene:0.003817,feb:0.005024},
              {cat:"Empaque",       ene:0.040650,feb:0.032599},
            ].map((r,i) => {
              const delta = ((r.feb - r.ene) / r.ene * 100);
              const metaCat = META_COSTO_TALLO;
              const ok = r.ene <= metaCat * 2;
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"10px 14px",fontWeight:600,color:C.texto,fontSize:12}}>{r.cat}</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",color:C.verde,fontSize:12}}>
                    {i===0?fmt$(CATS_2026[1].ene):i===1?fmt$(CATS_2026[2].ene):i===2?fmt$(CATS_2026[7].ene):fmt$(CATS_2026[4].ene)}
                  </td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",fontWeight:700,color:C.verdeM,fontSize:12}}>${r.ene.toFixed(6)}</td>
                  <td style={{padding:"10px 14px",fontFamily:"monospace",fontWeight:700,color:C.verdeM,fontSize:12}}>${r.feb.toFixed(6)}</td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{background:delta>0?C.rojoL:C.verdeL,color:delta>0?C.rojo:C.verde,padding:"2px 10px",borderRadius:10,fontWeight:700,fontSize:11}}>
                      {delta>0?"▲":"▼"} {Math.abs(delta).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SecCard>

      {/* Próximos indicadores */}
      <SecCard titulo="🚧 KPIs Pendientes de Implementar">
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          {[
            {i:"⏰",t:"Contratos próx. a vencer (90 días)",d:"Requiere campo 'Fecha Vencimiento' en OC. Columna 'Fecha Venc' existe pero vacía en datos actuales.",c:C.amber},
            {i:"📋",t:"% Compras planificadas vs urgentes",d:"Requiere campo 'Tipo de Compra' (planificada/urgente) en el registro de OC.",c:C.amber},
            {i:"🚚",t:"OTD / OTIF Proveedores",d:"Requiere registro de fecha prometida vs fecha real de entrega por proveedor.",c:C.rojo},
            {i:"💰",t:"Ahorros generados (Savings)",d:"Requiere precio de referencia / precio negociado documentado por compra.",c:C.rojo},
          ].map((d,i) => (
            <div key={i} style={{background:C.panel,borderRadius:10,padding:"14px 16px",borderLeft:`4px solid ${d.c}`}}>
              <div style={{fontSize:20,marginBottom:6}}>{d.i}</div>
              <div style={{fontSize:12,fontWeight:700,color:C.texto,marginBottom:4}}>{d.t}</div>
              <div style={{fontSize:10.5,color:C.gris,lineHeight:1.5}}>{d.d}</div>
            </div>
          ))}
        </div>
      </SecCard>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("resumen");
  const vistas = {
    resumen:     <TabResumen/>,
    gasto:       <TabGasto/>,
    proveedores: <TabProveedores/>,
    categorias:  <TabCategorias/>,
    kpis:        <TabKPIs/>,
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:C.texto}}>
      {/* Header */}
      <div style={{background:C.verde,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:28}}>🌿</div>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Hoja Verde 360° — Compras</div>
            <div style={{fontSize:10,color:"#95D5B2",letterSpacing:1}}>DASHBOARD EJECUTIVO DE PROCUREMENT</div>
          </div>
        </div>
        <div style={{fontSize:11,color:"#95D5B2"}}>{hoy()}</div>
      </div>

      {/* Tabs */}
      <div style={{background:C.panel,borderBottom:`1px solid ${C.borde}`,padding:"0 32px",display:"flex",gap:4}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{background:"transparent",border:"none",borderBottom:`3px solid ${tab===t.id?C.verde:"transparent"}`,padding:"12px 16px",cursor:"pointer",fontSize:12.5,fontWeight:tab===t.id?700:400,color:tab===t.id?C.verde:C.gris,display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
            {t.icono} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:"28px 32px 48px",maxWidth:1400,margin:"0 auto"}}>
        {vistas[tab]}
      </div>

      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.borde};border-radius:4px;}
        select option{background:${C.panel};color:${C.texto};}
      `}</style>
    </div>
  );
}
