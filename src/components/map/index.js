import React from 'react';
import DeckGL, { ScatterplotLayer } from 'deck.gl';
import { StaticMap } from 'react-map-gl';
import { MapboxLayer } from '@deck.gl/mapbox';
import TileLayer from 'components/tile-layer';
import BitmapLayer from 'components/bitmap-layer';

const MAPBOX_TOKEN = "pk.eyJ1IjoiYWZpbGF0b3JlOTAiLCJhIjoiY2lqcml0bHoyMDBhZHZwbHhzM2Q1bnRwNSJ9.Zm2C1hNemolKnIAAWquGYg";

const INITIAL_VIEW_STATE = {
    longitude: -74.50,
    latitude: 40,
    zoom: 12
};

export class Map extends React.Component {
  state = {};

  // DeckGL and mapbox will both draw into this WebGL context
  _onWebGLInitialized = (gl) => {
    this.setState({ gl });
  }

  _onMapLoad = () => {
    const map = this._map;
    const deck = this._deck;

    map.addLayer(new MapboxLayer({id: 'my-scatterplot', deck}));
    map.addLayer(new MapboxLayer({id: 'bitmap-layer', deck, map: this._map}));
  }

  render() {
    const { gl } = this.state;

    function getTileData({x, y, z}) {
      // const mapSource = `https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v7/${z}/${x}/${y}.vector.pbf?access_token=${MAPBOX_TOKEN}`;
      const mapSource = `https://storage.googleapis.com/wri-public/Hansen17/tiles/hansen_world/v1/tc30/${z}/${x}/${y}.png`;

      return fetch(mapSource)
        .then(response => response.blob())
        .then(response => {
          const src = URL.createObjectURL(response);
          const image = new Image();
  
          image.src = src;
          return image;
          // image.onload = () => {
          //   image.crossOrigin = '';
          //   resolve(image);
          //   URL.revokeObjectURL(src);
          // };
  
          // image.onerror = () => {
          //   reject(new Error("Can't load image"));
          // };
        })
    }

    // function vectorTileToGeoJSON(buffer, x, y, z) {
    //   console.log(buffer);
    // }

    const layers = [
        new ScatterplotLayer({
          id: 'my-scatterplot',
          data: [
            { position: [-74.5, 40], size: 100 }
          ],
          getPosition: d => d.position,
          getRadius: d => d.size,
          getFillColor: [255, 0, 0]
        }),
        new TileLayer({
          id: 'my-tile-layer',
          stroked: false,
          getLineColor: [192, 192, 192],
          getFillColor: [140, 170, 180],
          getTileData
        }),
        // new BitmapLayer({
        //   id: 'bitmap-layer',
        //   image: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
        //   bitmapBounds: [
        //     [-71.516, 37.936],
        //     [-80.425, 37.936],
        //     [-80.425, 46.437],
        //     [-71.516, 46.437]
        //   ],
        //   desaturate: 0,
        //   transparentColor: [0, 0, 0, 0],
        //   tintColor: [255, 255, 255]
        // })
    ];

    return (
      <DeckGL
        ref={ref => {
          // save a reference to the Deck instance
          this._deck = ref && ref.deck;
        }}
        layers={layers}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        onWebGLInitialized={this._onWebGLInitialized}
      >
        {gl && (
          <StaticMap
            ref={ref => {
              // save a reference to the mapboxgl.Map instance
              this._map = ref && ref.getMap();
            }}
            gl={gl}
            mapStyle="mapbox://styles/mapbox/light-v9"
            mapboxApiAccessToken={MAPBOX_TOKEN}
            onLoad={this._onMapLoad}
          />
        )}
      </DeckGL>
    );
  }
}

export default Map;