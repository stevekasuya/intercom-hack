// Intercom Hack with Mongoose OS

// Load APIs
load('api_gpio.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_timer.js');
load('api_uart.js');

// Declare variables
let ledPin = 12;
let talkBtn = 13;
let unlockBtn= 14;
let callState = false;
let uartNo =1;
let topic1 = 'intercom/detect';
let topic2 = 'intercom/unlock';
let qos = 1;

// UART Setup
UART.setConfig(uartNo, {
  baudRate: 9600,
  esp32: {
    gpio: {
      rx: 25,
      tx: 26,
    },
  },
});

// Set GPIO mode
GPIO.set_mode(ledPin, GPIO.MODE_INPUT);
GPIO.set_mode(startTalkingBtn, GPIO.MODE_OUTPUT);
GPIO.set_mode(openSecurityDoorBtn, GPIO.MODE_OUTPUT);

// Initialize GPIOs
GPIO.write(startTalkingBtn, 0);
GPIO.write(openSecurityDoorBtn, 0);

// Detect calls
GPIO.set_button_handler(ledPin, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 20, function(x) {
  
  if (!callState) {
    
    callState = true;
    let message = JSON.stringify({ });
    let ok = MQTT.pub(topic1, message, qos);
    print(ok);
    print("-----Call detected, hopefully published to AWS IoT-----");
    
    Timer.set(15000, false, function() {
      callState = false;
      print("-----Back to normal-----");
    }, null);
    
  }
  
}, true);

// Subscribe to topic and unlock door when message is received
MQTT.sub(topic2, function(conn, msg) {
  
  print('ok')
  talk();
  
  Timer.set(2000, false, function() {
    play();
  }, null);
  
  Timer.set(4500, false, function() {
    unlock();
  }, null);
  
  Timer.set(9500, false, function() {
    talk();
  }, null);
  
}, true);

// Play /01/001.mp3 with DFPlayerMini
function play(){
  UART.write(uartNo, '\x7E');
  UART.write(uartNo, '\xFF');
  UART.write(uartNo, '\x06');
  UART.write(uartNo, '\x0F');
  UART.write(uartNo, '\x00');
  UART.write(uartNo, '\x01');
  UART.write(uartNo, '\x01');
  UART.write(uartNo, '\xEF');
}

// Mimic talk button press
function talk(){
  GPIO.write(talkBtn, 1);
  Sys.usleep(300000);
  GPIO.write(talkBtn, 0);
}

// Mimic unlock button press
function unlock(){
  GPIO.write(unlockBtn, 1);
  Sys.usleep(300000);
  GPIO.write(unlockBtn, 0);
}
