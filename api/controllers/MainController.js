module.exports = {
  index: function(req, res) {
    if (req.session.authenticated) {
      res.sendfile('assets/index.html');
    } else {
      res.redirect("/")
    }
  }
};
