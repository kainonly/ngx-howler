import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Howl } from 'howler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NgxHowlerService } from './howler.service';
import { HOWLER_LOADER, type HowlerEngine } from './types';

function mockHowl(): Howl {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    off: vi.fn(),
    unload: vi.fn(),
  } as unknown as Howl;
}

function mockEngine() {
  const instances: Howl[] = [];
  const create = function () {
    const howl = mockHowl();
    instances.push(howl);
    return howl;
  };
  const Howl = vi.fn(create as unknown as new () => Howl);
  const engine: HowlerEngine = {
    Howl,
    Howler: {} as HowlerEngine['Howler'],
  };
  return { engine, instances, Howl };
}

/** 内联最小 WAV（44 字节头 + 静音样本），供真实引擎冒烟使用 */
const TINY_WAV_DATA_URL =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

describe('NgxHowlerService', () => {
  let mock: ReturnType<typeof mockEngine>;
  let load: ReturnType<typeof vi.fn<() => Promise<HowlerEngine>>>;

  beforeEach(() => {
    mock = mockEngine();
    load = vi.fn(() => Promise.resolve(mock.engine));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HOWLER_LOADER, useValue: () => load() },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('register 惰性加载引擎、透传构造参数并缓存实例', async () => {
    const service = TestBed.inject(NgxHowlerService);
    const options = { src: ['sound.mp3'], html5: true };
    const howl = await service.register('dev', options);
    expect(load).toHaveBeenCalledOnce();
    expect(mock.Howl).toHaveBeenCalledWith(options);
    expect(howl).toBe(mock.instances[0]);
    expect(service.get('dev')).toBe(howl);
    expect(service.has('dev')).toBe(true);
  });

  it('register 相同 id 幂等返回已有实例，不再加载引擎', async () => {
    const service = TestBed.inject(NgxHowlerService);
    const first = await service.register('dev', { src: ['a.mp3'] });
    const second = await service.register('dev', { src: ['b.mp3'] });
    expect(second).toBe(first);
    expect(load).toHaveBeenCalledOnce();
    expect(mock.Howl).toHaveBeenCalledOnce();
  });

  it('register 并发调用同一 id 只创建一个实例', async () => {
    const service = TestBed.inject(NgxHowlerService);
    const [a, b] = await Promise.all([
      service.register('dev', { src: ['a.mp3'] }),
      service.register('dev', { src: ['a.mp3'] }),
    ]);
    expect(a).toBe(b);
    expect(mock.Howl).toHaveBeenCalledOnce();
  });

  it('register 引擎加载失败时错误向上传播', async () => {
    load.mockReturnValue(Promise.reject(new Error('加载失败')));
    const service = TestBed.inject(NgxHowlerService);
    await expect(service.register('dev', { src: ['a.mp3'] })).rejects.toThrow('加载失败');
    expect(service.has('dev')).toBe(false);
  });

  it('服务端平台 register 返回哑实例，不加载引擎也不报错', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(NgxHowlerService);
    const howl = await service.register('dev', { src: ['a.mp3'] });
    expect(load).not.toHaveBeenCalled();
    expect(service.has('dev')).toBe(true);
    expect(service.get('dev')).toBe(howl);
    // 哑实例：空操作不抛错，状态方法返回合理默认值
    expect(() => howl.play()).not.toThrow();
    expect(() => howl.on('play', () => undefined)).not.toThrow();
    expect(howl.state()).toBe('unloaded');
    expect(howl.playing()).toBe(false);
    expect(howl.duration()).toBe(0);
    expect(howl.volume()).toBe(0);
    expect(howl.rate()).toBe(1);
    // 重复注册幂等返回同一哑实例
    await expect(service.register('dev', { src: ['a.mp3'] })).resolves.toBe(howl);
    expect(load).not.toHaveBeenCalled();
    // 注销哑实例不报错
    expect(service.unregister('dev')).toBe(true);
  });

  it('get/has 对未注册的 id 返回 undefined/false', () => {
    const service = TestBed.inject(NgxHowlerService);
    expect(service.get('missing')).toBeUndefined();
    expect(service.has('missing')).toBe(false);
  });

  it('unregister 依次执行 off+unload 并移除实例', async () => {
    const service = TestBed.inject(NgxHowlerService);
    const howl = await service.register('dev', { src: ['a.mp3'] });
    expect(service.unregister('dev')).toBe(true);
    expect(howl.off).toHaveBeenCalledOnce();
    expect(howl.unload).toHaveBeenCalledOnce();
    expect(service.has('dev')).toBe(false);
  });

  it('unregister 未注册的 id 返回 false', () => {
    const service = TestBed.inject(NgxHowlerService);
    expect(service.unregister('missing')).toBe(false);
  });

  it('unregisterAll 清空全部音频', async () => {
    const service = TestBed.inject(NgxHowlerService);
    await service.register('a', { src: ['a.mp3'] });
    await service.register('b', { src: ['b.mp3'] });
    service.unregisterAll();
    expect(service.has('a')).toBe(false);
    expect(service.has('b')).toBe(false);
    for (const howl of mock.instances) {
      expect(howl.unload).toHaveBeenCalledOnce();
    }
  });
});

describe('NgxHowlerService（真实引擎冒烟）', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('import("howler") 解析出 Howl 构造器且 html5 实例化不抛错', async () => {
    const service = TestBed.inject(NgxHowlerService);
    const howl = await service.register('smoke', { src: [TINY_WAV_DATA_URL], html5: true });
    expect(howl).toBeDefined();
    expect(service.has('smoke')).toBe(true);
    service.unregister('smoke');
  });
});
