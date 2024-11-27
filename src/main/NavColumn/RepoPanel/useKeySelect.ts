import {
    keySelectActiveAtom,
    keySelectNumArrAtom,
    platformAtom,
    repoPanelVisibleAtom,
} from '@/atoms';
import { useDataContext } from '@/context/DataProvider';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

export const useKeySelect = () => {
    const { whalesnote, curRepoKey, switchRepo } = useDataContext();

    const repoScrollRef = useRef<HTMLDivElement>(null);

    const platform = useAtomValue(platformAtom);
    const [keySelectActive, setKeySelectActive] = useAtom(keySelectActiveAtom);
    const [keySelectNumArr, setKeySelectNumArr] = useAtom(keySelectNumArrAtom);
    const [repoPanelVisible, setRepoPanelVisible] = useAtom(repoPanelVisibleAtom);

    const [ksRepoColumn, setKSRepoColumn] = useState(() => {
        for (const [index, key] of whalesnote.repo_keys.entries()) {
            if (key === curRepoKey) {
                return Math.floor(index / 6.0);
            }
        }
        return 0;
    });

    const adjustKSRepoColumn = useCallback(
        (repoKey: string) => {
            for (const [index, key] of whalesnote.repo_keys.entries()) {
                if (key === repoKey) {
                    console.log(index);

                    setKSRepoColumn(Math.floor(index / 6.0));
                    return;
                }
            }
        },
        [whalesnote],
    );

    const prevRepoColumn = useCallback(() => {
        const prevColumn = ksRepoColumn - 1;
        if (prevColumn >= 0) {
            if (repoScrollRef?.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(prevColumn / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setKSRepoColumn(prevColumn);
        }
    }, [ksRepoColumn]);

    const nextRepoColumn = useCallback(() => {
        if (!whalesnote.repo_keys || whalesnote.repo_keys.length <= 6) return;
        const nextColumn = ksRepoColumn + 1;
        if (nextColumn <= (whalesnote.repo_keys.length - 1) / 6.0) {
            if (repoScrollRef?.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(nextColumn / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setKSRepoColumn(nextColumn);
        }
    }, [ksRepoColumn, whalesnote]);

    const prevRepoPage = useCallback(() => {
        const prevColumn = (Math.floor(ksRepoColumn / 5) - 1) * 5;
        if (prevColumn >= 0) {
            if (repoScrollRef?.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(prevColumn / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setKSRepoColumn(prevColumn);
        }
    }, [ksRepoColumn]);

    const nextRepoPage = useCallback(() => {
        if (!whalesnote.repo_keys || whalesnote.repo_keys.length <= 6) return;
        const nextColumn = (Math.floor(ksRepoColumn / 5) + 1) * 5;
        if (nextColumn <= (whalesnote.repo_keys.length - 1) / 6.0) {
            if (repoScrollRef && repoScrollRef.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(nextColumn / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setKSRepoColumn(nextColumn);
        }
    }, [whalesnote, ksRepoColumn]);

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                // normal number 1-6
                if (e.key.match(/^[1-6]$/) && !modKey && keySelectNumArr.length === 0) {
                    if (!repoPanelVisible || !keySelectActive) return;
                    const index = Number(e.key) + 6 * ksRepoColumn - 1;
                    if (index < whalesnote.repo_keys.length) {
                        const repoKey = whalesnote.repo_keys[index];
                        await switchRepo(repoKey);
                    }
                }

                // arrow left or J
                if ((e.key === 'ArrowLeft' || e.key === 'j') && !modKey) {
                    prevRepoColumn();
                }

                // arrow right or L
                if ((e.key === 'ArrowRight' || e.key === 'l') && !modKey) {
                    nextRepoColumn();
                }

                // arrow left or J with mod
                if ((e.key === 'ArrowLeft' || e.key === 'j') && modKey) {
                    prevRepoPage();
                }

                // arrow right or L with mod
                if ((e.key === 'ArrowRight' || e.key === 'l') && modKey) {
                    nextRepoPage();
                }

                // alpha z
                if (e.key === 'z' && !modKey) {
                    if (!keySelectActive) return;
                    setRepoPanelVisible((visilble) => !visilble);
                }

                // esc
                if (e.key === 'Escape') {
                    setRepoPanelVisible(false);
                    if (!keySelectActive) return;
                    setKeySelectActive(false);
                    setKeySelectNumArr([]);
                }
            }
        },
        [
            keySelectNumArr,
            ksRepoColumn,
            keySelectActive,
            repoPanelVisible,
            whalesnote,
            nextRepoColumn,
            nextRepoPage,
            prevRepoColumn,
            prevRepoPage,
            setKeySelectActive,
            setRepoPanelVisible,
            setKeySelectNumArr,
            switchRepo,
        ],
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleWhell = useCallback(
        (e: WheelEvent) => {
            if (!repoScrollRef?.current) return;
            e.preventDefault();
            const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
            repoScrollRef.current.scrollLeft += delta;
        },
        [repoScrollRef],
    );

    useEffect(() => {
        if (!repoScrollRef?.current) return;
        repoScrollRef.current.addEventListener('wheel', handleWhell);
        return () => {
            repoScrollRef.current?.removeEventListener('wheel', handleWhell);
        };
    }, [handleWhell]);

    const getColumnNum = useCallback(
        (repoKey: string) => {
            for (const [index, key] of whalesnote.repo_keys.entries()) {
                if (key === repoKey) return Math.floor(index / 6.0);
            }
            return 0;
        },
        [whalesnote],
    );

    useEffect(() => {
        const column = getColumnNum(curRepoKey);
        setKSRepoColumn(column);
        if (column > 0 && repoScrollRef?.current) {
            repoScrollRef.current.scrollLeft =
                Math.floor(column / 5.0) * repoScrollRef.current.offsetWidth;
        }
    }, [curRepoKey]);

    return {
        adjustKSRepoColumn,
        ksRepoColumn,
        repoScrollRef,
    };
};
