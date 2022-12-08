/* ----------------------------------------------------------------------------------------------------
 * Crossword generator, 2021
 * Created: 08/20/21 by Gille de Bast
 * 
 * A class to generate a crossword with a json database.
 * The next improvement is an automatic crossword generator with a database of words and definitions.
 *
 * TODO
 * - Add visual separator for compound words
 * - Adjust canvas width with actual grid size
 * 
 * Update: 03/19/22 Current V.1.0
 * ----------------------------------------------------------------------------------------------------
 */

class Crossword{
  constructor({line,col,size}){

    //SETUP PAPER.JS
    this.canvas = document.getElementById('canvas');
    paper.setup(this.canvas);

    //CROSSSWORD STYLE
    this.style = {
      grid:{
        strokeColor: 'black',
        fillColor: 'white',
        strokeWidth: 1
      },
      definition:{
        fillColor: '#DDDDDD',
        strokeWidth: 2
      },
      label:{
        fontFamily: 'IBM Plex Sans',
        fontSize: 7,
        fontWeight: 'normal',
        fillColor: 'black',
        justification: 'center'
      },
      separator:{
        strokeColor: 'black',
        strokeWidth: 1
      },
      arrow:{
        strokeColor: "black"
      },
      solution:{
        fontSize: 36,
        fontFamily: 'IBM Plex Sans',
        fillColor: '#DDDDDD'
      }
    };
    
    this.showSolution = false;

    this.zoning = this.createZonning(line,col);

    this.crossword = new Group();
    this.crossword.addChild(this.createGrid(line, col, size));

    // draw zoning helper
    //this.drawZoning();

  }

  createZonning(line,col){
    return {
      safe:{x1:1,y1:1,x2:line-3,y2:col-3,color:"white"},
      origin:{x1:0,y1:0,x2:0,y2:0,color:"orange"},
      borderLeft:{x1:1,y1:0,x2:line-2,y2:0,color:"red"},
      borderTop:{x1:0,y1:1,x2:0,y2:col-2,color:"blue"},
      borderRight:{x1:0,y1:col-2,x2:line-3,y2:col-1,color:"green"},
      borderBottom:{x1:line-2,y1:0,x2:line-1,y2:col-3,color:"yellow"},
      noGo:{x1:line-2,y1:col-2,x2:line-1,y2:col-1,color:"black"}
    };
  }

  createGrid(line,col,size){
    let grid = new Group();
    for (let l = 0; l < line; l++) {
      for (let c = 0; c < col; c++) {
        const x = c*size;
        const y = l*size;
        let border = new Path.Rectangle(x,y, size, size);
            border.name = "border";
            border.strokeColor = this.style.grid.strokeColor;
            border.strokeWidth = this.style.grid.strokeWidth;
            border.fillColor = this.style.grid.fillColor;

        grid.addChild(new Group({children:[border],name:"box"+l+""+c}));
      }
    }
    grid.name = "grid";
    grid.position = new Point(view.center.x, view.center.y);
    return grid;
  }

  drawZoning(){
    for(const zone in this.zoning){
      const {x1,y1,x2,y2,color} = this.zoning[zone];
      this.createZone([x1,y1],[x2,y2],zone,color);
    }
  }

  createZone(from, to, label, color = "red"){

    const fromChildName = this.boxName(from);
    const toChildName = this.boxName(to);

    const caseFrom = this.crossword.children.grid.children[fromChildName];
    const caseTo = this.crossword.children.grid.children[toChildName];

    const x = caseFrom.bounds.x;
    const y = caseFrom.bounds.y;
    const w = caseTo.bounds.bottomRight.x - caseFrom.bounds.x;
    const h = caseTo.bounds.bottomRight.y - caseFrom.bounds.y;

    let zone = new Path.Rectangle(x,y, w, h);
        zone.fillColor = color;
        zone.opacity = 0.5;
        zone.name = label

    let name = new PointText({
      point:         [x+3,y+10],
      content:       label,
      fontSize:      this.style.label.fontSize-1,
      fontFamily:    this.style.label.fontFamily,
      fillColor:     this.style.label.fillColor
    });
  };

