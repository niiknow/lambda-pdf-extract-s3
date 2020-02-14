import path from 'path'
import fs from 'fs'
import handler from '../src/transformXml.js'

jest.setTimeout(120000)

beforeEach(() => {
  const fullPath = path.resolve('./tests/data/');

  fs.readdirSync(fullPath, (err, files) => {
    if (err) {
      throw err
    }

    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlink(path.join(fullPath, file), err => {
          if (err) {
            throw err
          }
        })
      }
    }
  });
})

describe('Transform xml to fit text to image', () => {
  test('correctly transform page-single xml to json', async () => {
    const fullPath = path.resolve('./tests/data/page-single.xml');
    const rst = await handler({ xmlFile: fullPath })
    const rstFile = fullPath.replace('.xml', '-x.json')
    const exists = fs.existsSync(rstFile)
    expect(exists).toBe(true)
    expect(rst.pages).toHaveLength(1)
    expect(rst.pages[0].items.length > 1).toBe(true)
    expect(rst.pages[0].lines.length > 1).toBe(true)
  })

  test('correctly transform page-multi xml to json', async () => {
    const fullPath = path.resolve('./tests/data/page-multi.xml');
    const rst = await handler({ xmlFile: fullPath })
    const rstFile = fullPath.replace('.xml', '-x.json')
    const exists = fs.existsSync(rstFile)
    expect(exists).toBe(true)
    expect(rst.pages).toHaveLength(8)
    expect(rst.pages[0].items.length > 1).toBe(true)
  })

  test('correctly transform crop-single xml to json', async () => {
    const fullPath = path.resolve('./tests/data/crop-single.xml');
    const rst = await handler({ xmlFile: fullPath, mcFile: fullPath.replace('.xml', '.json') })
    const rstFile = fullPath.replace('.xml', '-x.json')
    const exists = fs.existsSync(rstFile)
    expect(exists).toBe(true)
    expect(rst.pages).toHaveLength(1)
    expect(rst.pages[0].items.length > 1).toBe(true)
  })
})
