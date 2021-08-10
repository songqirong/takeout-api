const request = require('request');
const moment = require('moment');
const Base64 = require('js-base64').Base64;
const md5 = require('blueimp-md5');
const defaultConfig = {
  "Accept": 'application/json',
  "Content-Type": 'application/json;charset=utf-8',
}

const concat = (url, params) => {
  for(let key in params){
    url += `${key}=${params[key]}&`
  }
  url = url.substr(0, url.length - 1)
  return url;
}

const sendCode = (phone, code) => {
  const accountSid = '8aaf07087a331dc7017ad152c5b13242';
  const authToken = 'ad1996b816f3432b96e1f2df1bd1e8f5';
  const restUrl = 'https://app.cloopen.com:8883';
  const appId = '8aaf07087a331dc7017ad152c68a3248';
  const time = moment().format('YYYYMMDDHHmmss');
  const sig = md5(accountSid + authToken + time).toUpperCase();
  const body = {
    to: phone,
    appId,
    templateId: '1',
    datas: [code, '1']
  }
  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      timeout: 7000,
      url: `${restUrl}/2013-12-26/Accounts/${accountSid}/SMS/TemplateSMS?sig=${sig}`,
      body,
      json: true,
      headers: {
        "Authorization": Base64.encode(`${accountSid}:${time}`),
        ...defaultConfig,
        "Content-Length": JSON.stringify(body).length+'',
      }
    }, function(error, response, body){
      resolve(body);
    })
  })
}


const conversion = (params) => {
  return new Promise((resolve, reject) => {
    const url = concat('http://api.map.baidu.com/geoconv/v1/?', params)
    request({
      method: 'GET',
      timeout: 7000,
      url,
      json: true,
    }, function(error, response, body){
      resolve(body)
    })
  })
}

const parsing = (params) => {
  return new Promise((resolve, reject) => {
    const url = concat('http://api.map.baidu.com/reverse_geocoding/v3/?', params)
    request({
      method: 'GET',
      timeout: 7000,
      url,
      json: true,
    }, function(error, response, body){
      resolve(body)
    })
  })
}

const getSearchShops = (params) => {
  return new Promise((resolve, reject) => {
    const url = concat('http://cangdu.org:8001/v4/restaurants?', {...params, 'extras[]': 'restaurant_activity', type: 'search'})
    request({
      method: 'GET',
      timeout: 7000,
      url,
      json: true,
    }, function(error, response, body){
      if(error){
        resolve({ status: 0 })
      }
      resolve(body)
    })
  })
}


module.exports = {
  sendCode,
  conversion,
  parsing,
  getSearchShops
}