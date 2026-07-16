import { supabase } from '../config/supabase.js';

export const modeloRepository = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('modelos_equipo')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  },

  async crear(datosModelo) {
    const { data, error } = await supabase
      .from('modelos_equipo')
      .insert([datosModelo])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async actualizar(id, datosActualizados) {
    const { data, error } = await supabase
      .from('modelos_equipo')
      .update(datosActualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async eliminar(id) {
    const { error } = await supabase
      .from('modelos_equipo')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }
};