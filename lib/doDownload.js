import fs from 'fs'
import path from 'path'
import got from 'got'
import temp from 'temp'
import urlParse from 'url'
import mkdirp from 'mkdirp'

import doDownload from './doDownload'
import doUpload from './doUpload'
import doTransform from './doTransform'
import res from './response'

const debug = require('debug')('lambda-pdfxs3')

export default ( event, context, callback ) => {
  const rspHandler = res(context, callback)

  params = event.queryStringParameters || {}

  if ( !/^(http|https)\:\/\//gmi.test( params.url ) ) {
    return context.fail( 'URL is invalid.' )
  }

  params.dpi = parseInt( params.dpi || 72 )
  params.width = parseInt( params.width || 1600 )

  const opt        = urlParse.parse( params.url, true )
  const pathName   = decodeURIComponent( opt.pathname )
  const destPath   = path.dirname( pathName )
  const fileName   = pathName.replace( destPath + '/', '' )
  const legacyName = path.basename( fileName ).toLowerCase().replace('.pdf', '')

  params.dest = ( params.dest || destPath ) + ''

  // prefix with basepath: /tmp/pdf
  destPath = `${cfg.basepath}/${params.dest}`

  // use pdf file name as path and download as index.pdf
  params.dest = `${destPath}/${fileName}/`.replace( '.pdf', '/' ).replace( /\/+/gi, '/' )

  // generate shell exec string
  params.cmd = `./index.sh "${event.dpi}" "${event.dest}" ${event.width} "${legacyName}.jpg"`;

  // make directory before download
  mkdirp.sync( params.dest );

  await got.stream(params.url)
    .pipe(fs.createWriteStream(params.dest + 'index.pdf'))
    .on('close', () => {
      try {
      await doTransform(event)

        // do upload if no error
        doUpload( event, context, ( err ) => {
          if (err) {
            debug('Error during upload', err)
            return rspHandler(`Error during uploading.`, 422)
          }

          return rspHandler(`Success.`, 200)
        })
      } catch(e) {
        debug('Error during transform', e)
        return rspHandler(`Error during transform.`, 422)
      }
    })
}
