
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const peopleRoutes = require("./routes/people");
const japaneseRoutes = require("./routes/japanese");
const path = require('path');
const app = express();
const PORT = 5002;

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
const audioFolder = path.join(__dirname, 'controllers', 'audio');

// Настройка middleware для обслуживания статических файлов из папки audioFolder
app.use('/audio', express.static(audioFolder));
app.use("/japanese", japaneseRoutes);
app.use("/people", peopleRoutes);
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

const dbURL =
  "mongodb+srv://hhbbj63:CbJovalpgeUjFAWQ@cluster0.fvq2i1q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    ssl: true
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started successfully on port ${PORT}!`);
    });
  })
  .catch((err) => console.log(err));