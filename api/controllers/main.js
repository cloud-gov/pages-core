module.exports = {
  index: function(req, res) {
    if (req.session.authenticated) {
      res.sendfile('public/index.html');
    } else {
      res.redirect("/")
    }
  }
};
