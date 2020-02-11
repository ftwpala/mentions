const WebSocket = require('ws')
const ReconnectingWebSocket = require('reconnecting-websocket')
const fs = require('fs')
const path = require('path')

// check if logs folder exists.
// if not, create logs folder and optedin.json file
// if it does, create array of files inside logs folder

try {
  if (!(fs.existsSync('./logs/'))) {
    fs.mkdirSync('./logs/')
    fs.appendFileSync('./logs/optedin.json', '{"users":[]}')
  } else {
    usersDirectory = fs.readdirSync('./logs/')
  }
} catch (e) {
  console.error(e)
}

var logDirectory = {
  Array: [],
  eval: function () { try {
      var usersDirectory = fs.readdirSync('./logs/')
      for (i in usersDirectory) {
        // this skips an iteration of the loop if it is the optedin.json file
        if (usersDirectory[i] === 'optedin.json') { continue }
        // adds file to self's Array
        this.Array.push(usersDirectory[i].split('.')[0])
      }
    } catch (e) { console.error(e) }
  },
  createFile: function(name) {
    this.eval()
    try {
      (!this.Array.includes(`./logs/${name}.txt`))
      ? fs.writeFileSync(`./logs/${name}.txt`)
      : null
    } catch (e) { console.error(e) }
  }
}
logDirectory.eval()

//
//  WebSocket
//

const rws = new ReconnectingWebSocket('wss://chat.strims.gg/ws', [], {WebSocket: WebSocket, connectionTimeout: 20000});

rws.addEventListener('open', () => {
  let time = new Date().toLocaleString()
  console.log(`[${time}] CONNECTED`)
})


rws.addEventListener('message', (e) => {
  // Example of e.data
  // JOIN {"nick":"Fatal","features":[],"timestamp":1577117797198}
  const WebSocketMessagePrefix = e.data.split(' ', 1).toString()
  const WebSocketMessage = e.data
  
  
  // Creating JSON object with the websocket message minus the 'NAMES', 'JOIN', 'LEAVE', 'MSG', 'PRIVMSG' before the array
  const message = JSON.parse(WebSocketMessage.substr(WebSocketMessagePrefix.length + 1))
  
  // Adding new JSON key and value for type of message sent, example: 'NAMES', 'JOIN', 'LEAVE', 'MSG', 'PRIVMSG'
  message.type = WebSocketMessagePrefix
  
  const checkArray = (name) => {
    if (message.data.includes(name)) {
      logDirectory.createFile(name)
      formattedMessage = `${message.timestamp} ${message.nick}: ${message.data}`

      fs.readFile(`./logs/${name}.txt`, {encoding:'utf-8'}, (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        var lines = data.split('\r\n').filter(Boolean)
        var newFile;
        console.log(data)
        if (lines === 5) {
          lines.shift()
          lines.push(formattedMessage)
          newFile = lines.join(`\r\n`)
        } else {
          lines.push(formattedMessage)
          newFile = lines.join(`\r\n`)
        }
        console.log(data + '\nnew file')
        
        fs.writeFile(`./logs/${name}.txt`, newFile, (err) => {
          if (err) { console.error(err) }
        })

      })
    }
  }
  
  if (message.type === 'MSG') {
    try {
      var optedinJSON = JSON.parse(fs.readFileSync('./logs/optedin.json').toString())
      optedinJSON["users"].some(checkArray)
    } catch (e) { console.error(e) }
  }

})

rws.addEventListener('close', () => {
  rws.reconnect()
  let time = new Date().toLocaleString()
  console.log(`[${time}] DISCONNECTED`)
})