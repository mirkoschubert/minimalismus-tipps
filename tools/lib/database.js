"use strict";

const Config      = require('./config'),
      fs          = require('fs-extra'),
      rp          = require('app-root-path'),
      yaml        = require('js-yaml');

class Database {

  constructor(type) {

    this.type = (type === 'links' || type === 'blogs' || type === 'categories') ? type : 'links';
    this.cfg = new Config();
    this.file = rp + this.cfg.data.files[this.type].yaml;
    this.data = yaml.safeLoad(fs.readFileSync(this.file, 'utf-8')).entries;
  }


  add(url) {

    let link = (url.substr(-1) !== '/') ? url + '/': url;
    let found = this.data.find((e) => { return e.url === link; });
    if (typeof found === 'object') {
      console.log('Link is already there!');
    } else if (typeof found === 'undefined') {
      console.log("Let's go!");
    }
  }

  edit(url) {

    let link = (url.substr(-1) !== '/') ? url + '/': url;
    let found = this.data.find((e) => { return e.url === link; });
    if (found.length > 1) {
      console.log('More than one object!');
    } else {
      console.log(found);
    }
  }

  delete(url) {

    let link = (url.substr(-1) !== '/') ? url + '/': url;
    let found = this.data.find((e) => { return e.url === link; });
    if (found.length > 1) {
      console.log('More than one object!');
    } else {
      console.log(found);
    }
  }

}

module.exports = Database;