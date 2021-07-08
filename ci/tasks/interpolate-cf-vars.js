#!/bin/node
const fs = require('fs');
const yaml = require('js-yaml');

const PREFIX = 'CFVAR_';

const { CF_VARS_FILE } = process.env;

const replacements = Object.keys(process.env)
  .filter(name => name.startsWith(PREFIX))
  .reduce((acc, name) => ({ ...acc, [name.replace(PREFIX, '')]: process.env[name] }), {});

const replacer = (key, value) => {
  if (!key || typeof value !== 'string') return value;
  return value.replace(/\(\(([a-z0-9_-]*)\)\)/i, (_, name) => replacements[name] || value);
};

const varsFile = yaml.load(fs.readFileSync(CF_VARS_FILE, 'utf8'));
fs.writeFileSync(CF_VARS_FILE, yaml.dump(varsFile, { replacer }));
