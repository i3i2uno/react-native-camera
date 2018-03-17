import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Platform,
    StyleSheet,
    View,
    ViewPropTypes,
    Alert
} from 'react-native';

const CameraManager = {
    Aspect: {
        fill: 'true'
    },
    Type: {
        back: 'user',
        front: 'environment'
    },
    Orientation: {
        auto: 'true'
    },
    CaptureMode: {
        still: 'true'
    },
    CaptureTarget: {
        cameraRoll: 'true'
    },
    CaptureQuality: {
        high: 'true'
    },
    FlashMode: {
        off: 'true'
    },
    TorchMode: {
        off: 'true'
    }
};
const CAMERA_REF = 'camera';

function convertNativeProps(props) {
    const newProps = { ...props };
    if (typeof props.aspect === 'string') {
        newProps.aspect = Camera.constants.Aspect[props.aspect];
    }

    if (typeof props.flashMode === 'string') {
        newProps.flashMode = Camera.constants.FlashMode[props.flashMode];
    }

    if (typeof props.orientation === 'string') {
        newProps.orientation = Camera.constants.Orientation[props.orientation];
    }

    if (typeof props.torchMode === 'string') {
        newProps.torchMode = Camera.constants.TorchMode[props.torchMode];
    }

    if (typeof props.type === 'string') {
        newProps.type = Camera.constants.Type[props.type];
    }

    if (typeof props.captureQuality === 'string') {
        newProps.captureQuality = Camera.constants.CaptureQuality[props.captureQuality];
    }

    if (typeof props.captureMode === 'string') {
        newProps.captureMode = Camera.constants.CaptureMode[props.captureMode];
    }

    if (typeof props.captureTarget === 'string') {
        newProps.captureTarget = Camera.constants.CaptureTarget[props.captureTarget];
    }

    // do not register barCodeTypes if no barcode listener
    if (typeof props.onBarCodeRead !== 'function') {
        newProps.barCodeTypes = [];
    }

    newProps.barcodeScannerEnabled = typeof props.onBarCodeRead === 'function'

    return newProps;
}

export default class Camera extends Component {

    static constants = {
        Aspect: CameraManager.Aspect,
        BarCodeType: CameraManager.BarCodeType,
        Type: CameraManager.Type,
        CaptureMode: CameraManager.CaptureMode,
        CaptureTarget: CameraManager.CaptureTarget,
        CaptureQuality: CameraManager.CaptureQuality,
        Orientation: CameraManager.Orientation,
        FlashMode: CameraManager.FlashMode,
        TorchMode: CameraManager.TorchMode
    };

