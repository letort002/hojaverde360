const fs = require("fs");
let app = fs.readFileSync("src/App.jsx", "utf8");

// Mostrar cómo está definida AppInterna actualmente
const match = app.match(/function AppInterna\([^)]*\)/);
console.log("Definición actual:", match?.[0]);

// Reemplazar cualquier variante de la firma
app = app
  .replace(/function AppInterna\(\)/g, "function AppInterna({ session, onLogout })")
  .replace(/function AppInterna\(\{ session \}\)/g, "function AppInterna({ session, onLogout })")
  .replace(/function AppInterna\(\{ session, onLogout \}\)/g, "function AppInterna({ session, onLogout })");

// Verificar
const match2 = app.match(/function AppInterna\([^)]*\)/);
console.log("Definición nueva:", match2?.[0]);

fs.writeFileSync("src/App.jsx", app, "utf8");
console.log(match2?.[0]?.includes("onLogout") ? "✅ Listo" : "❌ No se pudo");
console.log("\nEjecuta: npm run dev");
