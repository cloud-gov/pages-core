const deref = require('json-schema-deref-sync');
const { validate } = require('jsonschema');
const YAML = require('yamljs');

const swagger = YAML.load('public/swagger/index.yml');
const schema = deref(swagger, {
  baseFolder: `${process.cwd()}/public/swagger`,
  failOnMissing: true,
});

const validateAgainstJSONSchema = (action, path, statusCode, response) => {
  const actionLower = action.toLowerCase();
  const pathLower = path.toLowerCase();
  const statusCodeInt = parseInt(statusCode, 10);
  const responseSchema = schema.paths[pathLower][actionLower].responses[statusCodeInt].schema;

  const result = validate(response, responseSchema);

  if (result.errors.length) {
    console.error(result.errors); // eslint-disable-line no-console
    throw new Error(
      `Failed to validate against definition: ${actionLower} ${pathLower} ${statusCodeInt}`
    );
  }
};

module.exports = validateAgainstJSONSchema;
