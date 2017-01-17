const deref = require('json-schema-deref-sync')
const validate = require('jsonschema').validate
const YAML = require("yamljs")

const swagger = YAML.load("assets/swagger/index.yml")
const schema = deref(swagger, {
  baseFolder: process.cwd() + "/assets/swagger",
  failOnMissing: true,
})

const validateAgainstJSONSchema = (action, path, statusCode, response) => {
  action = action.toLowerCase()
  path = path.toLowerCase()
  statusCode = parseInt(statusCode)

  const responseSchema = schema.paths[path][action].responses[statusCode].schema
  const result = validate(response,responseSchema)

  if (result.errors.length) {
    console.error(result.errors)
    throw new Error(`Failed to validate against definition: ${definition}`)
  }
}

module.exports = validateAgainstJSONSchema
