import markdownIt from "markdown-it";
import highlightjs from "markdown-it-highlightjs";
import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";

export const MarkdownRender: React.FC<MarkdownRenderProps> = ({
  data_path,
  currentRepoKey,
  currentFolderKey,
  currentNoteKey,
  content,
  theme,
}) => {
  const md = useRef(markdownIt().use(highlightjs));
  const [result, setResult] = useState("");

  useEffect(() => {
    setResult(md.current.render(content));
  }, [data_path, currentRepoKey, currentFolderKey, currentNoteKey, content]);

  const wrappedClassNames =
    typeof theme === "string" ? `rd-theme-${theme}` : "rd-theme";

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
  data_path: string;
  currentRepoKey: string;
  currentFolderKey: string;
  currentNoteKey: string;
  content: string;
  theme: string;
};
