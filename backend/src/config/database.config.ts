import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'Helloworld@11',
  database: process.env.DB_DATABASE || 'testmypolicy2',
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  synchronize: false, // Set to false in production
  logging: process.env.NODE_ENV === 'development',
});
