const fs = require("fs");

// ── PATCH HV_Mensajeria.jsx ───────────────────────────────────
let admin = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// 1. Agregar "urgente" al prioColor
admin = admin.replace(
  `const prioColor = { alta:CM.red, media:CM.amber, baja:CM.textGray };`,
  `const prioColor = { urgente:"#7B0000", alta:CM.red, media:CM.amber, baja:CM.textGray };`
);

// 2. Agregar opción urgente en el formulario
admin = admin.replace(
  `<option value="alta">🔴 Alta</option>`,
  `<option value="urgente">🚨 Urgente</option>
                <option value="alta">🔴 Alta</option>`
);

// 3. Agregar animación CSS para urgente al inicio del componente
const urgentCSS = `
  // Estilo urgente
  React.useEffect(() => {
    if (!document.getElementById("hv-urgente-style")) {
      const style = document.createElement("style");
      style.id = "hv-urgente-style";
      style.textContent = \`
        @keyframes urgenteFlash {
          0%,100% { border-color: #7B0000; box-shadow: 0 0 0 0 rgba(123,0,0,0); }
          50% { border-color: #FF0000; box-shadow: 0 0 0 4px rgba(255,0,0,0.2); }
        }
        .tarea-urgente { animation: urgenteFlash 1.5s infinite; border-color: #7B0000 !important; }
      \`;
      document.head.appendChild(style);
    }
  }, []);

`;

admin = admin.replace(
  `  // Reloj`,
  urgentCSS + `  // Reloj`
);

// 4. Agregar clase urgente a las tarjetas
admin = admin.replace(
  `                display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,
                boxShadow:"0 1px 3px rgba(0,0,0,.05)"`,
  `                display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,
                boxShadow:"0 1px 3px rgba(0,0,0,.05)"`,
);

// Agregar className urgente a la tarjeta
admin = admin.replace(
  `              <div key={t.id} style={{
                  background:CM.surface,border:\`1px solid \${CM.border}\`,borderRadius:10,
                  padding:14,marginBottom:10,
                  display:"grid",gridTemplateColumns:"5px 1fr auto",gap:14,
                  boxShadow:"0 1px 3px rgba(0,0,0,.05)"
                }}>`,
  `              <div key={t.id} className={t.prioridad==="urgente"?"tarea-urgente":""} style={{
                  background:t.prioridad==="urgente"?"#FFF0F0":CM.surface,
                  border:\`1px solid \${t.prioridad==="urgente"?"#7B0000":CM.border}\`,
                  borderRadius:10, padding:14, marginBottom:10,
                  display:"grid", gridTemplateColumns:"5px 1fr auto", gap:14,
                  boxShadow:t.prioridad==="urgente"?"0 2px 12px rgba(123,0,0,0.15)":"0 1px 3px rgba(0,0,0,.05)"
                }}>`
);

// 5. Badge urgente con color especial
admin = admin.replace(
  `<Badge texto={t.prioridad.toUpperCase()} color={prioColor[t.prioridad]}/>`,
  `<Badge texto={t.prioridad==="urgente"?"🚨 URGENTE":t.prioridad.toUpperCase()} color={prioColor[t.prioridad]||CM.red}/>`
);

// 6. Banner especial para urgentes
const urgentesBanner = `
          {/* Banner urgentes */}
          {tasks.filter(t=>t.prioridad==="urgente"&&t.status!=="completada"&&t.status!=="rechazada").length>0&&(
            <div style={{background:"#FFF0F0",border:"2px solid #7B0000",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",animation:"urgenteFlash 1.5s infinite"}}>
              <span style={{fontSize:22}}>🚨</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:800,color:"#7B0000",marginBottom:4}}>
                  DILIGENCIAS URGENTES ACTIVAS
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {tasks.filter(t=>t.prioridad==="urgente"&&t.status!=="completada"&&t.status!=="rechazada").map(t=>(
                    <span key={t.id} style={{background:"#7B0000",color:"#fff",borderRadius:5,padding:"2px 10px",fontSize:12,fontWeight:700}}>
                      🚨 {t.id} · {messengers[t.messenger]?.name} · {t.desc.slice(0,25)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
`;

// Insertar banner urgente ANTES del banner de alertas de tiempo
admin = admin.replace(
  `          {/* Banner alertas pendientes */}`,
  urgentesBanner + `          {/* Banner alertas pendientes */}`
);

fs.writeFileSync("src/HV_Mensajeria.jsx", admin, "utf8");
console.log("✅ HV_Mensajeria.jsx actualizado");

// ── PATCH HV_MensajeroPanel.jsx ──────────────────────────────
let mensajero = fs.readFileSync("src/HV_MensajeroPanel.jsx", "utf8");

// Agregar color urgente
mensajero = mensajero.replace(
  `const typeColor = { bancario:CM.blue, entrega:CM.purple, recogida:CM.amber, institucional:CM.green };`,
  `const typeColor = { bancario:CM.blue, entrega:CM.purple, recogida:CM.amber, institucional:CM.green };
const prioColor = { urgente:"#7B0000", alta:CM.red, media:CM.amber, baja:CM.textGray };`
);

// Badge urgente en panel mensajero
mensajero = mensajero.replace(
  `<Badge texto={t.prioridad?.toUpperCase()||"MEDIA"} color={t.prioridad==="alta"?CM.red:t.prioridad==="baja"?CM.textGray:CM.amber}/>`,
  `<Badge texto={t.prioridad==="urgente"?"🚨 URGENTE":t.prioridad?.toUpperCase()||"MEDIA"} color={prioColor[t.prioridad]||CM.amber}/>`
);

// Tarjeta urgente en panel mensajero
mensajero = mensajero.replace(
  `              <div key={t.id} style={{
                background:CM.surface, border:\`1px solid \${CM.border}\`, borderRadius:10,`,
  `              <div key={t.id} style={{
                background:t.prioridad==="urgente"?"#FFF0F0":CM.surface,
                border:\`1px solid \${t.prioridad==="urgente"?"#7B0000":CM.border}\`,
                borderRadius:10,`
);

fs.writeFileSync("src/HV_MensajeroPanel.jsx", mensajero, "utf8");
console.log("✅ HV_MensajeroPanel.jsx actualizado");

// Verificar
const finalAdmin = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
console.log("\nurgente en prioColor admin:", finalAdmin.includes('"urgente":"#7B0000"') ? "✅" : "❌");
console.log("Banner urgentes:", finalAdmin.includes("DILIGENCIAS URGENTES") ? "✅" : "❌");
console.log("Opción urgente formulario:", finalAdmin.includes("🚨 Urgente") ? "✅" : "❌");
console.log("\nEjecuta: npm run dev");
