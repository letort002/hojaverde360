import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "hv_mensajeria_v3";
const typeLabels  = { bancario:"Bancario", entrega:"Entrega", recogida:"Recogida", institucional:"Institucional" };
const typeIcons   = { bancario:"🏦", entrega:"📦", recogida:"🔄", institucional:"🏛️" };

const CM = {
  surface:"#FFFFFF", surface2:"#F2F7EE", border:"#D8E8D0",
  green:"#2D7A22", greenL:"#E8F5E1", greenM:"#4A9A3E",
  amber:"#C07A00", amberL:"#FFF3CD",
  red:"#C0392B",
  blue:"#1A6FAA",  blueL:"#E3F0FA",
  purple:"#6B46A8",
  text:"#1A2E12",  textMid:"#4A6340", textGray:"#7A8E74",
};
const typeColor = { bancario:CM.blue, entrega:CM.purple, recogida:CM.amber, institucional:CM.green };

function Badge({ texto, color }) {
  return <span style={{background:color+"22",color,border:`1px solid ${color}55`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{texto}</span>;
}

function inputSt(extra={}) {
  return { width:"100%", background:CM.surface2, border:`1px solid ${CM.border}`, borderRadius:6, padding:"8px 10px", color:CM.text, fontSize:13, fontFamily:"inherit", outline:"none", ...extra };
}

function FirmaModal({ tarea, onConfirm, onCancel }) {
  const [obs, setObs] = useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:14,padding:28,width:420,boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:18,marginBottom:4}}>✅ Confirmar Entrega</div>
        <div style={{fontSize:12,color:CM.textGray,marginBottom:18}}>{tarea.id} — {tarea.desc}</div>
        <div style={{background:CM.greenL,border:`1px solid ${CM.border}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:CM.textMid}}>
          <strong>📍 Destino:</strong> {tarea.dest}<br/>
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

export default function MensajeroPanel({ session, onLogout }) {
  const [tasks, setTasks]         = useState([]);
  const [messengers, setMessengers] = useState([{name:"Segundo Morales"},{name:"Marcelo Sandoval"}]);
  const [toast, setToast]         = useState("");
  const [clock, setClock]         = useState("");
  const [firmaModal, setFirmaModal] = useState(null);
  const myIdx = session.idx;

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    tick(); const id = setInterval(tick,1000); return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.tasks) setTasks(d.tasks);
        if (d.messengers) {
          setMessengers(prev => prev.map((m,i) => ({
            ...m,
            name: d.messengers[i]?.name || m.name,
            status: d.messengers[i]?.status || "libre"
          })));
        }
      } catch(_) {}
    }
    load();
    // Polling cada 15s para refrescar sin recargar
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),3000); }

  function changeStatus(id, newStatus) {
    if (newStatus === "completada") {
      const t = tasks.find(x => x.id === id);
      if (t) { setFirmaModal({id, desc:t.desc, dest:t.dest, hora:t.hora}); return; }
    }
    applyStatus(id, newStatus, "");
  }

  function applyStatus(id, status, firmaObs) {
    const hFin = new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"});
    const newTasks = tasks.map(t => t.id===id ? {...t, status, firmaObs, horaFin: status==="completada"?hFin:t.horaFin} : t);
    setTasks(newTasks);
    setFirmaModal(null);
    // Guardar en localStorage para que el admin también lo vea
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const d = raw ? JSON.parse(raw) : {};
      d.tasks = newTasks;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch(_) {}
    showToast(status==="completada" ? `✅ ${id} marcada como completada` : `✓ ${id} → ${status.replace("-"," ")}`);
  }

  const myTasks    = tasks.filter(t => t.messenger === myIdx);
  const pendientes = myTasks.filter(t => t.status === "pendiente");
  const enProgreso = myTasks.filter(t => t.status === "en-progreso");
  const completadas = myTasks.filter(t => t.status === "completada");

  return (
    <div style={{minHeight:"100vh", background:"#F8FAF5", fontFamily:"'Inter','Segoe UI',sans-serif"}}>

      {toast && <div style={{position:"fixed",top:16,right:16,background:CM.green,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>{toast}</div>}
      {firmaModal && <FirmaModal tarea={firmaModal} onConfirm={obs=>applyStatus(firmaModal.id,"completada",obs)} onCancel={()=>setFirmaModal(null)}/>}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:26}}>🌿</span>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Hoja Verde 360°</div>
            <div style={{fontSize:11,color:"#95D5B2"}}>Panel de Mensajería — {session.nombre}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#95D5B2"}}>{clock}</div>
          <button onClick={onLogout} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer"}}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px"}}>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
          {[
            {v:pendientes.length,  l:"Pendientes",   c:CM.amber},
            {v:enProgreso.length,  l:"En progreso",  c:CM.blue},
            {v:completadas.length, l:"Completadas",  c:CM.green},
          ].map(({v,l,c})=>(
            <div key={l} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:"16px 20px",borderTop:`3px solid ${c}`,textAlign:"center"}}>
              <div style={{fontSize:36,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
              <div style={{fontSize:12,color:CM.textGray,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Diligencias activas primero */}
        {[
          {label:"🔵 En progreso", items:enProgreso, color:CM.blue},
          {label:"⏳ Pendientes",  items:pendientes, color:CM.amber},
          {label:"✅ Completadas", items:completadas, color:CM.green},
        ].map(({label,items,color})=> items.length > 0 && (
          <div key={label} style={{marginBottom:24}}>
            <div style={{fontSize:12,fontWeight:700,color,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              {label} <span style={{background:color+"22",color,borderRadius:10,padding:"1px 8px",fontSize:11}}>{items.length}</span>
            </div>
            {items.map(t=>(
              <div key={t.id} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:16,marginBottom:10,display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                <div style={{background:typeColor[t.tipo],borderRadius:3}}/>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>{t.id}</span>
                    <Badge texto={`${typeIcons[t.tipo]} ${typeLabels[t.tipo]}`} color={typeColor[t.tipo]}/>
                    <Badge texto={t.prioridad?.toUpperCase()||"MEDIA"} color={t.prioridad==="alta"?CM.red:t.prioridad==="baja"?CM.textGray:CM.amber}/>
                  </div>
                  <div style={{fontSize:14,fontWeight:600,color:CM.text,marginBottom:4}}>{t.desc}</div>
                  <div style={{fontSize:12,color:CM.textGray,marginBottom:4}}>📍 {t.dest}</div>
                  {t.nota && <div style={{fontSize:11,color:CM.textMid,background:CM.surface2,padding:"3px 8px",borderRadius:4,borderLeft:`3px solid ${CM.border}`,marginBottom:4}}>📝 {t.nota}</div>}
                  <div style={{fontSize:11,color:CM.textGray}}>Asignada {t.hora}</div>
                  {t.firmaObs && <div style={{fontSize:11,color:CM.green,marginTop:4}}>✅ {t.firmaObs}</div>}
                </div>
                {t.status !== "completada" && (
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",justifyContent:"center"}}>
                    <select value={t.status} onChange={e=>changeStatus(t.id,e.target.value)} style={{fontSize:11,padding:"6px 10px",borderRadius:6,border:`1px solid ${CM.border}`,background:CM.surface2,color:CM.text,cursor:"pointer",outline:"none"}}>
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en-progreso">🔵 En progreso</option>
                      <option value="completada">✅ Completada</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {myTasks.length === 0 && (
          <div style={{textAlign:"center",padding:"60px 0",color:CM.textGray}}>
            <div style={{fontSize:48,marginBottom:12}}>📋</div>
            <div style={{fontSize:16,fontWeight:600}}>No tienes diligencias asignadas</div>
            <div style={{fontSize:13,marginTop:6}}>El coordinador te asignará tareas en breve</div>
          </div>
        )}
      </div>
    </div>
  );
}
