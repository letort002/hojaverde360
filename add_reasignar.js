const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// 1. Agregar función reasignarTarea después de deleteTask
const reasignarFn = `
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
    showToast(\`✓ Diligencia reasignada a \${messengers[nuevoMensajero].name}\`);
  }
`;

code = code.replace(
  `  function deleteTask(id){`,
  reasignarFn + `  function deleteTask(id){`
);

// 2. Agregar botón de reasignación en tarjetas rechazadas
// Buscar el botón Eliminar en las tarjetas activas y agregar reasignar antes
code = code.replace(
  `                    <button onClick={()=>deleteTask(t.id)} style={{fontSize:10,padding:"3px 8px",border:\`1px solid \${CM.red}44\`,background:"transparent",color:CM.red,borderRadius:4,cursor:"pointer"}}>Eliminar</button>`,
  `                    {t.status==="rechazada" && (
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        <div style={{fontSize:10,color:CM.textGray,textAlign:"center"}}>Reasignar a:</div>
                        {messengers.map((m,i)=> i!==t.messenger && (
                          <button key={i} onClick={()=>reasignarTarea(t.id,i)} style={{fontSize:10,padding:"4px 8px",background:CM.greenL,border:\`1px solid \${CM.green}\`,color:CM.green,borderRadius:4,cursor:"pointer",fontWeight:600}}>
                            ↩ {m.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={()=>deleteTask(t.id)} style={{fontSize:10,padding:"3px 8px",border:\`1px solid \${CM.red}44\`,background:"transparent",color:CM.red,borderRadius:4,cursor:"pointer"}}>Eliminar</button>`
);

fs.writeFileSync("src/HV_Mensajeria.jsx", code, "utf8");

// Verificar
const final = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
console.log("reasignarTarea:", final.includes("reasignarTarea") ? "✅" : "❌");
console.log("Reasignar a:", final.includes("Reasignar a:") ? "✅" : "❌");
console.log("\nEjecuta: npm run dev");
