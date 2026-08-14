import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Server Connected to Database at: ${conn.connection.host}`)
  } catch (error) {
    console.log("Error Connecting to Sever:", error);
    process.exit(1);
  }
}

export default connectDB;