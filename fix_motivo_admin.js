const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src", "HV_Mensajeria.jsx");
let code = fs.readFileSync(filePath, "utf8");

// Verificar si ya está el motivo
if (code.includes("motivoRechazo")) {
  console.log("ℹ️  motivoRechazo ya está en el archivo");
} else {
  // Insertar display del motivo después del bloque firmaObs usando regex flexible
  code = code.replace(
    /(\{t\.firmaObs&&\([\s\S]*?✅[\s\S]*?<\/div>\s*\}\))/,
    `$1
                    {t.motivoRechazo&&(
                      <div style={{padding:"6px 14px 8px",fontSize:11,color:"#C0392B",background:"#FDECEA",borderTop:"1px dashed #C0392B44",borderLeft:"3px solid #C0392B"}}>
                        ❌ <strong>Motivo de rechazo:</strong> {t.motivoRechazo}
                      </div>
                    )}`
  );
  console.log("✅ Bloque motivoRechazo insertado después de firmaObs");
}

// Asegurar que el badge de estado incluye rechazada en rojo
const badgePattern = /color=\{t\.status===["']completada["']\?[^}]*CM\.green[^}]*\?[^}]*CM\.blue[^}]*:CM\.amber\}/g;
if (badgePattern.test(code)) {
  code = code.replace(
    /color=\{t\.status===["']completada["']\?[^}]*CM\.green[^}]*\?[^}]*CM\.blue[^}]*:CM\.amber\}/g,
    `color={t.status==="completada"?"#2D7A22":t.status==="en-progreso"?"#1A6FAA":t.status==="rechazada"?"#C0392B":"#C07A00"}`
  );
  console.log("✅ Badge de estado actualizado con rojo para rechazada");
} else {
  console.log("ℹ️  Badge ya actualizado o patrón no encontrado");
}

// Asegurar opción rechazada en el select del admin
if (!code.includes('value="rechazada"')) {
  code = code.replace(
    /<option value="completada">✅ Completada<\/option>/g,
    `<option value="completada">✅ Completada</option>
                      <option value="rechazada">❌ Rechazada (admin)</option>`
  );
  console.log("✅ Opción rechazada agregada al select del admin");
}

// Agregar CM.redL si no existe
if (!code.includes("redL:")) {
  code = code.replace(`red:"#C0392B"`, `red:"#C0392B", redL:"#FDECEA"`);
}

fs.writeFileSync(filePath, code, "utf8");

// Verificar que quedó bien
if (fs.readFileSync(filePath, "utf8").includes("motivoRechazo")) {
  console.log("\n✅ Verificación OK — motivoRechazo está en el archivo");
} else {
  console.log("\n❌ No se pudo insertar — revisa manualmente");
}

console.log("\nEjecuta: npm run dev");
