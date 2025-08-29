import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { IQueueService } from '../interfaces/queue-service.interface';
import { RabbitMQConfigService } from '../../../config/rabbitmq.config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQQueueService implements IQueueService, OnModuleDestroy {
  private connection?: any;
  private channel?: any;
  private readonly config: RabbitMQConfigService;

  constructor(config: RabbitMQConfigService) {
    this.config = config;
  }

  public async sendMessage(queueName: string, message: any): Promise<boolean> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error('Canal não disponível');
      }

      const queueConfig = this.config.queueOptions;
      await this.channel.assertQueue(queueName, queueConfig);

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const success = this.channel.sendToQueue(queueName, messageBuffer, {
        persistent: true,
        priority: message.priority || 0,
      });

      return success;
    } catch (error) {
      console.error('Erro ao enviar mensagem para fila:', error);
      return false;
    }
  }

  public async consumeMessage(
    queueName: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error('Canal não disponível');
      }

      const queueConfig = this.config.queueOptions;
      await this.channel.assertQueue(queueName, queueConfig);

      await this.channel.consume(queueName, async (msg: any) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            this.channel?.ack(msg);
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            this.channel?.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao consumir mensagens:', error);
    }
  }

  public isConnected(): boolean {
    return !!(this.connection && this.channel);
  }

  public async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }
    } catch (error) {
      console.error('Erro ao fechar conexão:', error);
    }
  }

  private async ensureConnection(): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    try {
      const config = this.config.config;
      const options = this.config.connectionOptions;

      this.connection = await amqp.connect(config.url, options);
      this.channel = await this.connection.createChannel();

      // Configurar exchange
      const exchangeConfig = this.config.exchangeOptions;
      if (this.channel) {
        await this.channel.assertExchange(config.exchangeName, 'direct', exchangeConfig);
      }

      console.log('Conexão RabbitMQ estabelecida com sucesso');
    } catch (error) {
      console.error('Erro ao conectar com RabbitMQ:', error);
      throw error;
    }
  }

  public async onModuleDestroy(): Promise<void> {
    await this.closeConnection();
  }
}
