const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// Mover UMBRAL_MINUTOS fuera del componente (nivel de módulo)
// Primero eliminar donde está dentro del componente
code = code.replace(
  /\n\s*const UMBRAL_MINUTOS\s*=\s*\d+;.*\n/g,
  "\n"
);

// Agregar al inicio del archivo como constante de módulo
code = code.replace(
  `const STORAGE_KEY  = "hv_mensajeria_v3";`,
  `const STORAGE_KEY  = "hv_mensajeria_v3";
const UMBRAL_MINUTOS = 30; // Alerta si diligencia lleva más de 30 min en Pendiente`
);

fs.writeFileSync("src/HV_Mensajeria.jsx", code, "utf8");

const final = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
const idx = final.indexOf("UMBRAL_MINUTOS");
const lineNum = final.substring(0, idx).split("\n").length;
console.log(`UMBRAL_MINUTOS definido en línea ${lineNum}`);
console.log("✅ Listo. Ejecuta: npm run dev");
