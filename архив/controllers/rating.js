const Book = require("../models/book");

exports.addRating = async (req, res, next) => {
  const { bookId } = req.params;
  const { rating } = req.body;
  const userId = req.userId;

  try {
    const book = await Book.findById(bookId);

    if (!book) {
      const error = new Error("Book not found.");
      error.statusCode = 404;
      throw error;
    }
    const isValidRating =
      Number.isInteger(rating) && rating >= 1 && rating <= 10;

    if (!isValidRating) {
      const error = new Error(
        "Invalid rating. Please provide a whole number between 1 and 10."
      );
      error.statusCode = 400;
      throw error;
    }
    // Check if the user has already rated the book
    const existingRating = book.ratings.find(
      (ratingObj) => ratingObj.user.toString() === userId
    );

    if (existingRating) {
      // Replace the existing rating with the new rating
      existingRating.rating = rating;
    } else {
      // Add the new rating to the book
      book.ratings.push({ user: userId, rating: rating });
    }

    // Calculate the average rating
    const totalRatings = book.ratings.length;
    let sumRatings = 0;
    book.ratings.forEach((ratingObj) => {
      sumRatings += ratingObj.rating;
    });
    const averageRating = sumRatings / totalRatings;

    // Update the book's average rating
    book.averageRating = averageRating;
    book.totalRatings = totalRatings;
    // Save the updated book
    await book.save();

    res.status(201).json({
      rated: rating,
      averageRating: averageRating,
      totalRatings: totalRatings,
    });
  } catch (error) {
    next(error);
  }
};
