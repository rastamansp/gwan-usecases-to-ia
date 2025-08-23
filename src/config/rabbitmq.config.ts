import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface RabbitMQConfig {
  url: string;
  queueName: string;
  exchangeName: string;
  routingKey: string;
}

@Injectable()
export class RabbitMQConfigService {
  constructor(private readonly configService: ConfigService) {}

  get config(): RabbitMQConfig {
    const url = this.configService.get<string>('RABBITMQ_URL');
    if (!url) {
      throw new Error('RABBITMQ_URL não configurada');
    }
    return {
      url,
      queueName: this.configService.get<string>('RABBITMQ_QUEUE_SEARCH_PRODUCT', 'search-product'),
      exchangeName: 'product-search-exchange',
      routingKey: 'search-product',
    };
  }

  get connectionOptions(): amqp.Options.Connect {
    return {
      heartbeat: 60,
    };
  }

  get queueOptions(): amqp.Options.AssertQueue {
    return {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-message-ttl': 86400000, // 24 horas em ms
        'x-max-priority': 10,
      },
    };
  }

  get exchangeOptions(): amqp.Options.AssertExchange {
    return {
      durable: true,
      autoDelete: false,
    };
  }
}