    static propTypes = {
        // ...ViewPropTypes,
        aspect: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        captureAudio: PropTypes.bool,
        captureMode: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        captureQuality: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        captureTarget: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        defaultOnFocusComponent: PropTypes.bool,
        flashMode: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        keepAwake: PropTypes.bool,
        onBarCodeRead: PropTypes.func,
        barcodeScannerEnabled: PropTypes.bool,
        onFocusChanged: PropTypes.func,
        onZoomChanged: PropTypes.func,
        mirrorImage: PropTypes.bool,
        fixOrientation: PropTypes.bool,
        barCodeTypes: PropTypes.array,
        orientation: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        playSoundOnCapture: PropTypes.bool,
        torchMode: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]),
        type: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ])
    };

    static defaultProps = {
        aspect: CameraManager.Aspect.fill,
        type: CameraManager.Type.back,
        orientation: CameraManager.Orientation.auto,
        fixOrientation: false,
        captureAudio: false,
        captureMode: CameraManager.CaptureMode.still,
        captureTarget: CameraManager.CaptureTarget.cameraRoll,
        captureQuality: CameraManager.CaptureQuality.high,
        defaultOnFocusComponent: true,
        flashMode: CameraManager.FlashMode.off,
        playSoundOnCapture: true,
        torchMode: CameraManager.TorchMode.off,
        mirrorImage: false,
    };

    static checkDeviceAuthorizationStatus = CameraManager.checkDeviceAuthorizationStatus;
    static checkVideoAuthorizationStatus = CameraManager.checkVideoAuthorizationStatus;
    static checkAudioAuthorizationStatus = CameraManager.checkAudioAuthorizationStatus;

    setNativeProps(props) {
        this.refs[CAMERA_REF].setNativeProps(props);
    }

    constructor() {
        super();
        this.state = {
            isAuthorized: false,
            isRecording: false
        };
    }

    componentWillMount() {
        // let { captureMode } = convertNativeProps({ captureMode: this.props.captureMode })
        // let hasVideoAndAudio = this.props.captureAudio && captureMode === Camera.constants.CaptureMode.video
        // let check = hasVideoAndAudio ? Camera.checkDeviceAuthorizationStatus : Camera.checkVideoAuthorizationStatus;

        // if (check) {
        //   const isAuthorized = await check();
        this.setState({ isAuthorized: true });
        // }
    }

    componentWillUnmount() {
        if (this.state.isRecording) {
            this.stopCapture();
        }
        var video = this.refs[CAMERA_REF];
        video.srcObject = null;
        if (this.Stream) {
            this.Stream.getTracks().map(t => {
                t.stop();
            })
        }
    }

    capture(options) {
        const props = convertNativeProps(this.props);
        options = {
            audio: props.captureAudio,
            mode: props.captureMode,
            playSoundOnCapture: props.playSoundOnCapture,
            target: props.captureTarget,
            quality: props.captureQuality,
            type: props.type,
            title: '',
            description: '',
            mirrorImage: props.mirrorImage,
            fixOrientation: props.fixOrientation,
            ...options
        };

        if (options.mode === Camera.constants.CaptureMode.video) {
            options.totalSeconds = (options.totalSeconds > -1 ? options.totalSeconds : -1);
            options.preferredTimeScale = options.preferredTimeScale || 30;
            this.setState({ isRecording: true });
        }

        return new Promise((res, rej) => {
            try {
                const canvas = document.createElement('canvas');
                document.querySelector('body').appendChild(canvas);

                // set canvas dimensions to video ones to not truncate picture
                const videoElement = this.refs[CAMERA_REF];

                const dc = 1.332;
                const w = videoElement.offsetWidth;
                const h = videoElement.offsetHeight;

                canvas.width = w;
                canvas.height = h;

                // copy full video frame into the canvas
                canvas.getContext('2d').drawImage(videoElement, 0, 0, w, h);

                // get image data URL and remove canvas
                const snapshot = canvas.toDataURL("image/png");
                canvas.parentNode.removeChild(canvas);

                // update grid picture source
                this.setState({ isRecording: false });
                res({ mediaUri: snapshot });
            } catch (err) {
                rej(err);
            }
        })
    }

    stopCapture() {
        if (this.state.isRecording) {
            this.setState({ isRecording: false });
            return CameraManager.stopCapture();
        }
        return Promise.resolve("Not Recording.");
    }

    getFOV() {
        return CameraManager.getFOV();
    }

    requestPermissions() {
        return CameraManager.requestPermissions();
    }

    checkPermissions(cb) {
        if (Platform.OS === 'ios' || Platform.OS === 'web') {
            return cb({});
        }
        return CameraManager.checkPermissions(cb);
    }

    hasFlash() {
        if (Platform.OS === 'android') {
            const props = convertNativeProps(this.props);
            return CameraManager.hasFlash({
                type: props.type
            });
        }
        return CameraManager.hasFlash();
    }

    componentDidMount() {
        var video = this.refs[CAMERA_REF];
        var vidContainer = this.refs['vidContainer'];

        if (vidContainer && vidContainer.measure) {
            vidContainer.measure((x, y, w, h, xy, yy) => {
                this.Width = w;
                this.Height = h;
                video.setAttribute('playsinline', '');
                video.setAttribute('autoplay', '');
                // const w = vidContainer._reactInternalInstance._renderedComponent._hostNode.clientWidth;
                // const h = vidContainer._reactInternalInstance._renderedComponent._hostNode.clientHeight;
                video.style.width = this.Width + 'px';
                video.style.height = this.Height + 'px';

                /* Setting up the constraint */
                var facingMode = this.props.type || CameraManager.Type.back; // Can be 'user' or 'environment' to access back or front camera (NEAT!)
                var constraints = {
                    audio: true,
                    video: {
                        // width: { exact: w }, 
                        // height: { exact: w / 1.7777777777777777 },
                        facingMode: facingMode
                    }
                };

                /* Stream it to video element */
                navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                    this.Stream = stream;
                    video.srcObject = this.Stream;
                }).catch(err => {
                    Alert.alert(
                        "Camera Error",
                        "We were unable to find your Webcam, or permissions were denied. If this continues to occur, you may have to clear your cache and try again.",
                        [
                            { text: 'Okay', onPress: () => { } }
                        ]
                    )
                });
            })
        }
    }

    render() {
        return (
            <View ref={'vidContainer'} style={[styles.base, this.props.style]}>
                <video ref={CAMERA_REF} />
                {this.props.children}
            </View>
        )
    }
}

export const constants = Camera.constants;

const styles = StyleSheet.create({
    base: {},
});
