import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core"
import path from 'path';


export default {
  migrations: {
    path: path.join(__dirname, "/migrations"),
    glob: '!(*.d).{js,ts}'
  },
  // allowGlobalContext: true,
  entities: [Post],
  dbName: 'postgres',
  user: 'postgres',
  password: 'Don\'t @ me ok?',
  type: 'postgresql',
  debug: !__prod__
} as Parameters<typeof MikroORM.init>[0];