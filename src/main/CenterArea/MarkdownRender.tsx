import { useContext, useEffect, useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { GlobalContext } from '../../GlobalProvider';
import markdownIt from 'markdown-it';
import highlightjs from 'markdown-it-highlightjs';

export const MarkdownRender: React.FC<MarkdownRenderProps> = ({
    content,
    theme,
    editorScrollRatio,
}) => {
    const { dataPath, currentRepoKey, currentFolderKey, currentNoteKey } =
        useContext(GlobalContext);

    const md = useRef(markdownIt().use(highlightjs));
    const [result, setResult] = useState('');

    const [scrollLock, setScrollLock] = useState(false);

    const renderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setResult(md.current.render(content));
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey, content]);

    useEffect(() => {
        if (renderRef && renderRef.current) {
            setTimeout(() => {
                if (renderRef && renderRef.current) {
                    const scrollHeight = renderRef.current.scrollHeight;
                    renderRef.current.scrollTop = Math.ceil(scrollHeight * editorScrollRatio);
                    setScrollLock(true);
                }
            }, 0);
        }
    }, [editorScrollRatio]);

    const handleScroll = useCallback(
        (event: any) => {
            if (renderRef.current && renderRef.current.contains(event.target)) {
                if (
                    Math.ceil(renderRef.current.scrollHeight * editorScrollRatio) ===
                    renderRef.current.scrollTop
                ) {
                    setScrollLock(false);
                }

                if (!scrollLock) {
                }
            }
        },
        [renderRef, editorScrollRatio, scrollLock]
    );

    useEffect(() => {
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [handleScroll]);

    const wrappedClassNames = typeof theme === 'string' ? `rd-theme-${theme}` : 'rd-theme';

    const commonClassNames = 'rd-theme-common';

    return (
        <MarkdownRenderContainer>
            <div
                ref={renderRef}
                className={`${wrappedClassNames} ${commonClassNames}`}
                style={{ overflowX: 'hidden', scrollBehavior: 'smooth' }}
                dangerouslySetInnerHTML={{ __html: result }}
            ></div>
        </MarkdownRenderContainer>
    );
};

const MarkdownRenderContainer = styled.div({
    flex: '1',
    minWidth: '0',
    height: '100%',
    overflowX: 'hidden',
});

type MarkdownRenderProps = {
    content: string;
    theme: string;
    editorScrollRatio: number;
};
