const fs = require("fs");

// ── NUEVA Auth.jsx completa con cambio de clave ───────────────
const authContent = `import React, { useState } from "react";

const PASS_KEY = "hv_passwords";

const DEFAULT_PASS = {
  admin:      "hv2026admin",
  mensajero1: "msg1hv",
  mensajero2: "msg2hv",
};

const USUARIOS_BASE = {
  admin:      { role: "admin",     nombre: "Administrador" },
  mensajero1: { role: "mensajero", nombre: "Segundo Morales", idx: 0 },
  mensajero2: { role: "mensajero", nombre: "Marcelo Sandoval", idx: 1 },
};

function getPasswords() {
  try {
    const raw = localStorage.getItem(PASS_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_PASS };
  } catch(_) { return { ...DEFAULT_PASS }; }
}

function savePasswords(p) {
  localStorage.setItem(PASS_KEY, JSON.stringify(p));
}

export function checkLogin(username, password) {
  const passes = getPasswords();
  const u = USUARIOS_BASE[username?.toLowerCase()];
  if (u && passes[username.toLowerCase()] === password) {
    return { username: username.toLowerCase(), ...u };
  }
  return null;
}

export function changePassword(username, newPassword) {
  const passes = getPasswords();
  passes[username] = newPassword;
  savePasswords(passes);
}

// ── MODAL CAMBIO DE CLAVE ────────────────────────────────────
export function CambiarClaveModal({ session, onClose }) {
  const [actual, setActual]     = useState("");
  const [nueva, setNueva]       = useState("");
  const [confirma, setConfirma] = useState("");
  const [error, setError]       = useState("");
  const [ok, setOk]             = useState(false);

  const inp = {
    width:"100%", padding:"9px 12px", borderRadius:7, fontSize:13,
    border:"1.5px solid #D8E8D0", outline:"none", fontFamily:"inherit",
    color:"#1A2E12", background:"#F8FAF5", boxSizing:"border-box",
  };

  function handleSave() {
    setError("");
    const passes = getPasswords();
    if (passes[session.username] !== actual) { setError("La contraseña actual es incorrecta."); return; }
    if (nueva.length < 4) { setError("La nueva contraseña debe tener al menos 4 caracteres."); return; }
    if (nueva !== confirma) { setError("Las contraseñas no coinciden."); return; }
    changePassword(session.username, nueva);
    setOk(true);
    setTimeout(onClose, 1800);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{background:"#fff",border:"1px solid #D8E8D0",borderRadius:14,padding:28,width:380,boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>
        {ok ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontSize:16,fontWeight:700,color:"#2D7A22"}}>Contraseña actualizada</div>
          </div>
        ) : (
          <>
            <div style={{fontSize:17,fontWeight:700,color:"#1A2E12",marginBottom:4}}>🔑 Cambiar contraseña</div>
            <div style={{fontSize:12,color:"#7A8E74",marginBottom:20}}>Usuario: <strong>{session.username}</strong></div>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,fontWeight:600,color:"#4A6340",display:"block",marginBottom:5}}>CONTRASEÑA ACTUAL</label>
              <input type="password" value={actual} onChange={e=>setActual(e.target.value)} style={inp} autoFocus/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,fontWeight:600,color:"#4A6340",display:"block",marginBottom:5}}>NUEVA CONTRASEÑA</label>
              <input type="password" value={nueva} onChange={e=>setNueva(e.target.value)} style={inp}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:600,color:"#4A6340",display:"block",marginBottom:5}}>CONFIRMAR NUEVA CONTRASEÑA</label>
              <input type="password" value={confirma} onChange={e=>setConfirma(e.target.value)} style={inp}/>
            </div>

            {error && <div style={{fontSize:11,color:"#C0392B",background:"#FDECEA",padding:"7px 12px",borderRadius:6,marginBottom:14}}>⚠️ {error}</div>}

            <div style={{display:"flex",gap:10}}>
              <button onClick={handleSave} style={{flex:1,padding:10,background:"#2D7A22",color:"#fff",border:"none",borderRadius:7,fontWeight:800,fontSize:13,cursor:"pointer"}}>
                Guardar
              </button>
              <button onClick={onClose} style={{flex:1,padding:10,background:"transparent",color:"#7A8E74",border:"1px solid #D8E8D0",borderRadius:7,fontSize:13,cursor:"pointer"}}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── LOGIN SCREEN ─────────────────────────────────────────────
export function LoginScreen({ onLogin }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const result = checkLogin(user.trim(), pass);
      if (result) {
        setError("");
        onLogin(result);
      } else {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
      }
    }, 500);
  }

  const inp = {
    width:"100%", padding:"10px 14px", borderRadius:8, fontSize:14,
    border:"1.5px solid #D8E8D0", outline:"none", fontFamily:"inherit",
    color:"#1A2E12", background:"#F8FAF5", boxSizing:"border-box",
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <div style={{background:"#fff",borderRadius:18,padding:"40px 44px",width:390,boxShadow:"0 24px 80px rgba(0,0,0,0.25)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:44,marginBottom:8}}>🌿</div>
          <div style={{fontSize:21,fontWeight:800,color:"#1A2E12"}}>Hoja Verde 360°</div>
          <div style={{fontSize:12,color:"#7A8E74",marginTop:4,letterSpacing:1}}>SISTEMA DE GESTIÓN INTEGRADO</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:"#4A6340",display:"block",marginBottom:5,letterSpacing:.5}}>USUARIO</label>
            <input value={user} onChange={e=>setUser(e.target.value)} placeholder="admin / mensajero1 / mensajero2" style={inp} autoFocus/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{fontSize:11,fontWeight:700,color:"#4A6340",display:"block",marginBottom:5,letterSpacing:.5}}>CONTRASEÑA</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={inp}/>
          </div>
          {error && <div style={{background:"#FDECEA",border:"1px solid #C0392B44",borderRadius:7,padding:"8px 14px",fontSize:12,color:"#C0392B",marginBottom:16}}>⚠️ {error}</div>}
          <button type="submit" disabled={loading} style={{width:"100%",padding:12,background:loading?"#95D5B2":"#2D7A22",color:"#fff",border:"none",borderRadius:8,fontWeight:800,fontSize:14,cursor:loading?"wait":"pointer"}}>
            {loading ? "Verificando..." : "Ingresar →"}
          </button>
        </form>

        <div style={{marginTop:24,padding:"12px 16px",background:"#F2F7EE",borderRadius:8,fontSize:11,color:"#7A8E74"}}>
          <div style={{fontWeight:700,marginBottom:5,color:"#4A6340"}}>Perfiles de acceso:</div>
          <div style={{marginBottom:2}}>🛡️ <strong>admin</strong> — Portal completo</div>
          <div>🚴 <strong>mensajero1 / mensajero2</strong> — Panel de mensajería</div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync("src/Auth.jsx", authContent, "utf8");
console.log("✅ src/Auth.jsx actualizado con cambio de clave");

// ── Patch MensajeroPanel — agregar botón cambiar clave ────────
let mensajero = fs.readFileSync("src/HV_MensajeroPanel.jsx", "utf8");

// Agregar import de CambiarClaveModal
if (!mensajero.includes("CambiarClaveModal")) {
  mensajero = `import { CambiarClaveModal } from "./Auth.jsx";\n` + mensajero;
}

// Agregar estado del modal
if (!mensajero.includes("claveModal")) {
  mensajero = mensajero.replace(
    `const [rechazoModal, setRechazoModal] = useState(null);`,
    `const [rechazoModal, setRechazoModal] = useState(null);
  const [claveModal, setClaveModal] = useState(false);`
  );
}

// Agregar render del modal
if (!mensajero.includes("claveModal &&")) {
  mensajero = mensajero.replace(
    `{rechazoModal && <RechazoModal`,
    `{claveModal && <CambiarClaveModal session={session} onClose={()=>setClaveModal(false)}/>}
      {rechazoModal && <RechazoModal`
  );
}

// Agregar botón en el header
if (!mensajero.includes("setClaveModal(true)")) {
  mensajero = mensajero.replace(
    `<button onClick={onLogout} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer"}}>
            Cerrar sesión
          </button>`,
    `<button onClick={()=>setClaveModal(true)} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer"}}>
            🔑 Cambiar clave
          </button>
          <button onClick={onLogout} style={{padding:"6px 14px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,color:"#fff",fontSize:12,cursor:"pointer"}}>
            Cerrar sesión
          </button>`
  );
}

fs.writeFileSync("src/HV_MensajeroPanel.jsx", mensajero, "utf8");
console.log("✅ src/HV_MensajeroPanel.jsx actualizado");

// ── Patch App.jsx — agregar botón cambiar clave al admin ──────
let app = fs.readFileSync("src/App.jsx", "utf8");

// Actualizar import de Auth
if (!app.includes("CambiarClaveModal")) {
  app = app.replace(
    `import { LoginScreen, USUARIOS } from "./Auth.jsx";`,
    `import { LoginScreen, CambiarClaveModal, checkLogin } from "./Auth.jsx";`
  );
}

// Agregar estado claveModal en AppInterna
if (!app.includes("claveModalAdmin")) {
  app = app.replace(
    `function AppInterna({ session, onLogout })`,
    `function AppInterna({ session, onLogout })`
  );
  // Buscar primer useState de AppInterna y agregar claveModal
  app = app.replace(
    `const [tab, setTab]           = useState("tendencias");`,
    `const [tab, setTab]           = useState("tendencias");
  const [claveModalAdmin, setClaveModalAdmin] = useState(false);`
  );
}

// Agregar render del modal y botón en header del admin
if (!app.includes("claveModalAdmin &&")) {
  // Agregar modal render
  app = app.replace(
    `{/* Toast */}`,
    `{claveModalAdmin && <CambiarClaveModal session={session} onClose={()=>setClaveModalAdmin(false)}/>}
      {/* Toast */}`
  );

  // Agregar botón en header junto a "Cerrar sesión"
  app = app.replace(
    `<button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>
            Cerrar sesión
          </button>`,
    `<button onClick={()=>setClaveModalAdmin(true)} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>
            🔑 Cambiar clave
          </button>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>
            Cerrar sesión
          </button>`
  );
}

// Actualizar el wrapper para usar checkLogin en lugar de USUARIOS
app = app.replace(
  `import { LoginScreen, USUARIOS } from "./Auth.jsx";`,
  `import { LoginScreen, CambiarClaveModal, checkLogin } from "./Auth.jsx";`
);

fs.writeFileSync("src/App.jsx", app, "utf8");
console.log("✅ src/App.jsx actualizado");

console.log("\n🎉 Cambio de clave listo para todos los usuarios");
console.log("   Botón 🔑 Cambiar clave en el header de cada panel");
console.log("\nEjecuta: npm run dev");
