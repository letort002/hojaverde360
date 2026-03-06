import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   HOJA VERDE 360° — SISTEMA DE PROCUREMENT
   Programa completo con persistencia, módulos y gestión real
═══════════════════════════════════════════════════════════ */

// ── Palette & helpers ──────────────────────────────────────
const G = {
  bg:     "#0F1A0F",
  panel:  "#141F14",
  card:   "#1A271A",
  border: "#2A3D2A",
  hover:  "#223022",
  green:  "#22C55E",
  greenD: "#16A34A",
  greenL: "#4ADE80",
  amber:  "#F59E0B",
  red:    "#EF4444",
  blue:   "#3B82F6",
  purple: "#A855F7",
  text:   "#E8F5E9",
  muted:  "#6B8F6B",
  white:  "#FFFFFF",
};

const fmt$ = v => v >= 1000000 ? `$${(v/1e6).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${Number(v).toLocaleString("es-EC",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = () => new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"short",year:"numeric"});
const uid = () => Math.random().toString(36).slice(2,9).toUpperCase();

// ── Seed data ──────────────────────────────────────────────
const SEED_PROVEEDORES = [
  {p:"Megastockec Distribuidora Agrícola S.A.",m:59785.83},{p:"Papelera Nacional S.A.",m:39816.00},
  {p:"Fito Sanitario Fitosan S.A.",m:33647.00},{p:"Vallejo Mosquera Enrique Francisco",m:24003.60},
  {p:"Ecuaquimica Ecuatoriana De Productos Quimicos Ca",m:22776.87},{p:"Corporación Internacional de Cultivos Corpcultivos S.A.S.",m:21707.66},
  {p:"Paillacho Marmol Diego Fernando",m:16376.30},{p:"Almeida Davalos Diego Joel",m:14667.95},
  {p:"Crait Cía. Ltda.",m:14381.54},{p:"Fertilizantes Y Agroquímicos Europeos Eurofert S.A.",m:14353.00},
  {p:"Alexis Mejía Representaciones Cía. Ltda.",m:13722.28},{p:"Amc Ecuador Cía. Ltda.",m:12609.23},
  {p:"Rodel Flowers Cía.Ltda.",m:11871.10},{p:"Agripac S.A.",m:11595.55},
  {p:"Quimicolours S.A.",m:10288.34},{p:"Everflor Ecuador S.A.",m:10207.06},
  {p:"Naviagroec S.A.S.",m:10112.50},{p:"Importagriflor Cía.Ltda.",m:9427.16},
  {p:"Insumos Químicos Santander Insuquimsa Cía. Ltda.",m:8024.35},{p:"Sociedad Civil y Comercial Innovaplast del Ecuador",m:6904.98},
];

const CATEGORIAS = ["Agroquímicos","Empaques","Insumos Florales","Fertilizantes","Servicios Técnicos","Transporte","Otros"];
const FINCAS = ["HV","FM","JG","CM"];
const AREAS = ["Supply Chain","Comercial","Técnica","Calidad","Finanzas","Talento Humano","Sostenibilidad"];
const ESTADOS_OC = ["Borrador","Pendiente Aprobación","Aprobada","Rechazada","Recibida"];

const SEED_ORDENES = [
  {id:`OC-${uid()}`,proveedor:"Megastockec Distribuidora Agrícola S.A.",categoria:"Agroquímicos",monto:12450,finca:"HV",estado:"Aprobada",fecha:"2026-03-01",solicitante:"José Vargas",descripcion:"Fungicidas para ciclo Q1",prioridad:"Alta"},
  {id:`OC-${uid()}`,proveedor:"Papelera Nacional S.A.",categoria:"Empaques",monto:8320,finca:"FM",estado:"Pendiente Aprobación",fecha:"2026-03-02",solicitante:"José Vargas",descripcion:"Cajas y materiales empaque semana 10",prioridad:"Media"},
  {id:`OC-${uid()}`,proveedor:"Ecuaquimica Ecuatoriana De Productos Quimicos Ca",categoria:"Agroquímicos",monto:5600,finca:"JG",estado:"Aprobada",fecha:"2026-03-03",solicitante:"José Vargas",descripcion:"Insecticidas control IPM",prioridad:"Alta"},
  {id:`OC-${uid()}`,proveedor:"Rodel Flowers Cía.Ltda.",categoria:"Insumos Florales",monto:18900,finca:"CM",estado:"Pendiente Aprobación",fecha:"2026-03-04",solicitante:"José Vargas",descripcion:"Material vegetal temporada",prioridad:"Alta"},
  {id:`OC-${uid()}`,proveedor:"Crait Cía. Ltda.",categoria:"Servicios Técnicos",monto:3200,finca:"HV",estado:"Borrador",fecha:"2026-03-05",solicitante:"José Vargas",descripcion:"Mantenimiento sistema riego",prioridad:"Baja"},
];

const SEED_KPIS = [
  {id:uid(),nombre:"OTIF",valor:94,meta:95,tendencia:1,area:"Supply Chain",unidad:"%",fecha:"2026-03-06",nota:""},
  {id:uid(),nombre:"Fill Rate",valor:96.2,meta:95,tendencia:0.8,area:"Supply Chain",unidad:"%",fecha:"2026-03-06",nota:""},
  {id:uid(),nombre:"MAPE Forecast",valor:12.4,meta:15,tendencia:-1.8,area:"Supply Chain",unidad:"%",fecha:"2026-03-06",nota:"Mejora sostenida"},
  {id:uid(),nombre:"OTIF Proveedores",valor:88.5,meta:92,tendencia:-1.2,area:"Supply Chain",unidad:"%",fecha:"2026-03-06",nota:"Revisar Papelera Nacional"},
  {id:uid(),nombre:"Cobertura Inventario",valor:28,meta:30,tendencia:2,area:"Supply Chain",unidad:" días",fecha:"2026-03-06",nota:""},
  {id:uid(),nombre:"Costo por Tallo",valor:0.38,meta:0.40,tendencia:-2,area:"Sostenibilidad",unidad:" USD",fecha:"2026-03-06",nota:""},
];

// ── Persistent storage wrapper ────────────────────────────
function useStorage(key, fallback) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch { return fallback; }
  });
  const [ready] = useState(true);
  const save = useCallback(newVal => {
    setVal(newVal);
    try { localStorage.setItem(key, JSON.stringify(newVal)); } catch {}
  }, [key]);
  return [val, save, ready];
}

// ── Mini components ────────────────────────────────────────
const Badge = ({label, color="#22C55E", bg}) => (
  <span style={{background: bg || color+"22", color, fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:700, whiteSpace:"nowrap"}}>{label}</span>
);

const Pill = ({v}) => {
  const map = {"Aprobada":[G.green,"#14271C"],"Pendiente Aprobación":[G.amber,"#271F0A"],"Rechazada":[G.red,"#270A0A"],"Borrador":[G.muted,G.card],"Recibida":[G.blue,"#0A1427"]};
  const [col,bg] = map[v] || [G.muted,G.card];
  return <span style={{background:bg,color:col,border:`1px solid ${col}44`,fontSize:10,padding:"2px 9px",borderRadius:10,fontWeight:700}}>{v}</span>;
};

const StatCard = ({icon,label,value,sub,color=G.green,onClick}) => (
  <div onClick={onClick} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:"16px 18px",cursor:onClick?"pointer":"default",transition:"all 0.15s",borderTop:`3px solid ${color}`}}
    onMouseEnter={e=>{if(onClick){e.currentTarget.style.borderColor=color;e.currentTarget.style.background=G.hover;}}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.background=G.card;}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
      <span style={{fontSize:20}}>{icon}</span>
      <span style={{width:8,height:8,borderRadius:"50%",background:color,display:"block",marginTop:4}}/>
    </div>
    <div style={{fontSize:24,fontWeight:800,color:G.text,fontFamily:"'DM Mono',monospace"}}>{value}</div>
    <div style={{fontSize:11.5,fontWeight:600,color:G.text,marginTop:3}}>{label}</div>
    {sub && <div style={{fontSize:10,color:G.muted,marginTop:2}}>{sub}</div>}
  </div>
);

const Input = ({label,value,onChange,type="text",placeholder="",required,options,rows}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label && <label style={{fontSize:11,fontWeight:600,color:G.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}{required&&<span style={{color:G.amber}}> *</span>}</label>}
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 12px",color:G.text,fontSize:13,outline:"none"}}>
        <option value="">Seleccionar...</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : rows ? (
      <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 12px",color:G.text,fontSize:13,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
    ) : (
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:"8px 12px",color:G.text,fontSize:13,outline:"none"}}
        onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border}/>
    )}
  </div>
);

const Btn = ({children,onClick,variant="primary",size="md",disabled,type="button"}) => {
  const s = {primary:{bg:G.green,color:"#0F1A0F"},ghost:{bg:"transparent",color:G.text,border:`1px solid ${G.border}`},danger:{bg:G.red+"22",color:G.red,border:`1px solid ${G.red}44`},amber:{bg:G.amber+"22",color:G.amber,border:`1px solid ${G.amber}44`}};
  const sz = {sm:{padding:"4px 12px",fontSize:11},md:{padding:"8px 18px",fontSize:12.5},lg:{padding:"10px 24px",fontSize:13.5}};
  const st = {...s[variant],...sz[size],borderRadius:8,fontWeight:700,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,border:"none",transition:"all 0.15s",display:"inline-flex",alignItems:"center",gap:6};
  return <button type={type} onClick={onClick} disabled={disabled} style={st}
    onMouseEnter={e=>{if(!disabled&&variant==="primary")e.currentTarget.style.background=G.greenD}}
    onMouseLeave={e=>{if(!disabled&&variant==="primary")e.currentTarget.style.background=G.green}}>{children}</button>;
};

// ── CSV Parser ─────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  const sep = lines[0].includes(";") ? ";" : ",";
  const rows = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(sep);
    if (parts.length < 2) continue;
    const proveedor = parts[0].trim();
    const raw = parts[1].trim().replace(/\$/g,"").replace(/\./g,"").replace(",",".");
    const monto = parseFloat(raw);
    if (proveedor && !isNaN(monto) && monto > 0) rows.push({p: proveedor, m: monto});
  }
  rows.sort((a,b)=>b.m-a.m);
  return rows;
}

// ═══════════════════════════════════════════════════════════
//  MÓDULOS
// ═══════════════════════════════════════════════════════════

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard({proveedores, ordenes, kpis, setMod}) {
  const total = proveedores.reduce((a,b)=>a+b.m,0);
  const pendientes = ordenes.filter(o=>o.estado==="Pendiente Aprobación").length;
  const top3pct = proveedores.slice(0,3).reduce((a,b)=>a+b.m,0)/total*100;
  const criticos = kpis.filter(k=>k.valor < k.meta*0.92).length;
  const max = proveedores[0]?.m || 1;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div>
        <h2 style={{color:G.greenL,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Sistema de Procurement</h2>
        <h1 style={{color:G.text,fontSize:28,fontWeight:800,margin:0}}>Dashboard Principal</h1>
        <p style={{color:G.muted,fontSize:13,margin:"4px 0 0"}}>Datos reales enero 2026 · {fmtDate()}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        <StatCard icon="💵" label="Gasto Total Enero" value={fmt$(total)} sub={`${proveedores.length} proveedores`} color={G.green} onClick={()=>setMod("proveedores")}/>
        <StatCard icon="📋" label="OC Pendientes" value={pendientes} sub="Requieren aprobación" color={G.amber} onClick={()=>setMod("ordenes")}/>
        <StatCard icon="⚠️" label="Concentración Top 3" value={`${top3pct.toFixed(1)}%`} sub="Riesgo de dependencia" color={top3pct>25?G.red:G.amber} onClick={()=>setMod("analisis")}/>
        <StatCard icon="🎯" label="KPIs Críticos" value={criticos} sub="Por debajo de meta" color={criticos>0?G.red:G.green} onClick={()=>setMod("kpis")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16}}>
        {/* Top 10 */}
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"20px 22px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{color:G.text,fontSize:14,fontWeight:700,margin:0}}>Top 10 Proveedores</h3>
            <button onClick={()=>setMod("proveedores")} style={{background:"none",border:"none",color:G.green,fontSize:11,cursor:"pointer",fontWeight:600}}>Ver todos →</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {proveedores.slice(0,10).map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:20,fontSize:10,color:i<3?G.amber:G.muted,fontWeight:700,textAlign:"right",flexShrink:0}}>#{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10.5,color:G.text,fontWeight:i<3?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.p}</div>
                  <div style={{height:5,background:G.bg,borderRadius:3,marginTop:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${(p.m/max)*100}%`,background:i===0?G.amber:i<3?G.green:G.muted,borderRadius:3,transition:"width 0.8s ease"}}/>
                  </div>
                </div>
                <span style={{fontSize:10.5,fontWeight:700,color:G.green,flexShrink:0,minWidth:60,textAlign:"right",fontFamily:"monospace"}}>{fmt$(p.m)}</span>
                <span style={{fontSize:9.5,color:G.muted,flexShrink:0,minWidth:32}}>{p.pct?.toFixed(1)||((p.m/total)*100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* OC recientes + KPI alertas */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"16px 18px",flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h3 style={{color:G.text,fontSize:13,fontWeight:700,margin:0}}>Órdenes Recientes</h3>
              <button onClick={()=>setMod("ordenes")} style={{background:"none",border:"none",color:G.green,fontSize:11,cursor:"pointer",fontWeight:600}}>Ver todas →</button>
            </div>
            {ordenes.slice(0,4).map((o,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<3?`1px solid ${G.border}`:"none"}}>
                <div>
                  <div style={{fontSize:10.5,color:G.text,fontWeight:600}}>{o.id}</div>
                  <div style={{fontSize:9.5,color:G.muted}}>{o.proveedor.split(" ").slice(0,3).join(" ")}...</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                  <Pill v={o.estado}/>
                  <span style={{fontSize:10,color:G.green,fontFamily:"monospace",fontWeight:700}}>{fmt$(o.monto)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"16px 18px"}}>
            <h3 style={{color:G.text,fontSize:13,fontWeight:700,margin:"0 0 10px"}}>Estado de KPIs</h3>
            {kpis.slice(0,4).map((k,i)=>{
              const pct = k.valor/k.meta*100;
              const col = pct>=100?G.green:pct>=90?G.amber:G.red;
              return (
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:10.5,color:G.text}}>{k.nombre}</span>
                    <span style={{fontSize:10.5,fontWeight:700,color:col,fontFamily:"monospace"}}>{k.valor}{k.unidad}</span>
                  </div>
                  <div style={{height:4,background:G.bg,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:col,borderRadius:2}}/>
                  </div>
                </div>
              );
            })}
            <button onClick={()=>setMod("kpis")} style={{background:"none",border:"none",color:G.green,fontSize:11,cursor:"pointer",fontWeight:600,marginTop:4,padding:0}}>Actualizar KPIs →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROVEEDORES ────────────────────────────────────────────
