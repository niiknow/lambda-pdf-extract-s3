import fs from 'fs'

const xml2js = require('xml2js')
const xml2jsP = xml => new Promise((resolve, reject) => {
  xml2js.parseString(xml, (err, result) => {
    if (err) {
      reject(err)
    }

    resolve(result);
  })
})

export default async (filePath) => {
  const xml  = fs.readFileSync(filePath, 'utf-8')
  const data = await xml2jsP(xml)

  return data
}
