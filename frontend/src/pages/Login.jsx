import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
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

  // Validar email
  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Validar formulario antes de enviar
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

  // Manejar envío del formulario
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
        // Guardar token y user en localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirigir al dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      // Manejar diferentes tipos de errores
      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          setGeneralError('Credenciales incorrectas.');
        } else if (status === 403) {
          setGeneralError('Usuario inactivo o bloqueado.');
        } else if (status === 422) {
          // Errores de validación del backend
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
      {/* Panel Izquierdo */}
      <div className="login-left">
        <div className="left-content">
          {/* Escudo */}
          <div className="escudo-container">
            <img 
              src={escudo} 
              alt="Escudo FICCT UAGRM" 
              className="escudo-image"
              onError={(e) => {
                // Fallback si la imagen no carga
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Título Principal */}
          <h1 className="title">Sistema de Admisión CUP</h1>

          {/* Subtítulo Institucional */}
          <p className="subtitle">
            Facultad de Ingeniería en Ciencias de la Computación y
            Telecomunicaciones - UAGRM
          </p>

          {/* Decoración Tecnológica */}
          <div className="tech-decoration">
            <div className="circuit-line circuit-1"></div>
            <div className="circuit-line circuit-2"></div>
            <div className="circuit-dot dot-1"></div>
            <div className="circuit-dot dot-2"></div>
            <div className="circuit-dot dot-3"></div>
          </div>

          {/* Frase Institucional */}
          <p className="institutional-phrase">
            Conectando innovación, ciencia y educación
          </p>
        </div>
      </div>

      {/* Panel Derecho */}
      <div className="login-right">
        <div className="form-container">
          {/* Ícono de Candado */}
          <div className="lock-icon-container">
            <LogIn size={40} className="lock-icon" />
          </div>

          {/* Título */}
          <h2 className="form-title">Bienvenido</h2>

          {/* Descripción */}
          <p className="form-description">
            Ingresa tus credenciales para acceder al Sistema de Admisión CUP.
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Mensaje de Error General */}
            {generalError && (
              <div className="error-message-container">
                <p className="error-message">{generalError}</p>
              </div>
            )}

            {/* Campo Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo Electrónico
              </label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="admin@cup.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Limpiar error cuando el usuario comienza a escribir
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                />
              </div>
              {errors.email && (
                <p className="field-error">{errors.email}</p>
              )}
            </div>

            {/* Campo Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <div className="input-wrapper password-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Limpiar error cuando el usuario comienza a escribir
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
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
              {errors.password && (
                <p className="field-error">{errors.password}</p>
              )}
            </div>

            {/* Botón Iniciar Sesión */}
            <button
              type="submit"
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Footer Institucional */}
          <p className="footer-text">
            © 2026 Sistema de Admisión CUP - FICCT UAGRM. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
