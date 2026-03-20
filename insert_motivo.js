const fs = require("fs");

// Leer el archivo actual del proyecto
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// Verificar si ya tiene motivoRechazo en las tarjetas activas
const occurrences = (code.match(/motivoRechazo/g) || []).length;
console.log(`motivoRechazo aparece ${occurrences} veces en src/HV_Mensajeria.jsx`);

if (occurrences >= 2) {
  console.log("✅ Ya está en el archivo — el problema es otro");
  process.exit(0);
}

// Insertar el bloque motivoRechazo en el lugar correcto
const target = `>Asignada {t.hora}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}`;

const replacement = `>Asignada {t.hora}</span>
                    </div>
                    {t.motivoRechazo&&(
                      <div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>
                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync("src/HV_Mensajeria.jsx", code, "utf8");
  const newCount = (fs.readFileSync("src/HV_Mensajeria.jsx","utf8").match(/motivoRechazo/g)||[]).length;
  console.log(`✅ Insertado. Ahora aparece ${newCount} veces.`);
} else {
  // Buscar variante sin espacios exactos
  const lines = code.split("\n");
  let insertIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Asignada {t.hora}") && lines[i+1] && lines[i+1].trim() === "</div>") {
      // Encontrar el cierre del div de meta info
      insertIdx = i + 2;
      break;
    }
  }
  
  if (insertIdx > 0) {
    const newLines = [
      ...lines.slice(0, insertIdx),
      `                    {t.motivoRechazo&&(`,
      `                      <div style={{marginTop:6,padding:"5px 10px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderRadius:5,borderLeft:"3px solid #C0392B"}}>`,
      `                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}`,
      `                      </div>`,
      `                    )}`,
      ...lines.slice(insertIdx)
    ];
    fs.writeFileSync("src/HV_Mensajeria.jsx", newLines.join("\n"), "utf8");
    const newCount = (fs.readFileSync("src/HV_Mensajeria.jsx","utf8").match(/motivoRechazo/g)||[]).length;
    console.log(`✅ Insertado por líneas. Ahora aparece ${newCount} veces.`);
  } else {
    console.log("❌ No se encontró el punto de inserción");
  }
}
