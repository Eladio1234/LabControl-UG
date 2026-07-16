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

  async obtenerPorEstado(estado) {
    let query = supabase
      .from('sesiones_laboratorio')
      .select(`
        *,
        perfiles_admin ( firma_url )
      `)
      .order('created_at', { ascending: false });

    if (estado) {
      query = query.eq('estado_sesion', estado);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
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