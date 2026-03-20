const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "HV_Mensajeria.jsx");
let code = fs.readFileSync(filePath, "utf8");

// 1. Agregar "rechazada" al selector de estado en las tarjetas del admin
code = code.replace(
  `<option value="completada">✅ Completada</option>
            </select>`,
  `<option value="completada">✅ Completada</option>
              <option value="rechazada">❌ Rechazada</option>
            </select>`
);

// 2. Mostrar motivo de rechazo en la tarjeta del admin (después de firmaObs)
code = code.replace(
  `{t.firmaObs&&(
                      <div style={{padding:"5px 14px 8px",fontSize:11,color:CM.textMid,background:CM.greenL,borderTop:\`1px dashed \${CM.border}\`}}>
                        ✅ <strong>Obs. entrega:</strong> {t.firmaObs}
                      </div>
                    )}`,
  `{t.firmaObs&&(
                      <div style={{padding:"5px 14px 8px",fontSize:11,color:CM.textMid,background:CM.greenL,borderTop:\`1px dashed \${CM.border}\`}}>
                        ✅ <strong>Obs. entrega:</strong> {t.firmaObs}
                      </div>
                    )}
                    {t.motivoRechazo&&(
                      <div style={{padding:"5px 14px 8px",fontSize:11,color:CM.red,background:CM.redL,borderTop:\`1px dashed \${CM.red}44\`,borderLeft:\`3px solid \${CM.red}\`}}>
                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}
                      </div>
                    )}`
);

// 3. Agregar CM.red y CM.redL si no existen
if (!code.includes('red:"#C0392B"')) {
  code = code.replace(
    `blue:"#1A6FAA",`,
    `blue:"#1A6FAA",  blueL:"#E3F0FA",\n  red:"#C0392B",   redL:"#FDECEA",`
  );
} else if (!code.includes('redL:')) {
  code = code.replace(`red:"#C0392B",`, `red:"#C0392B", redL:"#FDECEA",`);
}

// 4. Mostrar badge RECHAZADA en tarjeta admin (color rojo)
// El badge de estado ya usa color dinámico, solo necesitamos agregar el caso rechazada
code = code.replace(
  `color={t.status==="completada"?CM.green:t.status==="en-progreso"?CM.blue:CM.amber}/>`,
  `color={t.status==="completada"?CM.green:t.status==="en-progreso"?CM.blue:t.status==="rechazada"?CM.red:CM.amber}/>`
);

// También en historial
code = code.replace(
  /color=\{t\.status==="completada"\?CM\.green:t\.status==="en-progreso"\?CM\.blue:CM\.amber\}/g,
  `color={t.status==="completada"?CM.green:t.status==="en-progreso"?CM.blue:t.status==="rechazada"?CM.red:CM.amber}`
);

// 5. Agregar "rechazada" al Excel export
code = code.replace(
  `"Estado":t.status.replace("-"," ").replace(/\\b\\w/g,l=>l.toUpperCase()),`,
  `"Estado":t.status.replace("-"," ").replace(/\\b\\w/g,l=>l.toUpperCase()),
      "Motivo Rechazo":t.motivoRechazo||"",`
);

// 6. En filteredActive del admin, mostrar también rechazadas si el filtro es "todas"
// Actualmente filtra t.status !== "completada" — agregar que tampoco muestre rechazadas en activas
// pero SÍ que aparezcan con badge visible — lo dejamos visible en activas para que el admin vea

fs.writeFileSync(filePath, code, "utf8");
console.log("✅ HV_Mensajeria.jsx actualizado:");
console.log("   - Badge RECHAZADA en rojo");
console.log("   - Motivo de rechazo visible en la tarjeta del admin");
console.log("   - Motivo incluido en export Excel");
console.log("\nEjecuta: npm run dev");
