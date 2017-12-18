"use strict";

const Promise   = require('promise'),
      Config    = require('./config'),
      chalk     = require('chalk'),
      fs        = require('fs-extra'),
      rp        = require('app-root-path'),
      moment    = require('moment'),
      yaml      = require('js-yaml'),
      xmlParser = require('xml2js'),
      getUrls   = require('get-urls');

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

  wordpress(options) {

    var self      = this,
        file      = (typeof options.file !== 'undefined') ? options.file : rp + this.files.wordpress.xml,
        links     = { entries: [] };

    return new Promise((resolve, reject) => {
      const data = (fs.existsSync(file)) ? fs.readFileSync(file) : null;

      if (!data) return reject(new Error("Could't read the file."));

      return Promise
        .resolve()
        .then(() => {
          console.log('XML loaded...');
          return Migrate.postsFromXML(data.toString());
        })
        .then((posts) => {
          console.log('Posts found...');
          return Migrate.filterPages(posts);
        })
        .then((pages) => {
          console.log(chalk.yellow(pages.length) + ' Pages found.\n');
          var i = 1;
          pages.forEach(page => {
            console.log(i + '. ' + page.title[0]);
            i++;
          });
        });
    });
  }

  static filterPages(posts) {
    return new Promise((resolve, reject) => {

      var filtered = [];

      posts.forEach((post) => {
        var type = post["wp:post_type"][0];
        if (type === 'page') {
          if (post.title[0] !== 'Kontakt' && post.title[0] !== 'Impressum' && post.title[0] !== 'Datenschutz' && post.title[0] !== 'About' && post.title[0] !== 'News') {
            filtered.push(post);
          }
        } 
      });

      return resolve(filtered);
    });
  }

  static convertPages(pages) {

  }

  static convertPost2(post) {

    var data = [];

    var urls = getUrls(post['content:encoded']);
    console.log(urls);

/*     var link = {};
    link.title = '';
    link.description = '';
    link.date = moment(new Date(post.pubDate)).format() || moment(new Date(post["wp:post_date"])).format() || moment(new Date()).format();
    link.url = '';
    link.related_blog = '/blogs/';
    link.path = '/links/';
    link.old_category = post.title;
    

    console.log(data);
 */
  }

  static getAllLinks(post) {

    return new Promise((resolve, reject) => {

    });
  }

  static postsFromXML (text) {
    return new Promise((resolve, reject) => {
      xmlParser.parseString(text, (err, xml) => {
        if (err) {
          return reject(err);
        }

        if (!(xml.rss && xml.rss.channel && 0 < xml.rss.channel.length && xml.rss.channel[ 0 ].item && 0 < xml.rss.channel[ 0 ].item.length)) {
          return reject(new Error('Invalid WordPress Post XML.'));
        }

        return resolve(xml.rss.channel[ 0 ].item);
      });
    });
  }

}

module.exports = Migrate;