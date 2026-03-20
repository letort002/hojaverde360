const fs = require("fs");
let code = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
const lines = code.split("\n");

// Encontrar la línea de Stats dentro del main
let statsLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("gridTemplateColumns:\"repeat(4,1fr)\"") && lines[i].includes("marginBottom:20")) {
    statsLine = i;
    console.log(`Stats en línea ${i+1}: ${lines[i].trim().slice(0,60)}`);
    break;
  }
}

if (statsLine === -1) {
  // Buscar alternativa
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("stat-total") || (lines[i].includes("Total hoy") && lines[i].includes("stat"))) {
      statsLine = i - 2;
      console.log(`Stats (alt) cerca de línea ${i+1}`);
      break;
    }
  }
}

if (statsLine === -1) {
  console.log("❌ No encontrado");
  process.exit(1);
}

// Verificar que no está ya el banner
if (code.includes("Diligencias pendientes por más")) {
  console.log("✅ Banner ya existe");
  process.exit(0);
}

const banner = [
  `          {/* Banner alertas pendientes */}`,
  `          {tasks.filter(t=>t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS).length>0&&(`,
  `            <div style={{background:"#FFF3CD",border:"1px solid #C07A00",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>`,
  `              <span style={{fontSize:20}}>⚠️</span>`,
  `              <div style={{flex:1}}>`,
  `                <div style={{fontSize:13,fontWeight:700,color:"#C07A00",marginBottom:4}}>Diligencias pendientes por más de {UMBRAL_MINUTOS} minutos</div>`,
  `                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>`,
  `                  {tasks.filter(t=>t.status==="pendiente"&&minutosEsperando(t)>=UMBRAL_MINUTOS).map(t=>(`,
  `                    <span key={t.id} style={{background:"#C07A00",color:"#fff",borderRadius:5,padding:"2px 10px",fontSize:12,fontWeight:600}}>`,
  `                      {t.id} · {messengers[t.messenger]?.name} · {minutosEsperando(t)} min`,
  `                    </span>`,
  `                  ))}`,
  `                </div>`,
  `              </div>`,
  `            </div>`,
  `          )}`,
];

lines.splice(statsLine, 0, ...banner);
fs.writeFileSync("src/HV_Mensajeria.jsx", lines.join("\n"), "utf8");

const final = fs.readFileSync("src/HV_Mensajeria.jsx", "utf8");
console.log("Banner:", final.includes("Diligencias pendientes por más") ? "✅" : "❌");
console.log("\nEjecuta: npm run dev");
