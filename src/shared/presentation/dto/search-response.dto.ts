import { SearchStatus } from '../../domain/enums/search-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class SearchResponseDto {
  @ApiProperty({
    description: 'Código de status da resposta HTTP',
    example: 202,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensagem descritiva da resposta',
    example: 'Busca iniciada com sucesso',
  })
  message!: string;

  @ApiProperty({
    description: 'Dados da busca criada',
    type: 'object',
    properties: {
      searchId: {
        type: 'string',
        description: 'ID único da busca',
        example: 'bfc05476-0cd9-4371-b5e9-baaf9deaea0e',
      },
      productName: {
        type: 'string',
        description: 'Nome do produto buscado',
        example: 'PS5',
      },
      status: {
        type: 'string',
        description: 'Status atual da busca',
        enum: ['queued', 'processing', 'completed', 'failed'],
        example: 'queued',
      },
      estimatedTime: {
        type: 'string',
        description: 'Tempo estimado para conclusão',
        example: '30-60 segundos',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Data e hora de criação da busca',
        example: '2025-08-22T21:44:23.143Z',
      },
    },
  })
  data!: {
    searchId: string;
    productName: string;
    status: SearchStatus;
    estimatedTime: string;
    createdAt: Date;
  };

  static fromResult(
    searchId: string,
    productName: string,
    status: SearchStatus,
    createdAt: Date,
  ): SearchResponseDto {
    const dto = new SearchResponseDto();
    dto.statusCode = 202;
    dto.message = 'Busca iniciada com sucesso';
    dto.data = {
      searchId,
      productName,
      status,
      estimatedTime: '30-60 segundos',
      createdAt,
    };
    return dto;
  }

  static fromError(message: string, statusCode: number = 400): SearchResponseDto {
    const dto = new SearchResponseDto();
    dto.statusCode = statusCode;
    dto.message = message;
    dto.data = {
      searchId: '',
      productName: '',
      status: SearchStatus.FAILED,
      estimatedTime: '',
      createdAt: new Date(),
    };
    return dto;
  }
}
