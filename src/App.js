import React from "react";
import { SiriusRTC } from "@nete2/sirius-rtc-sdk-ess";

function App() {
  const videoElementRef = React.useRef(null);
  const [statusText, setStatusText] = React.useState("");
  const [streamType, setStreamType] = React.useState("");
  const [isPlay, setIsPlay] = React.useState(false);
  const [settings, setSettings] = React.useState("");
  const [streamer, setStreamer] = React.useState(null);

  const validateSettings = (str) => {
    if (!str) {
      alert("Player settings should not empty!");
      return null;
    }

    const obj = JSON.parse(str);
    if (obj?.codec && obj?.stream_url) {
      return obj;
    }

    alert("Invalid player settings input!");
    return null;
  }

  const handleOnPlay = () => {
    console.log("-------- handleOnPlay --------");
    const settingsObj = validateSettings(settings);
    if (!settingsObj) return;

    const isH265 = settingsObj.codec.includes("H265");
    setStreamType(isH265 ? "H.265" : "H.264");
    let playSettings = { url: settingsObj.stream_url };
    let stream = SiriusRTC.createPlayStream({
      settings: playSettings,
      videoElement: videoElementRef.current,
      streamType: isH265 ? "websocket" : "webrtc",
    }).on(SiriusRTC.STREAM_EVENT.CONNECTING, (_) => {
      setStatusText("Connecting...");
    }).on(SiriusRTC.STREAM_EVENT.CONNECTED, (_) => {
      setStatusText("Playing...");
      setIsPlay(true);
    }).on(SiriusRTC.STREAM_EVENT.STOPPING, (_) => {
      setStatusText("Stopping...");
    }).on(SiriusRTC.STREAM_EVENT.STOPPED, (_) => {
      setStatusText("Stopped.");
      setIsPlay(false);
    }).on(SiriusRTC.STREAM_EVENT.CONNECT_FAILED, (_, error) => {
      setStatusText("Failed. " + error.message);
      setIsPlay(false);
    }).on(SiriusRTC.STREAM_EVENT.AUTH_FAILED, (_, error) => {
      setStatusText("Auth Failed. " + error.message);
      setIsPlay(false);
    }).on(SiriusRTC.STREAM_EVENT.CLOSED, (_, data) => {
      let info = JSON.parse(data);
      console.log("StreamClosed %o", info);
      if (info?.message) {
        setStatusText(info?.code + ", " + info?.message);
      } else {
        setStatusText("");
      }
      setIsPlay(false);
    });

    stream.play();
    setStreamer(stream);
  }

  const handleOnStop = () => {
    console.log("-------- handleOnStop --------");
    streamer?.stop();
    setStreamer(null);
    setIsPlay(false);
  }

  return (
    <div className="App">
      <div className="nete2-overlay"></div>
      <h4 className="title">SiriusRTC Player Demo</h4>

      <div className="view-container">
        <pre className="player-status">{statusText}</pre>
        <pre className="stream-type-status">{streamType}</pre>
        <video className="mvideo" ref={videoElementRef} autoPlay muted />
        {
          statusText === 'Connecting...' &&
          <div className="lds-dual-ring video-loading"></div>
        }

        <div className="view-group">
          <textarea type="text" placeholder="Stream settings"
            className="setting-text code" rows="10"
            readOnly={isPlay}
            value={settings}
            onChange={(e) => setSettings(e.target.value)} />

          <button className="button" disabled={isPlay} onClick={handleOnPlay}>
            Play
          </button>
          <button className="button" disabled={!isPlay} onClick={handleOnStop}>
            Stop
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;
