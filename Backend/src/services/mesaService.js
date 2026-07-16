import { mesaRepository } from '../repositories/mesaRepository.js';

// Kit de accesorios asignado por defecto a cada mesa
const KIT_POR_DEFECTO = {
  protoboard: {
    nombre: 'Protoboard',
    cantidad_ideal: 1,
    cantidad_actual: 1,
    estado: 'ok',
    notas: ''
  },
  pinzas_punta: {
    nombre: 'Pinzas de punta',
    cantidad_ideal: 1,
    cantidad_actual: 1,
    estado: 'ok',
    notas: ''
  },
  tabla_madera: {
    nombre: 'Tabla de madera (20x30cm)',
    cantidad_ideal: 1,
    cantidad_actual: 1,
    estado: 'ok',
    notas: ''
  },
  puntas_multimetro: {
    nombre: 'Pares de puntas para multímetro',
    cantidad_ideal: 2,
    cantidad_actual: 2,
    estado: 'ok',
    notas: ''
  },
  cables_generador: {
    nombre: 'Cables para generador de funciones',
    cantidad_ideal: 1,
    cantidad_actual: 1,
    estado: 'ok',
    notas: ''
  },
  cables_fuente: {
    nombre: 'Pares de cables para fuente',
    cantidad_ideal: 2,
    cantidad_actual: 2,
    estado: 'ok',
    notas: ''
  },
  caimanes: {
    nombre: 'Caimanes',
    cantidad_ideal: 3,
    cantidad_actual: 3,
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