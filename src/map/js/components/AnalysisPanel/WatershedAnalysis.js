import CustomAnalysisLink from 'components/AnalysisPanel/CustomAnalysisLink';
import WatershedSummary from 'components/AnalysisPanel/WatershedSummary';
import WatershedChart from 'components/AnalysisPanel/WatershedChart';
import {analysisActions} from 'actions/AnalysisActions';
import {analysisPanelText as text, analyticsLabels} from 'js/config';
import {analysisStore} from 'stores/AnalysisStore';
import analytics from 'utils/googleAnalytics';
import {mapStore} from 'stores/MapStore';
import KEYS from 'js/constants';
import React from 'react';

// Temporary for the Prototype
let runReport = () => {
  //- Get necessary data from store and open the report
  let {canopyDensity} = mapStore.getState();
  let {activeWatershed} = analysisStore.getState();
  let majorBasinNumber = activeWatershed.attributes.maj_bas;

  if (majorBasinNumber) {
    analysisActions.launchReport(`W_${majorBasinNumber}`, canopyDensity);
  }

  //- Send off analytics
  analytics(
    KEYS.analyticsCategory,
    KEYS.analyticsAnalysisAction,
    analyticsLabels.analyzeWatershed(majorBasinNumber)
  );
};

let WatershedAnalysis = props => {
  return (
    <div className={`watershed-analysis ${props.active ? '' : 'hidden'}`}>
      {!props.activeWatershed ? <p className='analysis-placeholder'>{text.watershedTabPlaceholder}</p> :
        <div>
          <div className='feature-title'>{text.getWatershedTitle(props.activeWatershed)}</div>
          <WatershedSummary />
          <WatershedChart id={KEYS.watershedChartId} feature={props.activeWatershed} />
          <CustomAnalysisLink />
          <div className='full-report-button gfw-btn blue pointer' onClick={runReport}>{text.fullReportButton}</div>
        </div>
      }
    </div>
  );
};

export { WatershedAnalysis as default };
