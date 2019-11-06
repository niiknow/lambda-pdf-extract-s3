import fs from 'fs'
import path from 'path'
import got from 'got'
import urlParse from 'url'
import mkdirp from 'mkdirp'

import doUpload from './doUpload'
import doTransform from './doTransform'

const debug = require('debug')('lambda-pdfxs3')

const cfg = {
  localpath: (process.env.LOCALPATH || '/tmp/pdf').replace(/\/+$/, ''),
  cmd: './index.sh'
}

export default ( event, callback ) => {
  const params = event.queryStringParameters || {}

  if ( !/^(http|https):\/\//gmi.test( params.url ) ) {
    return callback( 'URL is invalid.' )
  }

  params.dpi = parseInt( params.dpi || 72 )
  params.width = parseInt( params.width || 1600 )

  const opt        = urlParse.parse( params.url, true )
  const pathName   = decodeURIComponent( opt.pathname )

  let destPath   = path.dirname( pathName )

  const fileName   = pathName.replace( destPath + '/', '' )
  const legacyName = path.basename( fileName ).toLowerCase().replace('.pdf', '')

  params.dest = ( params.dest || destPath ) + ''

  // prefix with localpath: /tmp/pdf
  destPath = `${cfg.localpath}/${params.dest}`

  // use pdf file name as path and download as index.pdf
  params.local = `${destPath}/${fileName}`.trim().slice(0, -4).replace(/\/+/gi, '/') + '/'

  // generate shell exec string
  params.cmd = `"${cfg.cmd}" "${params.dpi}" "${params.local}" ${params.width} "${legacyName}.jpg"`

  // generate new dest path
  params.dest = `${params.dest}/${fileName}`.trim().slice(0, -4).replace(/\/+/gi, '/')

  // make directory before download
  mkdirp.sync( params.local )

  debug('Downloading...', JSON.stringify(params, null, 2))

  got.stream(params.url)
    .pipe(fs.createWriteStream(params.local + 'index.pdf'))
    .on('close', async () => {
      try {
        await doTransform(params)

        // do upload if no error
        doUpload( params, ( err ) => {
          if (err) {
            debug( 'Error during upload', err )
            return callback( 'Error during uploading.', 422 )
          }

          return callback( 'Success.', 200 )
        })
      } catch(e) {
        debug( 'Error during transform', e )
        return callback( 'Error during transform.', 422 )
      }
    })

}
