import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    surname:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    creationDate:{
        type: Date,
        default: Date.now()
    }
});

interface IUserSchema extends mongoose.Document {
    name: string;
    surname: string;
    email: string;
    password: string;
    creationDate: Date;
  }

export default mongoose.model<IUserSchema>('User',UserSchema)