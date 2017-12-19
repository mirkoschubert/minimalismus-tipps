"use strict";

const Config      = require('./config');

class Database {

  construtor(type) {

    this.type = (type === 'links' || 'blogs' || 'categories') ? type : 'links';
    this.cfg = new Config();
    this.file = this.cfg.data.files[this.type].yaml;
  }

  load() {

  }

  edit() {

  }

  save() {

  }

  delete() {

  }

  populate() {
    
  }
}

module.exports = Database;