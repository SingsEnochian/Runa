/*
  Wardenclyffe future kernel sketch
  ---------------------------------
  This file is intentionally small and dependency-free so it can become a WebAssembly
  module later without dragging a cathedral of libraries into the room.

  Runtime split:
  - CSS renders the current liquid-light chamber.
  - JavaScript owns consent and the Web Audio graph.
  - Python generates iteration recipes.
  - This C++ layer can become the fast DSP/fluid kernel when needed.

  Build note for later:
    emcc wardenclyffe_fluid_kernel.cpp -O3 -s MODULARIZE=1 -s EXPORTED_FUNCTIONS='["_wc_step_scalar_field","_wc_envelope"]'
*/

#include <cmath>
#include <cstddef>

namespace wardenclyffe {
  static inline float clamp01(float value) {
    if (value < 0.0f) return 0.0f;
    if (value > 1.0f) return 1.0f;
    return value;
  }

  static inline int index_of(int x, int y, int width, int height) {
    if (x < 0) x = 0;
    if (x >= width) x = width - 1;
    if (y < 0) y = 0;
    if (y >= height) y = height - 1;
    return y * width + x;
  }

  static inline float sample_bilinear(const float* field, float x, float y, int width, int height) {
    const int x0 = static_cast<int>(std::floor(x));
    const int y0 = static_cast<int>(std::floor(y));
    const int x1 = x0 + 1;
    const int y1 = y0 + 1;

    const float sx = x - static_cast<float>(x0);
    const float sy = y - static_cast<float>(y0);

    const float a = field[index_of(x0, y0, width, height)];
    const float b = field[index_of(x1, y0, width, height)];
    const float c = field[index_of(x0, y1, width, height)];
    const float d = field[index_of(x1, y1, width, height)];

    const float top = a + (b - a) * sx;
    const float bottom = c + (d - c) * sx;
    return top + (bottom - top) * sy;
  }

  static inline float smooth_envelope(float phase, float depth) {
    const float normalized = (std::sin(phase) + 1.0f) * 0.5f;
    const float eased = normalized * normalized * (3.0f - 2.0f * normalized);
    return 1.0f - depth + eased * depth;
  }
}

extern "C" {
  /*
    Semi-Lagrangian scalar advection for one liquid-light field.

    field_in: scalar density/light buffer
    velocity_x / velocity_y: velocity buffers in cells per second
    field_out: destination buffer
    width/height: grid dimensions
    dt: time step in seconds
    dissipation: 0..1 loss factor, where smaller values fade faster

    This does not project velocity yet. It is the first useful kernel: stable,
    predictable, and good enough for liquid-light layer experiments.
  */
  void wc_step_scalar_field(
    const float* field_in,
    const float* velocity_x,
    const float* velocity_y,
    float* field_out,
    int width,
    int height,
    float dt,
    float dissipation
  ) {
    if (!field_in || !velocity_x || !velocity_y || !field_out || width <= 0 || height <= 0) return;

    const float keep = wardenclyffe::clamp01(dissipation);

    for (int y = 0; y < height; ++y) {
      for (int x = 0; x < width; ++x) {
        const int idx = y * width + x;
        const float back_x = static_cast<float>(x) - velocity_x[idx] * dt;
        const float back_y = static_cast<float>(y) - velocity_y[idx] * dt;
        field_out[idx] = wardenclyffe::sample_bilinear(field_in, back_x, back_y, width, height) * keep;
      }
    }
  }

  /*
    Shared amplitude envelope for DSP and visual pulse layers.
    phase_radians can be driven from JavaScript time or an AudioWorklet clock.
  */
  float wc_envelope(float phase_radians, float depth) {
    return wardenclyffe::smooth_envelope(phase_radians, wardenclyffe::clamp01(depth));
  }
}
