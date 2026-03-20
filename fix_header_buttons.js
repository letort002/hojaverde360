const fs = require("fs");
let app = fs.readFileSync("src/App.jsx", "utf8");
const lines = app.split("\n");

// Encontrar la línea que tiene hoy() en el header del admin
let headerLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("hoy()") && lines[i].includes("95D5B2")) {
    headerLine = i;
    console.log(`Header hoy() en línea ${i+1}: ${lines[i].trim()}`);
    // Mostrar contexto
    for (let j = i-2; j <= i+4; j++) {
      console.log(`  ${j+1}: ${lines[j]?.trim()}`);
    }
    break;
  }
}

if (headerLine === -1) {
  console.log("❌ No encontrado — buscando alternativa...");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("hoy()")) {
      console.log(`  hoy() en línea ${i+1}: ${lines[i].trim()}`);
    }
  }
  process.exit(1);
}

// Insertar botones después de la línea de hoy()
const insertAfter = headerLine + 1;
const toInsert = [
  `          <button onClick={()=>setClaveModalAdmin(true)} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",marginLeft:8}}>`,
  `            🔑 Cambiar clave`,
  `          </button>`,
  `          <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",marginLeft:4}}>`,
  `            Cerrar sesión`,
  `          </button>`,
];

// Verificar si ya existen estos botones
if (app.includes("Cerrar sesión") && app.includes("setClaveModalAdmin")) {
  console.log("✅ Botones ya existen — verificando posición...");
} else {
  lines.splice(insertAfter, 0, ...toInsert);
  app = lines.join("\n");
  fs.writeFileSync("src/App.jsx", app, "utf8");
  console.log(`✅ Botones insertados después de línea ${headerLine+1}`);
}

console.log("\nEjecuta: npm run dev");
