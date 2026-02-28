import vm from "node:vm";

import React, { isValidElement, type ComponentType, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";

type EditableModuleExports = {
  default?: ComponentType;
};

export type PreviewSignals = {
  texts: string[];
  ariaLabels: string[];
  buttonTexts: string[];
  buttonCount: number;
  classNames: string[];
};

function renderNestedComponent(
  component: unknown,
  props: unknown,
): ReactNode | null {
  if (typeof component !== "function") {
    return null;
  }

  const possibleClassComponent = component as {
    prototype?: {
      isReactComponent?: boolean;
    };
  };

  if (possibleClassComponent.prototype?.isReactComponent) {
    throw new Error("Editable preview must use function components only.");
  }

  return (component as (componentProps: unknown) => ReactNode)(props);
}

function evaluateEditablePreviewModule(source: string): EditableModuleExports {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  const compiledModule = {
    exports: {},
  } as {
    exports: EditableModuleExports;
  };

  const localRequire = (specifier: string) => {
    if (specifier === "react") {
      return React;
    }

    if (specifier === "react/jsx-runtime") {
      return jsxRuntime;
    }

    throw new Error(
      `Unsupported import "${specifier}" in editable preview. Keep the component self-contained.`,
    );
  };

  const context = vm.createContext({
    module: compiledModule,
    exports: compiledModule.exports,
    require: localRequire,
    console,
  });

  const script = new vm.Script(outputText, {
    filename: EDITABLE_PREVIEW_PATH,
  });

  script.runInContext(context);
  return compiledModule.exports;
}

export function loadEditablePreviewComponent(source: string): ComponentType {
  const moduleExports = evaluateEditablePreviewModule(source);
  const component = moduleExports.default;

  if (typeof component !== "function") {
    throw new Error(
      "Editable preview must export a default React component function.",
    );
  }

  return component;
}

function collectText(node: ReactNode): string[] {
  if (node === null || node === undefined || typeof node === "boolean") {
    return [];
  }

  if (typeof node === "string" || typeof node === "number") {
    return [String(node)];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  if (!isValidElement(node)) {
    return [];
  }

  if (typeof node.type === "function") {
    return collectText(renderNestedComponent(node.type, node.props));
  }

  const props = node.props as {
    children?: ReactNode;
  };

  return collectText(props.children);
}

function inspectNode(node: ReactNode, signals: PreviewSignals) {
  if (node === null || node === undefined || typeof node === "boolean") {
    return;
  }

  if (typeof node === "string" || typeof node === "number") {
    signals.texts.push(String(node));
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((entry) => inspectNode(entry, signals));
    return;
  }

  if (!isValidElement(node)) {
    return;
  }

  if (typeof node.type === "function") {
    inspectNode(renderNestedComponent(node.type, node.props), signals);
    return;
  }

  const props = node.props as {
    children?: ReactNode;
    className?: string;
    ["aria-label"]?: string;
  };

  if (props.className) {
    signals.classNames.push(props.className);
  }

  if (props["aria-label"]) {
    signals.ariaLabels.push(props["aria-label"]);
  }

  if (node.type === "button") {
    const label = collectText(props.children).join(" ").trim();
    signals.buttonCount += 1;

    if (label) {
      signals.buttonTexts.push(label);
    }
  }

  inspectNode(props.children, signals);
}

export function inspectEditablePreview(source: string): PreviewSignals {
  const Component = loadEditablePreviewComponent(source);
  const root = React.createElement(Component);
  const signals: PreviewSignals = {
    texts: [],
    ariaLabels: [],
    buttonTexts: [],
    buttonCount: 0,
    classNames: [],
  };

  inspectNode(root, signals);
  return signals;
}

export function createEditablePreviewElement(source: string) {
  const Component = loadEditablePreviewComponent(source);
  return React.createElement(Component);
}
