import handler from '../src/pdfHandler.js'

jest.setTimeout(120000)

describe('do-download-tests', () => {
  test('correctly download and process remote pdf file', async () => {
    const rst = await handler(
     {
       "Records":[
          {
            "s3":{
              "bucket":{
                "name": "brick-web"
              },
              "object":{
                "key": "pdf-bulk/KCAM_133_p1_080917_4C.pdf"
              }
            }
          }
       ]
    })

    expect(rst).toBe("Success.")
  })
})
