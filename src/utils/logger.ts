/**
 * Logger centralizado para la aplicación.
 * 
 * Comportamiento por entorno:
 * - Desarrollo (DEV=true): muestra debug, info, warn, error
 * - Producción (DEV=false): muestra SOLO warn y error
 * 
 * Formato: [TIMESTAMP] [NIVEL] [MÓDULO] mensaje
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module?: string;
  data?: unknown;
}

class Logger {
  private static instance: Logger;
  private isDev: boolean;

  private constructor() {
    // Detección automática de entorno usando Vite
    this.isDev = import.meta.env.DEV;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Genera un timestamp formateado
   */
  private getTimestamp(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Formatea el mensaje con metadata consistente
   */
  private formatMessage(level: LogLevel, message: string, module?: string): string {
    const timestamp = this.getTimestamp();
    const moduleTag = module ? `[${module}]` : '[APP]';
    return `[${timestamp}] [${level.toUpperCase()}] ${moduleTag} ${message}`;
  }

  /**
   * Procesa datos adicionales para mostrar (objetos, errores, etc.)
   */
  private processExtraData(data?: unknown): unknown {
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }
    return data;
  }

  /**
   * Método interno para escribir logs
   */
  private writeLog(level: LogLevel, message: string, module?: string, data?: unknown): void {
    // En producción, solo mostramos warn y error
    if (!this.isDev && (level === 'debug' || level === 'info')) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, module);
    const extraData = this.processExtraData(data);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, extraData !== undefined ? extraData : '');
        break;
      case 'info':
        console.info(formattedMessage, extraData !== undefined ? extraData : '');
        break;
      case 'warn':
        console.warn(formattedMessage, extraData !== undefined ? extraData : '');
        break;
      case 'error':
        console.error(formattedMessage, extraData !== undefined ? extraData : '');
        break;
    }
  }

  /**
   * Log de nivel DEBUG - Solo en desarrollo
   */
  public debug(message: string, module?: string, data?: unknown): void {
    this.writeLog('debug', message, module, data);
  }

  /**
   * Log de nivel INFO - Solo en desarrollo
   */
  public info(message: string, module?: string, data?: unknown): void {
    this.writeLog('info', message, module, data);
  }

  /**
   * Log de nivel WARN - Siempre visible
   */
  public warn(message: string, module?: string, data?: unknown): void {
    this.writeLog('warn', message, module, data);
  }

  /**
   * Log de nivel ERROR - Siempre visible
   */
  public error(message: string, module?: string, data?: unknown): void {
    this.writeLog('error', message, module, data);
  }

  /**
   * Log especializado para llamadas API
   */
  public apiCall(method: string, url: string, payload?: unknown): void {
    const message = `${method} ${url}`;
    this.writeLog('info', message, 'API', payload);
  }

  /**
   * Log especializado para acciones de estado (Zustand/Redux)
   */
  public store(action: string, data?: unknown): void {
    this.writeLog('info', action, 'STORE', data);
  }

  /**
   * Método log genérico (alias de info) - Público para compatibilidad
   */
  public log(message: string, module?: string, data?: unknown): void {
    this.writeLog('info', message, module, data);
  }
}

// Exportar instancia singleton
export const logger = Logger.getInstance();

// Funciones helper para conveniencia
export const debugLog = (msg: string, module?: string) => logger.debug(msg, module);
export const infoLog = (msg: string, module?: string) => logger.info(msg, module);
export const warnLog = (msg: string, module?: string) => logger.warn(msg, module);
export const errorLog = (msg: string, module?: string) => logger.error(msg, module);
export const logApiCall = (method: string, url: string, payload?: unknown) => logger.apiCall(method, url, payload);
export const logStore = (action: string, data?: unknown) => logger.store(action, data);
