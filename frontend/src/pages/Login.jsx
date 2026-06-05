import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Search } from 'lucide-react';
import api from '../services/api';
import escudo from '../assets/escudo-ficct.png';
import '../styles/login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Ingrese un correo electrónico válido.';
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      if (response.data && response.data.token) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          setGeneralError('Credenciales incorrectas.');
        } else if (status === 403) {
          setGeneralError('Usuario inactivo o bloqueado.');
        } else if (status === 422) {
          if (error.response.data.errors) {
            setErrors(error.response.data.errors);
          } else {
            setGeneralError('Errores de validación.');
          }
        } else {
          setGeneralError('Error del servidor. Intente más tarde.');
        }
      } else if (error.request) {
        setGeneralError('No se pudo conectar con el servidor.');
      } else {
        setGeneralError('Error desconocido. Intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="left-content">
          <div className="escudo-container">
            <img
              src={escudo}
              alt="Escudo FICCT UAGRM"
              className="escudo-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <h1 className="title">Sistema de Admisión CUP</h1>
          <p className="subtitle">
            Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones - UAGRM
          </p>

          <div className="tech-decoration">
            <div className="circuit-line circuit-1"></div>
            <div className="circuit-line circuit-2"></div>
            <div className="circuit-dot dot-1"></div>
            <div className="circuit-dot dot-2"></div>
            <div className="circuit-dot dot-3"></div>
          </div>

          <p className="institutional-phrase">
            Conectando innovación, ciencia y educación
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="form-container">
          <div className="lock-icon-container">
            <LogIn size={40} className="lock-icon" />
          </div>

          <h2 className="form-title">Bienvenido</h2>
          <p className="form-description">
            Ingresa tus credenciales o utiliza los accesos públicos para iniciar el proceso de preinscripción y seguimiento.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {generalError && (
              <div className="error-message-container">
                <p className="error-message">{generalError}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo Electrónico
              </label>
              <div className={`input-wrapper ${errors.email ? 'input-error' : ''}`}>
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="admin@cup.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                />
              </div>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className={`input-wrapper password-wrapper ${errors.password ? 'input-error' : ''}`}>
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="public-access-section">
            <div className="access-header">
              <h3>Accesos públicos</h3>
              <p>Si eres postulante, utiliza estas opciones para avanzar sin necesidad de cuenta.</p>
            </div>
            <div className="public-access-grid">
              <button type="button" className="access-card" onClick={() => navigate('/preinscripcion')}>
                <div className="access-card-icon access-card-icon-blue">
                  <ArrowRight size={24} />
                </div>
                <div>
                  <h4>Realizar preinscripción CUP</h4>
                  <p>Si eres postulante nuevo, comienza tu preinscripción aquí.</p>
                </div>
              </button>

              <button type="button" className="access-card" onClick={() => navigate('/consultar-preinscripcion')}>
                <div className="access-card-icon access-card-icon-light">
                  <Search size={24} />
                </div>
                <div>
                  <h4>Consultar preinscripción</h4>
                  <p>Si ya enviaste tus requisitos, consulta el estado aquí.</p>
                </div>
              </button>
            </div>
          </div>

          <p className="footer-text">
            © 2026 Sistema de Admisión CUP - FICCT UAGRM. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
