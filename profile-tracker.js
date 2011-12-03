var ProfileTracker = function(population,
                              sidHistoryCycle,
                              random) {
  if(random === undefined) {
    random = new Random();
  }

  var profileInfoMap = {};
  var totalProfileCount = 0;

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

  population.on('birth', function(individual) {
    var key = individual.key();
    var origin = individual.origin();
    var profileInfo = profileInfoMap[key];
    if(profileInfoMap[key] === undefined) {
      // New profile
      totalProfileCount++;
      profileInfo = profileInfoMap[key] = {
          key: key,
          gene: individual.gene(),
          count: 0,
          id: totalProfileCount,
          origin: origin,
          toString: function() { return this.id + " (#" + this.count + "): " + this.key; }
        };
      if(origin !== undefined) {
        parentNode = profileInfoMap[origin.clonedIndividual];
        var newAngle = random.nextFloat() * Math.PI * 2;
        var newDist = 10 + random.nextFloat() * 30;
        profileInfo.x = (parentNode.x || 0) + newDist * Math.cos(newAngle);
        profileInfo.y = (parentNode.y || 0) + newDist * Math.sin(newAngle);
      }
    } else {
      // Already existing profile
      if(origin !== undefined) {
        if(profileInfo.origin === undefined) {
          profileInfo.origin = { individuals: {} };
        }
        for(var k in origin.individuals) {
          profileInfo.origin.individuals[k] = origin.individuals[k];
        }
      }
    }
    if(++profileInfo.count === 1) {
      liveSet.push(profileInfo);
      if(origin !== undefined) {
        for(var k in origin.individuals) {
          var id = linkId(profileInfo.key, k);
          var link = linkMap[id];

          if(link === undefined) {
            link = { source: profileInfoMap[k],
                     target: profileInfo,
                     hasRecombination: origin.hasRecombination,
                     mutation: origin.individuals[k],
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
  });

  population.on('death', function(individual) {
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
  });

  if(sidHistoryCycle !== undefined) {
    population.on('generation', function(totalIterations) {
      if(totalIterations % sidHistoryCycle == 0) {
        sidHistory.push(sid());
      }
    });
  }

  var graph = function() {
    return { nodes: liveSet, links: links };
  };

  var sid = function() {
    var S = liveSet.length;
    var N = population.size();
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
    var N = population.size();
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

    return { SID: SID, varSID: varSID, CI95: CI95, totalIterations: population.totalIterations() };
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

  return {
    sidHistory: function() { return sidHistory; },
    graph: graph,
    toCountsString: toCountsString,
    stats: stats
  };
};
