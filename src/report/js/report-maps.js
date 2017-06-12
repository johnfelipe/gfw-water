/**
 * printMap and getWatershed both call functions that in turn may call printMap and getWatershed,
 * getWatershed calls calculateOffset if it does not have one, after it calculates offset, it
 * redirects to getWatershed, printMap calls insertMap which then calls printMap until there are no
 * more to print, for these reasons, no-use-before-define is disabled
 */
/* eslint no-use-before-define:0 */
import {getUrlParams} from 'utils/params';
import esriConfig from 'esri/config';
import esriRequest from 'esri/request';
import Query from 'esri/tasks/query';
import QueryTask from 'esri/tasks/QueryTask';
import domConstruct from 'dojo/dom-construct';
import domQuery from 'dojo/query';
// import ioQuery from 'dojo/io-query';
import lang from 'dojo/_base/lang';
import queryUtils from './query-utils';
import populateReport from './populate-report';
import reportCharts from './report-charts';
import featureCollection from './feature-collection-shell';
import { performCustomAnalysis } from 'report/custom-analysis';
import {fieldConfig} from 'report/config';
import KEYS from 'report/constants';

let config;
let shedQueryTask;
let watershed;
let watershedGeometry;
let watersheds;
let fireQueryTask;
let printed = 0;
let firesOneDayAgo = queryUtils.oneDayAgo();
console.log('firesOneDayAgo', firesOneDayAgo);

esriConfig.defaults.io.corsEnabledServers.push('gfw.blueraster.io');

const insertMap = (response) => {
  const mapName = config.mapsToPrint[printed].name;
  const div = domQuery('.' + mapName + ' div.printed-map')[0];
  // div.innerHTML = '';
  // let oldLoading = domQuery('div.loading-container')[0];
  div.querySelector('.loading-container').remove();
  div.querySelector('.labelToRemove').remove();

  domConstruct.create('img', {
    src: response.results[0].value.url
  }, div);
  printed += 1;
  if ( printed < config.mapsToPrint.length ) {
    printMap();
  }
};

const errorHandler = (error) => {
  console.log('Error generating watershed report', error);
};

const getFireCount = () => {
  let fireQuery = new Query();
  fireQuery.geometry = watershedGeometry;
  fireQuery.where = firesOneDayAgo;

  fireQueryTask.executeForCount(fireQuery).then(
    (count) => {
      config.watershed.attributes._fireCount = count;
      printMap();
      populateReport.use({ config: config });
    },
    errorHandler
  );
};

const calculateOffset = (result) => {
  if ( result.features.length ) {
    const offset = result.features[0].geometry.getExtent().getWidth() / config.mapPrintWidthSmall;
    getWaterShed({ id: config.watershedId, offset: offset });
  } else {
    console.log('query for full geometry returned no features', result.features);
  }
};

const handleWatershed = (result) => {
  if ( result.features.length ) {
    // Keep a reference to the watershed graphic.
    config.watershed = result.features[0];
    config.watershed.attributes._canopy = config.canopyDensity;
    // Build a feature collection to send to the ArcGIS Server print service.
    const extent = result.features[0].geometry.getExtent().expand(config.mapExtentExpandFactor);
    config.webmap.Web_Map_as_JSON.mapOptions.extent = extent.toJson();
    watershedGeometry = result.features[0].geometry;
    watershed = result.features[0].toJson();
    watershed.attributes._canopy = config.canopyDensity;
    watershed.symbol = lang.clone(config.watershedSymbol);
    watersheds.featureCollection.layers[0].featureSet.features.push(watershed);
    getFireCount();
    reportCharts.use(watershed);
  } else {
    console.log('could not find watershed', result);
  }
};

const getWaterShed = (params) => {
  let queryCallback;
  let query = new Query();
  query.where = config.watershedIdField + ' = ' + params.id;
  query.geometryPrecision = 0;
  query.returnGeometry = true;
  if ( params.hasOwnProperty('offset') ) {
    query.maxAllowableOffset = params.offset;
    query.outFields = ['*'];
    queryCallback = handleWatershed;
  } else {
    query.maxAllowableOffset = config.simplifyGuess;
    queryCallback = calculateOffset;
  }
  shedQueryTask.execute(query).then(queryCallback, errorHandler);
};

