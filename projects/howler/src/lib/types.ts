import { InjectionToken } from '@angular/core';
import type { Howl, HowlOptions, HowlerGlobal } from 'howler';

/** howler 引擎的最小表面：Howl 构造器 + 全局控制器（Howler.volume/mute 等） */
export interface HowlerEngine {
  Howl: new (options: HowlOptions) => Howl;
  Howler: HowlerGlobal;
}

/**
 * 惰性加载 howler 引擎，默认从 npm 包动态 import。
 *
 * - SSR 安全：不调用 NgxHowlerService.register 则 howler 永远不会被加载；
 * - 可替换：应用级 provider 覆盖（如改用 CDN 脚本或预置全局 Howl）；
 * - 可测试：TestBed.overrideProvider 注入 mock 引擎。
 */
export const HOWLER_LOADER = new InjectionToken<() => Promise<HowlerEngine>>('HOWLER_LOADER', {
  providedIn: 'root',
  factory: () => () => import('howler'),
});
