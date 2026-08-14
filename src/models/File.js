import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  package: {
    type: String,
    required: true,
    trim: true,
  },
  iconKey: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
  },
  downloads: {
    type: Number,
    default: 0,
    min: 0,
  },
  category: {
    type: String,
    required: true,
  },
  fileKey: {
    type: String,
    required: true,
    unique: true
  },
}, { timestamps: true });

const File = mongoose.model("File", fileSchema);

export default File;