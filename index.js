var parseConfig = require("./lib/parseConfig");
var work = require("./lib/work");
var cli = function cli() {
    work(parseConfig());
};

module.exports = {
    cli: cli,
    work: work,
    parseConfig: parseConfig,
};

if (require.main === module) {
    cli();
}
