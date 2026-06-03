import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(pw) {
  if (!pw) return true;
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return re.test(pw);
}

export default function UserForm({ open, onClose, onSubmit, initial = {}, roles = [] }) {
  const [name, setName] = useState(initial.name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(initial.role?.id || '');
  const [estado, setEstado] = useState(initial.estado || 'ACTIVO');
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);

  useEffect(() => {
    setName(initial.name || '');
    setEmail(initial.email || '');
    setPassword('');
    setRoleId(initial.role?.id || '');
    setEstado(initial.estado || 'ACTIVO');
    setErrors({});
    setShow(false);
  }, [initial, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Nombre obligatorio.';
    if (!email.trim()) newErrors.email = 'Email obligatorio.';
    else if (!validateEmail(email)) newErrors.email = 'Email inválido.';
    if (!initial.id && !password) newErrors.password = 'Password obligatorio.';
    if (password && !validatePassword(password)) newErrors.password = 'Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.';
    if (!roleId) newErrors.roleId = 'Rol obligatorio.';
    if (!estado) newErrors.estado = 'Estado obligatorio.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      role_id: Number(roleId),
      estado,
    };
    if (password) payload.password = password;

    onSubmit(payload);
  };

  return (
    <div className="drawer-overlay">
      <aside className="drawer-panel">
        <div className="drawer-header">
          <h3>{initial.id ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <p className="help-text">Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.</p>
        </div>
        <form onSubmit={handleSubmit} className="user-form">
          <label>Nombre completo</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <div className="field-error">{errors.name}</div>}

          <label>Correo electrónico</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <div className="field-error">{errors.email}</div>}

          <label>Contraseña {initial.id ? '(opcional)' : ''}</label>
          <div className="password-row">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="toggle-show" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button>
          </div>
          {errors.password && <div className="field-error">{errors.password}</div>}

          <label>Rol</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">Seleccione rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          {errors.roleId && <div className="field-error">{errors.roleId}</div>}

          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
            <option value="BLOQUEADO">BLOQUEADO</option>
          </select>
          {errors.estado && <div className="field-error">{errors.estado}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">{initial.id ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </aside>
    </div>
  );
}
