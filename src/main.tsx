import React from 'react';
import { createRoot } from 'react-dom/client';

import './resources/icon/iconfont/remixicon.css';
import './resources/css/theme/color_variable.css';
import './resources/css/theme/global.css';
import './resources/css/theme/editor.css';
import './resources/css/theme/render.css';
import './resources/css/theme/prosemirror.css';
import './resources/css/hljs_theme/light.css';
import './resources/css/hljs_theme/dark.css';
import './i18n';

import App from './App';
import { DataProvider } from './context/DataProvider';

createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <DataProvider>
            <App />
        </DataProvider>
    </React.StrictMode>,
);
