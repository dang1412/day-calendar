'use strict'

/*
 * events: array [{startSlot: 1, endSlot: 3},...]
 * return: array [{startSlot: 1, endSlot: 3, s: , b: , l:},...]
 */

function calculateEventsPosition(events) {

  // assume that events already sorted in order of endSlot increase

  var g = [], s = [], b = [], l = [], n = events.length;

  for (var i = 0; i < n; i ++) {
    g[i] = [];
    b[i] = 0;
    for (var j = 0; j <= i; j ++) {
      if ( isOverlap( events[j], events[i] ) ) {
        //g[i][j] = 1;
        g[j][i] = 1;
        b[j] ++;
      }
    }
  }

  var v = []; // array to store vertices in BFS

  while ( v.length < n ) {
    // pick the first vertice that hasn't visited yet
    var i = 0, base = 1;
    while ( s[i] != null ) i ++;
    if ( i >= n ) break;

    v.push(i);
    //s[i] = 1  //  first vertice get slot 1
    var start = v.length -1, end = start + 1;
    i = start;
    while ( i < end ) {
      // pop a vertice
      var ver = v[i];
      i ++;

      // get the lowest available vertice connected to ver
      for (var j = 0; j < ver; j ++) if (g[j][ver] == 1 && !s[j]) {
        ver = j;
        v.splice(i - 1, 0, ver);  // insert this vertice before current
        end ++;
        break;
      }

      var as = getAvailableSlots(ver, g, s);
      for (var j = ver; j < n; j ++) {

        if ( g[ver][j] == 1 && !s[j] ) {  // has edge and not visited
          if (j > ver) {
            // push j in order
            var k = i;
            while ( v[k] < j && k < v.length ) k ++;
            v.splice(k, 0, j);  // insert j at position k
            end ++;
          }

          s[j] = as[0];     // assign and
          as.splice(0, 1);  // remove first available slot

          if (s[j] > base) base = s[j];
        }
      }
    }

    // update base
    for (i = start; i < end; i ++) {
      b[ v[i] ] = base;
    }
  }

  // all length set to 1
  for (var i = 0; i < n; i ++) {
    l[i] = 1;
  }

  var start = 0, i = 0;
  while (start < n) {
    if (i >= n) i = start;
    if ( !enhance(i) && i == start  ) start ++;
    i ++;
  }

  // result - update events with slot and base
  for (var i = 0; i < n; i ++) {
    events[i].s = s[i];
    events[i].b = b[i];
    events[i].l = l[i];
  }

  console.log('-------------- calculated: ', events);

  // get available slots when start BFS from vertice v
  function getAvailableSlots (v, g ,s) {
    var as = [], i;

    for ( i = 1; i <= b[v]; i ++ ) {
      as[i] = i;
    }

    for ( i = v; i < n; i ++) if ( g[v][i] == 1 && s[i] != null ) {
      as[ s[i] ] = null;
    }

    // remove null
    return as.filter(Number);
  }

  // attemp to make v larger
  function enhance (v) {
    var l1 = l.slice(0), s1 = s.slice(0);
    l1[v] += 1; // enhance v by 1
    for (var i = 0; i < n; i ++) {
      var g_v = [];
      for (var j = i; j < n; j ++) if (g[i][j] == 1) g_v.push(j);

      // sort g_v by slot increase
      g_v.sort(function (v1, v2) {
        return s1[v1] - s1[v2];
      });

      // check if an event pos conflict with previous, shift it to the right
      var j = 1;
      for ( ; j < g_v.length; j ++) {
        if ( s1[ g_v[j-1] ] + l1[ g_v[j-1] ] > s1[ g_v[j] ] ) {
          s1[ g_v[j] ] = s1[ g_v[j-1] ] + l1[ g_v[j-1] ];
          if ( s1[ g_v[j] ] > b[ g_v[j] ] ) return false;
        }
      }
      // check last v
      j = j - 1;
      if ( s1[ g_v[j] ] + l1[ g_v[j] ] - 1 > b[ g_v[j] ] ) return false;
    }

    if ( checkAllOverlap(s1, l1) ) return false;

    // able to enhance
    l = l1;
    s = s1;
    return true;
  }

  // return true if an overlap existing
  function checkAllOverlap (s1, l1) {
    for (var i = 0; i < n; i ++) {
      var g_v = [];
      for (var j = i; j < n; j ++) if (g[i][j] == 1) g_v.push(j);

      // sort g_v by slot increase
      g_v.sort(function (v1, v2) {
        return s1[v1] - s1[v2];
      });

      var j = 1;
      for ( ; j < g_v.length; j ++) {
        if ( s1[ g_v[j-1] ] + l1[ g_v[j-1] ] > s1[ g_v[j] ] ) {
          return true;
        }
      }
      // check last v
      j = j - 1;
      if ( s1[ g_v[j] ] + l1[ g_v[j] ] - 1 > b[ g_v[j] ] ) return true;
    }
  }

  return false;

}

function isOverlap (e1, e2) {
  return e1.endSlot >= e2.startSlot;
}
