import fs from 'fs'
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
  const rst = await xmlToJsonAsync(xmlFile)

  // save as new filename.json instead of .xml
  if (event.saveJson) {
    fs.writeFileSync(xmlFile.replace('.xml', '.json'), JSON.stringify(rst))
  }

  const rectContains = (rect, x, y) => {
    return rect.x <= x && x <= rect.x + Math.abs(rect.width) &&
      rect.y <= y && y <= rect.y + Math.abs(rect.height)
  }

  const rectToNumeric = (rect) => {
    rect.top = Number(rect.top)
    rect.left = Number(rect.left)
    rect.width = Number(rect.width)
    rect.height = Number(rect.height)

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

    return {
      x: rect.left,
      y: rect.top,
      xx: rect.left + rect.width,
      yy: rect.top + rect.height,
      width: rect.width,
      height: rect.height,
      font: rect.font ? Number(rect.font) : -1
    }
  }

  const rectToScale = (rect, scale) => {
    rect.x      = Math.floor(rect.x * scale)
    rect.y      = Math.floor(rect.y * scale)
    rect.xx     = Math.floor(rect.xx * scale)
    rect.yy     = Math.floor(rect.yy * scale)
    rect.width  = Math.floor(rect.width * scale)
    rect.height = Math.floor(rect.height * scale)
  }

  const pages = rst.pdf2xml.page
  pages.forEach((page) => {
    page.oldsize = {
      width: Number(page.$.width),
      height: Number(page.$.height)
    }

    page.number = Number(page.$.number)
    page.src    = `jpeg-1000-page-${page.number}.jpg`

    if (page.oldsize.width > 0) {
      page.scale1000 = 1000 / page.oldsize.width
      page.width     = 1000
      page.height    = Math.floor(page.scale1000 * page.oldsize.height)
    }

    // convert rect to integer
    page.image.forEach((i) => {
      i.rect = rectToNumeric(i.$)
      i.text = []
      if (i.$.src) {
        i.src  = i.$.src
      }

      page.text.forEach((t) => {
        t._ = t._ || ''

        if (t.$) {
          t.rect = rectToNumeric(t.$)
          delete t['$']
        }

        if (rectContains(i.rect, t.rect.x, t.rect.y)) {
          i.text.push(t)
          t.used = true
        }

        // build string
        for(const k in t) {
          if (k !== 'used' && k !== 'rect' && k !== '_' && k !== '$') {
            const v = t[k]
            if (Array.isArray(v)) {
              t._ = `${t._.trim()} ${v.join(' ')}`.trim()
            } else {
              t._ = `${t._.trim()} ${v}`.trim()
            }

            delete t[k]
          }
        }
      })

      i.text.sort((a, b) => {
        // font size, then top, then left
        if (a.rect.font == b.rect.font) {
          return a.rect.top == b.rect.top ? a.rect.left - b.rect.left : a.rect.top - b.rect.top
        }

        return a.rect.font - b.rect.font
      })

      i.desc = ''
      i.text.forEach((t) => {
        if (t._) {
          i.desc = `${i.desc.trim()} ${t._}`.trim()
        }
      })

      i.desc = i.desc.trim()
      delete i['$']
      delete i['text']

      // finally, scale rect based on 1000 pixel image
      rectToScale(i.rect, page.scale1000)
    })

    page.items = page.image
    delete page['image']

    // sort images - top then left
    page.items.sort((a, b) => {
      return a.rect.y == b.rect.y ? a.rect.x - b.rect.x : a.rect.y - b.rect.y
    })

    page.lines = []
    page.text.forEach((t) => {
      if (!t.used) {
        if (t._) {
          page.lines.push({
            rect: t.rect,
            line: t._.trim()
          })
        }
      }

      rectToScale(t.rect, page.scale1000)
    })

    // convert to page scale


    // delete things we no longer use
    delete page['fontspec']
    delete page['text']
    delete page['$']
  })

  const ret = {
    src: 'index.jpg',
    pages: pages,
    basePath: event.destPath
  }

  // save as transformed json
  fs.writeFileSync(xmlFile.replace('.xml', '-x.json'), JSON.stringify(ret, null, 2))

  return ret
}
