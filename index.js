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

module.exports = function(source) {
  const options = getOptions(this);

  validateOptions(schema, options, "replace-path-for-content-loader");
  return options.searchFor.reduce((fileData, searchFor) => {
    return fileData.replace(
      new RegExp(`.*\\${options.specialChar}${searchFor}\\=.*`),
      result => {
        const result2 = result.match(new RegExp(`.*${searchFor}\\=".+?"`))[0];
        const endOfString = result.replace(result2, "");

        const pathFoundInFile = result2
          .match(new RegExp(`${searchFor}\\=".+?"`))[0]
          .replace(`${searchFor}=`, "")
          .replace(/\"/g, "");
        const realPath = path.resolve(process.cwd(), pathFoundInFile);

        this.addDependency(realPath);

        const file = fs.readFileSync(realPath, "utf-8");
        const content = result2.replace(
          new RegExp(`.*\\${options.specialChar}${searchFor}\\=".+?"`),
          `${searchFor}={\`\n${file}\`}`
        );

        return (content + endOfString).replace(/\n/g, "\\n");
      }
    );
  }, source);
};
