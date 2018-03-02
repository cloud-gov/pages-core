module.exports = (data, { res }) => {
  res.status(200);
  return res.json(data);
};
