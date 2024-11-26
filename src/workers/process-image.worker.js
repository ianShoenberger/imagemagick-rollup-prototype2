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

const onLoadEnd = (callback) => async (event) => {
  // create file buffer
  const buffer = new Uint8Array(event.target.result)

  // read image buffer
  ImageMagick.read(buffer, async (image) => {
    // exif metadata may result in displaying image in incorrect orientation
    // we need to update the orientation if it's orientation is not 'normal'
    // review: https://jpegclub.org/exif_orientation.html
    if (image.orientation !== OrientationType.Undefined || image.orientation !== OrientationType.TopLeft) {
      image.autoOrient()
    }

    // down-size image (can be updated accordingly)
    image.resize(200, 200)

    // we don't have access to DOM, so we create an OffscreenCanvas
    const canvas = new OffscreenCanvas(image.width, image.height)

    // write image data onto canvas
    image.writeToCanvas(canvas)

    // get canvas blob
    const blob = await canvas.convertToBlob()

    // read blob and return dataURL
    const reader = new FileReader()
    reader.onload = () => callback(reader.result)
    reader.readAsDataURL(blob)
  })
}

const onError = () => {
  throw new Error('There was an error reading the heic file!')
}

self.onmessage = async function (event) {
  await initialized

  // declarations
  const { file } = event.data

  // send dataURL back to Queue
  const callback = (dataURL) => {
    this.postMessage(dataURL)
  }

  // read file
  const reader = new FileReader()
  reader.onloadend = onLoadEnd(callback)
  reader.onerror = onError
  reader.readAsArrayBuffer(file)
}
