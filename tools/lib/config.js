"use strict";

const Promise   = require("promise"),
      rp        = require("app-root-path"),
      fs        = require("fs-extra");

class Config {

  constructor() {
    this.file = rp + "/config.json";

    // Checks if config.json exists und copies the default one if nessecary
    if (!fs.existsSync(this.file))
      fs.copySync(rp + "/config.default.json", this.file);

    this.data = JSON.parse(fs.readFileSync(this.file));
  }

  /**
   * Saves one or multiple keys and their properties in the config file
   *
   * @param {any} object
   * @returns {Promise} object
   * @memberof Config
   */
  saveKeys(object) {
    return new Promise((resolve, reject) => {
      if (!this.data) {
        reject(new Error("Data not assigned"));
      } else {
        for (var key in object) {
          if (object.hasOwnProperty(key) && key !== "cities")
            this.data[key] = object[key];
        }

        fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
        resolve(object);
      }
    });
  }

}

module.exports = Config;
