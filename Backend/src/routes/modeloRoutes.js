import { Router } from 'express';
import { modeloController } from '../controllers/modeloController.js';
import { verificarAdmin, verificarSuperAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', modeloController.obtenerModelos);

router.post(
  '/',
  verificarAdmin,
  verificarSuperAdmin,
  modeloController.crearModelo
);

router.put(
  '/:id',
  verificarAdmin,
  verificarSuperAdmin,
  modeloController.actualizarModelo
);

router.delete(
  '/:id',
  verificarAdmin,
  verificarSuperAdmin,
  modeloController.eliminarModelo
);

export default router;