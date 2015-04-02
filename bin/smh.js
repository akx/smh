#!/usr/bin/env node
var smh = require("../index.js");
var config = smh.parseConfig();
smh.work(config);
