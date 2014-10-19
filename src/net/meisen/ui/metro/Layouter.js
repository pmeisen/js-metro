define(['jquery'], function($) {
  
  /**
   * The LayoutStyle is created for each layout used by a Layouter.
   * The Layouter creates the needed instances based on the configuration.
   */
  var LayoutStyle = function(layouter, layoutName, layoutConfig) {
    this.closeButtonSize = 50;
    
    // set the name of the layout
    if (typeof layoutName !== "string") {
      throw new Error("The layoutName must be specified as string.");
    }
    this.name = layoutName;
    
    // check the specified configuration
    if (!$.isPlainObject(layoutConfig)) {
      throw new Error("Invalid type of layout's configuration: " + (typeof layoutConfig));
    }
    
    // check the defined type
    if (typeof layoutConfig.singleTile !== "boolean") {
      throw new Error("It must be specified if the layout is a single tile layout.");
    }
    this.isSingleTileLayout = function() { return layoutConfig.singleTile; };
    
    // set the css if it's defined
    if (layoutConfig.panelCss == null) {
      throw new Error("The panelCss must be defined for any LayoutStyle.");
    } else if ($.isFunction(layoutConfig.panelCss)) {
      this.css = function() { return layoutConfig.panelCss(layouter) };
    } else if ($.isPlainObject(layoutConfig.panelCss)) {
      this.css = function() { return layoutConfig.panelCss };
    } else {
      throw new Error("The defined panelCss is invalid.");
    }
    
    // set the tileStyle if it's defined
    if (layoutConfig.tileCss == null) {
      throw new Error("The tileCss must be defined for any LayoutStyle.");
    } else if ($.isFunction(layoutConfig.tileCss)) {
      this.tileCss = function(index) { return layoutConfig.tileCss(layouter, index) };
    } else if ($.isPlainObject(layoutConfig.tileCss)) {
      this.tileCss = function() { return layoutConfig.tileCss };
    } else {
      throw new Error("The defined tileCss is invalid.");
    }
  };
  
  var Layouter = function() {
    this.panel = null;
    this.width = 0;
    this.height = 0;
    this.zIndexTiles = 1;
    this.zIndexSingleTile = 1000;
    this.zIndexCloseButton = 2000;
    
    this.tiles = [];
    this.layouts = {};
    
    this.boundToViewport = false;
    
    this.panelRule = function() { return null; };
    this.singleRule = function() { return null; };
  };
  Layouter.prototype = {
    placeHolderSelector: 'div.placeholder[id^="placeholder_"]',
    
    isCssPointerEvents: function() {
      var element = document.createElement('x');
      element.style.cssText = 'pointer-events:auto';
      return element.style.pointerEvents === 'auto';
    },

    config: function(config) {
      if ($.isPlainObject(config)) {
      
        // get the defined tiles
        if ($.isArray(config.tiles)) {
          this.tiles = config.tiles;
        }
      
        // get the layouts of the config
        var layoutCounterSingle = 0;
        var layoutCounterPanel = 0;
        this.layouts = {};
        if ($.isPlainObject(config.layouts)) {
          for(var i in config.layouts) {
            if (window.console) {
              if (this.layouts[i] !== undefined) {
                console.warn("Overloading layout '" + i + "' (" + this.layouts[i] + ").");
                
                if (this.layouts[i].isSingleTileLayout()) {
                  layoutCounterSingle--;
                } else {
                  layoutCounterPanel++;
                }
              } else {
                console.log("Loaded layout '" + i + "'.");
              }
            }
          
            var configLayout = config.layouts[i];
            this.layouts[i] = new LayoutStyle(this, i, configLayout);
            if (configLayout.singleTile) {
              layoutCounterSingle++;
            } else {
              layoutCounterPanel++;
            }
          }
        } else {
          throw new Error("The configuration needs at least one specified layout.");
        }
        
        // check the layouts, we need at least two
        if (layoutCounterSingle + layoutCounterPanel < 2) {
          throw new Error("The configuration must specify at least two layouts (one for single tiles and one for the panel).");
        } else if (layoutCounterPanel < 1) {
          throw new Error("The configuration must specify at least one layout to be used for the panel.");
        } else if (layoutCounterSingle < 1) {
          throw new Error("The configuration must specify at least one layout to be used for a single tile.");
        }
      
        // get the defined rules
        if ($.isPlainObject(config.rules)) {
        
          // get the rule for the panelLayout
          if (config.rules.panelLayout == null) {
            throw new Error("A rule for the panelLayout must be specified.");
          } else if ($.isFunction(config.rules.panelLayout)) {
            this.panelRule = function() { return config.rules.panelLayout(this); };
          } else if (typeof config.rules.panelLayout === "string") {
            this.panelRule = function() { return config.rules.panelLayout };
          } else {
            throw new Error("The rule for the panelLayout is invalid.");
          }
          
          // get the rule for the singleLayout
          if (config.rules.singleLayout == null) {
            throw new Error("A rule for the singleLayout must be specified.");
          } else if ($.isFunction(config.rules.singleLayout)) {
            this.singleRule = function() { return config.rules.singleLayout(this); };
          } else if (typeof config.rules.singleLayout === "string") {
            this.singleRule = function() { return config.rules.singleLayout };
          } else {
            throw new Error("The rule for the singleLayout is invalid.");
          }
        } else {
          throw new Error("The configuration must specify the rules for the different layouts.");
        }
      } else {
        throw new Error("The configuration must be a plain JavaScript object.");
      }
    },
        
    bind: function(selector, bindToViewport) {
      var _ref = this;
      
      // set the panel
      this.panel = $(selector);
      
      // make sure we selected exactly one item
      if (this.panel.size() != 1) {
        throw new Error("The selector '" + selector + "' selects '" + this.panel.size() + "'.");
      }
      
      // remove everything from the panel
      this.panel.empty();
      
      // create a resizer which handles resize events
      if (bindToViewport) {
        this.boundToViewport = true;
        
        var _ref = this;
        $(window).on('resize.' + this.uuid, function() {
          _ref.layout();
        }); 
      }
            
      // set some css attributes and disable the panel selection
      this.panel.css({ position: "relative" });
      this.disableSelection(this.panel);
      
      // create the divs
      for (var i = 0; i < this.tiles.length; i++) {
        var tileConfig = _ref.tiles[i] == null ? {} : _ref.tiles[i];
      
        // create the placeholder
        var el = $("<div></div>").appendTo(this.panel);
        el.addClass("placeholder");
        el.attr("id", "placeholder_" + i);
        el.css("position", "absolute");
        
        // add the click event
        if (tileConfig.disableClick != true) {
          el.click(function() {
            _ref.onClick($(this));
          });

          el.css("cursor", "pointer");
        }
        
        if (tileConfig.css != null) {
          el.css(tileConfig.css);
        }
        
        // disable selection
       this.disableSelection(el);
      }
      
      // layout the placeholder
      this.layout();
      
      // add the content to the layouted values
      var placeholder = $(this.placeHolderSelector);
      placeholder.each(function(index) {  
        var el = $(this);
        var tileConfig = _ref.tiles[index] == null ? {} : _ref.tiles[index];
        
        // add the content
        if (tileConfig.url != null) {
          var iframe = $("<iframe></iframe>").appendTo(el);
          iframe.addClass("content");
          iframe.attr("src", tileConfig.url);
          iframe.css({
            position: "absolute",
            top: 0,
            left: 0,
            width: el.width() + "px",
            height: el.height() + "px",
            pointerEvents: "none"
          });
          
          if (tileConfig.showPreview == false || !_ref.isCssPointerEvents()) {
            iframe.hide();
          }
        } else if (tileConfig.scripts != null) {
          var el = $(this);
          
          var div = $("<div></div>").appendTo(el);
          div.addClass("content");
          div.css({
            position: "absolute",
            top: 0,
            left: 0,
            width: el.width() + "px",
            height: el.height() + "px",
            cursor: "default",
            backgroundColor: '#FFFFFF',
            pointerEvents: "none"
          });
          div.click(function(e) {
            e.stopPropagation();
          });
          
          var funcFull;
          if ($.isFunction(tileConfig.scripts.full)) {
            funcFull = tileConfig.scripts.full;
          } else if (tileConfig.scripts.full != null) {
            funcFull = function() { eval(tileConfig.scripts.full); };
          }
          div.on('full', function() { funcFull(div); });
          
          var funcTile;
          if ($.isFunction(tileConfig.scripts.tile)) {
            funcTile = tileConfig.scripts.tile;
          } else if (tileConfig.scripts.tile != null) {
            funcTile = function() { eval(tileConfig.scripts.tile); };
          }
          div.on('tile', function() { funcTile(div); });
          
          var funcResize;
          if ($.isFunction(tileConfig.scripts.resize)) {
            funcResize = tileConfig.scripts.resize;
          } else if (tileConfig.scripts.resize != null) {
            funcResize = function() { eval(tileConfig.scripts.resize); };
          }
          div.on('resizeTile', function(event, tile) { funcResize(tile.width(), tile.height()); });
          
          div.hide();
        }
      });
    },
    
    /**
     * Method triggered when a tile is clicked. The actual jQuery object
     * representing the tile clicked on is passed.
     */
    onClick: function(el) {

      // get the layout of the tile
      var tileLayout = this.determineLayoutOfTile(el);
      if (tileLayout.isSingleTileLayout()) {
        
        // get the general layout of the panel
        var panelLayout = this.determinePanelLayout();
        
        /* 
         * The layout may be reapplied to all tiles if it was 
         * resized in full-screen. Therefore we apply the new
         * layout to all tiles instead of only the one, i.e.
         *  - this.applyLayout(panelLayout, el);
         */
        this.applyLayout(panelLayout);
        this.getContent(el).trigger('tile');
      } else {
        var singleLayout = this.determineSingleLayout();
        this.applyLayout(singleLayout, el);
        this.getContent(el).trigger('full');
      }
    },
    
    /**
     * Method triggered on when a resize-event occurs. The new
     * width and height is passed.
     */
    onResize: function(width, height) {
      var cur = this.current();
      if (cur == null || cur.layout == null || !cur.layout.isSingleTileLayout()) {
        this.applyLayout(this.determinePanelLayout());
      } else {
        this.applyLayoutToTile(cur.tile, cur.layout);
        this.getContent(cur.tile).trigger('resizeTile', [cur.tile]);
      }
    },
    
    /**
     * The method is used to lay the current panel out. The method
     * should be called whenever the panel is resized or the panel is
     * initialized.
     */
    layout: function(posX, posY, width, height) {

      // override the passed values, if any if we are bound
      if (this.boundToViewport) {
        var viewport = $(window);
        
        // the width and height
        var offetWidth = this.panel.outerWidth(true) - this.panel.width();
        var offetHeight = this.panel.outerHeight(true) - this.panel.height();
        
        // hide it so that it doesn't increase size of viewport
        this.panel.hide();
        var viewportHeight = viewport.height();
        var viewportWidth = viewport.width();
        
        // show the panel again and lay it out
        this.panel.show();
        
        posX = 0;
        posY = 0;
        width = viewportWidth - offetWidth;
        height = viewportHeight - offetHeight;
      }
      
      // apply the passed values
      if ($.isNumeric(posX) && posX >= 0) {
        this.panel.css('left', posX + 'px');
      }
      if ($.isNumeric(posY) && posY >= 0) {
        this.panel.css('top', posY + 'px');
      }
      if ($.isNumeric(width) && width >= 0) {
        this.panel.width(width);
      }
      if ($.isNumeric(height) && height >= 0) {
        this.panel.height(height);
      }

      // set the new values
      var oldWidth = this.width;
      var oldHeight = this.height;
      this.width = this.panel.width();
      this.height = this.panel.height();

      // do actually the resizing
      if (oldWidth != this.width || oldHeight != this.height) {
        this.onResize(this.width, this.height);
      }
    },
   
    /**
     * Method used to get the current layout. The current layout
     * is the layout currently visible (i.e. a single-tile layout
     * if it is currently applied, otherwise a panel-layout).
     */
    current: function() {
      var placeholder = $(this.placeHolderSelector);
      
      // apply the selected layout
      var currentLayout = null;
      var currentTile = null;
      var _ref = this;
      placeholder.each(function(index) {
        
        // get the layout of the current element
        if (currentLayout == null) {        
          currentLayout = _ref.determineLayoutOfTile($(this));
        } else if (!$(this).hasClass(currentLayout.name)) {
          currentLayout = _ref.determineLayoutOfTile($(this));
          currentTile = $(this);
          if (!currentLayout.isSingleTileLayout()) {
            throw new Error("Cannot use different multiple-tile-layouts.");
          }
          return false;
        }
        
        // check if we found a single tile layout
        if (currentLayout != null && currentLayout.isSingleTileLayout()) {
          currentTile = $(this);
          return false;
        }
      });
      
      return { layout: currentLayout, tile : currentTile };
    },
    
    determineLayoutOfTile: function(sel) {
      var el = this.getTile(sel);
    
      for(var i in this.layouts) {
        var l = this.layouts[i];
        if (el.hasClass(l.name)) {
          return l;
        }
      }
      
      return null;
    },
    
    /**
     * Determines the layout to be used.
     */
    determinePanelLayout: function() {
      var layoutName = this.panelRule();
      
      if (layoutName) {
        var l = this.layouts[layoutName];
        if (!l) {
          throw new Error("The layout '" + layoutName + "' cannot be found.");
        } else if (l.isSingleTileLayout()) {
          throw new Error("The specified layout for a panel cannot be a singleTile-layout.");
        }
        
        return l;
      } else {
        return null;
      }
    },
    
    determineSingleLayout: function() {
      var layoutName = this.singleRule();
      var l = this.layouts[layoutName];
      if (!l.isSingleTileLayout()) {
        throw new Error("The specified singleLayout must be marked as such, i.e. singleTile must be true.");
      }
      
      return l;
    },
    
    rule: function() {
      for(var i in this.layouts) {
        var l = this.layouts[i];
        if (!l.isSingleTileLayout()) {
          return l.name;
        }
      }
      
      return null;
    },
    
    /**
     * Applies the specified layout to the whole panel,
     * or just a selected tile (sel). The selected tile,
     * can be selected using it's id, it's jQuery object,
     * or it's index.
     */
    applyLayout: function(layout, sel) {
      if (layout == null) {
        this.panel.empty();
      } else if (sel == null) {
        var placeholder = $(this.placeHolderSelector);
      
        // apply the selected layout
        var _ref = this;
        placeholder.each(function(index) {
          _ref.applyLayoutToTile($(this), layout);
        });
        
        this.panel.css(layout.css(this));
      } else {
        this.applyLayoutToTile(sel, layout);
        this.panel.css(layout.css(this));
      }
    },
    
    /**
     * Gets the tile selected by sel. A tile can be selected by
     * it's id, it's jQuery object, or it's index.
     */
    getTile: function(sel) {
      if (typeof sel === "string") {
        var el = $("#" + sel);
        return this.getTile(el);
      } else if (typeof sel === "number") {
        var el = $("#placeholder_" + sel);
        return this.getTile(el);
      } else if (sel instanceof jQuery) {
        return sel;
      } else {
        throw new Error("The passed object '" + sel + "' is of invalid type.");
      }
    },
    
    /** 
     * Gets the content as jQuery object of the specified tile.
     */
    getContent: function(sel) {
      var el = this.getTile(sel);
      return el.children(".content");
    },
    
    disableSelection: function(el) {
      el.attr('unselectable', 'on')
        .css('user-select', 'none')
        .css('MozUserSelect', 'none')
        .on('selectstart', false);
    },
    
    /**
     * Applies the specified layout to the the selected 
     * tile (sel). The selected tile, can be selected using 
     * it's id, it's jQuery object, or it's index.
     */
    applyLayoutToTile: function(sel, layout) {
      var el = this.getTile(sel);
  
      // apply the layout to the tile
      var index = parseInt(el.attr("id").replace("placeholder_", ""));
      el.css(layout.tileCss(index));

      // set the correct classes
      for(var i in this.layouts) {
        var l = this.layouts[i];
        if (layout.name == l.name) {
          el.addClass(l.name);
        } else {
          el.removeClass(l.name);
        }
      }
      
      // apply the layout to the content
      var content = this.getContent(el);
      if (content != null) {
        content.css({
          width: el.width(),
          height: el.height(),
          pointerEvents: layout.isSingleTileLayout() ? "auto" : "none"
        });
        content.show();
        
        // add the close button if it's a single tile
        if (layout.isSingleTileLayout()) {

        
          var closeButton = el.children(".closeButton");
          if (closeButton.size() == 0) {
            closeButton = $("<div></div>").appendTo(el);
            closeButton.addClass("closeButton");
            
            closeButton.css({
              width: layout.closeButtonSize + "px",
              height: layout.closeButtonSize + "px",
              position: "absolute",
              zIndex: this.zIndexCloseButton
            });
          }
          
          closeButton.css({
            top: "0px",
            left: (el.width() - layout.closeButtonSize) + "px",
          });
        } else {
          var closeButton = el.children(".closeButton");
          closeButton.remove();
          
          var tileConfig = this.tiles[index] == null ? {} : this.tiles[index];
          if (tileConfig.showPreview == false || !this.isCssPointerEvents()) {
            content.hide();
          }
        }
      }
    }
  };

  return Layouter;
});