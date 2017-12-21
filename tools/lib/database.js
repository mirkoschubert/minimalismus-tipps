"use strict";

const Config      = require('./config'),
      { URL }     = require('url'),
      fs          = require('fs-extra'),
      rp          = require('app-root-path'),
      chalk       = require('chalk'),
      yaml        = require('js-yaml'),
      moment      = require('moment'),
      crawl       = require('metatag-crawler'),
      linkCheck   = require('link-check'),
      inquirer    = require('inquirer');

class Database {

  constructor(type) {

    this.type = (type === 'links' || type === 'blogs' || type === 'categories') ? type : 'links';
    this.cfg = new Config();
    this.file = rp + this.cfg.data.files[this.type].yaml;
    this.data = yaml.safeLoad(fs.readFileSync(this.file, 'utf-8')).entries;
  }


  add(url) {

    let link = (url.href.substr(-1) !== '/') ? url.href + '/': url.href;
    let found = this.data.find((e) => {
      return this.serializeURL(url).some(u => {
        return e.url === u;
      });
    });
    if (typeof found === 'object') {
      console.log(chalk.red('\nLink is already there! Nothing to add...\n'));
    } else if (typeof found === 'undefined') {
      console.log("\nChecking link...");
      this.checkLink(link)
        .then((res) => {
          if (res === 'alive') {
            console.log("Looking for meta data...\n");
            return this.fetchMetaData(link, { description_length: 280 });
          } else {
            console.log(chalk.red("The link is not available at the moment. Please try it later again."));
          }
        })
        .then((meta) => {

          if (meta.canonical !== '' && meta.canonical !== link) {

            console.log("You've been forwarded! Checking Link again...");
            found = this.data.find((e) => {
              return this.serializeURL(new URL(meta.canonical)).some(u => {
                return e.url === u;
              });
            });
            if (typeof found === 'object') {
              console.log(chalk.red("\nLink is already there! Nothing to add...\n"));
            } else if (typeof found === 'undefined') {
              let data = {};
              data.title = meta.title;
              data.description = meta.description;
              data.date = moment().format(),
              data.url = (meta.canonical !== '') ? meta.canonical : link;
              data.related_blog = this.getBlogFromURL(url);
              data.path = '/links/';
              data.draft = true;

              this.showMetadata(data);
              return this.getMissingData(data);
            }
          }
        })
        .then((meta) => {
          this.saveMetadata(meta, true);
        })
        .then((meta) => {
          if (typeof meta !== 'undefined') console.log(meta.title + chalk.green(' was successfully saved!'));
        })
        .catch((err) => {
          console.log(err);
        });

    }
  }


