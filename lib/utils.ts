/**
 * Comprueba si un negocio está abierto comparando la hora actual con su horario de apertura y cierre.
 * Soporta horarios normales (ej. 09:00 a 21:00) y nocturnos que cruzan medianoche (ej. 19:00 a 02:00).
 */
export function isStoreOpen(openingTime: string, closingTime: string): boolean {
  if (!openingTime || !closingTime) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes === closeMinutes) {
    // Si abre y cierra a la misma hora, asumimos 24 hrs abierto
    return true;
  }

  if (openMinutes < closeMinutes) {
    // Horario normal dentro del mismo día (ej. 09:00 - 21:00)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Horario nocturno que cruza medianoche (ej. 20:00 - 02:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}