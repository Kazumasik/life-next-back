// commentController.js
const { validationResult } = require("express-validator");
const Book = require("../models/book");
const Comment = require("../models/comment");
const User = require("../models/user");

// Контроллер для создания комментария
exports.createComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { bookId } = req.params;
    const { content } = req.body;
    const user = req.userId;

    const book = await Book.findById(bookId);

    if (!book) {
      return res
        .status(404)
        .json({ error: "Book with this id does not exist" });
    }

    const userObj = await User.findById(user).select("-password -email");

    if (!userObj) {
      return res
        .status(404)
        .json({ error: "User with this id does not exist" });
    }
    const newComment = new Comment({
      book: bookId,
      user: userObj,
      content,
    });

    const savedComment = await newComment.save();

    book.comments.push(savedComment._id);

    await book.save();
    const experiencePoints = 5;
    User.findById(user, (err, user) => {
      if (err) {
        console.error(err);
      } else {
        user.updateLevel(experiencePoints);
      }
    });
    res.send(savedComment);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getComments = (req, res, next) => {
  const bookId = req.params.bookId;
  Book.findById(bookId)
    .select("comments")
    .populate({
      path: "comments",
      select: "-book",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "user",
        model: "User",
        select: "-password -email",
      },
    })
    .then((book) => {
      res.status(200).send([...book.comments]);
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 404;
        error.message = "Book with this id does not exist.";
      }
      next(error);
    });
};

// Контроллер для редактирования комментария
exports.updateComment = (req, res, next) => {
  const commentId = req.params.commentId;
  const userId = req.userId; // Идентификатор текущего пользователя
  const updatedContent = req.body.content;

  Comment.findById(commentId)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Проверка, что комментарий принадлежит текущему пользователю
      if (comment.user.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to update this comment" });
      }

      comment.content = updatedContent;

      comment
        .save()
        .then((result) => {
          res.json({
            message: "Comment updated successfully",
            comment: result,
          });
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
};
// Контроллер для удаления комментария
exports.deleteComment = (req, res, next) => {
  const commentId = req.params.commentId;
  const userId = req.userId; // Идентификатор текущего пользователя

  Comment.findById(commentId)
    .then((comment) => {
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Проверка, что комментарий принадлежит текущему пользователю
      if (comment.user.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete this comment" });
      }

      Comment.findByIdAndRemove(commentId)
        .then((result) => {
          if (!result) {
            return res.status(404).json({ message: "Comment not found" });
          }

          // Удаление идентификатора комментария из массива комментариев книги
          const bookId = result.book;
          Book.findByIdAndUpdate(bookId, { $pull: { comments: commentId } })
            .then(() => {
              res.json({ message: "Comment deleted successfully" });
            })
            .catch((error) => {
              next(error);
            });
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
};
