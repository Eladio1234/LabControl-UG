import { modeloRepository } from '../repositories/modeloRepository.js';

export const modeloService = {
  async obtenerModelos() {
    return await modeloRepository.obtenerTodos();
  },

  async agregarModelo(datos) {
    if (!datos.nombre_modelo || !datos.tipo_equipo) {
      throw new Error(
        'El nombre del modelo y el tipo de equipo son obligatorios'
      );
    }

    const tiposValidos = [
      'osciloscopio',
      'fuente',
      'generador',
      'multimetro'
    ];

    if (!tiposValidos.includes(datos.tipo_equipo)) {
      throw new Error(
        `El tipo de equipo debe ser uno de los siguientes: ${tiposValidos.join(', ')}`
      );
    }

    return await modeloRepository.crear(datos);
  },

  async actualizarModelo(id, datos) {
    // Validar el tipo de equipo si se envía en la actualización
    if (datos.tipo_equipo) {
      const tiposValidos = [
        'osciloscopio',
        'fuente',
        'generador',
        'multimetro'
      ];

      if (!tiposValidos.includes(datos.tipo_equipo)) {
        throw new Error(
          `El tipo de equipo debe ser uno de los siguientes: ${tiposValidos.join(', ')}`
        );
      }
    }

    return await modeloRepository.actualizar(id, datos);
  },

  async eliminarModelo(id) {
    return await modeloRepository.eliminar(id);
  }
};