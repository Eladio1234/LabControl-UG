import { supabase } from '../config/supabase.js';

export const iniciarLimpiezaAutomatica = () => {
  // Ejecutar la limpieza cada minuto
  setInterval(async () => {
    try {
      const ahora = new Date().toISOString();

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
          // Cancelar la sesión y liberar la mesa
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
    } catch (error) {
      console.error(
        'Error en el proceso de limpieza automática:',
        error.message
      );
    }
  }, 60000);
};