  whichZone(coordinate){
    let hits = new Array();
    for(const zone in this.zoning){
      if(this.isContain({x:coordinate[0],y:coordinate[1]}, this.zoning[zone])){
        hits.push(zone);
      }
    };
    return hits;
  };

  isContain(p, r){
    const h = r.y2 - r.y1;
    const w = r.x2 - r.x1;
    return r.x1 <= p.x && p.x <= r.x1 + w && r.y1 <= p.y && p.y <= r.y1 + h;
  }

  hitsToArrowing(hits, length){

    let arrows = new Array();

    if(hits.includes("origin") && length == 2){
    
      arrows = ["arrowRightToDown","arrowDownToRight"];
    
    } else if(hits.includes("borderTop") && length == 2){
    
      arrows = ["arrowRightToDown","arrowToDown"];
    
    } else if(hits.includes("borderTop") && length == 1){
    
      arrows = ["arrowRightToDown"];
    
    } else if(hits.includes("borderLeft") && length == 2){
    
      arrows = ["arrowToRight","arrowDownToRight"];
    
    } else if(hits.includes("borderLeft") && length == 1){
    
      arrows = ["arrowDownToRight"];
    
    } else if(hits.includes("safe") && length == 2){
    
      arrows = ["arrowToRight", "arrowToDown"];
    
    } else if(hits.includes("borderRight") && length == 1){

      arrows = ["arrowToDown"];
    
    } else if(hits.includes("borderBottom") && length == 1){

      arrows = ["arrowToRight"];
    
    } else if(hits.includes("noGo")){
      
      throw new Error("wrong zone");

    }

    return arrows;
  }

  boxName(coordinate){
    return "box"+coordinate[0]+""+coordinate[1];
  }

  getBoxData(box){
    return {
      x : box.children['border'].position.x,
      y : box.children['border'].position.y,
      w : box.children['border'].bounds.width,
      h : box.children['border'].bounds.height
    };
  }

  createDefinition({coordinate, definitions}){

    const gridChildName = this.boxName(coordinate);

    const box = this.crossword.children.grid.children[gridChildName];
          box.bringToFront();
          box.fillColor = this.style.definition.fillColor;
          box.children['border'].strokeWidth = this.style.definition.strokeWidth;

    const {x,y,w,h} = this.getBoxData(box);

    const hits = this.whichZone(coordinate);
    const arrowing = this.hitsToArrowing(hits, definitions.length);

    if(definitions.length == 1){

      const text = this.createText(x,y);
      text.wordwrap(definitions[0].label.toUpperCase(), 9);
      text.position.y -= h/2 - (h-text.bounds.height)/2;

      const arrow = this.createArrow(box, arrowing);

      //SOLUTION
      if(this.showSolution) this.addSolution(definitions[0].solution,arrowing[0],coordinate);

    } else if(definitions.length == 2){

      const text1 = this.createText(x,y);
      text1.wordwrap(definitions[0].label.toUpperCase(), 9);

      const text2 = this.createText(x,y);
      text2.wordwrap(definitions[1].label.toUpperCase(), 9);

      const margin = (h - (text1.bounds.height+text2.bounds.height))/4;

      text1.position.y -= text1.bounds.top - (y-h/2) - margin;

      const separator = this.createSeparator(box, margin*2+text1.bounds.height);

      text2.position.y -= (text2.bounds.top - (y-h/2)) - (margin*3+text1.bounds.height);

      const arrow = this.createArrow(box, arrowing);

      //SOLUTION
      if(this.showSolution){
        this.addSolution(definitions[0].solution,arrowing[0],coordinate);
        this.addSolution(definitions[1].solution,arrowing[1],coordinate);
      }
    } else {
      throw new Error("Wrong definition length");
    }

  }

  addSolution(label, arrow, coordinate){
    if(arrow == "arrowToDown"){
      this.addWord(label, {line:coordinate[0]+1,col:coordinate[1],dir:"down"});  
    } else if(arrow == "arrowToRight"){
      this.addWord(label, {line:coordinate[0],col:coordinate[1]+1,dir:"right"});
    } else if(arrow == "arrowDownToRight"){
      this.addWord(label, {line:coordinate[0]+1,col:coordinate[1],dir:"right"});  
    } else if(arrow == "arrowRightToDown"){
      this.addWord(label, {line:coordinate[0],col:coordinate[1]+1,dir:"down"});  
    }
  }

