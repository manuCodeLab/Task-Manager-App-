import mongoose from "mongoose";

const stages = ["Todo", "In Progress", "Done"];

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    stage: {
      type: String,
      enum: stages,
      default: "Todo"
    }
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
export { stages };
