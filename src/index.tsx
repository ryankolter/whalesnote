import { createRoot } from 'react-dom/client';
import { GlobalProvider } from './GlobalProvider';
import './resources/css/theme/color_variable.css';
import './index.css';
import './resources/css/theme/global.css';
import './resources/css/theme/editor.css';
import './resources/css/theme/render.css';
import './resources/css/hljs_theme/white_standard.css';
import './resources/css/hljs_theme/grey_standard.css';

import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <GlobalProvider>
        <App />
    </GlobalProvider>
);
