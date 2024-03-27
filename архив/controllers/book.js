const Book = require("../models/book");
const User = require("../models/user");
const Comment = require("../models/comment");
const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");

exports.getBooks = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15; // Получаем значение параметра limit из запроса, по умолчанию 10
  const skip = (page - 1) * limit;
  const genreIds = req.query.genre; // Получаем значения параметра жанров из запроса
  const categoryIds = req.query.category; // Получаем значения параметра категорий из запроса
  const order = req.query.order; // Получаем значение параметра сортировки из запроса

  try {
    let query = Book.find();

    if (genreIds) {
      const genreIdArray = Array.isArray(genreIds) ? genreIds : [genreIds];
      query = query.where("genres").all(genreIdArray);
    }

    if (categoryIds) {
      const categoryIdArray = Array.isArray(categoryIds)
        ? categoryIds
        : [categoryIds];
      query = query.where("categories").all(categoryIdArray);
    }

    if (order === "bookmarkCount") {
      query = query.sort({ bookmarkCount: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const [totalBooksCount, books] = await Promise.all([
      Book.countDocuments(query),
      query
        .skip(skip)
        .limit(limit)
        .select("-comments -ratings")
        .populate("genres")
        .populate("categories")
        .lean(),
    ]);

    const totalPages = Math.ceil(totalBooksCount / limit);
    if (books.length !== 0) {
      res.send({
        books,
        totalPages,
        page,
      });
    } else {
      res.send({ message: "Не знайдено книг за такими параметрами" });
    }
  } catch (error) {
    next(error);
  }
};
exports.postBook = async (req, res, next) => {
  console.log(req);
  if (!req.files.image) {
    return res.status(400).json({ error: "Image is required" });
  }
  if (!req.files.content) {
    return res.status(400).json({ error: "Content is required" });
  }
  const imageUrl = req.files.image[0].path;
  const contentUrl = req.files.content[0].path;
  const title = req.body.title;
  const origTitle = req.body.origTitle;
  const description = req.body.description;
  const genres = JSON.parse(req.body.genres);
  const categories = JSON.parse(req.body.categories);

  try {
    const book = new Book({
      title: title,
      origTitle: origTitle,
      description: description,
      genres: genres,
      imageUrl: imageUrl,
      contentUrl: contentUrl,
      categories: categories,
    });

    const savedBook = await book.save();
    res.send(savedBook);
  } catch (error) {
    await fs.promises.unlink(imageUrl);
    await fs.promises.unlink(contentUrl);
    next(error);
  }
};

exports.updateBook = async (req, res, next) => {
  const bookId = req.params.bookId;
  const updateData = {
    title: req.body.title,
    origTitle: req.body.origTitle,
    description: req.body.description,
    genres: JSON.parse(req.body.genres),
    categories: JSON.parse(req.body.categories),
  };

  let hasNewImage = false;
  let hasNewContent = false;

  if (req.files && req.files.image && req.files.image[0].path) {
    const newImageUrl = req.files.image[0].path;

    try {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error("Book with this id does not exist");
      }

      const oldImageUrl = book.imageUrl;
      updateData.imageUrl = newImageUrl;
      hasNewImage = true;

      await fs.promises.unlink(oldImageUrl);
    } catch (error) {
      // Remove the new image file if an error occurs
      if (hasNewImage) {
        await fs.promises.unlink(newImageUrl);
      }
      return next(error);
    }
  }

  if (req.files && req.files.content && req.files.content[0].path) {
    const newContentUrl = req.files.content[0].path;

    try {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error("Book with this id does not exist");
      }

      const oldContentUrl = book.contentUrl;
      updateData.contentUrl = newContentUrl;
      hasNewContent = true;

      await fs.promises.unlink(oldContentUrl);
    } catch (error) {
      // Remove the new content file if an error occurs
      if (hasNewContent) {
        await fs.promises.unlink(newContentUrl);
      }
      return next(error);
    }
  }

  try {
    const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, {
      new: true,
    });
    if (!updatedBook) {
      throw new Error("Book with this id does not exist");
    }
    res.send(updatedBook);
  } catch (error) {
    next(error);
  }
};
exports.getBookById = async (req, res, next) => {
  try {
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId)
      .populate("genres")
      .populate("categories")
      .select("-comments -ratings");

    if (!book) {
      return res.status(404).send("Book with this id does not exist.");
    }
    let bookmarkType = null;

    if (req.userId) {
      const user = await User.findById(req.userId);
      const bookmarkTypes = Object.keys(user.bookmarks);

      for (const type of bookmarkTypes) {
        if (user.bookmarks[type].includes(bookId)) {
          bookmarkType = type;
          break;
        }
      }
    }
    const response = {
      ...book.toObject(),
      bookmarkType: bookmarkType,
    };
    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = (req, res, next) => {
  const bookId = req.params.bookId;

  Comment.deleteMany({ book: bookId })
    .then(() => {
      return Book.findByIdAndDelete(bookId);
    })
    .then((deletedBook) => {
      if (!deletedBook) {
        return res
          .status(404)
          .json({ error: "Book with this id does not exist" });
      }
      fs.unlink(deletedBook.imageUrl, (err) => {
        if (err) {
          console.log("Error deleting book image:", err);
        }
      });
      fs.unlink(deletedBook.contentUrl, (err) => {
        if (err) {
          console.log("Error deleting book content:", err);
        }
      });
      res.send({ message: "Book successfully deleted." });
    })
    .catch((error) => {
      next(error);
    });
};

exports.searchBooksByTitle = (req, res, next) => {
  const searchTerm = req.query.title;
  if (!searchTerm) {
    return res.json([]);
  }
  Book.find({
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { origTitle: { $regex: searchTerm, $options: "i" } },
    ],
  })
    .populate(["genres"])
    .then((books) => {
      res.json(books);
    })
    .catch((error) => {
      next(error);
    });
};

