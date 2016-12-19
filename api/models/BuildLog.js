module.exports = {
  schema: true,
  attributes: {
    source: {
      type: 'string',
      required: true,
    },
    output: {
      type: 'string',
      required: true,
    },
    build: {
      model: 'build',
      required: true
    },
  },
}
