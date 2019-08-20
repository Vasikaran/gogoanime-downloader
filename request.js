const https = require('https');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

let isObject = data =>
  data && data.toString && data.toString() === '[object Object]';

let isArray = data => data && Array.isArray(data);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let callback = resolve => res => {
  res.setEncoding('utf8');
  let str = '';

  res.on('data', chunk => {
    str += chunk;
  });

  res.on('end', () => {
    resolve({
      body: str,
      response: res
    });
  });

  res.on('error', err => {
    process.stdout.write(err);
  });
};

let request = options =>
  new Promise((resolve, reject) => {
    let { protocol, hostname, path, port } = url.parse(options.url);
    let {
      method = 'GET',
      headers = {},
      payload = null,
      formdata = null
    } = options;

    let newOptions = {
      host: hostname,
      port: port,
      path: path,
      method: method,
      headers: headers
    };
    let req;

    if (protocol === 'https:') {
      req = https.request(newOptions, callback(resolve));
    } else if (protocol === 'http:') {
      req = http.request(newOptions, callback(resolve));
    }

    if (method.toUpperCase() === 'POST') {
      if (isObject(payload) || isArray(payload)) {
        payload = JSON.stringify(payload);
        req.write(payload);
      } else if (isObject(formdata)) {
        formdata = querystring.stringify(formdata);
        req.write(formdata);
      }
    }

    req.on('error', err => {
      //eslint-disable-next-line
      console.log(err);
      // process.stdout.write(err);
      reject();
    });

    req.end();
  });

module.exports = request;
