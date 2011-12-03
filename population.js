var Population = function(populationSize, random) {
  var GENE_SIZE = 7;

  if(random === undefined) {
    random = new Random();
  }

  var geneCounts = new Array(GENE_SIZE);
  for(var i=0; i<GENE_SIZE; i++) { geneCounts[i]=1; }

  var population = new Array(populationSize);
  var totalIterations = 0;

  var listeners = { birth: [], death: [], generation: [] };

  function notifyBirth(individual) {
    listeners.birth.map(function(callback) {
      callback(individual);
    });
  }

  function notifyDeath(individual) {
    listeners.death.map(function(callback) {
      callback(individual);
    });
  }

  function notifyGeneration() {
    listeners.generation.map(function(callback) {
      callback(totalIterations);
    });
  }

  function initialize() {
    var initialAllelicProfile = new Array(7);
    for(var i=0; i<GENE_SIZE; i++) { initialAllelicProfile[i]=1; }

    for(var i=0; i<populationSize; i++) {
      var individual = new Individual(totalIterations, initialAllelicProfile);
      population[i] = individual;
      notifyBirth(individual);
    }
  }

  function mutatingClone(individual, mutationProbability, recombinationProbability) {
    var key = individual.key();
    var gene = individual.gene();
    var newGene = gene;
    var originIndividuals = {};
    var origin = {
      clonedIndividual: key,
      individuals: originIndividuals,
      hasRecombination: false,
    };

    function cloneGene() {
      if(newGene === gene) {
        newGene = gene.slice(0); // Clone
      }
    }

    originIndividuals[key] = true;
    for(var i=0; i<GENE_SIZE; i++) {
      var god = random.nextFloat();
      if(god < mutationProbability) {
        cloneGene();
        newGene[i] = ++geneCounts[i];
      } else if(god < mutationProbability + recombinationProbability) {
        cloneGene();
        var sourceIndividual = population[random.nextIntCapped(populationSize)];
        newGene[i] = sourceIndividual.gene()[i];
        originIndividuals[sourceIndividual.key()] = false;
        origin.hasRecombination = true;
      }
    }
    return new Individual(totalIterations, newGene, origin);
  }

  var generationStep = function(mutationProbability,
                                recombinationProbability) {
    var dead    = random.nextIntCapped(populationSize);
    var doubled = random.nextIntCapped(populationSize - 1);
    if(doubled >= dead) { doubled++; }

    var newIndividual =
      mutatingClone(population[doubled],
                    mutationProbability,
                    recombinationProbability);
    notifyBirth(newIndividual);
    population.push(newIndividual);
    notifyDeath(population.splice(dead, 1)[0]);

    totalIterations++;
    notifyGeneration();
  };

  var on = function(event, callback) {
    if(event !== 'birth' && event !== 'death' && event !== 'generation') {
      throw new Exception('Unknown event: "' + event + '"');
    }

    listeners[event].push(callback);
  };

  var toString = function() {
    var result = "";
    for(var i=0; i<populationSize; i++) {
      result += population[i].toString() + "\n";
    }
    return result;
  }

  return {
    initialize: initialize,
    size: function() { return populationSize; },
    totalIterations: function() { return totalIterations; },
    generationStep: generationStep,
    on: on,
    toString: toString
  };
};

// var population = new Population(1000);
// 
// console.log(population.toString());
// 
// for(var i=0; i<1000; i++) {
//   population.generationStep(0.2);
// //  console.log(population.toString());
// }
// 
// console.log(population.toString());
