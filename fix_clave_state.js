const fs = require("fs");
let app = fs.readFileSync("src/App.jsx", "utf8");

// Verificar si ya está
if (app.includes("claveModalAdmin")) {
  // Puede estar en lugar incorrecto — eliminar y reinsertar
  app = app.replace(/\n\s*const \[claveModalAdmin.*?\n/g, "\n");
  console.log("Limpiando inserción anterior...");
}

// Insertar JUSTO después de const [tab, setTab]
app = app.replace(
  `const [tab, setTab]           = useState("tendencias");`,
  `const [tab, setTab]           = useState("tendencias");
  const [claveModalAdmin, setClaveModalAdmin] = useState(false);`
);

// Verificar que quedó bien
const idx = app.indexOf("claveModalAdmin");
const lines = app.split("\n");
const lineNum = app.substring(0, idx).split("\n").length;
console.log(`claveModalAdmin en línea ${lineNum}: ${lines[lineNum-1].trim()}`);

fs.writeFileSync("src/App.jsx", app, "utf8");
console.log("✅ Listo. Ejecuta: npm run dev");
