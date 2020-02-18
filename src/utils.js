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
        // must be object, execute recursion
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

export default {
  /**
   * Scale a rect
   *
   * @param  Object rect      The rect
   * @param  Number scale     The scale value
   * @param  Number maxWidth  It should not be bigger than width
   * @param  Number maxHeight It should not be bigger than height
   * @return Object           [description]
   */
  rectToScale: (rect, scale, maxWidth, maxHeight) => {
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
  },
  /**
   * Convert a HTML object to plain text
   *
   * @param  Object t   the parent object
   * @param  Object obj the object
   * @return String     the result string
   */
  objectToText: objToText,
  /**
   * Determine if a rect contain x, y point
   *
   * @param  Object rect
   * @param  Number x
   * @param  Number y
   * @return Boolean      true if it contains the point
   */
  rectContains: (rect, x, y) => {
    return rect.x <= x && x <= rect.x + Math.abs(rect.width) &&
      rect.y <= y && y <= rect.y + Math.abs(rect.height)
  },
  /**
   * Make sure all value in rect are numeric and
   * create xx,yy from width and height
   *
   * @param  Object rect
   * @param  Number maxX
   * @param  Number maxY
   * @return Object      the rect
   */
  rectToNumeric: (rect, maxX, maxY) => {
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
}
