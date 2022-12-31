import { Crossword } from './modules/crossword/crossword.js';

window.onload = function() {
  let crossword = new Crossword({line:15,col:10,size:50});      
      crossword.generate('./data/crossword-1647638052.json');
      //crossword.load('./data/testdata.json').then(data => {
      //  crossword.fill(data);
      //});
};