  createText(x,y){
    return new PointText({
      point:         [x,y+this.style.label.fontSize],
      fontSize:      this.style.label.fontSize,
      leading:       this.style.label.fontSize+2,
      fontFamily:    this.style.label.fontFamily,
      fontWeight:    this.style.label.fontWeight,
      fillColor:     this.style.label.fillColor,
      justification: this.style.label.justification
    });
  }

  createSeparator(box, height){

    const {x,y,w,h} = this.getBoxData(box);
  
    let separator = new Path({
        segments: [[x-w/2,(y-h/2)+height], [(x-w/2)+w, (y-h/2)+height]],
        strokeColor: this.style.separator.strokeColor,
        strokeWidth: this.style.separator.strokeWidth
    });
    return separator;
  }

  createArrowCap(p, length){
    return new Path({
      segments: [[p.x-length, p.y-length], [p.x, p.y], [p.x+length, p.y-length]],
      strokeColor: this.style.arrow.strokeColor,
      strokeWidth: this.style.definition.strokeWidth
    });
  }

  createArrow(box, arrows){

    const {x,y,w,h} = this.getBoxData(box);

    const margin = 10;
    const arrowLength = 9;
    const arrowCapLength = 4;

    let arrowGroup = new Group();

    if(arrows.includes("arrowToRight")){

      const arrowBody = new Path({
        segments: [[x+w/2,y-h/2+margin], [x+w/2+arrowLength, y-h/2+margin]],
        strokeColor: this.style.arrow.strokeColor,
        strokeWidth: this.style.definition.strokeWidth
      });

      const arrowCap = this.createArrowCap(arrowBody.segments[1].point, arrowCapLength);
      arrowCap.rotate(-90, arrowBody.segments[1].point);

      arrowGroup.addChild(new Group({children:[arrowBody,arrowCap],name:"arrowToRight"}));
    }

    if(arrows.includes("arrowToDown")){

      const arrowBody = new Path({
        segments: [[x,y+h/2], [x, y+h/2+arrowLength]],
        strokeColor: this.style.arrow.strokeColor,
        strokeWidth: this.style.definition.strokeWidth
      });

      const arrowCap = this.createArrowCap(arrowBody.segments[1].point, arrowCapLength);

      arrowGroup.addChild(new Group({children:[arrowBody,arrowCap],name:"arrowToDown"}));

    }

    if(arrows.includes("arrowRightToDown")){

      const arrowBody = new Path({
        segments: [[x+w/2,y-h/2+margin], [x+w/2+arrowLength, y-h/2+margin], [x+w/2+arrowLength, y-h/2+margin+arrowLength/1.3]],
        strokeColor: this.style.arrow.strokeColor,
        strokeWidth: this.style.definition.strokeWidth
      });

      const arrowCap = this.createArrowCap(arrowBody.segments[2].point, arrowCapLength);
      arrowCap.position.y = arrowBody.segments[2].point.y-1;
      
      arrowGroup.addChild(new Group({children:[arrowBody,arrowCap],name:"arrowRightToDown"}));

    }

    if(arrows.includes("arrowDownToRight")){

      const arrowBody = new Path({
        segments: [[(x-w/2)+margin,y+h/2], [(x-w/2)+margin, y+h/2+arrowLength], [(x-w/2)+margin+arrowLength/1.3, y+h/2+arrowLength]],
        strokeColor: this.style.arrow.strokeColor,
        strokeWidth: this.style.definition.strokeWidth
      });

      const arrowCap = this.createArrowCap(arrowBody.segments[2].point, arrowCapLength);

      arrowCap.position.x = arrowBody.segments[2].point.x;
      arrowCap.rotate(-90, arrowBody.segments[2].point);

      arrowGroup.addChild(new Group({children:[arrowBody,arrowCap],name:"arrowDownToRight"}));
    }

    return arrowGroup;
  }

