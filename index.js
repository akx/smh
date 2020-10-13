const parseConfig = require("./lib/parseConfig");
const work = require("./lib/work");

const cli = function cli() {
  work(parseConfig());
};

module.exports = {
  cli,
  work,
  parseConfig,
};

if (require.main === module) {
  cli();
}
