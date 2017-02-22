module.exports = (data, { req, res }) => {
  res.status(200)
  return res.json(data)
}
