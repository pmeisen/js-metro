// define the baseUrl
requirejs.config({
  baseUrl: 'scripts'
});

// now start the entry-point
require(['jquery', 'net/meisen/ui/metro/Layouter'], function($, Layouter) {

  var layouterConfig = {

    /*
     * Define the different tiles to be shown
     */
    tiles: [
      /*
       * Sample tile with description (full config). The tile shows
       * the content of the defined url and can be maximized to full
       * screen.
       */
      {
        // apply some special css to the tile
        css: { background: "red" },
        
        // define the url of the tile
        url: "content.html",
        
        // enable or disable clicking the tile (default: false)
        disableClick: false,
        
        // show the url when the tile is minimized (default: true)
        showPreview: true
      },
      /*
       * Sample of a separator tile. The tile  is used as separator, i.e. 
       * cannot see it, cannot click it.
       */
      {
        disableClick: true
      },
      /* 
       * Sample of a tile which does not show the url's content when minimized.
       */
      {
        css: {
          backgroundImage: "-webkit-linear-gradient(#445566 0%, #9FBFD2 100%)",
          backgroundImage: "-moz-linear-gradient(#445566 0%, #9FBFD2 100%)",
          backgroundImage: "-o-linear-gradient(#445566 0%, #9FBFD2 100%)",
          backgroundImage: "linear-gradient(#445566 0%, #9FBFD2 100%)"
        },
        showPreview: false,
        url: "content.html"
      },
      
      // just add some more tiles
      { css: { background: "yellow" }, url: "content.html" }, 
      { css: { background: "pink" }, url: "content.html" }, 
      { css: { background: "brown" }, url: "content.html" }, 
      { css: { background: "green" }, url: "content.html" }
    ],
    
    /*
     * Define the rule which (non-singleTile) layout should be used.
     */
    rules: {
      singleLayout: "fullScreen",
      
      panelLayout: function(layouter) {

        if (layouter.height < 400 || layouter.width < 500) {
          return "small";
        } else {       
          return "large";
        }
      }
    },
    
    /*
     * Define the different layouts.
     */
    layouts: {
      small: {
        _margin   : 5,
        
        /*
         * Define if the layout is a layout which is applied to a single tile,
         * and not the whole panel.
         */
        singleTile: false,
        /*
         * Define the panel's css, which can be an css-object or a function applying
         * a css to the tile. The function can get the layouter as first parameter.
         */
        panelCss  : { overflowX: "hidden", overflowY: "scroll" },
        /*
         * Define the tile's css, which can be an css-object or a function applying
         * a css to the tile. The function can get the layouter as first and 
         * the index of the tile as second parameter.
         */
        tileCss   : function(layouter, index) {
                      var size = 100;
                      
                      var nrOfCols = Math.floor((layouter.width - 20 - this._margin) / (size + this._margin));
                      var col = index % nrOfCols;
                      var row = Math.ceil((index + 1) / nrOfCols) - 1;

                      return {
                        top: ((row + 1) * this._margin + row * size) + "px", 
                        left: ((col + 1) * this._margin + col * size) + "px",
                        zIndex: layouter.zIndexTiles,
                        width: size + "px",
                        height: size + "px",
                      };
                    }
      },
      
      large: {
        _nrOfRows : 3,
        _margin   : 10,
      
        singleTile: false,
        panelCss  : { overflowX: "scroll", overflowY: "hidden" },
        tileCss   : function(layouter, index) {
                      var row = index % this._nrOfRows;
                      var col = Math.ceil((index + 1) / this._nrOfRows) - 1;
                      
                      var size = Math.round((layouter.height - 20 - ((this._nrOfRows + 1) * this._margin)) / this._nrOfRows);
                      
                      return {
                        top: ((row + 1) * this._margin + row * size) + "px", 
                        left: ((col + 1) * this._margin + col * size) + "px",
                        zIndex: layouter.zIndexTiles,
                        width: size + "px",
                        height: size + "px",
                      };
                    }
      },
      
      fullScreen: {
        singleTile: true,
        panelCss  : { overflow: "hidden" },
        tileCss   : function(layouter, index) {
                      return { 
                        top: layouter.panel.scrollTop() + "px",
                        left: layouter.panel.scrollLeft() + "px",
                        zIndex: layouter.zIndexSingleTile,
                        width: layouter.width + "px",
                        height: layouter.height + "px"
                      };
                    }
      }
    }
  };

  var selector = "#panel";

  if ($(selector).size() == 1) {
    var layouter = new Layouter();
    layouter.config(layouterConfig);
    layouter.bind(selector, true);
  }
});