import { Injectable } from '@nestjs/common';
import { ILogger } from '../interfaces/logger.interface';
import * as winston from 'winston';

@Injectable()
export class WinstonLoggerService implements ILogger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'product-search-automation' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  public info(message: string, context?: any): void {
    this.logger.info(message, context);
  }

  public error(message: string, context?: any): void {
    this.logger.error(message, context);
  }

  public warn(message: string, context?: any): void {
    this.logger.warn(message, context);
  }

  public debug(message: string, context?: any): void {
    this.logger.debug(message, context);
  }
}
