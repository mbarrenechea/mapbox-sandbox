import { CompositeLayer } from 'deck.gl';
import BitmapLayer from 'components/bitmap-layer';
import TileCache from './utils/tile-cache';

const defaultProps = {
  renderSubLayers: props => new BitmapLayer(props),
  getTileData: ({x, y, z}) => Promise.resolve(null),
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
