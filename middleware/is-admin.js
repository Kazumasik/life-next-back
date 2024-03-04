const User = require('../models/user');

const isAdmin = (req, res, next) => {
  User.findById(req.userId).then((user)=>{
    if (user.role === "admin" || user.role === "superadmin") {
      if(user.role === "superadmin"){
        req.superAdmin = true;
      }
      next();
    } else {
      res
        .status(403)
        .json({ error: "You dont have admin permissions." });
    }
  })
};

module.exports = isAdmin;