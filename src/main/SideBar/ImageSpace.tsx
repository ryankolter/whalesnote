const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useRef, useState, MouseEvent } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import { useDropzone } from 'react-dropzone';

const ImageSpace: React.FC<{ closeAssistantPanel: () => void }> = ({ closeAssistantPanel }) => {
    const { curDataPath } = useContext(GlobalContext);
    const validImageFileType = useRef([
        'jpeg',
        'jpg',
        'png',
        'apng',
        'webp',
        'gif',
        'avif',
        'bmp',
        'tif',
        'tiff',
        'svg',
    ]);
    const validImageMimeType = useRef([
        'image/jpeg',
        'image/png',
        'image/apng',
        'image/webp',
        'image/gif',
        'image/avif',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
    ]);

    const [loadImageStatus, setLoadImageStatus] = useState('none');
    const [loadSuccessCount, setLoadSuccessCount] = useState(0);
    const [loadFailCount, setLoadFailCount] = useState(0);

    const openImagePath = useCallback((path: string) => {
        ipcRenderer.send('open-folder', { folder_path: path });
    }, []);

    const addMultizero = useCallback((num: number, count: number) => {
        return String(num).padStart(count, '0');
    }, []);

    const generateTimeStamp = useCallback(() => {
        const time = new Date();
        const y = time.getFullYear();
        const m = time.getMonth() + 1;
        const d = time.getDate();
        const h = time.getHours();
        const mm = time.getMinutes();
        const s = time.getSeconds();
        const mi = time.getMilliseconds();

        return (
            y +
            addMultizero(m, 2) +
            addMultizero(d, 2) +
            addMultizero(h, 2) +
            addMultizero(mm, 2) +
            addMultizero(s, 2) +
            addMultizero(mi, 3)
        );
    }, []);

    const copyImageMdLink = useCallback((file_name: string) => {
        const md_link = `![](${file_name} "${file_name.substring(0, file_name.lastIndexOf('.'))}")`;
        console.log(md_link);
    }, []);

    const handleLoadImage = useCallback((e: MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        e.preventDefault();
        ipcRenderer.send('open-select-images-dialog', {
            file_types: validImageFileType.current,
            response_event_name: 'loadIamges',
        });
    }, []);

    useEffect(() => {
        ipcRenderer.on('loadIamges', (event: any, paths: string) => {
            const len = paths.length;
            const timeStamp = generateTimeStamp();
            let i = 0;
            let success_count = 0;
            for (const path of paths) {
                const result = ipcRenderer.sendSync('copy', {
                    src_file_path: path,
                    dest_dir_path: curDataPath + '/images',
                    dest_file_name:
                        timeStamp +
                        addMultizero(i, String(len).length) +
                        '.' +
                        path.substring(path.lastIndexOf('.') + 1),
                });
                if (result) {
                    success_count++;
                }
                i++;
            }
            setLoadSuccessCount(success_count);
            setLoadFailCount(len - success_count);
            success_count === len
                ? setLoadImageStatus('success')
                : setLoadImageStatus('partial_success');
            setTimeout(() => {
                setLoadImageStatus('none');
            }, 1500);
        });
        return () => {
            ipcRenderer.removeAllListeners('loadIamges');
        };
    }, [curDataPath]);

    const handleZoneDrop = useCallback(
        (acceptedFiles: any) => {
            const file = acceptedFiles[0];
            if (!validImageMimeType.current.includes(file.type)) {
                setLoadImageStatus('fail');
                setTimeout(() => {
                    setLoadImageStatus('none');
                }, 1500);
                return;
            }

            const dest_file_name =
                generateTimeStamp() + '0' + '.' + file.name.split('.').pop().toLowerCase();
            const result = ipcRenderer.sendSync('copy', {
                src_file_path: file.path,
                dest_dir_path: curDataPath + '/images',
                dest_file_name: dest_file_name,
            });

            if (result) {
                setLoadSuccessCount(1);
                setLoadImageStatus('success');
                copyImageMdLink(dest_file_name);
            } else {
                setLoadSuccessCount(0);
                setLoadFailCount(1);
                setLoadImageStatus('partial_success');
            }
            setTimeout(() => {
                setLoadImageStatus('none');
            }, 1500);
        },
        [curDataPath, setLoadImageStatus]
    );

    const { getRootProps, getInputProps } = useDropzone({ onDrop: handleZoneDrop, noClick: true });

    return (
        <ImageSpaceContainer>
            <TopRow>
                <OpenImagePath>
                    <OpenImagePathBtn
                        className="btn-1-bg-color"
                        onClick={(e) => openImagePath(curDataPath + '/images/')}
                    >
                        打开图片目录
                    </OpenImagePathBtn>
                </OpenImagePath>
                <CloseImageSpaceBtn
                    onClick={() => {
                        closeAssistantPanel();
                    }}
                >
                    x
                </CloseImageSpaceBtn>
            </TopRow>
            <AddImageBox>
                <DragZone {...getRootProps()} className="drag-dotted-color">
                    <input {...getInputProps()} />
                    {loadImageStatus == 'none' ? (
                        <DragZoneTips>
                            将图片拖到此处，或
                            <LoadImageBtn
                                className="load-image-btn-border-color"
                                onClick={handleLoadImage}
                            >
                                点击载入
                            </LoadImageBtn>
                        </DragZoneTips>
                    ) : (
                        <></>
                    )}
                    {loadImageStatus == 'fail' ? (
                        <DragZoneTips>错误：仅支持图片</DragZoneTips>
                    ) : (
                        <></>
                    )}
                    {loadImageStatus == 'success' ? (
                        <DragZoneTips>成功: {loadSuccessCount}</DragZoneTips>
                    ) : (
                        <></>
                    )}
                    {loadImageStatus == 'partial_success' ? (
                        <DragZoneTips>
                            成功: {loadSuccessCount}, 失败: {loadFailCount}
                        </DragZoneTips>
                    ) : (
                        <></>
                    )}
                </DragZone>
            </AddImageBox>
            <LocalImage>
                <LocalImageTitle>本地图片列表</LocalImageTitle>
            </LocalImage>
        </ImageSpaceContainer>
    );
};

const ImageSpaceContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
});

const TopRow = styled.div({
    display: 'flex',
    alignItem: 'center',
    margin: '5px 0 10px 10px',
});

const OpenImagePath = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItem: 'center',
    flex: '1',
    minWidth: '0',
});

const OpenImagePathBtn = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    height: '28px',
    lineHeight: '28px',
    fontSize: '14px',
    padding: '0 8px',
    borderRadius: ' 4px',
    cursor: 'pointer',
});

const CloseImageSpaceBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const AddImageBox = styled.div({
    position: 'relative',
});

const DragZone = styled.div({
    position: 'relative',
    height: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '10px 12px',
    borderRadius: '4px',
    outline: 'none',
});

const DragZoneTips = styled.div({
    fontSize: '16px',
});

const LoadImageBtn = styled.span({
    cursor: 'pointer',
});

const LocalImage = styled.div({
    margin: '5px 12px',
});

const LocalImageTitle = styled.div({
    fontSize: '18px',
});

export default ImageSpace;
