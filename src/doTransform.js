import { exec } from 'child_process'
import Debug from 'debug'

const debug = Debug('lambda-pdfxs3')

export default ( event ) => {
  debug('executing: ', event.cmd)

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
