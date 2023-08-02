const userloggedoff = (req, res, next) => {
  try {
      if (req.session.userLogin) {
          res.redirect('/home');
      } else {
          next();
      }
  } catch (error) {
      console.log(error.message);
  }
};

const userloggedin = (req, res, next) => {
  try {
      if (req.session.userLogin) {
          next();
      } else {
          res.redirect('/');
      }
  } catch (error) {
      console.log(error.message);
  }
};

module.exports = {
  userloggedin,
  userloggedoff,
};
