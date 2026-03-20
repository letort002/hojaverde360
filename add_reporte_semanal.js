const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");

// 1. Agregar función de reporte semanal después de exportExcel
const reporteSemanal = `
  async function exportReporteSemanal() {
    const XLSX = await getXLSX();
    const wb = XLSX.utils.book_new();

    const ahora = new Date();
    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() - ((ahora.getDay() + 6) % 7));
    lunes.setHours(0,0,0,0);

    const tareasSemana = tasks.filter(t => {
      if (!t.fechaISO) return false;
      const d = new Date(t.fechaISO);
      return d >= lunes;
    });

    if (!tareasSemana.length) { showToast("⚠️ No hay datos esta semana"); return; }

    // Hoja 1 — Detalle completo
    const detalle = tareasSemana.map(t => ({
      "ID":           t.id,
      "Fecha":        t.fecha,
      "Hora Asig.":   t.hora,
      "Hora Fin":     t.horaFin || "—",
      "Tipo":         typeLabels[t.tipo],
      "Descripción":  t.desc,
      "Destino":      t.dest,
      "Mensajero":    messengers[t.messenger]?.name,
      "Prioridad":    t.prioridad?.charAt(0).toUpperCase() + t.prioridad?.slice(1),
      "Estado":       t.status.replace("-"," ").replace(/\\b\\w/g,l=>l.toUpperCase()),
      "Notas":        t.nota || "",
      "Obs. Entrega": t.firmaObs || "",
      "Motivo Rech.": t.motivoRechazo || "",
    }));
    const ws1 = XLSX.utils.json_to_sheet(detalle);
    ws1["!cols"] = [{wch:9},{wch:12},{wch:10},{wch:9},{wch:14},{wch:38},{wch:28},{wch:16},{wch:10},{wch:14},{wch:28},{wch:28},{wch:28}];
    XLSX.utils.book_append_sheet(wb, ws1, "Detalle Semana");

    // Hoja 2 — Resumen por mensajero
    const resumen = messengers.map((m, idx) => {
      const mTasks = tareasSemana.filter(t => t.messenger === idx);
      const completadas = mTasks.filter(t => t.status === "completada");
      const rechazadas  = mTasks.filter(t => t.status === "rechazada");
      const pendientes  = mTasks.filter(t => t.status === "pendiente");
      const enProgreso  = mTasks.filter(t => t.status === "en-progreso");
      return {
        "Mensajero":       m.name,
        "Total asignadas": mTasks.length,
        "Completadas":     completadas.length,
        "Rechazadas":      rechazadas.length,
        "Pendientes":      pendientes.length,
        "En progreso":     enProgreso.length,
        "% Completadas":   mTasks.length ? (completadas.length/mTasks.length*100).toFixed(1)+"%" : "0%",
        "% Rechazadas":    mTasks.length ? (rechazadas.length/mTasks.length*100).toFixed(1)+"%" : "0%",
      };
    });
    const ws2 = XLSX.utils.json_to_sheet(resumen);
    ws2["!cols"] = [{wch:18},{wch:16},{wch:12},{wch:12},{wch:12},{wch:12},{wch:16},{wch:16}];
    XLSX.utils.book_append_sheet(wb, ws2, "Resumen por Mensajero");

    // Hoja 3 — Resumen por día
    const dias = {};
    tareasSemana.forEach(t => {
      const fecha = t.fecha || t.fechaISO;
      if (!dias[fecha]) dias[fecha] = { fecha, total:0, completadas:0, rechazadas:0, pendientes:0 };
      dias[fecha].total++;
      if (t.status === "completada") dias[fecha].completadas++;
      if (t.status === "rechazada")  dias[fecha].rechazadas++;
      if (t.status === "pendiente")  dias[fecha].pendientes++;
    });
    const ws3 = XLSX.utils.json_to_sheet(Object.values(dias));
    ws3["!cols"] = [{wch:14},{wch:10},{wch:12},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws3, "Resumen por Día");

    const semanaStr = lunes.toLocaleDateString("es-EC",{day:"2-digit",month:"2-digit"});
    XLSX.writeFile(wb, \`HV_Reporte_Semanal_\${semanaStr.replace("/","-")}.xlsx\`);
    showToast("✓ Reporte semanal exportado");
  }
`;

code = code.replace(
  `  async function exportExcel(){`,
  reporteSemanal + `  async function exportExcel(){`
);

// 2. Agregar botón de reporte semanal junto al botón de Excel
code = code.replace(
  `<button onClick={exportExcel} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:CM.surface,border:\`1px solid \${CM.border}\`,borderRadius:7,color:CM.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>📊 Exportar Excel</button>`,
  `<button onClick={exportExcel} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:CM.surface,border:\`1px solid \${CM.border}\`,borderRadius:7,color:CM.green,fontSize:12,fontWeight:700,cursor:"pointer"}}>📊 Exportar día</button>
          <button onClick={exportReporteSemanal} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:CM.surface,border:\`1px solid \${CM.border}\`,borderRadius:7,color:CM.blue,fontSize:12,fontWeight:700,cursor:"pointer"}}>📅 Reporte semanal</button>`
);

fs.writeFileSync("src/HV_Mensajeria.jsx", code, "utf8");

const final = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
console.log("exportReporteSemanal:", final.includes("exportReporteSemanal") ? "✅" : "❌");
console.log("Botón reporte semanal:", final.includes("Reporte semanal") ? "✅" : "❌");
console.log("\nEjecuta: npm run dev");
