const fs = require("fs");
let app = fs.readFileSync("src/App.jsx", "utf8");
const lines = app.split("\n");

// Encontrar posiciones clave
const appInternaLine = lines.findIndex(l => l.includes("function AppInterna"));
const tabLine = lines.findIndex(l => l.includes('const [tab, setTab]') && l.includes('useState'));
const claveLine = lines.findIndex(l => l.includes("claveModalAdmin"));

console.log(`function AppInterna: línea ${appInternaLine+1}`);
console.log(`const [tab, setTab]: línea ${tabLine+1}`);
console.log(`claveModalAdmin: línea ${claveLine+1}`);

// El problema: claveModalAdmin debe estar DENTRO de AppInterna
// Verificar si [tab,setTab] está dentro de AppInterna
if (tabLine < appInternaLine) {
  console.log("❌ PROBLEMA: [tab,setTab] está ANTES de AppInterna — el useState está en el lugar equivocado");
} else {
  console.log("✅ [tab,setTab] está dentro de AppInterna");
}

// Mostrar líneas 955-965 para ver contexto del error
console.log("\nContexto línea 959:");
for (let i = 953; i < 967; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// FIX: Eliminar todas las ocurrencias de claveModalAdmin
app = app.replace(/\n\s*const \[claveModalAdmin[^\n]*/g, "");
// Eliminar usos del modal en el render si causan error
app = app.replace(/\{claveModalAdmin && <CambiarClaveModal[^}]*\}[^}]*\}[^\n]*\n/g, "");
app = app.replace(/onClick=\{[^}]*setClaveModalAdmin[^}]*\}[^\n]*/g, `onClick={()=>alert("Próximamente")}`);

// Reinsertar correctamente DENTRO de AppInterna
const newTabLine = app.split("\n").findIndex(l => l.includes('const [tab, setTab]') && l.includes('useState'));
const appLines = app.split("\n");
if (newTabLine > 0) {
  appLines.splice(newTabLine + 1, 0, `  const [claveModalAdmin, setClaveModalAdmin] = React.useState(false);`);
  app = appLines.join("\n");
  
  // Restaurar el render del modal
  app = app.replace(
    `{/* Toast */}`,
    `{claveModalAdmin && <CambiarClaveModal session={session} onClose={()=>setClaveModalAdmin(false)}/>}\n      {/* Toast */}`
  );
  
  // Restaurar botón
  app = app.replace(
    /onClick=\{[^}]*alert\("Próximamente"\)\}/g,
    `onClick={()=>setClaveModalAdmin(true)}`
  );
  
  console.log("\n✅ claveModalAdmin reinsertado en línea:", newTabLine + 2);
}

fs.writeFileSync("src/App.jsx", app, "utf8");

// Verificar final
const final = app.split("\n");
const finalAppInterna = final.findIndex(l => l.includes("function AppInterna"));
const finalClave = final.findIndex(l => l.includes("claveModalAdmin") && l.includes("useState"));
console.log(`\nVerificación final:`);
console.log(`  AppInterna en línea: ${finalAppInterna+1}`);
console.log(`  claveModalAdmin useState en línea: ${finalClave+1}`);
console.log(`  claveModalAdmin está dentro de AppInterna: ${finalClave > finalAppInterna ? "✅" : "❌"}`);
console.log("\nEjecuta: npm run dev");
