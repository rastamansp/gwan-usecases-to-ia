export interface IQueueService {
  sendMessage(queueName: string, message: any): Promise<boolean>;
  consumeMessage(queueName: string, callback: (message: any) => Promise<void>): Promise<void>;
  isConnected(): boolean;
  closeConnection(): Promise<void>;
}
