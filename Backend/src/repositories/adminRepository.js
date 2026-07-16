import { supabase } from '../config/supabase.js';

export const adminRepository = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('perfiles_admin')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('perfiles_admin')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async crear(datos) {
    const { data, error } = await supabase
      .from('perfiles_admin')
      .insert([datos])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async actualizar(id, datos) {
    const { data, error } = await supabase
      .from('perfiles_admin')
      .update(datos)
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
      .from('perfiles_admin')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }
};