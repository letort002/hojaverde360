const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// 1. Agregar estado para el umbral de alerta y tiempo actual
code = code.replace(
  `  const [firmaModal, setFirmaModal]   = useState(null);`,
  `  const [firmaModal, setFirmaModal]   = useState(null);
  const [ahora, setAhora]             = useState(new Date());
  const UMBRAL_MINUTOS                = 30; // Alerta si pendiente > 30 min`
);

// 2. Agregar useEffect para actualizar el tiempo cada minuto
code = code.replace(
  `  // Reloj`,
  `  // Ticker para alertas de tiempo
  useEffect(()=>{
    const id = setInterval(()=>setAhora(new Date()), 60000);
    return ()=>clearInterval(id);
  },[]);

  // Reloj`
);

// 3. Agregar función para calcular minutos pendiente
code = code.replace(
  `  function persist(t,c,m){`,
  `  function minutosEsperando(task) {
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

  function persist(t,c,m){`
);

// 4. Agregar banner de alertas encima de las stats
const bannerCode = `
          {/* Banner alertas pendientes */}
          {tasks.filter(t => t.status==="pendiente" && minutosEsperando(t) >= UMBRAL_MINUTOS).length > 0 && (
            <div style={{
              background:"#FFF3CD", border:"1px solid #C07A00",
              borderRadius:10, padding:"12px 18px", marginBottom:16,
              display:"flex", alignItems:"center", gap:12, flexWrap:"wrap"
            }}>
              <span style={{fontSize:20}}>⚠️</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#C07A00",marginBottom:4}}>
                  Diligencias pendientes por más de {UMBRAL_MINUTOS} minutos
                </div>
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
`;

// Insertar el banner antes de las stats
code = code.replace(
  `          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>`,
  bannerCode + `          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>`
);

// 5. Agregar indicador visual de tiempo en cada tarjeta pendiente
code = code.replace(
  `                      <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>Asignada {t.hora}</span>`,
  `                      <span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>Asignada {t.hora}</span>
                      {t.status==="pendiente" && minutosEsperando(t) >= UMBRAL_MINUTOS && (
                        <span style={{background:"#C07A00",color:"#fff",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>
                          ⚠️ {minutosEsperando(t)} min esperando
                        </span>
                      )}`
);

fs.writeFileSync("src/HV_Mensajeria.jsx", code, "utf8");

// Verificar
const final = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
console.log("minutosEsperando:", final.includes("minutosEsperando") ? "✅" : "❌");
console.log("Banner alertas:", final.includes("Diligencias pendientes por más") ? "✅" : "❌");
console.log("Indicador en tarjeta:", final.includes("min esperando") ? "✅" : "❌");
console.log("\nEjecuta: npm run dev");
console.log("\nNota: La alerta se activa cuando una diligencia lleva más de 30 minutos en Pendiente.");
console.log("Puedes cambiar el umbral editando UMBRAL_MINUTOS en HV_Mensajeria.jsx");
