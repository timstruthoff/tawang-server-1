const convertSourceMap = require('convert-source-map');
const shortid = require('shortid');
const sourceMap = require('source-map');
const ApiError = require('./ApiError');

// TODO: Prevent dublicate stores
module.exports = class {
  constructor(sourceMapJSON) {
    this.status = 'storing';

    this.uid = shortid();
    this.timestamp = Date.now();

    // Converting source map into JSON and object format
    let convertObject;

    // Trying to parse the provided JSON
    try {
      convertObject = convertSourceMap.fromJSON(sourceMapJSON);
    } catch (parseError) {
      throw new ApiError({
        message: `Invalid source map: ${parseError.message}`,
        statusCode: 400,
        code: 'E9276',
      });
    }
    this.sourceMapObject = convertObject.toObject();
    this.sourceMapJSON = convertObject.toJSON();

    // Garbage collection
    convertObject = null;

    // Starting the parsing of the sourcemap.
    this.parsePromise = this.parse();

    // When parsing is complete the consumer is made available in the class.
    this.parsePromise
      .then(consumer => {
        this.status = 'ready';
        this.consumer = consumer;
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Parses the source map.
   */
  parse() {
    if (typeof this.sourceMapObject !== 'object') {
      throw new ApiError({
        message: 'No source map found in source map object!',
        developerMessage: "This could be because the supplied wasn't parsed correctly.",
        statusCode: 500,
        code: 'E7746',
      });
    } else {
      this.status = 'parsing';

      // Returning a promise which gets resolved when the parsing is complete

      // Asynchronously parsing the sourcemap and returnin a promise
      // of when the parsing is finished
      async function promise(sourceMapObject) {
        return await new sourceMap.SourceMapConsumer(sourceMapObject);
      }
      return promise(this.sourceMapObject);
    }
  }

  /**
   * Calculates the original position.
   * @param {number} line
   * @param {number} column
   * @returns {object}
   */
  originalPositionFor(line, column) {
    if (this.status !== 'ready') {
      throw new ApiError({
        message: 'Parser not ready yet!',
        developerMessage: 'Maybe try again in a few seconds.',
        statusCode: 500,
        code: 'E7746',
      });
    } else {
      // Getting the original position using the
      // source-map module.
      return this.consumer.originalPositionFor({ line: line, column: column });
    }
  }
};
