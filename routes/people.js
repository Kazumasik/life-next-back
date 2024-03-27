const express = require("express");
const { body } = require("express-validator");
const peopleController = require("../controllers/people");

const router = express.Router();

router.post("/", peopleController.createPeople);
router.get("/", peopleController.getPeople);
router.get("/:peopleId", peopleController.getPeopleById);
module.exports = router;