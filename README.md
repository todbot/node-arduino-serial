# node-arduino-serial
NodeJs version of `arduino-serial` commandline tool

This was mostly done as an experiment on my part.
I wanted to play around with [node-serialport](https://github.com/voodootikigod/node-serialport)
and figured recreating my [arduino-serial](https://github.com/todbot/arduino-serial/)
tool would be interesting.

One of the features of the original `arduino-serial` is the order of the
commandline arguments determine the order of the actions.  So if you do:
```
arduino-serial -p /dev/ttyS0 -d 100 -s 'hello there' -d 200 -r
```
you are saying: "open this serial port, wait 100 msecs, send out 'hello there',
wait 200 msecs, then read a line".

I wanted to recreate this feature in node-arduino-serial.  Turns out because
everything in Node is async with callbacks, this becomes a bit trickier than
expected.

### Requirements
`node-arduino-serial` is expected to work in Node v4.x.  

It explicitly uses the [ghostoy branch of `node-serialport`](https://github.com/ghostoy/node-serialport/tree/nan1to2)
that supports Node v4.x & NANv2.  
See the [node-serial port issue #578](https://github.com/voodootikigod/node-serialport/issues/578)
for more details.

See `package.json` for details if you want to do this yourself.

Currently only tested on Node v4.1.2 on Mac OS X 10.10.5.

### Installation
Install and run globally with:
```
$ npm install -g arduino-serial
$ arduino-serial -h
```
Or install and run locally:
```
$ git clone https://github.com/todbot/node-arduino-serial
$ npm install
$ ./bin/arduino-serial -h
```

### Usage
```
Usage: arduino-serial -b <bps> -p <serialport> [OPTIONS]

Options:
  -h, --help                 Print this help message
  -l, --list                 List avaiable serial ports
  -b, --baud=baudrate        Baudrate (bps) of Arduino (default 9600)
  -p, --port=serialport      Serial port Arduino is connected to
  -s, --send=string          Send string to Arduino
# -S, --sendline=string      Send string with newline to Arduino
# -i  --stdinput             Use standard input
  -r, --receive              Receive string from Arduino & print it out
# -n  --num=num              Send a number as a single byte
  -F  --flush                Flush serial port buffers for fresh reading
  -d  --delay=millis         Delay for specified milliseconds
# -e  --eolchar=char         Specify EOL char for reads (default '
')
# -t  --timeout=millis       Timeout for reads in millisecs (default 5000)
  -q  --quiet                Don't print out as much info
('#' indicate options not yet implemented)

Note: Order is important. Set '-b' baud before opening port '-p'.
Used to make series of actions: '-d 2000 -s hello -d 100 -r'
means 'wait 2secs, send 'hello', wait 100msec, get reply'

```

This is still very much a work in progress.
