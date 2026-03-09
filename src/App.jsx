import { useState, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";

const C = {
  bg:"#FAF5EC", panel:"#F0E8D8", card:"#FFFFFF", borde:"#D6C9B0",
  hover:"#F5EDD8", texto:"#1A2E0A", gris:"#7A8C6A",
  verde:"#2D5016", verdeM:"#4A7C3F", verdeL:"#E8F5E0",
  amber:"#C4781A", amberL:"#FFF3DC",
  rojo:"#C0392B",  rojoL:"#FDE8E8",
  azul:"#1A5276",  azulL:"#EAF2FB",
};

const MESES_LABELS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COLORES_AÑO  = { 2023:"#1A5276", 2024:"#2D5016", 2025:"#C4781A", 2026:"#C0392B" };
const COLORES_CAT  = ["#2D5016","#1A5276","#4A7C3F","#C4781A","#6C3483","#0E6655","#C0392B","#EC4899","#7A8C6A","#D4A017"];

const fmt$ = v => v==null||isNaN(v)?"—":v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${(v/1e3).toFixed(1)}K`:`$${Number(v).toLocaleString("es-EC",{minimumFractionDigits:0})}`;
const fmtN = v => v==null?"—":Number(v).toLocaleString("es-EC");
const hoy  = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"long",year:"numeric"});
const safe = (v,d=0) => (v!=null&&!isNaN(v)) ? v : d;

// ══════════════════════════════════════════════════════════
//  PARSER DEL EXCEL
// ══════════════════════════════════════════════════════════
function parsearExcel(wb) {
  const resultado = { años:{}, cats:{}, proveedores:[], kpis:{}, errores:[] };

  // ── Leer hoja de transacciones por año ────────────────
  for (const año of [2023, 2024, 2025, 2026]) {
    const nombre = `COMPRAS ${año}`;
    if (!wb.SheetNames.includes(nombre)) continue;
    const ws = wb.Sheets[nombre];
    const filas = XLSX.utils.sheet_to_json(ws, { defval: null });

    if (!filas.length) continue;

    const mesCol   = "Fecha C.";
    const montoCol = "Producto";
    const provCol  = "Proveedor";
    const catCol   = "Categoría Padre";

    const porMes   = {};  // { "2026-01": total }
    const porCat   = {};  // { "EMPAQUE": total }
    const porProv  = {};  // { "Megastockec": total }
    let   total    = 0;

    for (const f of filas) {
      const monto = safe(parseFloat(f[montoCol]), 0);
      if (!monto) continue;
      total += monto;

      // Mes
      let fecha = f[mesCol];
      if (fecha) {
        let d = fecha instanceof Date ? fecha : new Date(fecha);
        if (!isNaN(d)) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
          porMes[key] = (porMes[key]||0) + monto;
        }
      }

      // Categoría
      const cat = f[catCol] ? String(f[catCol]).trim().toUpperCase() : "SIN CATEGORÍA";
      porCat[cat] = (porCat[cat]||0) + monto;

      // Proveedor
      const prov = f[provCol] ? String(f[provCol]).trim() : "SIN PROVEEDOR";
      porProv[prov] = (porProv[prov]||0) + monto;
    }

    // Organizar mensuales en array de 12
    const mensuales = Array(12).fill(null);
    for (const [key, v] of Object.entries(porMes)) {
      const [anioK, mesK] = key.split("-").map(Number);
      if (anioK === año) mensuales[mesK-1] = v;
    }

    resultado.años[año] = {
      total,
      mensuales,
      porCat: Object.entries(porCat).sort((a,b)=>b[1]-a[1]).slice(0,15),
      porProv: Object.entries(porProv).sort((a,b)=>b[1]-a[1]).slice(0,20),
    };
  }

  // ── Leer KPIs ─────────────────────────────────────────
  for (const sufijo of ["'26","'25","2024"]) {
    const nombre = `KPIs ${sufijo}`;
    if (!wb.SheetNames.includes(nombre)) continue;
    const ws = wb.Sheets[nombre];
    const filas = XLSX.utils.sheet_to_json(ws, { header:1, defval:null });
    // Encontrar fila de headers (CONCEPTO)
    let headerRow = -1;
    for (let i=0; i<filas.length; i++) {
      if (filas[i] && filas[i].some(v=>v==="CONCEPTO")) { headerRow = i; break; }
    }
    if (headerRow === -1) continue;
    const headers = filas[headerRow];
    const año = sufijo==="'26"?2026:sufijo==="'25"?2025:2024;
    resultado.kpis[año] = {};
    for (let r = headerRow+1; r < filas.length; r++) {
      const fila = filas[r];
      if (!fila || !fila[1]) continue;
      const concepto = String(fila[1]).trim();
      const vals = headers.slice(2).map((_,i) => fila[i+2]);
      resultado.kpis[año][concepto] = vals;
    }
  }

  // ── Leer Ranking de proveedores ───────────────────────
  if (wb.SheetNames.includes("RANKING 2025")) {
    const ws = wb.Sheets["RANKING 2025"];
    const filas = XLSX.utils.sheet_to_json(ws, { defval: null });
    resultado.proveedores = filas
      .filter(f => f["PROVEEDOR"] && f["TOTAL $ 2025"] > 0)
      .map(f => ({
        nombre: String(f["PROVEEDOR"]).trim(),
        total:  safe(f["TOTAL $ 2025"],0),
        pct:    safe(f["% PARTICIPACIÓN"],0) * 100,
        cat:    f["CATEGORÍA"] ? String(f["CATEGORÍA"]).trim() : "—",
      }))
      .sort((a,b) => b.total-a.total)
      .slice(0,20);
  }

  return resultado;
}

// ══════════════════════════════════════════════════════════
//  COMPONENTES BASE
// ══════════════════════════════════════════════════════════
function KCard({icono,label,valor,sub,color,delta}) {
  const col = color||C.verde;
  return (
    <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px 20px",borderTop:`3px solid ${col}`}}>
      <div style={{fontSize:22,marginBottom:8}}>{icono}</div>
      <div style={{fontSize:21,fontWeight:800,color:C.texto,fontFamily:"monospace",lineHeight:1}}>{valor}</div>
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

function BarV({valor,max,color,label}) {
  const h = max>0 ? Math.min((valor/max)*100,100) : 0;
  const col = color||C.verde;
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <div style={{fontSize:9,color:col,fontWeight:700,fontFamily:"monospace",textAlign:"center"}}>{fmt$(valor)}</div>
      <div style={{width:"100%",height:`${h}%`,background:col,borderRadius:"4px 4px 0 0",minHeight:6}}/>
      <div style={{fontSize:10,color:C.gris,textAlign:"center"}}>{label}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PANTALLA DE CARGA
// ══════════════════════════════════════════════════════════
function PantallaCarga({onCarga}) {
  const [drag, setDrag] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function procesar(file) {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) { setError("Solo se aceptan archivos .xlsx o .xls"); return; }
    setCargando(true);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type:"array", cellDates:true });
        const datos = parsearExcel(wb);
        const años  = Object.keys(datos.años);
        if (!años.length) { setError("No se encontraron hojas COMPRAS en el archivo."); setCargando(false); return; }
        onCarga(datos, file.name);
      } catch(err) {
        setError("Error al leer el archivo: " + err.message);
        setCargando(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{background:`linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)`,padding:"16px 32px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:28}}>🌿</span>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>Hoja Verde 360° — Dashboard en Vivo</div>
          <div style={{fontSize:10,color:"#95D5B2",letterSpacing:1}}>CARGA TU MASTER FILE Y EL DASHBOARD SE ACTUALIZA SOLO</div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div style={{maxWidth:560,width:"100%"}}>
          {/* Drop zone */}
          <div
            onDragOver={e=>{e.preventDefault();setDrag(true);}}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);procesar(e.dataTransfer.files[0]);}}
            onClick={()=>document.getElementById("file-input").click()}
            style={{
              border:`2px dashed ${drag?C.verde:C.borde}`,borderRadius:16,
              padding:"48px 32px",textAlign:"center",cursor:"pointer",
              background:drag?C.verdeL:C.card,transition:"all 0.2s",marginBottom:24,
            }}>
            <div style={{fontSize:52,marginBottom:12}}>{cargando?"⏳":"📂"}</div>
            <div style={{fontSize:17,fontWeight:800,color:C.texto,marginBottom:6}}>
              {cargando?"Procesando archivo...":"Arrastra tu Master File aquí"}
            </div>
            <div style={{fontSize:13,color:C.gris,marginBottom:16}}>
              {cargando?"Leyendo hojas de compras, KPIs y proveedores...":"O haz clic para seleccionar el archivo"}
            </div>
            {!cargando && (
              <span style={{background:C.verde,color:"#fff",borderRadius:8,padding:"8px 20px",fontSize:12,fontWeight:700}}>
                Seleccionar archivo .xlsx
              </span>
            )}
            <input id="file-input" type="file" accept=".xlsx,.xls" style={{display:"none"}}
              onChange={e=>procesar(e.target.files[0])}/>
          </div>

          {error && (
            <div style={{background:C.rojoL,border:`1px solid ${C.rojo}44`,borderRadius:10,padding:"12px 16px",color:C.rojo,fontSize:12,marginBottom:16}}>
              ⚠️ {error}
            </div>
          )}

          {/* Info de hojas esperadas */}
          <div style={{background:C.card,border:`1px solid ${C.borde}`,borderRadius:12,padding:"18px 20px"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.texto,marginBottom:12}}>📋 Hojas que se leen automáticamente:</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                ["COMPRAS 2023–2026","Transacciones detalladas"],
                ["KPIs '25 / '26","Indicadores por mes"],
                ["RANKING 2025","Top proveedores"],
                ["CAT 2025 / 2026","Gasto por categoría"],
              ].map(([h,s],i)=>(
                <div key={i} style={{background:C.panel,borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.verde}}>{h}</div>
                  <div style={{fontSize:10,color:C.gris,marginTop:2}}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10.5,color:C.gris,marginTop:12,borderTop:`1px solid ${C.borde}`,paddingTop:10}}>
              🔒 El archivo se procesa localmente en tu navegador. No se sube a ningún servidor.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  TABS DEL DASHBOARD
// ══════════════════════════════════════════════════════════
const TABS = [
  {id:"resumen",    label:"Resumen",        icono:"📊"},
  {id:"tendencias", label:"Tendencias",     icono:"📈"},
  {id:"estacional", label:"Estacionalidad", icono:"📅"},
  {id:"categorias", label:"Categorías",     icono:"📦"},
  {id:"proveedores",label:"Proveedores",    icono:"🏭"},
];

// ── TAB: Resumen ──────────────────────────────────────────
function TabResumen({datos}) {
  const años = Object.keys(datos.años).map(Number).sort();
  const ultimo = datos.años[años[años.length-1]];
  const penultimo = datos.años[años[años.length-2]];
  const deltaTotal = penultimo ? ((ultimo.total-penultimo.total)/penultimo.total*100) : null;
  const totalProvs = datos.proveedores.length;
  const top3pct = datos.proveedores.slice(0,3).reduce((a,b)=>a+b.pct,0);
  const topCat  = ultimo.porCat[0];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Banner */}
      <div style={{background:`linear-gradient(135deg,${C.verde} 0%,${C.verdeM} 100%)`,borderRadius:14,padding:"22px 28px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",opacity:0.8,marginBottom:4}}>Datos en Vivo</div>
          <h2 style={{fontSize:22,fontWeight:800,margin:"0 0 4px"}}>Procurement · Grupo Hoja Verde</h2>
          <p style={{fontSize:11,opacity:0.7,margin:0}}>Años disponibles: {años.join(", ")} · Actualizado {hoy()}</p>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,opacity:0.7}}>Gasto último año cargado</div>
          <div style={{fontSize:30,fontWeight:800,fontFamily:"monospace"}}>{fmt$(ultimo.total)}</div>
          {deltaTotal!=null && <div style={{fontSize:12,opacity:0.85,marginTop:2}}>{deltaTotal>0?"▲":"▼"} {Math.abs(deltaTotal).toFixed(1)}% vs año anterior</div>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {años.slice(-4).map((a,i,arr) => {
          const prev = datos.años[arr[i-1]];
          const d = prev ? ((datos.años[a].total-prev.total)/prev.total*100) : null;
          return <KCard key={a} icono="📊" label={`Total ${a}`} valor={fmt$(datos.años[a].total)} color={COLORES_AÑO[a]||C.verde} delta={d}/>;
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16}}>
        <SecCard titulo="Top 10 Proveedores — Año más reciente" sub={`${totalProvs} proveedores · Top 3 concentra ${top3pct.toFixed(1)}%`}>
          {datos.proveedores.slice(0,10).map((p,i) => (
            <div key={i} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,gap:8}}>
                <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:i<3?700:400}}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`} {p.nombre}
                </span>
                <span style={{fontSize:11,fontWeight:700,color:C.verde,fontFamily:"monospace",flexShrink:0}}>{fmt$(p.total)}</span>
              </div>
              <div style={{height:6,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(p.total/datos.proveedores[0].total)*100}%`,background:i<3?C.amber:C.verde,borderRadius:3}}/>
              </div>
            </div>
          ))}
        </SecCard>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <SecCard titulo="Top 5 Categorías — Último año">
            {ultimo.porCat.slice(0,5).map(([cat,v],i) => {
              const pct = (v/ultimo.total*100);
              return (
                <div key={i} style={{marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.toLowerCase().replace(/^\w/,c=>c.toUpperCase())}</span>
                    <span style={{fontSize:11,fontWeight:700,color:COLORES_CAT[i]}}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{height:6,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(v/ultimo.porCat[0][1])*100}%`,background:COLORES_CAT[i],borderRadius:3}}/>
                  </div>
                </div>
              );
            })}
          </SecCard>

          <SecCard titulo="Highlights del Archivo">
            {[
              {i:"📁",t:"Años cargados",d:años.join(", "),c:C.verde},
              {i:"🏭",t:"Proveedores (2025)",d:`${totalProvs} en ranking`,c:C.azul},
              {i:"📦",t:"Categoría #1",d:topCat?topCat[0].toLowerCase().replace(/^\w/,c=>c.toUpperCase()):"—",c:C.amber},
              {i:"⚠️",t:"Concentración Top 3",d:`${top3pct.toFixed(1)}% del gasto`,c:top3pct>25?C.rojo:C.verde},
            ].map((d,i)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<3?`1px solid ${C.borde}`:"none"}}>
                <span style={{fontSize:18,flexShrink:0}}>{d.i}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:d.c}}>{d.t}</div>
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

