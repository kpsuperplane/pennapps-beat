class Lyric{
  constructor(rawData){
    let pieces = rawData.split(/\[(.*)\](.*)/); // assuming we always find a ']'
    // console.log('piece: '+pieces[1])
    this.timestamp = this.constructor.normalizeTime(pieces[1]);
    this.lyric = this.constructor.processLine(pieces[2]);
    this.originalTimestamp = pieces[1];
  }
  static processLine(line){
    return line.trim();
  }
  static normalizeTime(timeStr){
    // takes time in a MIN:SEC.MS format
    let times = timeStr.split(':');
    // console.log('time'+timeStr)
    let min = times[0];
    let smallTime = times[1].split('.');
    let sec = smallTime[0];
    let ms = smallTime[1];
    //please let js implicit intcast work (hint: no it didnt)
    return parseInt(ms)*10 + parseInt(sec)*1000 + parseInt(min)*60*1000;
  }
  // static processTimestamp(line){ (removed)
  //   //assuming line is of the format [min:sec.ms format (missing trailing ])
  //   // console.log('line'+line)
  //   return this.normalizeTime(line.slice(1, 0)); //trim the first and last char
  // }
}

module.exports =  Lyric;