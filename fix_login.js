const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "src", "App.jsx");
let app = fs.readFileSync(appPath, "utf8");

// 1. Eliminar la lógica de sesión mal insertada dentro de App()
app = app.replace(/\n\s*const \[session, setSession\][\s\S]*?if \(session\.role === "mensajero"\)[^\n]*\n/g, "\n");

// 2. Asegurarse que el import de React está bien
if (!app.includes("import React,") && !app.includes("import React ")) {
  app = app.replace(
    /import \{ useState/,
    `import React, { useState`
  );
}

// 3. Asegurarse que los imports de Auth y MensajeroPanel están
if (!app.includes("LoginScreen")) {
  app = app.replace(
    /import HVMensajeria/,
    `import { LoginScreen, USUARIOS } from "./Auth.jsx";\nimport MensajeroPanel from "./HV_MensajeroPanel.jsx";\nimport HVMensajeria`
  );
}

// 4. Renombrar el export default App a AppInterna
app = app.replace(
  /export default function App\(\)/,
  `function AppInterna()`
);

// 5. Agregar wrapper con login al final del archivo
const wrapper = `

// ── WRAPPER CON LOGIN ─────────────────────────────────────────
export default function App() {
  const [session, setSession] = React.useState(() => {
    try { return JSON.parse(sessionStorage.getItem("hv_session")) || null; } catch(_) { return null; }
  });

  function handleLogin(user) {
    sessionStorage.setItem("hv_session", JSON.stringify(user));
    setSession(user);
  }
  function handleLogout() {
    sessionStorage.removeItem("hv_session");
    setSession(null);
  }

  if (!session) return <LoginScreen onLogin={handleLogin}/>;
  if (session.role === "mensajero") return <MensajeroPanel session={session} onLogout={handleLogout}/>;
  return <AppInterna session={session} onLogout={handleLogout}/>;
}
`;

// Solo agregar el wrapper si no existe ya
if (!app.includes("function AppInterna")) {
  console.log("❌ No se encontró AppInterna — revisa el App.jsx manualmente");
  process.exit(1);
}

if (!app.includes("export default function App")) {
  app = app + wrapper;
  console.log("✅ Wrapper de login agregado al final");
} else {
  console.log("⚠️  Ya existe export default function App — asegúrate que no hay duplicados");
}

// 6. Agregar botón logout en el header del admin (AppInterna)
// Buscar el header del portal y agregar logout
if (!app.includes("onLogout") && app.includes("Actualizar con nuevo Excel")) {
  app = app.replace(
    /function AppInterna\(\)/,
    `function AppInterna({ session, onLogout })`
  );

  // Agregar botón cerrar sesión junto al botón de Excel
  app = app.replace(
    /<span style=\{\{fontSize:11,color:"#95D5B2"\}\}>\{hoy\(\)\}<\/span>/,
    `<span style={{fontSize:11,color:"#95D5B2"}}>{hoy()}</span>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>
            Cerrar sesión
          </button>`
  );
  console.log("✅ Botón logout agregado al header del admin");
}

fs.writeFileSync(appPath, app, "utf8");
console.log("✅ App.jsx corregido");
console.log("\nEjecuta: npm run dev");
