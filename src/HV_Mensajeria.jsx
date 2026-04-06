import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const UMBRAL_MINUTOS = 30;
const typeLabels   = { bancario:"Bancario", entrega:"Entrega", recogida:"Recogida", institucional:"Institucional" };
const typeIcons    = { bancario:"🏦", entrega:"📦", recogida:"🔄", institucional:"🏛️" };
const statusLabels = { libre:"Libre", "en-ruta":"En ruta", "no-disponible":"No disp." };

const CM = {
  bg:"#F8FAF5", surface:"#FFFFFF", surface2:"#F2F7EE", border:"#D8E8D0",
  green:"#2D7A22", greenL:"#E8F5E1", greenM:"#4A9A3E",
  amber:"#C07A00", amberL:"#FFF3CD",
  red:"#C0392B", redL:"#FDECEA",
  blue:"#1A6FAA", blueL:"#E3F0FA",
  purple:"#6B46A8",
  text:"#1A2E12", textMid:"#4A6340", textGray:"#7A8E74",
};
const typeColor = { bancario:CM.blue, entrega:CM.purple, recogida:CM.amber, institucional:CM.green };
const prioColor = { urgente:"#7B0000", alta:CM.red, media:CM.amber, baja:CM.textGray };

function loadScript(src, check) {
  return new Promise(resolve => {
    if (check()) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve;
    document.head.appendChild(s);
  });
}
async function getXLSX() {
  await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js", () => !!window.XLSX);
  return window.XLSX;
}
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}
async function getLeaflet() {
  loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
  await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", () => !!window.L);
  return window.L;
}
const geocodeCache = {};
async function geocode(query) {
  const q = query.trim();
  if (geocodeCache[q]) return geocodeCache[q];
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+", Quito, Ecuador")}&format=json&limit=1`, { headers:{"Accept-Language":"es"} });
    const data = await r.json();
    if (data.length) { const res={lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)}; geocodeCache[q]=res; return res; }
  } catch(_) {}
  return null;
}

function inputSt(extra={}) {
  return { width:"100%", background:CM.surface2, border:`1px solid ${CM.border}`, borderRadius:6, padding:"8px 10px", color:CM.text, fontSize:13, fontFamily:"inherit", outline:"none", ...extra };
}
function Badge({ texto, color }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}55`, borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{texto}</span>;
}

