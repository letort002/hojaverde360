import { useState, useEffect, useRef } from "react";

const STORAGE_KEY  = "hv_mensajeria_v3";
const UMBRAL_MINUTOS = 30; // Alerta si diligencia lleva más de 30 min en Pendiente
const typeLabels   = { bancario:"Bancario", entrega:"Entrega", recogida:"Recogida", institucional:"Institucional" };
const typeIcons    = { bancario:"🏦", entrega:"📦", recogida:"🔄", institucional:"🏛️" };
const statusLabels = { libre:"Libre", "en-ruta":"En ruta", "no-disponible":"No disp." };

const CM = {
  bg:"#F8FAF5", surface:"#FFFFFF", surface2:"#F2F7EE", border:"#D8E8D0",
  green:"#2D7A22", greenL:"#E8F5E1", greenM:"#4A9A3E",
  amber:"#C07A00", amberL:"#FFF3CD",
  red:"#C0392B",   redL:"#FDECEA",
  blue:"#1A6FAA",  blueL:"#E3F0FA",
  purple:"#6B46A8",
  text:"#1A2E12",  textMid:"#4A6340", textGray:"#7A8E74",
};
const typeColor = { bancario:CM.blue, entrega:CM.purple, recogida:CM.amber, institucional:CM.green };
const prioColor = { alta:CM.red, media:CM.amber, baja:CM.textGray };

