const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
const lines = code.split("\n");

// Encontrar la línea que tiene "Asignada {t.hora}" en las tarjetas activas
// Debe estar ANTES de la línea 511 (historial)
let insertIdx = -1;
for (let i = 0; i < 510; i++) {
  if (lines[i].includes("Asignada {t.hora}")) {
    insertIdx = i + 2; // insertar 2 líneas después (después del </div> que cierra el flex)
    console.log(`Encontrado en línea ${i+1}: ${lines[i].trim()}`);
    console.log(`Línea ${i+2}: ${lines[i+1].trim()}`);
    console.log(`Línea ${i+3}: ${lines[i+2].trim()}`);
    console.log(`Insertando después de línea ${i+2}`);
    break;
  }
}

if (insertIdx === -1) {
  console.log("❌ No encontrado");
  process.exit(1);
}

// Verificar que no está ya insertado cerca
const nearby = lines.slice(insertIdx, insertIdx+5).join("\n");
if (nearby.includes("motivoRechazo")) {
  console.log("✅ Ya está insertado en esa posición");
  process.exit(0);
}

// Insertar las líneas
const toInsert = [
  `                    {t.motivoRechazo&&(`,
  `                      <div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>`,
  `                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}`,
  `                      </div>`,
  `                    )}`,
];

lines.splice(insertIdx, 0, ...toInsert);
fs.writeFileSync("src/HV_Mensajeria.jsx", lines.join("\n"), "utf8");

// Verificar
const final = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
const count = (final.match(/motivoRechazo/g)||[]).length;
console.log(`\n✅ Listo. motivoRechazo aparece ahora ${count} veces`);
console.log("Ejecuta: npm run dev");
