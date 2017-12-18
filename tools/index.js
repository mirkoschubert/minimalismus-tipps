#!/usr/bin/env node
'use strict';

const app         = require('commander'),
      chalk       = require('chalk'),
      fse         = require('fs-extra'),
      yaml        = require('js-yaml'),
      Check       = require('./lib/check');

const blog_json_file  = '../data/import.blogs.json',
      blog_yml_file   = '../data/blogs.yml',
      links_json_file = '../data/import.links.json',
      longs_yml_file  = '../data.links.yml';

const check = new Check();

app
  .version('1.0.0');

app
  .command('migrate:blogs')
  .description('Migrates Blogs from a ProcessWire JSON file')
  .action(function() {
    var blog = JSON.parse(fse.readFileSync(blog_json_file)),
        data = [];
    blog.pages.forEach(el => {
      data.push({
        title: el.data.title,
        slogan: el.data.blog_slogan,
        description: el.data.blog_description,
        owner: el.data.blog_owner,
        slug: el.settings.name,
        url: el.data.blog_url,
        feed_url: el.data.blog_feed
      });
    });
    fse.writeFileSync(blog_yml_file, yaml.safeDump(data));
    console.log(chalk.red(blog.pages.length) + ' Blogs were successfully migrated!');
  });

app
  .command('migrate:links')
  .description('Migrates Links from a ProcessWire JSON file')
  .action(function() {
    console.log('Migrating links...');
  });

app
  .command('check:blogs')
  .description('Checks Blogs database for broken links')
  .action(function() {
    check.blogs();

  });

app
  .command('check:links')
  .description('Checks all links of the directory')
  .action(function() {
    console.log('Start checking...');
  });

app
  .command('generate:blogs')
  .description('Generates all blog entries for Hugo')
  .action(function() {
    console.log('Generating blog sites...');
  });

app.parse(process.argv);
if (app.args.length === 0) app.help();

