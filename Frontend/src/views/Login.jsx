import { useState } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (authError) {
      setError('Credenciales inválidas. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles_admin')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (perfilError || !perfil) {
      setError('Error al obtener el perfil de administrador.');
      setLoading(false);
      return;
    }

    localStorage.setItem('token', authData.session.access_token);
    localStorage.setItem('admin_id', perfil.id);
    localStorage.setItem('admin_rol', perfil.rol);
    localStorage.setItem('admin_nombre', perfil.nombre_completo);

    navigate('/acceso-lab-dicis-0');
    setLoading(false);
  };

  return (
    <div className={styles.contenedorPrincipal}>
      {/* Identidad visual del sistema */}
      <div className={styles.seccionMarca}>
        <div className={styles.marcaContenido}>
          <div className={styles.logoIcono}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          <h1 className={styles.tituloMarca}>LabControl UG</h1>

          <div className={styles.lineaDecorativa}></div>

          <p className={styles.subtituloMarca}>
            Plataforma centralizada para la gestión, mantenimiento y control de
            equipamiento en laboratorios.
          </p>
        </div>
      </div>

      {/* Formulario de autenticación */}
      <div className={styles.seccionFormulario}>
        <div className={styles.tarjetaLogin}>
          <div className={styles.encabezadoFormulario}>
            <h2 className={styles.tituloFormulario}>Bienvenido</h2>
            <p className={styles.textoInstruccion}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {error && (
            <div className={styles.mensajeError}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>

              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.formulario}>
            <div className={styles.grupoInput}>
              <label htmlFor="email">Correo Electrónico</label>

              <div className={styles.contenedorInputWrapper}>
                <svg
                  className={styles.iconoInput}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  placeholder="admin@ugto.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.grupoInput}>
              <label htmlFor="password">Contraseña</label>

              <div className={styles.contenedorInputWrapper}>
                <svg
                  className={styles.iconoInput}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.botonAcceso}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loaderContenedor}>
                  <svg
                    className={styles.spinner}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                  </svg>

                  Iniciando...
                </span>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>

          <div className={styles.pieFormulario}>
            <p>Uso exclusivo para personal autorizado de la institución.</p>
          </div>
        </div>
      </div>
    </div>
  );
}