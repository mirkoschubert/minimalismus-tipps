"use strict";

const Config      = require('./config'),
      fs          = require('fs-extra'),
      rp          = require('app-root-path'),
      yaml        = require('js-yaml'),
      moment      = require('moment'),
      crawl       = require('metatag-crawler');

class Repair {

  constructor() {

    this.cfg = new Config();
    this.files = this.cfg.data.files;
  }

  static fillTheBlanks(links) {

    return new Promise((resolve, reject) => {
      var newLinks = [];

      links.forEach((link) => {

        crawl(link.url, (err, data) => {
          if (err) {
            console.log(err);
            return;
          }
          
          console.log(chalk.red(data.og.title || data.meta.title));
          console.log(chalk.dim(data.og.description || data.meta.description));
          console.log(chalk.yellow(data.meta.canonical));
          console.log(data.og.type + '\n');
        });
      });

      return resolve(newLinks);
    });

  }

}

module.exports = Repair;