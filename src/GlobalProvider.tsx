import { createContext, Dispatch, SetStateAction, useCallback, useState, useEffect } from 'react';
import cryptoRandomString from 'crypto-random-string';

const initContext: {
    focus: string;
    manualFocus: (delay: number) => void;
    blur: string;
    manualBlur: (delay: number) => void;
} = {
    focus: '',
    manualFocus: () => {},
    blur: '',
    manualBlur: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    const [focus, setFocus] = useState<string>('');
    const [blur, setBlur] = useState<string>('');

    const manualFocus = useCallback(
        (delay: number) => {
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    }),
                );
            }, delay);
        },
        [setFocus],
    );

    const manualBlur = useCallback(
        (delay: number) => {
            if (delay >= 0) {
                setTimeout(() => {
                    setBlur(
                        cryptoRandomString({
                            length: 24,
                            type: 'alphanumeric',
                        }),
                    );
                }, delay);
            }
        },
        [setBlur],
    );

    return (
        <GlobalContext.Provider
            value={{
                focus,
                manualFocus,
                blur,
                manualBlur,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
