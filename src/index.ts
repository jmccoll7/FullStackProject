import "reflect-metadata";
import { MikroORM, RequestContext } from "@mikro-orm/core"
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from 'express';
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

const main = async () => {

  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();
  // const post = orm.em.create(Post, {title: "my first post"} as RequiredEntityData<Post> );
  // await orm.em.persistAndFlush(post);

  // const posts = await orm.em.find(Post, {});
  // console.log(posts)

  const app = express();

  app.use((req, res, next) => {
    RequestContext.create(orm.em, next)
  })

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false
    }),
    context: () => ({em: orm.em})
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