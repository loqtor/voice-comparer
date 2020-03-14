import React, { Component, Fragment, ReactNode } from 'react';
import { getAudioStream } from '../util/media-devices';
import { generateSourceUrl } from '../util/blob';

export interface IRecorderState {
  isRecording: boolean;
  isResultAvailable: boolean;
  isShowingInput: boolean;
  mediaUrl: string;
  recorder: any; // TODO: Get types for this.
  currentStream: any;
}

export interface IDataAvailableEvent {
  data: Blob;
}

export interface IRecorderProps {
  onStart?: () => void;
  onDataAvailable?: (e: IDataAvailableEvent) => void;
  onStop?: (mediaUrl: string, state: IRecorderState) => void;
}

const DATA_AVAILABLE_INTERVAL = 500;

export const BaseRecorder = class BaseRecorder extends Component<IRecorderProps, IRecorderState> {
  state: IRecorderState = {
    isRecording: false,
    isResultAvailable: false,
    isShowingInput: false,
    mediaUrl: '',
    recorder: null,
    currentStream: null,
  };

  isSettingMediaRecorder: boolean = false;
  fragments: any[] = [];
  previewElement?: HTMLMediaElement;

  toggleRecord = () => {
    const { isRecording } = this.state;

    if (!isRecording) {
      this.record();
    } else {
      this.save();
    }
  }

  getStream = () => {
    console.warn('This method should be overwritten. Or use video-recorder or audio-recorder. Returning `getAudioStream` by default.');
    return getAudioStream();
  }

  record = async () => {
    const { recorder } = this.state;

    if (!recorder) {
      this.isSettingMediaRecorder = true;

      return this.getStream()
        .then(currentStream => {
          if (this.previewElement) {
            this.previewElement.srcObject = currentStream;
          }

          // @ts-ignore -- Check what's up with the types
          const mediaRecorder = new MediaRecorder(currentStream);

          mediaRecorder.onstart = () => {
            this.setState({
              currentStream,
            }, () => {
              const { onStart } = this.props;
  
              if (onStart) {
                onStart();
              }
            });
          };

          mediaRecorder.ondataavailable = (e: IDataAvailableEvent) => {
            this.fragments.push(e.data);

            const { onDataAvailable } = this.props;

            if (onDataAvailable) {
              onDataAvailable(e);
            }
          }

          mediaRecorder.onstop = () => {
            const { fragments } = this;
            const mediaUrl = generateSourceUrl(fragments);

            this.fragments = [];

            this.setState({
              isRecording: false,
              isResultAvailable: true,
              mediaUrl,
            }, () => {
              const { onStop } = this.props;

              if (onStop) {
                onStop(mediaUrl, this.state);
              }
            });
          }

          this.setState({
            recorder: mediaRecorder,
            isRecording: true,
          }, () => {
            mediaRecorder.start(DATA_AVAILABLE_INTERVAL);
          });
        });
    }

    recorder.start();

    this.setState({
      isRecording: true,
    });
  }

  save = () => {
    const { recorder } = this.state;

    recorder.stop();
  }

  renderPreview = (): ReactNode | null => {
    console.log('This method should be overriden and you should not be using `BaseRecorder`.');
    return <Fragment/>;
  }

  renderResult = () => {
    const { mediaUrl } = this.state;

    return (<audio controls src={mediaUrl}></audio>)
  }

  render() {
    const { isResultAvailable, isRecording } = this.state;
    const buttonLabel = isRecording ? 'Stop' : 'Record';
    const showResult = isResultAvailable && !isRecording;

    return (
      <Fragment>
        <h2>Press the button to record your message.</h2>
        <button onClick={this.toggleRecord}>{buttonLabel}</button>
        {this.renderPreview()}
        {showResult && this.renderResult()}
      </Fragment>
    )
  }
}