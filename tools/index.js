#!/usr/bin/env node
'use strict';

const app         = require('commander'),
      chalk       = require('chalk'),
      fse         = require('fs-extra'),
      yaml        = require('js-yaml'),
      Check       = require('./lib/check'),
      Migrate     = require('./lib/migrate');

const check       = new Check(),
      migrate     = new Migrate();

app
  .version('1.0.0');

app
  .command('migrate:blogs')
  .description('Migrates Blogs from a ProcessWire JSON file')
  .action(() => migrate.blogs());

app
  .command('migrate:links')
  .description('Migrates Links from a ProcessWire JSON file')
  .option('-f, --file [file]', 'Path to the JSON file')
  .action((options) => migrate.links(options));

app
  .command('migrate:wordpress')
  .description('Migrates all links from a WordPress XML file')
  .action(() => migrate.wordpress());


app
  .command('check:blogs')
  .description('Checks Blogs database for broken links')
  .action(() => check.blogs());

app
  .command('check:links')
  .description('Checks all links of the directory')
  .action(() => check.links());

app
  .command('generate:blogs')
  .description('Generates all blog entries for Hugo')
  .action(function() {
    console.log('Generating blog sites...');
  });

app.parse(process.argv);
if (app.args.length === 0) app.help();

