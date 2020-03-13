#!/usr/bin/env node

/* tslint:disable:no-var-requires no-console */
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const rl = require('readline');
const _ = require('lodash');
const chalk = require('chalk');

const UsersApi = require('./api/UsersApi');
const ContactsApi = require('./api/ContactsApi');
const ChannelsApi = require('./api/ChannelsApi');
const Logger = require('./utils/Logger');

// helpers
const promptQuestion = async question => {
  const r = rl.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  return new Promise((resolve, error) => {
    r.question(question, answer => {
      r.close();
      resolve(answer);
    });
  });
};

const getOrSelectUser = async (log, user) => {
  if (!user) {
    const users = await UsersApi.list(url);
    users.sort((a, b) => a.id - b.id);
    log.info('Select a user:');
    users.forEach(user => log.info(`   [${user.id}] ${user.name}`));
    return await promptQuestion('Select ID: ');
  } else if (typeof user === 'string' && /[0-9]+/g.test(user) === false) {
    const userx = await UsersApi.userIdByName(url, user);
    return userx.id;
  } else if (typeof user === 'string' && /[0-9]+/g.test(user)) {
    return parseInt(user);
  } else {
    return user;
  }
};

const handleContactInput = async (log, contact, user) => {
  const userId = await getOrSelectUser(log, user);
  if (!contact) {
    contactName = await promptQuestion('Contact name: ');
  } else {
    contactName = contact;
  }
  return { contactName, userId };
};

const getOrSelectContact = async (log, userId, contact) => {
  if (!contact) {
    const contacts = await ContactsApi.getContactsByUser(url, userId);
    log.info(`Select a contact from user ${userId}`);
    contacts.forEach(contact => log.info(`   [${contact.id}] ${contact.name}`));
    const contactId = await promptQuestion('Select contact ID: ');
    return _.find(contacts, contact => contactId === contact.id);
  } else if (typeof contact === 'string' && /[0-9]+/g.test(contact)) {
    return {
      id: parseInt(contact),
    };
  }
};

const getOrSelectChannel = async (log, userId, channel) => {
  if (!channel) {
    const channelMembersByUser = await ChannelsApi.getChannelMembersByUser(url, userId);
    const channels = channelMembersByUser.channelmembers.map(channelMember => channelMember.channel);
    log.info(`Select a channel from user ${userId}`);
    channels.forEach(channel => log.info(`   [${channel.id}] ${channel.name}`));
    const channelId = await promptQuestion('Select channel ID: ');
    return _.find(channels, channel => channelId === channel.id);
  }
  if (typeof channel === 'string') {
    return { id: channel };
  }
  return channel;
};

const allArgs = process.argv;
const args = allArgs.slice(2);
const baserDir = path.resolve(path.dirname(allArgs[1]), '..', '..');
const tmpDir = path.resolve(baserDir, 'tmp', 'cli');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
const adapter = new FileSync(path.resolve(tmpDir, 'db.json'));
const db = low(adapter);
db.defaults({
  config: {
    url: 'http://localhost:3000',
    debug: false,
  },
}).write();

