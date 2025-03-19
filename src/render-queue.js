import ImageWorker from 'web-worker:./workers/process-image.worker'
/**
 * Queue responsible for handling image processing of all image types.
 * Leverages workers to offset workload from main thread.
 */
export default class RenderQueue {
  constructor (clientCallback) {
    this.clientCallback = clientCallback
    this.maxWorkers = navigator.hardwareConcurrency - 1
    this.availableWorkers = []
    this.queue = []

    for (let i = 0; i < this.maxWorkers; i++) {
      // initialize URL intance inside Worker constructor
      // review: https://webpack.js.org/guides/web-workers/
      // this.availableWorkers.push(
      //   new Worker(new URL('./workers/process-image.worker.js', import.meta.url), { type: 'module' })
      // )
      this.availableWorkers.push(new ImageWorker()  )
    }
  }

  /**
   * Add a pic object (job) to queue and start if possible.
   */
  add (job) {
    this.queue.push(job)
    this.dispatch()
  }

  /**
   * Dequeues a job and runs image processing inside a worker if one is available.
   */
  dispatch () {
    const worker = this.availableWorkers.shift()
    if (!worker) return

    const job = this.queue.shift()
    if (!job) {
      this.availableWorkers.push(worker)
      return
    }

    worker.onerror = this.onError(job)
    worker.onmessage = this.onMessage(job)
    worker.postMessage(job)
  }

  /**
   * Error handling for when a worker fails.
   * Adds worker back to list of available workers.
   */
  onError (job) {
    const queue = this
    const availableWorkers = this.availableWorkers

    return function (error) {
      console.error(`An error occurred in a Web Worker. error=${error} job=${job}`)
      availableWorkers.push(this)
      queue.dispatch()
    }
  }

  /**
   * Event handler triggered by worker.
   * Invoked callback to set pic object thumbnail.
   * Adds worker back to list of available workers.
   */
  onMessage (job) {
    const queue = this
    const availableWorkers = this.availableWorkers
    const clientCallback = this.clientCallback
    return function (event) {
      const { dataURL, fileName } = event.data
      clientCallback(dataURL, fileName)
      availableWorkers.push(this)
      queue.dispatch()
    }
  }
}
