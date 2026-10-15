import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Howl } from 'howler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOWLER_LOADER, type HowlerEngine } from 'ngx-howler';
import { App } from './app';
import { createToneWav } from './tone';

function mockHowl(): Howl {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    off: vi.fn(),
    unload: vi.fn(),
    volume: vi.fn(),
    rate: vi.fn(),
    loop: vi.fn(),
    on: vi.fn(),
  } as unknown as Howl;
}

function mockEngine() {
  const instances: Howl[] = [];
  const create = function () {
    const howl = mockHowl();
    instances.push(howl);
    return howl;
  };
  const engine: HowlerEngine = {
    Howl: vi.fn(create as unknown as new () => Howl),
    Howler: {} as HowlerEngine['Howler'],
  };
  return { engine, instances };
}

describe('App', () => {
  let mock: ReturnType<typeof mockEngine>;

  beforeEach(() => {
    mock = mockEngine();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HOWLER_LOADER, useValue: () => Promise.resolve(mock.engine) },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it('注册音频后 id 出现在选择区并自动选中', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await fixture.componentInstance.register({ id: 'low', label: '440Hz', frequency: 440 });
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('已注册');
    expect(text).toContain('low');
    expect(fixture.componentInstance.activeId()).toBe('low');
  });

  it('播放与音量控制调用当前实例的方法', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await fixture.componentInstance.register({ id: 'low', label: '440Hz', frequency: 440 });
    const howl = mock.instances[0];
    fixture.componentInstance.play();
    expect(howl.play).toHaveBeenCalledOnce();
    fixture.componentInstance.setVolume(0.5);
    expect(howl.volume).toHaveBeenCalledWith(0.5);
    expect(fixture.componentInstance.volume()).toBe(0.5);
  });

  it('注销当前音频后自动切换到剩余音频', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await fixture.componentInstance.register({ id: 'low', label: '440Hz', frequency: 440 });
    await fixture.componentInstance.register({ id: 'high', label: '880Hz', frequency: 880 });
    fixture.componentInstance.unregister('low');
    expect(fixture.componentInstance.registered()).toEqual(['high']);
    expect(fixture.componentInstance.activeId()).toBe('high');
    expect(mock.instances[0].unload).toHaveBeenCalledOnce();
  });

  it('注销全部清空状态', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    await fixture.componentInstance.register({ id: 'low', label: '440Hz', frequency: 440 });
    fixture.componentInstance.unregisterAll();
    expect(fixture.componentInstance.registered()).toEqual([]);
    expect(fixture.componentInstance.activeId()).toBe('');
    expect(mock.instances[0].unload).toHaveBeenCalledOnce();
  });
});

describe('createToneWav', () => {
  it('生成带 WAV 头的 dataURL 且长度与参数一致', () => {
    const url = createToneWav({ frequency: 440, duration: 0.5, sampleRate: 8000 });
    expect(url.startsWith('data:audio/wav;base64,')).toBe(true);
    const binary = atob(url.slice(url.indexOf(',') + 1));
    expect(binary.length).toBe(44 + Math.floor(0.5 * 8000) * 2);
    expect(binary.slice(0, 4)).toBe('RIFF');
    expect(binary.slice(8, 12)).toBe('WAVE');
  });
});
