import { useContext, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { GlobalContext } from "../../GlobalProvider";
import markdownIt from "markdown-it";
import highlightjs from "markdown-it-highlightjs";

export const MarkdownRender: React.FC<MarkdownRenderProps> = ({ content, theme }) => {
    const { dataPath, currentRepoKey, currentFolderKey, currentNoteKey } =
        useContext(GlobalContext);

    const md = useRef(markdownIt().use(highlightjs));
    const [result, setResult] = useState("");

    useEffect(() => {
        setResult(md.current.render(content));
    }, [dataPath, currentRepoKey, currentFolderKey, currentNoteKey, content]);

    const wrappedClassNames = typeof theme === "string" ? `rd-theme-${theme}` : "rd-theme";

    const commonClassNames = `rd-theme-common`;

    return (
        <MarkdownRenderContainer>
            <div
                className={`${wrappedClassNames} ${commonClassNames}`}
                dangerouslySetInnerHTML={{ __html: result }}
            ></div>
        </MarkdownRenderContainer>
    );
};

const MarkdownRenderContainer = styled.div({
    flex: "1",
    minWidth: "0",
    height: "100%",
});

type MarkdownRenderProps = {
    content: string;
    theme: string;
};
