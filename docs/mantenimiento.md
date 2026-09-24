# Mantenimiento automático de Casa Yaiza

GitHub Actions comprueba cada 30 minutos la portada y el acceso al panel, y puede comprobar Supabase Auth. En cada cambio comprueba tipos y compilación. Cada lunes, la auditoría de dependencias busca vulnerabilidades altas o críticas. También puede ejecutarse desde **GitHub → Actions → Mantenimiento Casa Yaiza → Run workflow**.

## Activación

1. En **GitHub → Settings → Secrets and variables → Actions → Variables**, añadir `CASA_YAIZA_SITE_URL` con la URL de producción de Vercel (si difiere de la predeterminada) y `CASA_YAIZA_SUPABASE_URL` con la URL pública del proyecto Supabase. No incluir claves de servicio.
2. En **GitHub → Settings → Notifications**, habilitar el correo para **Actions workflow runs**. Los fallos aparecerán en Actions y GitHub enviará la notificación según las preferencias de la cuenta.
3. Ejecutar el flujo manualmente una vez para confirmar ambas comprobaciones. GitHub puede retrasar las tareas programadas en períodos de carga.

La comprobación de Supabase verifica la disponibilidad del servicio Auth. No verifica lectura ni escritura de reservas, RLS, la entrega a SES.Hospedajes ni el disparador de Gmail. Revisar esos flujos con una reserva de prueba después de cambios funcionales. No incluir datos reales de huéspedes en ejecuciones, incidencias ni artefactos de GitHub.

## Datos y recuperación

Confirmar en **Supabase → Database → Backups** que el plan tiene copias automáticas y anotar su retención. Si el plan no las incluye, configurar una copia cifrada fuera de GitHub con un destino privado y probar la restauración. Este flujo no descarga ni almacena datos personales.

En caso de caída, abrir la ejecución fallida en GitHub Actions; comprobar el despliegue en Vercel y el estado del proyecto en Supabase. Para volver a una versión anterior, usar el despliegue previo en Vercel o revertir el commit en GitHub. Una reversión del código no revierte migraciones de Supabase; hacer copia y plan de reversión antes de aplicarlas.
