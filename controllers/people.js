const People = require("../models/people");

exports.createPeople = (req, res, next) => {
  try {
    const people = new People({
      name: req.body.name,
      surname: req.body.surname,
      patronymic: req.body.patronymic,
      nickname: req.body.nickname,
      dateOfBirth: req.body.dateOfBirth,
      socialNetworks: req.body.socialNetworks,
      country: req.body.country,
      city: req.body.city,
    });
    people.save().then((result) => {
      res.send(result);
    });
  } catch (error) {
    next(error);
  }
};

exports.getPeople = async (req, res, next) => {

  try {
    const books = await People.find()
      .sort({ createdAt: -1 })
    res.send(books);
  } catch (error) {
    next(error);
  }
};

exports.getPeopleById = async (req, res, next) => {
  try {
    const id = req.params.peopleId;
    const person = await People.findById(id)
    res.status(200).send(person);
  } catch (error) {
    next(error);
  }
};