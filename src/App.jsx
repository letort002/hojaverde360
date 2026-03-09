import { useState, useCallback, useMemo, useRef } from "react";

// ─────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────
const PASSWORD = "hojaverde2026";
const VERDE = "#22C55E";
const VERDE_D = "#16A34A";
const AMBER = "#F59E0B";
const ROJO = "#EF4444";
const AZUL = "#3B82F6";
const BG = "#0F1A0F";
const PANEL = "#141F14";
const CARD = "#1A271A";
const BORDE = "#2A3D2A";
const HOVER = "#223022";
const TEXTO = "#E8F5E9";
const GRIS = "#6B8F6B";

const MESES_LISTA = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CATEGORIAS = ["Agroquímicos","Empaques","Insumos Florales","Fertilizantes","Servicios Técnicos","Transporte","Otros"];
const FINCAS = ["HV","FM","JG","CM"];
const AREAS = ["Supply Chain","Comercial","Técnica","Calidad","Finanzas","Talento Humano","Sostenibilidad"];
const ESTADOS = ["Borrador","Pendiente Aprobación","Aprobada","Rechazada","Recibida"];

function fmt$(v) {
  if (v >= 1e6) return `$${(v/1e6).toFixed(2)}M`;
  if (v >= 1000) return `$${(v/1000).toFixed(1)}K`;
  return `$${Number(v).toLocaleString("es-EC", {minimumFractionDigits:2})}`;
}
function uid() { return Math.random().toString(36).slice(2,9).toUpperCase(); }
function hoy() { return new Date().toLocaleDateString("es-EC",{day:"2-digit",month:"short",year:"numeric"}); }
function diasDesde(fecha) { return Math.floor((Date.now() - new Date(fecha)) / 86400000); }

// ─────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────
function useGuardar(clave, inicial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(clave);
      return s ? JSON.parse(s) : inicial;
    } catch { return inicial; }
  });
  const guardar = useCallback((nuevo) => {
    setVal(nuevo);
    try { localStorage.setItem(clave, JSON.stringify(nuevo)); } catch {}
  }, [clave]);
  return [val, guardar];
}

// ─────────────────────────────────────────────
//  DATOS SEMILLA
// ─────────────────────────────────────────────
const PROVEEDORES_ENERO = [
  {p:"Megastockec Distribuidora Agrícola S.A.",m:59785.83},
  {p:"Papelera Nacional S.A.",m:39816.00},
  {p:"Fito Sanitario Fitosan S.A.",m:33647.00},
  {p:"Vallejo Mosquera Enrique Francisco",m:24003.60},
  {p:"Ecuaquimica Ecuatoriana De Productos Quimicos Ca",m:22776.87},
  {p:"Corporación Internacional de Cultivos Corpcultivos",m:21707.66},
  {p:"Paillacho Marmol Diego Fernando",m:16376.30},
  {p:"Almeida Davalos Diego Joel",m:14667.95},
  {p:"Crait Cía. Ltda.",m:14381.54},
  {p:"Fertilizantes Y Agroquímicos Europeos Eurofert S.A.",m:14353.00},
  {p:"Alexis Mejía Representaciones Cía. Ltda.",m:13722.28},
  {p:"Amc Ecuador Cía. Ltda.",m:12609.23},
  {p:"Rodel Flowers Cía.Ltda.",m:11871.10},
  {p:"Agripac S.A.",m:11595.55},
  {p:"Quimicolours S.A.",m:10288.34},
  {p:"Everflor Ecuador S.A.",m:10207.06},
  {p:"Naviagroec S.A.S.",m:10112.50},
  {p:"Importagriflor Cía.Ltda.",m:9427.16},
  {p:"Insumos Químicos Santander Insuquimsa Cía. Ltda.",m:8024.35},
  {p:"Sociedad Civil y Comercial Innovaplast del Ecuador",m:6904.98},
];

function ocSemilla() {
  return [
    {id:"OC-"+uid(),proveedor:"Megastockec Distribuidora Agrícola S.A.",categoria:"Agroquímicos",monto:12450,finca:"HV",estado:"Aprobada",fecha:"2026-01-15",solicitante:"José Vargas",descripcion:"Fungicidas Q1",prioridad:"Alta"},
    {id:"OC-"+uid(),proveedor:"Papelera Nacional S.A.",categoria:"Empaques",monto:8320,finca:"FM",estado:"Pendiente Aprobación",fecha:"2026-01-20",solicitante:"José Vargas",descripcion:"Cajas semana 10",prioridad:"Media"},
    {id:"OC-"+uid(),proveedor:"Rodel Flowers Cía.Ltda.",categoria:"Insumos Florales",monto:18900,finca:"CM",estado:"Pendiente Aprobación",fecha:"2026-01-28",solicitante:"José Vargas",descripcion:"Material vegetal",prioridad:"Alta"},
    {id:"OC-"+uid(),proveedor:"Crait Cía. Ltda.",categoria:"Servicios Técnicos",monto:3200,finca:"HV",estado:"Borrador",fecha:"2026-03-01",solicitante:"José Vargas",descripcion:"Mantenimiento riego",prioridad:"Baja"},
  ];
}

function kpisSemilla() {
  return [
    {id:uid(),nombre:"OTIF",valor:94,meta:95,tendencia:1,area:"Supply Chain",unidad:"%",nota:""},
    {id:uid(),nombre:"Fill Rate",valor:96.2,meta:95,tendencia:0.8,area:"Supply Chain",unidad:"%",nota:""},
    {id:uid(),nombre:"MAPE Forecast",valor:12.4,meta:15,tendencia:-1.8,area:"Supply Chain",unidad:"%",nota:"Mejora sostenida"},
    {id:uid(),nombre:"OTIF Proveedores",valor:88.5,meta:92,tendencia:-1.2,area:"Supply Chain",unidad:"%",nota:"Revisar Papelera"},
    {id:uid(),nombre:"Cobertura Inventario",valor:28,meta:30,tendencia:2,area:"Supply Chain",unidad:" días",nota:""},
    {id:uid(),nombre:"Costo por Tallo",valor:0.38,meta:0.40,tendencia:-2,area:"Sostenibilidad",unidad:" USD",nota:""},
  ];
}

// ─────────────────────────────────────────────
//  PARSEAR CSV
// ─────────────────────────────────────────────
function parsearCSV(texto) {
  const lineas = texto.split(/\r?\n/).filter(l => l.trim());
  const sep = lineas[0].includes(";") ? ";" : ",";
  const resultado = [];
  for (const linea of lineas.slice(1)) {
    const partes = linea.split(sep);
    if (partes.length < 2) continue;
    const p = partes[0].trim();
    const raw = partes[1].trim().replace(/\$/g,"").replace(/\./g,"").replace(",",".");
    const m = parseFloat(raw);
    if (p && !isNaN(m) && m > 0) resultado.push({p, m});
  }
  return resultado.sort((a,b) => b.m - a.m);
}

// ─────────────────────────────────────────────
//  COMPONENTES BASE
// ─────────────────────────────────────────────
function Pastilla({v}) {
  const colores = {
    "Aprobada": [VERDE, "#14271C"],
    "Pendiente Aprobación": [AMBER, "#271F0A"],
    "Rechazada": [ROJO, "#270A0A"],
    "Borrador": [GRIS, CARD],
    "Recibida": [AZUL, "#0A1427"],
  };
  const [col, bg] = colores[v] || [GRIS, CARD];
  return (
    <span style={{background:bg, color:col, border:`1px solid ${col}44`, fontSize:10, padding:"2px 9px", borderRadius:10, fontWeight:700}}>
      {v}
    </span>
  );
}

