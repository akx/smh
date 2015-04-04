/* jshint strict: true, curly: true, eqnull: true, expr: true, latedef: true, onevar: true, noarg: true, node: true, trailing: true, undef: true, unused: true */
"use strict";
var _ = require("lodash");
var anymatch = require("anymatch");
var chalk = require("chalk");
var chokidar = require("chokidar");
var cp = require("child_process");
var log = console.log.bind(console);
var Promise = require("bluebird");

module.exports = function work(config) {
    var watcher = null;
    var changes = [];
    var child = null;

    function stopChild() {
        return new Promise(function(resolve) {
            if (!child) {
                resolve(true);
                return;
            }
            child.kill(config.signal);
            child.on("exit", function() {
                resolve(true);
            });
            child = null;
        });
    }

    process.on("exit", stopChild);

    function startChild() {
        if (!_.isArray(config.child)) {
            log(chalk.yellow("No child command configured"));
            return;
        }
        log(chalk.yellow(_.repeat("*", 80)));
        child = cp.spawn(_.first(config.child), _.rest(config.child), {stdio: "inherit"});
        child.on("exit", function() {
            child = null;
        });
    }

    function reloadImmediately() {
        if (child && !changes.length) { // Child exists but no changes, why bother
            return;
        }
        changes = _.uniq(changes).sort();
        if (changes.length) {
            log(chalk.green("Changes: " + changes));
            changes = [];
        }
        stopChild().then(startChild);
    }

    var queueReload = _.debounce(reloadImmediately, config.delay);

    function handleEvent(kind, path) {
        if (_.isEmpty(config.includes) || anymatch(config.includes, path)) {
            if (config.logEvents) {
                log(kind, path);
            }
            changes.push(path);
            queueReload();
        }
    }

    watcher = chokidar.watch(config.paths, {
        ignored: config.ignores,
        persistent: true,
        ignoreInitial: true
    });

    _.each(["add", "addDir", "change", "unlink", "unlinkDir", "change"], function(e) {
        watcher.on(e, _.partial(handleEvent, e));
    });

    watcher.on("error", function(error) {
        log(chalk.red("Watch error"), error);
    });
    watcher.on("ready", function() {
        log(chalk.green("Ready to roll!"));
    });
    queueReload();
};
