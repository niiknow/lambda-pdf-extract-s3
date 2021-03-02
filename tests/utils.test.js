import handler from '../src/utils.js'

describe('Utils test', () => {
  test('correctly convert object to text', async () => {
    const t = {b: ['THE '], desc: ''}
    handler.objectToText(t, t)

    expect(t.desc).toBe('THE')
  })
})
