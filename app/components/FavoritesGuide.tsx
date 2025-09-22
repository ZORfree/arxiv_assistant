'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

export default function FavoritesGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full dark:hover:bg-indigo-900/20"
        title="收藏功能使用指南"
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <HeartIcon className="h-6 w-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    收藏功能使用指南
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    🎯 功能概述
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    论文收藏功能让您可以保存感兴趣的论文，并按照不同类别进行分类管理。所有收藏数据都保存在本地浏览器中，确保您的隐私安全。
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    ❤️ 如何收藏论文
                  </h3>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <p>1. 在论文列表中，每篇论文的右上角都有一个心形图标</p>
                    <p>2. 点击空心❤️图标开始收藏</p>
                    <p>3. 选择合适的分类（识别、唤醒、大模型等）</p>
                    <p>4. 可选择添加个人备注</p>
                    <p>5. 点击&ldquo;收藏&rdquo;按钮完成</p>
                    <p>6. 已收藏的论文会显示实心❤️图标</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    📁 预设分类说明
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          识别类别
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        图像识别、语音识别、模式识别等相关论文
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          唤醒类别
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        语音唤醒、关键词检测等相关论文
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                          大模型类别
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        大语言模型、生成式AI等相关论文
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                          计算机视觉
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        计算机视觉、图像处理等相关论文
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    🗂️ 收藏夹管理
                  </h3>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <p>• <strong>查看收藏：</strong>点击页面右上角的&ldquo;收藏夹&rdquo;按钮</p>
                    <p>• <strong>分类筛选：</strong>在收藏夹左侧选择不同分类查看</p>
                    <p>• <strong>搜索功能：</strong>支持按标题、摘要、作者、备注搜索</p>
                    <p>• <strong>编辑收藏：</strong>点击论文卡片上的编辑按钮修改分类或备注</p>
                    <p>• <strong>删除收藏：</strong>点击垃圾桶图标取消收藏</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    ⚙️ 高级功能
                  </h3>
                  <div className="space-y-2 text-gray-600 dark:text-gray-300">
                    <p>• <strong>自定义分类：</strong>在收藏夹管理中添加个人分类</p>
                    <p>• <strong>数据导出：</strong>将收藏数据导出为JSON文件备份</p>
                    <p>• <strong>数据导入：</strong>从备份文件恢复收藏数据</p>
                    <p>• <strong>统计信息：</strong>右侧边栏显示收藏统计</p>
                  </div>
                </section>

                <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    💡 使用提示
                  </h3>
                  <div className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>• 收藏数据保存在本地浏览器，清除浏览器数据会丢失收藏</p>
                    <p>• 建议定期导出收藏数据进行备份</p>
                    <p>• 可以为每篇论文添加个人备注，方便后续查找</p>
                    <p>• 支持深色模式，与系统主题保持一致</p>
                  </div>
                </section>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}