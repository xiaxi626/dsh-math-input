import { z } from "zod";
z.string();
const mathInputSettingsSchema = z.object({
	recognitionMode: z.enum([
		"auto",
		"number",
		"expression"
	]),
	beamWidth: z.number(),
	executionProvider: z.enum(["wasm", "webgpu"]),
	strokeDebounceSeconds: z.number(),
	language: z.string()
});
const mathInputSettingsPatchSchema = z.object({
	recognitionMode: z.enum([
		"auto",
		"number",
		"expression"
	]).optional(),
	beamWidth: z.number().optional(),
	executionProvider: z.enum(["wasm", "webgpu"]).optional(),
	strokeDebounceSeconds: z.number().optional(),
	language: z.string().optional()
});
const mathInputSettingsViewSchema = z.object({
	available: z.boolean(),
	writable: z.boolean(),
	settings: mathInputSettingsSchema,
	overridden: z.array(z.string())
});
//#endregion
export { mathInputSettingsViewSchema as n, mathInputSettingsPatchSchema as t };

//# sourceMappingURL=remote-contract-tCKFJSyL.js.map