<script>
  import { onMount, onDestroy, untrack } from "svelte";
  import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
  import { EditorState, Compartment } from "@codemirror/state";
  import { defaultKeymap, indentWithTab } from "@codemirror/commands";
  import { json } from "@codemirror/lang-json";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { theme } from "../stores/theme.svelte.js";

  let {
    value = $bindable(""),
    readonly = false,
    height = "400px",
    onchange = null,
  } = $props();

  let container;
  let view = null;

  // Compartments allow reconfiguring individual extensions without rebuilding state
  const themeCompartment = new Compartment();
  const readonlyCompartment = new Compartment();

  const DARK_THEMES = new Set([
    "dark", "night", "dracula", "black", "luxury", "halloween",
    "forest", "aqua", "synthwave", "coffee", "dim", "sunset",
  ]);

  function isDark(t) {
    return DARK_THEMES.has(t);
  }

  // Flag to prevent re-entrant sync loop when we update the editor programmatically
  let suppressSync = false;

  function setEditorValue(text) {
    if (!view) return;
    suppressSync = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
    });
    suppressSync = false;
  }

  function initEditor() {
    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, indentWithTab]),
        json(),
        themeCompartment.of(isDark(theme.current) ? oneDark : []),
        readonlyCompartment.of(EditorState.readOnly.of(readonly)),
        EditorView.updateListener.of((update) => {
          if (suppressSync) return;
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            value = newValue;
            if (onchange) onchange(newValue);
          }
        }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
          ".cm-content": { padding: "8px 0" },
        }),
      ],
    });

    view = new EditorView({ state: startState, parent: container });
  }

  export function prettify() {
    if (!view) return;
    try {
      const formatted = JSON.stringify(JSON.parse(view.state.doc.toString()), null, 2);
      setEditorValue(formatted);
    } catch {
      // Not valid JSON — leave as-is
    }
  }

  export function getValue() {
    return view?.state.doc.toString() ?? value;
  }

  // Sync external value changes into the editor (e.g. parent resets sample payload)
  $effect(() => {
    const incoming = value;
    untrack(() => {
      if (view && !suppressSync && incoming !== view.state.doc.toString()) {
        setEditorValue(incoming);
      }
    });
  });

  // Toggle dark/light theme
  $effect(() => {
    const t = theme.current;
    untrack(() => {
      if (view) {
        view.dispatch({
          effects: themeCompartment.reconfigure(isDark(t) ? oneDark : []),
        });
      }
    });
  });

  // Toggle readonly
  $effect(() => {
    const r = readonly;
    untrack(() => {
      if (view) {
        view.dispatch({
          effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(r)),
        });
      }
    });
  });

  onMount(() => {
    initEditor();
  });

  onDestroy(() => {
    view?.destroy();
  });
</script>

<div
  style="height: {height}; width: 100%;"
  class="rounded-lg overflow-hidden border border-base-300 cm-host"
  bind:this={container}
></div>

<style>
  /* Ensure CodeMirror fills its container height properly */
  .cm-host :global(.cm-editor) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .cm-host :global(.cm-scroller) {
    flex: 1;
    min-height: 0;
  }
  .cm-host :global(.cm-editor.cm-focused) {
    outline: none;
  }
  /* Light theme background matches DaisyUI base-100 */
  .cm-host :global(.cm-editor:not(.cm-theme-dark)) {
    background: transparent;
  }
</style>