const getCustomFeature = (params) => {
  let query = new Query();
  query.where = 'objectid = \'' + params.id + '\'';
  query.geometryPrecision = 0;
  query.returnGeometry = true;
  query.outFields = ['*'];
  shedQueryTask.execute(query).then(function (res) {
    if (res.features.length === 1) {
      let feature = res.features[0];
      let area = feature.attributes[fieldConfig.area];
      performCustomAnalysis(feature.geometry, area, config.canopyDensity).then(function (attrs) {
        lang.mixin(feature.attributes, attrs);
        handleWatershed(res);
      });
    }
  }, errorHandler);
};

const printMap = () => {
  // Create a webmap definition for the print service.
  const webmap = lang.clone(config.webmap);
  // Check if there's an overlay to put on the map.
  if (config.mapsToPrint[printed].layers) {
    const layers = config.mapsToPrint[printed].layers;
    //- Fires has one layer and needs a custom layer def, add it here
    console.log(config.mapsToPrint[printed].name);
    if (config.mapsToPrint[printed].name === 'fire') {
      const layer = layers[0];
      console.log('dfdssdf', layer);
      // Add layer definitions to only show fires within last 24 hours.
      layer.layers = layer.visibleLayers.map((id) => {
        return {
          'id': id,
          'layerDefinition': {
            'definitionExpression': firesOneDayAgo
          }
        };
      });
      webmap.Web_Map_as_JSON.operationalLayers.splice(1, 0, layer);
    } else {
      // For all the rest, add the layers
      layers.forEach((layer) => {

        if (layer.id === KEYS.TCD) {
          layer.renderingRule = config.exportImageRenderingRuleForTCD(config.canopyDensity);
        }

        webmap.Web_Map_as_JSON.operationalLayers.splice(1, 0, layer);
      });
    }
  }
  // Show the watershed on top.
  webmap.Web_Map_as_JSON.operationalLayers.push(watersheds);
  // Use full width for the overview map, small map for everything else
  let outputWidth = config.mapsToPrint[printed].name === 'overview' ? config.mapPrintWidthLarge : config.mapPrintSizeSquare;
  let outputHeight = config.mapsToPrint[printed].name === 'overview' ? config.mapPrintHeight : config.mapPrintSizeSquare;

  webmap.Web_Map_as_JSON.exportOptions = {
    outputSize: [ outputWidth, outputHeight ],
    dpi: config.mapPrintDPI
  };
  webmap.Web_Map_as_JSON = JSON.stringify(webmap.Web_Map_as_JSON);
  // Use the ArcGIS Server print service to generate a map image.
  esriRequest({
    url: config.printer,
    content: webmap
  }, { usePost: true }).then(insertMap, errorHandler);
};

const printAll = (options) => {
  // Show a loading icon while maps and charts are being generated.
  const loading = domQuery('div.loading-container')[0];
  domQuery('div.wrapper div.printed-map').forEach((n) => {
    domConstruct.place(lang.clone(loading), n, 'last');
  });
  domConstruct.place(lang.clone(loading), domQuery('#land-cover-chart')[0], 'last');
  domConstruct.place(lang.clone(loading), domQuery('#risk-chart')[0], 'last');
  config = options;
  const queryString = getUrlParams(window.location.search);
  config.watershedId = queryString[config.watershedQueryStringParam] || config.watershedId;
  config.canopyDensity = queryString.canopyDensity.split('#')[0] || config.canopyDensity;
  watersheds = lang.clone(featureCollection);
  fireQueryTask = new QueryTask(config.fireUrl);
  // Set up query task to either hit watershed layer or custom analysis area layer.
  if ( config.watershedId.indexOf('C_') > -1 ) {
    shedQueryTask = new QueryTask(config.customAnalysisAreasUrl);
    config.watershedId = +config.watershedId.replace(/W_|C_/i, '');
    getCustomFeature({ id: config.watershedId });
  } else {
    shedQueryTask = new QueryTask(config.watershedUrl);
    config.watershedId = +config.watershedId.replace(/W_|C_/i, '');
    getWaterShed({ id: config.watershedId });
  }
};

const currentWatershed = () => {
  return config.watershed;
};

export default {
  currentWatershed: currentWatershed,
  printAll: printAll
};
