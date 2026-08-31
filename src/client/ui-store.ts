type Listener = () => void

export class MathInputUiStore {
  latexDockOpen = false
  private readonly listeners = new Set<Listener>()

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  readonly getLatexDockOpen = (): boolean => this.latexDockOpen

  toggleLatexDock(): void {
    this.latexDockOpen = !this.latexDockOpen
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}
