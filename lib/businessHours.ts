// lib/businessHours.ts

/**
 * Determina si un local está abierto basado en su horario.
 * @param openTime - Hora de apertura en formato "HH:MM" (ej. "09:00")
 * @param closeTime - Hora de cierre en formato "HH:MM" (ej. "21:00")
 * @param timezone - Zona horaria del local (ej. "America/Mexico_City")
 * @returns { isOpen: boolean, status: string }
 */
export function getBusinessStatus(
  openTime: string,
  closeTime: string,
  timezone: string = "America/Mexico_City"
): { isOpen: boolean; status: string } {
  // 1. Obtener la hora actual en la zona horaria del local
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat("es-MX", options);
  const currentTimeStr = formatter.format(now);
  const [currentHour, currentMinute] = currentTimeStr.split(":").map(Number);

  // 2. Parsear el horario de apertura y cierre
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);

  // 3. Convertir todo a minutos para facilitar la comparación
  const currentMinutes = currentHour * 60 + currentMinute;
  const openMinutes = openHour * 60 + openMinute;
  let closeMinutes = closeHour * 60 + closeMinute;

  // 4. Manejar horarios que cruzan la medianoche (ej. 22:00 - 02:00)
  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60; // Añadir 24 horas al cierre
  }

  // 5. Comparar si la hora actual está dentro del rango
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  // 6. Generar un estado legible
  const status = isOpen ? "Abierto" : "Cerrado";

  return { isOpen, status };
}