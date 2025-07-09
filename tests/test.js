'use strict';
import test from 'ava';
import remark from 'remark';
import math from 'remark-math';
import sp from '../index.js';
import de from 'remark-details';
import preset from 'remark-preset-lint-markdown-style-guide';
import space from 'remark-copywriting-correct';

import fs from 'fs';

const in_1 = fs.readFileSync('tests/1.in.md');
const out_1 = fs.readFileSync('tests/1.out.md');

// const doc = "中文abc中文$a_i$中文";

test('main', (t) => {
  remark()
    .use(preset)
    .use(math)
    .use(space)
    //.use(de)
    .use(sp, { tags: ['kbd'], forceSpaceAround: ['+'] })
    .process(in_1, function (err, res) {
      console.log('finished');
      t.is(String(res), String(out_1));
    });
});
