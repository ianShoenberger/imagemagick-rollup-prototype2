import { 
  ImageMagick,
  OrientationType,
  initializeImageMagick,
  Magick,
  Quantum
} from '@imagemagick/magick-wasm'
// import wasm from '../../assets/wasm/magick.wasm'

const initialized = (async () => {
  // initialize module w/ wasm
  // const magickWasmURL = new URL('../../assets/wasm/magick.wasm', import.meta.url)
  // const wasmModule = await wasm()
  // const wasmInstance = new WebAssembly.Instance(wasmModule)
  // console.log(wasmInstance.exports.main())
  // const result = await axios.get('http://localhost:8084/assets/sample.wasm', {
  //   responseType: 'arraybuffer'
  // })
  // const mod = await WebAssembly.compile(result.data)
  // const instance = await  WebAssembly.instantiate(mod)
  const wasmUrl = new URL('http://localhost:8084/magick.wasm')
  console.log(wasmUrl)
  await initializeImageMagick(wasmUrl)
  console.log(Magick.imageMagickVersion);
  console.log('Delegates:', Magick.delegates);
  console.log('Features:', Magick.features);
  console.log('Quantum:', Quantum.depth);
})()

  // .then((wasmModule) => WebAssembly.instantiate(wasmModule))
  // .then((instance) => instance.exports.main())

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
