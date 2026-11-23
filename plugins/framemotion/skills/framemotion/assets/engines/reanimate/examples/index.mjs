// Every ported Reanimate example by name. Later packs add their own example modules here.
import {CORE_EXAMPLES} from './core.mjs';
import {COLOR_EXAMPLES} from './color.mjs';
import {OBJECT_EXAMPLES} from './object.mjs';

export const EXAMPLES = Object.freeze({...CORE_EXAMPLES, ...COLOR_EXAMPLES, ...OBJECT_EXAMPLES});
