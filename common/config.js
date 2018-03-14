var fs=require('fs')


var env = fs.readFileSync('/etc/xukaijie/env.json', 'utf8');

env = JSON.parse(env)

module.exports = env