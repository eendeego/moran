var Population = function(populationSize, random) {
  if(random === undefined) {
    random = new Random();
  }

  var totalIterations = 0;

  var profileInfoMap = {};
  var totalProfileCount = 0;

  var GENE_SIZE = 7;
  var geneCounts = new Array(GENE_SIZE);
  for(var i=0; i<GENE_SIZE; i++) { geneCounts[i]=1; }

  var liveSet = [];
  var links = [];
  var linkMap = {};

  var sidHistory = [0];

  var linkId = function(source, target) {
    if(source < target) {
      return source + "-" + target;
    } else {
      return target + "-" + source;
    }
  }

  function notifyNewIndividual(individual) {
    var key = individual.key();
    var parent = individual.parent();
    var profileInfo = profileInfoMap[key];
    if(profileInfoMap[key] === undefined) {
      // New profile
      totalProfileCount++;
      profileInfo = profileInfoMap[key] = {
          key: key,
          gene: individual.gene(),
          count: 0,
          id: totalProfileCount,
          parent: parent,
          toString: function() { return this.id + " (#" + this.count + "): " + this.key; }
        };
      if(parent !== undefined) {
        parentNode = profileInfoMap[parent.dp];
        var newAngle = random.nextFloat() * Math.PI * 2;
        var newDist = 10 + random.nextFloat() * 30;
        profileInfo.x = (parentNode.x || 0) + newDist * Math.cos(newAngle);
        profileInfo.y = (parentNode.y || 0) + newDist * Math.sin(newAngle);
      }
    } else {
      // Already existing profile
      if(parent !== undefined) {
        delete parent.dp;
        if(profileInfo.parent === undefined) {
          profileInfo.parent = {};
        }
        for(var k in parent) {
          profileInfo.parent[k] = parent[k];
        }
      }
    }
    if(++profileInfo.count === 1) {
      liveSet.push(profileInfo);
      if(parent !== undefined) {
        delete parent.dp;
        for(var k in parent) {
          var id = linkId(profileInfo.key, k);
          var link = linkMap[id];

          if(link === undefined) {
            link = { source: profileInfoMap[k],
                     target: profileInfo,
                     mutation: parent[k],
                     id: id,
                     value: 1 };
            linkMap[id] = link;
            links.push(link);
          } else {
            console.log("Already known: " + link.id);
            link.value++;
            //alert("aaaaaaaaaaaaa")
          }
        }
      }
    }
  }

  var initialGeneProfile = new Array(7);
  for(var i=0; i<GENE_SIZE; i++) { initialGeneProfile[i]=1; }

  var population = new Array(populationSize);
  for(var i=0; i<populationSize; i++) {
    var newIndividual = new Individual(initialGeneProfile);
    population[i] = newIndividual;
    notifyNewIndividual(newIndividual);
  }

  var sid;

  function mutatingClone(individual, mutationProbability, recombinationProbability) {
    var key = individual.key();
    var profileInfo = profileInfoMap[key];
    // TODO: Optimization: Only clone if necessary
    var newGene = profileInfo.gene.slice(0); // Clone
    var parent = { dp: key };

    parent[key] = true;
    for(var i=0; i<GENE_SIZE; i++) {
      var god = random.nextFloat();
      if(god < mutationProbability) {
        newGene[i] = ++geneCounts[i];
      } else if(god < mutationProbability + recombinationProbability) {
        var sourceIndividual = population[random.nextIntCapped(populationSize)];
        newGene[i] = sourceIndividual.gene()[i];
        parent[sourceIndividual.key()] = false;
      } else {
        newGene[i] = newGene[i];
      }
    }
    return new Individual(newGene, parent);
  }

  function kill(individual) {
    var profileInfo = profileInfoMap[individual.key()];
    if(--profileInfo.count === 0) {
      // TODO Optimize this (if at all possible)
      for(var i=0; i<liveSet.length; i++) {
        if(liveSet[i].id === profileInfo.id) {
          liveSet.splice(i, 1);
          break;
        }
      }

      for(var i=links.length-1; i>=0; i--) {
        if(links[i].source === profileInfo || links[i].target === profileInfo) {
          delete linkMap[links[i].id];
          links.splice(i, 1);
        }
      }
    }
  }

  var generationStep = function(mutationProbability,
                                recombinationProbability,
                                sidHistoryCycle) {
    var killed  = random.nextIntCapped(populationSize);
    var doubled = random.nextIntCapped(populationSize - 1);
    if(doubled >= killed) { doubled++; }

    var newIndividual =
      mutatingClone(population[doubled],
                    mutationProbability,
                    recombinationProbability);
    notifyNewIndividual(newIndividual);
    population.push(newIndividual);
    kill(population.splice(killed, 1)[0]);

    totalIterations++;
    if(sidHistoryCycle !== undefined) {
      if(totalIterations % sidHistoryCycle == 0) {
        sidHistory.push(sid());
      }
    }
  };

  var graph = function() {
    return { nodes: liveSet, links: links };
  };

  sid = function() {
    var S = liveSet.length;
    var N = populationSize;
    var NN1 = N * (N-1);
    var SID, s = 0;
    for(var i=0; i<S; i++) {
      var ni = liveSet[i].count;
      s += ni * (ni - 1)
    }
    return 1.0 - s * 1.0 / NN1;
  }

  var stats = function() {
    // http://darwin.phyloviz.net/ComparingPartitions/index.php?link=Tut4

    var S = liveSet.length;
    var N = populationSize;
    var NN1 = N * (N-1);
    var SID = sid();

    var s1 = 0, s2 = 0;

    for(var i=0; i<S; i++) {
      var pi = liveSet[i].count * 1.0 / N;
      var pi2 = pi * pi;

      s1 += pi2;
      s2 += pi2 * pi;
    }

    var varSID = (4.0*N*(N-1)*(N-2)*s2 + 2.0*N*(N-1)*s1 + 2.0*N*(N-1)*(2*N-3)*s1*s1) / (NN1 * NN1);
    var doubleRootVarSID = 2*Math.sqrt(varSID);
    var CI95 = [SID - doubleRootVarSID, SID + doubleRootVarSID];

    return { SID: SID, varSID: varSID, CI95: CI95, totalIterations: totalIterations };
  };

  var toCountsString = function() {
    var counts = [];
    for (var seq in profileInfoMap) {
      var profileInfo = profileInfoMap[seq];
      counts.push(profileInfo);
    }

    var result = counts.sort(function(a, b) {
      return b.count - a.count;
    });

    result = counts.reduce(function(buffer, profile) {
      if(profile.count !== 0) {
        //return buffer + profile.id + " (#" + profile.count + "): " + profile.key + "\n";
        return buffer + profile + "\n";
      } else {
        return buffer;
      }
    }, "");

    return result;
  }

  var toString = function() {
    var result = "";
    for(var i=0; i<populationSize; i++) {
      result += population[i].toString() + "\n";
    }
    return result;
  }

  return {
    size: function() { return populationSize; },
    totalIterations: function() { return totalIterations; },
    sidHistory: function() { return sidHistory; },
    generationStep: generationStep,
    graph: graph,
    toString: toString,
    toCountsString: toCountsString,
    stats: stats
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
