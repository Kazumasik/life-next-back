const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
    .select("-password")
    .populate({
      path: "bookmarks.reading",
      select: "-comments -description -bookmarkCount -totalRatings -ratings",
      populate: { path: "genres" },
    })
    .populate({
      path: "bookmarks.end_read",
      select: "-comments -description -bookmarkCount -totalRatings -ratings",
      populate: { path: "genres" },
    })
    .populate({
      path: "bookmarks.will_read",
      select: "-comments -description -bookmarkCount -totalRatings -ratings",
      populate: { path: "genres" },
    })
    .exec()
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 404;
        error.message = "User with this id does not exist.";
      }
      next(error);
    });
};
exports.getCurrent = (req, res, next) => {
  User.findById(req.userId, "_id nickname email role")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.send({
        id: user._id,
        nickname: user.nickname,
        email: user.email,
        role: user.role,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.editUserName = async (req, res, next) => {
  try {
    const { nickname } = req.body;
    const loggedInUserId = req.userId;

    const user = await User.findById(loggedInUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.nickname = nickname;
    await user.save();

    return res.status(200).json({
      id: user._id,
      nickname: user.nickname,
    });
  } catch (error) {
    console.error("Error editing user nickname:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while editing the user nickname" });
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const loggedInUserId = req.userId;

    const user = await User.findById(loggedInUserId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Проверяем, совпадает ли текущий пароль
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Хэшируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Обновляем пароль пользователя
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password successfully changed" });
  } catch (error) {
    console.error("Error changing user password:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while changing the user password" });
  }
};

exports.giveAdminRole = async (req, res, next) => {
  try {
    // Проверяем, есть ли права суперадмина
    if (!req.superAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Изменяем роль пользователя на "admin"
    user.role = "admin";
    await user.save();

    return res
      .status(200)
      .json({ message: "User role successfully changed to admin" });
  } catch (error) {
    console.error("Error changing user role:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while changing the user role" });
  }
};

exports.removeAdminRole = async (req, res, next) => {
  try {
    // Проверяем, есть ли права суперадмина
    if (!req.superAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Удаляем роль "admin" и устанавливаем роль "user"
    user.role = "user";
    await user.save();

    return res.status(200).json({ message: "Admin role successfully removed" });
  } catch (error) {
    console.error("Error removing admin role:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while removing the admin role" });
  }
};
