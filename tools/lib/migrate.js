"use strict";

const Promise   = require('promise'),
      Config    = require('./config'),
      chalk     = require('chalk'),
      fs        = require('fs-extra'),
      rp        = require('app-root-path'),
      moment    = require('moment'),
      yaml      = require('js-yaml');

class Migrate {

  constructor() {

    this.cfg = new Config();
    this.files = this.cfg.data.files;
  }

  blogs() {
    var self = this,
        blog = JSON.parse(fs.readFileSync(rp + this.files.blogs.json)),
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

    fs.writeFileSync(rp + self.files.blogs.yaml, yaml.safeDump(data));
    console.log(chalk.yellow(blog.pages.length) + ' Blogs were successfully migrated!');
  }

  /**
   * Migrates Links and Categories from a ProcessWire JSON file
   * 
   * @param {*} options 
   */
  links(options) {

    var self        = this,
        file        = (typeof options.file !== 'undefined') ? options.file : rp + this.files.links.json,
        links_json  = (fs.existsSync(file)) ? JSON.parse(fs.readFileSync(file)) : null,
        links       = { entries: [] },
        categories  = { entries: [] };

    if (links_json !== null) {

      links_json.pages.forEach(el => {
        if (el.template === 'category-page') {
          categories.entries.push({
            title: el.data.title,
            description: "",
            path: el.path,
            weight: el.settings.sort
          });
        } else if (el.template === 'link') {
          links.entries.push({
            title: el.data.title,
            description: el.data.link_description,
            date: moment().format(),
            url: el.data.link_url,
            related_blog: el.data.related_blog, 
            path: el.path,
            weight: el.settings.sort
          });
        }
      });

      fs.writeFileSync(rp + self.files.links.yaml, yaml.safeDump(links));
      fs.writeFileSync(rp + self.files.categories.yaml, yaml.safeDump(categories));
      console.log('\n' + chalk.yellow(links.entries.length) + ' links & ' + chalk.yellow(categories.entries.length) + ' categories were saved.\n');
    }
  }

  wordpress() {

  }
}

module.exports = Migrate;