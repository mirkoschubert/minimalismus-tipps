#!/usr/bin/env node
'use strict';

const app         = require('commander'),
      tab         = require('tabtab')({ name: 'mnml' }),
      { URL }     = require('url'),
      chalk       = require('chalk'),
      fse         = require('fs-extra'),
      yaml        = require('js-yaml'),
      Check       = require('./lib/check'),
      Migrate     = require('./lib/migrate'),
      Generate    = require('./lib/generate'),
      Database    = require('./lib/database');

const check       = new Check(),
      migrate     = new Migrate(),
      generate    = new Generate();

tab.on('mnml', (data, done) => {
  done(null, ['add:link', 'edit:link', 'delete:link', 'check:blogs', 'check:links', 'check:duplicates', 'generate:all', 'generate:links', 'generate:blogs', 'generate:categories']);
});

tab.start();


app
  .version(require('./package.json').version);

/* app
  .command('migrate:blogs')
  .description('Migrates Blogs from a ProcessWire JSON file')
  .action(() => migrate.blogs());

app
  .command('migrate:links')
  .description('Migrates Links from a ProcessWire JSON file')
  .option('-f, --file [file]', 'Path to the JSON file')
  .action((options) => migrate.links(options));

app
  .command("migrate:wordpress")
  .description("Migrates all links from a WordPress XML file")
  .option("-f, --file [file]", "Path to the WordPress XML file")
  .action((options) => migrate.wordpress(options)); */

app
  .command('add:link [url]')
  .description('Adds a new link to the Database')
  .action((url) => {
    if (typeof url != 'undefined') {
      const db = new Database('links');
      db.add(new URL(url));  
    } else {
      console.log("\nYou have to set a url to add a link!\n");
    }
    
  });
  
app
  .command('edit:link [url]')
  .description('Edits a link from the Database')
  .action((url) => {
    if (typeof url != 'undefined') {
      const db = new Database('links');
      db.edit(new URL(url));
    } else {
      console.log("\nYou have to set a url to edit a link!\n");
    }
  });

app
  .command('edit:links')
  .description('Edits links in an interactive mode')
  .action(() => {
    const db = new Database('links');
    db.editall();
  });

app
  .command('delete:link [url]')
  .description('Deletes a link from the Database')
  .action((url) => {
    if (typeof url != 'undefined') {
      const db = new Database('links');
      db.delete(new URL(url));
    } else {
      console.log("\nYou have to set a url to delete a link!\n");
    }
  });

app
  .command('check:blogs')
  .description('Checks Blogs database for broken links')
  .action(() => check.blogs());

app
  .command('check:links')
  .description('Checks all links of the directory')
  .option("-d, --dead", 'Show only dead links')
  .action((options) => check.links(options));

app
  .command('check:duplicates')
  .description('Checks links database for duplicates')
  .action(() => check.duplicates());


app
  .command('generate:all')
  .description('Generates all blog entries for Hugo')
  .action(() => {
    generate.blogs();
    generate.categories();
    generate.links();
  });

app
  .command('generate:blogs')
  .description('Generates all blog entries for Hugo')
  .action(() => generate.blogs());

app
  .command('generate:links')
  .description('Generates all link entries for Hugo')
  .action(() => generate.links());

app
  .command('generate:categories')
  .description('Generates all link categories for Hugo')
  .action(() => generate.categories());


app.parse(process.argv);
if (app.args.length === 0) app.help();

