import { createContext, Dispatch, SetStateAction, useCallback, useState, useEffect } from 'react';
import cryptoRandomString from 'crypto-random-string';

const initContext: {
    focus: string;
    manualFocus: (delay: number) => void;
    blur: string;
    manualBlur: (delay: number) => void;
    showSearchResultHighlight: boolean;
    setShowSearchResultHighlight: Dispatch<SetStateAction<boolean>>;
    showKeySelect: boolean;
    setShowKeySelect: Dispatch<SetStateAction<boolean>>;
    keySelectNumArray: number[];
    setKeySelectNumArray: Dispatch<SetStateAction<number[]>>;
} = {
    focus: '',
    manualFocus: () => {},
    blur: '',
    manualBlur: () => {},
    showSearchResultHighlight: false,
    setShowSearchResultHighlight: () => {},
    showKeySelect: false,
    setShowKeySelect: () => {},
    keySelectNumArray: [],
    setKeySelectNumArray: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    const [focus, setFocus] = useState<string>('');
    const [blur, setBlur] = useState<string>('');

    const [showSearchResultHighlight, setShowSearchResultHighlight] = useState(false);
    const [showKeySelect, setShowKeySelect] = useState<boolean>(false);
    const [keySelectNumArray, setKeySelectNumArray] = useState<number[]>([]);

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
                showSearchResultHighlight,
                setShowSearchResultHighlight,
                showKeySelect,
                setShowKeySelect,
                keySelectNumArray,
                setKeySelectNumArray,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
