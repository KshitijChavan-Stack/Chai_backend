import { model, Schema } from "mongoose";

const subscription = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      // one who's subscribing
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      // one to whom "subscriber" is subscribing
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = model("Subscription", subscription);
