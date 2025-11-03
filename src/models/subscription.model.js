import { model, Schema } from "mongoose";

// every time we subscribe to a channel or (vice versa) a new
// document is created !!
const subscription = new Schema(
  {
    // when we have to find how many subs
    // a channel have we'll count how many documents
    // have CHANNEL sub to -> chai aur code
    // when we want to find subs of a perticular channel
    // we have to find by channel
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
