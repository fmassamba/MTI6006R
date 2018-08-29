const stdout = console.log;
var stdin = null;

const READ_SIZE = 16000;
let Duplex = require('stream').Duplex;
var Buffer = require('buffer');
const writeBuffer = Buffer.Buffer.allocUnsafe(READ_SIZE + READ_SIZE / 61 | 0);
const smap = [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,84,86,71,72,,,67,68,,,77,,75,78,,,,89,83,65,65,66,87,,82,,,,,,,,84,86,71,72,,,67,68,,,77,,75,78,,,,89,83,65,65,66,87,,82];
let metaI;
let numLines;

function bufferToStream(buffer) {  
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function readTextFile()
{
    //revcomp-input100000000.txt
    var rawFile = new XMLHttpRequest();
    //rawFile.open("GET", "revcomp-input100000000.txt", true);
    rawFile.open("GET", "media/revcomp-input1000000.txt", true); 
    rawFile.responseType = "arraybuffer";
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                //var allText = rawFile.responseText;
                //alert(allText);
                //stdin = new Uint8Array(rawFile.response);
                var t0 = performance.now();
                stdin = bufferToStream(Buffer.Buffer.from(rawFile.response));
                read();
                var t1 = performance.now();
                var message = "<b>Durée d'exécution reverse-complement : " + ((t1 - t0)/1000).toFixed(1)  + " s.</b>"
                document.getElementById("outputrevcomplementJS").innerHTML =  "Durée d'exécution reverse-complement : " + ((t1 - t0)/1000).toFixed(3)  + " s.";
                //console.log(message);
            }
        }
    }
    rawFile.send(null);
}

function LinkedArray(prev) {
    this.prev = prev;
    this.next = undefined;
    this.pos = 0;
    this.data = [];
}

function reverseCompPrint(line) {
    let _metaI = metaI;
    let _numLines = numLines;
    let count = 0;
    const target = writeBuffer;
    const len = line.length;
    const right = line.length - 1;

    let ileft = 0;
    let iright = 0;

    let c;
    while (iright < len) {
        c = line[right - iright];
        iright++;
        if (c === 10 ) {
            // skip linebreaks
            if (iright === len) {
                break;
            }
            c = line[right - iright];
            iright++;
        }
        target[ileft] = smap[c];
        ileft++;
        count++;
        if ((count + _metaI - _numLines) % 60 === 0) {
            // need a linebreak
            target[ileft] = 10;//10;
            ileft++;
            count++;
            _numLines++;
        }
    }
    metaI = _metaI + count;
    numLines = _numLines;
    //stdout.write(target.slice(0, count).toString('ascii'));
   console.log(target.slice(0, count).toString('ascii'));
   //console.log(printLine(target));
}

function printLine(line){
  var str ='';
  for(var i = 0, len = line.byteLength; i < len; i++){
   str += line[i]; 
  }
  return str;
}

function reverse(la_) {
    // reset the metaI and numLines in this section
    metaI = 0;
    numLines = 0;

    var la = la_,
        lines = la.data,
        lnIdx = la.pos - 1,
        line = lines[lnIdx];

    while (true) {
        reverseCompPrint(line);
        lnIdx--;
        line = lines[lnIdx];
        if (line) {
            continue;
        }
        la = la.prev;
        if (la === undefined) {
            break;
        }
        lines = la.data;
        lnIdx = la.pos;
        lnIdx--;
        line = lines[lnIdx];
    }
    if ((metaI - numLines) % 60 !== 0) {
        console.log('\n');
    }
   // console.log(line);
}


const LA_LEN = 30;
const headLA = new LinkedArray();
let la = headLA;
let lnIdx = 0;
let lines = la.data;

let needHeader = true;
let headerPartial = '';
let isFirst = true;

function read() {
    let chunk = stdin.read(READ_SIZE);
    let isFinal = false;
    if (!chunk) {
        if (isFirst) {
            isFirst = false;
            return;
        }
        la.pos = lnIdx;
        reverse(la);
        return;
    } else if (chunk.length < READ_SIZE) {
        isFinal = true;
    }
    while (chunk) {
        while (true) {
            // if have read a partial header line, read the rest of it
            if (needHeader) {
                const headerEnds = chunk.indexOf('\n');
                console.log(headerPartial.toString('ascii') + chunk.slice(0, headerEnds).toString('ascii'));
                headerPartial = '';
                chunk = chunk.slice(headerEnds);
                needHeader = false;
            }
            const caretIdx = chunk.indexOf('>');
            if (caretIdx > -1) {
                // there is a caret in this chunk -- process the first part of
                // the chunk and then continue the `while (true)` loop to process
                // the next part of the chunk
                lines[lnIdx] = chunk.slice(0, caretIdx);
                // set chunk to the next section
                chunk = chunk.slice(caretIdx);
                la.pos = lnIdx + 1;
                reverse(la);
                // reset the data holders
                la = headLA;
                lines = la.data;
                la.pos = 0;
                lnIdx = 0;
                // check to see if the entire header line is here
                const headerEnds = chunk.indexOf('\n');
                if (headerEnds < 0) {
                    needHeader = true;
                    headerPartial = chunk;
                    break;
                } else {
                    // log the header
                    console.log(chunk.slice(0, headerEnds).toString('ascii'));
                    // continue processing the rest of the chunk
                    chunk = chunk.slice(headerEnds);
                }
            } else {
                if (lnIdx === LA_LEN) {
                    la.pos = LA_LEN;
                    la = la.next || (la.next = new LinkedArray(la));
                    lines = la.data;
                    lines[0] = chunk;
                    lnIdx = la.pos = 1;
                } else {
                    lines[lnIdx] = chunk;
                    lnIdx++;
                }
                break;
            }
        }
        chunk = stdin.read(READ_SIZE);
    }
    if (isFinal) {
        la.pos = lnIdx;
        reverse(la);
    }
}
        

function runreversecomplementJS(){
   //read();
   var t0 = performance.now();
   readTextFile();
   var t1 = performance.now();
   var message =  "<b>Durée d'exécution reverse-complement : " + ((t1 - t0)/1000).toFixed(1)  + " s.</b>";
   //console.log(message);
   // stdin.on('readable', read);
   //readTextFile("revcomp-input100000000.txt");
}

//stdin.on('readable', read);
