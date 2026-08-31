import { z } from 'zod';
import type { MathInputSettings, MathInputSettingsPatch, MathInputSettingsView } from './config.js';
export declare const textSchema: z.ZodString;
export declare const mathInputSettingsSchema: z.ZodObject<{
    recognitionMode: z.ZodEnum<{
        number: "number";
        auto: "auto";
        expression: "expression";
    }>;
    beamWidth: z.ZodNumber;
    executionProvider: z.ZodEnum<{
        wasm: "wasm";
        webgpu: "webgpu";
    }>;
    strokeDebounceSeconds: z.ZodNumber;
    language: z.ZodString;
}, z.core.$strip>;
export declare const mathInputSettingsPatchSchema: z.ZodObject<{
    recognitionMode: z.ZodOptional<z.ZodEnum<{
        number: "number";
        auto: "auto";
        expression: "expression";
    }>>;
    beamWidth: z.ZodOptional<z.ZodNumber>;
    executionProvider: z.ZodOptional<z.ZodEnum<{
        wasm: "wasm";
        webgpu: "webgpu";
    }>>;
    strokeDebounceSeconds: z.ZodOptional<z.ZodNumber>;
    language: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const mathInputSettingsViewSchema: z.ZodObject<{
    available: z.ZodBoolean;
    writable: z.ZodBoolean;
    settings: z.ZodObject<{
        recognitionMode: z.ZodEnum<{
            number: "number";
            auto: "auto";
            expression: "expression";
        }>;
        beamWidth: z.ZodNumber;
        executionProvider: z.ZodEnum<{
            wasm: "wasm";
            webgpu: "webgpu";
        }>;
        strokeDebounceSeconds: z.ZodNumber;
        language: z.ZodString;
    }, z.core.$strip>;
    overridden: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type MathInputSettingsWire = z.infer<typeof mathInputSettingsSchema>;
export type MathInputSettingsPatchWire = z.infer<typeof mathInputSettingsPatchSchema>;
export type MathInputSettingsViewWire = z.infer<typeof mathInputSettingsViewSchema>;
export type { MathInputSettings, MathInputSettingsPatch, MathInputSettingsView };
