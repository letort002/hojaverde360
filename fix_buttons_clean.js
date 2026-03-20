const fs = require("fs");
let app = fs.readFileSync("src/App.jsx", "utf8");
const lines = app.split("\n");

// 1. Eliminar los botones mal insertados (los que están fuera de AppInterna)
// Buscar y eliminar el bloque insertado incorrectamente
let startDel = -1, endDel = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("setClaveModalAdmin(true)") && lines[i].includes("marginLeft:8")) {
    startDel = i;
  }
  if (startDel > -1 && lines[i].includes("Cerrar sesión") && i > startDel) {
    endDel = i + 2; // include closing </button>
    break;
  }
}

if (startDel > -1 && endDel > -1) {
  lines.splice(startDel, endDel - startDel);
  console.log(`✅ Botones mal ubicados eliminados (líneas ${startDel+1}-${endDel})`);
} else {
  console.log("ℹ️  No se encontraron botones duplicados");
}

app = lines.join("\n");

// 2. Encontrar el header dentro de AppInterna y agregar los botones ahí
// Buscar la línea de hoy() que está DENTRO de AppInterna (después de la línea 880)
const appLines = app.split("\n");
const appInternaStart = appLines.findIndex(l => l.includes("function AppInterna"));
console.log(`AppInterna empieza en línea ${appInternaStart+1}`);

let hoyLine = -1;
for (let i = appInternaStart; i < appLines.length; i++) {
  if (appLines[i].includes("hoy()") && appLines[i].includes("95D5B2")) {
    hoyLine = i;
    console.log(`hoy() dentro de AppInterna en línea ${i+1}: ${appLines[i].trim()}`);
    break;
  }
}

if (hoyLine === -1) {
  // Buscar solo hoy()
  for (let i = appInternaStart; i < appLines.length; i++) {
    if (appLines[i].includes("{hoy()}")) {
      hoyLine = i;
          console.log(`hoy() en línea ${i+1}: ${appLines[i].trim()}`);
      break;
    }
  }
}

if (hoyLine > -1) {
  // Verificar si ya tiene botones cerca
  const nearby = appLines.slice(hoyLine, hoyLine+8).join("\n");
  if (nearby.includes("Cerrar sesión")) {
    console.log("✅ Botones ya están en el lugar correcto");
  } else {
    const toInsert = [
      `          <button onClick={()=>setClaveModalAdmin(true)} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",marginLeft:8}}>🔑 Cambiar clave</button>`,
      `          <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",marginLeft:4}}>Cerrar sesión</button>`,
    ];
    appLines.splice(hoyLine + 1, 0, ...toInsert);
    console.log(`✅ Botones insertados correctamente en línea ${hoyLine+2}`);
  }
  app = appLines.join("\n");
}

fs.writeFileSync("src/App.jsx", app, "utf8");

// Verificar
const final = app.split("\n");
const positions = [];
final.forEach((l,i) => { if(l.includes("Cerrar sesión")) positions.push(i+1); });
console.log(`\nCerrar sesión en líneas: ${positions.join(", ")}`);
console.log("onLogout referencias:", (app.match(/onLogout/g)||[]).length);
console.log("\nEjecuta: npm run dev");
