import assert from "node:assert/strict";
import { test } from "node:test";
import { convertirConsumo } from "../src/dominio/unidades-consumo.js";
import type { UnidadConsumo } from "../src/dominio/unidades-consumo.js";

test("RF11: un metro cúbico equivale a 1000 litros", () => {
assert.equal(convertirConsumo(1, "m3", "L"), 1000);
});

test("RF11: convierte un consumo de 1250 litros a 1.25 metros cúbicos", () => {
assert.equal(convertirConsumo(1250, "L", "m3"), 1.25);
});

test("RF11: conserva el valor cuando la unidad no cambia", () => {
assert.equal(convertirConsumo(37.5, "L", "L"), 37.5);
});

test("permite un consumo medido de cero en ambas conversiones", () => {
assert.equal(convertirConsumo(0, "L", "m3"), 0);
assert.equal(convertirConsumo(0, "m3", "L"), 0);
});

test("rechaza un consumo negativo", () => {
assert.throws(() => convertirConsumo(-1, "L", "m3"), /negativo/);
});

test("rechaza valores no numéricos o no finitos", () => {
for (const valor of [NaN, Infinity, -Infinity, "100" as unknown as number]) {
    assert.throws(() => convertirConsumo(valor, "L", "m3"), /finito/);
}
});

test("rechaza unidades ajenas al contrato interno", () => {
const unidadInvalida = "gal" as UnidadConsumo;
assert.throws(() => convertirConsumo(10, unidadInvalida, "L"), /unidad/);
assert.throws(() => convertirConsumo(10, "L", unidadInvalida), /unidad/);
});

test("rechaza una conversión que desborda el rango numérico", () => {
assert.throws(() => convertirConsumo(Number.MAX_VALUE, "m3", "L"), /rango/);
});