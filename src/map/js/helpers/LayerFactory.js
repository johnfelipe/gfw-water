import DynamicLayer from 'esri/layers/ArcGISDynamicMapServiceLayer';
import TiledLayer from 'esri/layers/ArcGISTiledMapServiceLayer';
import ImageLayer from 'esri/layers/ArcGISImageServiceLayer';
import ImageParameters from 'esri/layers/ImageParameters';
import WebTiledLayer from 'esri/layers/WebTiledLayer';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import FeatureLayer from 'esri/layers/FeatureLayer';
import SimpleRenderer from 'esri/renderers/SimpleRenderer';
import Symbols from 'helpers/Symbols';
import KEYS from 'js/constants';
import {errors} from 'js/config';

/**
* Map Function that gets called for each entry in the provided layers config and returns an array of ArcGIS Layers
* @param {object} layer - Layer Config object, see the layersConfig object in js/map/config.js for example
* @return {Layer} esriLayer - Some sort of esri layer, current types are:
*   - ArcGISDynamicMapServiceLayer
*   - ArcGISTiledMapServiceLayer
*   - ArcGISImageServiceLayer
*   - FeatureLayer
*/
export default (layer) => {
  if ((!layer.url && layer.type !== 'graphic') || !layer.type) { throw new Error(errors.missingLayerConfig); }

  let esriLayer, options = {}, imageParameters;

  switch (layer.type) {
    case 'tiled':
      options.id = layer.id;
      options.visible = layer.visible || false;
      esriLayer = new TiledLayer(layer.url, options);
    break;
    case 'webtiled':
      options.id = layer.id;
      options.visible = layer.visible || false;
      esriLayer = new WebTiledLayer(layer.url, options);
    break;
    case 'image':
      options.id = layer.id;
      options.visible = layer.visible || false;
      options.opacity = layer.opacity || 1;
      esriLayer = new ImageLayer(layer.url, options);
    break;
    case 'dynamic':
      // Create some image parameters
      imageParameters = new ImageParameters();
      imageParameters.layerOption = ImageParameters.LAYER_OPTION_SHOW;
      imageParameters.layerIds = layer.layerIds;
      imageParameters.format = 'png32';
      // Populate the options and then add the layer
      options.id = layer.id;
      options.visible = layer.visible || false;
      options.opacity = layer.opacity || 1.0;
      options.imageParameters = imageParameters;
      if (layer.defaultDefinitionExpression) {
        var layerDefs = [];
        layer.layerIds.forEach(val => {
          // ['ACQ_DATE', 1]
          // "ACQ_DATE > date'" + new window.Kalendae.moment().subtract(1, 'd').format('YYYY-MM-DD') + "'",
          const date = new Date();
          date.setDate(date.getDate() - layer.defaultDefinitionExpression[1]);
          const dateString = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
          layerDefs[val] = layer.defaultDefinitionExpression[0] + ' > date \'' + dateString + '\'';

          // layerDefs[val] = layer.defaultDefinitionExpression;
        });
        imageParameters.layerDefinitions = layerDefs;
      }
      esriLayer = new DynamicLayer(layer.url, options);
    break;
    case 'feature':
      options.id = layer.id;
      options.visible = layer.visible || false;
      options.outFields = layer.outFields || ['*'];
      esriLayer = new FeatureLayer(layer.url, options);
      if (layer.id === KEYS.smallGrants) {
        const pointSymbol = Symbols.getGrantsPointSymbol();
        const renderer = new SimpleRenderer(pointSymbol);
        esriLayer.renderer = renderer;
      }
    break;
    case 'graphic':
      options.id = layer.id;
      options.visible = layer.visible || false;
      esriLayer = new GraphicsLayer(options);
    break;
    default:
      throw new Error(errors.incorrectLayerConfig(layer.type));
  }

  return esriLayer;
};
