import { useEffect, useState } from "react";
import webSocket, { Socket } from "socket.io-client";

const SocketClientBtn: React.FC<SocketClientBtnProps> = () => {
  const [client, setClient] = useState<Socket | null>(null);
  let [status, setStatus] = useState<string>("close");

  const connectWebSocket = () => {
    setClient(
      webSocket(`http://localhost:8087`, {
        reconnection: false,
      })
    );
  };

  useEffect(() => {
    initWebSocket();
  }, [client]);

  const initWebSocket = () => {
    client?.once("connectSuccess", (data) => {
      setStatus("open");
      console.log("connect to PC success!");
      console.log("Mobile收到PC的信息:" + data);
    });
    client?.on("mobileAndPC", (data) => {
      console.log("Mobile收到PC的信息:" + data);
    });
  };

  const disconnectWebSocket = () => {
    let result = client?.close();
    console.log(result);
    setStatus("close");
    console.log("disconnect success!");
  };

  const sendMessage = () => {
    client?.emit("mobileAndPC", "这条信息是Mobile主动送出的");
  };

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
