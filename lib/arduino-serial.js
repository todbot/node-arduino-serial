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
    quiet: false,

    msg: function(str) {
        if( !this.quiet ) {
            process.stdout.write("arduino-serial: " + str + "\n");
        }
    },
    msgerr: function(str) {
        process.stderr.write("arduino-serial: " + str + "\n");
    },
    /**
     * Run a single ArduinoSerial command, waiting for it to complete
     */
    runCommand: function(command) {
        var self = this;
        if( self.harderror ) { return; }
        var goodToGo = false;
        var cmd = command.command;
        if( cmd === 'listports' ) {
            self.msg("Available ports:");
            // parser.banner = 'Usage: nodejs-test.js [options]';
            serialport.list(function (err, ports) {
                ports.forEach(function(port) {
                    process.stdout.write(
                        port.comName +
                        (port.pnpId ? ' : ' + port.pnpId : '') +
                        (port.manufacturer ? ' : ' + port.manufacturer : '' + "\n"));
              });
            });
        }
        else if( cmd === 'delay' ) {
            self.msg("waiting " + command.millis + " msecs");
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
            self.msg("opening port " + command.portname + " at " + self.baud + "bps");
            var openOptions = {
              baudRate: self.baud,
              dataBits: 8,
              parity: 'none',
              stopBits: 1,
              parser: serialport.parsers.readline("\n")  // FIXME: support raw
            };
            self.port = new SerialPort(command.portname, openOptions);
            self.port.on('error', function (err) {
                self.msgerr(err);
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
            // self.msg("closing port");
            if( self.port ) {
                self.port.close();
            }
        }
        else if( cmd === 'flush' ) {
            self.msg("flushing read buffer");
            self.port.flush( function() {
                goodToGo = true;
            });
            deasync.loopWhile(function(){ return !goodToGo; }.bind(this));
        }
        else if( cmd === 'receive' ) { // FIXME: support read number of bytes
            self.msg("receiving from port...");
            if( !self.port ) {
                self.msgerr("port must be opened first!\n");
                return;
            }
            // note: poking inside another object's personal props is bad form
            // but we need to turn off the dataCallback and this is how to do it.
            self.port.options.dataCallback = self.savedDataCallback;
            self.port.on('data', function(data) {
                // self.msg("receive data...");
                // FIXME: set amount of data to read?
                // process.stdout.write( data.toString() );
                process.stdout.write("" + data.toString() + "\n");
                // zero-out callback so we don't get called again  FIXME: this loses bytes yes?
                self.port.options.dataCallback = function() {};
                goodToGo = true;
            });
            deasync.loopWhile(function(){ return !goodToGo; }.bind(this));
        }
        else if( cmd === 'send' ) {
            self.msg("sending '" + command.string + "' to port");
            if( !self.port ) {
                self.msgerr("port must be opened first!");
                return;
            }
            self.port.write( command.string, function (err) {
                if (err) { self.msgerr(err); }
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
        var self = this;
        var switches = [
            ['-h', '--help', 'Show this help '],
            ['-d', '--delay MSEC', 'Delay some millisecs'],
            ['-l', '--list', 'List serial ports'],
            ['-b', '--baud BAUD', 'Set serial port baudrate (default 9600)'],
            ['-p', '--port NAME', 'Open serial port with name'],
            ['-r', '--receive [NUM]', 'Receive string from serial port'],
            ['-s', '--send STR', 'Send string to serial port'],
            ['-F', '--flush', 'Flush serial port buffers for fresh reading'],
            ['-q', '--quiet', "Don't print out as much info "],
            ['-h', '--help', 'Print usage message']
        ];

        var usage = function() {
            // FIXME: use built-in usage printer in OptionParser
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
            "  -F  --flush                Flush serial port buffers for fresh reading \n" +
            "  -d  --delay=millis         Delay for specified milliseconds \n" +
            "# -e  --eolchar=char         Specify EOL char for reads (default '\\n') \n" +
            "# -t  --timeout=millis       Timeout for reads in millisecs (default 5000) \n" +
            "  -q  --quiet                Don't print out as much info  \n" +
            "('#' indicate options not yet implemented) \n" +
            "\n" +
            "Note: Order is important. Set '-b' baud before opening port '-p'. \n" +
            "Used to make series of actions: '-d 2000 -s hello -d 100 -r' \n" +
            "means 'wait 2secs, send 'hello', wait 100msec, get reply' \n";
            process.stdout.write(usagestr);
        };
        var commands = [];
        var help = false;

        var parser = new optparse.OptionParser(switches);
        //, print_summary = true, first_arg;
        parser.on('help', function() {
            help = true;
        });
        parser.on('quiet', function() {
            self.quiet = true;
        });
        parser.on('list', function() {
            commands.push({ command: 'listports'});
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
        parser.on('receive', function(name,value) {
            var numbytes = Number(value) || 0;
            commands.push( { command: 'receive', numbytes: numbytes});
        });
        parser.on('send', function(name,value) {
            commands.push( { command: 'send', string: value});
        });
        parser.on('flush', function(name,value) {
            commands.push( { command: 'flush' });
        });

        parser.parse(argv);

        if( help || commands.length === 0) {
            usage();
            return;
        }
        // add explicit port close so script quits
        commands.push( {command: 'close' } );
        this.runCommands( commands );
        this.msg("arduino-serial done");
    },
};

module.exports = ArduinoSerial;
