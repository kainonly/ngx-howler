# ngx-howler

[![npm](https://img.shields.io/npm/v/ngx-howler.svg?style=flat-square)](https://www.npmjs.com/package/ngx-howler)
[![Downloads](https://img.shields.io/npm/dm/ngx-howler.svg?style=flat-square)](https://www.npmjs.com/package/ngx-howler)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/kainonly/ngx-howler/blob/master/LICENSE)

基于 howler.js 的 Angular 音频库。howler 引擎惰性加载（SSR 安全、按需打包），无需 zone.js（zoneless），类型随包自动携带。

## 安装

本库与 Angular **大版本**保持一致即可使用（peerDependencies 为 `^22.2.0`，适配 Angular `22.x` 全系）。版本号的 `major.minor` 跟随构建时的 Angular 版本，例如 `22.2.0` 基于 Angular `22.2` 构建。安装组件与 howler 依赖：

```shell
npm install ngx-howler howler
```

## 快速开始

`NgxHowlerService` 是 `providedIn: 'root'` 的独立服务，无需导入任何 NgModule：

```typescript
import { Component, OnDestroy, inject } from '@angular/core';
import { NgxHowlerService } from 'ngx-howler';

@Component({
  selector: 'app-example',
  template: '<button type="button" (click)="play()">播放</button>',
})
export class ExampleComponent implements OnDestroy {
  private readonly howler = inject(NgxHowlerService);

  async play(): Promise<void> {
    // 首次注册时才动态加载 howler 引擎
    const howl = await this.howler.register('dev', {
      src: ['sound.mp3'],
      html5: true,
    });
    howl.play();
  }

  ngOnDestroy(): void {
    // 注销时自动 off + unload，释放音频资源
    this.howler.unregister('dev');
  }
}
```

注册的音频可通过 id 获取并控制：

```typescript
const howl = this.howler.get('dev');
howl?.play();
howl?.pause();
howl?.stop();
howl?.volume(0.5);
howl?.rate(1.5);
howl?.loop(true);
```

`register` 对同一 id 幂等：重复注册返回已有实例，不会重新创建。howler 的事件（`load` / `play` / `pause` / `stop` / `end` 等）通过实例监听：

```typescript
howl.on('end', () => {
  // 播放结束
});
```

## API

| 成员                                   | 说明                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| `register(id, options): Promise<Howl>` | 注册音频，首次调用触发引擎惰性加载；重复 id 幂等返回已有实例 |
| `get(id): Howl \| undefined`           | 获取已注册的 Howl 实例                                       |
| `has(id): boolean`                     | 是否存在指定 id                                              |
| `unregister(id): boolean`              | 注销：`off()` + `unload()` 并删除实例                        |
| `unregisterAll(): void`                | 注销全部音频                                                 |
| `HOWLER_LOADER`                        | 引擎加载器 InjectionToken，默认 `() => import('howler')`     |

## 自定义引擎加载器

默认从 npm 包动态 `import('howler')`。如需改用 CDN 或预置全局 `Howl`，在应用级覆盖 `HOWLER_LOADER`：

```typescript
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HOWLER_LOADER } from 'ngx-howler';

declare let Howl: any;

bootstrapApplication(App, {
  providers: [
    // 从全局（如 CDN script 标签）读取引擎
    {
      provide: HOWLER_LOADER,
      useValue: () => Promise.resolve({ Howl: Howl, Howler: (globalThis as any).Howler }),
    },
  ],
});
```

测试中也可用 `TestBed.overrideProvider(HOWLER_LOADER, ...)` 注入 mock 引擎。

## SSR

本库面向 CSR 使用，SSR 场景同样不会报错：服务端调用 `register` 时不加载 howler 引擎，而是返回一个哑实例——所有方法调用均为空操作（`play()` / `on()` 等不抛错），状态方法返回合理默认值（`state()` 为 `unloaded`、`playing()` 为 `false`、`duration()` 为 `0`），保证服务端渲染流程不中断；hydration 后浏览器端的调用会正常加载引擎工作。

## 运行示例

仓库根目录的 `src/` 是一个完整的示例应用，音频由运行时生成的正弦波 WAV 提供（无外部文件依赖），演示注册、播放控制（音量/速率/循环）、事件日志与注销：

```shell
git clone https://github.com/kainonly/ngx-howler.git
cd ngx-howler
npm install
npm run demo
```

打开 <http://localhost:4200> 查看效果。示例通过 `tsconfig.json` 的路径映射消费 `dist/howler` 中的构建产物，`npm run demo` 会先构建库再启动开发服务器。

## 开发

```shell
npm run check         # 库类型检查
npm run test          # 构建库并运行库 + demo 全部单元测试
npm run check:package # 打包 tgz 并验证：独立安装、无 DOM 导入、Angular AOT 消费编译
npm run format:check  # prettier 格式检查
```
