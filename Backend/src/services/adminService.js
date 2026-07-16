import { supabase, supabaseAdmin } from '../config/supabase.js';
import { adminRepository } from '../repositories/adminRepository.js';

export const adminService = {
  async listarAdmins() {
    return await adminRepository.obtenerTodos();
  },

  async registrarAdmin(datos) {
    if (!datos.email || !datos.password || !datos.nombre_completo) {
      throw new Error('Email, password y nombre completo son obligatorios');
    }

    // Crear el usuario en Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: datos.email,
        password: datos.password,
        email_confirm: true
      });

    if (authError) {
      throw new Error(`Error de Autenticación: ${authError.message}`);
    }

    const nuevoId = authData.user.id;

    // Registrar el perfil del administrador
    return await adminRepository.crear({
      id: nuevoId,
      nombre_completo: datos.nombre_completo,
      rol: datos.rol || 'admin'
    });
  },

  async editarAdmin(id, datos) {
    if (!id) {
      throw new Error('Se requiere el ID del administrador');
    }

    return await adminRepository.actualizar(id, datos);
  },

  async eliminarAdmin(id) {
    if (!id) {
      throw new Error('Se requiere el ID del administrador');
    }

    try {
      // Eliminar primero el perfil y después el usuario de Auth
      await adminRepository.eliminar(id);

      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(id);

      if (authError) {
        throw new Error(`Error de Auth: ${authError.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }
};