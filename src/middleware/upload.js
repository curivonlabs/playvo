import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 2
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "icon") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Icon must be an image"));
      }

      return cb(null, true);
    }

    if (file.fieldname === "app") {
      return cb(null, true);
    }

    cb(new Error(`Unexpected file field: ${file.fieldname}`));
  }
});

export default upload;