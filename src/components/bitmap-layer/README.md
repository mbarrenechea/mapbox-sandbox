# BitmapLayer

The BitmapLayer renders a bitmap at specified boundaries.

```js
import {BitmapLayer} from '@deck.gl/experimental-layers';

const App = ({data, viewport}) => {

  const layer = new BitmapLayer({
    id: 'bitmap-layer',
    image: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
    bitmapBounds: [
      [-71.516, 37.936],
      [-80.425, 37.936],
      [-80.425, 46.437],
      [-71.516, 46.437]
    ],
    desaturate: 0,
    transparentColor: [0, 0, 0, 0],
    tintColor: [255, 255, 255]
  });

  return (<DeckGL {...viewport} layers={[layer]} />);
}
```

## Properties

### Data

##### `image` (String|Texture2D|Image|HTMLCanvasElement)

- Default `null`.

##### `bitmapBounds` (Array)

Supported formats:
- Coordinates of the bounding box of the bitmap `[right, bottom, left, top]`
- Position of four corners of the bitmap, should follow the sequence of `[[right, bottom], [left, bottom], [left, top], [right, top]]` 
each position could be `[x, y]` or `[x, y, z]` format. 

`left`, `right`, `top`, and `bottom` refers corresponding coordinate of the `left`, `right`, `top`, and `bottom` side of the bitmap.

### Render Options

##### `desaturate` (Number)

- Default `0`

The desaturation of the bitmap. Between `[0, 1]`. `0` being the original color and `1` being grayscale.

##### `transparentColor` (Array)

- Default `[0, 0, 0, 0]`

The color to use for transparent pixels, in `[r, g, b, a]`. Each component is in the `[0, 255]` range.

##### `tintColor` (Array)

- Default `[255, 255, 255]`

The color to tint the bitmap by, in `[r, g, b]`. Each component is in the `[0, 255]` range.

