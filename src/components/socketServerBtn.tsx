import { useRef, useState } from "react";
const { ipcRenderer, clipboard } = window.require("electron");

const SocketServerBtn: React.FC<SocketServerBtnProps> = () => {
  let [port, setPort] = useState<number>();
  let [status, setStatus] = useState<string>("close");

  const openBtn = () => {
    let randomPort = 8087; //randomInt(1024,65535);
    setPort(randomPort);
    openHttpServer(randomPort);
  };

  const openHttpServer = (port: number) => {
    ipcRenderer.once(
      "openHttpStatus",
      (
        event: any,
        { status, message }: { status: boolean; message: string }
      ) => {
        console.log("open back:" + message);
        if (!status) {
          let randomPort = randomInt(1024, 65535);
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
  };

  const closeBtn = () => {
    closeHttpServer();
  };

  const closeHttpServer = () => {
    console.log("want close");
    ipcRenderer.once(
      "closeHttpStatus",
      (
        event: any,
        { status, message }: { status: boolean; message: string }
      ) => {
        console.log("close back:" + message);
        if (status) {
          setStatus("close");
        } else {
        }
      }
    );
    ipcRenderer.send("askcloseHttp");
  };

  const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min)) + min;
  };

  const sendMessage = () => {
    ipcRenderer.send("pcSendMessage", { data: "这条信息是PC主动送出的" });
  };

  return (
    <div>
      {status === "open" ? (
        <input type="button" value="请求关闭服务器" onClick={closeBtn} />
      ) : (
        <input type="button" value="请求打开服务器" onClick={openBtn} />
      )}
      <input type="button" value="服务器发送信息" onClick={sendMessage} />
    </div>
  );
  return <div></div>;
};

type SocketServerBtnProps = {};

export default SocketServerBtn;
