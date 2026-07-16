import { supabase } from '../config/supabase.js';

export const sesionRepository = {
  async crear(datosSesion) {
    const { data, error } = await supabase
      .from('sesiones_laboratorio')
      .insert([datosSesion])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('sesiones_laboratorio')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async actualizar(id, datosActualizados) {
    const { data, error } = await supabase
      .from('sesiones_laboratorio')
      .update(datosActualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async obtenerPorEstado(estado, page, limit) {
    let query = supabase
      .from('sesiones_laboratorio')
      .select(`
        *,
        perfiles_admin ( firma_url )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (estado) {
      query = query.eq('estado_sesion', estado);
    }

    // Si recibimos los parámetros de paginación, aplicamos el rango
    if (page && limit) {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }
    
    return { data, count };
  },

  async obtenerExpiradas() {
    const { data, error } = await supabase
      .from('sesiones_laboratorio')
      .select('*')
      .eq('estado_sesion', 'solicitada')
      .lt('expira_en', new Date().toISOString());

    if (error) {
      throw error;
    }

    return data || [];
  }
};