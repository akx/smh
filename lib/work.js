const { debounce, isEmpty, partial, repeat, uniq } = require("lodash");
const anymatch = require("anymatch");
const chalk = require("chalk");
const chokidar = require("chokidar");
const cp = require("child_process");

const log = console.log.bind(console);

const DIVIDER = repeat("*", 80);

module.exports = function work(config) {
  let watcher = null;
  let changes = [];
  let child = null;

  function stopChild() {
    return new Promise((resolve) => {
      if (!child) {
        resolve(true);
        return;
      }
      child.kill(config.signal);
      child.on("exit", () => {
        resolve(true);
      });
      child = null;
    });
  }

  process.on("exit", stopChild);

  function startChild() {
    if (!Array.isArray(config.child)) {
      log(chalk.yellow("No child command configured"));
      return;
    }
    log(chalk.yellow(DIVIDER));
    const [command, ...args] = config.child;
    child = cp.spawn(command, args, {
      stdio: "inherit",
    });
    child.on("exit", () => {
      child = null;
    });
  }

  function reloadImmediately() {
    if (child && !changes.length) {
      // Child exists but no changes, why bother
      return;
    }
    changes = uniq(changes).sort();
    if (changes.length) {
      log(chalk.green(`Changes: ${changes}`));
      changes = [];
    }
    stopChild().then(startChild);
  }

  const queueReload = debounce(reloadImmediately, config.delay);

  function handleEvent(kind, path) {
    if (isEmpty(config.includes) || anymatch(config.includes, path)) {
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
    ignoreInitial: true,
  });

  ["add", "addDir", "change", "unlink", "unlinkDir", "change"].forEach(
    (event) => {
      watcher.on(event, partial(handleEvent, event));
    }
  );

  watcher.on("error", (error) => {
    log(chalk.red("Watch error"), error);
  });
  watcher.on("ready", () => {
    log(chalk.green("Ready to roll!"));
  });
  queueReload();
};
