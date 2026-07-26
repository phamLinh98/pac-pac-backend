import multer from "multer";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const fileFilter = (
  _request,
  file,
  callback
) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(
      new Error(
        "Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc GIF."
      ),
      false
    );

    return;
  }

  callback(null, true);
};

export const uploadPostImagesMiddleware =
  multer({
    /*
     * File được giữ trong RAM.
     * Sau middleware, dữ liệu ảnh nằm ở:
     *
     * req.files[index].buffer
     */
    storage: multer.memoryStorage(),

    fileFilter,

    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 10,
    },
  });
