import { sesionService } from '../services/sesionService.js';
import { supabase } from '../config/supabase.js';

export const sesionController = {
  async solicitar(req, res) {
    try {
      const sesion = await sesionService.solicitarMesa(req.body);

      res.status(201).json({
        mensaje: 'Petición enviada al administrador',
        data: sesion
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async aprobar(req, res) {
    try {
      const sesion = await sesionService.aprobarSesion(req.params.id);

      res.status(200).json({
        mensaje: 'Sesión aprobada, mesa ocupada',
        data: sesion
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Registra la información inicial de la sesión y del equipo utilizado
  async registrarEntrada(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre_profesor,
        materia,
        osc1,
        osc2,
        mult1,
        mult2,
        nip
      } = req.body;

      const { data, error } = await supabase
        .from('sesiones_laboratorio')
        .update({
          nombre_profesor,
          materia,
          nip,
          estado_sesion: 'activa',
          osc1_entrada: osc1,
          osc2_entrada: osc2,
          mult1_entrada: mult1,
          mult2_entrada: mult2
        })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      res.status(200).json({
        mensaje: 'Entrada registrada',
        data
      });
    } catch (error) {
      console.error('🔴 Error en registrarEntrada:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async liberar(req, res) {
    try {
      const { nota_alumno } = req.body;

      const sesion = await sesionService.solicitarLiberacion(
        req.params.id,
        nota_alumno
      );

      res.status(200).json({
        mensaje: 'Mesa liberada por el alumno',
        data: sesion
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Cierra la sesión y libera la mesa asociada
  async finalizar(req, res) {
    try {
      const { id } = req.params;
      const {
        osc1,
        osc2,
        mult1,
        mult2,
        nota_admin,
        admin_id
      } = req.body;

      const horaActual = new Date().toISOString();

      const { data: sesionData, error: sesionError } = await supabase
        .from('sesiones_laboratorio')
        .update({
          estado_sesion: 'cerrada',
          admin_id,
          nota_admin: nota_admin || null,
          hora_salida: horaActual,
          osc1_salida: osc1,
          osc2_salida: osc2,
          mult1_salida: mult1,
          mult2_salida: mult2
        })
        .eq('id', id)
        .select();

      if (sesionError) {
        throw sesionError;
      }

      if (sesionData && sesionData.length > 0) {
        const idDeLaMesa = sesionData[0].mesa_id;

        await supabase
          .from('mesas')
          .update({ estado_actual: 'disponible' })
          .eq('id', idDeLaMesa);
      }

      res.status(200).json({
        mensaje: 'Sesión forzada a cierre y mesa liberada',
        data: sesionData
      });
    } catch (error) {
      console.error('Error al forzar el cierre:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerUna(req, res) {
    try {
      const sesion = await sesionService.obtenerSesion(req.params.id);

      res.status(200).json(sesion);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async obtenerSesiones(req, res) {
    try {
      const { estado, page, limit } = req.query;
      const pageNum = page ? parseInt(page) : undefined;
      const limitNum = limit ? parseInt(limit) : undefined;
      const resultado = await sesionService.obtenerSesiones(estado, pageNum, limitNum);

      if (pageNum && limitNum) {
        res.status(200).json({
          registros: resultado.data,
          totalRegistros: resultado.count,
          paginaActual: pageNum,
          totalPaginas: Math.ceil(resultado.count / limitNum)
        });
      } else {
        res.status(200).json(resultado.data);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Devuelve la sesión activa asociada a una mesa, si existe
  async obtenerActivaPorMesa(req, res) {
    try {
      const { mesa_id } = req.params;

      const { data, error } = await supabase
        .from('sesiones_laboratorio')
        .select('*')
        .eq('mesa_id', mesa_id)
        .in('estado_sesion', ['esperando_admin', 'activa', 'en_uso'])
        .maybeSingle();

      if (error) {
        throw error;
      }

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};