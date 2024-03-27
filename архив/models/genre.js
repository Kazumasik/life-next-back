const mongoose = require("mongoose");
const Book = require("../models/book");
const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});


const Genre = mongoose.model("Genre", genreSchema);

module.exports = Genre;
