import "reflect-metadata";
import { MikroORM, RequestContext } from "@mikro-orm/core"
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from 'express';
import {ApolloServer} from 'apollo-server-express'
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import {buildSchema} from 'type-graphql'
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import connectRedis from 'connect-redis';
import session from "express-session";
import redis from 'redis';
import { MyContext } from "./types";

const main = async () => {

  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();
  // const post = orm.em.create(Post, {title: "my first post"} as RequiredEntityData<Post> );
  // await orm.em.persistAndFlush(post);

  // const posts = await orm.em.find(Post, {});
  // console.log(posts)

  const app = express();

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  app.use(
    session({
      name: 'qid',
      store: new RedisStore({
        client: redisClient,
        disableTTL: true,
        disableTouch: true
      }),
      cookie: {
        maxAge: 1000 * 60* 60 * 24 * 365.25 * 10,
        httpOnly: false,
        secure: false, // __prod__, //cookie only works in https
        sameSite: "none", // csrf
      },
      saveUninitialized: false,
      secret: "a3w4sed5rf6tg7yh8uj9ik4957ritfyu",
      resave: false
    })
  )

  app.use((req, res, next) => {
    RequestContext.create(orm.em, next)
  })

  const apolloServer = new ApolloServer({
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({em: orm.em, req, res})
  });

  await apolloServer.start()
  apolloServer.applyMiddleware({app})

  app.listen(4000, () => {
    console.log('server started on localhost:4000')
  })

};

main().catch(err => {
  console.error(err)
});