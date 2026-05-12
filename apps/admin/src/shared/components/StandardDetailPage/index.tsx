import { useParams, useNavigate } from "react-router-dom";
import { useOne } from "@refinedev/core";
import {
  Card,
  Button,
  Space,
  Tabs,
  Descriptions,
  Tag,
  Avatar,
  Row,
  Col,
  Spin,
  Empty,
  Statistic,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { PermissionGuard } from "../PermissionGuard";
import type { StandardDetailPageProps, FieldConfig, TabConfig, ActionConfig, StatisticConfig } from "./types";

/**
 * StandardDetailPage - 标准详情页面组件
 *
 * 提供完整的详情页面框架,包括:
 * - 返回按钮 + Header 区域
 * - Descriptions 信息展示
 * - Tabs 结构(基本信息 + 关联数据)
 * - 统计卡片
 * - 操作按钮
 */
export function StandardDetailPage<T extends Record<string, any> = any>(
  props: StandardDetailPageProps<T>
) {
  const {
    resource,
    maxWidth = 1200,
    headerType = 'simple',
    titleField = 'name',
    avatarField,
    statusField = 'status',
    statusConfig,
    headerTags,
    fields = [],
    bordered = true,
    column = 2,
    tabs,
    defaultTab,
    statistics = [],
    actions,
    hideBackButton = false,
    permissions,
    meta,
    renderHeader,
    renderDescriptions,
    renderTabContent,
    renderActions,
  } = props;

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab || tabs?.[0]?.key || 'info');

  // 数据获取
  const { data, isLoading, isError } = useOne<T>({
    resource,
    id: id!,
    meta,
  });

  const entity = data?.data;

  // 加载状态
  if (isLoading) {
    return (
      <div style={{ maxWidth, margin: "0 auto", padding: "24px" }}>
        <Card>
          <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
        </Card>
      </div>
    );
  }

  // 错误状态
  if (isError || !entity) {
    return (
      <div style={{ maxWidth, margin: "0 auto", padding: "24px" }}>
        <Card>
          <Empty description="数据不存在或加载失败" />
          {!hideBackButton && (
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // 获取字段值(支持嵌套字段)
  const getFieldValue = (key: string): any => {
    const keys = key.split('.');
    let value: any = entity;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return undefined;
    }
    return value;
  };

  // 渲染 Header
  const renderDefaultHeader = () => {
    const title = getFieldValue(titleField);
    const avatar = avatarField ? getFieldValue(avatarField) : undefined;
    const status = statusField ? getFieldValue(statusField) : undefined;
    const statusInfo = status && statusConfig?.[status];

    if (headerType === 'avatar') {
      return (
        <Space size="large" align="start">
          {avatar && (
            <Avatar
              size={64}
              src={avatar}
              shape="square"
            />
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>{title}</h1>
            {statusInfo && (
              <Tag color={statusInfo.color} style={{ marginTop: 8 }}>
                {statusInfo.text}
              </Tag>
            )}
            {headerTags && headerTags.map((tag, index) => (
              <Tag key={index} color={tag.color}>
                {tag.text || (tag.field ? getFieldValue(tag.field) : '')}
              </Tag>
            ))}
          </div>
        </Space>
      );
    }

    // simple 类型
    return (
      <Space>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>{title}</h1>
        {statusInfo && (
          <Tag color={statusInfo.color}>
            {statusInfo.text}
          </Tag>
        )}
        {headerTags && headerTags.map((tag, index) => (
          <Tag key={index} color={tag.color}>
            {tag.text || (tag.field ? getFieldValue(tag.field) : '')}
          </Tag>
        ))}
      </Space>
    );
  };

  // 渲染字段
  const renderField = (field: FieldConfig) => {
    const value = getFieldValue(field.key);

    if (field.render) {
      return field.render(value, entity);
    }

    // 默认渲染
    switch (field.type) {
      case 'datetime':
        return value ? new Date(value).toLocaleString("zh-CN") : '-';
      case 'date':
        return value ? new Date(value).toLocaleDateString("zh-CN") : '-';
      case 'image':
        return value ? (
          <img src={value} alt={field.label} style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover' }} />
        ) : '-';
      case 'tag':
        return value ? <Tag>{value}</Tag> : '-';
      case 'relation':
        return value?.name || value?.title || value?.username || '-';
      case 'currency':
        return value ? `¥${Number(value).toFixed(2)}` : '-';
      case 'number':
        return value ?? '-';
      case 'text':
      default:
        return value || '-';
    }
  };

  // 渲染 Descriptions
  const renderDefaultDescriptions = () => (
    <Descriptions bordered={bordered} column={column}>
      {fields.map((field) => (
        <Descriptions.Item key={field.key} label={field.label}>
          {renderField(field)}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );

  // 渲染统计卡片
  const renderStatistics = () => {
    if (statistics.length === 0) return null;

    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => {
          const value = stat.value ?? (stat.field ? getFieldValue(stat.field) : 0);

          return (
            <Col span={6} key={index}>
              <Card>
                <Statistic
                  title={stat.title}
                  value={value}
                  prefix={stat.icon}
                  suffix={stat.suffix}
                  precision={stat.precision || 0}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  // 渲染操作按钮
  const renderDefaultActions = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <Space>
        {actions.map((action) => {
          const button = (
            <Button
              key={action.key}
              type={action.type || 'default'}
              icon={action.icon}
              danger={action.danger}
              onClick={() => action.handler?.(entity)}
            >
              {action.label}
            </Button>
          );

          if (action.permission) {
            return (
              <PermissionGuard key={action.key} permission={action.permission}>
                {button}
              </PermissionGuard>
            );
          }

          return button;
        })}
      </Space>
    );
  };

  // 渲染 Tab 内容
  const renderTabPane = (tab: TabConfig) => {
    if (renderTabContent) {
      return renderTabContent(tab.key, entity);
    }

    if (tab.render) {
      return tab.render(entity);
    }

    if (tab.component) {
      return tab.component;
    }

    // 默认显示基本信息 Tab
    if (tab.key === 'info') {
      return renderDefaultDescriptions();
    }

    return <Empty description="暂无数据" />;
  };

  return (
    <div style={{ maxWidth, margin: "0 auto", padding: "24px" }}>
      <Card>
        {/* 返回按钮 */}
        {!hideBackButton && (
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16 }}
          >
            返回
          </Button>
        )}

        {/* Header */}
        {renderHeader ? renderHeader(entity) : renderDefaultHeader()}

        {/* 操作按钮 */}
        {renderActions ? renderActions(entity) : renderDefaultActions()}

        {/* 统计卡片 */}
        {renderStatistics()}

        {/* Tabs */}
        {tabs && tabs.length > 0 ? (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabs.map((tab) => ({
              key: tab.key,
              label: tab.countField
                ? `${tab.label} (${getFieldValue(tab.countField) || 0})`
                : tab.label,
              children: renderTabPane(tab),
            }))}
          />
        ) : (
          renderDefaultDescriptions()
        )}
      </Card>
    </div>
  );
}