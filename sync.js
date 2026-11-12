import {validateSave} from './engine.js?v=29';
export function chooseProgress(remote,revision,cached,meta){if(meta?.dirty&&cached){try{validateSave(cached);return{save:cached,revision,blocked:meta.revision!==revision,recovered:true};}catch{}}return{save:remote,revision,blocked:false,recovered:false};}
