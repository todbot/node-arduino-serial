# node-arduino-serial
NodeJs version of `arduino-serial`

This was mostly done as an experiment on my part.
I wanted to play around with `node-serialport` and
figured recreating my [arduino-serial](https://github.com/todbot/arduino-serial/)
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
`node-arduino-serial` is designed for Node v4.x.
It explicitly uses the branch of `node-serialport` that supports Node v4.x & NANv2.
See `package.json` for details if you want to do this yourself.


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
# -F  --flush                Flush serial port buffers for fresh reading
  -d  --delay=millis         Delay for specified milliseconds
# -e  --eolchar=char         Specify EOL char for reads (default '
')
# -t  --timeout=millis       Timeout for reads in millisecs (default 5000)
# -q  --quiet                Don't print out as much info
('#' indicate options not yet implemented)

Note: Order is important. Set '-b' baud before opening port '-p'.
Used to make series of actions: '-d 2000 -s hello -d 100 -r'
means 'wait 2secs, send 'hello', wait 100msec, get reply'

```

This is still very much a work in progress.
