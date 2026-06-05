import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import api from '../services/api';
import { cambiarPassword } from '../services/auth';
import '../styles/cambiarPassword.css';

const initialForm = {
  password_actual: '',
  password: '',
  password_confirmation: '',
};

export default function CambiarPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState({
    password_actual: false,
    password: false,
    password_confirmation: false,
  });

  const user = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const validateForm = () => {
    const nextErrors = {};
    const passwordRules = [
      {
        valid: form.password.length >= 8,
        message: 'La nueva contraseña debe tener al menos 8 caracteres.',
      },
      {
        valid: /[A-Z]/.test(form.password),
        message: 'La nueva contraseña debe tener al menos una mayúscula.',
      },
      {
        valid: /[a-z]/.test(form.password),
        message: 'La nueva contraseña debe tener al menos una minúscula.',
      },
      {
        valid: /\d/.test(form.password),
        message: 'La nueva contraseña debe tener al menos un número.',
      },
    ];

    if (!form.password_actual.trim()) {
      nextErrors.password_actual = 'La contraseña actual es obligatoria.';
    }

    if (!form.password.trim()) {
      nextErrors.password = 'La nueva contraseña es obligatoria.';
    } else {
      const failedRule = passwordRules.find((rule) => !rule.valid);
      if (failedRule) nextErrors.password = failedRule.message;
    }

    if (!form.password_confirmation.trim()) {
      nextErrors.password_confirmation = 'La confirmación de contraseña es obligatoria.';
    } else if (form.password !== form.password_confirmation) {
      nextErrors.password_confirmation = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (generalError) setGeneralError('');
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // La salida local debe ocurrir aunque el servidor no responda.
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await cambiarPassword({
        password_actual: form.password_actual,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });

      const updatedUser = {
        ...(user || {}),
        debe_cambiar_password: false,
      };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccessMessage('Contraseña actualizada correctamente.');
      setForm(initialForm);

      window.setTimeout(() => {
        navigate(updatedUser.role === 'postulante' ? '/perfil-postulante' : '/dashboard', { replace: true });
      }, 900);
    } catch (error) {
      if (error.response?.status === 422 && error.response.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setGeneralError(error.response.data.message);
      } else {
        setGeneralError('No se pudo actualizar la contraseña. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (name, label, placeholder) => (
    <div className="cp-form-group">
      <label className="cp-label" htmlFor={name}>
        {label}
      </label>
      <div className={`cp-input-wrapper ${errors[name] ? 'cp-input-error' : ''}`}>
        <Lock size={19} className="cp-input-icon" />
        <input
          id={name}
          name={name}
          className="cp-input"
          type={visible[name] ? 'text' : 'password'}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          autoComplete={name === 'password_actual' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          className="cp-icon-button"
          onClick={() => setVisible((prev) => ({ ...prev, [name]: !prev[name] }))}
          aria-label={visible[name] ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible[name] ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
      {errors[name] && <p className="cp-field-error">{Array.isArray(errors[name]) ? errors[name][0] : errors[name]}</p>}
    </div>
  );

  return (
    <main className="cp-page">
      <button type="button" className="cp-logout" onClick={handleLogout}>
        <LogOut size={18} />
        Cerrar sesión
      </button>

      <section className="cp-card" aria-labelledby="cambiar-password-title">
        <div className="cp-card-icon">
          <ShieldCheck size={34} />
        </div>

        <h1 id="cambiar-password-title" className="cp-title">
          Cambiar contraseña
        </h1>
        <p className="cp-subtitle">
          Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
        </p>

        <div className="cp-registro-box">
          <div className="cp-registro-icon">
            <UserRound size={22} />
          </div>
          <div>
            <p className="cp-registro-label">Registro asignado: {user?.registro || 'N/A'}</p>
            <p className="cp-registro-text">Este registro es único y no puede modificarse.</p>
          </div>
        </div>

        <form className="cp-form" onSubmit={handleSubmit}>
          {generalError && <div className="cp-alert cp-alert-error">{generalError}</div>}
          {successMessage && <div className="cp-alert cp-alert-success">{successMessage}</div>}

          {renderPasswordField('password_actual', 'Contraseña actual', 'Ingresa tu contraseña temporal')}
          {renderPasswordField('password', 'Nueva contraseña', 'Mínimo 8 caracteres')}
          {renderPasswordField('password_confirmation', 'Confirmar nueva contraseña', 'Repite la nueva contraseña')}

          <button type="submit" className="cp-submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}
