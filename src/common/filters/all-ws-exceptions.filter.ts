import {
  ArgumentsHost,
  Catch,
  HttpException,
  Logger,
} from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsAllExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsAllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client: Socket = host.switchToWs().getClient<Socket>();
    const error =
      exception instanceof HttpException
        ? exception
        : new WsException('Internal server error');

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(`WebSocket Error: ${JSON.stringify(message)}`);

    client.emit('error', {
      status,
      message,
    });
  }
}
