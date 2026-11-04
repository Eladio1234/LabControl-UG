import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './VistaAlumno.module.css';

// Lee si la mesa tiene habilitado el temporizador de corte de clase (por defecto true)
const mesaUsaTimer = (kitObj) => {
  if (!kitObj) return true;
  let obj = kitObj;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch (e) {}
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch (e) {}
    }
  }
  if (typeof obj === 'object' && obj !== null && '_usar_timer' in obj) {
    return Boolean(obj._usar_timer);
  }
  return true;
};

// Calcula el bloque de 2 horas (de 8:00 a 18:00) y la hora exacta de corte (15 min antes del fin: 09:45, 11:45, 13:45, 15:45, 17:45)
const calcularInfoCorteClase = (ahora = new Date()) => {
  const h = ahora.getHours();
  if (h < 8 || h >= 18) return null;
  const inicioHora = h % 2 === 0 ? h : h - 1;
  const finHora = inicioHora + 2;
  const corte = new Date(ahora);
  corte.setHours(finHora - 1, 45, 0, 0);

  // Si ya pasamos el minuto :45 del bloque actual (ej. entre 09:45 y 09:59), el corte activo ya se alcanzó
  const segundosRestantes = Math.max(0, Math.floor((corte.getTime() - ahora.getTime()) / 1000));
  const horaCorteTexto = `${String(finHora - 1).padStart(2, '0')}:45`;
  const bloqueTexto = `${String(inicioHora).padStart(2, '0')}:00 - ${String(finHora).padStart(2, '0')}:00`;

  return {
    corte,
    segundosRestantes,
    horaCorteTexto,
    bloqueTexto,
    enVentanaRevision: ahora >= corte
  };
};

