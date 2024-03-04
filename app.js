const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const bookRoutes = require("./routes/book");
const genreRoutes = require("./routes/genre");
const categoryRoutes = require("./routes/category");

const app = express();
const PORT = 5002;

app.use(bodyParser.json());

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/book", bookRoutes);
app.use("/genre", genreRoutes);
app.use("/category", categoryRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

const dbURL =
  "mongodb+srv://maxim4ik:qSfI1yz2bti9bQ0W@cluster0.nyu4b6m.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started successfully on port ${PORT}!`);
    });
  })
  .catch((err) => console.log(err));
