# 如何修复热重载错误

## 问题
React 热重载 (Hot Module Replacement) 可能没有正确更新新添加的方法。

## 解决方案

### 步骤 1: 停止开发服务器
在运行 `npm start` 的终端中按：
```
Ctrl + C  (Windows/Linux)
或
Cmd + C  (Mac)
```

### 步骤 2: 清除缓存（可选但推荐）
```bash
# 删除 node_modules/.cache 文件夹
rm -rf node_modules/.cache

# 或者在 Windows PowerShell 中
Remove-Item -Recurse -Force node_modules\.cache
```

### 步骤 3: 重新启动开发服务器
```bash
npm start
```

### 步骤 4: 完全刷新浏览器
在浏览器中按：
```
Ctrl + Shift + R  (Windows/Linux)
或
Cmd + Shift + R  (Mac)
```

这将清除浏览器缓存并完全重新加载应用。

## 验证修复
重启后，您应该能够：
1. ✅ 在散点图上框选数据点
2. ✅ 在层级图上悬停节点（应该在散点图中看到金色光晕）
3. ✅ 点击层级图节点（两侧都高亮）
4. ✅ 没有控制台错误

## 如果问题仍然存在
检查文件是否正确保存：
- `src/components/hierarchy/Hierarchy-d3.js` 应该包含 `highlightHoveredItem` 方法
- `src/components/scatterplot/Scatterplot-d3.js` 应该包含 `highlightHoveredItem` 方法
