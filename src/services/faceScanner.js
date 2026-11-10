import { compareFaceDescriptors } from './caseAnalysis';

let modelsPromise;

async function getFaceApi() {
  if (!modelsPromise) {
    modelsPromise = import('face-api.js').then(async (faceapi) => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models/face-api'),
      ]);
      return faceapi;
    }).catch((error) => {
      modelsPromise = undefined;
      throw error;
    });
  }
  return modelsPromise;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('ไม่สามารถโหลดภาพหลักฐานได้'));
    image.src = src;
  });
}

export async function scanCaseFaces(evidence, onFaceDetected = () => {}) {
  const [faceapi, cctvImage, referenceImage] = await Promise.all([
    getFaceApi(), loadImage(evidence.cctv.imageUrl), loadImage(evidence.reference.imageUrl),
  ]);
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 });
  const cctvFace = await faceapi.detectSingleFace(cctvImage, options).withFaceLandmarks().withFaceDescriptor();
  if (!cctvFace) throw new Error('ไม่พบใบหน้าในภาพจากกล้อง กรุณาตรวจสอบภาพแล้วลองใหม่');
  const { width, height } = cctvImage;
  const box = cctvFace.detection.box;
  const overlay = {
    box: { x: box.x / width, y: box.y / height, width: box.width / width, height: box.height / height },
    landmarks: cctvFace.landmarks.positions.map((point) => ({ x: point.x / width, y: point.y / height })),
  };
  onFaceDetected(overlay);
  const referenceFace = await faceapi.detectSingleFace(referenceImage, options).withFaceLandmarks().withFaceDescriptor();
  if (!referenceFace) throw new Error('ไม่พบใบหน้าในภาพอ้างอิง กรุณาตรวจสอบภาพแล้วลองใหม่');
  const comparison = compareFaceDescriptors(cctvFace.descriptor, referenceFace.descriptor);
  return { ...comparison, ...overlay };
}
