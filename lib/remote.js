import { n as mathInputSettingsViewSchema, t as mathInputSettingsPatchSchema } from "./remote-contract-tCKFJSyL.js";
//#region src/remote.ts
const TYPERT_REMOTE = {
	package: "dsh-math-input",
	descriptors: [{
		id: "dsh-math-input#mathInput/getSettings",
		service: "MathInput",
		namespace: "mathInput",
		method: "getSettings",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-math-input#MathInputSettingsView",
			schema: mathInputSettingsViewSchema
		}
	}, {
		id: "dsh-math-input#mathInput/updateSettings",
		service: "MathInput",
		namespace: "mathInput",
		method: "updateSettings",
		invocation: { kind: "direct" },
		parameters: [{
			name: "patch",
			wire: "patch",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "dsh-math-input#MathInputSettingsPatch",
				schema: mathInputSettingsPatchSchema
			}
		}],
		cancellation: { parameter: "signal" },
		result: {
			mode: "strict",
			typeSymbol: "dsh-math-input#MathInputSettingsView",
			schema: mathInputSettingsViewSchema
		}
	}]
};
//#endregion
export { TYPERT_REMOTE, TYPERT_REMOTE as default };

//# sourceMappingURL=remote.js.map