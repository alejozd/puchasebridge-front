/**
 * Logger centralizado para la aplicación
 * 
 * Características:
 * - Detección automática de entorno (DEV/PROD) usando import.meta.env.DEV
 * - Niveles de log: debug, info, warn, error
 * - Desarrollo: muestra todos los niveles
 * - Producción: muestra SOLO warn y error
 * - Formato consistente con timestamp, nivel y módulo
 * - Soporte para objetos y errores (incluye name, message, stack)
 * 
 * @example
 * logger.debug("Mensaje debug", "MiModulo");
 * logger.info("Información general");
 * logger.warn("Advertencia importante");
 * logger.error(new Error("Algo salió mal"));
 * 
 * @example
 * // Helpers para conveniencia
 * import { debugLog, logApiCall, logStore } from '@/utils/logger';
 * logApiCall('GET', '/api/users');
 * logStore('SET_USER', { id: 1 });
 */

class Logger {
  private static instance: Logger;
  private isDev: boolean;

  private constructor() {
    // Detección automática de entorno usando Vite
    this.isDev = import.meta.env.DEV;
  }

  /**
   * Obtiene la instancia singleton del Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Genera un timestamp formateado [HH:MM:SS.mmm]
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
  }

  /**
   * Formatea el mensaje para incluir metadata adicional
   * Si es un Error, extrae name, message y stack
   */
  private formatMessage(
    message: unknown,
    module?: string
  ): { formatted: string; extraData?: unknown } {
    if (message instanceof Error) {
      const errorInfo = {
        name: message.name,
        message: message.message,
        stack: message.stack,
      };
      const modulePrefix = module ? `[${module}] ` : '';
      return {
        formatted: `${modulePrefix}${message.name}: ${message.message}`,
        extraData: errorInfo,
      };
    }

    const modulePrefix = module ? `[${module}] ` : '';
    
    if (typeof message === 'string') {
      return { formatted: `${modulePrefix}${message}` };
    }

    // Para objetos u otros tipos, los dejamos como datos adicionales
    return {
      formatted: `${modulePrefix}${typeof message}`,
      extraData: message,
    };
  }

  /**
   * Imprime el log con formato consistente
   */
  private print(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    message: unknown,
    module?: string,
    ...args: unknown[]
  ): void {
    const { formatted, extraData } = this.formatMessage(message, module);
    const logPrefix = `${this.getTimestamp()} [${level}]`;
    
    const consoleMethod = level.toLowerCase() as keyof Console;
    
    if (extraData !== undefined) {
      (console[consoleMethod] as (...args: unknown[]) => void)(logPrefix, formatted, extraData, ...args);
    } else {
      (console[consoleMethod] as (...args: unknown[]) => void)(logPrefix, formatted, ...args);
    }
  }

  /**
   * Log de nivel DEBUG - Solo en desarrollo
   * @param message - Mensaje o dato a loguear
   * @param module - Nombre opcional del módulo/contexto
   */
  public debug(message: unknown, module?: string, ...args: unknown[]): void {
    if (this.isDev) {
      this.print('DEBUG', message, module, ...args);
    }
  }

  /**
   * Log de nivel INFO - Solo en desarrollo
   * @param message - Mensaje o dato a loguear
   * @param module - Nombre opcional del módulo/contexto
   */
  public info(message: unknown, module?: string, ...args: unknown[]): void {
    if (this.isDev) {
      this.print('INFO', message, module, ...args);
    }
  }

  /**
   * Log de nivel WARN - Siempre visible (dev y prod)
   * @param message - Mensaje o dato a loguear
   * @param module - Nombre opcional del módulo/contexto
   */
  public warn(message: unknown, module?: string, ...args: unknown[]): void {
    this.print('WARN', message, module, ...args);
  }

  /**
   * Log de nivel ERROR - Siempre visible (dev y prod)
   * @param message - Mensaje, Error o dato a loguear
   * @param module - Nombre opcional del módulo/contexto
   */
  public error(message: unknown, module?: string, ...args: unknown[]): void {
    this.print('ERROR', message, module, ...args);
  }

  /**
   * Log especializado para llamadas API
   * Muestra método, URL y payload opcional
   * @param method - Método HTTP (GET, POST, PUT, DELETE, etc.)
   * @param url - URL de la petición
   * @param payload - Datos opcionales enviados/recibidos
   */
  public apiCall(method: string, url: string, payload?: unknown): void {
    const message = `[API CALL] ${method} ${url}`;
    if (this.isDev) {
      if (payload !== undefined) {
        this.print('DEBUG', message, 'API', payload);
      } else {
        this.print('DEBUG', message, 'API');
      }
    }
  }

  /**
   * Log especializado para acciones de estado (Zustand/Redux)
   * @param action - Nombre de la acción ejecutada
   * @param data - Datos opcionales relacionados con la acción
   */
  public store(action: string, data?: unknown): void {
    const message = `[STORE] ${action}`;
    if (this.isDev) {
      if (data !== undefined) {
        this.print('DEBUG', message, 'STORE', data);
      } else {
        this.print('DEBUG', message, 'STORE');
      }
    }
  }

  /**
   * Verifica si estamos en modo desarrollo
   * Útil para condicionales en el código
   */
  public isDevelopment(): boolean {
    return this.isDev;
  }
}

// Exportar instancia singleton
export const logger = Logger.getInstance();

// Exportar funciones helper para conveniencia
/**
 * Función helper para logs de debug
 * @param msg - Mensaje a loguear
 * @param module - Módulo opcional
 */
export const debugLog = (msg: unknown, module?: string): void => {
  logger.debug(msg, module);
};

/**
 * Función helper para logs de información
 * @param msg - Mensaje a loguear
 * @param module - Módulo opcional
 */
export const infoLog = (msg: unknown, module?: string): void => {
  logger.info(msg, module);
};

/**
 * Función helper para logs de advertencia
 * @param msg - Mensaje a loguear
 * @param module - Módulo opcional
 */
export const warnLog = (msg: unknown, module?: string): void => {
  logger.warn(msg, module);
};

/**
 * Función helper para logs de error
 * @param msg - Mensaje o Error a loguear
 * @param module - Módulo opcional
 */
export const errorLog = (msg: unknown, module?: string): void => {
  logger.error(msg, module);
};

/**
 * Función helper para log de llamadas API
 * @param method - Método HTTP
 * @param url - URL de la petición
 * @param payload - Payload opcional
 */
export const logApiCall = (method: string, url: string, payload?: unknown): void => {
  logger.apiCall(method, url, payload);
};

/**
 * Función helper para log de acciones de store
 * @param action - Nombre de la acción
 * @param data - Datos opcionales
 */
export const logStore = (action: string, data?: unknown): void => {
  logger.store(action, data);
};

// Exportar la clase para casos de uso avanzados
export { Logger };
