import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { verificarAdmin, verificarSuperAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', adminController.obtenerAdmins);

router.post(
  '/',
  verificarAdmin,
  verificarSuperAdmin,
  adminController.crearAdmin
);

router.put(
  '/:id',
  verificarAdmin,
  verificarSuperAdmin,
  adminController.actualizarAdmin
);

router.delete(
  '/:id',
  verificarAdmin,
  verificarSuperAdmin,
  adminController.eliminarAdmin
);

export default router;