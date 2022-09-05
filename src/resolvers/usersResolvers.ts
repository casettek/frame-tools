import User from "../models/User";
import { iUserInput, iAuthInput } from "../schema/types/userTypes";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface iUser {
  id?: string;
  name: string;
  surname: string;
}

interface iToken {
  input: string;
}

interface iObjectUserInput {
  input: iUserInput;
}

interface iObjectAuthInput {
  input: iAuthInput;
}

const createToken = (user: iUser, secret: string, expiresIn: string) => {
  const { id, name, surname } = user;
  return jwt.sign({ id, name, surname }, secret, { expiresIn });
};

//Resolvers
const resolvers = {
  Query: {
    getUser: async (_: any, { input }: iToken) => {
      const user = jwt.verify(input, process.env.SECRET);
      return user;
    },
  },
  Mutation: {
    newUser: async (_: any, { input }: iObjectUserInput) => {
      const { email, password } = input;

      const exist = await User.findOne({ email });

      const salt = await bcryptjs.genSalt(10);

      input.password = await bcryptjs.hash(password, salt);

      if (exist) {
        throw new Error("User already registered");
      }

      try {
        const user = new User(input);
        const result = await user.save();
        return result;
      } catch (error) {}
    },
    authUser: async (_: any, { input }: iObjectAuthInput) => {
      const { email, password } = input;

      const exist = await User.findOne({ email });

      if (!exist) {
        throw new Error("User doesn't exist");
      }
      const valid = await bcryptjs.compare(password, exist.password);

      if (!valid) {
        throw new Error("Incorrect password");
      }

      return {
        token: createToken(exist, process.env.SECRET, "24h"),
      };
    },
  },
};

export default resolvers;
