import { supabase } from '../config/supabase.js';

// Calcula el corte de revisión (15 min antes del fin de cada bloque de 2h entre 08:00 y 18:00: 09:45, 11:45, 13:45, 15:45, 17:45)
export const obtenerCorteBloqueClase = (fechaInicio) => {
  const inicio = new Date(fechaInicio);
  const h = inicio.getHours();
  if (h < 8 || h >= 18) return null;
  const finBloqueHora = h % 2 === 0 ? h + 2 : h + 1;
  const corte = new Date(inicio);
  corte.setHours(finBloqueHora - 1, 45, 0, 0);
  return corte;
};

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

export const iniciarLimpiezaAutomatica = () => {
  // Ejecutar la revisión cada 15 segundos para mayor precisión en los cortes de clase (:45)
  setInterval(async () => {
    try {
      const ahoraDate = new Date();
      const ahora = ahoraDate.toISOString();

      // 1. Limpiar peticiones en espera que expiraron
      const { data: expiradas, error: selectError } = await supabase
        .from('sesiones_laboratorio')
        .select('id, mesa_id')
        .eq('estado_sesion', 'solicitada')
        .lt('expira_en', ahora);

      if (selectError) {
        throw selectError;
      }

      if (expiradas && expiradas.length > 0) {
        for (const sesion of expiradas) {
          await supabase
            .from('sesiones_laboratorio')
            .update({ estado_sesion: 'cancelada' })
            .eq('id', sesion.id);

          await supabase
            .from('mesas')
            .update({ estado_actual: 'disponible' })
            .eq('id', sesion.mesa_id);

          console.log(
            `⏱️ Petición expirada cancelada. Mesa ${sesion.mesa_id} liberada.`
          );
        }
      }

      // 2. Pasar automáticamente a revisión ('finalizada_alumno') las sesiones activas cuyo bloque de 2h llegó a los 15 min previos (:45)
      const { data: activas, error: activasErr } = await supabase
        .from('sesiones_laboratorio')
        .select('id, mesa_id, created_at, hora_entrada')
        .eq('estado_sesion', 'activa');

      if (!activasErr && activas && activas.length > 0) {
        const { data: mesas } = await supabase
          .from('mesas')
          .select('id, kit_accesorios');
        const mapaMesas = new Map((mesas || []).map((m) => [m.id, m]));

        for (const sesion of activas) {
          const mesa = mapaMesas.get(sesion.mesa_id);
          if (!mesaUsaTimer(mesa?.kit_accesorios)) continue;

          const baseTiempo = sesion.hora_entrada || sesion.created_at;
          const corte = obtenerCorteBloqueClase(baseTiempo);

          if (corte && ahoraDate >= corte) {
            await supabase
              .from('sesiones_laboratorio')
              .update({ estado_sesion: 'finalizada_alumno' })
              .eq('id', sesion.id);

            console.log(
              `🔔 Corte de clase alcanzado (${corte.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}). Mesa ${sesion.mesa_id} pasó a modo revisión.`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        'Error en el proceso de limpieza automática:',
        error.message
      );
    }
  }, 15000);
};
