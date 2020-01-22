import handler from '../src/s3Handler.js'

jest.setTimeout(120000)

describe('s3-handler-tests', () => {
  test('correctly download and process remote pdf file', async () => {
    const rst = await handler(
     {
       "Records":[
          {
            "s3":{
              "bucket":{
                "name": process.env.FROMBUCKET
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
