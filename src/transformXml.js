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

  const rectContains = (rect, left, top) => {


    return rect.left <= left && left <= rect.left + Math.abs(rect.width) &&
      rect.top <= top && top <= rect.top + Math.abs(rect.height);
  }

  const rectToInt = (rect) => {
    rect.top = parseInt(rect.top)
    rect.left = parseInt(rect.left)
    rect.width = parseInt(rect.width)
    rect.height = parseInt(rect.height)

    if (rect.width < 0) {
      rect.left = rect.left + rect.width
      rect.width = Math.abs(rect.width)
    }

    if (rect.height < 0) {
      rect.top = rect.top + rect.height
      rect.height = Math.abs(rect.height)
    }
  }

  const pages = rst.pdf2xml.page
  pages.forEach((p) => {
    // convert rect to integer
    p.image.forEach((i) => {
      rectToInt(i.$)
      i.text = []
      p.text.forEach((t) => {
        rectToInt(t.$)
        if (rectContains(i.$, t.$.left, t.$.top)) {
          i.text.push(t)
        }
      })

      i.text.sort((a, b) => {
        return a.$.top == b.$.top ? a.$.left - b.$.left : a.$.top - b.$.top
      })
    })

    // sort images - top then left
    p.image.sort((a, b) => {
      return a.$.top == b.$.top ? a.$.left - b.$.left : a.$.top - b.$.top
    })

    // delete things we no longer use
    delete p['fontspec']
    delete p['text']
  })

  // save as transformed json
  fs.writeFileSync(xmlFile.replace('.xml', '-x.json'), JSON.stringify(rst, null, 2))
  return rst
}
