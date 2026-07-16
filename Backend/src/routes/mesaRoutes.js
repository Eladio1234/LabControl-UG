import { Router } from 'express';
import { mesaController } from '../controllers/mesaController.js';
import { verificarAdmin, verificarSuperAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', mesaController.obtenerMesas);

router.get('/:id', mesaController.obtenerMesa);

// Rutas que requieren permisos de administrador
router.post('/', verificarAdmin, mesaController.crearMesa);

router.put('/:id', verificarAdmin, mesaController.actualizarMesa);

export default router;