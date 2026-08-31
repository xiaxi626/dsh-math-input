/** Bilingual UI strings, registered as one namespace into the DSH locale runtime. */
export type MathInputStrings = {
  settingsTitle: string
  settingsDescription: string
  loading: string
  saveFailed: string
  recognitionModeLabel: string
  recognitionModeHint: string
  modeAuto: string
  modeNumber: string
  modeExpression: string
  beamWidthLabel: string
  beamWidthHint: string
  providerLabel: string
  providerHint: string
  debounceLabel: string
  debounceHint: string
  languageLabel: string
  languageHint: string
  languagePlaceholder: string
  launcherTitle: string
  menuHandwriting: string
  menuScreenshot: string
  menuLatexEditor: string
  padTitle: string
  padRecognizing: string
  padConfirm: string
  padCancel: string
  padClear: string
  padUndo: string
  padResultLabel: string
  padSourcePlaceholder: string
  padError: string
  ocrTitle: string
  ocrPasteHint: string
  ocrUpload: string
  editorTitle: string
  editorInsert: string
  previewTitle: string
}

export const MATH_INPUT_NS = 'math-input'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'math-input': keyof MathInputStrings
  }
}

export const zh: MathInputStrings = {
  settingsTitle: '数学输入',
  settingsDescription: '手写识别、截图识别与 LaTeX 编辑器的本地设置。全部识别在浏览器内完成,不消耗 token。',
  loading: '加载中…',
  saveFailed: '保存失败,请重试',
  recognitionModeLabel: '识别模式',
  recognitionModeHint: 'auto:全部符号;number:数字与运算符;expression:数学表达式',
  modeAuto: '自动',
  modeNumber: '数字',
  modeExpression: '表达式',
  beamWidthLabel: 'Beam 宽度',
  beamWidthHint: '1 最快,3 质量最佳',
  providerLabel: '执行后端',
  providerHint: 'webgpu 自动探测,通常快 2–5 倍',
  debounceLabel: '停笔识别延迟(秒)',
  debounceHint: '停笔后自动触发识别的等待时间',
  languageLabel: '界面语言',
  languageHint: '留空跟随 DSH 语言',
  languagePlaceholder: 'zh / en,留空跟随',
  launcherTitle: '数学输入',
  menuHandwriting: '手写输入',
  menuScreenshot: '截图并识别',
  menuLatexEditor: 'LaTeX 语法编辑器',
  padTitle: '手写输入',
  padRecognizing: '识别中…',
  padConfirm: '确认插入',
  padCancel: '取消',
  padClear: '清空',
  padUndo: '撤销',
  padResultLabel: '识别结果',
  padSourcePlaceholder: 'LaTeX 源码',
  padError: '识别失败',
  ocrTitle: '截图识别',
  ocrPasteHint: 'Ctrl+V 粘贴图片,或上传文件',
  ocrUpload: '上传文件',
  editorTitle: 'LaTeX 编辑器',
  editorInsert: '插入',
  previewTitle: '预览',
}

export const en: MathInputStrings = {
  settingsTitle: 'Math Input',
  settingsDescription: 'Local settings for handwriting recognition, screenshot OCR, and the LaTeX editor. All recognition runs in your browser — zero tokens.',
  loading: 'Loading…',
  saveFailed: 'Save failed, please retry',
  recognitionModeLabel: 'Recognition mode',
  recognitionModeHint: 'auto: all symbols; number: digits and operators; expression: math expressions',
  modeAuto: 'Auto',
  modeNumber: 'Number',
  modeExpression: 'Expression',
  beamWidthLabel: 'Beam width',
  beamWidthHint: '1 is fastest, 3 gives best quality',
  providerLabel: 'Execution provider',
  providerHint: 'webgpu is auto-detected and typically 2–5x faster',
  debounceLabel: 'Stroke debounce (seconds)',
  debounceHint: 'Idle time before recognition starts automatically',
  languageLabel: 'Interface language',
  languageHint: 'Empty follows the DSH language',
  languagePlaceholder: 'zh / en, empty follows DSH',
  launcherTitle: 'Math input',
  menuHandwriting: 'Handwriting input',
  menuScreenshot: 'Screenshot and recognize',
  menuLatexEditor: 'LaTeX syntax editor',
  padTitle: 'Handwriting input',
  padRecognizing: 'Recognizing…',
  padConfirm: 'Confirm and insert',
  padCancel: 'Cancel',
  padClear: 'Clear',
  padUndo: 'Undo',
  padResultLabel: 'Recognition result',
  padSourcePlaceholder: 'LaTeX source',
  padError: 'Recognition failed',
  ocrTitle: 'Screenshot OCR',
  ocrPasteHint: 'Paste with Ctrl+V, or upload a file',
  ocrUpload: 'Upload file',
  editorTitle: 'LaTeX editor',
  editorInsert: 'Insert',
  previewTitle: 'Preview',
}
