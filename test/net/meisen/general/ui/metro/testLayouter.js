module('testLayouter');

test('testGeneral', function() {
  var Layouter = require('net/meisen/general/ui/metro/Layouter');
  notEqual(Layouter, undefined, 'Layouter prototype available');
  
  // instantiate an app
  notEqual(new Layouter(), undefined, 'could instantiate a Layouter');
});

test('testBindWithoutConfig', function() {
  var $ = require('jquery');
  var Layouter = require('net/meisen/general/ui/metro/Layouter');

  var layouter = new Layouter();
  layouter.bind("#qunit-fixture", false);
  
  equal($("#qunit-fixture").children().size(), 0, 'no elements');
});

test('testConfiguration', function() {
  var Layouter = require('net/meisen/general/ui/metro/Layouter');

  var layouter = new Layouter();
  throws(function() { 
    layouter.config(5);
  }, /configuration must be a plain JavaScript object/, 'invalid configuration type detected');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }]
    });
  }, /configuration needs at least one specified layout/, 'found configuration without layout');

  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: []
    });
  }, /configuration needs at least one specified layout/, 'found configuration with invalid layout');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { first: [], second: [] }
    });
  }, /Invalid type of layout's configuration/, 'found invalid layout types');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: {} }
    });
  }, /must be specified if the layout is a single tile layout/, 'found invalid layout definition');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false } }
    });
  }, /panelCss must be defined for any LayoutStyle/, 'found invalid panel-css definition (missing)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {} } }
    });
  }, /tileCss must be defined for any LayoutStyle/, 'found invalid tile-css definition (missing)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: [] } }
    });
  }, /defined panelCss is invalid/, 'found invalid panel-css definition (array)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: [] } }
    });
  }, /defined tileCss is invalid/, 'found invalid tile-css definition (array)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} } }
    });
  }, /configuration must specify at least two layouts/, 'found invalid amount of layouts');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layoutSingle1: { singleTile: true, panelCss: {}, tileCss: {} }, layoutSingle2: { singleTile: true, panelCss: {}, tileCss: {} } }
    });
  }, /configuration must specify at least one layout to be used for the panel/, 'found invalid layouts (no panel layout)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layoutSingle1: { singleTile: false, panelCss: {}, tileCss: {} }, layoutSingle2: { singleTile: false, panelCss: {}, tileCss: {} } }
    });
  }, /configuration must specify at least one layout to be used for a single tile/, 'found invalid layouts (no single-tile layout)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } }
    });
  }, /configuration must specify the rules for the different layouts/, 'found invalid rules definition (missing)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
      rules: []
    });
  }, /configuration must specify the rules for the different layouts/, 'found invalid rules definition (array)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
      rules: {}
    });
  }, /rule for the panelLayout must be specified/, 'found invalid rules definition (empty object)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
      rules: { panelLayout: 5 }
    });
  }, /rule for the panelLayout is invalid/, 'found invalid rules definition (invalid rule)');
  
  throws(function() { 
    layouter.config({
      tiles: [{ url: 'about:blank' }],
      layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
      rules: { panelLayout: function() {} }
    });
  }, /rule for the singleLayout must be specified/, 'found invalid rules definition (missing)');
  
  layouter.config({
    tiles: [{ url: 'about:blank' }],
    layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
    rules: { singleLayout: '', panelLayout: function() {} }
  });
  ok(true, 'loaded empty configuration');
});

test('testBinding', function() {
  var $ = require('jquery');
  var Layouter = require('net/meisen/general/ui/metro/Layouter');
  
  var layouter = new Layouter();
  layouter.config({
    tiles: [{ url: 'about:blank' }],
    layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
    rules: { singleLayout: 'tileLayout', panelLayout: 'tileLayout' }
  });
  throws(function() { 
    layouter.bind("#qunit-fixture");
  }, /specified layout for a panel cannot be a singleTile-layout/, 'detected invalid layout-binding (used singleTile)');
  
  var layouter = new Layouter();
  layouter.config({
    tiles: [{ url: 'about:blank' }],
    layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
    rules: { singleLayout: 'layout', panelLayout: 'unknown' }
  });
  throws(function() { 
    layouter.bind("#qunit-fixture");
  }, /layout 'unknown' cannot be found/, 'detected invalid layout-binding (not found)');
  
  var layouter = new Layouter();
  layouter.config({
    tiles: [{ url: 'about:blank' }],
    layouts: { layout: { singleTile: false, panelCss: {}, tileCss: {} }, tileLayout: { singleTile: true, panelCss: {}, tileCss: {} } },
    rules: { singleLayout: 'tileLayout', panelLayout: 'layout' }
  });
  layouter.bind("#qunit-fixture");
  
  equal($("#qunit-fixture > div.placeholder.layout").size(), 1, 'found iframe');
  equal($("#qunit-fixture > div > iframe.content").size(), 1, 'found iframe');
});