  /**
   * Edits a link in the link database with a given url
   * 
   * @param {string} url 
   */
  edit(url) {

    let found = this.data.find((e) => {
      return this.serializeURL(url).some(u => {
        return e.url === u;
      });
    });

    if (typeof found === 'undefined') {
      console.log("Link isn't in the database! Do you want to create a new entry?");
    } else if (found.length > 1) {
      console.log('More than one object was found! Please remove duplicates from the database.');
    } else {
      console.log("\nChecking link...");
      this.checkLink(found.url)
        .then((res) => {
          if (res === 'alive') {
            console.log("Looking for meta data...");
            return this.fetchMetaData(found.url, { description_length: 280 });
          } else {
            new Promise.resolve().reject(new Error("The link is not available at the moment. Please try it later again."));
          }
        })
        .then((meta) => {

          let data = {};
          data.title = (found.title === '') ? meta.title : found.title;
          data.description = (found.description === '') ? meta.description : found.description;
          data.date = moment().format(),
          data.url = (found.url !== meta.canonical) ? meta.canonical : found.url;
          data.related_blog = (found.related_blog === '/blogs/') ? this.getBlogFromURL(url) : found.related_blog;
          data.path = (found.path === '/links/') ? '/links/' : found.path;
          data.old_category = found.old_category;
          data.draft = found.draft;
          
          this.showMetadata(data);

          return this.getMissingData(data);
        })
        .then((meta) => {
          this.saveMetadata(meta);
        })
        .then((meta) => {
          if (typeof meta !== 'undefined') console.log(meta.title + chalk.green(' was successfully saved!'));
        })
        .catch((err) => {
          console.log(err);
        })
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


  saveMetadata(meta, newEntry) {

    this.showMetadata(meta);
    inquirer.prompt({
      type: 'confirm',
      name: 'save',
      message: 'Do you wish to save the metadata like above?',
      default: false
    }).then((res) => {
      if (res.save) {

        let newE = newEntry || false;

        if (newE) {
          // add new entry
          this.data.push(meta);
        } else {
          // edit existing entry
          let urls = this.serializeURL(new URL(meta.url));

          this.data.forEach((entry, id) => {
            if (urls.some(u => { return (entry.url === u);})) {
              this.data[id] = meta;
            }
          });            
        }
        // save data
        fs.writeFile(this.file, yaml.safeDump({ entries: this.data }), (err) => {
          if (err) throw err;
          console.log('\n' + meta.title + chalk.green(" was successfully saved!\n"));
        });
      }
    });
  }


  /**
   * Uses Inquirer to ask for missing metadata
   * 
   * @param {object} meta 
   * @returns {Promise object} meta
   */
  getMissingData(meta) {

    return new Promise ((resolve, reject) => {

      let data = meta;
      let questions = [];

      // Missing Title
      if (meta.title === '') questions.push({
        type: 'input',
        name: 'title',
        message: 'Title:'
      });
      // Missing Description
      if (meta.description === '') questions.push({
        type: 'input',
        name: 'description',
        message: 'Description:',
      });
      // Missing category
      if (meta.path === '/links/') {
        let catChoices = this.fetchCategoryChoices();

        questions.push({
          type: 'list',
          name: 'path',
          message: 'Category ('+ meta.old_category + '):',
          choices: catChoices
        });
      }
      // Ask for Draft
      questions.push({
        type: 'confirm',
        name: 'draft',
        message: 'Save it as a draft?',
        default: true
      });

      inquirer.prompt(questions).then((answers) => {
        for (const key in answers) {
          if (answers.hasOwnProperty(key) ) {
            data[key] = answers[key];
          }
        }
        delete data.old_category;
        resolve(data);
      });
    });
  }

  /**
   * Gets the Blog path from an article URL
   * 
   * @param {object} url
   * @returns {string} found
   */
  getBlogFromURL(url) {

    let urls = this.serializeURL(new URL(url.protocol + '//' + url.hostname + '/'));
    let file = rp + this.cfg.data.files.blogs.yaml;
    let blogs = yaml.safeLoad(fs.readFileSync(file, 'utf-8')).entries;

    let found = blogs.find((blog) => {
      return urls.some(u => {
        return (blog.url === u);
      });
    });

    return (typeof found !== 'undefined') ? found.path : null;
  }

  /**
   * Serializes every possible combination of a url
   * 
   * @param {object} url
   * @returns {array of strings} urls 
   */
  serializeURL(url) {

    let urls = [];

    if (url.hostname.indexOf('www.') !== -1) {
      // with www
      var newURL = (url.href.substr(-1) !== '/') ? url.href + '/' : url.href;
      var altURL = url.protocol + '//' + url.hostname.replace('www.', '') + url.pathname;
      altURL = (altURL.substr(-1) !== '/') ? altURL + '/' : altURL;
    } else {
      // without www
      var newURL = (url.href.substr(-1) !== '/') ? url.href + '/' : url.href;
      var altURL = url.protocol + '//www.' + url.hostname + url.pathname;
      altURL = altURL.substr(-1) !== "/" ? altURL + "/" : altURL;
    }

    urls.push(newURL);
    urls.push(newURL.substr(0, newURL.length - 1));
    urls.push(altURL);
    urls.push(altURL.substr(0, altURL.length - 1));

    return urls;
  }

  /**
   * Fetches all categories
   * 
   * @returns {array} categories
   */
  fetchCategoryChoices() {

    let choices = [];
    let file = rp + this.cfg.data.files.categories.yaml;
    let categories = yaml.safeLoad(fs.readFileSync(file, "utf-8")).entries;

    let parent = [];
    let count = [1];
    
    categories.forEach((category) => {

      parent = category.path.slice(1, -1).split('/');
      parent.pop();

      if (parent.length === count.length) {
        count[count.length - 1] = category.weight;
      } else if (parent.length > count.length) {
        count.push(category.weight);
      } else {
        count.pop();
        count[count.length - 1] = category.weight;
      }

      choices.push({
        name: count.join(".") + "    " + category.title,
        value: category.path,
        short: category.title
      });
    });

    return choices;
  }


  /**
   * Fetches the meta data of an URL from the web
   * 
   * @param {string} url 
   * @returns {Promise object} metadata
   */
  fetchMetaData(url, options) {

    return new Promise ((resolve,reject) => {

      const opt = options || {
        description_length: 140
      };

      crawl(url, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        let metadata = {};

        metadata.title = data.og.title || data.meta.title;
        metadata.description = this.filterDescription(data.og.description) || this.filterDescription(data.meta.description);
        metadata.description = this.shortenDescription(metadata.description, opt.description_length);
        metadata.canonical = data.meta.canonical;
        metadata.type = data.og.type;

        resolve(metadata);
      });
    });
  }

  /**
   * Shows all relevant meta data of a link
   * 
   * @param {object} meta 
   */
  showMetadata(meta) {

    const size        = require('window-size'),
          ui          = require('cliui')({ width: size.width });

    ui.div({ text: chalk.green("Title:"), width: 15 }, { text: meta.title });
    ui.div({ text: chalk.green("Description:"), width: 15 }, { text: chalk.dim(meta.description) + chalk.yellow("\n(" + meta.description.length + " Zeichen)") });
    ui.div({ text: chalk.green("Date:"), width: 15}, { text: meta.date });
    ui.div({ text: chalk.green("URL:"), width: 15 }, { text: meta.url });
    ui.div({ text: chalk.green("Related Blog:"), width: 15 }, { text: meta.related_blog });
    ui.div({ text: chalk.green("Path:"), width: 15 }, { text: meta.path });
    ui.div({ text: chalk.green("Draft:"), width: 15 }, { text: meta.draft });
    console.log('\n' + ui.toString() + '\n');
  }

  /**
   * Checks the availability of an URL
   * 
   * @param {string} url
   * @returns {Promise string} status (dead|alive)
   */
  checkLink(url) {

    return new Promise ((resolve, reject) => {

      linkCheck(url, function(err, res) {

        if (err) reject(err);
        resolve(res.status);
      });
    });
  }

  /**
   * Shortens a String by sentences with a max length
   * 
   * @param {string} description 
   * @param {int} maxLength 
   * @returns {string} description
   */
  shortenDescription(description, maxLength) {

    let max = maxLength || 140;
    if (description === '' || typeof description === 'undefined') return;
    let sentences = description.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    let count = this.countSentences(sentences);

    while (count > max) {
      if (sentences.length > 1) {
        sentences.pop();
        count = this.countSentences(sentences);
      } else break;
    }
    return (sentences.length > 1) ? sentences.join(' ') : sentences[0];
  }

  /**
   * Converts every quotation mark to chevrons
   * 
   * @param {string} str 
   */
  filterDescription(st) {

    let newStr = st;
    
    newStr = newStr.replace(/[\'\"\„](.*?)[\'\"\“]/g, "»$1«");
    newStr = newStr.replace(/\:/g, ".");

    return newStr;
  }

  /**
   * Counts the characters of an Array of Strings
   * 
   * @param {array} sentencesArray
   * @returns {int} count
   */
  countSentences(sentencesArray) {

    let count = 0;

    if (typeof sentencesArray !== 'undefined') {
      if (sentencesArray.length > 1) {
        sentencesArray.forEach(sentence => {
          count += sentence.length;
        });
      } else {
        count = sentencesArray[0].length;
      }
    }
    return count;
  }

}

module.exports = Database;