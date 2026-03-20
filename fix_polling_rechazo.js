const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "HV_Mensajeria.jsx");
let code = fs.readFileSync(filePath, "utf8");

// 1. Agregar polling en el useEffect de carga del admin
// Buscar el useEffect de carga y agregar intervalo
code = code.replace(
  `  useEffect(()=>{
    try {
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const d=JSON.parse(raw);
      if(d.tasks)      setTasks(d.tasks);
      if(d.counter)    setCounter(d.counter);
      if(d.messengers) setMessengers(prev=>prev.map((m,i)=>({...m,status:d.messengers[i]||m.status})));
      setSaveLabel("datos restaurados ✓");
      setTimeout(()=>setSaveLabel("auto-guardado activo"),2500);
    }catch(_){}
  },[]);`,
  `  useEffect(()=>{
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
  },[]);`
);

// 2. Mostrar motivoRechazo en tarjetas del historial también
// Buscar el bloque de historial y agregar motivoRechazo
code = code.replace(
  `{t.firmaObs&&<div style={{padding:"5px 14px 8px",fontSize:11,color:CM.textMid,background:CM.greenL,borderTop:\`1px dashed \${CM.border}\`}}>✅ <strong>Obs. entrega:</strong> {t.firmaObs}</div>}`,
  `{t.firmaObs&&<div style={{padding:"5px 14px 8px",fontSize:11,color:CM.textMid,background:CM.greenL,borderTop:\`1px dashed \${CM.border}\`}}>✅ <strong>Obs. entrega:</strong> {t.firmaObs}</div>}
                    {t.motivoRechazo&&<div style={{padding:"5px 14px 8px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderTop:"1px dashed #C0392B44",borderLeft:"3px solid #C0392B"}}>❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}</div>}`
);

fs.writeFileSync(filePath, code, "utf8");

// Verificar
const final = fs.readFileSync(filePath, "utf8");
console.log("motivoRechazo en archivo:", (final.match(/motivoRechazo/g)||[]).length, "veces");
console.log("polling setInterval:", final.includes("setInterval(loadFromStorage") ? "✅" : "❌");
console.log("\n✅ Listo. Ejecuta: npm run dev");
