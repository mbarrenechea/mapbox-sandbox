export default `
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
uniform float zoom;

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

// decode loss layer
vec4 decodeFunction(vec3 color, float year) {
  float intensity = color.r * 255.;
  // float exponent = zoom > 11. ? 0.3 + (zoom - 3.) / 20. : 1.;

  if (year >= startDate && year <= endDate && year >= 2001.) {
    color.r = 220. / 255.;
    color.g = (72. - zoom + 102. - 3. * intensity / zoom) / 255.;
    color.b = (33. - zoom + 153. - intensity / zoom) / 255.;
    return vec4(color, color.r);
  } else {
    return vec4(0., 0., 0., 0.);
  }
}

void main(void) {
  vec4 bitmapColor = texture2D(bitmapTexture, vTexCoord);

  if ((bitmapColor.r * 255.) < 1.) {
    discard;
  }

  gl_FragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * opacity);

  // use highlight color if this fragment belongs to the selected object.
  gl_FragColor = picking_filterHighlightColor(gl_FragColor);

  // use picking color if rendering to picking FBO.
  gl_FragColor = picking_filterPickingColor(gl_FragColor);

  float year = 2000.0 + (bitmapColor.b * 255.);
  gl_FragColor = decodeFunction(bitmapColor.rgb, year);
}
`;
