import { 
  ImageMagick,
  OrientationType,
  initializeImageMagick,
  Magick,
  Quantum
} from '@imagemagick/magick-wasm'
import wasm from '../../node_modules/@imagemagick/magick-wasm/dist/magick.wasm'

const initialized = (async () => {
  // initialize module w/ wasm

  /** THIS ALSO WORKED */
  // const wasmUrl = new URL('http://localhost:8084/magick.wasm')
  // await initializeImageMagick(wasmUrl)

  /** BUT NOW THIS IS THE WAY */
  const instance = await wasm();
  await initializeImageMagick(instance);
  console.log(Magick.imageMagickVersion);
  console.log('Delegates:', Magick.delegates);
  console.log('Features:', Magick.features);
  console.log('Quantum:', Quantum.depth);
})()

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const onLoadEnd = async (callback, base64, fileName) => {
  // we could normally do FileReader.readAsArrayBuffer() -> new Uint8Array but....
  // since we are doing this for smart cards, we get a base64 string and need to convert that to typed array (Uint8Array)
  // create typed array
  const buffer = base64ToArrayBuffer(base64)

  // read image buffer
  ImageMagick.read(buffer, async (image) => {
    // exif metadata may result in displaying image in incorrect orientation
    // we need to update the orientation if it's orientation is not 'normal'
    // review: https://jpegclub.org/exif_orientation.html
    if (image.orientation !== OrientationType.Undefined || image.orientation !== OrientationType.TopLeft) {
      image.autoOrient()
    }

    if (image.height > 1536 || image.width > 1536) {
      // down-size image
      image.resize(1536, 1536) // this doesn't actually make a square - it maintains aspect ratio
    }

    // we don't have access to DOM, so we create an OffscreenCanvas
    const canvas = new OffscreenCanvas(image.width, image.height)

    // write image data onto canvas
    image.writeToCanvas(canvas)

    // get canvas blob
    const blob = await canvas.convertToBlob()

    // read blob and return dataURL
    const reader = new FileReader()
    reader.onload = () => callback(reader.result, fileName)
    reader.readAsDataURL(blob)
  })
}

const onError = () => {
  throw new Error('There was an error reading the heic file!')
}

self.onmessage = async function (event) {
  await initialized

  // declarations
  const { file, name } = event.data

  // send dataURL back to Queue
  const callback = (dataURL, fileName) => {
    this.postMessage({ dataURL, fileName })
  }

  // read file
  // const reader = new FileReader()
  // reader.onloadend = onLoadEnd(callback)
  // reader.onerror = onError
  // reader.readAsArrayBuffer(file)
  onLoadEnd(callback, file, name)
}
