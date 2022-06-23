import { useRef, useEffect, useState, useCallback } from "react";
import webSocket, { Socket } from "socket.io-client";

const SocketClientBtn: React.FC<SocketClientBtnProps> = () => {
  //const [client, setClient] = useState<Socket | null>(null);
  const client = useRef<Socket | null>(null);
  let [status, setStatus] = useState<string>("close");

  const connectWebSocket = useCallback(() => {
    client.current = webSocket(`http://localhost:8087`, {
      reconnection: false,
    });

    client.current?.once("connectSuccess", (data) => {
      setStatus("open");
      console.log("connect to PC success!");
      console.log("Mobile收到PC的信息:" + data);
    });
    client.current?.on("PcToMobile", (data) => {
      console.log("Mobile收到PC的信息:" + data);
    });
  }, []);

  const disconnectWebSocket = useCallback(() => {
    let result = client.current?.close();
    console.log(result);
    setStatus("close");
    client.current = null;
    console.log("disconnect success!");
  }, []);

  const sendMessage = useCallback(() => {
    client.current?.emit("MobileToPc", "这条信息是Mobile主动送出的");
  }, []);

  return (
    <div>
      {status === "open" ? (
        <input type="button" value="断开" onClick={disconnectWebSocket} />
      ) : (
        <input type="button" value="同步" onClick={connectWebSocket} />
      )}
      <input type="button" value="手机端发送信息" onClick={sendMessage} />
    </div>
  );
};

type SocketClientBtnProps = {};

export default SocketClientBtn;
