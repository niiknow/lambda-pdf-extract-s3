import handler from '../src/imageHandler'
require('./loadConfig')

const baseUrl = process.env.CDN_BASE

jest.setTimeout(30000)

describe('do-download-tests', () => {
  test('correctly download and process remote pdf file', async () => {
    const rst = await handler(
      {
        pathParameters: {
          client: 'itemmaster',
          gtin: '00008100003983'
        },
        queryStringParameters: {
          nocheck: 0
        }
      },
      null,
      (err) => {
        expect(err).toBeNull()
      }
    )

    expect(rst).toBe(baseUrl + 'itemmaster/008/100/003/00008100003983/index.jpg')
  })
})
