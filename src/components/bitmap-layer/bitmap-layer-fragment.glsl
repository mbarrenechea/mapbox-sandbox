#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

varying vec2 vTexCoord;

uniform float desaturate;
uniform vec4 transparentColor;
uniform vec3 tintColor;
uniform float opacity;
uniform float startDate;
uniform float endDate;

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * tintColor / 255.0;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  return mix(transparentColor / 255.0, vec4(color, 1.0), alpha);
}

vec4 decodeFunction(vec4 color) {
  float yearLoss = 2000.0 + color.b;
  if (yearLoss <= startDate && yearLoss >= endDate) {
    color.a = 0.;
  }
  return color;
}

void main(void) {
  vec4 bitmapColor = texture2D(bitmapTexture, vTexCoord);

  if (bitmapColor == vec4(0., 0., 0., 1.)) {
    discard;
  }

  // gl_FragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * opacity);
  gl_FragColor = decodeFunction(bitmapColor.rgba);

  // use highlight color if this fragment belongs to the selected object.
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);

  // use picking color if rendering to picking FBO.
  gl_FragColor = picking_filterPickingColor(gl_FragColor);
}

// decode 
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

//   getExp(z) { 
//     return z < 11 ? 0.3 + (z - 3) / 20 : 1;
//   }

//   getScale(z) {
//     return scalePow()
//       .exponent(this.getExp(z))
//       .domain([0, 256])
//       .range([0, 256]);
//   }