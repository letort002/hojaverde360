const fs = require("fs");
const filePath = "src/HV_Mensajeria.jsx";
let code = fs.readFileSync(filePath, "utf8");

const buscar = `<span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>Asignada {t.hora}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column"`;

const reemplazar = `<span style={{fontFamily:"monospace",fontSize:10,color:CM.textGray}}>Asignada {t.hora}</span>
                    </div>
                    {t.motivoRechazo&&(
                      <div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>
                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",flexDirection:"column"`;

if (code.includes("Motivo de rechazo") && code.includes("filteredActive")) {
  console.log("✅ motivoRechazo ya está en las tarjetas activas");
} else if (code.includes(buscar)) {
  code = code.replace(buscar, reemplazar);
  fs.writeFileSync(filePath, code, "utf8");
  console.log("✅ motivoRechazo agregado en tarjetas activas del admin");
} else {
  // Fallback: buscar patrón más simple
  const simple = `>Asignada {t.hora}</span>\n                    </div>\n                  </div>\n                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"`;
  if (code.includes(simple)) {
    code = code.replace(simple,
      `>Asignada {t.hora}</span>\n                    </div>\n                    {t.motivoRechazo&&(\n                      <div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>\n                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}\n                      </div>\n                    )}\n                  </div>\n                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"`
    );
    fs.writeFileSync(filePath, code, "utf8");
    console.log("✅ motivoRechazo agregado (fallback)");
  } else {
    console.log("❌ No se encontró el patrón — agrega manualmente");
  }
}

// Verificar
const final = fs.readFileSync(filePath, "utf8");
const count = (final.match(/motivoRechazo/g)||[]).length;
console.log(`\nVerificación: motivoRechazo aparece ${count} veces en el archivo`);
if (count >= 2) console.log("✅ OK — ejecuta: npm run dev");
else console.log("⚠️  Solo aparece una vez — puede haber un problema");
