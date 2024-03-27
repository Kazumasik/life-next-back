const Category = require("../models/category");
const Book = require("../models/book");

exports.createCategory = (req, res, next) => {
  // const imageUrl = req.file.path;
  const name = req.body.name;

  const category = new Category({
    name,
  });
  category.save().then((result) => {
    res.send(result);
  });
};

exports.getAllCategories = (req, res, next) => {
  Category.find()
    .then((categories) => {
      res.status(200).send(categories);
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.message = "Server error";
      }
      next(error);
    });
};

exports.deleteCategory = async (req, res, next) => {
  const categoryId = req.params.categoryId;

  try {
    const removedCategory = await Category.findByIdAndRemove(categoryId);

    if (!removedCategory) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    await Book.updateMany(
      { categories: categoryId },
      { $pull: { categories: categoryId } }
    );

    res
      .status(200)
      .json({ message: "Category deleted", category: removedCategory });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = "Server error";
    }
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  const categoryId = req.params.categoryId;
  const newName = req.body.name;

  try {
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name: newName },
      { new: true }
    );

    if (!category) {
      const error = new Error("Category not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(category);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = "Server error";
    }
    next(error);
  }
};