exports.downloadBookContent = (req, res, next) => {
  const bookId = req.params.bookId;

  Book.findById(bookId)
    .then((book) => {
      if (!book) {
        return res.status(404).send("Book with this id does not exist.");
      }

      const contentPath = book.contentUrl;
      const filePath = path.join(__dirname, "..", contentPath);
      res.download(filePath, "book_content.docx");
    })
    .catch((error) => {
      next(error);
    });
};

exports.getBookContent = (req, res, next) => {
  const bookId = req.params.bookId;
  const pageNumber = req.query.page;
  const paragraphsPerPage = 80;
  Book.findById(bookId)
    .then((book) => {
      if (!book) {
        const error = new Error("Book not found");
        error.statusCode = 404;
        throw error;
      }

      mammoth
        .convertToHtml({ path: book.contentUrl })
        .then((result) => {
          const html = result.value;

          if (!pageNumber) {
            const response = {
              text: html,
            };

            res.setHeader("Content-Type", "application/json");
            res.send(response);
          } else {
            const paragraphs = html.split("</p>");
            const totalPages = Math.ceil(paragraphs.length / paragraphsPerPage);
            const currentPageParagraphs = paragraphs.slice(
              (pageNumber - 1) * paragraphsPerPage,
              pageNumber * paragraphsPerPage
            );

            const currentPageText = currentPageParagraphs.join("</p>");
            const response = {
              currentPage: +pageNumber,
              totalPages: totalPages,
              text: currentPageText,
            };

            res.setHeader("Content-Type", "application/json");
            res.send(response);
          }
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch((error) => {
      next(error);
    });
};

exports.putBookmark = async (req, res, next) => {
  try {
    const userId = req.userId;
    const bookId = req.params.bookId;
    const bookmarkType = req.body.bookmarkType;

    const user = await User.findById(userId);
    let oldBookmark = false;
    // Проверка наличия книги в выбранной закладке
    if (user.bookmarks[bookmarkType].includes(bookId)) {
      return res
        .status(400)
        .json({ error: "Book already in this bookmark type" });
    }
    // Удаление книги из других закладок пользователя
    const otherBookmarkTypes = Object.keys(user.bookmarks).filter(
      (type) => type !== bookmarkType
    );
    for (const type of otherBookmarkTypes) {
      if (user.bookmarks[type].includes(bookId)) {
        user.bookmarks[type] = user.bookmarks[type].filter(
          (id) => id.toString() !== bookId
        );
        oldBookmark = true;
        break;
      }
    }

    // Добавление книги в выбранную закладку
    user.bookmarks[bookmarkType].push(bookId);

    await user.save();
    if (!oldBookmark) {
      const book = await Book.findByIdAndUpdate(bookId, {
        $inc: { bookmarkCount: 1 },
      });
      const experiencePoints = 20;
      User.findById(userId, (err, user) => {
        if (err) {
          console.error(err);
        } else {
          user.updateLevel(experiencePoints);
        }
      });
      res.send(book);
    } else {
      res.send({ message: "Bookmark successfully changed" });
    }
  } catch (error) {
    next(error);
  }
};

exports.removeBookmark = async (req, res, next) => {
  try {
    const userId = req.userId;
    const bookId = req.params.bookId;

    const user = await User.findById(userId);
    const book = await Book.findById(bookId);

    let bookmarkType = null;
    // Поиск типа закладки, в которой находится книга
    for (const type in user.bookmarks) {
      if (user.bookmarks[type].includes(bookId)) {
        bookmarkType = type;
        break;
      }
    }

    if (!bookmarkType) {
      return res.status(400).json({ error: "Book was not in any bookmark" });
    }

    // Удаление книги из найденной закладки
    user.bookmarks[bookmarkType] = user.bookmarks[bookmarkType].filter(
      (id) => id.toString() !== bookId
    );

    // Уменьшение значения bookmarkCount в модели Book
    if (book) {
      book.bookmarkCount -= 1;
      await book.save();
    }

    await user.save();

    res.send({ message: "Bookmark successfully deleted" });
  } catch (error) {
    next(error);
  }
};

exports.getNewBooks = async (req, res, next) => {
  const currentDate = new Date();
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const books = await Book.find({
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ averageRating: -1, bookmarkCount: -1 })
      .limit(10)
      .select("-comments -ratings")
      .populate("genres")
      .populate("categories")
      .lean();

    if (books.length !== 0) {
      res.send(books);
    } else {
      res.send({ message: "No popular books found in the last week." });
    }
  } catch (error) {
    next(error);
  }
};
