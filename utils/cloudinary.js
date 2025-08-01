// utils/cloudinary.js
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const streamUpload = (buffer, folder = "task_attachments") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = {
  cloudinary,
  streamUpload
};
