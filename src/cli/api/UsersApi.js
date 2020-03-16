const Logger = require('../utils/Logger');
const axios = require('axios');

exports.create = async (url, name) => {
  const log = Logger.getLogger('api-create-user');
  const request = {
    method: 'post',
    url: `${url}/users`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data: {
      name,
    },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to create user:', e.message);
  }
};

exports.query = async (log, url, query) => {
  const request = {
    method: 'post',
    url: `${url}/graphql`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data: { query },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data.data;
  } catch (e) {
    log.error('Failed to graphql users:', e.message);
  }
};

exports.list = async url => {
  const log = Logger.getLogger('api-list-users');
  const data = await this.query(log, url, '{ Users { id, name } }');
  return data.Users;
};

exports.userIdByName = async (url, name) => {
  const log = Logger.getLogger('api-user-by-name');
  const data = await this.query(log, url, `{ userByName(name:"${name}") {id, name}}`);
  return data.userByName;
};
