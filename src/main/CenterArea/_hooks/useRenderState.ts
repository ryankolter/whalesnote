import { useCallback, useEffect, useState } from 'react';

export const useRenderState = () => {
    const [editorWidth, setEditorWidth] = useState('100%');
    const [renderWidth, setRenderWidth] = useState('0');
    const [renderLeft, setRenderLeft] = useState('100%');
    const [mdRenderState, setMdRenderState] = useState(
        window.localStorage.getItem('render_panel_state') || 'half',
    );

    const nextMdRenderState = useCallback(() => {
        if (mdRenderState === 'hidden') {
            setMdRenderState('half');
        } else if (mdRenderState === 'half') {
            setMdRenderState('all');
        } else if (mdRenderState === 'all') {
            setMdRenderState('hidden');
        }
    }, [mdRenderState]);

    useEffect(() => {
        if (mdRenderState === 'hidden') {
            setEditorWidth('100%');
            setRenderWidth('0');
            setRenderLeft('100%');
            window.localStorage.setItem('render_panel_state', 'hidden');
        } else if (mdRenderState === 'half') {
            setEditorWidth('calc(50% - 10px - 10px)');
            setRenderWidth('calc(50% - 10px - 10px)');
            setRenderLeft('calc(50% + 10px - 10px)');
            window.localStorage.setItem('render_panel_state', 'half');
        } else if (mdRenderState === 'all') {
            setEditorWidth('100%');
            setRenderWidth('calc(100% - 20px - 20px)');
            setRenderLeft('20px');
            window.localStorage.setItem('render_panel_state', 'all');
        }
    }, [mdRenderState]);

    return {
        editorWidth,
        renderWidth,
        renderLeft,
        mdRenderState,
        setMdRenderState,
        nextMdRenderState,
    };
};
