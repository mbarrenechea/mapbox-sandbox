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

vec4 decodeFunction(vec3 color, float alpha, float year) {
  if (year >= startDate && year <= endDate) {
    color.r = 255. / 255.;
    color.g = 103. / 255.;
    color.b = 153. / 255.;
    return vec4(color, alpha);
  } else {
    return vec4(color, 0.);
  }
}

void main(void) {
  vec4 bitmapColor = texture2D(bitmapTexture, vTexCoord);

  if (bitmapColor == vec4(0., 0., 0., 1.)) {
    discard;
  }
  
  float year = 2000.0 + (bitmapColor.b * 255.);
  gl_FragColor = decodeFunction(bitmapColor.rgb, 0.5, year);
}
`;
