var panel = d3.select('#panel')
var w = 300;
var h = 100;
var svg = panel.append('svg:svg').attr('width', w).attr('height', h)
var str1 = strParse('the neural bit');
var str2 = strParse('brian hulette');

function strParse(str) {
  var rtrn = []
  var char_count = {};
  for (var i = 0; i < str.length; i++) {
    if (typeof char_count[str[i]] !== 'undefined') {
      char_count[str[i]] += 1;
    } else {
      char_count[str[i]] = 0;
    }
    rtrn.push({
      c: str[i],
      count: char_count[str[i]]
    });
  }
  return rtrn;
}

function key(d) {
  return d.c + d.count;
}

svg.selectAll('text')
    .data(str1)
    .enter()
    .append('text')
    .attr('x', function (d, i) {
      return i * 10;
    })
    .attr('y', h/2)
    .attr('fill', 'black')
    .text(function (d) {
      return d.c;
    });


function toggle(str) {
  return svg.selectAll('text')
    .data(str, key)
    .transition()
    .duration(1000)
    .attr('x', function (d, i) {
      return i * 10;
    })
    .attrTween('y', function (d, i) {
      var peak = Math.random() * h - h/2;
      return function (t) {
        return h/2 - (-4 * peak * Math.pow(t, 2) + 4 * peak * t);
      }
    });
}

var active = false;

svg.on('mouseover', function() { 
  toggle(str2); 
  toggle(str1).delay(2000);
})
