const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// Mostrar el filtro actual
const lines = code.split("\n");
const filtIdx = lines.findIndex(l => l.includes("filteredActive") && l.includes("filter("));
console.log("Filtro actual:");
for (let i = filtIdx; i < filtIdx+7; i++) console.log(`  ${i+1}: ${lines[i]}`);

// Fix 1: El filtro debe excluir SOLO completadas (rechazadas SÍ aparecen)
// Verificar si hay exclusión de rechazadas
const filtBlock = lines.slice(filtIdx, filtIdx+7).join("\n");
if (filtBlock.includes("rechazada")) {
  console.log("⚠️  El filtro excluye rechazadas — corrigiendo...");
  code = code.replace(
    /const filteredActive=tasks\.filter\(t=>\{[\s\S]*?\}\);/,
    `const filteredActive=tasks.filter(t=>{
    if(t.status==="completada") return false;
    if(filter==="todas") return true;
    if(filter==="0"||filter==="1") return t.messenger===parseInt(filter);
    return t.tipo===filter;
  });`
  );
} else {
  console.log("✅ Filtro OK — rechazadas no están excluidas");
}

// Fix 2: Verificar que motivoRechazo está en el render de tarjetas activas
const motivoCount = (code.match(/motivoRechazo/g)||[]).length;
console.log(`\nmotivoRechazo aparece ${motivoCount} veces`);

// Mostrar contexto alrededor de cada ocurrencia
lines.forEach((l, i) => {
  if (l.includes("motivoRechazo")) {
    console.log(`  Línea ${i+1}: ${l.trim()}`);
  }
});

// Fix 3: Asegurar que el badge de estado cubre rechazada
code = code.replace(
  /Badge texto=\{t\.status\.replace\("-"," "\)\.toUpperCase\(\)\} color=\{t\.status==="completada"\?CM\.green:t\.status==="en-progreso"\?CM\.blue:CM\.amber\}/g,
  `Badge texto={t.status.replace("-"," ").toUpperCase()} color={t.status==="completada"?CM.green:t.status==="en-progreso"?CM.blue:t.status==="rechazada"?"#C0392B":CM.amber}`
);

fs.writeFileSync("src/HV_Mensajeria.jsx", code, "utf8");
console.log("\n✅ Archivo guardado. Ejecuta: npm run dev");
console.log("\nPara probar: recarga el admin y verifica que DG-005 aparece con el motivo en rojo.");
