import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Configuracoes.css";
import { LogOut, SunMedium, MoonStar, User, Mail, LogIn, Upload } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

function Configuracoes() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      console.error(e);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Redimensiona a imagem para 400x400 (quadrado, cortando o excesso)
  const resizeAndCropToSquare = (file, size = 400, quality = 0.9) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = size;
          canvas.height = size;

          // Calcula a área de recorte para centralizar a imagem
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          const sw = minSide;
          const sh = minSide;

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Selecione uma imagem válida (jpg, png, gif).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem não pode exceder 5MB.");
      return;
    }

    setUploading(true);
    try {
      const base64Image = await resizeAndCropToSquare(file, 400, 0.9);
      const updatedUser = { ...user, photo: base64Image };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert("Foto atualizada com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao processar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    if (window.confirm("Remover foto de perfil?")) {
      const updatedUser = { ...user, photo: null };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert("Foto removida.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main className="config-main">Carregando...</main>
      </div>
    );
  }

  if (!user) return null;

  const avatarInitial = user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main className="config-main">
        <div className="config-container">
          <header className="config-header">
            <h1>Configurações</h1>
            <p className="config-subtitle">Ajuste preferências da sua conta e do aplicativo</p>
          </header>

          <section className="config-section">
            <h2>Conta</h2>

            {/* Foto/avatar */}
            <div className="config-avatar-row">
              {user.photo ? (
                <img src={user.photo} alt="Foto" className="config-avatar-img" />
              ) : (
                <div className="config-avatar">{avatarInitial}</div>
              )}
            </div>

            <div className="config-upload-buttons">
              <label className={`config-btn-upload ${uploading ? "disabled" : ""}`}>
                <Upload size={16} />
                <span>{uploading ? "Enviando..." : "Alterar foto"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
              {user.photo && (
                <button className="config-btn-remove-photo" onClick={handleRemovePhoto}>
                  Remover foto
                </button>
              )}
            </div>

            <div className="config-row">
              <div className="config-text">
                <User size={16} className="config-icon" /> Nome:
              </div>
              <span className="config-value">{user.name || "Não informado"}</span>
            </div>

            <div className="config-row">
              <div className="config-text">
                <Mail size={16} className="config-icon" /> Email:
              </div>
              <span className="config-value">{user.email}</span>
            </div>

            <div className="config-row">
              <div className="config-text">
                <LogIn size={16} className="config-icon" /> Tipo de login:
              </div>
              <span className="config-value">Email/Senha</span>
            </div>

            <div className="config-row">
              <div className="config-text">Sair da conta:</div>
              <button className="config-btn-danger" onClick={handleLogout}>
                <LogOut size={18} /> Sair
              </button>
            </div>
          </section>

          <section className="config-section">
            <h2>Aparência</h2>
            <div className="config-row">
              <div className="config-text">Modo de exibição</div>
              <button className="config-btn-toggle" onClick={toggleTheme}>
                {isDark ? <MoonStar size={18} /> : <SunMedium size={18} />}
                <span>{isDark ? "Modo escuro" : "Modo claro"}</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Configuracoes;