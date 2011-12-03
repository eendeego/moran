var Individual = (function() {
  var populationCount = 0;

  return function(gene, origin) {
    var id = ++populationCount;
    var key = gene.toString();

    return {
      id: function() { return id; },
      key: function() { return key; },
      gene: function() { return gene; },
      origin: function() { return origin; },
      toString: function() {
        return "{Individual: #" + id + ", gene=[" + key + "]}";
      }
    };
  };
})();
