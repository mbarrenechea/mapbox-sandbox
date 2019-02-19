import React, { Component } from 'react';

import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import Map from 'components/map';

class App extends Component {
  render() {
    return (
      <Map />
    );
  }
}

export default App;
