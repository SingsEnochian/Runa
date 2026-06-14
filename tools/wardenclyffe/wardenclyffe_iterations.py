#!/usr/bin/env python3
"""Generate Wardenclyffe audio-engine iteration recipes.

This is an offline helper, not a runtime dependency. The browser page runs without
Python. Use this script to export stable JSON recipes for future visual/audio passes.

Example:
    python tools/wardenclyffe/wardenclyffe_iterations.py > docs/data/wardenclyffe-engine-iterations.json
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from typing import Iterable


@dataclass(frozen=True)
class LayerRecipe:
    name: str
    frequency_hz: float
    gain: float
    enabled: bool
    role: str


@dataclass(frozen=True)
class EngineIteration:
    iteration: int
    name: str
    tempo_scalar: float
    flow_viscosity: float
    flow_dissipation: float
    master_gain: float
    layers: list[LayerRecipe]


BASE_LAYERS = {
    "ground": LayerRecipe("ground", 117.45, 0.08, True, "Schumann modulation anchor"),
    "body": LayerRecipe("body", 174.0, 0.08, True, "low body-hum carrier"),
    "carrier": LayerRecipe("carrier", 528.0, 0.09, True, "main tone spine"),
    "pulse": LayerRecipe("pulse", 369.0, 0.07, True, "3:6:9 pulse voice"),
    "shimmer": LayerRecipe("shimmer", 1728.0, 0.035, True, "north-star upper partial"),
    "noise": LayerRecipe("noise", 1200.0, 0.016, True, "filtered lantern air"),
}


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def fibonacci_ratio(step: int) -> float:
    # A tiny deterministic wobble. Useful for variation without random drift.
    fib = [1, 1]
    for _ in range(2, step + 4):
        fib.append(fib[-1] + fib[-2])
    return fib[-1] / fib[-2]


def shift_layer(layer: LayerRecipe, iteration: int) -> LayerRecipe:
    wobble = math.sin(iteration * 0.73) * 0.018
    ratio = fibonacci_ratio(iteration) / 1.61803398875
    frequency = layer.frequency_hz * (1.0 + wobble + (ratio - 1.0) * 0.012)

    # Keep noise filter and pulse from wandering into silliness.
    if layer.name == "noise":
        frequency = clamp(frequency, 800.0, 1800.0)
    if layer.name == "pulse":
        frequency = 369.0

    gain = clamp(layer.gain * (0.92 + math.cos(iteration * 0.41) * 0.08), 0.0, 0.22)
    return LayerRecipe(layer.name, round(frequency, 3), round(gain, 4), layer.enabled, layer.role)


def make_iteration(iteration: int) -> EngineIteration:
    viscosity = clamp(0.42 + math.sin(iteration * 0.61) * 0.08, 0.22, 0.72)
    dissipation = clamp(0.982 - iteration * 0.002, 0.94, 0.99)
    tempo_scalar = clamp(1.0 + math.sin(iteration * 0.37) * 0.18, 0.72, 1.28)
    master_gain = clamp(0.2 + math.cos(iteration * 0.3) * 0.025, 0.12, 0.28)

    return EngineIteration(
        iteration=iteration,
        name=f"Wardenclyffe iteration {iteration:02d}",
        tempo_scalar=round(tempo_scalar, 4),
        flow_viscosity=round(viscosity, 4),
        flow_dissipation=round(dissipation, 4),
        master_gain=round(master_gain, 4),
        layers=[shift_layer(layer, iteration) for layer in BASE_LAYERS.values()],
    )


def generate(count: int = 12) -> Iterable[EngineIteration]:
    for iteration in range(count):
        yield make_iteration(iteration)


def main() -> None:
    payload = {
        "schema": "wardenclyffe.engine.iterations.v1",
        "description": "Offline recipe set for Wardenclyffe audio and liquid-light experiments.",
        "runtime": {
            "css": "renders liquid-light and responsive field layers",
            "javascript": "owns consent-first Web Audio graph",
            "python": "generates deterministic iteration recipes",
            "cpp_wasm": "future scalar-field/DSP kernel",
        },
        "iterations": [asdict(item) for item in generate()],
    }
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
