import { mesaRepository } from '../repositories/mesaRepository.js';

// Kit de accesorios asignado por defecto a cada mesa (basado en formato oficial DICIS)
const KIT_POR_DEFECTO = {
  desarmadores: {
    nombre: 'DESARMADORES (CRUZ Y PLANO)',
    cantidad_ideal: 2,
    cantidad_actual: 2,
    estado: 'ok',
    notas: ''
  },
  pinzas: {
    nombre: 'PINZAS (CORTE Y PUNTA)',
    cantidad_ideal: 2,
    cantidad_actual: 2,
    estado: 'ok',
    notas: ''
  },
  plantilla: {
    nombre: 'PLANTILLA',
    cantidad_ideal: 1,
    cantidad_actual: 1,
    estado: 'ok',
    notas: ''
  },
  caimanes: {
    nombre: 'CAIMANES',
    cantidad_ideal: 4,
    cantidad_actual: 4,
    estado: 'ok',
    notas: ''
  },
  puntas_osciloscopio: {
    nombre: 'PUNTAS DE OSCILOSCOPIO',
    cantidad_ideal: 2,
    cantidad_actual: 2,
    estado: 'ok',
    notas: ''
  },
  punta_generador: {
    nombre: 'PUNTA DE GENERADOR',
    cantidad_ideal: 1,
    cantidad_actual: 1,
    estado: 'ok',
    notas: ''
  },
  puntas_fuente_multimetro: {
    nombre: 'PUNTAS FUENTE O MULTÍMETRO',
    cantidad_ideal: 4,
    cantidad_actual: 4,
    estado: 'ok',
    notas: ''
  }
};

export const mesaService = {
  async obtenerMesas() {
    return await mesaRepository.obtenerTodas();
  },

  async obtenerMesa(id) {
    if (!id) {
      throw new Error('El ID de la mesa es obligatorio');
    }

    const mesa = await mesaRepository.obtenerPorId(id);

    if (!mesa) {
      throw new Error('No se encontró la mesa solicitada');
    }

    return mesa;
  },

  async agregarMesa(datos) {
    if (!datos.id || !datos.numero_mesa) {
      throw new Error('El ID del QR y el número de mesa son obligatorios');
    }

    // Asignar el kit por defecto si no se proporciona uno
    const datosFinales = {
      ...datos,
      kit_accesorios: datos.kit_accesorios || KIT_POR_DEFECTO
    };

    return await mesaRepository.crear(datosFinales);
  },

  async editarMesa(id, datos) {
    if (!id) {
      throw new Error('Se requiere el ID de la mesa para editar');
    }

    const existe = await mesaRepository.obtenerPorId(id);

    if (!existe) {
      throw new Error('La mesa que intentas editar no existe');
    }

    return await mesaRepository.actualizar(id, datos);
  }
};