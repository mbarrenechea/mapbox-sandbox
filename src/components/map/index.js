import React from 'react';
import DeckGL, { ScatterplotLayer } from 'deck.gl';
import { StaticMap } from 'react-map-gl';
import { MapboxLayer } from '@deck.gl/mapbox';
import TileLayer from 'components/tile-layer';

const MAPBOX_TOKEN = "pk.eyJ1IjoiYWZpbGF0b3JlOTAiLCJhIjoiY2lqcml0bHoyMDBhZHZwbHhzM2Q1bnRwNSJ9.Zm2C1hNemolKnIAAWquGYg";

const INITIAL_VIEW_STATE = {
    longitude: -51.76,
    latitude: -31.21,
    zoom: 9.9
};

export class Map extends React.Component {
  state = {
    endDate: 2018
  };

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

  componentDidMount() {
    // setInterval(() => {
    //   this.setState(state => ({ endDate: state.endDate >= 2018 ? 2001 : state.endDate + 1 })); 
    // }, 200);
  }

  render() {
    const { gl } = this.state;

    function getTileData({x, y, z}) {
      const mapSource = `https://storage.googleapis.com/wri-public/Hansen17/tiles/hansen_world/v1/tc30/${z}/${x}/${y}.png`;

      return fetch(mapSource)
        .then(response => response.blob())
        .then(response => {
          const src = URL.createObjectURL(response);
          const image = new Image();

          image.src = src;
          return image;
        })
    }

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
          minZoom: 3,
          maxZoom: 12,
          getLineColor: [192, 192, 192],
          getFillColor: [140, 170, 180],
          getTileData,
          endDate: this.state.endDate
        })
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