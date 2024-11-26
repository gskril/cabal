import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.text('Hello Node.js!'))
  .post('/', (c) => c.text('From Post'))

serve({ fetch: app.fetch, port: 3000 })
console.log('Server is running on http://localhost:3000')
