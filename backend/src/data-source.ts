import { DataSource } from "typeorm";
import { config } from "./config/environment";

export default new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: true,
  entities: [__dirname + "/entities/*.{js,ts}"],
  migrations: ["src/database/migrations/**/*.ts"],
  subscribers: ["src/database/subscribers/**/*.ts"],
});
