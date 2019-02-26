export default `
#define SHADER_NAME bitmap-layer-vertex-shader

#define ANTIALIASING 1.0 / DEVICE_PIXEL_RATIO / 2.0

attribute vec2 texCoords;
attribute vec3 positions;
attribute vec2 positions64xyLow;

varying vec2 vTexCoord;

void main(void) {
  gl_Position = project_position_to_clipspace(positions, positions64xyLow, vec3(0.0));

  vTexCoord = texCoords;

  picking_setPickingColor(vec3(0., 0., 1.));
}
`;
