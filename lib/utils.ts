/**
 * Comprueba si un negocio está abierto comparando la hora actual con su horario de apertura/cierre
 * y considerando su switch manual de encendido (is_active).
 */
export function isStoreOpen(
  openingTime?: string | null,
  closingTime?: string | null,
  isActive: boolean = true
): boolean {
  // 1. Apagado manual absoluto
  if (!isActive) return false;

  if (!openingTime || !closingTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper para parsear "HH:MM" o "HH:MM:SS" de Supabase
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

  let isWithinSchedule = false;

  if (openMinutes === closeMinutes) {
    isWithinSchedule = true; // 24 Horas
  } else if (openMinutes < closeMinutes) {
    // Horario diurno normal (ej. 09:00 a 21:00)
    isWithinSchedule = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else {
    // Horario nocturno que cruza medianoche (ej. 20:00 a 02:00)
    isWithinSchedule = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  //  ABIERTO sólo si el switch está activado Y estamos dentro del horario programado
  return isActive && isWithinSchedule;
}