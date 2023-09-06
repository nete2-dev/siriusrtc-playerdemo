import React from "react";
import { SiriusRTC } from "@nete2/sirius-rtc-sdk-ess";

function App() {
  const videoElementRef = React.useRef(null);
  const [status, setStatus] = React.useState("");
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

    setStreamType(settingsObj.codec.includes("H265") ? "H.265" : "H.264");
    let streamType = settingsObj.codec.includes("H265") ? "websocket" : "webrtc";
    let playSettings = { url: settingsObj.stream_url };

    let stream = SiriusRTC.createPlayStream({
      settings: playSettings,
      videoElement: videoElementRef.current,
      streamType: streamType,
    }).on(SiriusRTC.STREAM_EVENT.CONNECTING, (_) => {
      setStatus("Connecting...");
    }).on(SiriusRTC.STREAM_EVENT.CONNECTED, (_) => {
      setStatus("Playing...");
      setIsPlay(true);
    }).on(SiriusRTC.STREAM_EVENT.STOPPING, (_) => {
      setStatus("Stopping...");
    }).on(SiriusRTC.STREAM_EVENT.STOPPED, (_) => {
      setStatus("Stopped.");
      setIsPlay(false);
    }).on(SiriusRTC.STREAM_EVENT.CONNECT_FAILED, (_, error) => {
      setStatus("Failed. " + error.message);
      setIsPlay(false);
    }).on(SiriusRTC.STREAM_EVENT.AUTH_FAILED, (_, error) => {
      setStatus("Auth Failed. " + error.message);
      setIsPlay(false);
    }).on(SiriusRTC.STREAM_EVENT.CLOSED, (_, data) => {
      let info = JSON.parse(data);
      console.log("StreamClosed %o", info);
      setStatus(info?.message);
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
      <h4 className="title">SiriusRTC Player Demo</h4>

      <div className="view-container">
        <pre className="player-status">{status}</pre>
        <pre className="stream-type-status">{streamType}</pre>
        <video className="mvideo" ref={videoElementRef} autoPlay muted />
        {
          status === 'Connecting...' &&
          <div class="lds-dual-ring video-loading"></div>
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
