// config/gridfs.js
import mongoose from "mongoose";

let gfs;

mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
});

export { gfs };
