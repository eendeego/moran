Random = (function() {
  return function(seed) {
    // http://en.wikipedia.org/wiki/Random_number_generation
    var w, z;

    if(seed === undefined) {
      w = Math.floor(Math.random() * 65536);
      z = Math.floor(Math.random() * 65536);
    } else {
      z = seed >> 16;
      w = seed & 0xffff;
    }

    var next = function() {
      z = 36969 * (z & 65535) + (z >> 16);
      w = 18000 * (w & 65535) + (w >> 16);
      return (z << 16) + w; // 32-bit result
    }

    var nextInt = function() {
      return next();
    }

    var nextIntCapped = function(max_plus_1) {
      return (next() & 0x7fffffff) % max_plus_1;
    }

    var nextFloat = function() {
      return (next() & 0x7fffffff) * 1.0 / 0x3fffffff;
    }

    return {
      nextInt: nextInt,
      nextIntCapped: nextIntCapped,
      nextFloat: nextFloat
    };
  };
})();

// var rr = new Random();
// for(var i=0; i<10; i++) {
//   console.log("i: " + i + " : " + rr.nextInt());
// }
// 
// for(var i=0; i<10; i++) {
//   console.log("i: " + i + " : " + rr.nextIntCapped(20));
// }
// 
// for(var i=0; i<10; i++) {
//   console.log("i: " + i + " : " + rr.nextFloat());
// }
