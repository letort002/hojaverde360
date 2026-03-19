import React, { useState } from "react";

export const USUARIOS = {
  admin:      { password: "hv2026admin", role: "admin",     nombre: "Administrador" },
  mensajero1: { password: "msg1hv",      role: "mensajero", nombre: "Segundo Morales", idx: 0 },
  mensajero2: { password: "msg2hv",      role: "mensajero", nombre: "Marcelo Sandoval", idx: 1 },
};

export function LoginScreen({ onLogin }) {
  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const u = USUARIOS[user.trim().toLowerCase()];
      if (u && u.password === pass) {
        setError("");
        onLogin({ username: user.trim().toLowerCase(), ...u });
      } else {
        setError("Usuario o contraseña incorrectos");
        setLoading(false);
      }
    }, 500);
  }

  const inp = {
    width:"100%", padding:"10px 14px", borderRadius:8, fontSize:14,
    border:"1.5px solid #D8E8D0", outline:"none", fontFamily:"inherit",
    boxSizing:"border-box", color:"#1A2E12", background:"#F8FAF5",
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#2D5016 0%,#4A7C3F 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Inter','Segoe UI',sans-serif"
    }}>
      <div style={{
        background:"#fff", borderRadius:18, padding:"40px 44px", width:390,
        boxShadow:"0 24px 80px rgba(0,0,0,0.25)"
      }}>
        <div style={{textAlign:"center", marginBottom:32}}>
          <div style={{fontSize:44, marginBottom:8}}>🌿</div>
          <div style={{fontSize:21, fontWeight:800, color:"#1A2E12"}}>Hoja Verde 360°</div>
          <div style={{fontSize:12, color:"#7A8E74", marginTop:4, letterSpacing:1}}>
            SISTEMA DE GESTIÓN INTEGRADO
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:"#4A6340",display:"block",marginBottom:5,letterSpacing:.5}}>
              USUARIO
            </label>
            <input
              value={user} onChange={e=>setUser(e.target.value)}
              placeholder="admin / mensajero1 / mensajero2"
              style={inp} autoFocus
            />
          </div>

          <div style={{marginBottom:22}}>
            <label style={{fontSize:11,fontWeight:700,color:"#4A6340",display:"block",marginBottom:5,letterSpacing:.5}}>
              CONTRASEÑA
            </label>
            <input
              type="password" value={pass} onChange={e=>setPass(e.target.value)}
              placeholder="••••••••"
              style={inp}
            />
          </div>

          {error && (
            <div style={{background:"#FDECEA",border:"1px solid #C0392B44",borderRadius:7,padding:"8px 14px",fontSize:12,color:"#C0392B",marginBottom:16}}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:"100%", padding:12,
            background:loading?"#95D5B2":"#2D7A22",
            color:"#fff", border:"none", borderRadius:8,
            fontWeight:800, fontSize:14,
            cursor:loading?"wait":"pointer", transition:"background .2s"
          }}>
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
