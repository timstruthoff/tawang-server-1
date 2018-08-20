const express = require('express');
const sourceMapRouter = express.Router();

const SourceMapStore = require('./../../components/sourcemap-store');

const store = new SourceMapStore();

// Middleware for parsing the POST body into an object
sourceMapRouter.use(express.json({ limit: '100mb' }));

sourceMapRouter.post('/', (req, res) => {
  // TODO: validate that map is valid JSON
  let sourceMapJSON = req.body.map;

  let id = store.add(sourceMapJSON);

  res.status(201).json({
    status: 201,
    id,
  });
});

/**
 * Endpoint for parsing an array of location.
 */
sourceMapRouter.post('/:id', (req, res, next) => {
  // TODO: Validate and sanitize input
  let id = req.params.id;
  let locationsArray = req.body.errors;

  if (Array.isArray(locationsArray)) {
    let returnArray = [];

    // Looping over locations in request and getting original
    // location for each.
    locationsArray.forEach(locationElement => {
      // Parsing the parameters
      let line = parseInt(locationElement.line);
      let column = parseInt(locationElement.column);

      // Checking if both line and column number are provided in the current error.
      let parametersPresent = line !== undefined && column !== undefined;

      if (parametersPresent) {
        returnArray.push(store.originalPositionFor(id, line, column));
      } else {
        returnArray.push({ error: 'No line and column provided!' });
      }
    });

    // Returning all parsed locations
    res.status(200).json(returnArray);
  } else {
    let error = new Error('There is no errors array!');
    error.statusCode = 400;
    error.public = true;
    next(error);
  }
});

module.exports = sourceMapRouter;
