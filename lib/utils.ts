/**
 * Comprueba si la hora actual cae dentro del rango de horario del local.
 * Soporta formatos de Supabase "HH:MM" o "HH:MM:SS" y horarios nocturnos que cruzan medianoche.
 */
export function isStoreOpen(
  openingTime?: string | null,
  closingTime?: string | null
): boolean {
  if (!openingTime || !closingTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper para parsear "HH:MM" o "HH:MM:SS"
  const parseTimeToMinutes = (timeStr: string): number | null => {
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };

  const openMinutes = parseTimeToMinutes(openingTime);
  const closeMinutes = parseTimeToMinutes(closingTime);

  if (openMinutes === null || closeMinutes === null) return false;

  if (openMinutes === closeMinutes) {
    return true; // 24 Horas
  }

  if (openMinutes < closeMinutes) {
    // Horario diurno (ej. 09:00 a 21:00)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Horario nocturno que cruza medianoche (ej. 20:00 a 02:00)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
}