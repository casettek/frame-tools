import express from "express";

import { createServer } from "http";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
// import { makeExecutableSchema } from '@graphql-tools/schema';
import { Server } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import { GraphQLSchema } from "graphql";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";

import schema from "./schema";
import resolvers from "./resolvers";

export async function startServer() {
  dotenv.config();

  const app = express();
  const httpServer = createServer(app);

  const schemaGQL: GraphQLSchema = makeExecutableSchema({
    typeDefs: schema,
    resolvers: resolvers,
  });

  // Creating the WebSocket server
  const wsServer = new Server({
    server: httpServer,
    path: "/graphql",
  });

  const serverCleanup = useServer({ schema: schemaGQL }, wsServer);

  const server = new (ApolloServer as any)({
    schema: schemaGQL,
    csrfPrevention: true,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // // Proper shutdown for the WebSocket server.
      // {
      //   async serverWillStart() {
      //     return {
      //       async drainServer() {
      //         await serverCleanup.dispose();
      //       },
      //     };
      //   },
      // },
    ],
    // @ts-ignore
    playground: true,
  });

  app.use("*", cors());

  server.applyMiddleware({ app, path: "/graphql" });

  return app;
}
