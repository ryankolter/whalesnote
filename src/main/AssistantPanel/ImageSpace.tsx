import { useCallback, useContext, useEffect, useRef, useState, MouseEvent } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import { useDropzone } from 'react-dropzone';

const ImageSpace: React.FC<{}> = ({}) => {
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

    const openImagePath = useCallback(async (path: string) => {
        await window.electronAPI.openFolder({ folder_path: path });
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
            '_' +
            addMultizero(h, 2) +
            addMultizero(mm, 2) +
            addMultizero(s, 2) +
            addMultizero(mi, 3)
        );
    }, []);

    const copyImageMdLink = useCallback(async (file_name: string) => {
        const md_link = `![w500](${file_name} "${file_name.substring(
            0,
            file_name.lastIndexOf('.')
        )}")`;
        try {
            await navigator.clipboard.writeText(md_link);
            console.log('success');
        } catch (err) {
            console.log(err);
        }
    }, []);

    const loadImages = useCallback(
        async (paths: string[]) => {
            const len = paths.length;
            const timeStamp = generateTimeStamp();
            let i = 0;
            let success_count = 0;
            let target_file_name = '';
            for (const path of paths) {
                const dest_file_name =
                    timeStamp +
                    (len > 1 ? '_' + addMultizero(i, String(len).length) : '') +
                    '.' +
                    path.substring(path.lastIndexOf('.') + 1);
                const result = await window.electronAPI.copy({
                    src_file_path: path,
                    dest_dir_path: curDataPath + '/images',
                    dest_file_name: dest_file_name,
                });
                if (result) {
                    success_count++;
                    target_file_name = dest_file_name;
                }
                i++;
            }
            setLoadSuccessCount(success_count);
            setLoadFailCount(len - success_count);
            success_count === len
                ? setLoadImageStatus('success')
                : setLoadImageStatus('partial_success');
            if (success_count >= 1) {
                copyImageMdLink(target_file_name);
            }
            setTimeout(() => {
                setLoadImageStatus('none');
            }, 1500);
        },
        [addMultizero, copyImageMdLink, setLoadFailCount, setLoadSuccessCount, setLoadImageStatus]
    );

    const handleLoadImage = useCallback(
        async (e: MouseEvent<HTMLSpanElement>) => {
            e.stopPropagation();
            e.preventDefault();
            const paths = await window.electronAPI.openSelectImagesDialog({
                file_types: validImageFileType.current,
            });
            await loadImages(paths);
        },
        [loadImages]
    );

    const handleZoneDrop = useCallback(
        async (acceptedFiles: any) => {
            const file = acceptedFiles[0];
            if (!validImageMimeType.current.includes(file.type)) {
                setLoadImageStatus('fail');
                setTimeout(() => {
                    setLoadImageStatus('none');
                }, 1500);
                return;
            }

            const dest_file_name =
                generateTimeStamp() + '.' + file.name.split('.').pop().toLowerCase();
            const result = await window.electronAPI.copy({
                src_file_path: file.path,
                dest_dir_path: curDataPath + '/images',
                dest_file_name: dest_file_name,
            });

            if (result) {
                await copyImageMdLink(dest_file_name);
                setLoadSuccessCount(1);
                setLoadImageStatus('success');
            } else {
                setLoadSuccessCount(0);
                setLoadFailCount(1);
                setLoadImageStatus('partial_success');
            }
            setTimeout(() => {
                setLoadImageStatus('none');
            }, 1500);
        },
        [curDataPath, setLoadImageStatus, copyImageMdLink]
    );

    const { getRootProps, getInputProps } = useDropzone({ onDrop: handleZoneDrop, noClick: true });

    return (
        <ImageSpaceContainer>
            <ChildPart>
                <PartTitle>
                    <PartTitleName>本地图库</PartTitleName>
                    <OpenImagePath>
                        <OpenImagePathBtn onClick={(e) => openImagePath(curDataPath + '/images/')}>
                            打开
                        </OpenImagePathBtn>
                    </OpenImagePath>
                </PartTitle>
                <AddImageBox>
                    <DragZone {...getRootProps()}>
                        <input {...getInputProps()} />
                        {loadImageStatus == 'none' ? (
                            <DragZoneTips>
                                将图片拖到此处，或
                                <LoadImageBtn onClick={handleLoadImage}>点击载入</LoadImageBtn>
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
                            <DragZoneTips>成功: {loadSuccessCount} (已复制到剪贴板）</DragZoneTips>
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
            </ChildPart>
        </ImageSpaceContainer>
    );
};

const ImageSpaceContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
});

const PartTitleName = styled.div({
    height: '28px',
    lineHeight: '28px',
});

const OpenImagePath = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItem: 'center',
    margin: '0 0 4px 0',
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
    backgroundColor: 'var(--main-btn-bg-color)',
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
    border: '3px dashed var(--main-dashed-border-color)',
});

const DragZoneTips = styled.div({
    fontSize: '16px',
});

const LoadImageBtn = styled.span({
    borderBottom: '1px solid var(--main-border-color)',
    cursor: 'pointer',
});

export default ImageSpace;