function Proveedores({proveedores, setProveedores}) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef();
  const total = proveedores.reduce((a,b)=>a+b.m,0);

  const filtered = proveedores.filter(p=>p.p.toLowerCase().includes(search.toLowerCase()));

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length === 0) { setUploadMsg("❌ No se encontraron datos válidos en el archivo."); setUploading(false); return; }
        setProveedores(rows);
        setUploadMsg(`✅ ${rows.length} proveedores cargados · Total: ${fmt$(rows.reduce((a,b)=>a+b.m,0))}`);
      } catch { setUploadMsg("❌ Error al leer el archivo."); }
      setUploading(false);
    };
    reader.readAsText(file, "ISO-8859-1");
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <h2 style={{color:G.greenL,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Base de Datos</h2>
          <h1 style={{color:G.text,fontSize:24,fontWeight:800,margin:0}}>Proveedores</h1>
          <p style={{color:G.muted,fontSize:12,margin:"4px 0 0"}}>{proveedores.length} proveedores · {fmt$(total)} gasto total</p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{display:"none"}}/>
          <Btn onClick={()=>fileRef.current?.click()} variant="ghost" size="sm">📁 Importar CSV</Btn>
        </div>
      </div>

      {uploadMsg && (
        <div style={{background:uploadMsg.startsWith("✅")?G.green+"11":G.red+"11",border:`1px solid ${uploadMsg.startsWith("✅")?G.green:G.red}44`,borderRadius:8,padding:"10px 14px",fontSize:12.5,color:uploadMsg.startsWith("✅")?G.green:G.red}}>
          {uploadMsg}
        </div>
      )}

      {/* Search */}
      <div style={{position:"relative"}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:G.muted,fontSize:14}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar proveedor..." style={{width:"100%",background:G.card,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 12px 9px 36px",color:G.text,fontSize:13,outline:"none",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor=G.green} onBlur={e=>e.target.style.borderColor=G.border}/>
      </div>

      {/* Table */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:G.bg}}>
              {["#","Proveedor","Monto Enero","% del Total","Concentración Acum.","Importancia"].map(h=>(
                <th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10.5,fontWeight:600,color:G.muted,letterSpacing:0.5,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i)=>{
              const rank = proveedores.indexOf(p)+1;
              const pct = (p.m/total)*100;
              const cumPct = proveedores.slice(0,rank).reduce((a,b)=>a+(b.m/total)*100,0);
              const imp = rank<=3?"Crítico":rank<=10?"Alto":rank<=25?"Medio":"Bajo";
              const impColor = rank<=3?G.red:rank<=10?G.amber:rank<=25?"#EAB308":G.muted;
              return (
                <tr key={i} style={{borderTop:`1px solid ${G.border}`,transition:"background 0.1s",cursor:"default"}}
                  onMouseEnter={e=>e.currentTarget.style.background=G.hover}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"9px 14px",fontSize:12,fontWeight:700,color:rank<=3?G.amber:G.muted}}>{rank}</td>
                  <td style={{padding:"9px 14px",fontSize:12,fontWeight:rank<=5?700:400,color:G.text,maxWidth:280}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {rank===1&&<span>🥇</span>}{rank===2&&<span>🥈</span>}{rank===3&&<span>🥉</span>}
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.p}</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 14px",fontSize:12,fontWeight:700,color:G.green,fontFamily:"monospace"}}>{fmt$(p.m)}</td>
                  <td style={{padding:"9px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:64,height:5,background:G.bg,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(pct/12*100,100)}%`,background:rank<=3?G.red:rank<=10?G.amber:G.green,borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10.5,color:G.muted,fontFamily:"monospace"}}>{pct.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 14px",fontSize:11,fontFamily:"monospace",color:cumPct>80?G.red:cumPct>50?G.amber:G.green,fontWeight:600}}>{cumPct.toFixed(1)}%</td>
                  <td style={{padding:"9px 14px"}}><Badge label={imp} color={impColor}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ÓRDENES DE COMPRA ──────────────────────────────────────
function Ordenes({ordenes, setOrdenes, proveedores}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("Todas");
  const [selected, setSelected] = useState(null);
  const blank = {proveedor:"",categoria:"",monto:"",finca:"",descripcion:"",prioridad:"Media"};
  const [form, setForm] = useState(blank);
  const f = v => ({...form, ...v});

  const filtered = filter==="Todas" ? ordenes : ordenes.filter(o=>o.estado===filter);

  function submit(e) {
    e.preventDefault();
    const nueva = {...form, id:`OC-${uid()}`, estado:"Borrador", fecha:new Date().toISOString().slice(0,10), solicitante:"José Vargas", monto:parseFloat(form.monto)||0};
    setOrdenes([nueva,...ordenes]);
    setForm(blank); setShowForm(false);
  }

  function cambiarEstado(id, nuevoEstado) {
    setOrdenes(ordenes.map(o=>o.id===id?{...o,estado:nuevoEstado}:o));
    if (selected?.id===id) setSelected(s=>({...s,estado:nuevoEstado}));
  }

  function eliminar(id) {
    setOrdenes(ordenes.filter(o=>o.id!==id));
    if (selected?.id===id) setSelected(null);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <h2 style={{color:G.greenL,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Gestión</h2>
          <h1 style={{color:G.text,fontSize:24,fontWeight:800,margin:0}}>Órdenes de Compra</h1>
          <p style={{color:G.muted,fontSize:12,margin:"4px 0 0"}}>{ordenes.length} órdenes · {ordenes.filter(o=>o.estado==="Pendiente Aprobación").length} pendientes</p>
        </div>
        <Btn onClick={()=>setShowForm(true)}>+ Nueva Orden</Btn>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {["Todas",...ESTADOS_OC].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{background:filter===s?G.green+"22":G.card,border:`1px solid ${filter===s?G.green:G.border}`,borderRadius:18,padding:"4px 12px",fontSize:11,color:filter===s?G.green:G.muted,cursor:"pointer",fontWeight:filter===s?700:400}}>
            {s} {s!=="Todas"&&<span style={{opacity:0.7}}>({ordenes.filter(o=>o.estado===s).length})</span>}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:selected?"1fr 340px":"1fr",gap:16}}>
        {/* Lista */}
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:G.bg}}>
                {["ID","Proveedor","Categoría","Monto","Finca","Estado","Fecha"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:600,color:G.muted,textTransform:"uppercase",letterSpacing:0.5,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o,i)=>(
                <tr key={i} onClick={()=>setSelected(selected?.id===o.id?null:o)} style={{borderTop:`1px solid ${G.border}`,cursor:"pointer",background:selected?.id===o.id?G.hover:"transparent",transition:"background 0.1s"}}
                  onMouseEnter={e=>{if(selected?.id!==o.id)e.currentTarget.style.background=G.hover+"88"}}
                  onMouseLeave={e=>{if(selected?.id!==o.id)e.currentTarget.style.background="transparent"}}>
                  <td style={{padding:"9px 12px",fontSize:10.5,fontFamily:"monospace",color:G.green,fontWeight:700}}>{o.id}</td>
                  <td style={{padding:"9px 12px",fontSize:11,color:G.text,maxWidth:180}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.proveedor}</div></td>
                  <td style={{padding:"9px 12px",fontSize:10.5,color:G.muted}}>{o.categoria}</td>
                  <td style={{padding:"9px 12px",fontSize:11,fontWeight:700,color:G.green,fontFamily:"monospace"}}>{fmt$(o.monto)}</td>
                  <td style={{padding:"9px 12px"}}><Badge label={o.finca} color={G.blue}/></td>
                  <td style={{padding:"9px 12px"}}><Pill v={o.estado}/></td>
                  <td style={{padding:"9px 12px",fontSize:10.5,color:G.muted}}>{o.fecha}</td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={7} style={{padding:"32px",textAlign:"center",color:G.muted,fontSize:13}}>No hay órdenes con este filtro.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:"20px",display:"flex",flexDirection:"column",gap:14,alignSelf:"start"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:1}}>Detalle</div><div style={{fontSize:14,fontWeight:800,color:G.green,fontFamily:"monospace"}}>{selected.id}</div></div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:G.muted,fontSize:18,cursor:"pointer"}}>×</button>
            </div>
            <Pill v={selected.estado}/>
            {[["Proveedor",selected.proveedor],["Categoría",selected.categoria],["Monto",fmt$(selected.monto)],["Finca",selected.finca],["Fecha",selected.fecha],["Solicitante",selected.solicitante],["Prioridad",selected.prioridad]].map(([l,v])=>(
              <div key={l} style={{borderBottom:`1px solid ${G.border}`,paddingBottom:8}}>
                <div style={{fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>{l}</div>
                <div style={{fontSize:12.5,color:G.text,fontWeight:500}}>{v}</div>
              </div>
            ))}
            {selected.descripcion&&<div><div style={{fontSize:10,color:G.muted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>Descripción</div><div style={{fontSize:12,color:G.text,lineHeight:1.5}}>{selected.descripcion}</div></div>}
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
              {selected.estado==="Borrador"&&<Btn onClick={()=>cambiarEstado(selected.id,"Pendiente Aprobación")} variant="ghost" size="sm">📤 Enviar a Aprobación</Btn>}
              {selected.estado==="Pendiente Aprobación"&&<>
                <Btn onClick={()=>cambiarEstado(selected.id,"Aprobada")} size="sm">✅ Aprobar</Btn>
                <Btn onClick={()=>cambiarEstado(selected.id,"Rechazada")} variant="danger" size="sm">❌ Rechazar</Btn>
              </>}
              {selected.estado==="Aprobada"&&<Btn onClick={()=>cambiarEstado(selected.id,"Recibida")} variant="amber" size="sm">📦 Marcar Recibida</Btn>}
              <Btn onClick={()=>eliminar(selected.id)} variant="danger" size="sm">🗑 Eliminar</Btn>
            </div>
          </div>
        )}
      </div>

      {/* New OC modal */}
      {showForm && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:G.panel,border:`1px solid ${G.border}`,borderRadius:16,padding:"28px 32px",maxWidth:520,width:"92%",boxShadow:"0 24px 64px rgba(0,0,0,0.5)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <h3 style={{color:G.text,fontSize:16,fontWeight:800,margin:0}}>+ Nueva Orden de Compra</h3>
              <button onClick={()=>setShowForm(false)} style={{background:"none",border:"none",color:G.muted,fontSize:20,cursor:"pointer"}}>×</button>
            </div>
            <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
              <Input label="Proveedor" value={form.proveedor} onChange={v=>setForm(f({proveedor:v}))} placeholder="Nombre del proveedor" required
                options={proveedores.slice(0,20).map(p=>p.p)} />
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Categoría" value={form.categoria} onChange={v=>setForm(f({categoria:v}))} options={CATEGORIAS} required/>
                <Input label="Monto USD" value={form.monto} onChange={v=>setForm(f({monto:v}))} type="number" placeholder="0.00" required/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Finca" value={form.finca} onChange={v=>setForm(f({finca:v}))} options={FINCAS} required/>
                <Input label="Prioridad" value={form.prioridad} onChange={v=>setForm(f({prioridad:v}))} options={["Alta","Media","Baja"]}/>
              </div>
              <Input label="Descripción" value={form.descripcion} onChange={v=>setForm(f({descripcion:v}))} rows={3} placeholder="Detalle de la compra..."/>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
                <Btn onClick={()=>setShowForm(false)} variant="ghost">Cancelar</Btn>
                <Btn type="submit">Crear Borrador</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPIs ──────────────────────────────────────────────────
function KPIs({kpis, setKpis}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = {nombre:"",valor:"",meta:"",tendencia:"",area:"Supply Chain",unidad:"%",nota:""};
  const [form, setForm] = useState(blank);
  const f = v => ({...form,...v});

  function submit(e) {
    e.preventDefault();
    const kpi = {...form, valor:parseFloat(form.valor), meta:parseFloat(form.meta), tendencia:parseFloat(form.tendencia)||0, fecha:new Date().toISOString().slice(0,10)};
    if (editing) {
      setKpis(kpis.map(k=>k.id===editing?{...kpi,id:editing}:k));
      setEditing(null);
    } else {
      setKpis([{...kpi,id:uid()},...kpis]);
    }
    setForm(blank); setShowForm(false);
  }

  function edit(k) { setEditing(k.id); setForm({...k,valor:String(k.valor),meta:String(k.meta),tendencia:String(k.tendencia)}); setShowForm(true); }
  function del(id) { setKpis(kpis.filter(k=>k.id!==id)); }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <h2 style={{color:G.greenL,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Gestión</h2>
          <h1 style={{color:G.text,fontSize:24,fontWeight:800,margin:0}}>KPIs Corporativos</h1>
          <p style={{color:G.muted,fontSize:12,margin:"4px 0 0"}}>{kpis.length} indicadores · Actualiza los valores semanalmente</p>
        </div>
        <Btn onClick={()=>{setEditing(null);setForm(blank);setShowForm(true)}}>+ Agregar KPI</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {kpis.map(k=>{
          const pct = k.valor/k.meta*100;
          const col = pct>=100?G.green:pct>=92?G.amber:G.red;
          const up = k.tendencia>=0;
          return (
            <div key={k.id} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:"16px 18px",borderLeft:`4px solid ${col}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:11,color:G.muted,textTransform:"uppercase",letterSpacing:0.8}}>{k.area}</div>
                  <div style={{fontSize:14,fontWeight:700,color:G.text,marginTop:2}}>{k.nombre}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>edit(k)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:14,padding:2}}>✏️</button>
                  <button onClick={()=>del(k.id)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:14,padding:2}}>🗑</button>
                </div>
              </div>
              <div style={{fontSize:28,fontWeight:800,color:col,fontFamily:"monospace"}}>{k.valor}{k.unidad}</div>
              <div style={{fontSize:10.5,color:G.muted,margin:"4px 0 10px"}}>Meta: {k.meta}{k.unidad} · <span style={{color:up?G.green:G.red,fontWeight:600}}>{up?"▲":"▼"} {Math.abs(k.tendencia)}{Math.abs(k.tendencia)>10?"":"pp"}</span></div>
              <div style={{height:5,background:G.bg,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:col,borderRadius:3,transition:"width 0.6s"}}/>
              </div>
              {k.nota&&<div style={{fontSize:10,color:G.muted,marginTop:6,fontStyle:"italic"}}>📝 {k.nota}</div>}
            </div>
          );
        })}
      </div>

      {showForm && (
        <div onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setEditing(null);}}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:G.panel,border:`1px solid ${G.border}`,borderRadius:16,padding:"28px 32px",maxWidth:480,width:"92%"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
              <h3 style={{color:G.text,fontSize:15,fontWeight:800,margin:0}}>{editing?"Editar":"Nuevo"} KPI</h3>
              <button onClick={()=>{setShowForm(false);setEditing(null);}} style={{background:"none",border:"none",color:G.muted,fontSize:20,cursor:"pointer"}}>×</button>
            </div>
            <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <Input label="Nombre KPI" value={form.nombre} onChange={v=>setForm(f({nombre:v}))} placeholder="ej. OTIF" required/>
                <Input label="Área" value={form.area} onChange={v=>setForm(f({area:v}))} options={AREAS}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <Input label="Valor actual" value={form.valor} onChange={v=>setForm(f({valor:v}))} type="number" placeholder="94" required/>
                <Input label="Meta" value={form.meta} onChange={v=>setForm(f({meta:v}))} type="number" placeholder="95" required/>
                <Input label="Tendencia %" value={form.tendencia} onChange={v=>setForm(f({tendencia:v}))} type="number" placeholder="1.2"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:12}}>
                <Input label="Unidad" value={form.unidad} onChange={v=>setForm(f({unidad:v}))} placeholder="%, días, USD"/>
                <Input label="Nota" value={form.nota} onChange={v=>setForm(f({nota:v}))} placeholder="Comentario opcional"/>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:6}}>
                <Btn onClick={()=>{setShowForm(false);setEditing(null);}} variant="ghost">Cancelar</Btn>
                <Btn type="submit">{editing?"Guardar cambios":"Agregar KPI"}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANÁLISIS ──────────────────────────────────────────────
function Analisis({proveedores}) {
  const total = proveedores.reduce((a,b)=>a+b.m,0);
  const cats = {};
  proveedores.forEach(p => {
    const n = p.p.toLowerCase();
    let c = "Otros";
    if (/quimic|agroquim|fitosan|fertil|agripac|haifa|calpaci|agroins|eurofert|ecuaquimica/.test(n)) c="Agroquímicos";
    else if (/papel|pack|carton|empaque|koen|decowrap|conversa|moverprint|ecuagropack|in car palm/.test(n)) c="Empaques";
    else if (/flor|flower|rodel|proflower|flodecol|distriflorka|everflor/.test(n)) c="Insumos Florales";
    else if (/semilla|insusemilla|cultivo|corpcultivo|agritop|hortishop|koppert/.test(n)) c="Insumos Agrícolas";
    else if (/riego|dripec|coldchain|tellusec/.test(n)) c="Riego/Tec.";
    cats[c] = (cats[c]||0) + p.m;
  });
  const catArr = Object.entries(cats).map(([k,v])=>({cat:k,monto:v,pct:v/total*100})).sort((a,b)=>b.monto-a.monto);
  const catColors = {Agroquímicos:G.green,Empaques:G.blue,"Insumos Florales":"#EC4899","Insumos Agrícolas":G.purple,"Riego/Tec.":"#06B6D4",Otros:G.muted};

  const paretoData = [1,3,5,10,20,30].map(n=>({n,total:proveedores.slice(0,n).reduce((a,b)=>a+b.m,0),pct:proveedores.slice(0,n).reduce((a,b)=>a+b.m,0)/total*100}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <h2 style={{color:G.greenL,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Inteligencia de Compras</h2>
        <h1 style={{color:G.text,fontSize:24,fontWeight:800,margin:0}}>Análisis de Procurement</h1>
        <p style={{color:G.muted,fontSize:12,margin:"4px 0 0"}}>Pareto · Concentración · Categorías · Riesgos</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Pareto */}
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"20px 22px"}}>
          <h3 style={{color:G.text,fontSize:13,fontWeight:700,margin:"0 0 16px"}}>Curva de Pareto — Concentración</h3>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {paretoData.map((d,i)=>{
              const risk = d.pct>80?"Crítico":d.pct>60?"Alto":d.pct>40?"Medio":"Normal";
              const rCol = d.pct>80?G.red:d.pct>60?G.amber:d.pct>40?"#EAB308":G.green;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:G.text,width:120,flexShrink:0}}>Top {d.n} proveedor{d.n>1?"es":""}</span>
                  <div style={{flex:1,height:20,background:G.bg,borderRadius:4,overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${d.pct}%`,background:rCol,borderRadius:4,display:"flex",alignItems:"center",paddingLeft:6,transition:"width 0.8s ease"}}>
                      <span style={{fontSize:9.5,color:"#0F1A0F",fontWeight:700}}>{d.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Badge label={risk} color={rCol}/>
                  <span style={{fontSize:10.5,color:G.muted,fontFamily:"monospace",width:60,textAlign:"right",flexShrink:0}}>{fmt$(d.total)}</span>
                </div>
              );
            })}
          </div>
          <div style={{background:G.amber+"11",border:`1px solid ${G.amber}33`,borderRadius:8,padding:"10px 12px",marginTop:14,fontSize:11.5,color:G.amber}}>
            ⚠️ Top 10 = {proveedores.slice(0,10).reduce((a,b)=>a+b.m,0)/total*100 .toFixed(1)}% del gasto — recomendado: ≤40%
          </div>
        </div>

        {/* Categorías */}
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"20px 22px"}}>
          <h3 style={{color:G.text,fontSize:13,fontWeight:700,margin:"0 0 16px"}}>Gasto por Categoría</h3>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {catArr.map((c,i)=>(
              <div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:G.text,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:catColors[c.cat]||G.muted,display:"inline-block"}}/>
                    {c.cat}
                  </span>
                  <div style={{display:"flex",gap:8}}>
                    <span style={{fontSize:11,fontWeight:700,color:catColors[c.cat]||G.muted,fontFamily:"monospace"}}>{fmt$(c.monto)}</span>
                    <span style={{fontSize:11,color:G.muted}}>{c.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{height:7,background:G.bg,borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(c.pct/catArr[0].pct)*100}%`,background:catColors[c.cat]||G.muted,borderRadius:4}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hallazgos */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:"20px 22px"}}>
        <h3 style={{color:G.text,fontSize:13,fontWeight:700,margin:"0 0 14px"}}>💡 Hallazgos y Recomendaciones</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[
            {icon:"🔴",t:"Alta dependencia individual",d:`${proveedores[0]?.p.split(" ").slice(0,2).join(" ")} representa el ${((proveedores[0]?.m||0)/total*100).toFixed(1)}% del gasto. Evaluar proveedor alternativo.`,c:G.red},
            {icon:"🟡",t:"Oportunidad negociación anual",d:"Top 3 proveedores = 25.9% del gasto. Negociar contratos anuales con descuento por volumen (est. 5-8% ahorro).",c:G.amber},
            {icon:"🟢",t:"Buena diversificación base",d:`${proveedores.length} proveedores activos. El ${(100-(proveedores.slice(0,10).reduce((a,b)=>a+b.m,0)/total*100)).toFixed(0)}% del gasto está distribuido en ${proveedores.length-10} proveedores de menor riesgo.`,c:G.green},
          ].map((h,i)=>(
            <div key={i} style={{background:G.bg,borderRadius:10,padding:"14px 16px",borderLeft:`3px solid ${h.c}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:16}}>{h.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:G.text}}>{h.t}</span>
              </div>
              <p style={{fontSize:11,color:G.muted,lineHeight:1.6,margin:0}}>{h.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [mod, setMod] = useState("dashboard");
  const [proveedores, setProveedoresRaw, provReady] = useStorage("hv360_proveedores", SEED_PROVEEDORES);
  const [ordenes, setOrdenesRaw, ocReady] = useStorage("hv360_ordenes", SEED_ORDENES);
  const [kpis, setKpisRaw, kpiReady] = useStorage("hv360_kpis", SEED_KPIS);

  const setProveedores = useCallback(v => setProveedoresRaw(v), [setProveedoresRaw]);
  const setOrdenes = useCallback(v => setOrdenesRaw(v), [setOrdenesRaw]);
  const setKpis = useCallback(v => setKpisRaw(v), [setKpisRaw]);

  const ready = provReady && ocReady && kpiReady;

  const nav = [
    {id:"dashboard",label:"Dashboard",icon:"⬛"},
    {id:"proveedores",label:"Proveedores",icon:"🏭"},
    {id:"ordenes",label:"Órdenes OC",icon:"📋",badge:ordenes.filter(o=>o.estado==="Pendiente Aprobación").length},
    {id:"kpis",label:"KPIs",icon:"🎯"},
    {id:"analisis",label:"Análisis",icon:"📊"},
  ];

  const views = {
    dashboard: <Dashboard proveedores={proveedores} ordenes={ordenes} kpis={kpis} setMod={setMod}/>,
    proveedores: <Proveedores proveedores={proveedores} setProveedores={setProveedores}/>,
    ordenes: <Ordenes ordenes={ordenes} setOrdenes={setOrdenes} proveedores={proveedores}/>,
    kpis: <KPIs kpis={kpis} setKpis={setKpis}/>,
    analisis: <Analisis proveedores={proveedores}/>,
  };

  if (!ready) return (
    <div style={{background:G.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:G.green,fontSize:14,display:"flex",alignItems:"center",gap:10}}>
        <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🌿</span> Cargando sistema...
      </div>
    </div>
  );

  return (
    <div style={{background:G.bg,minHeight:"100vh",color:G.text,fontFamily:"'Inter','Segoe UI',sans-serif",display:"flex"}}>
      {/* Sidebar */}
      <aside style={{width:220,background:G.panel,borderRight:`1px solid ${G.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:100}}>
        {/* Logo */}
        <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:G.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🌿</div>
            <div>
              <div style={{fontWeight:800,fontSize:13.5,color:G.text,lineHeight:1}}>Hoja Verde</div>
              <div style={{fontSize:11,color:G.green,fontWeight:600}}>360° Procurement</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:2}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setMod(n.id)} style={{background:mod===n.id?G.green+"18":"transparent",border:`1px solid ${mod===n.id?G.green+"44":"transparent"}`,borderRadius:8,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",transition:"all 0.12s"}}
              onMouseEnter={e=>{if(mod!==n.id)e.currentTarget.style.background=G.hover}}
              onMouseLeave={e=>{if(mod!==n.id)e.currentTarget.style.background="transparent"}}>
              <span style={{fontSize:15}}>{n.icon}</span>
              <span style={{fontSize:12.5,fontWeight:mod===n.id?700:400,color:mod===n.id?G.greenL:G.muted}}>{n.label}</span>
              {n.badge>0 && <span style={{marginLeft:"auto",background:G.amber,color:"#0F1A0F",fontSize:10,fontWeight:800,borderRadius:10,padding:"1px 7px"}}>{n.badge}</span>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{padding:"14px 18px",borderTop:`1px solid ${G.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:G.green,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,color:"#0F1A0F",flexShrink:0}}>JV</div>
          <div>
            <div style={{fontSize:11.5,fontWeight:600,color:G.text}}>José Vargas</div>
            <div style={{fontSize:10,color:G.muted}}>Supply Chain</div>
          </div>
          <div style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:G.green}}/>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,marginLeft:220,padding:"28px 32px",minHeight:"100vh",maxWidth:"calc(100vw - 220px)"}}>
        {/* Top bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,paddingBottom:16,borderBottom:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {nav.find(n=>n.id===mod)?.icon && <span style={{fontSize:18}}>{nav.find(n=>n.id===mod).icon}</span>}
            <div style={{fontSize:11,color:G.muted}}>Sistema de Procurement · {fmtDate()}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:G.green,boxShadow:`0 0 8px ${G.green}`}}/>
            <span style={{fontSize:10.5,color:G.green,fontWeight:600}}>Sistema activo</span>
          </div>
        </div>

        {views[mod] || <Dashboard proveedores={proveedores} ordenes={ordenes} kpis={kpis} setMod={setMod}/>}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${G.bg}; }
        ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 4px; }
        select option { background: ${G.panel}; color: ${G.text}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
