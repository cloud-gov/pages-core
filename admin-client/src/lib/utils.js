function formToObj(form) {
  return [...form.elements]
    .filter((e) => e.name)
    .reduce((acc, e) => ({ ...acc, [e.name]: e.value }), {});
}

function objToQueryString(obj = {}) {
  const searchParams = new URLSearchParams();
  Object.keys(obj).forEach((key) => {
    searchParams.set(key, obj[key]);
  });
  return searchParams.toString();
}

export {
  formToObj,
  objToQueryString,
};
