"use strict";

const Promise     = require('promise'),
      Config      = require('./config'),
      chalk       = require('chalk'),
      fs          = require('fs-extra'),
      rp          = require('app-root-path'),
      yaml        = require('js-yaml'),
      linkCheck   = require('link-check'),
      inquirer    = require('inquirer');

class Check {

  constructor() {

    this.cfg = new Config();
    this.files = this.cfg.data.files;
  }

  blogs() {

    var self = this;
    try {
      var blogs = yaml.safeLoad(fs.readFileSync(rp + self.files.blogs.yaml, 'utf-8'));
      console.log("\nChecking " + chalk.yellow(blogs.entries.length) + " blog links...\n");
      var i = 1;
      blogs.entries.forEach(blog => {
        linkCheck(blog.url, function(err, res) {
          if (err) {
            console.log(err);
            return;
          }
          if (res.status === 'alive') {
            console.log(i + '. ' + res.link + " is " + chalk.green(res.status) + " (" + res.statusCode + ")");
          } else if (res.status === 'dead') {
            console.log(i + ". " + res.link + " is " + chalk.red(res.status) + " (" + res.statusCode + ")");
          }
          i++;
        });
      });
    } catch(e) {
      console.log(e);
    }
  }


  links(options) {

    var self = this;
    try {
      var links = yaml.safeLoad(fs.readFileSync(rp + self.files.links.yaml, 'utf-8'));
      console.log("\nChecking " + chalk.yellow(links.entries.length) + " directory links...\n");
      var i = 1, d = 1;
      links.entries.forEach(link => {
        linkCheck(link.url, function(err, res) {
          if (err) {
            console.log(err);
            return;
          }
          if (res.status === 'alive') {
            if (!options.dead) console.log(i + '. ' + res.link + " is " + chalk.green(res.status) + chalk.dim(" (" + res.statusCode + ")"));
          } else if (res.status === 'dead') {
            console.log(i + ". " + res.link + " is " + chalk.red(res.status) + chalk.dim(" (" + res.statusCode + ")"));
            d++;
          }
          i++;
        });
      });
      // console.log('\n' + chalk.red(d) + ' Links found.\n');
    } catch(e) {
      console.log(e);
    }
  }

  duplicates() {

    const self = this;
    try {
      var links = yaml.safeLoad(fs.readFileSync(rp + self.files.links.yaml, 'utf-8')).entries;
      console.log("\nChecking " + chalk.yellow(links.length) + " directory links...\n");

      
      var unique = [], dupes = [];

      links.forEach((link, id) => {
        if (unique.indexOf(link.url) === -1) {
          unique.push(link.url);
        } else {
          dupes.push(id);
        }
      });

      console.log("\n" + chalk.yellow(dupes.length) + " of " + chalk.yellow(links.length) + " directory links are duplicates:\n");
      dupes.forEach((id) => {
        console.log(chalk.green(id + ": ") + links[id].url);
      });
      console.log("\n");
      inquirer.prompt({
        type: 'confirm',
        name: 'delete',
        message: 'Do you want to delete them?',
        default: false
      })
      .then((res) => {
        if (res.delete) {
          var dump = { entries: [] };
          links.forEach((link, id) => {
            if (dupes.indexOf(id) === -1) dump.entries.push(link);
          });

          fs.writeFile(rp + self.files.links.yaml, yaml.safeDump(dump), (err) => {
            if (err) throw err;
            console.log('\n' + dupes.length + chalk.green(" links were successfully deleted!\n"));
          });
        }
      })
      .catch((err) =>{
        console.log(err);
      });

    } catch(e) {
      console.log(e);
    }
  }
}

module.exports = Check;