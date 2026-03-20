const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "HV_MensajeroPanel.jsx");
let code = fs.readFileSync(filePath, "utf8");

// 1. Agregar estado del modal de rechazo junto al de firma
code = code.replace(
  `const [firmaModal, setFirmaModal] = useState(null);`,
  `const [firmaModal, setFirmaModal] = useState(null);
  const [rechazoModal, setRechazoModal] = useState(null);`
);

// 2. Agregar componente RechazoModal antes de FirmaModal
const rechazoModal = `
function RechazoModal({ tarea, onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState("");
  const [error, setError]   = useState("");

  function handleConfirm() {
    if (!motivo.trim()) { setError("Debes ingresar el motivo del rechazo."); return; }
    onConfirm(motivo.trim());
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <div style={{background:"#fff",border:"1px solid #D8E8D0",borderRadius:14,padding:28,width:420,boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:18,marginBottom:4,color:"#C0392B"}}>❌ Rechazar Diligencia</div>
        <div style={{fontSize:12,color:"#7A8E74",marginBottom:18}}>{tarea.id} — {tarea.desc}</div>
        <div style={{background:"#FDECEA",border:"1px solid #C0392B44",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#4A6340"}}>
          <strong>📍 Destino:</strong> {tarea.dest}
        </div>
        <label style={{fontSize:11,color:"#7A8E74",fontWeight:600,display:"block",marginBottom:6}}>
          Motivo del rechazo <span style={{color:"#C0392B"}}>*</span>
        </label>
        <textarea
          value={motivo} onChange={e=>{setMotivo(e.target.value);setError("");}}
          placeholder="Ej: No tengo movilización disponible. / El lugar está fuera de mi ruta. / Problema personal."
          style={{width:"100%",background:"#F2F7EE",border:"1px solid #D8E8D0",borderRadius:6,padding:"8px 10px",color:"#1A2E12",fontSize:13,fontFamily:"inherit",outline:"none",resize:"none",height:80,boxSizing:"border-box"}}
          autoFocus
        />
        {error && <div style={{fontSize:11,color:"#C0392B",marginTop:4}}>⚠️ {error}</div>}
        <div style={{display:"flex",gap:10,marginTop:18}}>
          <button onClick={handleConfirm} style={{flex:1,padding:10,background:"#C0392B",color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>
            ❌ Confirmar rechazo
          </button>
          <button onClick={onCancel} style={{flex:1,padding:10,background:"transparent",color:"#7A8E74",border:"1px solid #D8E8D0",borderRadius:7,fontSize:13,cursor:"pointer"}}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

`;

code = code.replace(
  `function FirmaModal`,
  rechazoModal + `function FirmaModal`
);

// 3. Agregar función applyRechazo junto a applyStatus
code = code.replace(
  `  function applyStatus(id, status, firmaObs) {`,
  `  function applyRechazo(id, motivo) {
    const newTasks = tasks.map(t => t.id===id ? {...t, status:"rechazada", motivoRechazo: motivo} : t);
    setTasks(newTasks);
    setRechazoModal(null);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const d = raw ? JSON.parse(raw) : {};
      d.tasks = newTasks;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch(_) {}
    showToast(\`❌ \${id} rechazada\`);
  }

  function applyStatus(id, status, firmaObs) {`
);

// 4. Actualizar changeStatus para manejar rechazo
code = code.replace(
  `  function changeStatus(id, newStatus) {
    if (newStatus === "completada") {
      const t = tasks.find(x => x.id === id);
      if (t) { setFirmaModal({id, desc:t.desc, dest:t.dest, hora:t.hora}); return; }
    }
    applyStatus(id, newStatus, "");
  }`,
  `  function changeStatus(id, newStatus) {
    if (newStatus === "completada") {
      const t = tasks.find(x => x.id === id);
      if (t) { setFirmaModal({id, desc:t.desc, dest:t.dest, hora:t.hora}); return; }
    }
    if (newStatus === "rechazada") {
      const t = tasks.find(x => x.id === id);
      if (t) { setRechazoModal({id, desc:t.desc, dest:t.dest}); return; }
    }
    applyStatus(id, newStatus, "");
  }`
);

