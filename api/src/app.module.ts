import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import {ProjectController} from './controllers/project.controller';
import {ProjectService} from './services/project.service';

;

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'user',
      password: 'password',
      database: 'sosd_db',
      autoLoadEntities: true,
      synchronize: true, // set to false in production
    }),
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class AppModule {}