// Formatea segundos a HH:MM:SS o MM:SS
const formatearCuentaRegresiva = (segundos) => {
  const hrs = Math.floor(segundos / 3600);
  const mins = Math.floor((segundos % 3600) / 60);
  const secs = segundos % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const EquipoCard = ({ equipo, tipo }) => {
  if (!equipo) return null;
  return (
    <div className={styles.equipoCard}>
      {equipo.imagen_url ? (
        <img src={equipo.imagen_url} alt={tipo} className={styles.equipoImg} />
      ) : (
        <div className={styles.equipoIconoFallback}>🔬</div>
      )}
      <span className={styles.equipoTipo}>{tipo}</span>
      <span className={styles.equipoModelo}>{equipo.marca} {equipo.nombre_modelo}</span>
    </div>
  );
};

export default function VistaAlumno() {
  const { id: mesaId } = useParams();

  const [datosMesa, setDatosMesa] = useState(null);
  const [cargandoMesa, setCargandoMesa] = useState(true);
  const [form, setForm] = useState({ nombre_alumno: '' });
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const [idSesion, setIdSesion] = useState(null); 
  const [estado, setEstado] = useState('formulario'); 
  const [mensajeError, setMensajeError] = useState('');
  const [notaAlumno, setNotaAlumno] = useState('');
  const [sesionActual, setSesionActual] = useState(null); 
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [nipIntento, setNipIntento] = useState('');
  const [errorNip, setErrorNip] = useState('');

  // Estado para el tiempo restante en segundos del formulario inicial (10 minutos = 600 segundos)
  const [tiempoRestante, setTiempoRestante] = useState(600);

  // Estado para el contador del bloque de clase (cierre 15 min antes de las 2 horas)
  const [infoClase, setInfoClase] = useState(() => calcularInfoCorteClase(new Date()));

  const [formEntrada, setFormEntrada] = useState({
    nombre_profesor: '',
    materia: '',
    osc1: false,
    osc2: false,
    mult1: false,
    mult2: false,
    nip: ''
  });

  useEffect(() => {
    const cargarInfoMesa = async () => {
      try {
        let idFormateado = mesaId.toUpperCase();
        if (!idFormateado.startsWith('MESA-')) idFormateado = `MESA-${idFormateado.padStart(2, '0')}`; 

        const res = await fetch(`http://localhost:3000/api/mesas/${idFormateado}`);
        if (res.ok) {
          const data = await res.json();
          setDatosMesa(data);
          if (!data.notas_mantenimiento) setAceptaCondiciones(true);
        }

        const urlActiva = `http://localhost:3000/api/sesiones/activa/${idFormateado}`;
        const resActiva = await fetch(urlActiva);
        
        if (resActiva.ok) {
          const sesionRecuperada = await resActiva.json();
          if (sesionRecuperada) { 
            setIdSesion(sesionRecuperada.id);
            setSesionActual(sesionRecuperada);
            if (sesionRecuperada.estado_sesion === 'solicitada') {
              setEstado('esperando_admin');
            } else if (sesionRecuperada.estado_sesion === 'finalizada_alumno') {
              setEstado('finalizado');
            } else if (sesionRecuperada.estado_sesion === 'activa' && !sesionRecuperada.nip) {
              setEstado('formulario_entrada');
            } else {
              setEstado(sesionRecuperada.estado_sesion);
            }
          }
        }
      } catch (error) { 
        console.error("Error", error); 
      } finally { 
        setCargandoMesa(false); 
      }
    };
    cargarInfoMesa();
  }, [mesaId]);

  useEffect(() => {
    let intervalo;
    if (estado === 'esperando_admin' && idSesion) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/sesiones/${idSesion}`);
          if (!res.ok) return;
          const sesion = await res.json();
          setSesionActual(sesion);
          if (sesion.estado_sesion === 'activa') setEstado('formulario_entrada');
          else if (['expirada', 'cerrada', 'cancelada'].includes(sesion.estado_sesion)) {
            setMensajeError('Tu solicitud ha sido cancelada o expiró.');
            setEstado('formulario');
          }
        } catch (error) { 
          console.error(error); 
        }
      }, 3000); 
    }
    return () => clearInterval(intervalo);
  }, [estado, idSesion]);

  // Polling mientras la sesión está activa o en revisión para sincronizar si el admin o el cron cambian el estado
  useEffect(() => {
    let intervalo;
    if ((estado === 'activa' || estado === 'finalizado') && idSesion) {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/sesiones/${idSesion}`);
          if (!res.ok) return;
          const sesion = await res.json();
          setSesionActual(sesion);
          if (sesion.estado_sesion === 'finalizada_alumno' && estado !== 'finalizado') {
            setEstado('finalizado');
          } else if (sesion.estado_sesion === 'cerrada') {
            window.location.reload();
          }
        } catch (e) {
          console.error(e);
        }
      }, 5000);
    }
    return () => clearInterval(intervalo);
  }, [estado, idSesion]);

  // Temporizador de 10 minutos visible y controlado por segundo en validación de equipo
  useEffect(() => {
    let timerExpulsion;
    let cuentaRegresiva;

    if (estado === 'formulario_entrada') {
      setTiempoRestante(600);

      cuentaRegresiva = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(cuentaRegresiva);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerExpulsion = setTimeout(() => {
        alert("Tiempo límite de 10 minutos superado.");
        window.location.reload(); 
      }, 600000); 
    }

    return () => {
      clearTimeout(timerExpulsion);
      clearInterval(cuentaRegresiva);
    };
  }, [estado]);

  // Formatear segundos a MM:SS
  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Libera automáticamente la sesión para pasar a modo revisión cuando llega el corte (:45)
  const pasarAModoRevisionAutomatico = useCallback(async () => {
    if (!idSesion || estado !== 'activa') return;
    try {
      await fetch(`http://localhost:3000/api/sesiones/${idSesion}/liberar`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota_alumno: notaAlumno || 'Cierre automático por corte de horario de clase (15 min antes de finalizar el bloque).' }) 
      });
      setEstado('finalizado');
    } catch (error) {
      console.error('Error al pasar a revisión automática:', error);
    }
  }, [idSesion, estado, notaAlumno]);

  const timerHabilitadoEnMesa = mesaUsaTimer(datosMesa?.kit_accesorios);

  // Reloj de cuenta regresiva del bloque de 2 horas (8:00 a 18:00, corte a las 09:45, 11:45, 13:45, 15:45, 17:45)
  useEffect(() => {
    if (!timerHabilitadoEnMesa) return;

    const tick = () => {
      const ahora = new Date();
      const info = calcularInfoCorteClase(ahora);
      setInfoClase(info);

      if (estado === 'activa' && sesionActual) {
        const inicioSesion = new Date(sesionActual.hora_entrada || sesionActual.created_at || ahora);
        const hInicio = inicioSesion.getHours();
        if (hInicio >= 8 && hInicio < 18) {
          const finHora = hInicio % 2 === 0 ? hInicio + 2 : hInicio + 1;
          const corteSesion = new Date(inicioSesion);
          corteSesion.setHours(finHora - 1, 45, 0, 0);

          if (ahora >= corteSesion) {
            pasarAModoRevisionAutomatico();
          }
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerHabilitadoEnMesa, estado, sesionActual, pasarAModoRevisionAutomatico]);

  const handleSolicitar = async (e) => {
    e.preventDefault();
    setEstado('cargando');
    try {
      const res = await fetch('http://localhost:3000/api/sesiones/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa_id: datosMesa.id, nombre_alumno: form.nombre_alumno })
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error);
      setIdSesion(datos.data.id);
      setSesionActual(datos.data);
      setEstado('esperando_admin');
    } catch (error) {
      setMensajeError(error.message);
      setEstado('formulario');
    }
  };

  const handleEntradaSubmit = async (e) => {
    e.preventDefault();
    if (formEntrada.nip.length !== 4) return alert("El NIP debe ser exactamente de 4 dígitos.");
    
    setEstado('cargando');
    try {
      const res = await fetch(`http://localhost:3000/api/sesiones/${idSesion}/entrada`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_profesor: formEntrada.nombre_profesor,
          materia: formEntrada.materia,
          osc1: formEntrada.osc1,
          osc2: formEntrada.osc2,
          mult1: formEntrada.mult1,
          mult2: formEntrada.mult2,
          nip: formEntrada.nip
        })
      });
      const json = await res.json().catch(() => ({}));
      const registroActualizado = json?.data?.[0] || { ...sesionActual, nip: formEntrada.nip, hora_entrada: new Date().toISOString() };
      
      setSesionActual(registroActualizado); 
      setDesbloqueado(true); 
      setEstado('activa');
    } catch (error) { 
      alert(error.message); 
      setEstado('formulario_entrada'); 
    }
  };

  const handleLiberar = async () => {
    if (!window.confirm('¿Finalizar práctica?')) return;
    setEstado('cargando');
    try {
      await fetch(`http://localhost:3000/api/sesiones/${idSesion}/liberar`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota_alumno: notaAlumno }) 
      });
      setEstado('finalizado');
    } catch (error) { 
      alert(error.message); 
      setEstado('activa'); 
    }
  };

  // Renderizador del banner del contador de clase (visible si la mesa tiene activo el timer y estamos entre 8:00 y 18:00)
  const renderContadorClase = () => {
    if (!timerHabilitadoEnMesa || !infoClase) return null;
    const urgente = infoClase.segundosRestantes <= 600; // Últimos 10 min en rojo
    return (
      <div
        style={{
          background: urgente ? '#fef2f2' : '#eff6ff',
          border: `1.5px solid ${urgente ? '#f87171' : '#93c5fd'}`,
          padding: '0.85rem 1.1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: urgente ? '#991b1b' : '#1e40af', display: 'block', letterSpacing: '0.5px' }}>
          ⏱️ TIEMPO RESTANTE DE LA SESIÓN (BLOQUE {infoClase.bloqueTexto})
        </span>
        <span style={{ fontSize: '1.8rem', fontFamily: 'monospace', fontWeight: 800, color: urgente ? '#dc2626' : '#1e3a8a', display: 'block', margin: '0.2rem 0' }}>
          {formatearCuentaRegresiva(infoClase.segundosRestantes)}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
          La sesión pasará automáticamente a <strong>Revisión</strong> a las <strong>{infoClase.horaCorteTexto} hrs</strong> (15 min antes del fin de clase).
        </span>
      </div>
    );
  };

  if (estado === 'finalizado') return (
    <div className={styles.pantallaCompleta}>
      <div className={styles.tarjetaCentrada}>
        <div className={styles.iconoGrande}>👋</div>
        <h3 className={styles.tituloCentrado}>Práctica en Modo Revisión</h3>
        <p className={styles.textoSecundario}>
          Mesa {mesaId.replace(/MESA[-_ ]?/i, '')} lista para revisión del administrador. Una vez liberada quedará disponible para el siguiente bloque de clase.
        </p>
      </div>
    </div>
  );

  if (estado === 'activa') {
    if (!desbloqueado) {
      return (
        <div className={styles.pantallaCompleta}>
          <div className={styles.tarjetaCentrada}>
            <div className={styles.iconoGrande}>🔒</div>
            <h3 className={styles.tituloCentrado}>Mesa Protegida</h3>
            {renderContadorClase()}
            <p className={styles.textoSecundario}>Ingresa el NIP de tu equipo para retomar la práctica.</p>
            <input 
              type="password" 
              maxLength="4" 
              placeholder="****" 
              value={nipIntento} 
              onChange={(e) => setNipIntento(e.target.value.replace(/\D/g, ''))}
              className={styles.inputNip}
            />
            {errorNip && <p className={styles.errorText}>{errorNip}</p>}
            <button 
              className={styles.btnSubmit} 
              onClick={() => {
                if (nipIntento === sesionActual?.nip) { 
                  setDesbloqueado(true); 
                  setErrorNip(''); 
                } else { 
                  setErrorNip('NIP Incorrecto. Intenta de nuevo.'); 
                  setNipIntento(''); 
                }
              }}
            >
              Desbloquear Mesa
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.pantallaCompleta}>
        <div className={styles.tarjetaCentrada}>
          <div className={styles.iconoGrande}>🔬</div>
          <h3 className={styles.tituloCentrado}>Sesión en Curso</h3>
          {renderContadorClase()}
          <div className={styles.seccionObservaciones}>
            <label className={styles.labelForm}>
              Observaciones durante la práctica (Opcional):
            </label>
            <textarea 
              value={notaAlumno} 
              onChange={(e)=>setNotaAlumno(e.target.value)} 
              placeholder="Ej. El generador dejó de dar señal..." 
              className={styles.textareaForm}
            />
            <button onClick={handleLiberar} className={styles.btnPeligro}>
              ⏹️ Terminar Práctica
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'esperando_admin') return (
    <div className={styles.pantallaCompleta}>
      <div className={styles.tarjetaCentrada}>
        <div className={styles.iconoGrande}>⏳</div>
        <h3 className={styles.tituloCentrado}>Petición Enviada</h3>
        {renderContadorClase()}
        <p className={styles.textoSecundario}>Por favor, dirígete con el administrador para que asigne tu mesa.</p>
      </div>
    </div>
  );

  if (estado === 'formulario_entrada') return (
    <div className={styles.pantallaCompleta}>
      <div className={styles.tarjetaAncha}>
        <div className={styles.headerFormulario} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Validación de Equipo</h1>
            <p>Prueba los accesorios antes de iniciar.</p>
          </div>
          {/* Visualizador del contador regresivo de validación (10 min) */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'block', fontWeight: 'bold' }}>TIEMPO P/ VALIDAR</span>
            <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold', color: tiempoRestante < 60 ? '#dc2626' : '#1e3a8a' }}>
              {formatearTiempo(tiempoRestante)}
            </span>
          </div>
        </div>

        {renderContadorClase()}
        
        <form onSubmit={handleEntradaSubmit} className={styles.formulario}>
          <div className={styles.filaInputs}>
            <div className={styles.inputGroup}>
              <label className={styles.labelForm}>Profesor Titular:</label>
              <input 
                type="text" 
                value={formEntrada.nombre_profesor} 
                onChange={(e)=>setFormEntrada({...formEntrada, nombre_profesor: e.target.value})} 
                placeholder="Ej. Ing. Contreras" 
                required 
                className={styles.inputGeneral}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.labelForm}>Materia:</label>
              <input 
                type="text" 
                value={formEntrada.materia} 
                onChange={(e)=>setFormEntrada({...formEntrada, materia: e.target.value})} 
                placeholder="Ej. Mediciones" 
                required 
                className={styles.inputGeneral}
              />
            </div>
          </div>

          <h3 className={styles.subtituloForm}>Osciloscopio (Prueba de Onda Cuadrada)</h3>
          <div className={styles.gridVerificacion}>
            <label className={styles.checkboxCard}>
              <input type="checkbox" checked={formEntrada.osc1} onChange={(e)=>setFormEntrada({...formEntrada, osc1: e.target.checked})} />
              <span>Osc 1 (Punta 1 OK)</span>
            </label>
            <label className={styles.checkboxCard}>
              <input type="checkbox" checked={formEntrada.osc2} onChange={(e)=>setFormEntrada({...formEntrada, osc2: e.target.checked})} />
              <span>Osc 2 (Punta 2 OK)</span>
            </label>
          </div>

          <h3 className={styles.subtituloForm}>Multímetros (Prueba de Continuidad)</h3>
          <div className={styles.gridVerificacion}>
            <label className={styles.checkboxCard}>
              <input type="checkbox" checked={formEntrada.mult1} onChange={(e)=>setFormEntrada({...formEntrada, mult1: e.target.checked})} />
              <span>Multímetro 1 OK</span>
            </label>
            <label className={styles.checkboxCard}>
              <input type="checkbox" checked={formEntrada.mult2} onChange={(e)=>setFormEntrada({...formEntrada, mult2: e.target.checked})} />
              <span>Multímetro 2 OK</span>
            </label>
          </div>
          
          <div className={styles.cajaNipCreacion}>
            <label className={styles.labelNipCreacion}>
              Crea un NIP de 4 dígitos (Para compartir con tu equipo):
            </label>
            <input 
              type="text" 
              maxLength="4" 
              placeholder="Ej. 1234" 
              value={formEntrada.nip} 
              onChange={(e)=>setFormEntrada({...formEntrada, nip: e.target.value.replace(/\D/g, '')})} 
              required 
              className={styles.inputNipCreacion}
            />
          </div>
          
          <button type="submit" className={styles.btnSubmitForm}>Comenzar Práctica</button>
        </form>
      </div>
    </div>
  );

  if (estado === 'cargando') return (
    <div className={styles.pantallaCompleta}>
      <div style={{ textAlign: 'center' }}>
        <div className={styles.iconoGrande} style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '1rem' }}>⚙️</div>
        <h3 style={{ color: '#1e3a8a', fontFamily: 'monospace', letterSpacing: '2px', margin: 0 }}>PROCESANDO...</h3>
        <p className={styles.textoCargando} style={{ padding: '0', marginTop: '0.5rem' }}>Por favor espera</p>
      </div>
    </div>
  );

  const kitArray = datosMesa?.kit_accesorios
    ? Object.entries(datosMesa.kit_accesorios)
        .filter(([key]) => !key.startsWith('_'))
        .map(([, val]) => val)
    : [];

  return (
    <div className={styles.pantallaCompleta}>
      <div className={styles.tarjetaAncha}>
        
        <div className={styles.headerPrincipal}>
          <h1>LabControl UG</h1>
          <span className={styles.badgeMesa}>
            Mesa {datosMesa?.numero_mesa || mesaId.replace(/MESA[-_ ]?/i, '')}
          </span>
        </div>

        {cargandoMesa ? (
          <p className={styles.textoCargando}>Cargando inventario...</p>
        ) : (
          <>
            {renderContadorClase()}

            <h3 className={styles.seccionTitulo}>Equipamiento Principal</h3>
            <div className={styles.gridEquipo}>
              <EquipoCard equipo={datosMesa?.osciloscopio} tipo="Osciloscopio" />
              <EquipoCard equipo={datosMesa?.generador} tipo="Generador" />
              <EquipoCard equipo={datosMesa?.fuente} tipo="Fuente" />
              <EquipoCard equipo={datosMesa?.multimetro1} tipo="Multímetro 1" />
              <EquipoCard equipo={datosMesa?.multimetro2} tipo="Multímetro 2" />
            </div>

            <h3 className={styles.seccionTitulo}>Kit de Accesorios Asignado</h3>
            {kitArray.length > 0 ? (
              <ul className={styles.listaKit}>
                {kitArray.map((item, index) => (
                  <li key={index} className={styles.itemKit}>
                    <span className={styles.itemKitNombre}>{item.nombre}</span>
                    <span className={styles.itemCantidad}>x{item.cantidad_ideal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.kitVacio}>No hay kit registrado en esta mesa.</p>
            )}

            {datosMesa?.notas_mantenimiento && (
              <div className={styles.cajaAlerta}>
                <p className={styles.alertaTexto}>
                  ⚠️ <strong>Nota de Laboratorio:</strong> {datosMesa.notas_mantenimiento}
                </p>
                <label className={styles.alertaCheckbox}>
                  <input 
                    type="checkbox" 
                    checked={aceptaCondiciones} 
                    onChange={(e)=>setAceptaCondiciones(e.target.checked)}
                  /> 
                  Acepto usar la mesa en estas condiciones.
                </label>
              </div>
            )}

            {mensajeError && <div className={styles.errorMsg}>{mensajeError}</div>}

            <h3 className={styles.seccionTituloFinal}>Registro de Alumno</h3>
            <form onSubmit={handleSolicitar} className={styles.formularioRegistro}>
              <div className={styles.inputGroup}>
                <label className={styles.labelForm}>Tu Nombre Completo</label>
                <input 
                  type="text" 
                  placeholder="Ej. Juan Pérez" 
                  value={form.nombre_alumno} 
                  onChange={(e)=>setForm({nombre_alumno: e.target.value})} 
                  required 
                  className={styles.inputGeneral}
                />
              </div>
              <button 
                type="submit" 
                className={styles.btnSubmitRegistro} 
                disabled={!form.nombre_alumno || (!aceptaCondiciones && datosMesa?.notas_mantenimiento)}
              >
                Solicitar Mesa
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
