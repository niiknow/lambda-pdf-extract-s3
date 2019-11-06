const debug = require('debug')('lambda-pdfxs3')
const { exec }  = require('child_process')

export default ( event ) => {
  debug( 'executing: ', event.cmd )

  return new Promise((resolve, reject) => {
    const child = exec(event.cmd, ( error ) => {
      // Resolve with result of process
      if (error) {
        return reject(error)
      }

      resolve( 'Process complete!' )
    })

    // Log process stdout and stderr
    child.stdout.on('data', (msg) => {
      debug('stdout:', msg)
    })

    child.stderr.on('data', (msg) => {
      debug('stderr:', msg)
    })
  })
}
