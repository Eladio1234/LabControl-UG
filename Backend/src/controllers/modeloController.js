import { modeloService } from '../services/modeloService.js';

export const modeloController = {
  async obtenerModelos(req, res) {
    try {
      const modelos = await modeloService.obtenerModelos();
      res.status(200).json(modelos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async crearModelo(req, res) {
    try {
      const nuevoModelo = await modeloService.agregarModelo(req.body);

      res.status(201).json({
        mensaje: 'Modelo registrado con éxito',
        data: nuevoModelo
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Permite modificar la información de un modelo existente
  async actualizarModelo(req, res) {
    try {
      const { id } = req.params;

      const modeloActualizado = await modeloService.actualizarModelo(
        id,
        req.body
      );

      res.status(200).json({
        mensaje: 'Modelo actualizado',
        data: modeloActualizado
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Elimina el modelo seleccionado
  async eliminarModelo(req, res) {
    try {
      const { id } = req.params;

      await modeloService.eliminarModelo(id);

      res.status(200).json({
        mensaje: 'Modelo eliminado correctamente'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};