const jsonfile = require('jsonfile');
const { parse } = require('node-html-parser');
const http = require('http');
const list = require('./list1.json');

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

      if (hentry.childNodes[0].tagName === 'span' && hentry.childNodes[1].tagName === 'div') {
        const children = hentry.childNodes[1];
        children.childNodes.map(child => {
          const div = child.childNodes[0];
          if (div.tagName === 'font') {
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
      }
      makeFile({ item, result });
    });
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });
}

function makeFile({ item, result }) {
  jsonfile.writeFile(`./json1/${item.index}-${item.title}.json`, result, {spaces: 2}, function(err) {
    console.error(err);
    console.log('all done: ', item.index);
  });
}
