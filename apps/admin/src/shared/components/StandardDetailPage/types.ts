// StandardDetailPage 类型定义

import { ReactNode } from "react";
import { ButtonType } from "antd/es/button";

/**
 * Header 类型
 */
export type HeaderType = 'simple' | 'avatar';

/**
 * 字段类型
 */
export type FieldType = 'text' | 'datetime' | 'date' | 'image' | 'tag' | 'relation' | 'currency' | 'number';

/**
 * 字段配置
 */
export interface FieldConfig {
  key: string;                           // 字段名（支持嵌套：category.name）
  label: string;                         // 字段标签
  type?: FieldType;                      // 字段类型
  render?: (value: any, entity: any) => ReactNode;  // 自定义渲染
}

/**
 * 状态配置
 */
export interface StatusConfig {
  color: string;                         // Tag 颜色
  text: string;                          // 显示文本
}

/**
 * Header 标签配置
 */
export interface TagConfig {
  field?: string;                        // 字段名
  color?: string;                        // 颜色
  text?: string;                         // 文本
  render?: (entity: any) => ReactNode;   // 自定义渲染
}

/**
 * Tab 配置
 */
export interface TabConfig {
  key: string;                           // Tab key
  label: string;                         // Tab 标签
  render?: (entity: any) => ReactNode;   // 自定义渲染内容
  component?: ReactNode;                 // 预定义组件
  countField?: string;                   // 数量显示字段（可选，如 _count.handlers）
}

/**
 * 操作配置
 */
export interface ActionConfig {
  key: string;                           // 操作 key
  label: string;                         // 操作标签
  icon?: ReactNode;                      // 图标
  permission?: string;                   // 权限标识（可选）
  handler?: (entity: any) => void;       // 操作处理函数
  type?: ButtonType;                     // 按钮类型
  danger?: boolean;                      // 是否危险操作
}

/**
 * 统计卡片配置
 */
export interface StatisticConfig {
  title: string;                         // 统计项标题
  field?: string;                        // 统计字段名（可选）
  value?: number;                        // 固定值（可选）
  icon?: ReactNode;                      // 图标
  color?: string;                        // 颜色
  precision?: number;                    // 数字精度（默认0）
  prefix?: ReactNode;                    // 前缀
  suffix?: ReactNode;                    // 后缀
}

/**
 * 权限配置
 */
export interface PermissionConfig {
  update?: string;                       // 更新权限
  delete?: string;                       // 删除权限
}

/**
 * StandardDetailPage Props
 */
export interface StandardDetailPageProps<T = any> {
  // 必需配置
  resource: string;                      // Refine resource 名称

  // 可选配置
  maxWidth?: number;                     // 页面容器宽度（默认1200）

  // Header 配置
  headerType?: HeaderType;               // Header 类型（默认 simple）
  titleField?: string;                   // 标题字段名（默认 name）
  avatarField?: string;                  // Avatar 字段名（可选）
  statusField?: string;                  // 状态字段名（默认 status）
  statusConfig?: Record<string, StatusConfig>;  // 状态映射
  headerTags?: TagConfig[];              // Header 区域额外标签

  // Descriptions 配置
  fields?: FieldConfig[];                // 信息展示字段配置
  bordered?: boolean;                    // Descriptions bordered（默认 true）
  column?: number;                       // 列数（默认 2）

  // Tabs 配置
  tabs?: TabConfig[];                    // Tabs 配置
  defaultTab?: string;                   // 默认激活 Tab

  // 统计卡片配置
  statistics?: StatisticConfig[];        // 统计项配置

  // 操作按钮
  actions?: ActionConfig[];              // 操作按钮配置
  hideBackButton?: boolean;              // 隐藏返回按钮

  // 权限控制
  permissions?: PermissionConfig;        // 权限配置

  // Refine meta
  meta?: any;                            // useOne 的 meta 参数

  // 自定义渲染
  renderHeader?: (entity: T) => ReactNode;  // 自定义 Header
  renderDescriptions?: (entity: T) => ReactNode;  // 自定义信息展示
  renderTabContent?: (tabKey: string, entity: T) => ReactNode;  // 自定义 Tab 内容
  renderActions?: (entity: T) => ReactNode;  // 自定义操作按钮
}