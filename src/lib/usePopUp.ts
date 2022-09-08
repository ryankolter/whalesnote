import { useState, useCallback } from 'react';

export const usePopUp = (duration: number) => {
    const [maskState, setMaskState] = useState(false);
    const [popupState, setPopUpState] = useState(false);

    const getMaskState = useCallback(() => {
        return maskState;
    }, [maskState]);

    const showPopup = () => {
        setMaskState(true);
        setPopUpState(true);
    };

    const hidePopup = useCallback(() => {
        setPopUpState(false);
        setTimeout(() => {
            setMaskState(false);
        }, duration);
    }, [duration]);

    return [popupState, { getMaskState, showPopup, hidePopup }] as const;
};