  addWord(word, {line,col,dir}){

    let _line = line;
    let _col = col;

    for (let letter of word) {    
      if(dir == 'down'){
        this.createLetter(this.crossword.children.grid.children["box"+_line+''+_col],letter.toUpperCase());
        _line++;
      } else if(dir == 'right'){
        this.createLetter(this.crossword.children.grid.children["box"+_line+''+_col],letter.toUpperCase());
        _col++;
      }
    }
  }

  createLetter(box, letter){

    const {x,y,w,h} = this.getBoxData(box);

    let _letter = new PointText({
        point: [x,y],
        content: letter,
        fontSize:   this.style.solution.fontSize,
        leading:    this.style.solution.fontSize,
        fontFamily: this.style.solution.fontFamily,
        fillColor:  this.style.solution.fillColor,
        justification: "center",
        name: "letter"
    });

    _letter.point.y = y - (h/2-(h-(h-(_letter.bounds.height/3*2))/2));
    
    return _letter;
  }

  async load(url){
    const options = {method: 'GET',cache: 'no-cache'}; //cache ?
    let response = await fetch(new Request(url, options));
    let data = await response.json();
    return data;
  }

  generate(path){
    this.load(path).then(vocable => vocable.forEach(v => this.createDefinition(v)));
  }

  
  //FOR LATER...
  // The next improvement is an automatic crossword generator with a database of words and definitions

  //this.vocabularyPath = "./data/vocabulary.json";
  //this.vocabulary;
  //this.loadVocabulary().then(vocable => {
  //  this.vocabulary = vocable;
  //  this.wordFinding(
  //    "a-----",
  //    [
  //      "await",
  //      "asleep",
  //      "rabbit",
  //      "hiring",
  //      "attendes"
  //    ]
  //  );
  //});
  //
  //async loadVocabulary(){
  //  const options = {method: 'GET',cache: 'no-cache'}; //cache ?
  //  let response = await fetch(new Request(this.vocabularyPath));
  //  let data = await response.json();
  //  return data;
  //}
  //
  //    #|A|#|A|#|A|#|A
  //    B|A|S|T|#|A|A|A
  //    #|A|A|A|A|A|A|A
  //    A|A|#|A|A|A|A|#
  //    #|A|A|A|#|A|A|A
  //    A|A|A|A|A|#|A|A
  //
  //#1 select longest word
  //#2 select matching strings {save them for later}
  //When matche are found move to next "challenge"
  //If no matching string change candidate.
  //
  //if no more matching candidate brute reseat
  //
  //fill(){
  //
  //  this.load('./data/testdata.json').then(data => {
  //    //Générer une définition juste avec une coordonnée
  //    const index = this.randomInt(10).toString();
  //    let first = this.randomItemInArray(data[index]);
  //    
  //    //console.log(first);
  //    let matches = this.wordFinding("-"+first.charAt(1)+"---", data[this.randomInt(10).toString()]);
  //    //console.log(matches);
  //    let seconde = matches[0];
  //    this.createDefinition(
  //      {
  //        coordinate : [0,0],
  //        definitions : [
  //          {
  //            label: "to add",
  //            solution: first
  //          },{
  //            label: "to add",
  //            solution: seconde
  //          }
  //        ]
  //      }
  //    );
  //  });  
  //
  //}
  //
  ///*
  // * Wordfinding algorithm
  // * Use string schema to find matching word (ex : L-- or -ART---)
  // * return an array of strings
  // */
  //wordFinding(schema, wordArray){
  //
  //  const regexedSchema = new RegExp('^'+schema.replaceAll("-","[a-z]").toLowerCase()+'$');
  //
  //  let matches = new Array();
  //  wordArray.forEach(sample => {
  //    if(regexedSchema.test(sample)){
  //      matches.push(sample);
  //    }
  //  });
  //  return matches;
  //}
  //
  //randomItemInArray(array){
  //  return array[Math.floor(Math.random()*array.length)];
  //}
  //
  //randomInt(max){
  //  return Math.floor(Math.random() * max);
  //}
  //
  //randomIntMultiple(min, max, multiple){
  //  return Math.round((Math.random()*(max-min)+min)/multiple)*multiple;
  //}

}