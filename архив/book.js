const express = require("express");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");
const ifAuth = require("../middleware/if-auth");
const bookController = require("../controllers/book");
const commentController = require("../controllers/comment");
const ratingController = require("../controllers/rating");
const bookUpload = require("../middleware/uploadBook");

const router = express.Router();

router.get("/new", bookController.getNewBooks);

router.get("/search", bookController.searchBooksByTitle);

router.post("/create", isAuth, isAdmin, bookUpload, bookController.postBook);

router.post(
  "/:bookId/comment",
  isAuth,
  [
    body("content").trim().not().isEmpty(),
    body("content").trim().isLength({ max: 500 }),
  ],
  commentController.createComment
);
router.post("/:bookId/rating", isAuth, ratingController.addRating);

router.get("/:bookId/download", bookController.downloadBookContent);

router.put("/:bookId/add-bookmark", isAuth, bookController.putBookmark);

router.delete("/:bookId/bookmark", isAuth, bookController.removeBookmark);

router.get("/:bookId/comment", commentController.getComments);

router.get("/:bookId/content/", bookController.getBookContent);

router.delete("/comment/:commentId", isAuth, commentController.deleteComment);

router.put("/comment/:commentId", isAuth, commentController.updateComment);

router.put("/:bookId", isAuth, isAdmin, bookUpload, bookController.updateBook);

router.delete("/:bookId", isAuth, isAdmin, bookController.deleteBook);

router.get("/:bookId", ifAuth, bookController.getBookById);

router.get("/", bookController.getBooks);

module.exports = router;
