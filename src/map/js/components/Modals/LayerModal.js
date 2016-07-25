import ModalWrapper from 'components/Modals/ModalWrapper';
import {modalStore} from 'stores/ModalStore';
import {modalText} from 'js/config';
import React from 'react';

export default class Modal extends React.Component {

  constructor(props) {
    super(props);

    modalStore.listen(this.storeUpdated.bind(this));
    let defaultState = modalStore.getState();
    this.state = {
      layerInfo: defaultState.modalLayerInfo
    };
  }

  storeUpdated () {
    let currentState = modalStore.getState();
    this.setState({ layerInfo: currentState.modalLayerInfo });
  }

  render () {
    // let layerInfo = this.state.layerInfo;
    let layerInfo = [];
    for (let layer in this.state.layerInfo) {
      layerInfo.push(this.state.layerInfo[layer]);
    }

    return (
      <ModalWrapper downloadData={this.state.layerInfo.download_data}>
        {!this.state.layerInfo.title ? <div className='no-info-available'>{modalText.noInfo}</div> :
          <div className='modal-content-layer'>
              <div className='modal-source'>
                <h2 className='modal-title'>{this.state.layerInfo.title}</h2>
                <h3 className='modal-subtitle'>{this.state.layerInfo.subtitle}</h3>
                <div className='modal-table'>
                  {!this.state.layerInfo.function ? null :
                    this.tableMap(this.state.layerInfo.function, 'function')
                  }
                  {
                    !this.state.layerInfo.resolution ? null :
                    this.tableMap(this.state.layerInfo.resolution, 'RESOLUTION/SCALE')
                  }
                  {
                    !this.state.layerInfo.geographic_coverage ? null :
                    this.tableMap(this.state.layerInfo.geographic_coverage, 'GEOGRAPHIC COVERAGE')
                  }
                  {
                    !this.state.layerInfo.source ? null :
                    this.tableMap(this.state.layerInfo.source, 'source data')
                  }
                  {
                    !this.state.layerInfo.frequency_of_updates ? null :
                    this.tableMap(this.state.layerInfo.frequency_of_updates, 'FREQUENCY OF UPDATES')
                  }
                  {
                    !this.state.layerInfo.date_of_content ? null :
                    this.tableMap(this.state.layerInfo.date_of_content, 'DATE OF CONTENT')
                  }
                  {
                    !this.state.layerInfo.cautions ? null :
                    this.tableMap(this.state.layerInfo.cautions, 'cautions')
                  }
                  {
                    !this.state.layerInfo.other ? null :
                    this.tableMap(this.state.layerInfo.other, 'other')
                  }
                  {
                    !this.state.layerInfo.license ? null :
                    this.tableMap(this.state.layerInfo.license, 'license')
                  }
                </div>
                <div className='modal-overview'>
                  <h3>Overview</h3>
                  {
                    !this.state.layerInfo.overview ? null :
                    this.summaryMap(this.state.layerInfo.overview)
                  }
                </div>
                <div className='modal-credits'>
                  <h3>Citation</h3>
                  {
                    !this.state.layerInfo.citation ? null :
                    this.summaryMap(this.state.layerInfo.citation)
                  }
                </div>
              </div>
            </div>
          }
        </ModalWrapper>
     );
  }

  tableMap (item: string, label: string) {
    return (
      <dl className='source-row'>
        <dt>{label}</dt>
        <dd dangerouslySetInnerHTML={{ __html: item }}></dd>
      </dl>
    );
  }

  summaryMap (item: any) {
    if (typeof item === 'string') {
      return <p dangerouslySetInnerHTML={{ __html: item }} />;
    } else {
      return (
        <ul>
          {item.map(listItem => <li dangerouslySetInnerHTML={{ __html: listItem }} />)}
        </ul>
      );
    }
  }

  paragraphMap (item: string) {
    return <p dangerouslySetInnerHTML={{ __html: item }} />;
  }

  htmlContentMap (item: string) {
    return <div dangerouslySetInnerHTML={{ __html: item }} />;
  }

}
