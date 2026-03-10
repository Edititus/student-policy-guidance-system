import request from 'supertest'
import express from 'express'
import { loggingMiddleware } from '../loggingMiddleware'

const app = express()
app.use(loggingMiddleware)
app.get('/test', (req, res) => res.status(200).send('ok'))

describe('loggingMiddleware', () => {
  it('should log HTTP requests', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    await request(app).get('/test')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
