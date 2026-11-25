// Every ported Reanimate example by name. Later packs add their own example modules here.
import {CORE_EXAMPLES} from './core.mjs';
import {COLOR_EXAMPLES} from './color.mjs';
import {OBJECT_EXAMPLES} from './object.mjs';
import {GEO_EXAMPLES} from './geo.mjs';
import {MATH_EXAMPLES} from './math.mjs';
import {MORPH_EXAMPLES} from './morph.mjs';
import {MISC_EXAMPLES} from './misc.mjs';
import {FILM_EXAMPLES} from './films.mjs';
import {SHOWCASE_EXAMPLES} from './showcase.mjs';

export const EXAMPLES = Object.freeze({...CORE_EXAMPLES, ...COLOR_EXAMPLES, ...OBJECT_EXAMPLES, ...GEO_EXAMPLES, ...MATH_EXAMPLES, ...MORPH_EXAMPLES, ...MISC_EXAMPLES, ...FILM_EXAMPLES, ...SHOWCASE_EXAMPLES});
