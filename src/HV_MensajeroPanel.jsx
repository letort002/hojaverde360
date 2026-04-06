import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";
import { CambiarClaveModal } from "./Auth.jsx";

const typeLabels  = { bancario:"Bancario", entrega:"Entrega", recogida:"Recogida", institucional:"Institucional" };
const typeIcons   = { bancario:"🏦", entrega:"📦", recogida:"🔄", institucional:"🏛️" };
const typeColor   = { bancario:"#1A6FAA", entrega:"#6B46A8", recogida:"#C07A00", institucional:"#2D7A22" };
const prioColor   = { urgente:"#7B0000", alta:"#C0392B", media:"#C07A00", baja:"#7A8E74" };

const CM = {
  surface:"#FFFFFF", surface2:"#F2F7EE", border:"#D8E8D0",
  green:"#2D7A22", greenL:"#E8F5E1", greenM:"#4A9A3E",
  amber:"#C07A00", red:"#C0392B", redL:"#FDECEA",
  blue:"#1A6FAA", text:"#1A2E12", textMid:"#4A6340", textGray:"#7A8E74",
};

function Badge({ texto, color }) {
  return <span style={{ background:color+"22", color, border:`1px solid ${color}55`, borderRadius:4, padding:"2px 8px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{texto}</span>;
}

function inputSt(extra={}) {
  return { width:"100%", background:CM.surface2, border:`1px solid ${CM.border}`, borderRadius:6, padding:"8px 10px", color:CM.text, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", ...extra };
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
        <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Ej: Entregado al guardia. Recibió: Juan García." style={inputSt({resize:"none",height:72,fontSize:12})}/>
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={()=>onConfirm(obs)} style={{flex:1,padding:10,background:CM.green,color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>✅ Confirmar entrega</button>
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

export default function MensajeroPanel({ session, onLogout }) {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState("");
  const [clock, setClock]           = useState("");
  const [firmaModal, setFirmaModal]   = useState(null);
  const [rechazoModal, setRechazoModal] = useState(null);
  const [claveModal, setClaveModal]   = useState(false);
  const myIdx = session.idx;

  useEffect(()=>{
    const tick=()=>setClock(new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);

  async function cargarTareas() {
    const { data } = await supabase.from("diligencias").select("*").eq("messenger", myIdx).order("created_at", { ascending:true });
    if (data) setTasks(data);
    setLoading(false);
  }

  useEffect(()=>{ cargarTareas(); },[]);

  // Suscripción tiempo real
  useEffect(()=>{
    const channel = supabase.channel(`mensajero-${myIdx}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"diligencias", filter:`messenger=eq.${myIdx}` }, ()=>cargarTareas())
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  },[]);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(""),3000); }

  function changeStatus(id, newStatus) {
    const t = tasks.find(x=>x.id===id);
    if (!t) return;
    if (newStatus==="completada") { setFirmaModal({id,descripcion:t.descripcion,destino:t.destino,hora:t.hora}); return; }
    if (newStatus==="rechazada")  { setRechazoModal({id,descripcion:t.descripcion,destino:t.destino}); return; }
    supabase.from("diligencias").update({status:newStatus}).eq("id",id).then(()=>showToast(`✓ ${id} → ${newStatus.replace("-"," ")}`));
  }

  async function applyStatus(id, status, firmaObs) {
    const hFin=new Date().toLocaleTimeString("es-EC",{hour:"2-digit",minute:"2-digit"});
    await supabase.from("diligencias").update({status, firma_obs:firmaObs, hora_fin:status==="completada"?hFin:null}).eq("id",id);
    setFirmaModal(null);
    showToast(`✅ ${id} completada`);
  }

  async function applyRechazo(id, motivo) {
    await supabase.from("diligencias").update({status:"rechazada", motivo_rechazo:motivo}).eq("id",id);
    setRechazoModal(null);
    showToast(`❌ ${id} rechazada`);
  }

  const pendientes  = tasks.filter(t=>t.status==="pendiente");
  const enProgreso  = tasks.filter(t=>t.status==="en-progreso");
  const completadas = tasks.filter(t=>t.status==="completada");
  const rechazadas  = tasks.filter(t=>t.status==="rechazada");

  const secciones = [
    {label:"🔵 En progreso", items:enProgreso,  color:CM.blue},
    {label:"⏳ Pendientes",  items:pendientes,  color:CM.amber},
    {label:"✅ Completadas", items:completadas, color:CM.green},
    {label:"❌ Rechazadas",  items:rechazadas,  color:CM.red},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#F8FAF5",fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      {toast&&<div style={{position:"fixed",top:16,right:16,background:CM.green,color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>{toast}</div>}
      {firmaModal&&<FirmaModal tarea={firmaModal} onConfirm={obs=>applyStatus(firmaModal.id,"completada",obs)} onCancel={()=>setFirmaModal(null)}/>}
      {rechazoModal&&<RechazoModal tarea={rechazoModal} onConfirm={motivo=>applyRechazo(rechazoModal.id,motivo)} onCancel={()=>setRechazoModal(null)}/>}
      {claveModal&&<CambiarClaveModal session={session} onClose={()=>setClaveModal(false)}/>}

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:26}}>🌿</span>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Hoja Verde 360°</div>
            <div style={{fontSize:11,color:"#95D5B2"}}>Panel de Mensajería — {session.nombre}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#95D5B2"}}>{clock}</div>
          <button onClick={()=>setClaveModal(true)} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer"}}>🔑 Cambiar clave</button>
          <button onClick={onLogout} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer"}}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px"}}>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
          {[{v:pendientes.length,l:"Pendientes",c:CM.amber},{v:enProgreso.length,l:"En progreso",c:CM.blue},{v:completadas.length,l:"Completadas",c:CM.green},{v:rechazadas.length,l:"Rechazadas",c:CM.red}].map(({v,l,c})=>(
            <div key={l} style={{background:CM.surface,border:`1px solid ${CM.border}`,borderRadius:10,padding:"14px 18px",borderTop:`3px solid ${c}`,textAlign:"center"}}>
              <div style={{fontSize:32,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
              <div style={{fontSize:12,color:CM.textGray,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"48px 0",color:CM.textGray}}>
            <div style={{fontSize:32,marginBottom:10}}>🌿</div>
            <div style={{fontSize:14}}>Cargando diligencias...</div>
          </div>
        ) : (
          <>
            {secciones.map(({label,items,color})=> items.length>0&&(
              <div key={label} style={{marginBottom:24}}>
                <div style={{fontSize:12,fontWeight:700,color,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                  {label} <span style={{background:color+"22",color,borderRadius:10,padding:"1px 8px",fontSize:11}}>{items.length}</span>
                </div>
                {items.map(t=>(
                  <div key={t.id} style={{background:t.prioridad==="urgente"?"#FFF0F0":CM.surface,border:`1px solid ${t.prioridad==="urgente"?"#7B0000":CM.border}`,borderRadius:10,padding:16,marginBottom:10,display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,.05)",opacity:t.status==="rechazada"?.75:1}}>
                    <div style={{background:typeColor[t.tipo],borderRadius:3}}/>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>{t.id}</span>
                        <Badge texto={`${typeIcons[t.tipo]} ${typeLabels[t.tipo]}`} color={typeColor[t.tipo]}/>
                        <Badge texto={t.prioridad==="urgente"?"🚨 URGENTE":t.prioridad?.toUpperCase()||"MEDIA"} color={prioColor[t.prioridad]||CM.amber}/>
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:CM.text,marginBottom:4}}>{t.descripcion}</div>
                      <div style={{fontSize:12,color:CM.textGray,marginBottom:4}}>📍 {t.destino}</div>
                      {t.nota&&<div style={{fontSize:11,color:CM.textMid,background:CM.surface2,padding:"3px 8px",borderRadius:4,borderLeft:`3px solid ${CM.border}`,marginBottom:4}}>📝 {t.nota}</div>}
                      <div style={{fontSize:11,color:CM.textGray}}>Asignada {t.hora}</div>
                      {t.firma_obs&&<div style={{fontSize:11,color:CM.green,marginTop:4,fontWeight:600}}>✅ {t.firma_obs}</div>}
                      {t.motivo_rechazo&&<div style={{fontSize:11,color:CM.red,marginTop:6,background:CM.redL,padding:"5px 10px",borderRadius:5,borderLeft:`3px solid ${CM.red}`}}>❌ <strong>Motivo:</strong> {t.motivo_rechazo}</div>}
                    </div>
                    {(t.status==="pendiente"||t.status==="en-progreso")&&(
                      <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",justifyContent:"center"}}>
                        <select value={t.status} onChange={e=>changeStatus(t.id,e.target.value)} style={{fontSize:11,padding:"6px 10px",borderRadius:6,border:`1px solid ${CM.border}`,background:CM.surface2,color:CM.text,cursor:"pointer",outline:"none"}}>
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="en-progreso">🔵 En progreso</option>
                          <option value="completada">✅ Completada</option>
                          <option value="rechazada">❌ Rechazar</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {tasks.length===0&&(
              <div style={{textAlign:"center",padding:"60px 0",color:CM.textGray}}>
                <div style={{fontSize:48,marginBottom:12}}>📋</div>
                <div style={{fontSize:16,fontWeight:600}}>No tienes diligencias asignadas</div>
                <div style={{fontSize:13,marginTop:6}}>El coordinador te asignará tareas en breve</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
