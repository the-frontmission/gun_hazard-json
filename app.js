const jsonfile = require('jsonfile');
const { parse } = require('node-html-parser');
const http = require('http');
const list = require('./list.json');

const { interval } = require('rxjs');
const { map } = require('rxjs/operators');

const numbers$ = interval(3000);
const list$ = numbers$.pipe(
  map(number => ({ item: list[number]})),
);
list$.subscribe(item => {
  requestHttps(item);
});

function requestHttps({ item }) {
  http.get(`http://culpenetty.egloos.com/${item.id}`, (res) => {
    let body;
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const root = parse(body);
      let hentry = root.querySelector('.hentry');
      let lang = 'JP';
      const result = {
        title: item.title,
        id: item.id,
        script: [],
      };
      let line;

      if (hentry.childNodes.length === 5 && hentry.childNodes[1].tagName === 'span') {
        hentry = hentry.childNodes[1].childNodes[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
        console.log(hentry);

        hentry.childNodes.map(div => {
              if (div.tagName === 'div') {
                const textNodes = div.childNodes;
                const text = textNodes[0].rawText.replace(/&nbsp;/g, '').trim();
                if (text.length === 0) {
                  line = {
                    text: ''
                  };
                  result.script.push(line);
                } else if (lang === 'JP') {
                  line = {
                    textJP: text
                  };
                  lang = 'KO';
                } else if (lang === 'KO') {
                  if (!line) {
                    line = {};
                  }
                  line.textKO = text;
                  lang = 'JP';
                  result.script.push(line);
                } 
              }
        });

      } else {

        hentry.childNodes.map(child => {
          if (child.tagName === 'div') {
            const divs = child.childNodes;
            divs.map(font => {
              if (font.tagName === 'font' || font.tagName === 'span') {
                const textNodes = font.childNodes;
                const text = textNodes[0].rawText.replace(/&nbsp/g, '').trim();
                if (text.length === 0) {
                  line = {
                    text: ''
                  };
                  result.script.push(line);
                } else if (lang === 'JP') {
                  line = {
                    textJP: text
                  };
                  lang = 'KO';
                } else if (lang === 'KO') {
                  if (!line) {
                    line = {};
                  }
                  line.textKO = text;
                  lang = 'JP';
                  result.script.push(line);
                } 
              }
            });
          }
        });
      }
      makeFile({ item, result });
    });
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });
}

function makeFile({ item, result }) {
  jsonfile.writeFile(`./json1/${number.index}-${item.title}.json`, result, {spaces: 2}, function(err) {
    console.error(err)
    console.log('all done');
  });
}
