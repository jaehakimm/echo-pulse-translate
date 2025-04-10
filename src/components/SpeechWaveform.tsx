
import React from 'react';

interface SpeechWaveformProps {
  type: 'thai' | 'english';
}

const SpeechWaveform: React.FC<SpeechWaveformProps> = ({ type }) => {
  return (
    <div className={`waveform ${type}`}>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
      <div className="bar"></div>
    </div>
  );
};

export default SpeechWaveform;
