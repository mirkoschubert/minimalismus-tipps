"use strict";

const Config      = require('./config'),
      fs          = require('fs-extra'),
      rp          = require('app-root-path'),
      chalk       = require('chalk'),
      yaml        = require('js-yaml'),
      moment      = require('moment');


class Generate {

  constructor() {

    this.cfg = new Config();
    this.files = this.cfg.data.files;
  }

  blogs() {

    var self    = this,
        blogs   = yaml.safeLoad(fs.readFileSync(rp + self.files.blogs.yaml, 'utf-8'));

    if (Generate.noDuplicateSlugs(blogs.entries)) {
      blogs.entries.forEach(blog => {
        if (!fs.existsSync(Generate.path2file(blog.path))) {
          
          try {
            Generate.saveBlogEntry(blog, Generate.path2file(blog.path));
            console.log(chalk.red(blog.title) + ' saved.');
          } catch (err) {
            console.log(err);
          }
        }
      });
    }
  }

  links() {


  }

  static saveBlogEntry(blog, filename) {

    let data = { title: blog.title, date: moment(new Date()).format(), draft: true };
    let frontmatter = "---\n" + yaml.safeDump(data) + "---\n\n";
    let content = blog.description;

    fs.writeFile(filename, frontmatter + content, (err) => {
      if (err) throw err;
      return true;
    });
  }

  static noDuplicateSlugs(arr) {

    let slugs = [];

    arr.forEach(v => {
      if (v.path != ( undefined || null || '')) {
        let all = v.path.split('/').filter((x) => { return (x != (undefined || null || '')); });
        slugs.push(all[all.length - 1]);
      }
    });
    return (slugs.filter( function( item, index, inputArray ) { return inputArray.indexOf(item) == index; }).length === slugs.length);
  }

  static path2file(path, type) {

    let p         = '/',
        pathType  = type || 'blogs',
        sitePath  = path.split('/').filter((x) => { return (x != (undefined || null || '')) }),
        rootPath  = rp.path.split('/').filter((x) => { return (x != (undefined || null || '')) });

    if (sitePath[0] !== pathType) return;

    for (let i = 0; i < rootPath.length - 1; i++) {
      p += rootPath[i] + '/';
    }
    p += 'content/';
    for (let i = 0; i < sitePath.length; i++) {
      p += (i + 1 !== sitePath.length) ? sitePath[i] + '/' : sitePath[i] + '.md';
    }
    return p;
  }


}

module.exports = Generate;