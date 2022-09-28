import { useState, useCallback } from 'react';

export const usePopUp = (duration: number) => {
    const [mask, setMask] = useState(false);
    const [popUp, setObject] = useState(false);

    const setPopUp = useCallback(
        (state: boolean) => {
            if (state) {
                setObject(true);
                setMask(true);
            } else {
                setObject(false);
                setTimeout(() => {
                    setMask(false);
                }, duration);
            }
        },
        [duration]
    );

    return [popUp, setPopUp, mask] as const;
};
