import { supabase } from '../config/supabase.js';

export const mesaRepository = {
  async obtenerTodas() {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        id,
        numero_mesa,
        estado_actual,
        kit_accesorios,
        notas_mantenimiento,
        osciloscopio_id,
        generador_id,
        fuente_id,
        multimetro1_id,
        multimetro2_id,
        osciloscopio:modelos_equipo!osciloscopio_id (
          id,
          nombre_modelo,
          marca,
          imagen_url
        ),
        generador:modelos_equipo!generador_id (
          id,
          nombre_modelo,
          marca,
          imagen_url
        ),
        fuente:modelos_equipo!fuente_id (
          id,
          nombre_modelo,
          marca,
          imagen_url
        ),
        multimetro1:modelos_equipo!multimetro1_id (
          id,
          nombre_modelo,
          marca,
          imagen_url
        ),
        multimetro2:modelos_equipo!multimetro2_id (
          id,
          nombre_modelo,
          marca,
          imagen_url
        )
      `);

    if (error) {
      throw error;
    }

    return data;
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('mesas')
      .select(`
        *,
        osciloscopio:modelos_equipo!osciloscopio_id(*),
        multimetro1:modelos_equipo!multimetro1_id(*),
        multimetro2:modelos_equipo!multimetro2_id(*),
        fuente:modelos_equipo!fuente_id(*),
        generador:modelos_equipo!generador_id(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`La mesa con ID ${id} no existe en el inventario.`);
    }

    return data;
  },

  async crear(datosMesa) {
    const { data, error } = await supabase
      .from('mesas')
      .insert([datosMesa])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async actualizar(id, datosActualizados) {
    const { data, error } = await supabase
      .from('mesas')
      .update(datosActualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
};