import { sesionRepository } from '../repositories/sesionRepository.js';
import { mesaRepository } from '../repositories/mesaRepository.js';

export const sesionService = {
  async solicitarMesa(datos) {
    const mesa = await mesaRepository.obtenerPorId(datos.mesa_id);

    if (mesa.estado_actual !== 'disponible') {
      throw new Error(
        'La mesa actualmente no está disponible o ya fue solicitada.'
      );
    }

    // Marcar la mesa como solicitada y registrar la expiración de la petición
    await mesaRepository.actualizar(datos.mesa_id, {
      estado_actual: 'en_peticion'
    });

    const limiteTiempo = new Date();
    limiteTiempo.setMinutes(limiteTiempo.getMinutes() + 5);

    return await sesionRepository.crear({
      mesa_id: datos.mesa_id,
      nombre_alumno: datos.nombre_alumno,
      estado_sesion: 'solicitada',
      expira_en: limiteTiempo.toISOString()
    });
  },

  async limpiarExpiradas() {
    const expiradas = await sesionRepository.obtenerExpiradas();

    for (const sesion of expiradas) {
      // Cancelar la sesión y liberar la mesa
      await sesionRepository.actualizar(sesion.id, {
        estado_sesion: 'expirada'
      });

      await mesaRepository.actualizar(sesion.mesa_id, {
        estado_actual: 'disponible'
      });
    }
  },

  async obtenerSesiones(estado, page, limit) {
    await sesionService.limpiarExpiradas();
    return await sesionRepository.obtenerPorEstado(estado, page, limit);
  },

  async obtenerSesion(idSesion) {
    return await sesionRepository.obtenerPorId(idSesion);
  },

  async aprobarSesion(idSesion) {
    const sesion = await sesionRepository.obtenerPorId(idSesion);

    // Activar la sesión y marcar la mesa como ocupada
    await mesaRepository.actualizar(sesion.mesa_id, {
      estado_actual: 'ocupada'
    });

    return await sesionRepository.actualizar(idSesion, {
      estado_sesion: 'activa'
    });
  },

  async registrarEntradaAlumno(idSesion, datosFormulario) {
    return await sesionRepository.actualizar(idSesion, {
      nombre_profesor: datosFormulario.nombre_profesor,
      materia: datosFormulario.materia,
      hora_entrada: new Date().toISOString(),
      osc1_entrada: datosFormulario.osc1,
      osc2_entrada: datosFormulario.osc2,
      mult1_entrada: datosFormulario.mult1,
      mult2_entrada: datosFormulario.mult2
    });
  },

  async solicitarLiberacion(idSesion, nota_alumno = null) {
    const sesion = await sesionRepository.obtenerPorId(idSesion);

    if (!sesion || sesion.estado_sesion !== 'activa') {
      throw new Error('La sesión no está activa o no existe');
    }

    return await sesionRepository.actualizar(idSesion, {
      estado_sesion: 'finalizada_alumno',
      nota_alumno: nota_alumno
    });
  },

  async cerrarSesion(idSesion, datosSalida) {
    const sesion = await sesionRepository.obtenerPorId(idSesion);

    if (!sesion || sesion.estado_sesion !== 'finalizada_alumno') {
      throw new Error('La sesión no está lista para ser cerrada');
    }

    // Liberar la mesa y registrar la información de salida
    await mesaRepository.actualizar(sesion.mesa_id, {
      estado_actual: 'disponible'
    });

    return await sesionRepository.actualizar(idSesion, {
      estado_sesion: 'cerrada',
      hora_salida: new Date().toISOString(),
      osc1_salida: datosSalida.osc1,
      osc2_salida: datosSalida.osc2,
      mult1_salida: datosSalida.mult1,
      mult2_salida: datosSalida.mult2,
      nota_admin: datosSalida.nota_admin,
      admin_id: datosSalida.admin_id
    });
  }
};