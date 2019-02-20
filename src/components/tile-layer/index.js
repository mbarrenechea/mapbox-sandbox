import { CompositeLayer } from 'deck.gl';
import BitmapLayer from 'components/bitmap-layer';
import TileCache from './utils/tile-cache';
import { scalePow } from 'd3-scale';

const defaultProps = {
  renderSubLayers: props => new BitmapLayer(props),
  getTileData: ({ x, y, z }) => Promise.resolve(null),
  onDataLoaded: () => {},
  // eslint-disable-next-line
  onGetTileDataError: err => console.error(err),
  maxZoom: null,
  minZoom: null,
  maxCacheSize: null
};

export default class TileLayer extends CompositeLayer {
  initializeState() {
    const {maxZoom, minZoom, getTileData, onGetTileDataError} = this.props;
    this.state = {
      tiles: [],
      ctx: [],
      tileCache: new TileCache({getTileData, maxZoom, minZoom, onGetTileDataError}),
      isLoaded: false
    };
  }

  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  updateState({props, oldProps, context, changeFlags}) {
    const {onDataLoaded, onGetTileDataError} = props;
    if (
      changeFlags.updateTriggersChanged &&
      (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getTileData)
    ) {
      const {getTileData, maxZoom, minZoom, maxCacheSize} = props;
      this.state.tileCache.finalize();
      this.setState({
        tileCache: new TileCache({
          getTileData,
          maxSize: maxCacheSize,
          maxZoom,
          minZoom,
          onGetTileDataError
        })
      });
    }
    if (changeFlags.viewportChanged) {
      const {viewport} = context;
      const z = this.getLayerZoomLevel();
      if (viewport.id !== 'DEFAULT-INITIAL-VIEWPORT') {
        this.state.tileCache.update(viewport, tiles => {
          const currTiles = tiles.filter(tile => tile.z === z);
          const allCurrTilesLoaded = currTiles.every(tile => tile.isLoaded);
          this.setState({tiles, isLoaded: allCurrTilesLoaded});
          if (!allCurrTilesLoaded) {
            Promise.all(currTiles.map(tile => tile.data)).then(() => {
              this.setState({isLoaded: true});
              onDataLoaded(currTiles.filter(tile => tile._data).map(tile => tile._data));
            });
          } else {
            onDataLoaded(currTiles.filter(tile => tile._data).map(tile => tile._data));
          }
        });
      }
    }
  }

  getPickingInfo({info, sourceLayer}) {
    info.sourceLayer = sourceLayer;
    info.tile = sourceLayer.props.tile;
    return info;
  }

  getLayerZoomLevel() {
    const z = Math.floor(this.context.viewport.zoom);
    const {maxZoom, minZoom} = this.props;
    if (maxZoom && parseInt(maxZoom, 10) === maxZoom && z > maxZoom) {
      return maxZoom;
    } else if (minZoom && parseInt(minZoom, 10) === minZoom && z < minZoom) {
      return minZoom;
    }
    return z;
  }

  tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
  }
  
  tile2lat(y, z) {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  }

  // drawCanvas({ _data, x, y, z }, ctx) {
  //   // if (!this.state.tiles[id]) {
  //   //   return;
  //   // }
  //   const image = _data;
    
  //   if (!image || !ctx || typeof x === 'undefined' || typeof y === 'undefined' || typeof z === 'undefined') {
  //     // delete this.state.tiles[id];
  //     return;
  //   }

  //   // const { params, decodeParams } = this.options;
  //   // const { dataMaxZoom = 20 } = params;
  //   const zsteps = 1;

  //   // this will allow us to sum up the dots when the timeline is running
  //   ctx.clearRect(0, 0, 256, 256);

  //   if (zsteps < 0) {
  //     ctx.drawImage(image, 0, 0);
  //   } else {
  //     // over the maxzoom, we'll need to scale up each tile
  //     ctx.imageSmoothingEnabled = false;
  //     // disable pic enhancement
  //     ctx.mozImageSmoothingEnabled = false;

  //     // tile scaling
  //     const srcX = 256 / (2 ** zsteps) * (x % (2 ** zsteps)) || 0;
  //     const srcY = 256 / (2 ** zsteps) * (y % (2 ** zsteps)) || 0;
  //     const srcW = 256 / (2 ** zsteps) || 0;
  //     const srcH = 256 / (2 ** zsteps) || 0;

  //     ctx.drawImage(
  //       image,
  //       srcX,
  //       srcY,
  //       srcW,
  //       srcH,
  //       0,
  //       0,
  //       256,
  //       256,
  //     );
  //   }

  //   const I = ctx.getImageData(0, 0, 256, 256);

  //   if (typeof decodeFunction === 'function') {
  //     decodeFunction(I.data, 256, 256, z);
  //   }

  //   ctx.putImageData(I, 0, 0);
  // }

  getExp(z) { 
    return z < 11 ? 0.3 + (z - 3) / 20 : 1;
  }

  getScale(z) {
    return scalePow()
      .exponent(this.getExp(z))
      .domain([0, 256])
      .range([0, 256]);
  }

  decodeFunction(data, w, h, z, params) {
    const components = 4;
    const imgData = data;
    const myScale = this.getScale(z);

    // const { startDate, endDate } = params;
    const yearStart = 2001;
    const yearEnd = 2018;

    for (let i = 0; i < w; ++i) {
      for (let j = 0; j < h; ++j) {
        const pixelPos = (j * w + i) * components;
        const yearLoss = 2000 + imgData[pixelPos + 2];
        if (yearLoss >= yearStart && yearLoss <= yearEnd) {
          const intensity = imgData[pixelPos];
          const scaleIntensity = myScale(intensity);
          imgData[pixelPos] = 220;
          imgData[pixelPos + 1] = 72 - z + 102 - 3 * scaleIntensity / z;
          imgData[pixelPos + 2] = 33 - z + 153 - intensity / z;
          imgData[pixelPos + 3] = z < 13 ? scaleIntensity : intensity;
        } else {
          imgData[pixelPos + 3] = 0;
        }
      }
    }
  };

  // /**
  //  * @param {array} valueMap           The mapping between grey and data values
  //  * @param {function} colorFunction   The color mapping function, which defaults to returning a transparent color
  //  */
  // createColorTexture(valueMap, colorFunction = () => 'transparent') {
  //   const canvas = document.createElement('canvas');
  //   const context = canvas.getContext('2d');
  //   const width = 256; // number of possible pixel color values, 0..255
  //   const height = 1;

  //   // create canvas which is 256px wide and 1px high
  //   canvas.width = width;
  //   canvas.height = height;

  //   for (let i = 0; i < width; i++) {
  //     const value = valueMap[i];

  //     // create a fill style from with the generated color
  //     context.fillStyle = colorFunction(value);
  //     // color the pixel on position [x=i, 0] with that fill style
  //     context.fillRect(i, 0, 1, height);
  //   }

  //   return context.getImageData(0, 0, width, height);
  // }

  renderLayers() {
    // eslint-disable-next-line no-unused-vars
    const { getTileData, renderSubLayers, visible, ...geoProps } = this.props;
    return this.state.tiles.map(tile => {
      const { x, y, z } = tile;
      const topLeft = [this.tile2long(x, z), this.tile2lat(y, z)];
      const topRight = [this.tile2long(x + 1, z), this.tile2lat(y, z)];
      const bottomLeft = [this.tile2long(x, z), this.tile2lat(y + 1, z)];
      const bottomRight = [this.tile2long(x + 1, z), this.tile2lat(y + 1, z)];
      const bounds = [bottomRight, bottomLeft, topLeft, topRight];

      // const tileCanvas = L.DomUtil.create('canvas', 'canvas-tile');
      // const ctx = tile.getContext('2d');
      // const size = this.getTileSize();

      // setup tile width and height according to the options
      // 256 = size.x;
      // 256 = size.y;

      // const canvas = document.createElement('canvas');
      // canvas.width = 256;
      // canvas.height = 256;
      // canvas.id = `${tile.z}-${tile.x}-${tile.y}-canvas`;
      // const ctx = canvas.getContext("2d");

      // // const image = this.drawCanvas(``, tile, ctx);

      // this.drawCanvas(tile, ctx);

      return new BitmapLayer({
        id: `${this.id}-${tile.x}-${tile.y}-${tile.z}`,
        image: `https://storage.googleapis.com/wri-public/Hansen17/tiles/hansen_world/v1/tc30/${tile.z}/${tile.x}/${tile.y}.png`,
        bitmapBounds: bounds,
        desaturate: 0,
        transparentColor: [0, 0, 0, 0],
        tintColor: [255, 255, 255]
      })
    });
  }
}

TileLayer.layerName = 'TileLayer';
TileLayer.defaultProps = defaultProps;
