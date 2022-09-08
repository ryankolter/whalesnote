import { useState, useCallback } from 'react';
const { ipcRenderer } = window.require('electron');

const SocketServerBtn: React.FC<SocketServerBtnProps> = () => {
    const [curPort, setCurPort] = useState<number>();
    const [status, setStatus] = useState<string>('close');

    const randomInt = useCallback((min: number, max: number) => {
        return Math.floor(Math.random() * (max - min)) + min;
    }, []);

    const openHttpServer = useCallback((port: number) => {
        ipcRenderer.once(
            'openHttpStatus',
            (event: Event, { httpStatus, message }: { httpStatus: boolean; message: string }) => {
                console.log('open back:' + message);
                if (!httpStatus) {
                    const randomPort = randomInt(5000, 65535);
                    setCurPort(randomPort);
                    openHttpServer(randomPort);
                } else {
                    setStatus('open');
                    ipcRenderer.once('closeHttpSuccess', () => {
                        console.log('close back: close http success!!');
                        setStatus('close');
                    });
                }
            }
        );
        ipcRenderer.send('askOpenHttp', { port: port });
    }, []);

    const openBtn = useCallback(() => {
        const randomPort = 8087; //randomInt(5000,65535);
        setCurPort(randomPort);
        openHttpServer(randomPort);
    }, [openHttpServer]);

    const closeHttpServer = useCallback(() => {
        console.log('want close');
        ipcRenderer.once(
            'closeHttpStatus',
            (event: Event, { httpStatus, message }: { httpStatus: boolean; message: string }) => {
                console.log('close back:' + message);
                if (httpStatus) {
                    setStatus('close');
                } else {
                }
            }
        );
        ipcRenderer.send('askcloseHttp');
    }, []);

    const closeBtn = useCallback(() => {
        closeHttpServer();
    }, []);

    const sendMessage = useCallback(() => {
        ipcRenderer.send('pcSendMessage', { data: '这条信息是PC主动送出的' });
    }, []);

    return (
        <div>
            {status === 'open' ? (
                <input type="button" value="请求关闭服务器" onClick={closeBtn} />
            ) : (
                <input type="button" value="请求打开服务器" onClick={openBtn} />
            )}
            <input type="button" value="服务器发送信息" onClick={sendMessage} />
        </div>
    );
};

type SocketServerBtnProps = Record<string, never>;

export default SocketServerBtn;
