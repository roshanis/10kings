import React from 'react';
import {AbsoluteFill, Composition, Html5Audio, Sequence, staticFile} from 'remotion';
import './theme';
import {kings} from './data';
import {EndCard, KingCard, MapScene, Opening} from './scenes';
import timeline from './timeline.json';

// Scene timing comes from scripts/audio.py, which lays the scenes out around the narration.
const Trailer: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#0b0806'}}>
    <Html5Audio src={staticFile('audio/soundtrack.wav')} />
    <Sequence from={timeline.opening.from} durationInFrames={timeline.opening.duration}>
      <Opening />
    </Sequence>
    <Sequence from={timeline.map.from} durationInFrames={timeline.map.duration}>
      <MapScene />
    </Sequence>
    {kings.map((king, i) => (
      <Sequence key={king.id} from={timeline.cards[i].from} durationInFrames={timeline.cards[i].duration}>
        <KingCard king={king} index={i} />
      </Sequence>
    ))}
    <Sequence from={timeline.end.from} durationInFrames={timeline.end.duration}>
      <EndCard />
    </Sequence>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Trailer" component={Trailer} durationInFrames={timeline.total} fps={timeline.fps} width={1920} height={1080} />
);
