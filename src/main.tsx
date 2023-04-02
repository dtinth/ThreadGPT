import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './queryClient'
import redaxios from 'redaxios'
import { ikv } from './ikv'
import ObjectID from 'bson-objectid'
import 'bootstrap'
import '@github/relative-time-element'
import "prismjs/themes/prism-okaidia.min.css"

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)

Object.assign(window, { redaxios, queryClient, ikv, ObjectID })
