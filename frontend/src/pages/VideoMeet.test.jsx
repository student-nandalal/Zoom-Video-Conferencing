import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import io from 'socket.io-client';
import VideoMeetComponent from './VideoMeet';

class MockMediaStream {
  constructor(tracks) {
    this.tracks = tracks;
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter((track) => track.kind === 'video');
  }

  getAudioTracks() {
    return this.tracks.filter((track) => track.kind === 'audio');
  }
}

const makeTrack = (kind) => ({
  kind,
  enabled: true,
  onended: null,
  stop: jest.fn()
});

let socketHandlers;
let socket;

const setupMeeting = async (getDisplayMedia) => {
  const mediaDevices = {
    getUserMedia: jest.fn(({ video, audio }) => Promise.resolve(new MockMediaStream([
      ...(video ? [makeTrack('video')] : []),
      ...(audio ? [makeTrack('audio')] : [])
    ]))),
    getDisplayMedia
  };

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: mediaDevices
  });
  Object.defineProperty(global, 'MediaStream', {
    configurable: true,
    value: MockMediaStream
  });

  render(<VideoMeetComponent />);
  await screen.findByRole('button', { name: 'Connect' });
  await waitFor(() => expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(3));

  fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
  await screen.findByRole('button', { name: 'Share screen' });
  await waitFor(() => expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(4));

  return mediaDevices;
};

afterEach(() => {
  jest.restoreAllMocks();
  window.localStream = undefined;
  delete global.MediaStream;
  delete global.RTCPeerConnection;
  delete navigator.mediaDevices;
});

beforeEach(() => {
  socketHandlers = {};
  socket = {
    id: 'local-socket',
    on: jest.fn((event, handler) => {
      socketHandlers[event] = handler;
    }),
    emit: jest.fn()
  };
  jest.spyOn(io, 'connect').mockReturnValue(socket);
});

test('shares the display while keeping microphone audio and restores the camera on stop', async () => {
  const displayTrack = makeTrack('video');
  const displayStream = new MockMediaStream([displayTrack]);
  const getDisplayMedia = jest.fn().mockResolvedValue(displayStream);
  const mediaDevices = await setupMeeting(getDisplayMedia);
  const cameraStream = window.localStream;
  const microphoneTrack = cameraStream.getAudioTracks()[0];

  fireEvent.click(screen.getByRole('button', { name: 'Share screen' }));

  expect(await screen.findByRole('button', { name: 'Stop screen sharing' })).toBeInTheDocument();
  expect(getDisplayMedia).toHaveBeenCalledWith({ video: true });
  expect(window.localStream.getVideoTracks()).toContain(displayTrack);
  expect(window.localStream.getAudioTracks()).toContain(microphoneTrack);

  fireEvent.click(screen.getByRole('button', { name: 'Mute microphone' }));
  expect(microphoneTrack.enabled).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Unmute microphone' }));
  expect(microphoneTrack.enabled).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Stop screen sharing' }));

  await waitFor(() => expect(screen.getByRole('button', { name: 'Share screen' })).toBeInTheDocument());
  expect(window.localStream).toBe(cameraStream);
  expect(displayTrack.stop).toHaveBeenCalled();
  expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(4);
});

test('shows screen-capture permission errors', async () => {
  const permissionError = new Error('Permission denied');
  permissionError.name = 'NotAllowedError';
  const getDisplayMedia = jest.fn().mockRejectedValue(permissionError);
  await setupMeeting(getDisplayMedia);

  fireEvent.click(screen.getByRole('button', { name: 'Share screen' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
});

test('restores the camera when the browser ends screen capture', async () => {
  const displayTrack = makeTrack('video');
  const getDisplayMedia = jest.fn().mockResolvedValue(new MockMediaStream([displayTrack]));
  await setupMeeting(getDisplayMedia);
  const cameraStream = window.localStream;

  fireEvent.click(screen.getByRole('button', { name: 'Share screen' }));
  await screen.findByRole('button', { name: 'Stop screen sharing' });

  act(() => displayTrack.onended());

  await waitFor(() => expect(screen.getByRole('button', { name: 'Share screen' })).toBeInTheDocument());
  expect(window.localStream).toBe(cameraStream);
});

test('switches the remote peer to the shared screen and back to the camera', async () => {
  const displayTrack = makeTrack('video');
  const getDisplayMedia = jest.fn().mockResolvedValue(new MockMediaStream([displayTrack]));
  await setupMeeting(getDisplayMedia);

  const peerConnections = [];
  global.RTCPeerConnection = jest.fn(() => {
    const connection = {
      senders: [],
      localDescription: null,
      getSenders() {
        return this.senders;
      },
      addStream(stream) {
        stream.getTracks().forEach((track) => {
          if (!this.senders.some((sender) => sender.track === track)) {
            const sender = {
              track,
              replaceTrack: jest.fn(function (nextTrack) {
                this.track = nextTrack;
                return Promise.resolve();
              })
            };
            this.senders.push(sender);
          }
        });
      },
      addTrack(track) {
        const sender = {
          track,
          replaceTrack: jest.fn(function (nextTrack) {
            this.track = nextTrack;
            return Promise.resolve();
          })
        };
        this.senders.push(sender);
        return sender;
      },
      createOffer: jest.fn().mockResolvedValue({ type: 'offer' }),
      setLocalDescription: jest.fn(async function (description) {
        this.localDescription = description;
      })
    };
    peerConnections.push(connection);
    return connection;
  });

  socketHandlers.connect();
  socketHandlers['user-joined']('local-socket', ['local-socket', 'remote-socket']);
  const remoteConnection = peerConnections[1];
  const cameraTrack = window.localStream.getVideoTracks()[0];

  await waitFor(() => expect(remoteConnection.senders.some((sender) => sender.track === cameraTrack)).toBe(true));
  fireEvent.click(screen.getByRole('button', { name: 'Share screen' }));
  await screen.findByRole('button', { name: 'Stop screen sharing' });
  await waitFor(() => expect(remoteConnection.senders.some((sender) => sender.track === displayTrack)).toBe(true));

  fireEvent.click(screen.getByRole('button', { name: 'Stop screen sharing' }));
  await waitFor(() => expect(remoteConnection.senders.some((sender) => sender.track === cameraTrack)).toBe(true));
});
