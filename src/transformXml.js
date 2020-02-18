import fs from 'fs'
import { v4 as uuid } from 'uuid';
import xmlToJsonAsync from './xmlToJsonAsync'

const debug = require('debug')('lambda-pdfxs3')

/**
 * transform xml to json
 *  - appending text to picture element
 *
 * @param  object     event
 */
export default async (event) => {
  debug('Begin transformXml...', JSON.stringify(event))

  // get xml file
  const xmlFile = event.xmlFile
  const rst     = await xmlToJsonAsync(xmlFile)
  const mcBox   = event.mcFile ? JSON.parse(fs.readFileSync(event.mcFile)) : { MediaBox: {}, CropBox: {} }

  // save as new filename.json instead of .xml
  if (event.saveJson) {
    fs.writeFileSync(xmlFile.replace('.xml', '.json'), JSON.stringify(rst))
  }

  const rectContains = (rect, x, y) => {
    return rect.x <= x && x <= rect.x + Math.abs(rect.width) &&
      rect.y <= y && y <= rect.y + Math.abs(rect.height)
  }

  const rectToNumeric = (rect, maxX, maxY) => {
    // previously done so exit
    if (rect.xx) {
      return rect
    }

    rect.top = Number(rect.top)
    rect.left = Number(rect.left)
    rect.width = Number(rect.width)
    rect.height = Number(rect.height)

    if (rect.left < 10) {
      rect.left = 10
    }

    if (rect.top < 10) {
      rect.top = 10
    }

    // handle situation where image is flipped
    // which result in negative width and height
    if (rect.width < 0) {
      // calculate real left from the two value
      rect.left = rect.left + rect.width
      rect.width = Math.abs(rect.width)
    }

    if (rect.height < 0) {
      rect.top = rect.top + rect.height
      rect.height = Math.abs(rect.height)
    }

    const xx = Math.abs(rect.left + rect.width),
      yy =  Math.abs(rect.top + rect.height)

    const rst = {
      x: rect.left > maxX ? maxX : rect.left,
      y: rect.top > maxY ? maxY : rect.top,
      xx: xx > maxX ? maxX : xx,
      yy: yy > maxY ? maxY : yy,
      font: rect.font ? Number(rect.font) : -1
    }

    rst.width = rst.xx - rst.x
    rst.height = rst.yy - rst.y

    return rst
  }

  const rectToScale = (rect, scale, maxWidth, maxHeight) => {
    rect.x      = rect.x < 0 ? 10 : Math.floor(rect.x * scale)
    rect.y      = rect.x < 0 ? 10 : Math.floor(rect.y * scale)
    rect.xx     = Math.floor(rect.xx * scale)
    rect.yy     = Math.floor(rect.yy * scale)

    if (rect.xx > maxWidth) {
     rect.xx = rect.xx - 10
    }

    if (rect.yy > maxHeight) {
     rect.yy = rect.yy - 10
    }

    rect.width  = Math.floor(Math.abs(rect.xx - rect.x))
    rect.height = Math.floor(Math.abs(rect.yy - rect.y))
    return rect
  }

  const objToText = (t, obj) => {
    for(const k in obj) {
      if (k !== 'rect'&& k !== '$' && k !== 'desc' && k !== 'text') {
        const v = obj[k]

        if (Array.isArray(v)) {
          v.forEach((j) => {
            // determine if array of objects
            if (typeof(j) === 'object') {
              objToText(t, j)
            } else if (typeof(j) === 'string') {
              t.desc = `${t.desc.trim()} ${j}`.trim()
            }
          })
        } else if (typeof(v) === 'object') {
          // must be object
          objToText(t, v)
        } else if (typeof(v) === 'string') {
          t.desc = `${t.desc.trim()} ${v}`.trim()
        }

        if (t === obj) {
          delete t[k]
        }
      }
    }
  }

  mcBox.CropBox.width = mcBox.CropBox.xx - mcBox.CropBox.x
  mcBox.CropBox.height = mcBox.CropBox.yy - mcBox.CropBox.y
  mcBox.MediaBox.width = mcBox.MediaBox.xx - mcBox.MediaBox.x
  mcBox.MediaBox.height = mcBox.MediaBox.yy - mcBox.MediaBox.y

  const pages = rst.pdf2xml.page
  pages.forEach((page) => {
    page.oldsize = {
      width: Number(page.$.width),
      height: Number(page.$.height)
    }

    page.number = Number(page.$.number)
    page.src    = `jpeg-1400-page-${page.number}.jpg`
    page.uuid   = uuid()
    page.scale  = 1400 / page.oldsize.width
    page.width  = 1400
    page.height = Math.floor(page.scale * page.oldsize.height)

    if (!mcBox.scale && (mcBox.CropBox.x > 0 || mcBox.CropBox.y > 0)) {
      if ((mcBox.CropBox.width !== mcBox.MediaBox.width) || (mcBox.CropBox.height !== mcBox.MediaBox.height)) {

        // this should be around 1.5 pixels to 1 pt/point but we calculate it anyway
        mcBox.scale = {
          pwidth: page.oldsize.width / mcBox.MediaBox.width,
          pheight: page.oldsize.height / mcBox.MediaBox.height,
          width: mcBox.MediaBox.width / mcBox.CropBox.width,
          height: mcBox.MediaBox.height / mcBox.CropBox.height
        }

        // calculate the pixel moving value for the CropBox
        mcBox.CropBoxPixel = {
          x: mcBox.CropBox.x * mcBox.scale.pwidth,
          y: mcBox.CropBox.y * mcBox.scale.pheight,
          xx: mcBox.CropBox.xx * mcBox.scale.pwidth,
          yy: mcBox.CropBox.yy * mcBox.scale.pheight
        }

        mcBox.MediaBoxPixel = {
          x: mcBox.MediaBox.x * mcBox.scale.pwidth,
          y: mcBox.MediaBox.y * mcBox.scale.pheight,
          xx: mcBox.MediaBox.xx * mcBox.scale.pwidth,
          yy: mcBox.MediaBox.yy * mcBox.scale.pheight
        }

        // calculate the border to subtract later
        mcBox.border = {
          left: mcBox.CropBoxPixel.x,
          top: mcBox.CropBoxPixel.y,
          right: mcBox.MediaBoxPixel.xx - mcBox.CropBoxPixel.xx,
          bottom: mcBox.MediaBoxPixel.yy - mcBox.CropBoxPixel.yy
        }

        debug(mcBox)
      }
    }

    page.mcbox = mcBox

    // convert rect to integer
    page.image.forEach((i) => {
      i.rect = rectToNumeric(i.$, page.oldsize.width - 10, page.oldsize.height - 10)
      i.text = []
      if (i.$.src) {
        i.src  = i.$.src
      }


      page.text.forEach((t) => {
        t.desc = t.desc || ''

        if (t.$) {
          t.rect = rectToNumeric(t.$, page.oldsize.width - 10, page.oldsize.height - 10)
          delete t['$']
        }

        objToText(t, t)

        if (rectContains(i.rect, t.rect.x, t.rect.y)) {
          i.text.push(t)
        }
      })

      i.text.sort((a, b) => {
        // font size, then top, then left
        if (a.rect.font == b.rect.font) {
          return a.rect.y == b.rect.y ? a.rect.x - b.rect.x : a.rect.y - b.rect.y
        }

        return a.rect.font - b.rect.font
      })

      i.desc = ''
      i.text.forEach((t) => {
        if (typeof(t.desc) === 'string') {
          i.desc = `${i.desc.trim()} ${t.desc}`.trim()
        }
      })

      i.desc = i.desc.trim()
      i.uuid = uuid()
      delete i['$']
      delete i['text']
      delete i.rect['font']
    })

    page.items = page.image
    delete page['image']

    // sort images - top then left
    page.items.sort((a, b) => {
      return a.rect.y == b.rect.y ? a.rect.x - b.rect.x : a.rect.y - b.rect.y
    })

    page.lines = []
    page.text.forEach((t) => {
      if (typeof(t.desc) !== 'string') {
        return
      }

      // ignore line mapping not inside cropbox
      if (mcBox.CropBoxPixel) {
        const cb = mcBox.CropBoxPixel
        if (t.rect.x < (cb.x - 10) || t.rect.x > (cb.xx + 10)) {
          return
        }
        if (t.rect.y < (cb.y - 10) || t.rect.yy > (cb.yy + 10)) {
          return
        }
      }

      // copy text over
      page.lines.push({
        rect: t.rect,
        desc: t.desc.trim(),
        uuid: uuid()
      })

    })

    // delete things we no longer use
    delete page['fontspec']
    delete page['text']
    delete page['$']
  })

  // perform out own cropping like procedure to adjust coordinates
  // if width is growing, then we want to increase the height porportionately
  // calculate new cropbox dimension (for width, then height)

  pages.forEach(p => {
    if (mcBox.scale) {
      p.oldsize.widthx  = p.oldsize.width
      p.oldsize.heightx = p.oldsize.height
      p.oldsize.width   = p.width
      p.oldsize.height  = p.height
      p.width           = Math.ceil(p.width * mcBox.scale.height)
      p.height          = Math.ceil(p.height * mcBox.scale.width)
      p.oldsize.scaley  = p.width / p.oldsize.width
      p.oldsize.scalex  = p.height / p.oldsize.height
      p.oldsize.scale   = p.oldsize.scalex > 1 ? p.oldsize.scalex : p.oldsize.scaley
    }

    // adjust the location
    p.items.forEach((i) => {
      if (mcBox.scale) {
        // move x left, y up, xx right, yy down
        i.rect.x = (i.rect.x - mcBox.border.left) * p.oldsize.scale
        i.rect.y = (i.rect.y - mcBox.border.top) * p.oldsize.scale
        i.rect.xx = (i.rect.xx - mcBox.border.left) * p.oldsize.scale
        i.rect.yy = (i.rect.yy - mcBox.border.top) * p.oldsize.scale
        i.rect.width = i.rect.xx - i.rect.x
        i.rect.height = i.rect.yy - i.rect.y
      }

      rectToScale(i.rect, p.scale, p.width, p.height)
    })

    p.lines.forEach((i) => {
      if (mcBox.scale) {
        // move x left, y up, xx right, yy down
        i.rect.x = (i.rect.x - mcBox.border.left) * p.oldsize.scale
        i.rect.y = (i.rect.y - mcBox.border.top) * p.oldsize.scale
        i.rect.xx = (i.rect.xx - mcBox.border.left) * p.oldsize.scale
        i.rect.yy = (i.rect.yy - mcBox.border.top) * p.oldsize.scale
        i.rect.width = i.rect.xx - i.rect.x
        i.rect.height = i.rect.yy - i.rect.y
      }

      rectToScale(i.rect, p.scale, p.width, p.height)
    })
  })

  const ret = {
    src: 'index.jpg',
    uuid: uuid(),
    pages: pages,
    basePath: event.destPath
  }

  // save as transformed json
  fs.writeFileSync(xmlFile.replace('.xml', '-x.json'), JSON.stringify(ret, null, 2))

  return ret
}
