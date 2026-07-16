import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import VistaAlumno from './views/VistaAlumno';

// Protege las rutas administrativas verificando la sesión del usuario
const AdminRoute = ({ children }) => {
  const esAdmin = !!localStorage.getItem('token');

  return esAdmin ? children : <Navigate to="/404" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Acceso público mediante QR de mesa */}
        <Route path="/mesa/:id" element={<VistaAlumno />} />

        {/* Acceso administrativo */}
        <Route path="/auth-lab-dicis-0" element={<Login />} />

        <Route
          path="/acceso-lab-dicis-0"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Ruta para direcciones inexistentes */}
        <Route
          path="*"
          element={<h1>404 - Página no encontrada</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;