console.log('testing...');
import {default as gsdl} from './index.js';
console.log(gsdl);

const exampleRowString1 = `{
  "_ignore": "",
  "_skip": "private information",
  "[list]": "a,b,c,d,e,f",
  "obj.part1" : "one",
  "obj.part2.a" : "two a",
  "obj.part2.b" : "two b",
  "normal":"yep",
  "normal number":2
}`;

const exampleRow1 = JSON.parse(exampleRowString1);
console.log( gsdl.structuredRow(exampleRow1) );
