var Individual = (function() {
  var populationCount = 0;

  return function(gene, parent) {
    var id = ++populationCount;
    var key = gene.toString();

    return {
      id: function() { return id; },
      key: function() { return key; },
      gene: function() { return gene; },
      parent: function() { return parent; },
      toString: function() {
        return "{Individual: #" + id + ", gene=[" + key + "]}";
      }
    };
  };
})();