function Etiqueta({texto, color=VERDE}) {
  return (
    <span style={{background:color+"22", color, fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:700, whiteSpace:"nowrap"}}>
      {texto}
    </span>
  );
}

function Campo({label, valor, onChange, tipo="text", placeholder="", requerido, opciones, filas}) {
  const estiloInput = {background:CARD, border:`1px solid ${BORDE}`, borderRadius:8, padding:"8px 12px", color:TEXTO, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit"};
  return (
    <div style={{display:"flex", flexDirection:"column", gap:5}}>
      {label && (
        <label style={{fontSize:11, fontWeight:600, color:GRIS, textTransform:"uppercase", letterSpacing:0.8}}>
          {label}{requerido && <span style={{color:AMBER}}> *</span>}
        </label>
      )}
      {opciones ? (
        <select value={valor} onChange={e => onChange(e.target.value)} style={estiloInput}>
          <option value="">Seleccionar...</option>
          {opciones.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : filas ? (
        <textarea value={valor} onChange={e => onChange(e.target.value)} rows={filas} placeholder={placeholder} style={{...estiloInput, resize:"vertical"}} />
      ) : (
        <input type={tipo} value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={requerido} style={estiloInput}
          onFocus={e => e.target.style.borderColor = VERDE}
          onBlur={e => e.target.style.borderColor = BORDE} />
      )}
    </div>
  );
}

function Boton({children, onClick, variante="primario", tamanio="md", disabled, tipo="button"}) {
  const estilos = {
    primario: {background:VERDE, color:"#0F1A0F", border:"none"},
    ghost: {background:"transparent", color:TEXTO, border:`1px solid ${BORDE}`},
    peligro: {background:ROJO+"22", color:ROJO, border:`1px solid ${ROJO}44`},
    naranja: {background:AMBER+"22", color:AMBER, border:`1px solid ${AMBER}44`},
  };
  const tamanios = {
    sm: {padding:"4px 12px", fontSize:11},
    md: {padding:"8px 18px", fontSize:12.5},
    lg: {padding:"10px 24px", fontSize:13.5},
  };
  return (
    <button type={tipo} onClick={onClick} disabled={disabled}
      style={{...estilos[variante], ...tamanios[tamanio], borderRadius:8, fontWeight:700, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.5:1, transition:"all 0.15s", display:"inline-flex", alignItems:"center", gap:6}}
      onMouseEnter={e => { if (!disabled && variante==="primario") e.currentTarget.style.background = VERDE_D; }}
      onMouseLeave={e => { if (!disabled && variante==="primario") e.currentTarget.style.background = VERDE; }}>
      {children}
    </button>
  );
}

function TarjetaStat({icono, label, valor, sub, color=VERDE, onClick}) {
  return (
    <div onClick={onClick} style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:12, padding:"16px 18px", cursor:onClick?"pointer":"default", borderTop:`3px solid ${color}`, transition:"background 0.15s"}}
      onMouseEnter={e => { if(onClick) e.currentTarget.style.background = HOVER; }}
      onMouseLeave={e => { e.currentTarget.style.background = CARD; }}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
        <span style={{fontSize:20}}>{icono}</span>
        <span style={{width:8, height:8, borderRadius:"50%", background:color, display:"block", marginTop:4}} />
      </div>
      <div style={{fontSize:24, fontWeight:800, color:TEXTO, fontFamily:"monospace"}}>{valor}</div>
      <div style={{fontSize:11.5, fontWeight:600, color:TEXTO, marginTop:3}}>{label}</div>
      {sub && <div style={{fontSize:10, color:GRIS, marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
function Login({onLogin}) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function intentarLogin(e) {
    e.preventDefault();
    if (pass === PASSWORD) {
      onLogin();
    } else {
      setError("Contraseña incorrecta");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{background:BG, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{width:"100%", maxWidth:380, padding:"0 24px"}}>
        <div style={{textAlign:"center", marginBottom:40}}>
          <div style={{fontSize:52, marginBottom:16}}>🌿</div>
          <h1 style={{color:TEXTO, fontSize:26, fontWeight:800, margin:"0 0 6px"}}>Hoja Verde 360°</h1>
          <p style={{color:GRIS, fontSize:13, margin:0}}>Sistema de Procurement · Grupo Hoja Verde</p>
        </div>
        <form onSubmit={intentarLogin} style={{animation: shake ? "shake 0.4s ease" : "none"}}>
          <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:16, padding:"28px", display:"flex", flexDirection:"column", gap:16}}>
            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              <label style={{fontSize:11, fontWeight:600, color:GRIS, textTransform:"uppercase", letterSpacing:0.8}}>Contraseña</label>
              <input type="password" value={pass} onChange={e => { setPass(e.target.value); setError(""); }} placeholder="••••••••••••" autoFocus
                style={{background:BG, border:`1px solid ${error ? ROJO : BORDE}`, borderRadius:8, padding:"10px 14px", color:TEXTO, fontSize:14, outline:"none", letterSpacing:4}}
                onFocus={e => e.target.style.borderColor = error ? ROJO : VERDE}
                onBlur={e => e.target.style.borderColor = error ? ROJO : BORDE} />
              {error && <span style={{fontSize:11, color:ROJO}}>{error}</span>}
            </div>
            <button type="submit" style={{background:VERDE, color:"#0F1A0F", border:"none", borderRadius:8, padding:11, fontSize:13.5, fontWeight:800, cursor:"pointer", width:"100%"}}
              onMouseEnter={e => e.target.style.background = VERDE_D}
              onMouseLeave={e => e.target.style.background = VERDE}>
              Ingresar →
            </button>
          </div>
        </form>
        <p style={{textAlign:"center", color:GRIS, fontSize:10.5, marginTop:20}}>Acceso restringido · Solo personal autorizado</p>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
//  NOTIFICACIONES
// ─────────────────────────────────────────────
function useAlertas(ordenes) {
  return useMemo(() => {
    const alertas = [];
    ordenes.forEach(o => {
      const dias = diasDesde(o.fecha);
      if (o.estado === "Pendiente Aprobación" && dias >= 3) {
        alertas.push({id: o.id, icono:"⏰", titulo:`OC pendiente hace ${dias} días`, msg:`${o.id} · ${fmt$(o.monto)}`, tipo:"warning", ir:"ordenes"});
      }
      if (o.estado === "Borrador" && dias >= 7) {
        alertas.push({id: o.id+"b", icono:"📝", titulo:`Borrador sin enviar hace ${dias} días`, msg:o.id, tipo:"info", ir:"ordenes"});
      }
    });
    return alertas;
  }, [ordenes]);
}

function PanelAlertas({alertas, onCerrar, onIr}) {
  return (
    <div style={{position:"fixed", top:64, right:20, width:320, background:PANEL, border:`1px solid ${BORDE}`, borderRadius:14, boxShadow:"0 16px 48px rgba(0,0,0,0.5)", zIndex:500}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:`1px solid ${BORDE}`}}>
        <span style={{fontSize:13, fontWeight:700, color:TEXTO}}>🔔 Alertas ({alertas.length})</span>
        <button onClick={onCerrar} style={{background:"none", border:"none", color:GRIS, fontSize:18, cursor:"pointer"}}>×</button>
      </div>
      {alertas.length === 0 ? (
        <div style={{padding:24, textAlign:"center", color:GRIS, fontSize:12}}>✅ Todo al día</div>
      ) : (
        <div style={{maxHeight:300, overflowY:"auto"}}>
          {alertas.map((a, i) => (
            <div key={i} onClick={() => { onIr(a.ir); onCerrar(); }}
              style={{padding:"12px 16px", borderBottom:`1px solid ${BORDE}`, cursor:"pointer"}}
              onMouseEnter={e => e.currentTarget.style.background = HOVER}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{display:"flex", gap:10}}>
                <span style={{fontSize:18, flexShrink:0}}>{a.icono}</span>
                <div>
                  <div style={{fontSize:12, fontWeight:700, color: a.tipo==="warning" ? AMBER : AZUL, marginBottom:3}}>{a.titulo}</div>
                  <div style={{fontSize:11, color:GRIS}}>{a.msg}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({meses, ordenes, kpis, setMod}) {
  const clavesMeses = Object.keys(meses);
  const mesActual = clavesMeses[clavesMeses.length - 1];
  const provs = meses[mesActual] || [];
  const total = provs.reduce((a,b) => a+b.m, 0);
  const pendientes = ordenes.filter(o => o.estado === "Pendiente Aprobación").length;
  const top3pct = total > 0 ? provs.slice(0,3).reduce((a,b) => a+b.m, 0) / total * 100 : 0;
  const criticos = kpis.filter(k => k.valor < k.meta * 0.92).length;
  const maximo = provs[0]?.m || 1;

  const tendencia = clavesMeses.length > 1
    ? (meses[clavesMeses[clavesMeses.length-1]].reduce((a,b)=>a+b.m,0) - meses[clavesMeses[clavesMeses.length-2]].reduce((a,b)=>a+b.m,0))
      / meses[clavesMeses[clavesMeses.length-2]].reduce((a,b)=>a+b.m,0) * 100
    : null;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:24}}>
      <div>
        <div style={{color:"#4ADE80", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Sistema de Procurement</div>
        <h1 style={{color:TEXTO, fontSize:28, fontWeight:800, margin:0}}>Dashboard Principal</h1>
        <p style={{color:GRIS, fontSize:13, margin:"4px 0 0"}}>
          {mesActual} · {hoy()}
          {tendencia !== null && (
            <span style={{marginLeft:12, color: tendencia > 0 ? ROJO : VERDE, fontWeight:600}}>
              {tendencia > 0 ? "▲" : "▼"} {Math.abs(tendencia).toFixed(1)}% vs mes anterior
            </span>
          )}
        </p>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12}}>
        <TarjetaStat icono="💵" label="Gasto Total" valor={fmt$(total)} sub={`${provs.length} proveedores`} color={VERDE} onClick={() => setMod("proveedores")} />
        <TarjetaStat icono="📋" label="OC Pendientes" valor={pendientes} sub="Requieren aprobación" color={pendientes > 0 ? AMBER : VERDE} onClick={() => setMod("ordenes")} />
        <TarjetaStat icono="⚠️" label="Concentración Top 3" valor={`${top3pct.toFixed(1)}%`} sub="Riesgo dependencia" color={top3pct > 25 ? ROJO : AMBER} onClick={() => setMod("analisis")} />
        <TarjetaStat icono="🎯" label="KPIs Críticos" valor={criticos} sub="Por debajo de meta" color={criticos > 0 ? ROJO : VERDE} onClick={() => setMod("kpis")} />
      </div>

      {clavesMeses.length > 1 && (
        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"20px 22px"}}>
          <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 16px"}}>📅 Comparación Mensual</h3>
          <div style={{display:"flex", gap:12, alignItems:"flex-end", height:120}}>
            {clavesMeses.map((clave, i) => {
              const tot = meses[clave].reduce((a,b) => a+b.m, 0);
              const maxTot = Math.max(...clavesMeses.map(c => meses[c].reduce((a,b)=>a+b.m,0)));
              const h = Math.max((tot/maxTot)*100, 10);
              const esUltimo = i === clavesMeses.length - 1;
              return (
                <div key={clave} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex:1}}>
                  <span style={{fontSize:10, fontWeight:700, color:VERDE, fontFamily:"monospace"}}>{fmt$(tot)}</span>
                  <div style={{width:"100%", height:`${h}%`, background: esUltimo ? VERDE : GRIS+"44", borderRadius:"4px 4px 0 0", border:`1px solid ${esUltimo ? VERDE : BORDE}`}} />
                  <span style={{fontSize:10, color: esUltimo ? TEXTO : GRIS, fontWeight: esUltimo ? 700 : 400, textAlign:"center"}}>{clave}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16}}>
        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"20px 22px"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
            <h3 style={{color:TEXTO, fontSize:14, fontWeight:700, margin:0}}>Top 10 Proveedores</h3>
            <button onClick={() => setMod("proveedores")} style={{background:"none", border:"none", color:VERDE, fontSize:11, cursor:"pointer", fontWeight:600}}>Ver todos →</button>
          </div>
          {provs.slice(0,10).map((p, i) => (
            <div key={i} style={{display:"flex", alignItems:"center", gap:8, marginBottom:7}}>
              <span style={{width:20, fontSize:10, color: i<3 ? AMBER : GRIS, fontWeight:700, textAlign:"right", flexShrink:0}}>#{i+1}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:10.5, color:TEXTO, fontWeight: i<3 ? 700 : 400, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.p}</div>
                <div style={{height:5, background:BG, borderRadius:3, marginTop:3, overflow:"hidden"}}>
                  <div style={{height:"100%", width:`${(p.m/maximo)*100}%`, background: i===0 ? AMBER : i<3 ? VERDE : GRIS, borderRadius:3}} />
                </div>
              </div>
              <span style={{fontSize:10.5, fontWeight:700, color:VERDE, flexShrink:0, minWidth:60, textAlign:"right", fontFamily:"monospace"}}>{fmt$(p.m)}</span>
              <span style={{fontSize:9.5, color:GRIS, flexShrink:0, minWidth:32}}>{((p.m/total)*100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"16px 18px", flex:1}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:0}}>Órdenes Recientes</h3>
              <button onClick={() => setMod("ordenes")} style={{background:"none", border:"none", color:VERDE, fontSize:11, cursor:"pointer", fontWeight:600}}>Ver todas →</button>
            </div>
            {ordenes.slice(0,4).map((o, i) => (
              <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom: i<3 ? `1px solid ${BORDE}` : "none"}}>
                <div>
                  <div style={{fontSize:10.5, color:TEXTO, fontWeight:600}}>{o.id}</div>
                  <div style={{fontSize:9.5, color:GRIS}}>{o.proveedor.split(" ").slice(0,3).join(" ")}...</div>
                </div>
                <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3}}>
                  <Pastilla v={o.estado} />
                  <span style={{fontSize:10, color:VERDE, fontFamily:"monospace", fontWeight:700}}>{fmt$(o.monto)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"16px 18px"}}>
            <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 10px"}}>KPIs Estado</h3>
            {kpis.slice(0,4).map((k, i) => {
              const pct = k.valor / k.meta * 100;
              const col = pct >= 100 ? VERDE : pct >= 90 ? AMBER : ROJO;
              return (
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:2}}>
                    <span style={{fontSize:10.5, color:TEXTO}}>{k.nombre}</span>
                    <span style={{fontSize:10.5, fontWeight:700, color:col, fontFamily:"monospace"}}>{k.valor}{k.unidad}</span>
                  </div>
                  <div style={{height:4, background:BG, borderRadius:2, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${Math.min(pct,100)}%`, background:col, borderRadius:2}} />
                  </div>
                </div>
              );
            })}
            <button onClick={() => setMod("kpis")} style={{background:"none", border:"none", color:VERDE, fontSize:11, cursor:"pointer", fontWeight:600, marginTop:4, padding:0}}>Actualizar KPIs →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  PROVEEDORES
// ─────────────────────────────────────────────
function Proveedores({meses, setMeses}) {
  const claves = Object.keys(meses);
  const [mesActivo, setMesActivo] = useState(claves[claves.length-1]);
  const [busqueda, setBusqueda] = useState("");
  const [msgUpload, setMsgUpload] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoMes, setNuevoMes] = useState("");
  const [nuevoAnio, setNuevoAnio] = useState("2026");
  const refArchivo = useRef();

  const provs = meses[mesActivo] || [];
  const total = provs.reduce((a,b) => a+b.m, 0);
  const filtrados = provs.filter(p => p.p.toLowerCase().includes(busqueda.toLowerCase()));

  function cargarArchivo(e) {
    const archivo = e.target.files[0];
    if (!archivo || !nuevoMes) { setMsgUpload("❌ Selecciona el mes primero"); return; }
    const lector = new FileReader();
    lector.onload = ev => {
      const filas = parsearCSV(ev.target.result);
      if (!filas.length) { setMsgUpload("❌ No se encontraron datos válidos"); return; }
      const clave = `${nuevoMes} ${nuevoAnio}`;
      setMeses({...meses, [clave]: filas});
      setMesActivo(clave);
      setMsgUpload(`✅ ${filas.length} proveedores cargados para ${clave}`);
      setModalAbierto(false);
    };
    lector.readAsText(archivo, "ISO-8859-1");
  }

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
        <div>
          <div style={{color:"#4ADE80", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Base de Datos</div>
          <h1 style={{color:TEXTO, fontSize:24, fontWeight:800, margin:0}}>Proveedores</h1>
          <p style={{color:GRIS, fontSize:12, margin:"4px 0 0"}}>{provs.length} proveedores · {fmt$(total)}</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)} tamanio="sm">📁 Subir nuevo mes</Boton>
      </div>

      <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
        {Object.keys(meses).map(m => (
          <button key={m} onClick={() => setMesActivo(m)}
            style={{background: mesActivo===m ? VERDE+"22" : CARD, border:`1px solid ${mesActivo===m ? VERDE : BORDE}`, borderRadius:18, padding:"4px 14px", fontSize:11, color: mesActivo===m ? VERDE : GRIS, cursor:"pointer", fontWeight: mesActivo===m ? 700 : 400}}>
            {m}
          </button>
        ))}
      </div>

      {msgUpload && (
        <div style={{background: msgUpload.startsWith("✅") ? VERDE+"11" : ROJO+"11", border:`1px solid ${msgUpload.startsWith("✅") ? VERDE : ROJO}44`, borderRadius:8, padding:"10px 14px", fontSize:12.5, color: msgUpload.startsWith("✅") ? VERDE : ROJO}}>
          {msgUpload}
        </div>
      )}

      <div style={{position:"relative"}}>
        <span style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:GRIS}}>🔍</span>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar proveedor..."
          style={{width:"100%", background:CARD, border:`1px solid ${BORDE}`, borderRadius:8, padding:"9px 12px 9px 36px", color:TEXTO, fontSize:13, outline:"none", boxSizing:"border-box"}} />
      </div>

      <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:12, overflow:"hidden"}}>
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:BG}}>
              {["#","Proveedor","Monto","% Total","Conc. Acum.","Riesgo"].map(h => (
                <th key={h} style={{padding:"10px 14px", textAlign:"left", fontSize:10.5, fontWeight:600, color:GRIS, textTransform:"uppercase", whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => {
              const rank = provs.indexOf(p) + 1;
              const pct = (p.m/total) * 100;
              const cumPct = provs.slice(0,rank).reduce((a,b) => a + (b.m/total)*100, 0);
              const riesgo = rank<=3 ? "Crítico" : rank<=10 ? "Alto" : rank<=25 ? "Medio" : "Bajo";
              const riesgoColor = rank<=3 ? ROJO : rank<=10 ? AMBER : rank<=25 ? "#EAB308" : GRIS;
              return (
                <tr key={i} style={{borderTop:`1px solid ${BORDE}`}}
                  onMouseEnter={e => e.currentTarget.style.background = HOVER}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{padding:"9px 14px", fontSize:12, fontWeight:700, color: rank<=3 ? AMBER : GRIS}}>{rank}</td>
                  <td style={{padding:"9px 14px", fontSize:12, fontWeight: rank<=5 ? 700 : 400, color:TEXTO, maxWidth:260}}>
                    <div style={{display:"flex", alignItems:"center", gap:6}}>
                      {rank===1 && "🥇"}{rank===2 && "🥈"}{rank===3 && "🥉"}
                      <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{p.p}</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 14px", fontSize:12, fontWeight:700, color:VERDE, fontFamily:"monospace"}}>{fmt$(p.m)}</td>
                  <td style={{padding:"9px 14px"}}>
                    <div style={{display:"flex", alignItems:"center", gap:6}}>
                      <div style={{width:64, height:5, background:BG, borderRadius:3, overflow:"hidden"}}>
                        <div style={{height:"100%", width:`${Math.min(pct/12*100,100)}%`, background: rank<=3 ? ROJO : rank<=10 ? AMBER : VERDE, borderRadius:3}} />
                      </div>
                      <span style={{fontSize:10.5, color:GRIS, fontFamily:"monospace"}}>{pct.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td style={{padding:"9px 14px", fontSize:11, fontFamily:"monospace", color: cumPct>80 ? ROJO : cumPct>50 ? AMBER : VERDE, fontWeight:600}}>{cumPct.toFixed(1)}%</td>
                  <td style={{padding:"9px 14px"}}><Etiqueta texto={riesgo} color={riesgoColor} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div onClick={e => { if(e.target===e.currentTarget) setModalAbierto(false); }}
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{background:PANEL, border:`1px solid ${BORDE}`, borderRadius:16, padding:"28px 32px", maxWidth:400, width:"92%"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:20}}>
              <h3 style={{color:TEXTO, fontSize:15, fontWeight:800, margin:0}}>📁 Subir datos de nuevo mes</h3>
              <button onClick={() => setModalAbierto(false)} style={{background:"none", border:"none", color:GRIS, fontSize:20, cursor:"pointer"}}>×</button>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:14}}>
              <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:10}}>
                <Campo label="Mes" valor={nuevoMes} onChange={setNuevoMes} opciones={MESES_LISTA} />
                <Campo label="Año" valor={nuevoAnio} onChange={setNuevoAnio} tipo="number" placeholder="2026" />
              </div>
              <div style={{background:BG, border:`2px dashed ${BORDE}`, borderRadius:10, padding:20, textAlign:"center"}}>
                <p style={{color:GRIS, fontSize:12, margin:"0 0 10px"}}>Archivo CSV: <code style={{color:VERDE}}>Proveedor ; Monto</code></p>
                <input ref={refArchivo} type="file" accept=".csv,.txt" onChange={cargarArchivo} style={{display:"none"}} />
                <Boton onClick={() => nuevoMes ? refArchivo.current?.click() : setMsgUpload("❌ Selecciona el mes primero")} tamanio="sm">
                  Seleccionar archivo
                </Boton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ÓRDENES
// ─────────────────────────────────────────────
function Ordenes({ordenes, setOrdenes, meses}) {
  const claves = Object.keys(meses);
  const mesActual = claves[claves.length-1];
  const provs = meses[mesActual] || [];
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtro, setFiltro] = useState("Todas");
  const [seleccionada, setSeleccionada] = useState(null);
  const vacío = {proveedor:"", categoria:"", monto:"", finca:"", descripcion:"", prioridad:"Media"};
  const [form, setForm] = useState(vacío);

  const filtradas = filtro === "Todas" ? ordenes : ordenes.filter(o => o.estado === filtro);

  function crearOC(e) {
    e.preventDefault();
    const nueva = {...form, id:"OC-"+uid(), estado:"Borrador", fecha:new Date().toISOString().slice(0,10), solicitante:"José Vargas", monto:parseFloat(form.monto)||0};
    setOrdenes([nueva, ...ordenes]);
    setForm(vacío);
    setModalAbierto(false);
  }

  function cambiarEstado(id, nuevoEstado) {
    setOrdenes(ordenes.map(o => o.id===id ? {...o, estado:nuevoEstado} : o));
    if (seleccionada?.id === id) setSeleccionada(s => ({...s, estado:nuevoEstado}));
  }

  function eliminar(id) {
    setOrdenes(ordenes.filter(o => o.id !== id));
    if (seleccionada?.id === id) setSeleccionada(null);
  }

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
        <div>
          <div style={{color:"#4ADE80", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Gestión</div>
          <h1 style={{color:TEXTO, fontSize:24, fontWeight:800, margin:0}}>Órdenes de Compra</h1>
          <p style={{color:GRIS, fontSize:12, margin:"4px 0 0"}}>{ordenes.length} órdenes · {ordenes.filter(o=>o.estado==="Pendiente Aprobación").length} pendientes</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nueva Orden</Boton>
      </div>

      <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
        {["Todas", ...ESTADOS].map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            style={{background: filtro===s ? VERDE+"22" : CARD, border:`1px solid ${filtro===s ? VERDE : BORDE}`, borderRadius:18, padding:"4px 12px", fontSize:11, color: filtro===s ? VERDE : GRIS, cursor:"pointer", fontWeight: filtro===s ? 700 : 400}}>
            {s} {s!=="Todas" && `(${ordenes.filter(o=>o.estado===s).length})`}
          </button>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns: seleccionada ? "1fr 340px" : "1fr", gap:16}}>
        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:12, overflow:"hidden"}}>
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{background:BG}}>
                {["ID","Proveedor","Categoría","Monto","Finca","Estado","Fecha","Días"].map(h => (
                  <th key={h} style={{padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:600, color:GRIS, textTransform:"uppercase", whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o, i) => {
                const dias = diasDesde(o.fecha);
                const alerta = o.estado==="Pendiente Aprobación" && dias>=3;
                return (
                  <tr key={i} onClick={() => setSeleccionada(seleccionada?.id===o.id ? null : o)}
                    style={{borderTop:`1px solid ${BORDE}`, cursor:"pointer", background: seleccionada?.id===o.id ? HOVER : alerta ? "#271F0A" : "transparent"}}
                    onMouseEnter={e => { if(seleccionada?.id!==o.id) e.currentTarget.style.background = HOVER+"88"; }}
                    onMouseLeave={e => { if(seleccionada?.id!==o.id) e.currentTarget.style.background = alerta ? "#271F0A" : "transparent"; }}>
                    <td style={{padding:"9px 12px", fontSize:10.5, fontFamily:"monospace", color:VERDE, fontWeight:700}}>{o.id}</td>
                    <td style={{padding:"9px 12px", fontSize:11, color:TEXTO, maxWidth:160}}><div style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{o.proveedor}</div></td>
                    <td style={{padding:"9px 12px", fontSize:10.5, color:GRIS}}>{o.categoria}</td>
                    <td style={{padding:"9px 12px", fontSize:11, fontWeight:700, color:VERDE, fontFamily:"monospace"}}>{fmt$(o.monto)}</td>
                    <td style={{padding:"9px 12px"}}><Etiqueta texto={o.finca} color={AZUL} /></td>
                    <td style={{padding:"9px 12px"}}><Pastilla v={o.estado} /></td>
                    <td style={{padding:"9px 12px", fontSize:10.5, color:GRIS}}>{o.fecha}</td>
                    <td style={{padding:"9px 12px", fontSize:10.5, color: alerta ? AMBER : GRIS, fontWeight: alerta ? 700 : 400}}>{dias}d{alerta ? " ⏰" : ""}</td>
                  </tr>
                );
              })}
              {filtradas.length===0 && (
                <tr><td colSpan={8} style={{padding:32, textAlign:"center", color:GRIS, fontSize:13}}>No hay órdenes con este filtro.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {seleccionada && (
          <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:12, padding:20, display:"flex", flexDirection:"column", gap:14, alignSelf:"start"}}>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:10, color:GRIS, textTransform:"uppercase"}}>Detalle</div>
                <div style={{fontSize:14, fontWeight:800, color:VERDE, fontFamily:"monospace"}}>{seleccionada.id}</div>
              </div>
              <button onClick={() => setSeleccionada(null)} style={{background:"none", border:"none", color:GRIS, fontSize:18, cursor:"pointer"}}>×</button>
            </div>
            <Pastilla v={seleccionada.estado} />
            {[["Proveedor",seleccionada.proveedor],["Categoría",seleccionada.categoria],["Monto",fmt$(seleccionada.monto)],["Finca",seleccionada.finca],["Fecha",seleccionada.fecha],["Días transcurridos",`${diasDesde(seleccionada.fecha)} días`],["Prioridad",seleccionada.prioridad]].map(([l,v]) => (
              <div key={l} style={{borderBottom:`1px solid ${BORDE}`, paddingBottom:8}}>
                <div style={{fontSize:10, color:GRIS, textTransform:"uppercase", marginBottom:2}}>{l}</div>
                <div style={{fontSize:12.5, color:TEXTO, fontWeight:500}}>{v}</div>
              </div>
            ))}
            {seleccionada.descripcion && (
              <div>
                <div style={{fontSize:10, color:GRIS, textTransform:"uppercase", marginBottom:2}}>Descripción</div>
                <div style={{fontSize:12, color:TEXTO, lineHeight:1.5}}>{seleccionada.descripcion}</div>
              </div>
            )}
            <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:4}}>
              {seleccionada.estado==="Borrador" && <Boton onClick={() => cambiarEstado(seleccionada.id,"Pendiente Aprobación")} variante="ghost" tamanio="sm">📤 Enviar a Aprobación</Boton>}
              {seleccionada.estado==="Pendiente Aprobación" && <>
                <Boton onClick={() => cambiarEstado(seleccionada.id,"Aprobada")} tamanio="sm">✅ Aprobar</Boton>
                <Boton onClick={() => cambiarEstado(seleccionada.id,"Rechazada")} variante="peligro" tamanio="sm">❌ Rechazar</Boton>
              </>}
              {seleccionada.estado==="Aprobada" && <Boton onClick={() => cambiarEstado(seleccionada.id,"Recibida")} variante="naranja" tamanio="sm">📦 Marcar Recibida</Boton>}
              <Boton onClick={() => eliminar(seleccionada.id)} variante="peligro" tamanio="sm">🗑 Eliminar</Boton>
            </div>
          </div>
        )}
      </div>

      {modalAbierto && (
        <div onClick={e => { if(e.target===e.currentTarget) setModalAbierto(false); }}
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{background:PANEL, border:`1px solid ${BORDE}`, borderRadius:16, padding:"28px 32px", maxWidth:520, width:"92%"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:22}}>
              <h3 style={{color:TEXTO, fontSize:16, fontWeight:800, margin:0}}>+ Nueva Orden de Compra</h3>
              <button onClick={() => setModalAbierto(false)} style={{background:"none", border:"none", color:GRIS, fontSize:20, cursor:"pointer"}}>×</button>
            </div>
            <form onSubmit={crearOC} style={{display:"flex", flexDirection:"column", gap:14}}>
              <Campo label="Proveedor" valor={form.proveedor} onChange={v => setForm({...form,proveedor:v})} opciones={provs.slice(0,20).map(p=>p.p)} requerido />
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                <Campo label="Categoría" valor={form.categoria} onChange={v => setForm({...form,categoria:v})} opciones={CATEGORIAS} requerido />
                <Campo label="Monto USD" valor={form.monto} onChange={v => setForm({...form,monto:v})} tipo="number" placeholder="0.00" requerido />
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                <Campo label="Finca" valor={form.finca} onChange={v => setForm({...form,finca:v})} opciones={FINCAS} requerido />
                <Campo label="Prioridad" valor={form.prioridad} onChange={v => setForm({...form,prioridad:v})} opciones={["Alta","Media","Baja"]} />
              </div>
              <Campo label="Descripción" valor={form.descripcion} onChange={v => setForm({...form,descripcion:v})} filas={3} />
              <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
                <Boton onClick={() => setModalAbierto(false)} variante="ghost">Cancelar</Boton>
                <Boton tipo="submit">Crear Borrador</Boton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  KPIs
// ─────────────────────────────────────────────
function KPIs({kpis, setKpis}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const vacío = {nombre:"", valor:"", meta:"", tendencia:"", area:"Supply Chain", unidad:"%", nota:""};
  const [form, setForm] = useState(vacío);

  function guardar(e) {
    e.preventDefault();
    const kpi = {...form, valor:parseFloat(form.valor), meta:parseFloat(form.meta), tendencia:parseFloat(form.tendencia)||0, fecha:new Date().toISOString().slice(0,10)};
    if (editando) {
      setKpis(kpis.map(k => k.id===editando ? {...kpi, id:editando} : k));
      setEditando(null);
    } else {
      setKpis([{...kpi, id:uid()}, ...kpis]);
    }
    setForm(vacío);
    setModalAbierto(false);
  }

  function editar(k) {
    setEditando(k.id);
    setForm({...k, valor:String(k.valor), meta:String(k.meta), tendencia:String(k.tendencia)});
    setModalAbierto(true);
  }

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
        <div>
          <div style={{color:"#4ADE80", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Gestión</div>
          <h1 style={{color:TEXTO, fontSize:24, fontWeight:800, margin:0}}>KPIs Corporativos</h1>
          <p style={{color:GRIS, fontSize:12, margin:"4px 0 0"}}>{kpis.length} indicadores activos</p>
        </div>
        <Boton onClick={() => { setEditando(null); setForm(vacío); setModalAbierto(true); }}>+ Agregar KPI</Boton>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12}}>
        {kpis.map(k => {
          const pct = k.valor / k.meta * 100;
          const col = pct >= 100 ? VERDE : pct >= 92 ? AMBER : ROJO;
          const sube = k.tendencia >= 0;
          return (
            <div key={k.id} style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:12, padding:"16px 18px", borderLeft:`4px solid ${col}`}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
                <div>
                  <div style={{fontSize:11, color:GRIS, textTransform:"uppercase"}}>{k.area}</div>
                  <div style={{fontSize:14, fontWeight:700, color:TEXTO, marginTop:2}}>{k.nombre}</div>
                </div>
                <div style={{display:"flex", gap:4}}>
                  <button onClick={() => editar(k)} style={{background:"none", border:"none", color:GRIS, cursor:"pointer", fontSize:14}}>✏️</button>
                  <button onClick={() => setKpis(kpis.filter(x => x.id!==k.id))} style={{background:"none", border:"none", color:GRIS, cursor:"pointer", fontSize:14}}>🗑</button>
                </div>
              </div>
              <div style={{fontSize:28, fontWeight:800, color:col, fontFamily:"monospace"}}>{k.valor}{k.unidad}</div>
              <div style={{fontSize:10.5, color:GRIS, margin:"4px 0 10px"}}>
                Meta: {k.meta}{k.unidad} · <span style={{color: sube ? VERDE : ROJO, fontWeight:600}}>{sube ? "▲" : "▼"} {Math.abs(k.tendencia)}pp</span>
              </div>
              <div style={{height:5, background:BG, borderRadius:3, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${Math.min(pct,100)}%`, background:col, borderRadius:3}} />
              </div>
              {k.nota && <div style={{fontSize:10, color:GRIS, marginTop:6, fontStyle:"italic"}}>📝 {k.nota}</div>}
            </div>
          );
        })}
      </div>

      {modalAbierto && (
        <div onClick={e => { if(e.target===e.currentTarget) { setModalAbierto(false); setEditando(null); } }}
          style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center"}}>
          <div style={{background:PANEL, border:`1px solid ${BORDE}`, borderRadius:16, padding:"28px 32px", maxWidth:480, width:"92%"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:20}}>
              <h3 style={{color:TEXTO, fontSize:15, fontWeight:800, margin:0}}>{editando ? "Editar" : "Nuevo"} KPI</h3>
              <button onClick={() => { setModalAbierto(false); setEditando(null); }} style={{background:"none", border:"none", color:GRIS, fontSize:20, cursor:"pointer"}}>×</button>
            </div>
            <form onSubmit={guardar} style={{display:"flex", flexDirection:"column", gap:12}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                <Campo label="Nombre" valor={form.nombre} onChange={v => setForm({...form,nombre:v})} requerido />
                <Campo label="Área" valor={form.area} onChange={v => setForm({...form,area:v})} opciones={AREAS} />
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
                <Campo label="Valor" valor={form.valor} onChange={v => setForm({...form,valor:v})} tipo="number" requerido />
                <Campo label="Meta" valor={form.meta} onChange={v => setForm({...form,meta:v})} tipo="number" requerido />
                <Campo label="Tendencia" valor={form.tendencia} onChange={v => setForm({...form,tendencia:v})} tipo="number" />
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 2fr", gap:12}}>
                <Campo label="Unidad" valor={form.unidad} onChange={v => setForm({...form,unidad:v})} placeholder="%" />
                <Campo label="Nota" valor={form.nota} onChange={v => setForm({...form,nota:v})} />
              </div>
              <div style={{display:"flex", gap:8, justifyContent:"flex-end"}}>
                <Boton onClick={() => { setModalAbierto(false); setEditando(null); }} variante="ghost">Cancelar</Boton>
                <Boton tipo="submit">{editando ? "Guardar" : "Agregar"}</Boton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  ANÁLISIS
// ─────────────────────────────────────────────
function Analisis({meses}) {
  const claves = Object.keys(meses);
  const mesActual = claves[claves.length-1];
  const provs = meses[mesActual] || [];
  const total = provs.reduce((a,b) => a+b.m, 0);

  const cats = {};
  provs.forEach(p => {
    const n = p.p.toLowerCase();
    let c = "Otros";
    if (/quimic|agroquim|fitosan|fertil|agripac|eurofert|ecuaquimica/.test(n)) c = "Agroquímicos";
    else if (/papel|pack|carton|empaque|innovaplast/.test(n)) c = "Empaques";
    else if (/flor|flower|rodel|everflor/.test(n)) c = "Insumos Florales";
    else if (/semilla|cultivo|corpcultivo/.test(n)) c = "Insumos Agrícolas";
    cats[c] = (cats[c]||0) + p.m;
  });
  const catArr = Object.entries(cats).map(([k,v]) => ({cat:k, monto:v, pct:v/total*100})).sort((a,b) => b.monto-a.monto);
  const catColores = {Agroquímicos:VERDE, Empaques:AZUL, "Insumos Florales":"#EC4899", "Insumos Agrícolas":"#A855F7", Otros:GRIS};
  const pareto = [1,3,5,10,20,30].map(n => ({n, pct: provs.slice(0,n).reduce((a,b)=>a+b.m,0)/total*100, tot: provs.slice(0,n).reduce((a,b)=>a+b.m,0)}));

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>
      <div>
        <div style={{color:"#4ADE80", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Inteligencia</div>
        <h1 style={{color:TEXTO, fontSize:24, fontWeight:800, margin:0}}>Análisis de Procurement</h1>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"20px 22px"}}>
          <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 16px"}}>Curva de Pareto</h3>
          {pareto.map((d, i) => {
            const col = d.pct>80 ? ROJO : d.pct>60 ? AMBER : d.pct>40 ? "#EAB308" : VERDE;
            return (
              <div key={i} style={{display:"flex", alignItems:"center", gap:10, marginBottom:10}}>
                <span style={{fontSize:11, color:TEXTO, width:130, flexShrink:0}}>Top {d.n} proveedor{d.n>1?"es":""}</span>
                <div style={{flex:1, height:20, background:BG, borderRadius:4, overflow:"hidden", position:"relative"}}>
                  <div style={{position:"absolute", left:0, top:0, height:"100%", width:`${d.pct}%`, background:col, borderRadius:4, display:"flex", alignItems:"center", paddingLeft:6}}>
                    <span style={{fontSize:9.5, color:"#0F1A0F", fontWeight:700}}>{d.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <span style={{fontSize:10.5, color:GRIS, fontFamily:"monospace", width:60, textAlign:"right", flexShrink:0}}>{fmt$(d.tot)}</span>
              </div>
            );
          })}
        </div>

        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"20px 22px"}}>
          <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 16px"}}>Gasto por Categoría</h3>
          {catArr.map((c, i) => (
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                <span style={{fontSize:12, color:TEXTO, fontWeight:600, display:"flex", alignItems:"center", gap:6}}>
                  <span style={{width:8, height:8, borderRadius:"50%", background:catColores[c.cat]||GRIS, display:"inline-block"}} />
                  {c.cat}
                </span>
                <div style={{display:"flex", gap:8}}>
                  <span style={{fontSize:11, fontWeight:700, color:catColores[c.cat]||GRIS, fontFamily:"monospace"}}>{fmt$(c.monto)}</span>
                  <span style={{fontSize:11, color:GRIS}}>{c.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div style={{height:7, background:BG, borderRadius:4, overflow:"hidden"}}>
                <div style={{height:"100%", width:`${(c.pct/catArr[0].pct)*100}%`, background:catColores[c.cat]||GRIS, borderRadius:4}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {claves.length > 1 && (
        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"20px 22px"}}>
          <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 16px"}}>📅 Evolución Mensual</h3>
          <div style={{display:"grid", gridTemplateColumns:`repeat(${claves.length},1fr)`, gap:12}}>
            {claves.map((clave, i) => {
              const tot = meses[clave].reduce((a,b) => a+b.m, 0);
              const prev = i > 0 ? meses[claves[i-1]].reduce((a,b)=>a+b.m,0) : null;
              const delta = prev ? ((tot-prev)/prev*100) : null;
              return (
                <div key={clave} style={{background:BG, borderRadius:10, padding:"14px 16px", textAlign:"center", border:`1px solid ${BORDE}`}}>
                  <div style={{fontSize:11, color:GRIS, marginBottom:4}}>{clave}</div>
                  <div style={{fontSize:20, fontWeight:800, color:VERDE, fontFamily:"monospace"}}>{fmt$(tot)}</div>
                  <div style={{fontSize:10.5, color:GRIS, marginTop:2}}>{meses[clave].length} proveedores</div>
                  {delta!==null && <div style={{fontSize:11, fontWeight:700, color: delta>0 ? ROJO : VERDE, marginTop:6}}>{delta>0?"▲":"▼"} {Math.abs(delta).toFixed(1)}%</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  REPORTE
// ─────────────────────────────────────────────
function Reporte({meses, ordenes, kpis}) {
  const claves = Object.keys(meses);
  const mesActual = claves[claves.length-1];
  const provs = meses[mesActual] || [];
  const total = provs.reduce((a,b) => a+b.m, 0);
  const aprobadas = ordenes.filter(o => o.estado==="Aprobada").length;
  const pendientes = ordenes.filter(o => o.estado==="Pendiente Aprobación").length;
  const kpisOk = kpis.filter(k => k.valor >= k.meta).length;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:20}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
        <div>
          <div style={{color:"#4ADE80", fontSize:11, letterSpacing:2, textTransform:"uppercase", marginBottom:4}}>Reportes</div>
          <h1 style={{color:TEXTO, fontSize:24, fontWeight:800, margin:0}}>Reporte Ejecutivo</h1>
          <p style={{color:GRIS, fontSize:12, margin:"4px 0 0"}}>Generado el {hoy()}</p>
        </div>
        <Boton onClick={() => window.print()} tamanio="md">🖨️ Imprimir / Exportar PDF</Boton>
      </div>

      <div style={{background:"linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)", borderRadius:14, padding:"28px 32px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <span style={{fontSize:32}}>🌿</span>
            <div>
              <h2 style={{color:"#fff", fontSize:20, fontWeight:800, margin:0}}>Hoja Verde 360°</h2>
              <p style={{color:"#95D5B2", fontSize:12, margin:0}}>Reporte Mensual de Procurement</p>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:"#95D5B2", fontSize:11}}>Período</div>
            <div style={{color:"#fff", fontSize:16, fontWeight:700}}>{mesActual}</div>
            <div style={{color:"#95D5B2", fontSize:10, marginTop:4}}>{hoy()}</div>
          </div>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12}}>
        {[
          {label:"Gasto Total", valor:fmt$(total), sub:mesActual, color:VERDE, icono:"💵"},
          {label:"OC Aprobadas", valor:aprobadas, sub:`de ${ordenes.length} total`, color:AZUL, icono:"✅"},
          {label:"OC Pendientes", valor:pendientes, sub:"Requieren acción", color:pendientes>0?AMBER:VERDE, icono:"⏳"},
          {label:"KPIs en Meta", valor:`${kpisOk}/${kpis.length}`, sub:`${kpis.length>0?((kpisOk/kpis.length)*100).toFixed(0):0}% cumplimiento`, color:kpisOk===kpis.length?VERDE:AMBER, icono:"🎯"},
        ].map((k, i) => (
          <div key={i} style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:12, padding:16, borderTop:`3px solid ${k.color}`}}>
            <div style={{fontSize:20, marginBottom:6}}>{k.icono}</div>
            <div style={{fontSize:22, fontWeight:800, color:k.color, fontFamily:"monospace"}}>{k.valor}</div>
            <div style={{fontSize:11, fontWeight:600, color:TEXTO, marginTop:2}}>{k.label}</div>
            <div style={{fontSize:10, color:GRIS}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16}}>
        <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"20px 22px"}}>
          <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 14px"}}>Top 10 Proveedores — {mesActual}</h3>
          {provs.slice(0,10).map((p, i) => (
            <div key={i} style={{display:"flex", alignItems:"center", gap:8, marginBottom:7}}>
              <span style={{width:18, fontSize:10, color: i<3 ? AMBER : GRIS, fontWeight:700, textAlign:"right", flexShrink:0}}>#{i+1}</span>
              <span style={{flex:1, fontSize:10.5, color:TEXTO, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{p.p}</span>
              <span style={{fontSize:10.5, fontWeight:700, color:VERDE, fontFamily:"monospace", flexShrink:0}}>{fmt$(p.m)}</span>
              <span style={{fontSize:9.5, color:GRIS, flexShrink:0, minWidth:30}}>{((p.m/total)*100).toFixed(1)}%</span>
            </div>
          ))}
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"16px 18px", flex:1}}>
            <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 12px"}}>KPIs del Período</h3>
            {kpis.map(k => {
              const pct = k.valor/k.meta*100;
              const col = pct>=100 ? VERDE : pct>=92 ? AMBER : ROJO;
              return (
                <div key={k.id} style={{marginBottom:9}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:2}}>
                    <span style={{fontSize:11, color:TEXTO}}>{k.nombre}</span>
                    <span style={{fontSize:11, fontWeight:700, color:col, fontFamily:"monospace"}}>{k.valor}{k.unidad}</span>
                  </div>
                  <div style={{height:4, background:BG, borderRadius:2, overflow:"hidden"}}>
                    <div style={{height:"100%", width:`${Math.min(pct,100)}%`, background:col, borderRadius:2}} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{background:CARD, border:`1px solid ${BORDE}`, borderRadius:14, padding:"18px 22px"}}>
        <h3 style={{color:TEXTO, fontSize:13, fontWeight:700, margin:"0 0 12px"}}>📝 Observaciones</h3>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12}}>
          {[
            {icono:"🔴", titulo:"Concentración", desc:`Top 3 proveedores = ${(provs.slice(0,3).reduce((a,b)=>a+b.m,0)/total*100).toFixed(1)}% del gasto. Evaluar diversificación.`, color:ROJO},
            {icono:"🟡", titulo:"OC Pendientes", desc:`${pendientes} órdenes sin aprobación. Requieren atención inmediata.`, color:AMBER},
            {icono:"🟢", titulo:"KPIs operativos", desc:`${kpisOk}/${kpis.length} indicadores en meta. Continuar monitoreo semanal.`, color:VERDE},
          ].map((h, i) => (
            <div key={i} style={{background:BG, borderRadius:10, padding:"12px 14px", borderLeft:`3px solid ${h.color}`}}>
              <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:6}}>
                <span style={{fontSize:14}}>{h.icono}</span>
                <span style={{fontSize:11, fontWeight:700, color:TEXTO}}>{h.titulo}</span>
              </div>
              <p style={{fontSize:10.5, color:GRIS, lineHeight:1.6, margin:0}}>{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  APP PRINCIPAL
// ─────────────────────────────────────────────
export default function App() {
  const [meses, setMeses] = useGuardar("hv360_meses", {"Enero 2026": PROVEEDORES_ENERO});
  const [ordenes, setOrdenes] = useGuardar("hv360_ordenes_v2", ocSemilla());
  const [kpis, setKpis] = useGuardar("hv360_kpis_v2", kpisSemilla());
  const [modulo, setModulo] = useState("dashboard");
  const [mostrarAlertas, setMostrarAlertas] = useState(false);
  const alertas = useAlertas(ordenes);

  const nav = [
    {id:"dashboard", label:"Dashboard", icono:"⬛"},
    {id:"proveedores", label:"Proveedores", icono:"🏭"},
    {id:"ordenes", label:"Órdenes OC", icono:"📋", badge: ordenes.filter(o=>o.estado==="Pendiente Aprobación").length},
    {id:"kpis", label:"KPIs", icono:"🎯"},
    {id:"analisis", label:"Análisis", icono:"📊"},
    {id:"reporte", label:"Reporte PDF", icono:"📄"},
  ];

  const vistas = {
    dashboard: <Dashboard meses={meses} ordenes={ordenes} kpis={kpis} setMod={setModulo} />,
    proveedores: <Proveedores meses={meses} setMeses={setMeses} />,
    ordenes: <Ordenes ordenes={ordenes} setOrdenes={setOrdenes} meses={meses} />,
    kpis: <KPIs kpis={kpis} setKpis={setKpis} />,
    analisis: <Analisis meses={meses} />,
    reporte: <Reporte meses={meses} ordenes={ordenes} kpis={kpis} />,
  };

  return (
    <div style={{background:BG, minHeight:"100vh", color:TEXTO, fontFamily:"'Inter','Segoe UI',sans-serif", display:"flex"}}>
      {/* Sidebar */}
      <aside style={{width:220, background:PANEL, borderRight:`1px solid ${BORDE}`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100}}>
        <div style={{padding:"20px 18px 16px", borderBottom:`1px solid ${BORDE}`}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:36, height:36, borderRadius:10, background:VERDE, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0}}>🌿</div>
            <div>
              <div style={{fontWeight:800, fontSize:13.5, color:TEXTO, lineHeight:1}}>Hoja Verde</div>
              <div style={{fontSize:11, color:VERDE, fontWeight:600}}>360° Procurement</div>
            </div>
          </div>
        </div>

        <nav style={{flex:1, padding:"12px 10px", display:"flex", flexDirection:"column", gap:2}}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setModulo(n.id)}
              style={{background: modulo===n.id ? VERDE+"18" : "transparent", border:`1px solid ${modulo===n.id ? VERDE+"44" : "transparent"}`, borderRadius:8, padding:"9px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, width:"100%", textAlign:"left", transition:"all 0.12s"}}
              onMouseEnter={e => { if(modulo!==n.id) e.currentTarget.style.background = HOVER; }}
              onMouseLeave={e => { if(modulo!==n.id) e.currentTarget.style.background = "transparent"; }}>
              <span style={{fontSize:15}}>{n.icono}</span>
              <span style={{fontSize:12.5, fontWeight: modulo===n.id ? 700 : 400, color: modulo===n.id ? "#4ADE80" : GRIS}}>{n.label}</span>
              {n.badge > 0 && <span style={{marginLeft:"auto", background:AMBER, color:"#0F1A0F", fontSize:10, fontWeight:800, borderRadius:10, padding:"1px 7px"}}>{n.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:"14px 18px", borderTop:`1px solid ${BORDE}`, display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:30, height:30, borderRadius:"50%", background:VERDE, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11, color:"#0F1A0F", flexShrink:0}}>JV</div>
          <div>
            <div style={{fontSize:11.5, fontWeight:600, color:TEXTO}}>José Vargas</div>
            <div style={{fontSize:10, color:GRIS}}>Supply Chain</div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <main style={{flex:1, marginLeft:220, padding:"0 32px 32px", minHeight:"100vh"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 0 16px", borderBottom:`1px solid ${BORDE}`, marginBottom:24, position:"sticky", top:0, background:BG, zIndex:50}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:6, height:6, borderRadius:"50%", background:VERDE, boxShadow:`0 0 8px ${VERDE}`}} />
            <span style={{fontSize:10.5, color:VERDE, fontWeight:600}}>Sistema activo · {hoy()}</span>
          </div>
          <div style={{position:"relative"}}>
            <button onClick={() => setMostrarAlertas(!mostrarAlertas)}
              style={{background: alertas.length>0 ? AMBER+"22" : CARD, border:`1px solid ${alertas.length>0 ? AMBER+"44" : BORDE}`, borderRadius:8, padding:"6px 12px", color: alertas.length>0 ? AMBER : GRIS, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6}}>
              🔔 {alertas.length > 0 ? `${alertas.length} alertas` : "Sin alertas"}
            </button>
            {mostrarAlertas && (
              <PanelAlertas alertas={alertas} onCerrar={() => setMostrarAlertas(false)} onIr={m => { setModulo(m); setMostrarAlertas(false); }} />
            )}
          </div>
        </div>

        {vistas[modulo]}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BORDE}; border-radius: 4px; }
        select option { background: ${PANEL}; color: ${TEXTO}; }
        @media print {
          aside, button { display: none !important; }
          main { margin: 0 !important; padding: 16px !important; }
          * { color: #111 !important; background: white !important; border-color: #ddd !important; }
        }
      `}</style>
    </div>
  );
}
