/* eslint-disable no-param-reassign,radix */
const { cloneDeep, first, isEmpty, isString, mergeWith } = require("lodash");
const chalk = require("chalk");
const fs = require("fs");
const minimist = require("minimist");
const parseShell = require("shell-quote").parse;
const toml = require("toml");
const arrify = require("./arrify");

const log = console.log.bind(console);

const DEFAULT_CONFIG = {
  paths: [],
  ignores: [],
  includes: [],
  child: null,
  signal: "SIGINT",
  delay: 500,
  logEvents: false,
  dumpConfig: false,
};

function arrifyWithRegexps(source) {
  return arrify(source).map((val) => {
    if (isString(val)) {
      const regexpMatch = /^\/(.+)\/$/.exec(val);
      if (regexpMatch) {
        val = new RegExp(regexpMatch[1]);
      }
    }
    return val;
  });
}

function merge(target, source) {
  return mergeWith(target, source, (a, b) => {
    if (Array.isArray(a)) {
      return a.concat(b);
    }
    return undefined;
  });
}

function processPresets(preset, config) {
  if (preset === "python" || preset === "django") {
    config.ignores.push(/pyc$/);
    config.ignores.push(/.+(node_modules|bower_components|__pycache__).+/);
    config.includes.push(/.py$/);
  }
  if (preset === "django" && isEmpty(config.child)) {
    config.child = parseShell("python manage.py runserver --noreload");
  }
}

module.exports = function parseConfig(argv) {
  let config = cloneDeep(DEFAULT_CONFIG);
  const args = minimist(argv || process.argv.slice(2));
  const configPath = first(
    arrify(args.c || args.config || args._[0] || "smh.toml")
  );
  if (fs.existsSync(configPath)) {
    log(chalk.white.bold("Parsing:", configPath));
    const configBuffer = fs.readFileSync(configPath, "UTF-8");
    let configFileData;
    if (/json$/.test(configBuffer)) {
      configFileData = JSON.parse(configBuffer);
    } else {
      configFileData = toml.parse(configBuffer);
    }
    config = merge(config, configFileData);
  } else {
    log(chalk.white.bold("Configuration file does not exist:", configPath));
  }
  delete args._;
  delete args.config;
  delete args.c;
  config = merge(config, args);

  config.paths = arrify(config.paths);
  config.ignores = arrifyWithRegexps(config.ignores);
  config.includes = arrifyWithRegexps(config.includes);
  if (isString(config.child)) {
    config.child = parseShell(config.child);
  }
  config.delay = parseInt(config.delay);
  config.logEvents = !!config.logEvents;
  config.dumpConfig = !!config.dumpConfig;
  if (isEmpty(config.paths)) {
    config.paths = ["."];
  }
  processPresets(config.preset, config);
  if (config.dumpConfig) {
    log(config);
  }
  return config;
};
