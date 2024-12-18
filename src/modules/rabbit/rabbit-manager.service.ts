import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LoggerService, RabbitQueuesEnum } from "@ssmovzh/chatterly-common-utils";
import { RabbitConsumerService } from "~/modules/rabbit/rabbit-consumer.service";
import { Executor } from "~/modules/rooms";
import { RabbitService } from "~/modules/rabbit/rabbit.service";

@Injectable()
export class RabbitConsumerManagerService implements OnModuleInit, OnModuleDestroy {
  private consumers: RabbitConsumerService[];

  constructor(
    private readonly executor: Executor,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly rabbitService: RabbitService
  ) {}

  async onModuleInit() {
    const queueNames = [
      RabbitQueuesEnum.ADD_WELCOME_CHAT,
      RabbitQueuesEnum.CREATE_ROOM,
      RabbitQueuesEnum.GET_ALL_ROOMS,
      RabbitQueuesEnum.GET_ALL_USER_ROOMS,
      RabbitQueuesEnum.FIND_ROOM_AND_USERS_BY_NAME,
      RabbitQueuesEnum.UPDATE_ROOM,
      RabbitQueuesEnum.CHANGE_ROOM_PHOTO,
      RabbitQueuesEnum.DELETE_ROOM,
      RabbitQueuesEnum.ADD_MESSAGE_REFERENCE,
      RabbitQueuesEnum.ADD_RECENT_MESSAGE,
      RabbitQueuesEnum.DELETE_MESSAGE_REFERENCE,
      RabbitQueuesEnum.ENTER_PUBLIC_ROOM,
      RabbitQueuesEnum.ADD_USER,
      RabbitQueuesEnum.DELETE_USER,
      RabbitQueuesEnum.CHANGE_USER_RIGHTS,
      RabbitQueuesEnum.GET_NOTIFICATIONS_SETTINGS,
      RabbitQueuesEnum.CHANGE_NOTIFICATIONS_SETTINGS,
      RabbitQueuesEnum.LOAD_RIGHTS
    ];

    this.consumers = await Promise.all(
      queueNames.map(async (queueName) => {
        const loggerInstance = this.logger.clone();
        const channel = await this.rabbitService.createChannel();

        return new RabbitConsumerService(channel, this.executor, loggerInstance, this.configService, queueName);
      })
    );

    await Promise.all(this.consumers.map((consumer) => consumer.onModuleInit()));
  }

  async onModuleDestroy() {
    await Promise.all(this.consumers.map((consumer) => consumer.onModuleDestroy()));
  }
}
