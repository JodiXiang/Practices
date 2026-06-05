# Lullaby for Daiyu / 入梦谣 本地试玩说明

这个文件夹可以发给别人，让对方在自己的电脑上运行游戏。

## 需要先安装

- Node.js 20 或更新版本
- 下载地址：https://nodejs.org/

## Mac 启动

1. 双击 `start-mac.command`
2. 如果系统拦截，右键点击它，选择“打开”
3. 终端出现本地地址后，浏览器打开：

```text
http://127.0.0.1:4173/
```

## Windows 启动

1. 双击 `start-windows.bat`
2. 浏览器打开：

```text
http://127.0.0.1:4173/
```

## 手动启动

也可以在终端进入这个文件夹后运行：

```bash
npm start
```

## 关于模型

如果要调用 DeepSeek / 通用 OpenAI-compatible API：

1. 打开游戏右上角齿轮按钮
2. 输入 Base URL、API Key、Model
3. 点击测试

注意：不要直接双击 `index.html` 打开。直接打开文件时模型接口不能正常调用，请用上面的启动脚本或 `npm start`。
