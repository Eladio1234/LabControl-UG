import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './VistaAlumno.module.css';

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
            setEstado(sesionRecuperada.estado_sesion); 
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
          const sesionActual = await res.json();
          if (sesionActual.estado_sesion === 'activa') setEstado('formulario_entrada');
          else if (['expirada', 'cerrada'].includes(sesionActual.estado_sesion)) {
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
      await fetch(`http://localhost:3000/api/sesiones/${idSesion}/entrada`, {
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
      
      setSesionActual({ ...sesionActual, nip: formEntrada.nip }); 
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
      setEstado('en_uso'); 
    }
  };

  if (estado === 'finalizado') return (
    <div className={styles.pantallaCompleta}>
      <div className={styles.tarjetaCentrada}>
        <div className={styles.iconoGrande}>👋</div>
        <h3 className={styles.tituloCentrado}>Práctica Terminada</h3>
        <p className={styles.textoSecundario}>Mesa {mesaId.replace(/MESA[-_ ]?/i, '')} en revisión.</p>
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
        <p className={styles.textoSecundario}>Por favor, dirígete con el administrador para que asigne tu mesa.</p>
      </div>
    </div>
  );

  if (estado === 'formulario_entrada') return (
    <div className={styles.pantallaCompleta}>
      <div className={styles.tarjetaAncha}>
        <div className={styles.headerFormulario}>
          <h1>Validación de Equipo</h1>
          <p>Prueba los accesorios antes de iniciar.</p>
        </div>
        
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

  const kitArray = datosMesa?.kit_accesorios ? Object.values(datosMesa.kit_accesorios) : [];

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