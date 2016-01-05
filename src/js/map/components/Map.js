import AnalysisTools from 'components/AnalysisPanel/AnalysisTools';
import EsriSearch from 'components/AnalysisPanel/EsriSearch';
import ControlPanel from 'components/MapControls/ControlPanel';
import LayerPanel from 'components/LayerPanel/LayerPanel';
import {applyStateFromUrl} from 'helpers/ShareHelper';
import {mapActions} from 'actions/MapActions';
import {getUrlParams} from 'utils/params';
import {mapConfig, links} from 'js/config';
import React from 'react';

export default class Map extends React.Component {

  constructor (props) {
    super(props);
    this.state = { loaded: false };
  }

  componentDidMount() {
    let urlParams = getUrlParams(location.search);
    //- Mixin the map config with the url params, make sure to create a new object and not
    //- overwrite the mapConfig, again so reset sets the state back to default and not shared,
    //- TODO: this may not be necessary, remove this if I dont neet to override params, currently I am setting them after load
    let newMapConfig = Object.assign({}, mapConfig);
    mapActions.createMap(newMapConfig).then(() => {
      this.setState({ loaded: true });
      mapActions.createLayers();
      //- Use the helper to take the params and use actions to apply shared state, don't set these params
      //- as default state, otherwise the reset button will reset to shared state and not default state
      applyStateFromUrl(urlParams);
    });
  }

  render () {
    return (
      <div id={mapConfig.id} className={'map'}>
        <a href={links.home.url} title={links.home.title} alt={links.home.title} target='_blank'><div className='gfw-water-logo' /></a>
        <a href={links.aqueduct.url} title={links.aqueduct.title} alt={links.aqueduct.title} target='_blank'><div className='aqueduct-logo' /></a>
        <LayerPanel loaded={this.state.loaded} />
        <ControlPanel />
        <EsriSearch loaded={this.state.loaded} />
        <AnalysisTools />
      </div>
    );
  }

}
