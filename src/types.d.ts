export {};

declare global {
    interface ElectronAPI {
        getPlatform(): Promise<string>;
        getLanguage(): string;
        getDefaultDataPath(): Promise<string>;

        shouldUseDarkMode(): boolean;
        checkPathExist(path: string): Promise<boolean>;
        writeStr(path: string, str: string): Promise<boolean>;
        writeJson(path: string, obj: object): Promise<boolean>;
        readJsonSync(path: string): Promise<any | false>;
        readJsonAsync(path: string): Promise<any | false>;
        readMdSync(path: string): Promise<string | false>;
        readCssSync(css_file_name: string): Promise<string | false>;
        remove(path: string): Promise<boolean>;
        copy(src_path: string, dest_path: string): Promise<boolean>;
        move(src_path: string, dest_path: string): Promise<boolean>;
        openDirectoryDialog(): Promise<string>;
        openSaveDialog(file_name: string, file_types: string[]): Promise<string>;
        openSelectImagesDialog(file_types: string[]): Promise<string[]>;
        openSelectMarkdownsDialog(file_types: string[]): Promise<string[]>;
        openParentFolder(path: string): Promise<void>;
        loadNodejiebaDict(): Promise<void>;
        nodejieba(word: string): string[];
    }

    interface Window {
        electronAPI: ElectronAPI;
    }
}

declare module '*.svg' {
    import React = require('react');
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}
