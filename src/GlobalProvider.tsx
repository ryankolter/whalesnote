import { createContext, Dispatch, SetStateAction, useCallback, useState, useEffect } from 'react';
import cryptoRandomString from 'crypto-random-string';

const initContext: {
    platformName: string;
    focus: string;
    manualFocus: (delay: number) => void;
    blur: string;
    manualBlur: (delay: number) => void;
    showSearchPanel: boolean;
    setShowSearchPanel: Dispatch<SetStateAction<boolean>>;
    showSearchResultHighlight: boolean;
    setShowSearchResultHighlight: Dispatch<SetStateAction<boolean>>;
    showRepoPanel: boolean;
    setShowRepoPanel: Dispatch<SetStateAction<boolean>>;
    showKeySelect: boolean;
    setShowKeySelect: Dispatch<SetStateAction<boolean>>;
    keySelectNumArray: number[];
    setKeySelectNumArray: Dispatch<SetStateAction<number[]>>;
} = {
    platformName: '',
    focus: '',
    manualFocus: () => {},
    blur: '',
    manualBlur: () => {},
    showSearchPanel: false,
    setShowSearchPanel: () => {},
    showSearchResultHighlight: false,
    setShowSearchResultHighlight: () => {},
    showRepoPanel: false,
    setShowRepoPanel: () => {},
    showKeySelect: false,
    setShowKeySelect: () => {},
    keySelectNumArray: [],
    setKeySelectNumArray: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    const [platformName, setPlatformName] = useState<string>('');

    const [focus, setFocus] = useState<string>('');
    const [blur, setBlur] = useState<string>('');

    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showSearchResultHighlight, setShowSearchResultHighlight] = useState(false);
    const [showRepoPanel, setShowRepoPanel] = useState(false);
    const [showKeySelect, setShowKeySelect] = useState<boolean>(false);
    const [keySelectNumArray, setKeySelectNumArray] = useState<number[]>([]);

    useEffect(() => {
        (async () => {
            setPlatformName(await window.electronAPI.getPlatform());
        })();
    }, []);

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
                platformName,
                focus,
                manualFocus,
                blur,
                manualBlur,
                showSearchPanel,
                setShowSearchPanel,
                showSearchResultHighlight,
                setShowSearchResultHighlight,
                showRepoPanel,
                setShowRepoPanel,
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
