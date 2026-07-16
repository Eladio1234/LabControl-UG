import { Router } from 'express';
import { sesionController } from '../controllers/sesionController.js';
import { verificarAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas de alumno
// Las rutas específicas deben ir antes de las rutas con parámetros dinámicos
router.post('/solicitar', sesionController.solicitar);

router.get(
  '/activa/:mesa_id',
  sesionController.obtenerActivaPorMesa
);

router.put(
  '/:id/entrada',
  sesionController.registrarEntrada
);

router.put(
  '/:id/liberar',
  sesionController.liberar
);

// Debe mantenerse después de las rutas específicas para evitar conflictos con /:id
router.get('/:id', sesionController.obtenerUna);

// Rutas de administrador
router.put(
  '/:id/aprobar',
  verificarAdmin,
  sesionController.aprobar
);

router.put(
  '/:id/finalizar',
  verificarAdmin,
  sesionController.finalizar
);

router.get(
  '/',
  verificarAdmin,
  sesionController.obtenerSesiones
);

export default router;