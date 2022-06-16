import dotenv from "dotenv";
import { PubSub } from "graphql-subscriptions";
import {
  deploySource,
  renderFrame,
  renderFrameLocal,
} from "../services/chain-sim/deploy";
import { iNewFrameInput, iFrame } from "../schema/types/frame";

const pubsub = new PubSub();

dotenv.config();

//Resolvers
const resolvers = {
  Query: {
    getFrame: async (_: any): Promise<iFrame> => {
      const frame = renderFrameLocal(
        ["compressorGlobalB64", "p5gzhex", "p5setup"],
        ""
      );
      return { html: frame };
    },
  },
  Mutation: {
    newFrame: async (_: any, source: string): Promise<iFrame> => {
      // await deploySource(source);
      // const frame = await renderFrame();
      // pubsub.publish("FRAME_CREATED", { frameCreated: frame });
      const frame = renderFrameLocal(
        ["compressorGlobalB64", "p5gzhex", "p5setup"],
        source
      );
      return { html: frame };
    },
  },
  Subscription: {
    frameCreated: {
      subscribe: () => pubsub.asyncIterator(["FRAME_CREATED"]),
    },
  },
};

export default resolvers;
