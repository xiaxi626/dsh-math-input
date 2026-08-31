export declare const TYPERT: {
    readonly package: "dsh-math-input";
    readonly face: "host";
    readonly schemas: readonly [];
    readonly invocations: readonly [{
        readonly id: "dsh-math-input#mathInput/getSettings";
        readonly service: "MathInput";
        readonly namespace: "mathInput";
        readonly method: "getSettings";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: readonly [];
        readonly result: {
            readonly mode: "strict";
            readonly typeSymbol: "dsh-math-input#MathInputSettingsView";
            readonly schema: import("zod").ZodObject<{
                available: import("zod").ZodBoolean;
                writable: import("zod").ZodBoolean;
                settings: import("zod").ZodObject<{
                    recognitionMode: import("zod").ZodEnum<{
                        number: "number";
                        auto: "auto";
                        expression: "expression";
                    }>;
                    beamWidth: import("zod").ZodNumber;
                    executionProvider: import("zod").ZodEnum<{
                        wasm: "wasm";
                        webgpu: "webgpu";
                    }>;
                    strokeDebounceSeconds: import("zod").ZodNumber;
                    language: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                overridden: import("zod").ZodArray<import("zod").ZodString>;
            }, import("zod/v4/core").$strip>;
        };
    }, {
        readonly id: "dsh-math-input#mathInput/updateSettings";
        readonly service: "MathInput";
        readonly namespace: "mathInput";
        readonly method: "updateSettings";
        readonly invocation: {
            readonly kind: "direct";
        };
        readonly parameters: readonly [{
            readonly name: "patch";
            readonly wire: "patch";
            readonly source: "json";
            readonly codec: {
                readonly mode: "strict";
                readonly typeSymbol: "dsh-math-input#MathInputSettingsPatch";
                readonly schema: import("zod").ZodObject<{
                    recognitionMode: import("zod").ZodOptional<import("zod").ZodEnum<{
                        number: "number";
                        auto: "auto";
                        expression: "expression";
                    }>>;
                    beamWidth: import("zod").ZodOptional<import("zod").ZodNumber>;
                    executionProvider: import("zod").ZodOptional<import("zod").ZodEnum<{
                        wasm: "wasm";
                        webgpu: "webgpu";
                    }>>;
                    strokeDebounceSeconds: import("zod").ZodOptional<import("zod").ZodNumber>;
                    language: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("zod/v4/core").$strip>;
            };
        }];
        readonly cancellation: {
            readonly parameter: "signal";
        };
        readonly result: {
            readonly mode: "strict";
            readonly typeSymbol: "dsh-math-input#MathInputSettingsView";
            readonly schema: import("zod").ZodObject<{
                available: import("zod").ZodBoolean;
                writable: import("zod").ZodBoolean;
                settings: import("zod").ZodObject<{
                    recognitionMode: import("zod").ZodEnum<{
                        number: "number";
                        auto: "auto";
                        expression: "expression";
                    }>;
                    beamWidth: import("zod").ZodNumber;
                    executionProvider: import("zod").ZodEnum<{
                        wasm: "wasm";
                        webgpu: "webgpu";
                    }>;
                    strokeDebounceSeconds: import("zod").ZodNumber;
                    language: import("zod").ZodString;
                }, import("zod/v4/core").$strip>;
                overridden: import("zod").ZodArray<import("zod").ZodString>;
            }, import("zod/v4/core").$strip>;
        };
    }];
    readonly model: {
        readonly services: readonly [{
            readonly description: "Host-side settings persistence for the math input plugin.";
            readonly summary: "Math input settings service.";
            readonly tags: readonly [];
            readonly jsDoc: "/** Host-side settings persistence for the math input plugin. */";
            readonly key: "MathInput";
            readonly exportName: "MathInputSettingsService";
            readonly members: readonly [{
                readonly kind: "method";
                readonly name: "getSettings";
                readonly signature: "getSettings(): MathInputSettingsView";
                readonly summary: "Read the current plugin settings.";
                readonly jsDoc: "/** Read the current plugin settings. */";
            }, {
                readonly kind: "method";
                readonly name: "updateSettings";
                readonly signature: "updateSettings(patch: MathInputSettingsPatch, signal: AbortSignal): Promise<MathInputSettingsView>";
                readonly summary: "Update plugin settings when the request has not been cancelled.";
                readonly jsDoc: "/** Update plugin settings when the request has not been cancelled. */";
            }];
            readonly types: readonly [{
                readonly name: "MathInputSettingsView";
                readonly declaration: "export interface MathInputSettingsView { available: boolean; writable: boolean; settings: MathInputSettings; overridden: string[] }";
            }, {
                readonly name: "MathInputSettingsPatch";
                readonly declaration: "export type MathInputSettingsPatch = Partial<MathInputSettings>";
            }];
        }];
        readonly events: readonly [];
        readonly objects: readonly [];
    };
};
export default TYPERT;
