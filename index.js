const validateOptions = require("schema-utils");
const { getOptions } = require("loader-utils");
const fs = require("fs");
const path = require("path");

const schema = {
  type: "object",
  properties: {
    searchFor: {
      type: "array"
    },
    specialChar: {
      type: "string"
    }
  }
};

const escapeTemplateStrings = file =>
  file.replace(/\$/g, "\\$").replace(/`/g, "\\`");

module.exports = function(source) {
  const options = getOptions(this);

  validateOptions(schema, options, "replace-path-for-content-loader");

  return options.searchFor.reduce((fileData, searchFor) => {
    return fileData.replace(
      new RegExp(`.*\\${options.specialChar}${searchFor}\\=.*`, "g"),
      result => {
        const result2 = result.match(new RegExp(`.*${searchFor}\\=".+?"`))[0];
        const endOfString = result.replace(result2, "");

        const pathFoundInFile = result2
          .match(new RegExp(`${searchFor}\\=".+?"`))[0]
          .replace(`${searchFor}=`, "")
          .replace(/\"/g, "");
        const realPath = path.resolve(process.cwd(), pathFoundInFile);

        this.addDependency(require.resolve(realPath));

        const file = fs.readFileSync(require.resolve(realPath), "utf-8");
        const content = result2.replace(
          new RegExp(`.*\\${options.specialChar}${searchFor}\\=".+?"`),
          `${searchFor}={\`\n${escapeTemplateStrings(file)}\`}`
        );

        return (content + endOfString).replace(/\n/g, "\\n");
      }
    );
  }, source);
};
