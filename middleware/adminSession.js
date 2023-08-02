const adminloggedoff = (req, res, next) => {
    try {
      if (req.session.login) {
        res.redirect('/admin/home');
      } else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const adminloggedin = (req, res, next) => {
    try {
      if (req.session.login) {
        next();
      } else {
        res.redirect('/admin');
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  module.exports = {
    adminloggedin,
    adminloggedoff,
  };
  