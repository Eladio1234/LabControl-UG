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

  async obtenerPorEstado(estado, page, limit, mesaId, semestre, fecha) {
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

    if (mesaId) {
      let idFormateado = mesaId.toString().trim().toUpperCase();
      if (!idFormateado.startsWith('MESA-')) {
        const num = idFormateado.replace(/\D/g, '');
        if (num) idFormateado = `MESA-${num.padStart(2, '0')}`;
      }
      query = query.eq('mesa_id', idFormateado);
    }

    // Clasificación por semestre (ej. "ENERO - JUNIO 2027" o "AGOSTO - DICIEMBRE 2026")
    if (semestre) {
      const match = semestre.toString().toUpperCase().match(/(ENERO\s*-\s*JUNIO|AGOSTO\s*-\s*DICIEMBRE)\s+(\d{4})/);
      if (match) {
        const periodo = match[1];
        const anio = parseInt(match[2], 10);
        if (periodo.includes('ENERO')) {
          query = query
            .gte('created_at', `${anio}-01-01T00:00:00.000Z`)
            .lte('created_at', `${anio}-06-30T23:59:59.999Z`);
        } else {
          query = query
            .gte('created_at', `${anio}-07-01T00:00:00.000Z`)
            .lte('created_at', `${anio}-12-31T23:59:59.999Z`);
        }
      }
    }

    // Filtro opcional por día específico (YYYY-MM-DD)
    if (fecha) {
      query = query
        .gte('created_at', `${fecha}T00:00:00.000Z`)
        .lte('created_at', `${fecha}T23:59:59.999Z`);
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