function FirmaModal({ tarea, onConfirm, onCancel }) {
  const [obs, setObs] = useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:14,padding:28,width:420,boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:18,marginBottom:4}}>✅ Confirmar Entrega</div>
        <div style={{fontSize:12,color:CM.textGray,marginBottom:18}}>{tarea.id} — {tarea.descripcion}</div>
        <div style={{background:CM.greenL,border:`1px solid ${CM.border}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:CM.textMid}}>
          <strong>📍 Destino:</strong> {tarea.destino}<br/><strong>🕐 Asignada:</strong> {tarea.hora}
        </div>
        <label style={{fontSize:11,color:CM.textGray,fontWeight:600,display:"block",marginBottom:6}}>Observaciones (opcional)</label>
        <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ej: Entregado al guardia." style={inputSt({resize:"none",height:72,fontSize:12})}/>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={()=>onConfirm(obs)} style={{flex:1,padding:10,background:CM.green,color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>✅ Confirmar</button>
          <button onClick={onCancel} style={{flex:1,padding:10,background:"transparent",color:CM.textGray,border:`1px solid ${CM.border}`,borderRadius:7,fontSize:13,cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function RechazoModal({ tarea, onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState(""); const [error, setError] = useState("");
  function handleConfirm() { if (!motivo.trim()) { setError("Debes ingresar el motivo."); return; } onConfirm(motivo.trim()); }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:14,padding:28,width:420,boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:18,marginBottom:4,color:CM.red}}>❌ Rechazar Diligencia</div>
        <div style={{fontSize:12,color:CM.textGray,marginBottom:18}}>{tarea.id} — {tarea.descripcion}</div>
        <div style={{background:CM.redL,border:`1px solid ${CM.red}44`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:CM.textMid}}>
          <strong>📍 Destino:</strong> {tarea.destino}
        </div>
        <label style={{fontSize:11,color:CM.textGray,fontWeight:600,display:"block",marginBottom:6}}>Motivo del rechazo <span style={{color:CM.red}}>*</span></label>
        <textarea value={motivo} onChange={e=>{setMotivo(e.target.value);setError("");}} placeholder="Ej: No tengo movilización disponible." style={inputSt({resize:"none",height:80,fontSize:12})} autoFocus/>
        {error && <div style={{fontSize:11,color:CM.red,marginTop:4}}>⚠️ {error}</div>}
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={handleConfirm} style={{flex:1,padding:10,background:CM.red,color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>❌ Confirmar rechazo</button>
          <button onClick={onCancel} style={{flex:1,padding:10,background:"transparent",color:CM.textGray,border:`1px solid ${CM.border}`,borderRadius:7,fontSize:13,cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function MapaView({ tasks, messengers }) {
  const mapRef=useRef(null); const mapObj=useRef(null); const markers=useRef([]);
  const [info, setInfo] = useState("Cargando mapa...");
  const activeTasks = tasks.filter(t => t.status !== "completada" && t.status !== "rechazada");
  useEffect(() => {
    let cancelled = false;
    async function init() {
      const L = await getLeaflet();
      if (cancelled || !mapRef.current) return;
      if (!mapObj.current) {
        mapObj.current = L.map(mapRef.current).setView([-0.1807,-78.4678],12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(mapObj.current);
      }
      markers.current.forEach(m=>m.remove()); markers.current=[];
      const mesColors=["#1A6FAA","#6B46A8"]; let geocoded=0;
      for (const t of activeTasks) {
        if (cancelled) break;
        const coords = t.coords || await geocode(t.destino);
        if (coords) {
          t.coords=coords; const col=mesColors[t.messenger]||CM.green;
          const icon=L.divIcon({className:"",html:`<div style="background:${col};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:13px"><span style="transform:rotate(45deg)">${typeIcons[t.tipo]}</span></div>`,iconSize:[28,28],iconAnchor:[14,28]});
          const mk=L.marker([coords.lat,coords.lng],{icon}).addTo(mapObj.current).bindPopup(`<div style="font-family:sans-serif;min-width:160px"><div style="font-weight:700;margin-bottom:3px">${t.id}</div><div style="font-size:11px;color:#666">${typeIcons[t.tipo]} ${typeLabels[t.tipo]}</div><div style="font-size:12px">${t.descripcion}</div><div style="font-size:11px;color:#666">👤 ${messengers[t.messenger]?.nombre||"—"}</div></div>`);
          markers.current.push(mk); geocoded++;
        }
      }
      if (activeTasks.length===0) setInfo("No hay diligencias activas.");
      else if (geocoded===0) setInfo("No se pudieron ubicar los destinos.");
      else { setInfo(`${geocoded} de ${activeTasks.length} diligencias ubicadas`); const group=L.featureGroup(markers.current); mapObj.current.fitBounds(group.getBounds().pad(0.35)); }
    }
    init(); return ()=>{cancelled=true;};
  },[tasks]);
  return (
    <div>
      <div style={{background:CM.surface2,border:`1px solid ${CM.border}`,borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:12,color:CM.textMid,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span>🗺️ {info}</span>
        <div style={{marginLeft:"auto",display:"flex",gap:14}}>
          {[{c:"#1A6FAA",l:messengers[0]?.nombre},{c:"#6B46A8",l:messengers[1]?.nombre}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><div style={{width:10,height:10,borderRadius:"50%",background:x.c}}/>{x.l}</div>
          ))}
        </div>
      </div>
      <div ref={mapRef} style={{height:420,borderRadius:10,border:`1px solid ${CM.border}`,overflow:"hidden"}}/>
    </div>
  );
}

export default function HVMensajeria() {
  const [messengers, setMessengers] = useState([{id:0,nombre:"Segundo Morales",status:"libre"},{id:1,nombre:"Marcelo Sandoval",status:"libre"}]);
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("todas");
  const [activeTab, setActiveTab]   = useState("activas");
  const [histFilter, setHistFilter] = useState("hoy");
  const [toast, setToast]           = useState("");
  const [clock, setClock]           = useState("");
  const [fechaHoy, setFechaHoy]     = useState("");
  const [ahora, setAhora]           = useState(new Date());
  const [firmaModal, setFirmaModal]   = useState(null);
  const [rechazoModal, setRechazoModal] = useState(null);
  const fTipo=useRef(); const fDesc=useRef(); const fDest=useRef();
  const fMens=useRef(); const fPrio=useRef(); const fNota=useRef();

  // CSS urgente
  useEffect(()=>{
    if (!document.getElementById("hv-urgente-style")) {
      const s=document.createElement("style"); s.id="hv-urgente-style";
      s.textContent=`@keyframes urgenteFlash{0%,100%{border-color:#7B0000;box-shadow:0 0 0 0 rgba(123,0,0,0)}50%{border-color:#FF0000;box-shadow:0 0 0 4px rgba(255,0,0,0.2)}}.tarea-urgente{animation:urgenteFlash 1.5s infinite;border-color:#7B0000!important}`;
      document.head.appendChild(s);
    }
  },[]);

  // Reloj
  useEffect(()=>{
    const tick=()=>{ const n=new Date(); setClock(n.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"})); setFechaHoy(n.toLocaleDateString("es-EC",{weekday:"long",year:"numeric",month:"long",day:"numeric"})); setAhora(n); };
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);

  // Cargar datos de Supabase
  async function cargarDatos() {
    const [{ data: dilig }, { data: mens }] = await Promise.all([
      supabase.from("diligencias").select("*").order("created_at", { ascending: true }),
      supabase.from("mensajeros").select("*").order("id"),
    ]);
    if (dilig) setTasks(dilig);
    if (mens)  setMessengers(mens);
    setLoading(false);
  }

  useEffect(()=>{ cargarDatos(); }, []);

  // Suscripción en tiempo real
  useEffect(()=>{
    const channel = supabase.channel("hv-cambios")
      .on("postgres_changes", { event:"*", schema:"public", table:"diligencias" }, ()=>cargarDatos())
      .on("postgres_changes", { event:"*", schema:"public", table:"mensajeros" },  ()=>cargarDatos())
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[]);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),3000); }

  // Status mensajero
  async function setStatus(idx, status) {
    await supabase.from("mensajeros").update({ status }).eq("id", idx);
    showToast(`${messengers[idx].nombre} → ${statusLabels[status]}`);
  }

  // Agregar tarea
  async function addTask() {
    const tipo=fTipo.current.value, desc=fDesc.current.value.trim();
    const dest=fDest.current.value.trim(), midx=parseInt(fMens.current.value);
    const prio=fPrio.current.value, nota=fNota.current.value.trim();
    if (!desc) { showToast("⚠️ Ingresa una descripción"); return; }
    if (!dest) { showToast("⚠️ Ingresa el destino"); return; }
    const now=new Date();
    const count = tasks.length + 1;
    const newTask = {
      id: "DG-"+String(count).padStart(3,"0"),
      tipo, descripcion:desc, destino:dest,
      messenger:midx, prioridad:prio,
      status:"pendiente", nota, firma_obs:"", motivo_rechazo:"",
      hora:now.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"}),
      fecha:now.toLocaleDateString("es-EC"),
      fecha_iso:now.toISOString().slice(0,10),
    };
    await supabase.from("diligencias").insert(newTask);
    fDesc.current.value=""; fDest.current.value=""; fNota.current.value="";
    showToast(`✓ Asignada a ${messengers[midx].nombre}`);
  }

  async function changeStatus(id, newStatus) {
    const t = tasks.find(x=>x.id===id);
    if (!t) return;
    if (newStatus==="completada") { setFirmaModal({id,descripcion:t.descripcion,destino:t.destino,hora:t.hora,mesName:messengers[t.messenger]?.nombre}); return; }
    if (newStatus==="rechazada")  { setRechazoModal({id,descripcion:t.descripcion,destino:t.destino}); return; }
    await supabase.from("diligencias").update({status:newStatus}).eq("id",id);
    showToast(`✓ ${id} → ${newStatus.replace("-"," ")}`);
  }

  async function applyStatus(id, status, firmaObs) {
    const hFin=new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"});
    await supabase.from("diligencias").update({status, firma_obs:firmaObs, hora_fin:status==="completada"?hFin:null}).eq("id",id);
    setFirmaModal(null);
    showToast(status==="completada"?`✅ ${id} completada`:`✓ ${id} actualizada`);
  }

  async function applyRechazo(id, motivo) {
    await supabase.from("diligencias").update({status:"rechazada", motivo_rechazo:motivo}).eq("id",id);
    setRechazoModal(null);
    showToast(`❌ ${id} rechazada`);
  }

  async function reasignarTarea(id, nuevoMensajero) {
    const now=new Date();
    await supabase.from("diligencias").update({messenger:nuevoMensajero,status:"pendiente",motivo_rechazo:"",firma_obs:"",hora:now.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"})}).eq("id",id);
    showToast(`✓ Reasignada a ${messengers[nuevoMensajero].nombre}`);
  }

  async function deleteTask(id) {
    await supabase.from("diligencias").delete().eq("id",id);
    showToast("Diligencia eliminada");
  }

  async function confirmReset() {
    if (!window.confirm("¿Limpiar todas las diligencias del día?")) return;
    await supabase.from("diligencias").delete().neq("id","__none__");
    await supabase.from("mensajeros").update({status:"libre"}).in("id",[0,1]);
    showToast("✓ Registro limpiado");
  }

  async function exportExcel() {
    if (!tasks.length) { showToast("⚠️ No hay diligencias"); return; }
    const XLSX=await getXLSX();
    const rows=tasks.map(t=>({ "ID":t.id,"Fecha":t.fecha,"Hora":t.hora,"Hora Fin":t.hora_fin||"—","Tipo":typeLabels[t.tipo],"Descripción":t.descripcion,"Destino":t.destino,"Mensajero":messengers[t.messenger]?.nombre,"Prioridad":t.prioridad,"Estado":t.status.replace("-"," ").replace(/w/g,l=>l.toUpperCase()),"Notas":t.nota||"","Obs. Entrega":t.firma_obs||"","Motivo Rechazo":t.motivo_rechazo||"" }));
    const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb,ws,"Registro");
    XLSX.writeFile(wb,`HV_Mensajeria_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast("✓ Excel exportado");
  }

  async function exportReporteSemanal() {
    const XLSX=await getXLSX();
    const now=new Date(); const lunes=new Date(now); lunes.setDate(now.getDate()-((now.getDay()+6)%7)); lunes.setHours(0,0,0,0);
    const semana=tasks.filter(t=>t.fecha_iso&&new Date(t.fecha_iso)>=lunes);
    if (!semana.length) { showToast("⚠️ Sin datos esta semana"); return; }
    const wb=XLSX.utils.book_new();
    const rows=semana.map(t=>({ "ID":t.id,"Fecha":t.fecha,"Tipo":typeLabels[t.tipo],"Descripción":t.descripcion,"Destino":t.destino,"Mensajero":messengers[t.messenger]?.nombre,"Estado":t.status }));
    const ws=XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb,ws,"Semana");
    XLSX.writeFile(wb,`HV_Reporte_Semanal_${lunes.toLocaleDateString("es-EC")}.xlsx`);
    showToast("✓ Reporte semanal exportado");
  }

  function minutosEsperando(task) {
    if (task.status!=="pendiente") return 0;
    try {
      const [h,m]=task.hora.replace(" a. m.","").replace(" p. m.","").split(":").map(Number);
      const esPM=task.hora.includes("p. m.")&&h!==12, esAM=task.hora.includes("a. m.")&&h===12;
      const h24=esPM?h+12:esAM?0:h;
      const d=new Date(ahora); d.setHours(h24,m,0,0);
      const diff=(ahora-d)/60000; return diff>0?Math.floor(diff):0;
    } catch(_) { return 0; }
  }

  function histFilteredTasks() {
    const now=new Date(), hoyISO=now.toISOString().slice(0,10);
    const d=new Date(now); d.setDate(d.getDate()-((d.getDay()+6)%7));
    const lunesISO=d.toISOString().slice(0,10), mesISO=hoyISO.slice(0,7);
    return tasks.filter(t=>{
      if (histFilter==="hoy")    return t.fecha_iso===hoyISO;
      if (histFilter==="semana") return t.fecha_iso>=lunesISO;
      if (histFilter==="mes")    return t.fecha_iso?.startsWith(mesISO);
      return true;
    });
  }

  const filteredActive=tasks.filter(t=>{
    if (t.status==="completada") return false;
    if (filter==="todas") return true;
    if (filter==="0"||filter==="1") return t.messenger===parseInt(filter);
    return t.tipo===filter;
  });
  const histTasks=histFilteredTasks();

  if (loading) return (
    <div style={{textAlign:"center",padding:"60px 0",color:CM.textGray}}>
      <div style={{fontSize:32,marginBottom:12}}>🌿</div>
      <div style={{fontSize:16,fontWeight:600}}>Cargando datos...</div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      {toast&&<div style={{position:"fixed",top:16,right:16,background:CM.green,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>{toast}</div>}
      {firmaModal&&<FirmaModal tarea={firmaModal} onConfirm={obs=>applyStatus(firmaModal.id,"completada",obs)} onCancel={()=>setFirmaModal(null)}/>}
      {rechazoModal&&<RechazoModal tarea={rechazoModal} onConfirm={motivo=>applyRechazo(rechazoModal.id,motivo)} onCancel={()=>setRechazoModal(null)}/>}

      {/* Sub-header */}
      <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:12,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:CM.text}}>Centro de Despacho — Mensajería HV</div>
          <div style={{fontSize:11,color:CM.textGray,marginTop:2}}>{fechaHoy}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:11,color:CM.greenM,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:CM.greenM}}/>
            Conectado a base de datos
          </div>
          <div style={{fontFamily:"monospace",fontSize:13,color:CM.textGray}}>{clock}</div>
          <button onClick={exportExcel} style={{padding:"7px 14px",background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:7,color:CM.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>📊 Exportar día</button>
          <button onClick={exportReporteSemanal} style={{padding:"7px 14px",background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:7,color:CM.blue,fontSize:12,fontWeight:700,cursor:"pointer"}}>📅 Reporte semanal</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"310px 1fr",gap:20}}>
        {/* SIDEBAR */}
        <div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,color:CM.textGray,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Mensajeros</div>
            {messengers.map((m,i)=>{
              const col={libre:CM.green,"en-ruta":CM.amber,"no-disponible":CM.red}[m.status]||CM.green;
              const mine=tasks.filter(t=>t.messenger===i&&t.status!=="completada"&&t.status!=="rechazada");
              return (
                <div key={i} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:14,marginBottom:10,borderLeft:`4px solid ${col}`,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:col+"22",border:`2px solid ${col}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:col}}>{i===0?"M1":"M2"}</div>
                      <div><div style={{fontWeight:700,fontSize:13,color:CM.text}}>{m.nombre}</div><div style={{fontSize:10,color:CM.textGray}}>{mine.length} activa{mine.length!==1?"s":""}</div></div>
                    </div>
                    <Badge texto={statusLabels[m.status]||"Libre"} color={col}/>
                  </div>
                  <div style={{marginBottom:10}}>
                    {mine.length===0?<div style={{fontSize:11,color:CM.textGray,fontStyle:"italic"}}>Sin diligencias asignadas</div>
                    :mine.map(t=>(
                      <div key={t.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:CM.textMid,background:CM.surface2,padding:"3px 8px",borderRadius:4,marginBottom:3}}>
                        <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:t.status==="en-progreso"?CM.blue:CM.amber}}/>
                        {typeIcons[t.tipo]} {t.descripcion?.slice(0,28)}{t.descripcion?.length>28?"...":""}
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    {[["libre","Libre",CM.green],["en-ruta","En ruta",CM.amber],["no-disponible","No disp.",CM.red]].map(([s,l,ac])=>(
                      <button key={s} onClick={()=>setStatus(i,s)} style={{flex:1,padding:"5px 0",fontSize:10,fontWeight:600,border:`1px solid ${m.status===s?ac:CM.border}`,background:m.status===s?ac+"18":"transparent",color:m.status===s?ac:CM.textGray,borderRadius:4,cursor:"pointer"}}>{l}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formulario */}
          <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:12,padding:16}}>
            <div style={{fontSize:10,fontWeight:700,color:CM.textGray,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Nueva Diligencia</div>
            {[
              {label:"Tipo",el:<select ref={fTipo} style={inputSt()}><option value="bancario">🏦 Trámite bancario</option><option value="entrega">📦 Entrega física</option><option value="recogida">🔄 Recogida</option><option value="institucional">🏛️ Institucional</option></select>},
              {label:"Descripción",el:<textarea ref={fDesc} placeholder="Ej: Pago factura..." style={inputSt({resize:"none",height:56,fontSize:12})}/>},
              {label:"Destino / Lugar",el:<input ref={fDest} placeholder="Ej: Banco Pichincha, Av. Amazonas" style={inputSt()}/>},
              {label:"Notas internas (opcional)",el:<input ref={fNota} placeholder="Ej: Preguntar por el Sr. López" style={inputSt({fontSize:12})}/>},
            ].map(({label,el})=>(
              <div key={label} style={{marginBottom:11}}><label style={{fontSize:11,color:CM.textGray,fontWeight:500,display:"block",marginBottom:4}}>{label}</label>{el}</div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              <div><label style={{fontSize:11,color:CM.textGray,fontWeight:500,display:"block",marginBottom:4}}>Mensajero</label>
                <select ref={fMens} style={inputSt()}>{messengers.map((m,i)=><option key={i} value={i}>{m.nombre}</option>)}</select></div>
              <div><label style={{fontSize:11,color:CM.textGray,fontWeight:500,display:"block",marginBottom:4}}>Prioridad</label>
                <select ref={fPrio} style={inputSt()}><option value="urgente">🚨 Urgente</option><option value="alta">🔴 Alta</option><option value="media">🟡 Media</option><option value="baja">⚪ Baja</option></select></div>
            </div>
            <button onClick={addTask} style={{width:"100%",padding:10,background:CM.green,color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>+ Asignar Diligencia</button>
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${CM.border}`,textAlign:"right"}}>
              <button onClick={confirmReset} style={{padding:"4px 12px",fontSize:11,border:`1px solid ${CM.red}44`,background:"transparent",color:CM.red,borderRadius:5,cursor:"pointer"}}>🗑 Limpiar día</button>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div>
          {/* Banners */}
          {tasks.filter(t=>t.prioridad==="urgente"&&t.status!=="completada"&&t.status!=="rechazada").length>0&&(
            <div style={{background:"#FFF0F0",border:"2px solid #7B0000",borderRadius:10,padding:"12px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:22}}>🚨</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:"#7B0000",marginBottom:4}}>DILIGENCIAS URGENTES ACTIVAS</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {tasks.filter(t=>t.prioridad==="urgente"&&t.status!=="completada"&&t.status!=="rechazada").map(t=>(
                    <span key={t.id} style={{background:"#7B0000",color:"#fff",borderRadius:5,padding:"2px 10px",fontSize:12,fontWeight:700}}>🚨 {t.id} · {messengers[t.messenger]?.nombre} · {t.descripcion?.slice(0,20)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tasks.filter(t=>t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS).length>0&&(
            <div style={{background:CM.amberL,border:`1px solid ${CM.amber}`,borderRadius:10,padding:"12px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:20}}>⚠️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:CM.amber,marginBottom:4}}>Pendientes por más de {UMBRAL_MINUTOS} minutos</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {tasks.filter(t=>t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS).map(t=>(
                    <span key={t.id} style={{background:CM.amber,color:"#fff",borderRadius:5,padding:"2px 10px",fontSize:12,fontWeight:600}}>{t.id} · {messengers[t.messenger]?.nombre} · {minutosEsperando(t)} min</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[{v:tasks.length,l:"Total hoy",c:CM.text},{v:tasks.filter(t=>t.status==="pendiente").length,l:"Pendientes",c:CM.amber},{v:tasks.filter(t=>t.status==="en-progreso").length,l:"En progreso",c:CM.blue},{v:tasks.filter(t=>t.status==="completada").length,l:"Completadas",c:CM.green}].map(({v,l,c})=>(
              <div key={l} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:"14px 18px",borderTop:`3px solid ${c}`}}>
                <div style={{fontSize:28,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
                <div style={{fontSize:11,color:CM.textGray,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:`2px solid ${CM.border}`,marginBottom:16}}>
            {[{id:"activas",label:"Diligencias Activas"},{id:"mapa",label:"🗺️ Mapa"},{id:"historial",label:"Historial"}].map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${activeTab===t.id?CM.green:"transparent"}`,marginBottom:-2,padding:"8px 18px",fontSize:12,fontWeight:activeTab===t.id?700:400,color:activeTab===t.id?CM.green:CM.textGray,cursor:"pointer"}}>{t.label}</button>
            ))}
          </div>

          {/* TAB ACTIVAS */}
          {activeTab==="activas"&&<>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[{f:"todas",l:"Todas"},{f:"bancario",l:"Bancarias"},{f:"entrega",l:"Entregas"},{f:"recogida",l:"Recogidas"},{f:"institucional",l:"Institucionales"},{f:"0",l:messengers[0]?.nombre},{f:"1",l:messengers[1]?.nombre}].map(({f,l})=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",fontSize:11,fontWeight:filter===f?700:400,border:`1px solid ${filter===f?CM.green:CM.border}`,background:filter===f?CM.greenL:"transparent",color:filter===f?CM.green:CM.textGray,borderRadius:16,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            {filteredActive.length===0?<div style={{textAlign:"center",padding:48,color:CM.textGray,fontSize:13}}><div style={{fontSize:32,marginBottom:10}}>📋</div>Sin diligencias activas</div>
            :filteredActive.map(t=>(
              <div key={t.id} className={t.prioridad==="urgente"?"tarea-urgente":""} style={{background:t.prioridad==="urgente"?"#FFF0F0":CM.surface,border:`1px solid ${t.prioridad==="urgente"?"#7B0000":CM.border}`,borderRadius:10,padding:14,marginBottom:10,display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,boxShadow:t.prioridad==="urgente"?"0 2px 12px rgba(123,0,0,0.15)":"0 1px 3px rgba(0,0,0,.05)"}}>
                <div style={{background:typeColor[t.tipo],borderRadius:3}}/>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>{t.id}</span>
                    <Badge texto={`${typeIcons[t.tipo]} ${typeLabels[t.tipo]}`} color={typeColor[t.tipo]}/>
                    <Badge texto={t.prioridad==="urgente"?"🚨 URGENTE":t.prioridad?.toUpperCase()||"MEDIA"} color={prioColor[t.prioridad]||CM.amber}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:CM.text,marginBottom:4}}>{t.descripcion}</div>
                  <div style={{fontSize:12,color:CM.textGray,marginBottom:4}}>📍 {t.destino}</div>
                  {t.nota&&<div style={{fontSize:11,color:CM.textMid,background:CM.surface2,padding:"3px 8px",borderRadius:4,marginBottom:4,borderLeft:`3px solid ${CM.border}`}}>📝 {t.nota}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:CM.textGray}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:t.messenger===0?CM.blueL:CM.amberL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:t.messenger===0?CM.blue:CM.amber}}>{t.messenger===0?"M1":"M2"}</div>
                      {messengers[t.messenger]?.nombre}
                    </div>
                    <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>Asignada {t.hora}</span>
                    {t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS&&<span style={{background:CM.amber,color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>⚠️ {minutosEsperando(t)} min</span>}
                  </div>
                  {t.motivo_rechazo&&<div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>❌ <strong>Motivo de rechazo:</strong> {t.motivo_rechazo}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  <select value={t.status} onChange={e=>changeStatus(t.id,e.target.value)} style={{fontSize:11,padding:"4px 8px",borderRadius:5,border:`1px solid ${CM.border}`,background:CM.surface2,color:CM.text,cursor:"pointer",outline:"none"}}>
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="en-progreso">🔵 En progreso</option>
                    <option value="completada">✅ Completada</option>
                    <option value="rechazada">❌ Rechazar</option>
                  </select>
                  <Badge texto={t.status.replace("-"," ").toUpperCase()} color={t.status==="completada"?CM.green:t.status==="en-progreso"?CM.blue:t.status==="rechazada"?"#C0392B":CM.amber}/>
                  {t.status==="rechazada"&&messengers.map((m,i)=>i!==t.messenger&&(
                    <button key={i} onClick={()=>reasignarTarea(t.id,i)} style={{fontSize:10,padding:"4px 8px",background:CM.greenL,border:`1px solid ${CM.green}`,color:CM.green,borderRadius:4,cursor:"pointer",fontWeight:600}}>↩ {m.nombre}</button>
                  ))}
                  <button onClick={()=>deleteTask(t.id)} style={{fontSize:10,padding:"3px 8px",border:`1px solid ${CM.red}44`,background:"transparent",color:CM.red,borderRadius:4,cursor:"pointer"}}>Eliminar</button>
                </div>
              </div>
            ))}
          </>}

          {activeTab==="mapa"&&<MapaView tasks={tasks} messengers={messengers}/>}

          {activeTab==="historial"&&<>
            <div style={{display:"flex",gap:6,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:CM.textGray}}>Período:</span>
              {[{f:"hoy",l:"Hoy"},{f:"semana",l:"Esta semana"},{f:"mes",l:"Este mes"},{f:"todo",l:"Todo"}].map(({f,l})=>(
                <button key={f} onClick={()=>setHistFilter(f)} style={{padding:"4px 12px",fontSize:11,fontWeight:histFilter===f?700:400,border:`1px solid ${histFilter===f?CM.green:CM.border}`,background:histFilter===f?CM.greenL:"transparent",color:histFilter===f?CM.green:CM.textGray,borderRadius:16,cursor:"pointer"}}>{l}</button>
              ))}
              <span style={{marginLeft:"auto",fontSize:11,color:CM.textGray}}>{histTasks.length} registros</span>
            </div>
            <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"75px 1fr 100px 90px 75px 85px",gap:10,padding:"9px 14px",background:CM.surface2,fontSize:10,fontWeight:700,color:CM.textGray,textTransform:"uppercase",letterSpacing:1}}>
                <div>ID</div><div>Diligencia</div><div>Mensajero</div><div>Tipo</div><div>Hora</div><div>Estado</div>
              </div>
              {histTasks.length===0?<div style={{textAlign:"center",padding:40,color:CM.textGray,fontSize:13}}>📂 Sin registros</div>
              :histTasks.map(t=>(
                <div key={t.id}>
                  <div style={{display:"grid",gridTemplateColumns:"75px 1fr 100px 90px 75px 85px",gap:10,padding:"10px 14px",borderTop:`1px solid ${CM.border}`,fontSize:12,alignItems:"start"}}>
                    <div style={{fontFamily:"monospace",fontSize:11,color:CM.textGray}}>{t.id}</div>
                    <div>
                      <div style={{color:CM.text,fontWeight:500,marginBottom:2}}>{t.descripcion?.slice(0,36)}{t.descripcion?.length>36?"...":""}</div>
                      <div style={{fontSize:10,color:CM.textGray}}>📍 {t.destino?.slice(0,34)}</div>
                      {t.nota&&<div style={{fontSize:10,color:CM.textMid}}>📝 {t.nota?.slice(0,34)}</div>}
                    </div>
                    <div style={{fontSize:11,color:CM.textGray}}>{messengers[t.messenger]?.nombre}</div>
                    <div><Badge texto={typeLabels[t.tipo]} color={typeColor[t.tipo]}/></div>
                    <div style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}><div>{t.hora}</div>{t.hora_fin&&<div style={{color:CM.greenM}}>✓{t.hora_fin}</div>}</div>
                    <div><Badge texto={t.status.replace("-"," ")} color={t.status==="completada"?CM.green:t.status==="en-progreso"?CM.blue:t.status==="rechazada"?"#C0392B":CM.amber}/></div>
                  </div>
                  {t.firma_obs&&<div style={{padding:"5px 14px 8px",fontSize:11,color:CM.textMid,background:CM.greenL,borderTop:`1px dashed ${CM.border}`}}>✅ <strong>Obs.:</strong> {t.firma_obs}</div>}
                  {t.motivo_rechazo&&<div style={{padding:"5px 14px 8px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderTop:"1px dashed #C0392B44"}}>❌ <strong>Motivo:</strong> {t.motivo_rechazo}</div>}
                </div>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
