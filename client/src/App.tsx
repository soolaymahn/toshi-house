import React from 'react';
import logo from './logo.svg';
import './App.css';
import WebRTCPeerConnection from './WebRTCPeerConnection';
import { RTCApp } from './RTCApp';

function App() {
  return (
    <div className="App">
      <RTCApp />
    </div>
  );
}

export default App;
