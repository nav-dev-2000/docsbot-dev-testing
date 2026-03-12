import { EventEmitter } from 'node:events'

export const createMockReq = ({
  method = 'GET',
  headers = {},
  body = {},
  query = {},
  url = '/',
} = {}) => ({
  method,
  headers,
  body,
  query,
  url,
})

export const createAsyncIterableReq = (options = {}, chunks = []) => {
  const req = createMockReq(options)
  return {
    ...req,
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield chunk
      }
    },
  }
}

export const createEventStreamReq = (options = {}, chunks = []) => {
  const req = Object.assign(new EventEmitter(), createMockReq(options))
  queueMicrotask(() => {
    for (const chunk of chunks) {
      req.emit('data', chunk)
    }
    req.emit('end')
  })
  return req
}

export const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    send(payload) {
      this.body = payload
      return this
    },
    end(payload) {
      this.body = payload
      return this
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
      return this
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()]
    },
  }

  return res
}
