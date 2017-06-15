/// <reference path="./fbjs.d.ts" />
/// <reference path="./intl-relativeformat.d.ts" />

interface RequestIdleCallback {
    didTimeout: boolean;
    timeRemaining(): number;
}

interface RequestIdleOptions {
    timeout?: number;
}

interface Window {
    cancelIdleCallback(id: number): void;
    requestIdleCallback(callback: (deadline: RequestIdleCallback) => void, options?: RequestIdleOptions): number;
}
