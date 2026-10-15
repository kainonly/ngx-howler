import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { Howl, HowlOptions } from 'howler';
import { HOWLER_LOADER } from './types';

/** 有固定返回值语义的方法（其余方法一律空操作返回 undefined） */
const NOOP_RESULTS: Record<string, () => unknown> = {
  state: () => 'unloaded',
  playing: () => false,
  duration: () => 0,
  seek: () => 0,
  volume: () => 0,
  rate: () => 1,
  loop: () => false,
  mute: () => false,
};

/**
 * SSR（非浏览器平台）下返回的哑 Howl：
 * 任何方法调用均为空操作且不抛错，状态类方法返回合理默认值，保证服务端渲染流程不中断。
 */
function createNoopHowl(): Howl {
  const noop = (): undefined => undefined;
  return new Proxy({} as Howl, {
    get(_target, property) {
      // 返回 undefined 而非空函数，避免 await 将哑实例误判为 thenable 而永久挂起
      if (property === 'then' || typeof property !== 'string') {
        return undefined;
      }
      return property in NOOP_RESULTS ? NOOP_RESULTS[property] : noop;
    },
  });
}

@Injectable({ providedIn: 'root' })
export class NgxHowlerService {
  private readonly loadHowler = inject(HOWLER_LOADER);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly audio = new Map<string, Howl>();

  /**
   * 注册音频。首次调用触发 howler 引擎惰性加载；
   * 重复 id 幂等返回已有实例（含引擎加载期间的并发注册保护）。
   * 非浏览器平台（SSR）不加载引擎，返回哑实例避免报错，hydration 后浏览器端正常工作。
   */
  async register(id: string, options: HowlOptions): Promise<Howl> {
    const existing = this.audio.get(id);
    if (existing) {
      return existing;
    }
    if (!isPlatformBrowser(this.platformId)) {
      const noop = createNoopHowl();
      this.audio.set(id, noop);
      return noop;
    }
    const engine = await this.loadHowler();
    const concurrent = this.audio.get(id);
    if (concurrent) {
      return concurrent;
    }
    const howl = new engine.Howl(options);
    this.audio.set(id, howl);
    return howl;
  }

  /** 获取已注册的 Howl 实例，未注册时返回 undefined */
  get(id: string): Howl | undefined {
    return this.audio.get(id);
  }

  /** 是否存在指定 id 的音频 */
  has(id: string): boolean {
    return this.audio.has(id);
  }

  /** 注销：移除事件监听、释放音频资源并删除实例 */
  unregister(id: string): boolean {
    const howl = this.audio.get(id);
    if (!howl) {
      return false;
    }
    howl.off();
    howl.unload();
    return this.audio.delete(id);
  }

  /** 注销全部音频（应用销毁时批量清理） */
  unregisterAll(): void {
    for (const id of [...this.audio.keys()]) {
      this.unregister(id);
    }
  }
}
