import { serve } from '@hono/node-server'
import 'dotenv/config'
import { Hono } from 'hono'

import { handleTxRequest } from './handlers/tx.js'

const app = new Hono()
  .get('/', (c) => c.text('Hello world'))
  .post('/', (c) => handleTxRequest(c))

serve({ fetch: app.fetch, port: 3000 })
console.log('Server is running on http://localhost:3000')
