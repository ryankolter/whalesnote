import { createRoot } from 'react-dom/client';
import { GlobalProvider } from './GlobalProvider';
import './index.css';
import './resources/css/theme/color_variable.css';
import './resources/css/theme/global.scss';
import './resources/css/theme/editor.css';
import './resources/css/theme/render.css';

import './resources/css/hljs_theme/white_standard.css';
import './resources/css/hljs_theme/grey_standard.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <GlobalProvider>
        <App />
    </GlobalProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
