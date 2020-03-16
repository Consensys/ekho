const Logger = require('../utils/Logger');
const axios = require('axios');

exports.generateInitHandshake = async (url, userId, contactName) => {
  const log = Logger.getLogger('api-generate-init-handshake');
  const request = {
    method: 'post',
    url: `${url}/contacts/generate-init-handshake/${userId}/${contactName}`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to create contact:', e.message);
  }
};

exports.acceptInitHandshake = async (url, userId, contactName, data) => {
  const log = Logger.getLogger('api-accept-init-handshake');
  const request = {
    method: 'post',
    url: `${url}/contacts/accept-init-handshake/${userId}/${contactName}`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data,
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
  } catch (e) {
    log.error('Failed to create contact:', e.message);
  }
};

exports.generateReplyHandshake = async (url, userId, contactName) => {
  const log = Logger.getLogger('api-generate-reply-handshake');
  const request = {
    method: 'post',
    url: `${url}/contacts/generate-reply-handshake/${userId}/${contactName}`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to create contact:', e.message);
  }
};

exports.acceptReplyHandshake = async (url, userId, contactName, data) => {
  const log = Logger.getLogger('api-accept-reply-handshake');
  const request = {
    method: 'post',
    url: `${url}/contacts/accept-reply-handshake/${userId}/${contactName}`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data,
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
  } catch (e) {
    log.error('Failed to create contact:', e.message);
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
    log.error('Failed to graphql contacts:', e.message);
  }
};

exports.list = async url => {
  const log = Logger.getLogger('api-list-contacts');
  const data = await this.query(log, url, '{ Users { id, name, contacts { id, name } } }');
  return data.Users;
};

exports.getContactsByUser = async (url, userId) => {
  const log = Logger.getLogger('api-contacts-by-userId');
  const data = await this.query(log, url, `{ contactsByUserId(userId: ${userId}) {id, name} }`);
  return data.contactsByUserId;
};
