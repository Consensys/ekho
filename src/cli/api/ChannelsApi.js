const Logger = require('../utils/Logger');
const axios = require('axios');

exports.create = async (url, name, userId, contactId) => {
  const log = Logger.getLogger('api-create-channel');
  const request = {
    method: 'post',
    url: `${url}/channels`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data: {
      name,
      userId,
      contactId,
    },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to create channel:', e.message);
  }
};

exports.sendMessage = async (url, userId, channelId, messageContents) => {
  const log = Logger.getLogger('api-send-message');
  const request = {
    method: 'post',
    url: `${url}/channels/message`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data: { userId, channelId, messageContents },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to send message:', e.message);
  }
};

exports.refresh = async url => {
  const log = Logger.getLogger('send-message');
  log.info(`refresh channels`);
  const request = {
    method: 'get',
    url: `${url}/channels/refresh`,
    headers: {
      accept: '*/*',
    },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    log.info(`Refreshed channels`);
  } catch (e) {
    log.error('Failed to refresh channels:', e.message);
  }
};

exports.receiveMessage = async (url, contactId) => {
  const log = Logger.getLogger('api-receive-message');
  const request = {
    method: 'get',
    url: `${url}/channels/message?contactId=${contactId}`,
    headers: {
      accept: '*/*',
    },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to send message:', e.message);
  }
};

exports.createBroadcastChannel = async (url, userId, name) => {
  const log = Logger.getLogger('api-create-bradcast-channel');
  const request = {
    method: 'post',
    url: `${url}/channels/broadcast`,
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    data: { name, userId },
  };
  log.debug('HTTP Request:', request);
  try {
    const response = await axios(request);
    log.debug('HTTP Response:', response.data);
    return response.data;
  } catch (e) {
    log.error('Failed to send message:', e.message);
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

exports.getChannelMembersByUser = async (url, userId) => {
  const log = Logger.getLogger('api-contacts-by-userId');
  const data = await this.query(log, url, `{userById(id:${userId}){id, channelmembers{id,channel{id, name}}}}`);
  return data.userById;
};
