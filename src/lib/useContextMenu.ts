import { useCallback, useEffect, useState } from 'react';

export const useContextMenu = (outerRef: any) => {
    const [xPos, setXPos] = useState('0px');
    const [yPos, setYPos] = useState('0px');
    const [menuVisible, setMenuVisible] = useState(false);

    const handleContextMenu = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            if (outerRef && outerRef.current && outerRef.current.contains(event.target)) {
                setXPos(`${event.pageX}px`);
                setYPos(`${event.pageY}px`);
                setMenuVisible(true);
            } else {
                setMenuVisible(false);
            }
        },
        [setMenuVisible, outerRef, setXPos, setYPos],
    );

    const handleClick = useCallback(() => {
        setMenuVisible(false);
    }, [setMenuVisible]);

    useEffect(() => {
        document.addEventListener('click', handleClick);
        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [handleClick, handleContextMenu]);

    return { xPos, yPos, menuVisible, setMenuVisible };
};
