import { gql } from "apollo-server";

//Schema
const typeDefs = gql`
  type Query {
    #Frames
    getFrame: Frame
    getImports(ids: [String]): [Import]
    getWrappers(ids: [String]): [Wrapper]
  }
  type Mutation {
    #Frames
    newFrame(source: String): Frame
  }
  type Subscription {
    frameCreated: Frame
  }
`;

export default typeDefs;
