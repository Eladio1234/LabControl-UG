import { adminService } from '../services/adminService.js';

export const adminController = {
  async obtenerAdmins(req, res) {
    try {
      const admins = await adminService.listarAdmins();
      res.status(200).json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async crearAdmin(req, res) {
    try {
      const nuevoAdmin = await adminService.registrarAdmin(req.body);
      res.status(201).json({ mensaje: 'Perfil de administrador creado', data: nuevoAdmin });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async actualizarAdmin(req, res) {
    try {
      const { id } = req.params;
      const adminActualizado = await adminService.editarAdmin(id, req.body);
      res.status(200).json({ mensaje: 'Perfil actualizado correctamente', data: adminActualizado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async eliminarAdmin(req, res) {
    try {
      const { id } = req.params;
      await adminService.eliminarAdmin(id);
      res.status(200).json({ mensaje: 'Administrador eliminado correctamente' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};