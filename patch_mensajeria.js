const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "src", "App.jsx");
let code = fs.readFileSync(appPath, "utf8");

// ── 1. AGREGAR IMPORT ──────────────────────────────────────────
const importLine = `import HVMensajeria from "./HV_Mensajeria.jsx";\n`;
if (!code.includes("HVMensajeria")) {
  // Insertar antes de "export default function App"
  code = code.replace(
    "export default function App",
    importLine + "export default function App"
  );
  console.log("✅ Import agregado");
} else {
  console.log("⏭  Import ya existe, omitido");
}

// ── 2. AGREGAR TAB EN EL ARRAY TABS ───────────────────────────
const tabEntry = `  { id:"mensajeria", icono:"🚴", label:"Mensajería" },`;
if (!code.includes('"mensajeria"')) {
  // Buscar la entrada de presupuesto en TABS y agregar después
  // El patrón busca la línea del tab presupuesto
  const tabPatterns = [
    /(\{[^}]*id:"presupuesto"[^}]*\})/,
    /(\{[^}]*id:'presupuesto'[^}]*\})/,
  ];
  let patched = false;
  for (const pat of tabPatterns) {
    if (pat.test(code)) {
      code = code.replace(pat, (match) => match + ",\n" + tabEntry);
      patched = true;
      break;
    }
  }
  if (patched) {
    console.log("✅ Tab agregado al array TABS");
  } else {
    console.log("⚠️  No se encontró la entrada 'presupuesto' en TABS.");
    console.log("   Agrega manualmente en el array TABS:");
    console.log("   " + tabEntry);
  }
} else {
  console.log("⏭  Tab mensajería ya existe, omitido");
}

// ── 3. AGREGAR VISTA EN EL OBJETO vistas ──────────────────────
const vistaEntry = `    mensajeria: <HVMensajeria/>,`;
if (!code.includes("mensajeria:")) {
  if (code.includes("presupuesto:<TabPresupuesto/>")) {
    code = code.replace(
      "presupuesto:<TabPresupuesto/>",
      "presupuesto:<TabPresupuesto/>,\n" + vistaEntry
    );
    console.log("✅ Vista mensajería agregada al objeto vistas");
  } else {
    console.log("⚠️  No se encontró 'presupuesto:<TabPresupuesto/>' en vistas.");
    console.log("   Agrega manualmente en el objeto vistas:");
    console.log("   " + vistaEntry);
  }
} else {
  console.log("⏭  Vista mensajería ya existe, omitida");
}

// ── GUARDAR ────────────────────────────────────────────────────
fs.writeFileSync(appPath, code, "utf8");
console.log("\n✅ App.jsx actualizado correctamente.");
console.log("   Ahora copia HV_Mensajeria.jsx a src/ y ejecuta: npm run dev");
