#!/usr/bin/env node
const smh = require("../index.js");

const config = smh.parseConfig();
smh.work(config);
