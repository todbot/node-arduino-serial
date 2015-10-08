/**
 * ArduinoSerial -- Node version of arduino-serial commandline tool
 *
 * @author Tod E. Kurt
 */

 "use strict";

//var _ = require("lodash");
//var fs = require("fs");
var deasync = require('deasync');
var optparse = require('optparse');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

var ArduinoSerial = {

    port: null,
    baud: 9600,
    harderror: false,

    /**
     * Run a single ArduinoSerial command, waiting for it to complete
     */
    runCommand: function(command) {
        var self = this;
        if( self.harderror ) { return; }
        var goodToGo = false;
        var cmd = command.command;
        if( cmd === 'delay' ) {
            setTimeout( function() {
                goodToGo = true;
            }.bind(this), command.millis);
            // deasync lets us wait until delay is done
            deasync.loopWhile(function(){ return !goodToGo; }.bind(this));
        }
        else if( cmd === 'setbaud' ) {
            self.baud = command.baud;
        }
        else if( cmd === 'open') {
            console.log("opening port",command.portname);
            var openOptions = {
              baudRate: self.baud,
              dataBits: 8,
              parity: 'none',
              stopBits: 1,
              parser: serialport.parsers.readline("\n")  // FIXME: support raw
            };
            self.port = new SerialPort(command.portname, openOptions);
            self.port.on('error', function (err) {
                console.log(err);
                self.harderror = true;
                goodToGo = true;
            });
            self.port.on("open", function() {
                self.savedDataCallback = self.port.options.dataCallback;
                self.port.options.dataCallback = function() {};
                self.port.flush( function() {
                    goodToGo = true;
                });
            });
            deasync.loopWhile(function(){ return !goodToGo; }.bind(this));
        }
        else if( cmd === 'close' ) {
            console.log('closing port...');
            if( self.port ) {
                self.port.close();
            }
        }
        else if( cmd === 'read' ) { // FIXME: support read number of bytes
            // note: this is bad form, poking inside another object's personal props
            // but we need to turn off the dataCallback and this is how to do it.
            self.port.options.dataCallback = self.savedDataCallback;
            console.log('reading from port...');
            if( !self.port ) {
                console.log("port must be opened first!");
                return("port must be opened first!");
            }
            self.port.on('data', function(data) {
                console.log("read data..");
                // FIXME: set amount of data to read?
                // process.stdout.write( data.toString() );
                console.log( "data:"+data.toString() );
                self.port.options.dataCallback = function() {};
                goodToGo = true;
            });
            deasync.loopWhile(function(){ return !goodToGo; }.bind(this));
        }
        else if( cmd === 'write' ) {
            console.log('writing to port...');
            if( !self.port ) {
                console.log("port must be opened first!");
                return("port must be opened first!");
            }
            self.port.write( command.string, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    },

    /**
     * Run a list of ArduinoSerial commands, in order,
     * waiting for each to complete.
     * @param commands array of commands to run
     */
    runCommands: function(commands) {
        commands.map( this.runCommand, this );
    },

    /**
     * Parse commandline options.
     * Main entry point when using library as a commandline tool
     */
     /**
      * Main entrance function. Parses arguments and calls 'run' when
      * its done. This function is called from bin/jshint file.
      *
      * @param {object} args, arguments in the process.argv format.
      */
    interpret: function(argv) {
        var switches = [
            ['-h', '--help', 'Show this help '],
            ['-d', '--delay MSEC', 'Delay some millisecs'],
            ['-l', '--list', 'List serial ports'],
            ['-b', '--baud BAUD', 'Set serial port baudrate (default 9600)'],
            ['-p', '--port NAME', 'Open serial port with name'],
            ['-r', '--read', 'read line from serial port'],
            ['-w', '--write', 'write string to serial port'],
            ['-h', '--help', 'print usage message']
        ];

        var usage = function() {
            var usagestr =
            "Usage: arduino-serial -b <bps> -p <serialport> [OPTIONS]\n\n" +
            "Options:\n" +
            "  -h, --help                 Print this help message \n" +
            "  -l, --list                 List avaiable serial ports \n" +
            "  -b, --baud=baudrate        Baudrate (bps) of Arduino (default 9600)  \n" +
            "  -p, --port=serialport      Serial port Arduino is connected to  \n" +
            "  -s, --send=string          Send string to Arduino  \n" +
            "# -S, --sendline=string      Send string with newline to Arduino  \n" +
            "# -i  --stdinput             Use standard input  \n" +
            "  -r, --receive              Receive string from Arduino & print it out \n" +
            "# -n  --num=num              Send a number as a single byte \n" +
            "# -F  --flush                Flush serial port buffers for fresh reading \n" +
            "  -d  --delay=millis         Delay for specified milliseconds \n" +
            "# -e  --eolchar=char         Specify EOL char for reads (default '\n') \n" +
            "# -t  --timeout=millis       Timeout for reads in millisecs (default 5000) \n" +
            "# -q  --quiet                Don't print out as much info  \n" +
            "('#' indicate options not yet implemented) \n" +
            "\n" +
            "Note: Order is important. Set '-b' baud before opening port '-p'. \n" +
            "Used to make series of actions: '-d 2000 -s hello -d 100 -r' \n" +
            "means 'wait 2secs, send 'hello', wait 100msec, get reply' \n";
            console.log(usagestr);
        };
        var commands = [];

        var parser = new optparse.OptionParser(switches);
        //, print_summary = true, first_arg;
        parser.on('help', function() {
            // do nothing, use no commands case below
        });
        parser.on('list', function() {
            console.log("listing ports");
            parser.banner = 'Usage: nodejs-test.js [options]';
            serialport.list(function (err, ports) {
                ports.forEach(function(port) {
                    console.log(port.comName +
                        (port.pnpId ? ' : ' + port.pnpId : '') +
                        (port.manufacturer ? ' : ' + port.manufacturer : ''));
              });
            });
        });
        parser.on('delay', function(name,value) {
            var millis = Number(value) || 0;
            commands.push( { command: 'delay', millis: millis} );
        });
        parser.on('baud', function(name,value) {
            var baud = Number(value) || 9600;
            commands.push( { command: 'setbaud', baud: baud } );
        });
        parser.on('port', function(name,value) {
            commands.push( { command: 'open', portname: value});
        });
        parser.on('read', function(name,value) {
            var numbytes = Number(value) || 0;
            commands.push( { command: 'read', numbytes: numbytes});
        });
        parser.on('write', function(name,value) {
            commands.push( { command: 'write', string: value});
        });
        parser.parse(argv);

        if( commands.length === 0 ) {
            usage();
            return;
        }
        // add explicit port close so script quits
        commands.push( {command: 'close' } );
        this.runCommands( commands );
        console.log("done");
    },
};

module.exports = ArduinoSerial;
