const express = require("express");
const { body } = require("express-validator");
const isAdmin = require("../middleware/is-admin");
const userController = require("../controllers/user");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/current", isAuth, userController.getCurrent);

router.put("/password", isAuth, userController.changePassword);

router.put("/", isAuth, userController.editUserName);

router.put(
  "/:userId/make-admin",
  isAuth,
  isAdmin,
  userController.giveAdminRole
);

router.put(
  "/:userId/remove-admin",
  isAuth,
  isAdmin,
  userController.removeAdminRole
);
router.get("/:userId", userController.getUser);

module.exports = router;
