import { createRoot } from 'react-dom/client';
import { GlobalProvider } from './GlobalProvider';

import '@material-design-icons/font';
import './resources/css/theme/color_variable.css';
import './resources/css/theme/global.css';
import './resources/css/theme/editor.css';
import './resources/css/theme/render.css';
import './resources/css/theme/milkdown.css';
import './resources/css/theme/prosemirror.css';
import './resources/css/hljs_theme/light.css';
import './resources/css/hljs_theme/dark.css';

import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <GlobalProvider>
        <App />
    </GlobalProvider>
);