function loadScript(src, check) {
  return new Promise(resolve => {
    if (check()) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve;
    document.head.appendChild(s);
  });
}
function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}
async function getXLSX() {
  await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js", () => !!window.XLSX);
  return window.XLSX;
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
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q+", Quito, Ecuador")}&format=json&limit=1`,
      { headers:{"Accept-Language":"es"} }
    );
    const data = await r.json();
    if (data.length) {
      const res = { lat:parseFloat(data[0].lat), lng:parseFloat(data[0].lon) };
      geocodeCache[q] = res;
      return res;
    }
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
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ background:CM.surface, border:`1px solid ${CM.border}`, borderRadius:14, padding:28, width:420, boxShadow:"0 12px 48px rgba(0,0,0,0.2)" }}>
        <div style={{fontSize:18,marginBottom:4}}>✅ Confirmar Entrega</div>
        <div style={{fontSize:12,color:CM.textGray,marginBottom:18}}>{tarea.id} — {tarea.desc}</div>
        <div style={{background:CM.greenL,border:`1px solid ${CM.border}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:CM.textMid}}>
          <strong>📍 Destino:</strong> {tarea.dest}<br/>
          <strong>👤 Mensajero:</strong> {tarea.mesName}<br/>
          <strong>🕐 Asignada:</strong> {tarea.hora}
        </div>
        <label style={{fontSize:11,color:CM.textGray,fontWeight:600,display:"block",marginBottom:6}}>Observaciones de entrega (opcional)</label>
        <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ej: Entregado al guardia. Recibió: Juan García." style={inputSt({resize:"none",height:72,fontSize:12})}/>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={()=>onConfirm(obs)} style={{flex:1,padding:10,background:CM.green,color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>✅ Confirmar entrega</button>
          <button onClick={onCancel} style={{flex:1,padding:10,background:"transparent",color:CM.textGray,border:`1px solid ${CM.border}`,borderRadius:7,fontSize:13,cursor:"pointer"}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function MapaView({ tasks, messengers }) {
  const mapRef  = useRef(null);
  const mapObj  = useRef(null);
  const markers = useRef([]);
  const [info, setInfo] = useState("Cargando mapa...");
  const activeTasks = tasks.filter(t => t.status !== "completada");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const L = await getLeaflet();
      if (cancelled || !mapRef.current) return;
      if (!mapObj.current) {
        mapObj.current = L.map(mapRef.current).setView([-0.1807, -78.4678], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap" }).addTo(mapObj.current);
      }
      markers.current.forEach(m => m.remove());
      markers.current = [];
      const mesColors = ["#1A6FAA","#6B46A8"];
      let geocoded = 0;
      for (const t of activeTasks) {
        if (cancelled) break;
        const coords = t.coords || await geocode(t.dest);
        if (coords) {
          t.coords = coords;
          const col = mesColors[t.messenger] || CM.green;
          const icon = L.divIcon({
            className:"",
            html:`<div style="background:${col};color:#fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:13px"><span style="transform:rotate(45deg)">${typeIcons[t.tipo]}</span></div>`,
            iconSize:[28,28], iconAnchor:[14,28]
          });
          const mk = L.marker([coords.lat, coords.lng], {icon}).addTo(mapObj.current)
            .bindPopup(`<div style="font-family:sans-serif;min-width:160px"><div style="font-weight:700;margin-bottom:3px">${t.id}</div><div style="font-size:11px;color:#666;margin-bottom:3px">${typeIcons[t.tipo]} ${typeLabels[t.tipo]}</div><div style="font-size:12px;margin-bottom:3px">${t.desc}</div><div style="font-size:11px;color:#666">👤 ${messengers[t.messenger]?.name}</div><div style="font-size:11px;color:#666">📍 ${t.dest}</div></div>`);
          markers.current.push(mk);
          geocoded++;
        }
      }
      if (activeTasks.length === 0) setInfo("No hay diligencias activas para mostrar.");
      else if (geocoded === 0) setInfo("No se pudieron ubicar los destinos. Verifica que estén escritos correctamente.");
      else {
        setInfo(`${geocoded} de ${activeTasks.length} diligencias ubicadas en el mapa`);
        const group = L.featureGroup(markers.current);
        mapObj.current.fitBounds(group.getBounds().pad(0.35));
      }
    }
    init();
    return () => { cancelled = true; };
  }, [tasks]);

  return (
    <div>
      <div style={{background:CM.surface2,border:`1px solid ${CM.border}`,borderRadius:8,padding:"10px 16px",marginBottom:12,fontSize:12,color:CM.textMid,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span>🗺️ {info}</span>
        <div style={{marginLeft:"auto",display:"flex",gap:14}}>
          {[{c:"#1A6FAA",l:messengers[0]?.name},{c:"#6B46A8",l:messengers[1]?.name}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:x.c}}/>{x.l}
            </div>
          ))}
        </div>
      </div>
      <div ref={mapRef} style={{height:420,borderRadius:10,border:`1px solid ${CM.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}/>
      {activeTasks.length > 0 && (
        <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:6}}>
          {activeTasks.map(t=>(
            <div key={t.id} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:7,padding:"5px 12px",fontSize:11,display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:typeColor[t.tipo]}}/>
              <span style={{fontWeight:600}}>{t.id}</span>
              <span style={{color:CM.textGray}}>{t.dest.slice(0,28)}{t.dest.length>28?"...":""}</span>
              <Badge texto={messengers[t.messenger]?.name} color={t.messenger===0?CM.blue:CM.purple}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HVMensajeria() {
  const [messengers, setMessengers] = useState([{name:"Segundo Morales",status:"libre"},{name:"Marcelo Sandoval",status:"libre"}]);
  const [tasks, setTasks]           = useState([]);
  const [counter, setCounter]       = useState(1);
  const [filter, setFilter]         = useState("todas");
  const [activeTab, setActiveTab]   = useState("activas");
  const [histFilter, setHistFilter] = useState("hoy");
  const [saveLabel, setSaveLabel]   = useState("auto-guardado activo");
  const [toast, setToast]           = useState("");
  const [clock, setClock]           = useState("");
  const [fechaHoy, setFechaHoy]     = useState("");
  const [firmaModal, setFirmaModal] = useState(null);
  const saveTimer = useRef(null);
  const fTipo=useRef(),fDesc=useRef(),fDest=useRef(),fMens=useRef(),fPrio=useRef(),fNota=useRef();

  useEffect(()=>{
    const tick=()=>{
      const n=new Date();
      setClock(n.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
      setFechaHoy(n.toLocaleDateString("es-EC",{weekday:"long",year:"numeric",month:"long",day:"numeric"}));
    };
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    function loadFromStorage() {
      try {
        const raw=localStorage.getItem(STORAGE_KEY);
        if(!raw) return;
        const d=JSON.parse(raw);
        if(d.tasks)      setTasks(d.tasks);
        if(d.counter)    setCounter(d.counter);
        if(d.messengers) setMessengers(prev=>prev.map((m,i)=>({...m,status:d.messengers[i]||m.status})));
      }catch(_){}
    }
    loadFromStorage();
    setSaveLabel("datos restaurados ✓");
    setTimeout(()=>setSaveLabel("auto-guardado activo"),2500);
    // Polling cada 8s para reflejar cambios del mensajero
    const id = setInterval(loadFromStorage, 8000);
    return () => clearInterval(id);
  },[]);

  function minutosEsperando(task) {
    if (task.status !== "pendiente") return 0;
    try {
      const [h, m] = task.hora.replace(" a. m.","").replace(" p. m.","").split(":").map(Number);
      const esPM = task.hora.includes("p. m.") && h !== 12;
      const esAM = task.hora.includes("a. m.") && h === 12;
      const horas24 = esPM ? h + 12 : esAM ? 0 : h;
      const taskDate = new Date(ahora);
      taskDate.setHours(horas24, m, 0, 0);
      const diff = (ahora - taskDate) / 60000;
      return diff > 0 ? Math.floor(diff) : 0;
    } catch(_) { return 0; }
  }

  function persist(t,c,m){
    localStorage.setItem(STORAGE_KEY,JSON.stringify({tasks:t,counter:c,messengers:m.map(x=>x.status)}));
    setSaveLabel("✓ guardado");
    clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>setSaveLabel("auto-guardado activo"),2000);
  }
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),3000);}

  function setStatus(idx,status){
    const u=messengers.map((m,i)=>i===idx?{...m,status}:m);
    setMessengers(u); persist(tasks,counter,u);
    showToast(`${messengers[idx].name} → ${statusLabels[status]}`);
  }

  function addTask(){
    const tipo=fTipo.current.value,desc=fDesc.current.value.trim();
    const dest=fDest.current.value.trim(),midx=parseInt(fMens.current.value);
    const prio=fPrio.current.value,nota=fNota.current.value.trim();
    if(!desc){showToast("⚠️ Ingresa una descripción");return;}
    if(!dest){showToast("⚠️ Ingresa el destino");return;}
    const now=new Date();
    const task={
      id:"DG-"+String(counter).padStart(3,"0"),
      tipo,desc,dest,messenger:midx,prioridad:prio,
      status:"pendiente",nota,firmaObs:"",
      hora:now.toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"}),
      fecha:now.toLocaleDateString("es-EC"),
      fechaISO:now.toISOString().slice(0,10),
    };
    const nt=[...tasks,task],nc=counter+1;
    setTasks(nt);setCounter(nc);persist(nt,nc,messengers);
    fDesc.current.value="";fDest.current.value="";fNota.current.value="";
    showToast(`✓ Asignada a ${messengers[midx].name}`);
  }

  function changeStatus(id,newStatus){
    if(newStatus==="completada"){
      const t=tasks.find(x=>x.id===id);
      if(t){setFirmaModal({id,desc:t.desc,dest:t.dest,hora:t.hora,mesName:messengers[t.messenger]?.name});return;}
    }
    applyStatus(id,newStatus,"");
  }

  function applyStatus(id,status,firmaObs){
    const hFin=new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"});
    const nt=tasks.map(t=>t.id===id?{...t,status,firmaObs,horaFin:status==="completada"?hFin:t.horaFin}:t);
    setTasks(nt);persist(nt,counter,messengers);setFirmaModal(null);
    showToast(status==="completada"?`✅ ${id} completada`:`✓ ${id} → ${status.replace("-"," ")}`);
  }


  function reasignarTarea(id, nuevoMensajero) {
    const nt = tasks.map(t => t.id===id ? {
      ...t,
      messenger: nuevoMensajero,
      status: "pendiente",
      motivoRechazo: "",
      firmaObs: "",
      hora: new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"}),
    } : t);
    setTasks(nt); persist(nt, counter, messengers);
    showToast(`✓ Diligencia reasignada a ${messengers[nuevoMensajero].name}`);
  }
  function deleteTask(id){
    const nt=tasks.filter(t=>t.id!==id);
    setTasks(nt);persist(nt,counter,messengers);showToast("Diligencia eliminada");
  }

  function confirmReset(){
    if(!window.confirm("¿Limpiar todas las diligencias del día?")) return;
    const u=messengers.map(m=>({...m,status:"libre"}));
    setTasks([]);setCounter(1);setMessengers(u);persist([],1,u);
    showToast("✓ Registro limpiado");
  }

  async function exportExcel(){
    if(!tasks.length){showToast("⚠️ No hay diligencias para exportar");return;}
    const XLSX=await getXLSX();
    const rows=tasks.map(t=>({
      "ID":t.id,"Fecha":t.fecha,"Hora":t.hora,"Hora Fin":t.horaFin||"—",
      "Tipo":typeLabels[t.tipo],"Descripción":t.desc,"Destino":t.dest,
      "Mensajero":messengers[t.messenger]?.name,
      "Prioridad":t.prioridad.charAt(0).toUpperCase()+t.prioridad.slice(1),
      "Estado":t.status.replace("-"," ").replace(/\b\w/g,l=>l.toUpperCase()),
      "Motivo Rechazo":t.motivoRechazo||"",
      "Notas":t.nota||"","Obs. Entrega":t.firmaObs||"",
    }));
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.json_to_sheet(rows);
    ws["!cols"]=[{wch:9},{wch:12},{wch:7},{wch:9},{wch:14},{wch:40},{wch:28},{wch:14},{wch:10},{wch:14},{wch:28},{wch:28}];
    XLSX.utils.book_append_sheet(wb,ws,"Registro");
    const ws2=XLSX.utils.json_to_sheet([
      {Concepto:"Total",Valor:tasks.length},
      {Concepto:"Pendientes",Valor:tasks.filter(t=>t.status==="pendiente").length},
      {Concepto:"En progreso",Valor:tasks.filter(t=>t.status==="en-progreso").length},
      {Concepto:"Completadas",Valor:tasks.filter(t=>t.status==="completada").length},
      {Concepto:"---",Valor:""},
      {Concepto:messengers[0].name,Valor:tasks.filter(t=>t.messenger===0).length+" diligencias"},
      {Concepto:messengers[1].name,Valor:tasks.filter(t=>t.messenger===1).length+" diligencias"},
    ]);
    ws2["!cols"]=[{wch:22},{wch:22}];
    XLSX.utils.book_append_sheet(wb,ws2,"Resumen");
    XLSX.writeFile(wb,`HV_Mensajeria_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast("✓ Excel exportado");
  }

  function histFilteredTasks(){
    const now=new Date(),hoyISO=now.toISOString().slice(0,10);
    const d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7));
    const lunesISO=d.toISOString().slice(0,10);
    const mesISO=hoyISO.slice(0,7);
    return tasks.filter(t=>{
      if(histFilter==="hoy")    return t.fechaISO===hoyISO;
      if(histFilter==="semana") return t.fechaISO>=lunesISO;
      if(histFilter==="mes")    return t.fechaISO?.startsWith(mesISO);
      return true;
    });
  }

  const filteredActive=tasks.filter(t=>{
    if(t.status==="completada") return false;
    if(filter==="todas") return true;
    if(filter==="0"||filter==="1") return t.messenger===parseInt(filter);
    return t.tipo===filter;
  });

  const histTasks = histFilteredTasks();

  return (
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      {toast&&<div style={{position:"fixed",top:16,right:16,background:CM.green,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>{toast}</div>}
      {firmaModal&&<FirmaModal tarea={firmaModal} onConfirm={obs=>applyStatus(firmaModal.id,"completada",obs)} onCancel={()=>setFirmaModal(null)}/>}

      <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:12,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:CM.text}}>Centro de Despacho — Mensajería HV</div>
          <div style={{fontSize:11,color:CM.textGray,marginTop:2}}>{fechaHoy}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:11,color:CM.greenM,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:CM.greenM}}/>{saveLabel}
          </div>
          <div style={{fontFamily:"monospace",fontSize:13,color:CM.textGray}}>{clock}</div>
          <button onClick={exportExcel} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:7,color:CM.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>📊 Exportar Excel</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"310px 1fr",gap:20}}>
        <div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:10,fontWeight:700,color:CM.textGray,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Mensajeros</div>
            {messengers.map((m,i)=>{
              const col={libre:CM.green,"en-ruta":CM.amber,"no-disponible":CM.red}[m.status];
              const mine=tasks.filter(t=>t.messenger===i&&t.status!=="completada");
              return (
                <div key={i} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:14,marginBottom:10,borderLeft:`4px solid ${col}`,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:col+"22",border:`2px solid ${col}55`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:col}}>{i===0?"M1":"M2"}</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:CM.text}}>{m.name}</div>
                        <div style={{fontSize:10,color:CM.textGray}}>{mine.length} activa{mine.length!==1?"s":""}</div>
                      </div>
                    </div>
                    <Badge texto={statusLabels[m.status]} color={col}/>
                  </div>
                  <div style={{marginBottom:10}}>
                    {mine.length===0
                      ? <div style={{fontSize:11,color:CM.textGray,fontStyle:"italic"}}>Sin diligencias asignadas</div>
                      : mine.map(t=>(
                        <div key={t.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:CM.textMid,background:CM.surface2,padding:"3px 8px",borderRadius:4,marginBottom:3}}>
                          <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:t.status==="en-progreso"?CM.blue:CM.amber}}/>
                          {typeIcons[t.tipo]} {t.desc.slice(0,30)}{t.desc.length>30?"...":""}
                        </div>
                      ))
                    }
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

          <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:12,padding:16}}>
            <div style={{fontSize:10,fontWeight:700,color:CM.textGray,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Nueva Diligencia</div>
            {[
              {label:"Tipo",el:<select ref={fTipo} style={inputSt()}><option value="bancario">🏦 Trámite bancario / pago</option><option value="entrega">📦 Entrega física</option><option value="recogida">🔄 Recogida / pick-up</option><option value="institucional">🏛️ Diligencia institucional</option></select>},
              {label:"Descripción",el:<textarea ref={fDesc} placeholder="Ej: Pago factura Agroquímicos…" style={inputSt({resize:"none",height:56,fontSize:12})}/>},
              {label:"Destino / Lugar",el:<input ref={fDest} placeholder="Ej: Banco Pichincha, Av. Amazonas" style={inputSt()}/>},
              {label:"Notas internas (opcional)",el:<input ref={fNota} placeholder="Ej: Preguntar por el Sr. López" style={inputSt({fontSize:12})}/>},
            ].map(({label,el})=>(
              <div key={label} style={{marginBottom:11}}>
                <label style={{fontSize:11,color:CM.textGray,fontWeight:500,display:"block",marginBottom:4}}>{label}</label>
                {el}
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              <div>
                <label style={{fontSize:11,color:CM.textGray,fontWeight:500,display:"block",marginBottom:4}}>Mensajero</label>
                <select ref={fMens} style={inputSt()}><option value="0">{messengers[0].name}</option><option value="1">{messengers[1].name}</option></select>
              </div>
              <div>
                <label style={{fontSize:11,color:CM.textGray,fontWeight:500,display:"block",marginBottom:4}}>Prioridad</label>
                <select ref={fPrio} style={inputSt()}><option value="alta">🔴 Alta</option><option value="media">🟡 Media</option><option value="baja">⚪ Baja</option></select>
              </div>
            </div>
            <button onClick={addTask} style={{width:"100%",padding:10,background:CM.green,color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>+ Asignar Diligencia</button>
            <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${CM.border}`,textAlign:"right"}}>
              <button onClick={confirmReset} style={{padding:"4px 12px",fontSize:11,border:`1px solid ${CM.red}44`,background:"transparent",color:CM.red,borderRadius:5,cursor:"pointer"}}>🗑 Limpiar día</button>
            </div>
          </div>
        </div>

        <div>
          {/* Banner alertas pendientes */}
          {tasks.filter(t=>t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS).length>0&&(
            <div style={{background:"#FFF3CD",border:"1px solid #C07A00",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:20}}>⚠️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#C07A00",marginBottom:4}}>Diligencias pendientes por más de {UMBRAL_MINUTOS} minutos</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {tasks.filter(t=>t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS).map(t=>(
                    <span key={t.id} style={{background:"#C07A00",color:"#fff",borderRadius:5,padding:"2px 10px",fontSize:12,fontWeight:600}}>
                      {t.id} · {messengers[t.messenger]?.name} · {minutosEsperando(t)} min
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[{v:tasks.length,l:"Total hoy",c:CM.text},{v:tasks.filter(t=>t.status==="pendiente").length,l:"Pendientes",c:CM.amber},{v:tasks.filter(t=>t.status==="en-progreso").length,l:"En progreso",c:CM.blue},{v:tasks.filter(t=>t.status==="completada").length,l:"Completadas",c:CM.green}].map(({v,l,c})=>(
              <div key={l} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:"14px 18px",borderTop:`3px solid ${c}`}}>
                <div style={{fontSize:28,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
                <div style={{fontSize:11,color:CM.textGray,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",borderBottom:`2px solid ${CM.border}`,marginBottom:16}}>
            {[{id:"activas",label:"Diligencias Activas"},{id:"mapa",label:"🗺️ Mapa"},{id:"historial",label:"Historial"}].map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${activeTab===t.id?CM.green:"transparent"}`,marginBottom:-2,padding:"8px 18px",fontSize:12,fontWeight:activeTab===t.id?700:400,color:activeTab===t.id?CM.green:CM.textGray,cursor:"pointer"}}>{t.label}</button>
            ))}
          </div>

          {activeTab==="activas" && <>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[{f:"todas",l:"Todas"},{f:"bancario",l:"Bancarias"},{f:"entrega",l:"Entregas"},{f:"recogida",l:"Recogidas"},{f:"institucional",l:"Institucionales"},{f:"0",l:messengers[0].name},{f:"1",l:messengers[1].name}].map(({f,l})=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",fontSize:11,fontWeight:filter===f?700:400,border:`1px solid ${filter===f?CM.green:CM.border}`,background:filter===f?CM.greenL:"transparent",color:filter===f?CM.green:CM.textGray,borderRadius:16,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            {filteredActive.length===0
              ? <div style={{textAlign:"center",padding:48,color:CM.textGray,fontSize:13}}><div style={{fontSize:32,marginBottom:10}}>📋</div>Sin diligencias activas</div>
              : filteredActive.map(t=>(
                <div key={t.id} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:14,marginBottom:10,display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                  <div style={{background:typeColor[t.tipo],borderRadius:3}}/>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>{t.id}</span>
                      <Badge texto={`${typeIcons[t.tipo]} ${typeLabels[t.tipo]}`} color={typeColor[t.tipo]}/>
                      <Badge texto={t.prioridad.toUpperCase()} color={prioColor[t.prioridad]}/>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:CM.text,marginBottom:4}}>{t.desc}</div>
                    <div style={{fontSize:12,color:CM.textGray,marginBottom:4}}>📍 {t.dest}</div>
                    {t.nota&&<div style={{fontSize:11,color:CM.textMid,background:CM.surface2,padding:"3px 8px",borderRadius:4,marginBottom:4,borderLeft:`3px solid ${CM.border}`}}>📝 {t.nota}</div>}
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:CM.textGray}}>
                        <div style={{width:18,height:18,borderRadius:"50%",background:t.messenger===0?CM.blueL:CM.amberL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:t.messenger===0?CM.blue:CM.amber}}>{t.messenger===0?"M1":"M2"}</div>
                        {messengers[t.messenger]?.name}
                      </div>
                      <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>Asignada {t.hora}</span>
                      {t.status==="pendiente" && minutosEsperando(t) >= UMBRAL_MINUTOS && (
                        <span style={{background:"#C07A00",color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>
                          ⚠️ {minutosEsperando(t)} min esperando
                        </span>
                      )}
                    </div>
                    {t.motivoRechazo&&(
                      <div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>
                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                    <select value={t.status} onChange={e=>changeStatus(t.id,e.target.value)} style={{fontSize:11,padding:"4px 8px",borderRadius:5,border:`1px solid ${CM.border}`,background:CM.surface2,color:CM.text,cursor:"pointer",outline:"none"}}>
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en-progreso">🔵 En progreso</option>
                      <option value="completada">✅ Completada</option>
                      <option value="rechazada">❌ Rechazada (admin)</option>
                    </select>
                    <Badge texto={t.status.replace("-"," ").toUpperCase()} color={t.status==="completada"?"#2D7A22":t.status==="en-progreso"?"#1A6FAA":t.status==="rechazada"?"#C0392B":"#C07A00"}/>
                    {t.status==="rechazada" && (
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        <div style={{fontSize:10,color:CM.textGray,textAlign:"center"}}>Reasignar a:</div>
                        {messengers.map((m,i)=> i!==t.messenger && (
                          <button key={i} onClick={()=>reasignarTarea(t.id,i)} style={{fontSize:10,padding:"4px 8px",background:CM.greenL,border:`1px solid ${CM.green}`,color:CM.green,borderRadius:4,cursor:"pointer",fontWeight:600}}>
                            ↩ {m.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>deleteTask(t.id)} style={{fontSize:10,padding:"3px 8px",border:`1px solid ${CM.red}44`,background:"transparent",color:CM.red,borderRadius:4,cursor:"pointer"}}>Eliminar</button>
                  </div>
                </div>
              ))
            }
          </>}

          {activeTab==="mapa" && <MapaView tasks={tasks} messengers={messengers}/>}

          {activeTab==="historial" && <>
            <div style={{display:"flex",gap:6,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:CM.textGray}}>Período:</span>
              {[{f:"hoy",l:"Hoy"},{f:"semana",l:"Esta semana"},{f:"mes",l:"Este mes"},{f:"todo",l:"Todo"}].map(({f,l})=>(
                <button key={f} onClick={()=>setHistFilter(f)} style={{padding:"4px 12px",fontSize:11,fontWeight:histFilter===f?700:400,border:`1px solid ${histFilter===f?CM.green:CM.border}`,background:histFilter===f?CM.greenL:"transparent",color:histFilter===f?CM.green:CM.textGray,borderRadius:16,cursor:"pointer"}}>{l}</button>
              ))}
              <span style={{marginLeft:"auto",fontSize:11,color:CM.textGray}}>{histTasks.length} registro{histTasks.length!==1?"s":""}</span>
            </div>
            <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"75px 1fr 100px 90px 75px 85px",gap:10,padding:"9px 14px",background:CM.surface2,fontSize:10,fontWeight:700,color:CM.textGray,textTransform:"uppercase",letterSpacing:1}}>
                <div>ID</div><div>Diligencia</div><div>Mensajero</div><div>Tipo</div><div>Hora</div><div>Estado</div>
              </div>
              {histTasks.length===0
                ? <div style={{textAlign:"center",padding:40,color:CM.textGray,fontSize:13}}>📂 Sin registros en este período</div>
                : histTasks.map(t=>(
                  <div key={t.id}>
                    <div style={{display:"grid",gridTemplateColumns:"75px 1fr 100px 90px 75px 85px",gap:10,padding:"10px 14px",borderTop:`1px solid ${CM.border}`,fontSize:12,alignItems:"start"}}>
                      <div style={{fontFamily:"monospace",fontSize:11,color:CM.textGray,paddingTop:2}}>{t.id}</div>
                      <div>
                        <div style={{color:CM.text,fontWeight:500,marginBottom:2}}>{t.desc.slice(0,36)}{t.desc.length>36?"...":""}</div>
                        <div style={{fontSize:10,color:CM.textGray}}>📍 {t.dest.slice(0,34)}{t.dest.length>34?"...":""}</div>
                        {t.nota&&<div style={{fontSize:10,color:CM.textMid}}>📝 {t.nota.slice(0,34)}</div>}
                      </div>
                      <div style={{fontSize:11,color:CM.textGray,paddingTop:2}}>{messengers[t.messenger]?.name}</div>
                      <div><Badge texto={typeLabels[t.tipo]} color={typeColor[t.tipo]}/></div>
                      <div style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>
                        <div>{t.hora}</div>
                        {t.horaFin&&<div style={{color:CM.greenM}}>✓{t.horaFin}</div>}
                      </div>
                      <div><Badge texto={t.status.replace("-"," ")} color={t.status==="completada"?"#2D7A22":t.status==="en-progreso"?"#1A6FAA":t.status==="rechazada"?"#C0392B":"#C07A00"}/></div>
                    </div>
                    {t.firmaObs&&<div style={{padding:"5px 14px 8px",fontSize:11,color:CM.textMid,background:CM.greenL,borderTop:`1px dashed ${CM.border}`}}>✅ <strong>Obs. entrega:</strong> {t.firmaObs}</div>}
                    {t.motivoRechazo&&<div style={{padding:"5px 14px 8px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderTop:"1px dashed #C0392B44",borderLeft:"3px solid #C0392B"}}>❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}</div>}
                  </div>
                ))
              }
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
