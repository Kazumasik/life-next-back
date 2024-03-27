const multer = require("multer");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "content") {
      cb(null, "books");
    } else if (file.fieldname === "image") {
      cb(null, "images");
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "content") {
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
};

const uploadBookFiles = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: "5mb",
  },
}).fields([
  {
    name: "content",
    maxCount: 1,
  },
  {
    name: "image",
    maxCount: 1,
  },
]);

module.exports = uploadBookFiles;
