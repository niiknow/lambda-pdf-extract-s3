const fs = require('fs')
const spawnSync = require('child_process').spawnSync;

function WebpackPoppler(options) {
  this.options = options || {};
}

WebpackPoppler.prototype.apply = function (compiler) {
  compiler.hooks.done.tap('WebpackPoppler', () => {
    const permissions = this.options.permissions || '755';
    spawnSync('mv', [`${compiler.outputPath}/poppler/bin/share`, `${compiler.outputPath}/share`]);
    spawnSync('mv', [`${compiler.outputPath}/poppler/bin/lib`, `${compiler.outputPath}/lib`]);
    spawnSync('mv', [`${compiler.outputPath}/poppler/bin`, `${compiler.outputPath}/bin`]);
    const binPath = `${compiler.outputPath}/bin`;
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
