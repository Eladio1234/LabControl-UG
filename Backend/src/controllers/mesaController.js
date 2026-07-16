import { mesaService } from '../services/mesaService.js';
import { supabase } from '../config/supabase.js';

export const mesaController = {
  async obtenerMesas(req, res) {
    try {
      const mesas = await mesaService.obtenerMesas();
      res.status(200).json(mesas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async obtenerMesa(req, res) {
    try {
      const { id } = req.params;

      const mesa = await mesaService.obtenerMesa(id);
      res.status(200).json(mesa);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  async crearMesa(req, res) {
    try {
      const nuevaMesa = await mesaService.agregarMesa(req.body);

      res.status(201).json({
        mensaje: 'Mesa creada con éxito',
        data: nuevaMesa
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async actualizarMesa(req, res) {
    try {
      const { id } = req.params;

      // Actualizar la mesa con los datos recibidos desde el frontend
      const { data, error } = await supabase
        .from('mesas')
        .update(req.body)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      res.status(200).json({
        mensaje: 'Mesa actualizada con éxito',
        data
      });
    } catch (error) {
      console.log(req.body);
      console.error('🔴 Error al actualizar mesa:', error);
      res.status(400).json({ error: error.message });
    }
  }
};