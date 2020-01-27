import path from 'path'
import handler from '../src/xmlToJsonAsync.js'

jest.setTimeout(120000)

describe('Converting xml to json', () => {
  test('correctly convert page-single xml to json', async () => {
    const fullPath = path.resolve('./tests/data/page-single.xml');
    const rst = await handler(fullPath)

    expect(rst.pdf2xml.$.producer).toBe('poppler')
    expect(rst.pdf2xml.page).toHaveLength(1)
  })
})
