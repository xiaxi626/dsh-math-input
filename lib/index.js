import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import s from "@deepseek-ai/schemastery";
//#region src/config.ts
const DEFAULT_SETTINGS = Object.freeze({
	recognitionMode: "auto",
	beamWidth: 3,
	executionProvider: "wasm",
	strokeDebounceSeconds: 1.5,
	language: ""
});
const RECOGNITION_MODES = [
	"auto",
	"number",
	"expression"
];
const EXECUTION_PROVIDERS = ["wasm", "webgpu"];
function isValidBeamWidth(value) {
	return value === 1 || value === 2 || value === 3;
}
function isValidDebounceSeconds(value) {
	return Number.isFinite(value) && value >= .3 && value <= 10;
}
function validateSettings(settings) {
	if (!RECOGNITION_MODES.includes(settings.recognitionMode)) throw new Error("dsh-math-input recognition mode must be auto, number, or expression");
	if (!isValidBeamWidth(settings.beamWidth)) throw new Error("dsh-math-input beam width must be 1, 2, or 3");
	if (!EXECUTION_PROVIDERS.includes(settings.executionProvider)) throw new Error("dsh-math-input execution provider must be wasm or webgpu");
	if (!isValidDebounceSeconds(settings.strokeDebounceSeconds)) throw new Error("dsh-math-input stroke debounce must be between 0.3 and 10 seconds");
}
//#endregion
//#region src/config-schema.ts
const MathInputSettingsSchema = s.object({
	recognitionMode: s.string().default(DEFAULT_SETTINGS.recognitionMode).description("Recognition vocabulary masking: auto | number | expression"),
	beamWidth: s.number().default(DEFAULT_SETTINGS.beamWidth).description("Beam search width: 1 (greedy) | 2 | 3 (best)"),
	executionProvider: s.string().default(DEFAULT_SETTINGS.executionProvider).description("ONNX execution provider: wasm | webgpu"),
	strokeDebounceSeconds: s.number().default(DEFAULT_SETTINGS.strokeDebounceSeconds).description("Pen idle seconds before auto recognition"),
	language: s.string().default(DEFAULT_SETTINGS.language).description("UI language override; empty follows the DSH locale")
});
//#endregion
//#region src/settings-service.ts
const SETTINGS_NAMESPACE = "dsh-math-input";
var MathInputSettingsService = class extends TypertRemoteService {
	static inject = [];
	settings;
	constructor(ctx) {
		super(ctx, "MathInput", { namespace: "mathInput" });
		ctx.inject(["settings"], (settingsCtx) => {
			this.settings = settingsCtx.settings.register(settingsNamespace(SETTINGS_NAMESPACE), MathInputSettingsSchema, { validate: validateSettings });
			settingsCtx.effect(() => () => {
				this.settings = void 0;
			}, "dsh-math-input settings lifecycle");
		});
	}
	getSettings() {
		if (this.settings === void 0) return {
			available: false,
			writable: false,
			settings: { ...DEFAULT_SETTINGS },
			overridden: []
		};
		return {
			available: true,
			writable: this.ctx.get("settings")?.writable ?? false,
			settings: flattenStoredSettings(this.settings.get()),
			overridden: []
		};
	}
	async updateSettings(patch, signal) {
		if (this.settings === void 0) return this.getSettings();
		signal.throwIfAborted();
		const next = { ...flattenStoredSettings(this.settings.get()) };
		for (const [key, value] of Object.entries(patch)) if (value !== void 0) next[key] = value;
		validateSettings(next);
		await this.settings.update(next);
		return this.getSettings();
	}
};
function flattenStoredSettings(raw) {
	const record = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {};
	return {
		recognitionMode: record.recognitionMode === "number" || record.recognitionMode === "expression" ? record.recognitionMode : DEFAULT_SETTINGS.recognitionMode,
		beamWidth: record.beamWidth === 1 || record.beamWidth === 2 || record.beamWidth === 3 ? record.beamWidth : DEFAULT_SETTINGS.beamWidth,
		executionProvider: record.executionProvider === "webgpu" ? "webgpu" : DEFAULT_SETTINGS.executionProvider,
		strokeDebounceSeconds: typeof record.strokeDebounceSeconds === "number" ? record.strokeDebounceSeconds : DEFAULT_SETTINGS.strokeDebounceSeconds,
		language: typeof record.language === "string" ? record.language : DEFAULT_SETTINGS.language
	};
}
//#endregion
//#region src/index.ts
const name = "dsh-math-input";
async function apply(ctx) {
	await ctx.plugin(MathInputSettingsService);
	ctx.effect(() => () => void 0, "dsh-math-input lifecycle");
}
//#endregion
export { apply, name };

//# sourceMappingURL=index.js.map