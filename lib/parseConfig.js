/* jshint strict: true, curly: true, eqnull: true, expr: true, latedef: true, onevar: true, noarg: true, node: true, trailing: true, undef: true, unused: true */
"use strict";
var _ = require("lodash");
var arrify = require("arrify");
var chalk = require("chalk");
var fs = require("fs");
var log = console.log.bind(console);
var minimist = require("minimist");
var parseShell = require("shell-quote").parse;
var toml = require("toml");

var DEFAULT_CONFIG = {
    paths: [],
    ignores: [],
    includes: [],
    child: null,
    signal: "SIGINT",
    delay: 500,
    logEvents: false,
    dumpConfig: false
};

function arrifyWithRegexps(source) {
    return arrify(source).map(function(val) {
        if (_.isString(val)) {
            var regexpMatch = /^\/(.+)\/$/.exec(val);
            if (regexpMatch) {
                val = new RegExp(regexpMatch[1]);
            }
        }
        return val;
    });
}

function merge(target, source) {
    return _.merge(target, source, function(a, b) {
        if (_.isArray(a)) {
            return a.concat(b);
        }
    });
}

function processPresets(preset, config) {
    if (preset == "python" || preset == "django") {
        config.ignores.push(/pyc$/);
        config.ignores.push(/.+(node_modules|bower_components|__pycache__).+/);
        config.includes.push(/.py$/);
    }
    if (preset == "django" && _.isEmpty(config.child)) {
        config.child = parseShell("python manage.py runserver --noreload");
    }
}

module.exports = function parseConfig(argv) {
    var config = _.cloneDeep(DEFAULT_CONFIG);
    var args = minimist(argv || process.argv.slice(2));
    var configPath = _.first(arrify(args.c || args.config || args._[0] || "smh.toml"));
    if (fs.existsSync(configPath)) {
        log(chalk.white.bold("Parsing:", configPath));
        var configBuffer = fs.readFileSync(configPath, "UTF-8");
        var configFileData = null;
        if (/json$/.test(configBuffer)) {
            configFileData = JSON.parse(configBuffer);
        }
        else {
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
    if (_.isString(config.child)) {
        config.child = parseShell(config.child);
    }
    config.delay = parseInt(config.delay);
    config.logEvents = !!config.logEvents;
    config.dumpConfig = !!config.dumpConfig;
    if (_.isEmpty(config.paths)) {
        config.paths = ["."];
    }
    processPresets(config.preset, config);
    if (config.dumpConfig) {
        log(config);
    }
    return config;
};
