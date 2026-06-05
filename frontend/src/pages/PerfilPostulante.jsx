import { Mail, Shield, User, UserRound } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../styles/dashboard.css';
import '../styles/cambiarPassword.css';

export default function PerfilPostulante() {
  let user = null;

  try {
    const stored = sessionStorage.getItem('user');
    user = stored ? JSON.parse(stored) : null;
  } catch (e) {
    user = null;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header title="Perfil del postulante" breadcrumb="Inicio / Perfil postulante" />

        <div className="content-inner">
          <section className="postulante-panel">
            <div className="postulante-heading">
              <div className="postulante-avatar">
                <UserRound size={36} />
              </div>
              <div>
                <h2>Bienvenido al sistema CUP</h2>
                <p>Estos son tus datos principales de acceso.</p>
              </div>
            </div>

            <div className="postulante-grid">
              <div className="postulante-item">
                <span>
                  <User size={18} />
                  Nombre
                </span>
                <strong>{user?.name || 'N/A'}</strong>
              </div>

              <div className="postulante-item">
                <span>
                  <Mail size={18} />
                  Correo
                </span>
                <strong>{user?.email || 'N/A'}</strong>
              </div>

              <div className="postulante-item">
                <span>
                  <UserRound size={18} />
                  Registro
                </span>
                <strong>{user?.registro || 'N/A'}</strong>
              </div>

              <div className="postulante-item">
                <span>
                  <Shield size={18} />
                  Rol
                </span>
                <strong className="postulante-role">{user?.role || 'postulante'}</strong>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
