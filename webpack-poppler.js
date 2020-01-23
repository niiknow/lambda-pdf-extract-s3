const fs = require('fs');

function WebpackPoppler(options) {
  this.options = options || {};
}

WebpackPoppler.prototype.apply = function (compiler) {
  compiler.plugin('done', () => {
    const permissions = this.options.permissions || '755';
    const binPath = `${compiler.outputPath}/poppler/bin`;
    fs.readdir(binPath, (err, items) => {
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i += 1) {
          fs.chmodSync(`${binPath}/${items[i]}`, permissions);
        }
      }
    });

    fs.chmodSync(`${compiler.outputPath}/index.sh`, permissions);
  });
};

module.exports = WebpackPoppler
