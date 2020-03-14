import React, { Component } from 'react';
import { AudioRecorder } from '../components/audio-recorder';
import { IDataAvailableEvent, IRecorderState } from '../components/base-recorder';

interface IStreamPerTime {
  [keyof: number]: IDataAvailableEvent[];
}

interface IHomeState {
  streams: any[];
  audioUris: string[];
  streamDataPerTime: IStreamPerTime[],
  decodedAudios: any[];
}

export const Home = class Home extends Component<{}, IHomeState> {
  audioContext: AudioContext;

  constructor(props: {}) {
    super(props);

    this.state = {
      streams: [],
      audioUris: [],
      streamDataPerTime: [],
      decodedAudios: [],
    }

    this.audioContext = new AudioContext();
  }

  onStart = () => {
    console.log('Its recording');
  }

  onDataAvailable = (event: IDataAvailableEvent) => {
    const { 
      streams: {
        length: streamIndex,
      },
      streamDataPerTime,
    } = this.state;

    if (!streamDataPerTime[streamIndex]) {
      streamDataPerTime[streamIndex] = {} as IStreamPerTime;
    }

    const timestamp = new Date().getMilliseconds();
    streamDataPerTime[streamIndex][timestamp] = []
    streamDataPerTime[streamIndex][timestamp].push(event);

    this.setState({
      streamDataPerTime,
    });
  }

  onStop = async (mediaUrl: string, event: any, state: IRecorderState) => {
    const { audioUris, streams, decodedAudios } = this.state;

    const file = await fetch(mediaUrl);
    const data = await file.arrayBuffer();
    const decodedAudio = await this.audioContext.decodeAudioData(data);

    this.setState({
      streams: [...streams, state.currentStream],
      audioUris: [...audioUris, mediaUrl],
      decodedAudios: [...decodedAudios, decodedAudio],
    });
  }

  render() {
    const { streams } = this.state;

    return (
      <>
        <AudioRecorder
          onStart={this.onStart}
          onDataAvailable={this.onDataAvailable}
          onStop={this.onStop}
        />
        {streams && streams.length !== 0 && streams.map((stream, streamIndex) => {
          const audioTracks = stream.getAudioTracks();
          
          return (
            <div className="Stats">
              <table className='Stats Stats-capabilities'>
                <thead>
                  <tr>
                    <th>Stream {streamIndex + 1}</th>
                    <th>Autogain Control</th>
                    <th>Channel count</th>
                    <th>Device ID</th>
                    <th>Echo cancellation</th>
                    <th>groupId</th>
                    <th>Latency</th>
                    <th>Noise suppression</th>
                    <th>Sample rate</th>
                    <th>Sample size</th>
                  </tr>
                </thead>
                <tbody>
                  {audioTracks.map((audioTrack: any, audioTrackIndex: number) => <AudioTrackCapabilities audioTrack={audioTrack} index={audioTrackIndex}/>)}
                </tbody>
              </table>
              {/* <table className='Stats Stats-contraints'>
                {audioTracks.map((audioTrack) => )}
              </table>
              <table className='Stats Stats-settings'>
                {audioTracks.map((audioTrack) => )}
              </table> */}
            </div>
          );
        })}
      </>
    );
  }
};

const AudioTrackCapabilities = ({ audioTrack, index }: any) => {
  const capabilities = audioTrack.getCapabilities();

  return (
    <tr>
      <td>Audio Track {index + 1}</td>
      <td>{capabilities.autoGainControl[0] ? 'Yes' : 'No'}, {capabilities.autoGainControl[1] ? 'Yes' : 'No'}</td>
      <td>max: {capabilities.channelCount.max}, min: {capabilities.channelCount.min}</td>
      <td>{capabilities.deviceId}</td>
      <td>{capabilities.echoCancellation[0] ? 'Yes' : 'No'}, {capabilities.echoCancellation[1] ? 'Yes' : 'No'}</td>
      <td>{capabilities.groupId}</td>
      <td>max: {capabilities.latency.max}, min: {capabilities.latency.min}</td>
      <td>{capabilities.noiseSuppression[0] ? 'Yes' : 'No' }, {capabilities.noiseSuppression[1] ? 'Yes' : 'No'}</td>
      <td>max: {capabilities.sampleRate.max}, min: {capabilities.sampleRate.min}</td>
      <td>max: {capabilities.sampleSize.max}, min: {capabilities.sampleSize.min}</td>
    </tr>
  );
};

// const AudioTrackConstraints = ({ audioTrack }: { getCapabilities: () => {}}) => {
//   const capabilities = audioTrack.getConstraints();

//   return (
//     <tr></tr>
//   )
// };

// const AudioTrackSettings = ({ audioTrack }: { getCapabilities: () => {}}) => {
//   const capabilities = audioTrack.getSettings();

//   return (
//     <tr></tr>
//   )
// };