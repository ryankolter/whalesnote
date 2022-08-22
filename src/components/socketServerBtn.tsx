import { useRef, useState, useCallback } from "react";
const { ipcRenderer, clipboard } = window.require("electron");

const SocketServerBtn: React.FC<SocketServerBtnProps> = () => {
    let [port, setPort] = useState<number>();
    let [status, setStatus] = useState<string>("close");

    const randomInt = useCallback((min: number, max: number) => {
        return Math.floor(Math.random() * (max - min)) + min;
    }, []);

    const openHttpServer = useCallback((port: number) => {
        ipcRenderer.once(
            "openHttpStatus",
            (event: any, { httpStatus, message }: { httpStatus: boolean; message: string }) => {
                console.log("open back:" + message);
                if (!httpStatus) {
                    let randomPort = randomInt(5000, 65535);
                    setPort(randomPort);
                    openHttpServer(randomPort);
                } else {
                    setStatus("open");
                    ipcRenderer.once("closeHttpSuccess", (event: any) => {
                        console.log("close back: close http success!!");
                        setStatus("close");
                    });
                }
            }
        );
        ipcRenderer.send("askOpenHttp", { port: port });
    }, []);

    const openBtn = useCallback(() => {
        let randomPort = 8087; //randomInt(5000,65535);
        setPort(randomPort);
        openHttpServer(randomPort);
    }, [openHttpServer]);

    const closeHttpServer = useCallback(() => {
        console.log("want close");
        ipcRenderer.once(
            "closeHttpStatus",
            (event: any, { httpStatus, message }: { httpStatus: boolean; message: string }) => {
                console.log("close back:" + message);
                if (httpStatus) {
                    setStatus("close");
                } else {
                }
            }
        );
        ipcRenderer.send("askcloseHttp");
    }, []);

    const closeBtn = useCallback(() => {
        closeHttpServer();
    }, []);

    const sendMessage = useCallback(() => {
        ipcRenderer.send("pcSendMessage", { data: "这条信息是PC主动送出的" });
    }, []);

    return (
        <div>
            {status === "open" ? (
                <input type='button' value='请求关闭服务器' onClick={closeBtn} />
            ) : (
                <input type='button' value='请求打开服务器' onClick={openBtn} />
            )}
            <input type='button' value='服务器发送信息' onClick={sendMessage} />
        </div>
    );
};

type SocketServerBtnProps = {};

export default SocketServerBtn;
