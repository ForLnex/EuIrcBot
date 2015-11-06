var later = require('later');

var bot;

var schedules = [];

function writeSchedule(data) {
  // create serialized copy
  //data = schedules;

  //data.map(function(c,i,d) {
  //  c = JSON.stringify(c);
  //});
  
  bot.writeDataFile("later.json", JSON.stringify(data), function(err) {
    if(err) console.log("Error writing command file: " + err);
  });
}

function newSchedule(data) {
  //keys: 'schedule', 'created', 'from', 'command'
  
  // check that this is a valid schedule
  var s;

  try {
    s = later.parse.text(data['schedule']);
  } catch (ex) {
    return ex;
  }

  if( s == 0 )
    return "Provided schedule query doesn't parse.";
  
  // check frequency is below some minimum
  
  // check valid command
  
  data['schedule'] = s;
  schedules.push(data);
  writeSchedule(schedules);
}

module.exports.init = function(b) {
  bot = b;
  bot.readDataFile("later.json", function(err, data) {
    console.log("Read data file w/ error '" + err + "'");
    if(err) {
      console.log("Initializing later.json");
      schedules = [];
    } else {
      try {
        console.log("Parsing later.json...");
        console.log(data.toString());
        schedules = JSON.parse(data);
      } catch(ex) {
        console.log("Corrupted later.json for schedule! Resetting file...");
        schedules = [];
        writeSchedule(schedules);
      }
    }
  });
};

//  bot.getConfig("dumbcommand.json", function(err, conf) {
//    if(!err) {
//      allowCmds = conf['allow_commands'];
//    }
//  });


module.exports.commands = {
  schedule: {
    _default: function(x,y,reply) {
      reply("Usage: schedule [<add>|<remove>|<list>|<blame>] \"<schedule>\" \"<command>\"");
    },
    add: function(r, parts, reply, command, from) {
      if(parts.length !== 2) return reply("add must have *exactly* two arguments");

      // check and add schedule
      var err = newSchedule({
        'blame': from,
        'created': new Date(),
        'schedule': parts[0],
        'command': parts[1]
      });

      if( err )
        reply(err);
      else
        reply("Added");
    }

    /*
    blame: function(r, parts, reply) {
      if(parts.length === 0) return reply("please specify a command to blame");
      if(typeof commandDict[parts[0]] === 'undefined') return reply("No such command");
      reply("Blame " + commandDict[parts[0]].blame + " for this");
    },
    remove: function(r, parts, reply) {
      if(parts.length !== 1) return reply("remove must have *exactly* one argument");

      if(typeof commandDict[parts[0]] === 'undefined') return reply("No such command");

      delete commandDict[parts[0]];
      reply("Removed command " + parts[0]);

      writeSchedule();
    },
    list: function(x,parts,reply) {
      if(parts.length === 0) {
        reply("Commands: " + Object.keys(commandDict).join(","));
      } else {
        reply(parts.map(function(key) { return commandDict[key] ? key + " -> " + commandDict[key] : ''; })
            .filter(function(item) { return item.length > 0; }).join(" | "));
      }
    */
  }
};
