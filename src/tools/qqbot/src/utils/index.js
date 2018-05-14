'use strict';

const fs = require('fs');
const util = require('util');
const cp = require('child_process');

const shortenUrl = require('./shortenurl');
const existAsync = util.promisify(fs.exists);
const unlinkAsync = util.promisify(fs.unlink);
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

function openFile(filePath) {
    switch (process.platform) {
        case 'linux':
            cp.exec(`xdg-open ${filePath}`);
            break;
        case 'win32':
            cp.exec(`explorer.exe ${filePath}`);
            break;
        case 'darwin':
        default:
            cp.exec(`open ${filePath}`);
            break;
    }
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    });
}

const escapedStrMap = {
    'amp': '&',
    'apos': '\'',
    'lt': '<',
    'gt': '>',
    'quot': '"',
    'nbsp': '\xa0'
};

const regEscaped = /&([a-z]+);/ig;

function unEscapeHtml(html) {
    return html.replace(regEscaped, (match, escaped) => {
        return escapedStrMap[escaped.toLowerCase()] || escaped;
    });
}

export default {
    shortenUrl,
    existAsync,
    unlinkAsync,
    readFileAsync,
    writeFileAsync,
    openFile,
    sleep,
    unEscapeHtml
};
