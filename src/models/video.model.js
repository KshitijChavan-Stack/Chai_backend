import mongoose, { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videofile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      lowercase: true,
    },
    duration: {
      type: Number, // cloudinary will provide duration
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User", // MODEL SHOULD BE AVAILABLE
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);
// now we write the querys that are aggregate querys

export const Video = model("Video", videoSchema);
