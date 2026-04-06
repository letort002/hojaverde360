const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "src", "App.jsx");
let code = fs.readFileSync(appPath, "utf8");

// Corregir coma doble
code = code.replace(/mensajeria:\s*<HVMensajeria\/>,,/g, "mensajeria: <HVMensajeria/>,");

fs.writeFileSync(appPath, code, "utf8");
console.log("✅ Coma doble corregida en App.jsx");
