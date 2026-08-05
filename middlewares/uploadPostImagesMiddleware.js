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
      Object.assign(new Error("Chỉ chấp nhận ảnh JPEG, PNG, WEBP hoặc GIF."), { statusCode: 400 }),
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

const hasValidSignature = (file) => {
  const buffer = file?.buffer;
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  if (file.mimetype === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (file.mimetype === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === "image/gif") return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  if (file.mimetype === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
};

export const validateUploadedImages = (req, res, next) => {
  const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : [];
  if (files.some((file) => !hasValidSignature(file))) {
    return res.status(400).json({ message: "Nội dung file không khớp với định dạng ảnh" });
  }
  return next();
};
