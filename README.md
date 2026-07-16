# LabControl UG - Sistema de Gestión de Laboratorios

## Descripción del Proyecto

LabControl UG es un sistema Fullstack diseñado para automatizar y auditar el préstamo de equipo, el monitoreo de espacios y la generación de bitácoras en los laboratorios de ingeniería de la División de Ingenierías (DICIS) de la Universidad de Guanajuato. 

El sistema centraliza la gestión del inventario físico, validando el estado del hardware (osciloscopios, multímetros, generadores) mediante mecanismos de seguridad y garantizando la trazabilidad de su uso en tiempo real.

## Características Principales

* **Monitoreo en Tiempo Real:** Dashboard administrativo para visualizar el estado de las mesas (Disponibles, Ocupadas, En Revisión) basado en arquitectura de polling.
* **Validación de Hardware Integrada:** Sistema de checklist obligatorio para reportar el estado de los equipos al inicio y término de cada sesión práctica.
* **Seguridad y Control de Acceso:** Generación dinámica de NIPs de sesión para bloquear la interfaz de la mesa, evitando manipulaciones por usuarios no autorizados.
* **Generación Dinámica de Códigos QR:** Creación de identificadores físicos escaneables para la asignación rápida de espacios.
* **Automatización de Bitácoras:** Exportación de reportes tabulares estructurados, integrando firmas digitales del personal administrativo en turno.
* **Gestión de Roles:** Sistema de autenticación con jerarquía de permisos para Administradores y Super Administradores.

## Tecnologías Utilizadas

**Frontend:**
* React (Vite)
* React Router DOM
* CSS Modules
* QRCode.react

**Backend & Base de Datos:**
* Node.js con Express
* Supabase (PostgreSQL)
* Supabase Storage (Manejo de almacenamiento en la nube)

## Arquitectura del Sistema

El proyecto emplea una estructura lógica dividida en dos capas principales:

* `/frontend`: Aplicación web responsiva, optimizada tanto para dispositivos móviles (vista de alumnos) como para entornos de escritorio (panel administrativo).
* `/backend`: API RESTful estructurada bajo el patrón de diseño Controlador-Servicio-Repositorio para garantizar la escalabilidad y una comunicación segura con la base de datos relacional.

## Instalación y Configuración Local

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/TU_USUARIO/labcontrol-ug.git](https://github.com/TU_USUARIO/labcontrol-ug.git)