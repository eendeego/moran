var Individual = (function() {
  var populationCount = 0;

  return function(generation, gene, origin) {
    var id = ++populationCount;
    var key = gene.toString();

    return {
      id: function() { return id; },
      key: function() { return key; },
      generation: function() { return generation; },
      gene: function() { return gene; },
      origin: function() { return origin; },
      toString: function() {
        return "{Individual: #" + id + ", gene=[" + key + "]}";
      }
    };
  };
})();
