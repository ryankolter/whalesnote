import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import cn from './locales/zh-cn.json';
import en from './locales/en-us.json';

i18next.use(initReactI18next).init({
    resources: {
        'zh-CN': {
            translation: cn,
        },
        'en-US': {
            translation: en,
        },
    },
    fallbackLng: 'en-US',
});

export default i18next;
