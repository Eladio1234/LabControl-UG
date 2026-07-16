import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import styles from './MiPerfil.module.css';

export default function MiPerfil() {
  const [firmaUrl, setFirmaUrl] = useState('');
  const [archivoFirma, setArchivoFirma] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const adminId = localStorage.getItem('admin_id');
  const token = localStorage.getItem('token');

  // Obtiene la firma digital del administrador desde la base de datos
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const { data, error } = await supabase
          .from('perfiles_admin')
          .select('firma_url')
          .eq('id', adminId)
          .single();
          
        if (data && data.firma_url) {
          setFirmaUrl(data.firma_url);
          localStorage.setItem('firma_url', data.firma_url);
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };
    cargarPerfil();
  }, [adminId]);

  // Maneja la selección de un nuevo archivo de imagen y genera su vista previa local
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoFirma(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Sube el archivo seleccionado a Supabase Storage y actualiza la URL en la base de datos
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!archivoFirma) {
      setMensaje({ texto: 'Por favor selecciona una imagen primero.', tipo: 'error' });
      return;
    }

    setCargando(true);
    setMensaje({ texto: 'Subiendo firma...', tipo: 'info' });

    try {
      const fileExt = archivoFirma.name.split('.').pop();
      const fileName = `firma_${adminId}.${fileExt}`;

      // Sube o sobrescribe el archivo de la firma en el bucket
      const { error: uploadError } = await supabase.storage
        .from('firmas_admin')
        .upload(fileName, archivoFirma, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('firmas_admin')
        .getPublicUrl(fileName);

      // Agrega un timestamp para evitar problemas de caché en el navegador al recargar la imagen
      const timestamp = new Date().getTime();
      const nuevaFirmaUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;

      const respuesta = await fetch(`http://localhost:3000/api/admins/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firma_url: nuevaFirmaUrl })
      });

      if (!respuesta.ok) throw new Error('Error al guardar la URL en la base de datos');

      setFirmaUrl(nuevaFirmaUrl);
      setPreviewUrl('');
      setArchivoFirma(null);
      
      localStorage.setItem('firma_url', nuevaFirmaUrl);
      setMensaje({ texto: '✅ Firma actualizada con éxito', tipo: 'exito' });
    } catch (error) {
      setMensaje({ texto: `❌ Error: ${error.message}`, tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Mi Perfil</h2>

      <div className={styles.card}>
        <h3 className={styles.subtitle}>Firma Digital</h3>
        <p className={styles.description}>
          Sube una imagen de tu firma (preferentemente en formato PNG con fondo transparente). Esta se utilizará automáticamente en los reportes de salida del laboratorio.
        </p>

        {mensaje.texto && (
          <div className={`${styles.alert} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        {firmaUrl && !previewUrl && (
          <div className={styles.previewBox}>
            <span>Firma actual:</span>
            <img src={firmaUrl} alt="Firma actual" />
          </div>
        )}

        {previewUrl && (
          <div className={styles.previewBoxNew}>
            <span>Vista previa de nueva firma:</span>
            <img src={previewUrl} alt="Preview" />
          </div>
        )}

        <form onSubmit={handleUpload} className={styles.form}>
          <input 
            type="file" 
            accept="image/png, image/jpeg" 
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <button 
            type="submit" 
            disabled={cargando || !archivoFirma}
            className={styles.btnSubmit}
          >
            {cargando ? 'Subiendo...' : 'Guardar Firma'}
          </button>
        </form>
      </div>
    </div>
  );
}