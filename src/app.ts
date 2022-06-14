import express from "express";
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

  const schemaGQL: GraphQLSchema = makeExecutableSchema({
    typeDefs: schema,
    resolvers: resolvers,
  });

  const server = new ApolloServer({
    schema: schemaGQL,
    context: ({ req }) => {
      const token = req.headers["authorization"] || false;
      if (token) {
        try {
          const user = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.SECRET
          );
          return {
            user,
          };
        } catch (error) {
          console.log(error);
        }
      }
    },
    playground: true,
  });

  app.use("*", cors());

  server.applyMiddleware({ app, path: "/graphql" });

  return app;
}
