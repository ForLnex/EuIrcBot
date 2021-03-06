const _ = require('underscore');

let bot;

let commandDict = null;
let allowCmds = false;

function writeCommands() {
  bot.writeDataFile('commands.json', JSON.stringify(commandDict), (err) => {
    if (err) console.log(`Error writing command file: ${err}`);
  });
}

module.exports.init = function (b) {
  bot = b;
  bot.readDataFile('commands.json', (err, data) => {
    if (err) {
      console.log('Initializing commandDict');
      commandDict = {};
    } else {
      try {
        commandDict = JSON.parse(data);
      } catch (ex) {
        console.log('Corrupted commands.json file! Resetting dict...');
        commandDict = {};
      }

      // Convert to new db format
      if (_.size(commandDict) > 0 && !_.values(commandDict)[0].hasOwnProperty('blame')) {
        commandDict = _.mapObject(commandDict, (val, key) => {
          const data = {};
          data.command = val;
          data.blame = 'jruby'; // blame merr
          return data;
        });
      }
    }
    writeCommands();
  });

  bot.getConfig('dumbcommand.json', (err, conf) => {
    if (!err) {
      allowCmds = conf.allow_commands;
    }
  });
};


module.exports.any_command = function (remainder, parts, reply, command) {
  if (commandDict[command]) reply(commandDict[command].command);
};

module.exports.commands = {
  dumbcommand: {
    _default(x, y, reply) {
      reply('Usage: dumbcommand [<add>|<remove>|<list>|<blame>] <command> [<text>]');
    },
    add(r, parts, reply, command, from) {
      if (parts.length !== 2) return reply('add must have *exactly* two arguments');
      if (!allowCmds && (/^!/m).test(parts[1])) return reply('None of that, now.');
      const exists = commandDict[parts[0]];
      commandDict[parts[0]] = {};
      commandDict[parts[0]].command = parts[1];
      commandDict[parts[0]].blame = from;

      if (exists) reply(`Overwrote command ${parts[0]}`);
      else reply(`Added command ${parts[0]}`);

      writeCommands();
    },
    blame(r, parts, reply) {
      if (parts.length === 0) return reply('please specify a command to blame');
      if (typeof commandDict[parts[0]] === 'undefined') return reply('No such command');
      reply(`Blame ${commandDict[parts[0]].blame} for this`);
    },
    remove(r, parts, reply) {
      if (parts.length !== 1) return reply('remove must have *exactly* one argument');

      if (typeof commandDict[parts[0]] === 'undefined') return reply('No such command');

      delete commandDict[parts[0]];
      reply(`Removed command ${parts[0]}`);

      writeCommands();
    },
    list(x, parts, reply) {
      if (parts.length === 0) {
        reply(`Commands: ${Object.keys(commandDict).join(',')}`);
      } else {
        reply(parts.map(key => (commandDict[key] ? `${key} -> ${commandDict[key]}` : ''))
          .filter(item => item.length > 0).join(' | '));
      }
    },
  },
};