const url = db.get('config.url').value();
process.env.DEBUG = db.get('config.debug').value();
const commands = {
  config: {
    url: url => {
      db.set('config.url', url).write();
    },
    show: () => {
      Logger.getLogger('config').info(JSON.stringify(db, null, 2));
    },
    debug: debug => {
      db.set('config.debug', debug === 'true').write();
    },
  },
  users: {
    create: async name => {
      const log = Logger.getLogger('create-user');
      let username;
      if (!name) {
        username = await promptQuestion('Name: ');
      } else {
        username = name;
      }
      log.info(`creating new user with name: ${username}`);
      const user = await UsersApi.create(url, username);
      log.info(`New user created with id: ${user.id}`);
    },
    list: async () => {
      const log = Logger.getLogger('list-users');
      const users = await UsersApi.list(url);
      log.info('Users:');
      users.sort((a, b) => a.id - b.id);
      users.forEach(user => log.info(`   ${user.id} -> ${user.name}`));
      log.info(`Found ${users.length} users`);
    },
    use: async userId => {
      db.set('config.user', userId).write();
    },
  },
  contacts: {
    'generate-init-handshake': async (user, contact) => {
      const log = Logger.getLogger('generate-init-handshake');
      const { userId, contactName } = await handleContactInput(log, contact, user);
      log.info(`creating new contact : ${contactName}`);
      const handshakeData = await ContactsApi.generateInitHandshake(url, userId, contactName);
      log.info(
        `Handshake details ${chalk.bgRed.yellowBright.bold(`to share with '${contactName}'`)}: ${JSON.stringify(
          handshakeData,
        )}`,
      );
    },
    'accept-init-handshake': async (contact, user) => {
      const log = Logger.getLogger('accept-init-handshake');
      const { userId, contactName } = await handleContactInput(log, contact, user);
      const data = await promptQuestion('Handshake details: ');
      log.info(`creating new contact : ${contactName}`);
      await ContactsApi.acceptInitHandshake(url, userId, contactName, data);
      log.info(`Accepted handshake from ${contactName} successfully`);
    },
    'generate-reply-handshake': async (user, contact) => {
      const log = Logger.getLogger('generate-reply-handshake');
      const userId = await getOrSelectUser(log, user);
      const { name } = await getOrSelectContact(log, userId, contact);
      log.info(`creating new contact : ${name}`);
      const handshakeData = await ContactsApi.generateReplyHandshake(url, userId, name);

      log.info(
        `Handshake details ${chalk.bgRed.yellowBright.bold(`to share with '${name}'`)}: ${JSON.stringify(
          handshakeData,
        )}`,
      );
    },
    'accept-reply-handshake': async (user, contact) => {
      const log = Logger.getLogger('accept-reply-handshake');
      const userId = await getOrSelectUser(log, user);
      const { name } = await getOrSelectContact(log, userId, contact);
      const data = await promptQuestion('Handshake details: ');
      log.info(`creating new contact : ${name}`);
      await ContactsApi.acceptReplyHandshake(url, userId, name, data);
      log.info(`Accepted handshake from ${name} successfully`);
    },
    list: async () => {
      const log = Logger.getLogger('list-contacts');
      const usersWithContacts = await ContactsApi.list(url);
      usersWithContacts.sort((a, b) => a.id - b.id);
      usersWithContacts.forEach(user => {
        log.info(`User ${user.name} (id: ${user.id}) ${user.contacts.length === 0 ? '- no contacts' : ''}`);
        user.contacts.forEach(contact => {
          log.info(` - contact ${contact.name} (id: ${contact.id})`);
        });
      });
    },
  },
  channels: {
    create: async (user, contact, channelName) => {
      const log = Logger.getLogger('create-channel');
      const userId = await getOrSelectUser(log, user);
      const { id } = await getOrSelectContact(log, userId, contact);
      const name = channelName ? channelName : await promptQuestion('Channel name: ');
      log.info(`creating new channel between with name: ${name}`);
      const data = await ChannelsApi.create(url, name, userId, id);
      log.info(`New channel created with id: ${data.id}`);
    },
    'send-message': async (user, channel, message) => {
      const log = Logger.getLogger('send-message');
      const userId = await getOrSelectUser(log, user);
      const { id } = await getOrSelectChannel(log, userId, channel);
      const msg = message ? message : await promptQuestion('Message: ');
      log.info(`sending message from ${userId} via ${id}`);
      const data = await ChannelsApi.sendMessage(url, userId, id, msg);
      log.info(`Sent message to channel`);
    },
    'receive-message': async (user, contact) => {
      const log = Logger.getLogger('receive-message');
      const userId = await getOrSelectUser(log, user);
      const { id, name } = await getOrSelectContact(log, userId, contact);
      await ChannelsApi.refresh(url);
      const messages = await ChannelsApi.receiveMessage(url, id);
      log.info(`Received messages from ${name}`);
      messages.sort((a, b) => a.nonce - b.nonce);
      messages.forEach(m => log.info(`${name}[${m.nonce}]: ${m.messageContents}`));
    },
  },
};

const runner = async (cmd = commands, pos = 0) => {
  const key = args[pos];
  if (cmd[key] && typeof cmd[key] === 'function') {
    const arguments = args.slice(pos + 1);
    cmd[key](...arguments);
  } else if (cmd[key] && typeof cmd[key] === 'object') {
    await runner(cmd[key], pos + 1);
  } else {
    throw Error('nopnop');
  }
};

new Promise(() => runner()).then().catch(e => getLogger('main').error(e));