// 5. Agregar render del RechazoModal junto al FirmaModal
code = code.replace(
  `{firmaModal && <FirmaModal tarea={firmaModal} onConfirm={obs=>applyStatus(firmaModal.id,"completada",obs)} onCancel={()=>setFirmaModal(null)}/>}`,
  `{firmaModal && <FirmaModal tarea={firmaModal} onConfirm={obs=>applyStatus(firmaModal.id,"completada",obs)} onCancel={()=>setFirmaModal(null)}/>}
      {rechazoModal && <RechazoModal tarea={rechazoModal} onConfirm={motivo=>applyRechazo(rechazoModal.id,motivo)} onCancel={()=>setRechazoModal(null)}/>}`
);

// 6. Agregar opción rechazada al selector de estado
code = code.replace(
  `<option value="completada">✅ Completada</option>
                    </select>`,
  `<option value="completada">✅ Completada</option>
                      <option value="rechazada">❌ Rechazar</option>
                    </select>`
);

// 7. Mostrar motivo de rechazo en la tarjeta si existe
code = code.replace(
  `{t.firmaObs && <div style={{fontSize:11,color:CM.green,marginTop:4}}>✅ {t.firmaObs}</div>}`,
  `{t.firmaObs && <div style={{fontSize:11,color:CM.green,marginTop:4}}>✅ {t.firmaObs}</div>}
                  {t.motivoRechazo && <div style={{fontSize:11,color:CM.red,marginTop:4,background:"#FDECEA",padding:"3px 8px",borderRadius:4}}>❌ Rechazada: {t.motivoRechazo}</div>}`
);

// 8. Incluir rechazadas en la sección de completadas del historial
code = code.replace(
  `  const completadas = myTasks.filter(t => t.status === "completada");`,
  `  const completadas  = myTasks.filter(t => t.status === "completada");
  const rechazadas   = myTasks.filter(t => t.status === "rechazada");`
);

// 9. Agregar sección rechazadas en el render
code = code.replace(
  `  {myTasks.length === 0 && (`,
  `  {rechazadas.length > 0 && (
          <div style={{marginBottom:24}}>
            <div style={{fontSize:12,fontWeight:700,color:CM.red,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              ❌ Rechazadas <span style={{background:CM.red+"22",color:CM.red,borderRadius:10,padding:"1px 8px",fontSize:11}}>{rechazadas.length}</span>
            </div>
            {rechazadas.map(t=>(
              <div key={t.id} style={{background:"#fff",border:"1px solid #D8E8D0",borderRadius:10,padding:16,marginBottom:10,display:"grid",gridTemplateColumns:"5px 1fr",gap:14,boxShadow:"0 1px 3px rgba(0,0,0,.05)",opacity:.75}}>
                <div style={{background:typeColor[t.tipo],borderRadius:3}}/>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>{t.id}</span>
                    <Badge texto={\`\${typeIcons[t.tipo]} \${typeLabels[t.tipo]}\`} color={typeColor[t.tipo]}/>
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:CM.text,marginBottom:4}}>{t.desc}</div>
                  <div style={{fontSize:12,color:CM.textGray,marginBottom:6}}>📍 {t.dest}</div>
                  <div style={{fontSize:11,color:CM.red,background:"#FDECEA",padding:"4px 10px",borderRadius:5,display:"inline-block"}}>
                    ❌ Motivo: {t.motivoRechazo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

  {myTasks.length === 0 && (`
);

fs.writeFileSync(filePath, code, "utf8");
console.log("✅ Funcionalidad de rechazo agregada al panel del mensajero");
console.log("\nEjecuta: npm run dev");
