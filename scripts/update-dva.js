const fs = require('fs');
const request = require('request');

const OWASP_VWAD_FILES = {
    offline: "https://raw.githubusercontent.com/OWASP/OWASP-VWAD/master/src/owasp-wiki/offline.json",
    vm: "https://raw.githubusercontent.com/OWASP/OWASP-VWAD/master/src/owasp-wiki/vm-iso.json"
};

const markdownFromJSON = function(objJSON) {
    let html = '';
    if (Array.isArray(objJSON)) {
        objJSON.forEach((entry) => {
            let technologies = '';
            if (Array.isArray(entry.technology)) {
                let len = entry.technology.length;
                if (len === 1) {
                    technologies = entry.technology[0];
                }
                else if (len === 2) {
                    technologies = entry.technology[0] + ' and ' + entry.technology[1];
                }
                else if (len > 2) {
                    let last = entry.technology.pop();
                    entry.technologies.forEach((technology) => {
                        technologies += technology + ',';
                    });
                    technologies += ' and ' + last;
                }
            }
            let name = entry.name.replace(/[\[\]]/gi, '');
            let templateStr = `* [${name}](${entry.url})`;
            if (technologies) {
                templateStr += ` &mdash; ${technologies}`;
            }
            if (entry.notes) {
                templateStr += ` &mdash; ${entry.notes}`;
            }
            html += templateStr + "\n";
        });
    }
    return html;
};

const downloadJson = async function(strURI) {
    return new Promise((resolve, reject) => {
        request(strURI, (err, resp, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(resp.body));
            }
        });
    });
};

const updateSection = function(strSection, strMarkdown, strTemplate) {
    let beginSection = '<!--$$' + strSection.toUpperCase() + '$$-->';
    let endSection   = '<!--$$END' + strSection.toUpperCase() + '$$-->';

    let beginIdx = strTemplate.indexOf(beginSection);
    let endIdx   = strTemplate.indexOf(endSection);
    if (beginIdx > 0 && endIdx > 0) {
        let begin = strTemplate.substr(0, beginIdx);
        let end   = strTemplate.substr(endIdx+endSection.length);
        return begin + strMarkdown + end;
    }
    return strTemplate;
};

const getAndUpdateSection = async function(strTarget, strFileURL, strMarkdownTemplate) {
    let json     = await downloadJson(strFileURL);
    let markdown = markdownFromJSON(json);
    return updateSection(strTarget, markdown, strMarkdownTemplate);
};


let fileString = fs.readFileSync('../README.md', 'utf-8');
getAndUpdateSection('OFFLINE', OWASP_VWAD_FILES['offline'], fileString).then((str) => {
    fileString = str;
    getAndUpdateSection('VM', OWASP_VWAD_FILES['vm'], fileString).then((str) => {
        fs.writeFileSync('../README.md', str, { encoding: 'utf-8' });
    })
});


