#!/bin/node
const fs = require('fs');

const PREFIX = 'CFVAR_';

const { CF_VARS_FILE } = process.env;

const replacements = Object.keys(process.env)
  .filter(name => name.startsWith(PREFIX))
  .reduce((acc, name) => ({ ...acc, [name.replace(PREFIX, '')]: process.env[name] }), {});

const varsFileContents = fs.readFileSync(CF_VARS_FILE, 'utf8');
const updatedVarsFileContents = varsFileContents.replaceAll(/\(\(([a-z0-9_-]*)\)\)/ig, (_, name) => replacements[name]);
fs.writeFileSync(CF_VARS_FILE, updatedVarsFileContents);
