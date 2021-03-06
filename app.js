var panel = d3.select('#panel')
var w = 500;
var h = 200;
var padding = 10;
var kerning = 0;
var trigger_buf = 50;
var svg = d3.select('#svg')
            .style('width', '100%')
            .attr('height', h)
            .style('font-size', '2.5em')
            .style('font-family', '"PT Serif"');
var str1 = strParse('the neural bit');
var str2 = strParse('brian hulette');
var mouse_node = {};

var curr_str = str1;


// Turn strings into lists of objects with some additional information
function strParse(str) {
  var x = d3.scale.ordinal()
        .domain(d3.range(str.length))
        .rangePoints([20, w-20], 1);
  var rtrn = []
  var char_count = {};
  var tester = svg.append('text')
  var curr_x = padding;
  var bbox, this_object, is_space;
  for (var i = 0; i < str.length; i++) {
    if (typeof char_count[str[i]] !== 'undefined') {
      char_count[str[i]] += 1;
    } else {
      char_count[str[i]] = 0;
    }
    is_space = str[i] == " "
    tester.text(is_space ? "T" : str[i])
          .each(function(d) {
            bbox = this.getBBox();
          });
 
    curr_x += bbox.width/2;

    // These are the objects were adding to the list
    // c:       the char
    // count:   # of previous occurrences of this letter (used for the d3 key)
    // x, y:    initial positions for force layour
    // cx, cy:  assigned positions for gravity force - letters will be attracted
    //          here
    // radius:  used for collision detection
    // w, h:    width and height of the letter
    this_object = {
      c: str[i],
      count: char_count[str[i]],
      x: curr_x,
      y: h/2,
      cx: curr_x,
      cy: h/2,
      radius: is_space ? 0 : bbox.width/2 - 2,
      w: bbox.width,
      h: bbox.height
    };
    rtrn.push(this_object);
    curr_x += bbox.width/2;
  }
  tester.remove()
  return rtrn;
}

// Use this key for d3 selections, so that when we change out strings we
// associate corresponding characters in the anagrams correctly
function key(d) {
  return d.c + d.count;
}

// Create the initial text objects
var text = svg.selectAll('text')
    .data(str1)
    .enter()
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('x', function (d, i) {
      return d.x - w/2
    })
    .attr('y', function(d, i) {
      return d.y + h/2;
    })
    .attr('fill', 'black')
    .text(function (d) {
      return d.c;
    });

var min_x = d3.min(text.data(), function(d) {return d.x - d.w/2;}) - trigger_buf;
var max_x = d3.max(text.data(), function(d) {return d.x + d.w/2;}) + trigger_buf;
var min_y = d3.max(text.data(), function(d) {return d.y - d.h/2;}) - trigger_buf;
var max_y = d3.max(text.data(), function(d) {return d.y + d.h/2;}) + trigger_buf;

var trigger_rect = svg.append('rect')
  .attr('x', Math.max(0, min_x))
  .attr('width', max_x - min_x)
  .attr('y', Math.max(0, min_y))
  .attr('height', max_y - min_y)
  .attr('fill-opacity', '0')

// Create force layout
var force = d3.layout.force()
  .nodes([mouse_node].concat(str1))
  .links([])
  .gravity(0)
  .size([w, h])
  .charge(0);

force.on("tick", function(e) {
  // Attract each node towards its assigned position
  text.each(gravity(.15*e.alpha));

  // Do collision detection between every node
  var q = d3.geom.quadtree(curr_str);
  var i = 0;
  while (++i < curr_str.length) q.visit(collide(curr_str[i]));

  // Move each character to its assigned position
  cw = svg.node().getBoundingClientRect().width;
  ch = svg.node().getBoundingClientRect().height;
  text
    .attr('x', function(d) { 
      var x = Math.max(d.w/2, Math.min(cw - d.w/2, d.x));
      return x;
    })
    .attr('y', function(d) { 
      var y = Math.max(d.h/2, Math.min(ch - d.h/2, d.y));
      return y;
    });
});

function gravity(alpha) {
  return function(d) {
    d.y += (d.cy - d.y) * alpha;
    d.x += (d.cx - d.x) * alpha;
  };
}

function collide(node) {
  var r = node.radius + 16,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = node.radius + quad.point.radius;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  };
}

// Handle mouse/touch events
// enter: switch between strings using toggle() and turn on charge for node that
//        follows mouse
// leave: turn off charge for mouse node
// move:  move mouse node to actual mouse position
var active = true;
function toggle(str) {
  force.nodes([mouse_node].concat(str));

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
  //circles.data(str, key);
  curr_str = str;
  force.start();
}

function do_toggle() {
  console.log('toggling!');
  if (active) {
    toggle(str2); 
  } else {
    toggle(str1);
  }
  active = !active;
}

function startmouse() { 
  console.log('activating charge!');
  force.charge(function(d, i) { return i == 0 ? -1000 : 1; });
  force.start();
}

function endmouse() { 
  console.log('mouseleave');
  force.charge(0);
  force.start();
}

function movemouse() { 
  var p1 = d3.mouse(this);
  mouse_node.x = p1[0];
  mouse_node.y = p1[1];
  force.resume();
}

trigger_rect.on('mouseenter', do_toggle);
svg.on('mouseenter', startmouse);
svg.on('touchstart',  startmouse);
svg.on('mouseleave',  endmouse);
svg.on('touchend',    endmouse);
svg.on('touchcancel', endmouse);
svg.on('mousemove',   movemouse);
svg.on('touchmove',   movemouse);

// Start up the force layout once everything is defined
force.start();
