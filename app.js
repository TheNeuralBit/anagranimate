var panel = d3.select('#panel')
var w = 500;
var h = 200;
var padding = 5;
var kerning = 10;
var svg = panel.append('svg:svg')
            .attr('width', w)
            .attr('height', h)
            .style('font-size', '2.2em')
            .style('font-family', '"PT Serif"');
var str1 = strParse('the neural bit');
var str2 = strParse('brian hulette');


function strParse(str) {
  var x = d3.scale.ordinal()
        .domain(d3.range(str.length))
        .rangePoints([20, w-20], 1);
  var rtrn = []
  var char_count = {};
  var tester = svg.append('text')
  var curr_x = padding;
  for (var i = 0; i < str.length; i++) {
    if (typeof char_count[str[i]] !== 'undefined') {
      char_count[str[i]] += 1;
    } else {
      char_count[str[i]] = 0;
    }
    rtrn.push({
      c: str[i],
      count: char_count[str[i]],
      cx: curr_x,
      cy: h/2
    });
    tester.text(str[i] == " " ? "T" : str[i])
          .each(function(d) {
            curr_x += this.getBBox().width + kerning;
          });
  }
  tester.remove()
  return rtrn;
}

function key(d) {
  return d.c + d.count;
}

var curr_x = padding;
var text = svg.selectAll('text')
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

mouse_pos = {}

var force = d3.layout.force()
  .nodes([mouse_pos].concat(str1))
  .links([])
  .gravity(0)
  .size([w, h])
  .charge(0);

// Move nodes toward cluster focus.
function gravity(alpha) {
  return function(d) {
    d.y += (d.cy - d.y) * alpha;
    d.x += (d.cx - d.x) * alpha;
  };
}

force.on("tick", function(e) {
  svg.selectAll("text")
    .each(gravity(.1*e.alpha))
    .attr("x", function(d) { 
      return d.x;
    })
    .attr("y", function(d) { 
      return d.y;
    });
});

force.start();

function toggle(str) {
  force.nodes([mouse_pos].concat(str));

  text = svg.selectAll('text');
  old_str = text.data();
  old_str.forEach(function(item) {
    str.forEach(function(other) {
      if (key(item) == key(other)) {
        other.x = item.x;
        other.y = item.y
        other.px = item.px;
        other.py = item.py;
      }
    });
  });
  text.data(str, key);
  force.start();
}



var active = true;
svg.on('mouseenter', function() { 
  console.log(this)
  console.log('mouseenter');
  if (active) {
    console.log('brian hulette')
    toggle(str2); 
  } else {
    console.log('the neural bit')
    toggle(str1);
  }
  force.charge(function(d, i) { return i == 0 ? -1000 : 1; });
  active = !active;
  force.start();
});

svg.on('mouseleave', function() { 
  console.log('mouseleave');
  force.charge(0);
  force.start();
});

svg.on('mousemove', function() { 
  var p1 = d3.mouse(this);
  mouse_pos.x = p1[0];
  mouse_pos.y = p1[1];
  force.resume();
});
