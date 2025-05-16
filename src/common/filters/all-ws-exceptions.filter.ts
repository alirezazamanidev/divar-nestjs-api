
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    Logger,
  } from '@nestjs/common';
  import { Socket } from 'socket.io';
  
  @Catch()
  export class WsAllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(WsAllExceptionsFilter.name);
  
    catch(exception: any, host: ArgumentsHost) {
      const client: Socket = host.switchToWs().getClient<Socket>();
      const context = host.switchToWs();
  
      // لاگ کردن خطا
      this.logger.error('Unhandled WebSocket exception', exception.stack || exception);
  
      // ارسال پیام خطای استاندارد به کلاینت
      client.emit('error', {
        status: 'error',
        message: exception?.message || 'Internal server error',
        code: exception?.code || 'INTERNAL_ERROR',
      });
    }
  }
  