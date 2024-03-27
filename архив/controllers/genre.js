const Genre = require("../models/genre");
const Book = require("../models/book");

exports.createGenre = (req, res, next) => {
  const name = req.body.name;

  const genre = new Genre({
    name: name,
  });
  genre.save().then((result) => {
    res.send(result);
  });
};

exports.getAllGenres = (req, res, next) => {
  Genre.find()
    .then((genres) => {
      res.status(200).send(genres);
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = "Server error";
      }
      next(error);
    });
};

exports.deleteGenre = async (req, res, next) => {
  const genreId = req.params.genreId;

  try {
    const removedGenre = await Genre.findByIdAndRemove(genreId);

    if (!removedGenre) {
      const error = new Error("Genre not found");
      error.statusCode = 404;
      throw error;
    }

    await Book.updateMany({ genres: genreId }, { $pull: { genres: genreId } });

    res.status(200).json({ message: "Genre deleted", genre: removedGenre });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = "Server error";
    }
    next(error);
  }
};

exports.updateGenre = async (req, res, next) => {
  const genreId = req.params.genreId;
  const newName = req.body.name;

  try {
    const genre = await Genre.findByIdAndUpdate(
      genreId,
      { name: newName },
      { new: true }
    );

    if (!genre) {
      const error = new Error("Genre not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(genre);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = "Server error";
    }
    next(error);
  }
};
