function getRandItem(kv) {
  const list = Object.keys(kv);
  const randomIndex = Math.floor(Math.random() * list.length);
  const key = list[randomIndex];

  return kv[key];
}

module.exports = {
  getRandItem,
};
