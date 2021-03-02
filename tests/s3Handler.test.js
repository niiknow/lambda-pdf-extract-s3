import handler from '../src/s3Handler.js'

describe('s3-handler-tests', () => {
  test('correctly download and process remote pdf file', async () => {
    const rst = await handler(
     {
       'Records':[
          {
            's3':{
              'bucket':{
                'name': process.env.SRCBUCKET
              },
              'object':{
                'key': 'pdf-bulk/claiborne-hill-10-16-17-with-coupon.pdf'
              }
            }
          }
       ]
    })

    expect(rst.statusCode).toBe(200)
  })
})
