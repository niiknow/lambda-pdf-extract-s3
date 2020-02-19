const rspHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  'Access-Control-Allow-Headers': 'content-type, x-requested-with'
}

export default (rsp = null, callback = null) => {
  return (data, code=200, headers=null) => {
    const body = JSON.stringify({ status: code, message: data })
    const rst = {
      headers: headers || rspHeaders,
      statusCode: code,
      body: body
    }

    if (callback) {
      return callback(null, rst)
    }

    if (rsp && rsp.writeHead) {
      rsp.writeHead(code, headers || rspHeaders)
      rsp.write(body)
      rsp.end()
    }

    return rst
  }
}
