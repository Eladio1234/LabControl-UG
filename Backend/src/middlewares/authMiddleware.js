import { supabase } from '../config/supabase.js';

export const verificarAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Acceso denegado. No se proporcionó un token.'
      });
    }

    const token = authHeader.split(' ')[1];

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Token inválido o sesión expirada.'
      });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles_admin')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(403).json({
        error: 'Perfil de administrador no encontrado.'
      });
    }

    if (perfil.rol !== 'admin' && perfil.rol !== 'super_admin') {
      return res.status(403).json({
        error: 'No tienes permisos suficientes para esta acción.'
      });
    }

    // Guardar el perfil para usarlo en los siguientes middlewares o controladores
    req.admin = perfil;

    next();
  } catch (error) {
    res.status(500).json({
      error: 'Error interno en la autenticación.'
    });
  }
};

// Restringe acciones que requieren permisos de Super Admin
export const verificarSuperAdmin = async (req, res, next) => {
  if (!req.admin || req.admin.rol !== 'super_admin') {
    return res.status(403).json({
      error: 'Acceso denegado: Se requiere privilegios de Super Admin.'
    });
  }

  next();
};