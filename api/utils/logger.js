import winston from 'winston';
import path from 'path'; // Necesitas path para unir las rutas

let currentLogger; // Variable para mantener la instancia del logger

// Función para inicializar y obtener el logger
export const getLogger = (logDirectory, logFileName = 'conversion.log') => {
  // Si ya tenemos un logger configurado para esta ruta, lo retornamos.
  // Esto evita crear múltiples instancias innecesarias.
  if (currentLogger) {
    // Si la ruta o el nombre cambian, podrías necesitar un manejo más sofisticado
    // como cerrar el logger actual y crear uno nuevo.
    // Para este caso, asumimos que se inicializa una sola vez por ejecución.
    return currentLogger;
  }

  const logFilePath = path.join(logDirectory, logFileName); // Une el directorio y el nombre del archivo

  currentLogger = winston.createLogger({
    level: 'info', // Nivel mínimo de log a registrar
    format: winston.format.json(), // Formato de salida JSON
    transports: [
      // Transporte para escribir en consola (útil para desarrollo y Docker)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple() // Formato simple para la consola
        )
      }),
      // Transporte para escribir en archivo
      new winston.transports.File({
        filename: logFilePath, // Usa la ruta dinámica
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true // Para que el archivo más nuevo sea el que se use
      })
    ]
  });

  // Opcional: Manejar errores del logger (por ejemplo, si no puede escribir en el archivo)
  currentLogger.on('error', (err) => {
    console.error('Error en Winston Logger:', err);
  });

  return currentLogger;
};
