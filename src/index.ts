import path from 'path'
import fs from 'fs-extra'
import { Transform } from 'stream'

const filePath = path.join('.', 'public')

type readStreamOptionsType = Parameters<typeof fs.createReadStream>[1]

const readStreamOptions: readStreamOptionsType = {
  highWaterMark: 512,
}

const rowMaker = (headers: string[], values: string[]) =>
  headers.reduce((acc: { [key: string]: string }, header: string, i: number) => {
    acc[header] = values[i]
    return acc
  }, {})

const csvParser = (): Transform => {
  let headers: string[] = []
  let unfinished: string | null
  let first = true
  return new Transform({
    objectMode: true,
    transform(chunk, _, callback): void {
      const bits = chunk.toString().split('\n')
      if (first) {
        headers = headers.concat(bits.shift().split(','))
        first = false
      }
      bits.forEach((bit: string) => {
        const rowValues = bit.split(',')
        if (rowValues.length !== headers.length) {
          if (unfinished) {
            unfinished += bit
            const prettyRow = rowMaker(headers, unfinished.split(','))
            this.push(prettyRow)
            unfinished = null
          } else {
            unfinished = bit
          }
        } else {
          const prettyRow = rowMaker(headers, rowValues)
          this.push(prettyRow)
        }
      })
      callback()
    },
  })
}

const readable = fs.createReadStream(path.join(filePath, 'MOCK_DATA.csv'), readStreamOptions).pipe(csvParser())

readable.on('data', data => {
  console.log(data)
})

readable.on('end', () => {
  console.log('Finished')
})
