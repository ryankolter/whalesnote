import React, { useCallback, useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import { usePopUp } from '../../lib/usePopUp';

const GlobalMenu: React.FC<{
    showGlobalMenu: boolean;
    setShowGlobalMenu: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ showGlobalMenu, setShowGlobalMenu }) => {
    const [menuPopup, setMenuPopUp, mask] = usePopUp(500);

    useEffect(() => {
        setMenuPopUp(showGlobalMenu);
    }, [showGlobalMenu]);

    return (
        <GlobalMenuContainer>
            <div
                className={menuPopup ? 'show-alert-mask' : 'hide-alert-mask'}
                style={mask ? { display: 'block' } : { display: 'none' }}
                onClick={() => setShowGlobalMenu(false)}
            ></div>
            <MenuPanel
                className="no-scroller"
                style={{ transform: showGlobalMenu ? 'translate(0, 0)' : 'translate(-400px, 0)' }}
            ></MenuPanel>
        </GlobalMenuContainer>
    );
};

const GlobalMenuContainer = styled.div({});

const MenuPanel = styled.div({
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    width: '400px',
    height: 'calc(100vh)',
    padding: '15px',
    boxSizing: 'border-box',
    transition: 'all 400ms ease',
    zIndex: '9000',
    overflowY: 'auto',
    border: '1px solid var(--float-panel-border-color)',
    backgroundColor: 'var(--float-panel-bg-color)',
});

export default GlobalMenu;