// ── TAB: Tendencias ───────────────────────────────────────
function TabTendencias({datos}) {
  const años = Object.keys(datos.años).map(Number).sort();
  const maxV = Math.max(...años.map(a=>datos.años[a].total));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SecCard titulo="Evolución del Gasto Total Anual" sub="Calculado desde datos de transacciones del Master File">
        <div style={{display:"flex",gap:16,alignItems:"flex-end",height:200,padding:"0 20px",marginBottom:12}}>
          {años.map((a,i) => {
            const v = datos.años[a].total;
            const h = (v/maxV)*100;
            const col = COLORES_AÑO[a]||C.verde;
            const prev = datos.años[años[i-1]];
            const d = prev ? ((v-prev.total)/prev.total*100) : null;
            return (
              <div key={a} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                {d!=null && <div style={{fontSize:11,fontWeight:700,color:d>0?C.rojo:C.verde}}>{d>0?"▲":"▼"}{Math.abs(d).toFixed(1)}%</div>}
                <div style={{fontSize:11,fontWeight:800,color:col,fontFamily:"monospace"}}>{fmt$(v)}</div>
                <div style={{width:"80%",height:`${h}%`,background:col,borderRadius:"6px 6px 0 0",minHeight:12}}/>
                <div style={{fontSize:13,fontWeight:700,color:col}}>{a}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:20,padding:"10px 14px",background:C.panel,borderRadius:8,flexWrap:"wrap"}}>
          {años.length>=2 && (
            <span style={{fontSize:11,color:C.gris,fontWeight:600}}>
              📈 Crecimiento {años[0]}→{años[años.length-1]}: <span style={{color:C.rojo}}>+{(((datos.años[años[años.length-1]].total-datos.años[años[0]].total)/datos.años[años[0]].total)*100).toFixed(1)}%</span>
            </span>
          )}
          <span style={{fontSize:11,color:C.gris,fontWeight:600}}>
            💵 Prom. mensual último año: <span style={{color:C.verde}}>{fmt$(datos.años[años[años.length-1]].total/12)}</span>
          </span>
        </div>
      </SecCard>

      <SecCard titulo="Comparativo Mensual por Año" sub="Gasto total por mes según transacciones">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
            <thead>
              <tr style={{background:C.panel}}>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>Mes</th>
                {años.map(a=><th key={a} style={{padding:"8px 12px",textAlign:"right",fontSize:10,fontWeight:600,color:COLORES_AÑO[a]||C.gris,textTransform:"uppercase"}}>{a}</th>)}
              </tr>
            </thead>
            <tbody>
              {MESES_LABELS.map((m,i)=>(
                <tr key={m} style={{borderTop:`1px solid ${C.borde}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"8px 12px",fontSize:12,fontWeight:700}}>{m}</td>
                  {años.map(a=>{
                    const v=datos.años[a].mensuales[i];
                    return <td key={a} style={{padding:"8px 12px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:v?COLORES_AÑO[a]||C.verde:C.gris}}>{v?fmt$(v):"—"}</td>;
                  })}
                </tr>
              ))}
              <tr style={{borderTop:`2px solid ${C.verde}`,background:C.verdeL}}>
                <td style={{padding:"9px 12px",fontSize:12,fontWeight:800,color:C.verde}}>TOTAL</td>
                {años.map(a=><td key={a} style={{padding:"9px 12px",textAlign:"right",fontFamily:"monospace",fontWeight:800,fontSize:12,color:COLORES_AÑO[a]||C.verde}}>{fmt$(datos.años[a].total)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </SecCard>
    </div>
  );
}

// ── TAB: Estacionalidad ───────────────────────────────────
function TabEstacional({datos}) {
  const [añoSel, setAñoSel] = useState("prom");
  const años = Object.keys(datos.años).map(Number).sort().filter(a=>datos.años[a].mensuales.some(v=>v!=null));

  const vals = useMemo(()=>{
    if (añoSel==="prom") {
      const sums = Array(12).fill(0), counts = Array(12).fill(0);
      for (const a of años) {
        datos.años[a].mensuales.forEach((v,i)=>{ if(v!=null){sums[i]+=v;counts[i]++;} });
      }
      return sums.map((s,i)=>counts[i]?Math.round(s/counts[i]):null);
    }
    return datos.años[parseInt(añoSel)].mensuales;
  }, [añoSel, datos]);

  const noNull = vals.filter(v=>v!=null);
  const maxV = Math.max(...noNull);
  const minV = Math.min(...noNull);
  const iMax = vals.indexOf(maxV);
  const iMin = vals.indexOf(minV);
  const promV = Math.round(noNull.reduce((a,b)=>a+b,0)/noNull.length);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="📈" label="Mes pico" valor={iMax>=0?MESES_LABELS[iMax]:"—"} sub={fmt$(maxV)} color={C.rojo}/>
        <KCard icono="📉" label="Mes mínimo" valor={iMin>=0?MESES_LABELS[iMin]:"—"} sub={fmt$(minV)} color={C.verde}/>
        <KCard icono="📊" label="Promedio mensual" valor={fmt$(promV)} sub="Sobre meses con datos" color={C.azul}/>
        <KCard icono="⚡" label="Amplitud estacional" valor={`${(((maxV-minV)/minV)*100).toFixed(0)}%`} sub="Variación máx vs mín" color={C.amber}/>
      </div>

      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setAñoSel("prom")} style={{background:añoSel==="prom"?C.verde:"transparent",border:`1px solid ${añoSel==="prom"?C.verde:C.borde}`,borderRadius:18,padding:"5px 14px",fontSize:11,color:añoSel==="prom"?"#fff":C.gris,cursor:"pointer",fontWeight:añoSel==="prom"?700:400}}>Promedio</button>
        {años.map(a=>(
          <button key={a} onClick={()=>setAñoSel(String(a))}
            style={{background:añoSel===String(a)?COLORES_AÑO[a]||C.verde:"transparent",border:`1px solid ${añoSel===String(a)?COLORES_AÑO[a]||C.verde:C.borde}`,borderRadius:18,padding:"5px 14px",fontSize:11,color:añoSel===String(a)?"#fff":C.gris,cursor:"pointer",fontWeight:añoSel===String(a)?700:400}}>
            {a}
          </button>
        ))}
      </div>

      <SecCard titulo="Patrón Estacional de Gasto Mensual">
        <div style={{display:"flex",gap:6,alignItems:"flex-end",height:170,marginBottom:12}}>
          {vals.map((v,i)=>{
            if(v==null) return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",height:"8%",background:C.panel,borderRadius:"4px 4px 0 0",border:`1px dashed ${C.borde}`}}/><div style={{fontSize:10,color:C.gris}}>{MESES_LABELS[i]}</div></div>;
            const h=(v/maxV)*100;
            const esPico=i===iMax,esMin=i===iMin;
            const col=esPico?C.rojo:esMin?C.verde:C.azul;
            return (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{fontSize:8.5,color:col,fontWeight:700,fontFamily:"monospace",textAlign:"center"}}>{fmt$(v)}</div>
                <div style={{width:"100%",height:`${h}%`,background:col,borderRadius:"4px 4px 0 0",minHeight:6,opacity:esPico||esMin?1:0.65}}/>
                <div style={{fontSize:10,fontWeight:esPico||esMin?800:400,color:esPico?C.rojo:esMin?C.verde:C.gris}}>{MESES_LABELS[i]}</div>
                {esPico&&<div style={{fontSize:7.5,color:C.rojo,fontWeight:700}}>PICO</div>}
                {esMin &&<div style={{fontSize:7.5,color:C.verde,fontWeight:700}}>MÍN</div>}
              </div>
            );
          })}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
            <thead><tr style={{background:C.panel}}>
              {["Mes","Valor","vs Promedio","Índice"].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {vals.map((v,i)=>{
                if(!v) return null;
                const diff=((v-promV)/promV*100);
                const idx=Math.round(v/promV*100);
                return (
                  <tr key={i} style={{borderTop:`1px solid ${C.borde}`,background:i===iMax?C.amberL:"transparent"}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                    onMouseLeave={e=>e.currentTarget.style.background=i===iMax?C.amberL:"transparent"}>
                    <td style={{padding:"7px 10px",fontSize:12,fontWeight:700}}>{MESES_LABELS[i]}{i===iMax?" 🔺":i===iMin?" 🔻":""}</td>
                    <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11,fontWeight:700,color:COLORES_AÑO[parseInt(añoSel)]||C.verde}}>{fmt$(v)}</td>
                    <td style={{padding:"7px 10px"}}><span style={{fontSize:11,fontWeight:700,color:diff>5?C.rojo:diff<-5?C.verde:C.gris}}>{diff>0?"▲":"▼"} {Math.abs(diff).toFixed(1)}%</span></td>
                    <td style={{padding:"7px 10px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:44,height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
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
        </div>
      </SecCard>
    </div>
  );
}

// ── TAB: Categorías ───────────────────────────────────────
function TabCategorias({datos}) {
  const años = Object.keys(datos.años).map(Number).sort();
  const [añoSel, setAñoSel] = useState(String(años[años.length-1]));
  const catData = datos.años[parseInt(añoSel)]?.porCat || [];
  const total   = catData.reduce((a,[,v])=>a+v,0);
  const maxV    = catData.length ? catData[0][1] : 1;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:11,color:C.gris}}>Año:</span>
        {años.map(a=>(
          <button key={a} onClick={()=>setAñoSel(String(a))}
            style={{background:añoSel===String(a)?COLORES_AÑO[a]||C.verde:"transparent",border:`1px solid ${añoSel===String(a)?COLORES_AÑO[a]||C.verde:C.borde}`,borderRadius:18,padding:"4px 12px",fontSize:11,color:añoSel===String(a)?"#fff":C.gris,cursor:"pointer",fontWeight:añoSel===String(a)?700:400}}>
            {a}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:16}}>
        <SecCard titulo={`Categorías de Gasto — ${añoSel}`} sub={`Total: ${fmt$(total)}`}>
          {catData.slice(0,12).map(([cat,v],i)=>{
            const pct=(v/total*100);
            return (
              <div key={i} style={{marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,gap:8}}>
                  <span style={{fontSize:11,color:C.texto,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:COLORES_CAT[i%10],display:"inline-block",flexShrink:0}}/>
                    {cat.toLowerCase().replace(/^\w/,c=>c.toUpperCase())}
                  </span>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <span style={{fontSize:11,fontWeight:700,color:COLORES_CAT[i%10],fontFamily:"monospace"}}>{fmt$(v)}</span>
                    <span style={{fontSize:10.5,color:C.gris}}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{height:6,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(v/maxV)*100}%`,background:COLORES_CAT[i%10],borderRadius:3}}/>
                </div>
              </div>
            );
          })}
        </SecCard>

        <SecCard titulo="Comparativo Categorías por Año">
          {catData.slice(0,6).map(([cat,v],i)=>{
            const label=cat.toLowerCase().replace(/^\w/,c=>c.toUpperCase()).slice(0,20);
            return (
              <div key={i} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:C.texto,marginBottom:5,display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:COLORES_CAT[i],display:"inline-block"}}/>
                  {label}
                </div>
                {años.map(a=>{
                  const vA = datos.años[a]?.porCat?.find(([c])=>c===cat)?.[1];
                  const maxA = Math.max(...años.map(ax=>datos.años[ax]?.porCat?.find(([c])=>c===cat)?.[1]||0));
                  if(!vA) return null;
                  return (
                    <div key={a} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:9.5,fontWeight:700,color:COLORES_AÑO[a]||C.gris,width:28,flexShrink:0}}>{a}</span>
                      <div style={{flex:1,height:6,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${maxA?(vA/maxA)*100:0}%`,background:COLORES_AÑO[a]||C.gris,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:9.5,fontFamily:"monospace",color:COLORES_AÑO[a]||C.gris,width:52,textAlign:"right",flexShrink:0}}>{fmt$(vA)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </SecCard>
      </div>
    </div>
  );
}

// ── TAB: Proveedores ──────────────────────────────────────
function TabProveedores({datos}) {
  const [busq, setBusq] = useState("");
  const provs = datos.proveedores;
  const filtrados = provs.filter(p=>p.nombre.toLowerCase().includes(busq.toLowerCase()));
  const top3pct = provs.slice(0,3).reduce((a,b)=>a+b.pct,0);
  const top5pct = provs.slice(0,5).reduce((a,b)=>a+b.pct,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <KCard icono="🏭" label="Proveedores en ranking" valor={provs.length} sub="Año 2025" color={C.verde}/>
        <KCard icono="⚠️" label="Concentración Top 3" valor={`${top3pct.toFixed(1)}%`} sub={fmt$(provs.slice(0,3).reduce((a,b)=>a+b.total,0))} color={C.rojo}/>
        <KCard icono="📊" label="Concentración Top 5" valor={`${top5pct.toFixed(1)}%`} sub={fmt$(provs.slice(0,5).reduce((a,b)=>a+b.total,0))} color={C.amber}/>
        <KCard icono="💰" label="Proveedor #1" valor={provs[0]?.nombre.split(" ").slice(0,2).join(" ")||"—"} sub={provs[0]?fmt$(provs[0].total):"—"} color={C.azul}/>
      </div>

      <SecCard titulo="Ranking de Proveedores — 2025"
        extra={<input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar proveedor..." style={{background:C.panel,border:`1px solid ${C.borde}`,borderRadius:8,padding:"5px 10px",fontSize:11,color:C.texto,outline:"none",width:200}}/>}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:C.panel}}>
            {["#","Proveedor","Total 2025","% Part.","Categoría","Pareto"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:C.gris,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtrados.map((p,i)=>{
              const rank=provs.indexOf(p)+1;
              const cumPct=provs.slice(0,rank).reduce((a,b)=>a+b.pct,0);
              return (
                <tr key={i} style={{borderTop:`1px solid ${C.borde}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 12px",fontWeight:800,color:rank<=3?C.amber:C.gris,fontSize:12}}>{rank}</td>
                  <td style={{padding:"9px 12px",fontSize:11.5,maxWidth:260}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:rank<=3?700:400}}>
                      {rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":""} {p.nombre}
                    </div>
                  </td>
                  <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:C.verde,fontSize:12}}>{fmt$(p.total)}</td>
                  <td style={{padding:"9px 12px",fontSize:11,color:C.gris}}>{p.pct.toFixed(2)}%</td>
                  <td style={{padding:"9px 12px"}}><Badge texto={p.cat} color={C.verdeM}/></td>
                  <td style={{padding:"9px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:48,height:5,background:C.panel,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(cumPct/100*100,100)}%`,background:cumPct>80?C.rojo:cumPct>60?C.amber:C.verde,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:cumPct>80?C.rojo:cumPct>60?C.amber:C.verde}}>{cumPct.toFixed(0)}%</span>
                    </div>
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
//  APP PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function App() {
  const [datos,    setDatos]   = useState(null);
  const [archivo,  setArchivo] = useState("");
  const [tab,      setTab]     = useState("resumen");

  function onCarga(d, nombre) { setDatos(d); setArchivo(nombre); setTab("resumen"); }

  if (!datos) return <PantallaCarga onCarga={onCarga}/>;

  const vistas = {
    resumen:     <TabResumen     datos={datos}/>,
    tendencias:  <TabTendencias  datos={datos}/>,
    estacional:  <TabEstacional  datos={datos}/>,
    categorias:  <TabCategorias  datos={datos}/>,
    proveedores: <TabProveedores datos={datos}/>,
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:C.texto}}>
      <div style={{background:`linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)`,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:26}}>🌿</span>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>Hoja Verde 360° — Dashboard en Vivo</div>
            <div style={{fontSize:10,color:"#95D5B2",letterSpacing:1}}>📂 {archivo}</div>
          </div>
        </div>
        <button onClick={()=>{setDatos(null);setArchivo("");}}
          style={{background:"#ffffff22",border:"1px solid #ffffff44",borderRadius:8,padding:"6px 14px",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:600}}>
          🔄 Cambiar archivo
        </button>
      </div>

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

      <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:#FAF5EC;}::-webkit-scrollbar-thumb{background:#D6C9B0;border-radius:4px;}`}</style>
    </div>
  );
}
