/* manipulate needs to be loaded for innerHTML to work on a NodeList, but is never called */
/* eslint no-unused-vars:0 */
import dom from 'dojo/dom';
import domQuery from 'dojo/query';
import domClass from 'dojo/dom-class';
import manipulate from 'dojo/NodeList-manipulate';
import number from 'dojo/number';
import {reportText} from 'report/config';

const noDecimal = { places: 0 };
const oneDecimal = { places: 1 };
const twoDecimals = { places: 2 };
const percent = { type: 'percent' };
const percentTwoDecimals = { type: 'percent', places: 2 };

const riskCategory = (risk) => {
  let description = 'low';
  if (risk === 2) {
    description = 'low to medium';
  }
  if (risk === 3) {
    description = 'medium';
  }
  if (risk === 4) {
    description = 'medium to high';
  }
  if (risk === 5) {
    description = 'high';
  }
  return description;
};

const hasHighRisk = (score) => {
  // Only show for scores of 4 and 5, less than 4 or 10 should not be shown
  return score > 3 && score < 6;
};

export default {
  use: (options) => {
    const {config} = options;
    const {watershed} = config;

    // TODO: put attribute field names in config file
    const {attributes} = watershed;
    const canopy = attributes._canopy;

    const wsArea = attributes.ws_ha;
    const wetArea = attributes.wet_ha;
    const wetPercent = wetArea / wsArea;

    const treeCover = attributes['tc_g' + canopy + '_ha'];
    const treePercent = treeCover / wsArea;
    const dams = attributes.dams_c;

    const pastCover = attributes.ptc_ha;
    const waterWithdrawl = attributes.wd_c;

    const treeLossRisk = attributes.rs_tl_c;
    const treeLossAmount = attributes['tl_g' + canopy + '_all_ha'];
    const treeLossPercent = attributes['tl_g' + canopy + '_all_ha'] / attributes['tc_g' + canopy + '_ha'];
    const treeLossRate = attributes['tlt_g' + canopy + '_ha'];
    const treeLossTrend = (treeLossRate > -1) ? 'positive' : 'negative';

    const pastLossRisk = attributes.rs_pf_c;
    const pastLossAmount = attributes.ptc_ha;
    const pastLossPercent = pastLossAmount / wsArea;
    const pastLossRate = attributes['tc_g' + canopy + '_ha'] / attributes.ptc_ha;

    const erosionRisk = attributes.rs_sed_c;
    const erosionRiskDescription = riskCategory(erosionRisk);

    const fireRisk = attributes.rs_fire_c;
    const fireCount = attributes._fireCount;
    const avgFireCount = attributes.fire_c;

    let watershedAreaValue = wsArea;
    if (watershedAreaValue > 1000000) {
      watershedAreaValue = Math.floor(watershedAreaValue / 1000000);
      dom.byId('watershed-area-unit').innerHTML = 'MHa';
    } else {
      watershedAreaValue = number.format(wsArea, noDecimal);
    }
    dom.byId('watershed-area').innerHTML = watershedAreaValue;

    let wetlandAreaValue = wetArea;
    if (wetlandAreaValue > 1000000) {
      wetlandAreaValue = Math.floor(wetlandAreaValue / 1000000);
      dom.byId('wetland-area-unit').innerHTML = 'MHa';
    } else {
      wetlandAreaValue = number.format(wetArea, noDecimal);
    }
    dom.byId('wetland-area').innerHTML = wetlandAreaValue;

    let treeCoverValue = treeCover;
    if (treeCoverValue > 1000000) {
      treeCoverValue = Math.floor(treeCoverValue / 1000000);
      dom.byId('tree-cover-unit').innerHTML = 'MHa';
    } else {
      treeCoverValue = number.format(treeCover, noDecimal);
    }
    dom.byId('tree-cover').innerHTML = treeCoverValue;

    // dom.byId('tree-cover').innerHTML = number.format(treeCover, noDecimal);
    dom.byId('dam-count').innerHTML = dams;

    let pastCoverValue = pastCover;
    if (pastCoverValue > 1000000) {
      pastCoverValue = Math.floor(pastCoverValue / 1000000);
      dom.byId('past-cover-unit').innerHTML = 'MHa';
    } else {
      pastCoverValue = number.format(pastCover, noDecimal);
    }
    dom.byId('past-cover').innerHTML = pastCoverValue;

    // dom.byId('past-cover').innerHTML = number.format(pastCover, noDecimal);
    dom.byId('water-withdrawl').innerHTML = waterWithdrawl;

    dom.byId('risk-tree-loss').innerHTML = (treeLossRisk !== 10 ? `${treeLossRisk}/5` : reportText.na);

    let treeLossValue = treeLossAmount;
    if (treeLossValue > 1000000) {
      treeLossValue = Math.floor(treeLossValue / 1000000);
      dom.byId('tree-loss-amount-unit').innerHTML = 'MHa';
    } else {
      treeLossValue = number.format(treeLossAmount, noDecimal);
    }
    dom.byId('tree-loss-amount').innerHTML = treeLossValue;
    // dom.byId('tree-loss-amount').innerHTML = number.format(treeLossAmount, noDecimal);
    dom.byId('tree-loss-percent').innerHTML = number.format(treeLossPercent, percentTwoDecimals);
    //- Removed at WRI's request
    // dom.byId('tree-loss-rate').innerHTML = treeLossRate;
    dom.byId('tree-loss-trend').innerHTML = treeLossTrend;

    dom.byId('risk-past-loss').innerHTML = (pastLossRisk !== 10 ? `${pastLossRisk}/5` : reportText.na);

    let pastLossValue = pastLossAmount;
    if (pastLossValue > 1000000) {
      pastLossValue = Math.floor(pastLossValue / 1000000);
      dom.byId('past-loss-amount-unit').innerHTML = 'MHa';
    } else {
      pastLossValue = number.format(pastLossAmount, noDecimal);
    }
    dom.byId('past-loss-amount').innerHTML = pastLossValue;
    // dom.byId('past-loss-amount').innerHTML = number.format(pastLossAmount, noDecimal);
    let correctedPastLossPercent = pastLossPercent > 1 ? 1 : pastLossPercent;
    dom.byId('past-loss-percent').innerHTML = number.format(correctedPastLossPercent, percentTwoDecimals);
    dom.byId('past-loss-rate').innerHTML = number.format(pastLossRate, percentTwoDecimals);

    dom.byId('risk-erosion').innerHTML = (erosionRisk !== 10 ? `${erosionRisk}/5` : reportText.na);
    dom.byId('risk-erosion-description').innerHTML = erosionRiskDescription;

    dom.byId('risk-fire').innerHTML = (fireRisk !== 10 ? `${fireRisk}/5` : reportText.na);
    dom.byId('recent-fire-count').innerHTML = fireCount;
    dom.byId('average-fire-count').innerHTML = number.format(avgFireCount, noDecimal);

    // .innerHTML available on node lists via NodeList-manipulate module.
    domQuery('span.canopy-density').innerHTML(attributes._canopy);

    // Use watershed name as report title.
    const watershedName = watershed.attributes[config.watershedName] + ' Watershed';
    domQuery('section.map.overview h1')[0].innerHTML = watershedName;

    // Figure out which risk rows to show in Plan for Action section.
    const visibleClassName = 'applicable';
    const noRisk = domQuery('tr.no-risk')[0];
    if (hasHighRisk(treeLossRisk)) {
      domClass.add(domQuery('tr.tree-loss-risk')[0], visibleClassName);
    }
    if (hasHighRisk(pastLossRisk)) {
      domClass.add(domQuery('tr.past-loss-risk')[0], visibleClassName);
    }
    if (hasHighRisk(erosionRisk)) {
      domClass.add(domQuery('tr.erosion-risk')[0], visibleClassName);
    }
    if (hasHighRisk(fireRisk)) {
      domClass.add(domQuery('tr.fire-risk')[0], visibleClassName);
    }
    if (hasHighRisk(treeLossRisk) || hasHighRisk(pastLossRisk) || hasHighRisk(erosionRisk) || hasHighRisk(fireRisk)) {
      domClass.add(noRisk, 'risk-info');
    }
  }
};
