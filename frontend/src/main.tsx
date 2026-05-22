import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { getPopoutPanel } from './hooks/usePopout'
import { PopoutWindow } from './components/PopoutWindow'
import './index.css'

const popoutPanel = getPopoutPanel();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {popoutPanel ? <PopoutWindow panel={popoutPanel} /> : <App />}
  </React.StrictMode>,
)
