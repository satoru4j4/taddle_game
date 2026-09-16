import {WIDTH,HEIGHT} from './config.js';

// Bound the backing store to 2560×1440; combat always uses 1280×720 logical units.
export function renderResolution(cssWidth,deviceRatio=1){
  const width=Number.isFinite(cssWidth)&&cssWidth>0?cssWidth:WIDTH;
  const dpr=Number.isFinite(deviceRatio)&&deviceRatio>0?deviceRatio:1;
  const scale=Math.max(1,Math.min(2,width*dpr/WIDTH));
  return {width:Math.round(WIDTH*scale),height:Math.round(HEIGHT*scale)};
}
