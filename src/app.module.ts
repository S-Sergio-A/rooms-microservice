import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { defaultImports } from "~/modules/common";
import { RabbitModule } from "~/modules/rabbit";
import { RoomsModule } from "~/modules/rooms/rooms.module";
import { ConnectionNamesEnum, HealthCheckModule, LoggerModule, MongoConfigInterface } from "@ssmovzh/chatterly-common-utils";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ...defaultImports,
    RoomsModule,
    RabbitModule,
    HealthCheckModule,
    LoggerModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mongoConfig = configService.get<MongoConfigInterface>("mongoConfig");
        return {
          uri: `mongodb+srv://${mongoConfig.username}:${mongoConfig.password}@${mongoConfig.clusterUrl}/${ConnectionNamesEnum.CHATTERLY}?retryWrites=true&w=majority&appName=Cluster0`
        };
      },
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
