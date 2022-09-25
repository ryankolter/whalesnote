import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import './resources/css/theme/common.css';
import './resources/css/theme/grey.css';
import './resources/css/theme/color.css';

import './resources/css/hljs_theme/grey_standard.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
