import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   name:{
    type: String,
    required: [true, "Name is required"]
},

    email:{
      type: string,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password:{
      type: string,
      required: [true, "Password is required"],
      minlength: [6, "Password must me atlest 6 charachters long"]
    },

    cartItems:[
      {
        quantity:{
          type: Number,
          default: 1
        },
        product:{
          type: mongoose.Schema.Types.ObjectId,
          ref: "product"
        }
      }
    ],
    role:{
      type: string,
      enum:["customer", "admin"],
      default: "customer"
    }
}, {
  //createdAt, updatedAt
  timestamps: true
})


const User = mongoose.model("User", userSchema)

export default User;
