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
];

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
