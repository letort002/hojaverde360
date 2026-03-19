const fs = require("fs");
const path = require("path");

const replacements = [
  // Auth.jsx - nombres y usuarios
  {
    file: "src/Auth.jsx",
    changes: [
      ['nombre: "Mensajero 1"', 'nombre: "Segundo Morales"'],
      ['nombre: "Mensajero 2"', 'nombre: "Marcelo Sandoval"'],
      ['"Mensajero 1 / mensajero2"', '"mensajero1 / mensajero2"'],
    ]
  },
  // HV_Mensajeria.jsx - nombres en estado inicial
  {
    file: "src/HV_Mensajeria.jsx",
    changes: [
      ['{name:"Mensajero 1",status:"libre"}', '{name:"Segundo Morales",status:"libre"}'],
      ['{name:"Mensajero 2",status:"libre"}', '{name:"Marcelo Sandoval",status:"libre"}'],
      ['{name:"Mensajero 1"},{name:"Mensajero 2"}', '{name:"Segundo Morales"},{name:"Marcelo Sandoval"}'],
      ['"Mensajero 1"', '"Segundo Morales"'],
      ['"Mensajero 2"', '"Marcelo Sandoval"'],
    ]
  },
  // HV_MensajeroPanel.jsx
  {
    file: "src/HV_MensajeroPanel.jsx",
    changes: [
      ['{name:"Mensajero 1"},{name:"Mensajero 2"}', '{name:"Segundo Morales"},{name:"Marcelo Sandoval"}'],
      ['"Mensajero 1"', '"Segundo Morales"'],
      ['"Mensajero 2"', '"Marcelo Sandoval"'],
    ]
  },
];

for (const { file, changes } of replacements) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) { console.log(`⚠️  No encontrado: ${file}`); continue; }
  let content = fs.readFileSync(filePath, "utf8");
  for (const [from, to] of changes) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ ${file} actualizado`);
}

console.log("\n✅ Nombres actualizados:");
console.log("   Mensajero 1 → Segundo Morales  (mensajero1 / msg1hv)");
console.log("   Mensajero 2 → Marcelo Sandoval  (mensajero2 / msg2hv)");
console.log("\nEjecuta: npm run dev");
