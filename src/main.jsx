import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 추가
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* App을 여기서 감싸줍니다 */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)