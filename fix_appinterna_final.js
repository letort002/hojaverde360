const fs = require("fs");
let app = fs.readFileSync("src/App.jsx", "utf8");
const lines = app.split("\n");

// 1. Eliminar TODOS los botones mal insertados que referencian onLogout fuera de contexto
// Buscar todas las ocurrencias de "Cerrar sesión" y "Cambiar clave" botones
let cleaned = [];
let skip = false;
let skipCount = 0;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Detectar inicio de bloque de botones mal insertado (fuera del JSX del return)
  if ((l.includes("setClaveModalAdmin(true)") || l.includes("onLogout") && l.includes("button")) && 
      !l.includes("//")) {
    // Verificar si está dentro del return de AppInterna (debe tener indentación de JSX)
    // Líneas del return tienen más indentación
    const indent = l.match(/^\s*/)[0].length;
    if (indent < 10) { // fuera del JSX principal
      skip = true;
      skipCount = 0;
      console.log(`Saltando línea mal ubicada ${i+1}: ${l.trim()}`);
    }
  }
  if (skip) {
    skipCount++;
    if (skipCount > 6) skip = false;
    continue;
  }
  cleaned.push(l);
}

app = cleaned.join("\n");

// 2. Asegurarse que AppInterna recibe onLogout como prop
app = app.replace(
  /function AppInterna\(\s*\{[^}]*\}\s*\)/,
  `function AppInterna({ session, onLogout })`
);

// Verificar
const hasOnLogout = app.includes("function AppInterna({ session, onLogout })");
console.log(`AppInterna recibe onLogout: ${hasOnLogout ? "✅" : "❌"}`);

// 3. Encontrar el header del portal dentro del return de AppInterna y agregar botones
// Buscar la línea con hoy() que está en el return (alta indentación)
const appLines2 = app.split("\n");
const appInternaIdx = appLines2.findIndex(l => l.includes("function AppInterna"));
let hoyIdx = -1;
for (let i = appInternaIdx + 1; i < appLines2.length; i++) {
  if (appLines2[i].includes("{hoy()}") || (appLines2[i].includes("hoy()") && appLines2[i].includes("color"))) {
    const indent = appLines2[i].match(/^\s*/)[0].length;
    if (indent >= 8) { // dentro del JSX
      hoyIdx = i;
      console.log(`hoy() dentro del JSX en línea ${i+1} (indent=${indent}): ${appLines2[i].trim()}`);
      break;
    }
  }
}

if (hoyIdx > -1) {
  const nearby = appLines2.slice(hoyIdx, hoyIdx+5).join("\n");
  if (nearby.includes("Cerrar sesión")) {
    console.log("✅ Botones ya presentes cerca de hoy()");
  } else {
    appLines2.splice(hoyIdx + 1, 0,
      `          <button onClick={()=>setClaveModalAdmin(true)} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",marginLeft:8}}>🔑 Cambiar clave</button>`,
      `          <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",marginLeft:4}}>Cerrar sesión</button>`
    );
    console.log("✅ Botones agregados dentro del JSX");
  }
  app = appLines2.join("\n");
}

fs.writeFileSync("src/App.jsx", app, "utf8");

// Verificación final
const final = app.split("\n");
const errs = [];
final.forEach((l,i) => {
  if (l.includes("onLogout") && !l.includes("//") && !l.includes("function") && !l.includes("=>")) {
    errs.push(`línea ${i+1}: ${l.trim().slice(0,60)}`);
  }
});
console.log("\nonLogout usos:", errs);
console.log("\nEjecuta: npm run dev");
