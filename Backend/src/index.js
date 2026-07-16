import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mesaRoutes from './routes/mesaRoutes.js';
import modeloRoutes from './routes/modeloRoutes.js';
import sesionRoutes from './routes/sesionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { iniciarLimpiezaAutomatica } from './services/cronService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Servidor de LabControl UG funcionando correctamente');
});

// Registro de rutas de la API
app.use('/api/mesas', mesaRoutes);
app.use('/api/modelos', modeloRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/admins', adminRoutes);

iniciarLimpiezaAutomatica();

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});