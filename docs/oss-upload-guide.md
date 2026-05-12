# OSS 前端直传上传指南

## 概述

本项目使用阿里云 OSS 实现前端直传上传,文件直接从浏览器上传到 OSS,不经过后端服务器,提高上传效率和安全性。

## 技术方案

使用 **OSS Post Policy 签名**方式实现前端直传:

1. 后端生成 Post Policy 和签名
2. 前端获取签名后直接上传到 OSS
3. 上传完成后获得文件 URL

**优势:**
- 不暴露 AccessKeySecret
- 可限制上传路径、文件大小
- 可设置过期时间
- 减轻服务器负担

## 环境变量配置

在 `apps/api/.env` 中配置以下变量:

```bash
# 文件存储提供商
FILE_STORAGE_PROVIDER=aliyun-oss

# OSS 配置
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com  # OSS endpoint
OSS_BUCKET=your-bucket-name                 # OSS bucket 名称
OSS_ACCESS_KEY_ID=your-access-key-id        # OSS AccessKey ID
OSS_ACCESS_KEY_SECRET=your-access-key-secret # OSS AccessKey Secret
OSS_REGION=oss-cn-hangzhou                  # OSS region
```

**获取方式:**

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket 或使用已有 Bucket
3. 在「访问控制」>「AccessKey 管理」中创建 AccessKey
4. 复制 Endpoint 和 Bucket 名称

## 前端使用方式

### 1. 使用 OSSUpload 组件

最简单的方式是使用封装好的 `OSSUpload` 组件:

```tsx
import { OSSUpload } from '@/shared/components/OSSUpload';

// 在表单中使用
<Form.Item label="Logo" name="logo">
  <OSSUpload
    type="merchant_logo"
    maxFileSize={5 * 1024 * 1024} // 5MB
    accept="image/jpeg,image/png,image/gif,image/webp"
  />
</Form.Item>
```

**Props:**
- `type`: 上传类型 (`'merchant_logo' | 'news_banner' | 'merchant_gallery'`)
- `maxFileSize`: 最大文件大小(字节),默认 5MB
- `accept`: 接受的文件类型,默认图片格式
- `disabled`: 是否禁用
- `showPreview`: 是否显示预览,默认 true

### 2. 使用 OSSUploader 工具类

如果需要自定义上传逻辑,可以使用工具类:

```tsx
import { OSSUploader } from '@/shared/utils/oss-upload';

// 单文件上传
const handleUpload = async (file: File) => {
  try {
    const result = await OSSUploader.upload(file, 'merchant_logo');
    console.log('上传成功:', result.url);
  } catch (error) {
    console.error('上传失败:', error);
  }
};

// 批量上传
const handleBatchUpload = async (files: File[]) => {
  const results = await OSSUploader.uploadMultiple(files, 'merchant_gallery');
  console.log('批量上传成功:', results);
};

// 验证文件
const isValid = OSSUploader.validateFileType(file, ['image/jpeg', 'image/png'])
  && OSSUploader.validateFileSize(file, 5 * 1024 * 1024);
```

## 后端 API

### getUploadCredentials

获取上传凭证:

```typescript
// tRPC 调用
const credentials = await trpc.upload.getUploadCredentials.query({
  type: 'merchant_logo'
});

// 返回数据
{
  accessKeyId: string;
  policy: string;          // Post Policy (base64)
  signature: string;       // 签名
  bucket: string;
  region: string;
  endpoint: string;
  expiration: string;      // 过期时间
}
```

## 上传流程详解

1. **获取凭证**
   - 前端调用 `getUploadCredentials` API
   - 后端生成 Post Policy 和签名
   - 返回凭证信息

2. **上传文件**
   - 前端构建 FormData
   - POST 到 OSS endpoint
   - FormData 包含: key, policy, signature, file 等

3. **获取 URL**
   - 上传成功后,OSS 返回 200
   - 前端拼接完整 URL: `{endpoint}/{key}`

## 文件存储路径

根据 `type` 自动生成路径:

- `merchant_logo`: `images/merchant_logo/{timestamp}-{random}.jpg`
- `news_banner`: `images/news_banner/{timestamp}-{random}.jpg`
- `merchant_gallery`: `images/merchant_gallery/{timestamp}-{random}.jpg`

## 安全限制

Post Policy 包含以下限制:

- **路径限制**: 只能上传到指定目录
- **大小限制**: 最大 10MB
- **时间限制**: 1小时有效期
- **签名验证**: 防止伪造请求

## 示例代码

完整的商户 Logo 上传示例:

```tsx
import { Form, Input, Button } from 'antd';
import { OSSUpload } from '@/shared/components/OSSUpload';

const MerchantForm = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    console.log('提交数据:', values);
    // values.logo 是 OSS URL
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item label="商户名称" name="name">
        <Input />
      </Form.Item>

      <Form.Item label="Logo" name="logo">
        <OSSUpload
          type="merchant_logo"
          maxFileSize={5 * 1024 * 1024}
          accept="image/jpeg,image/png,image/webp"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};
```

## 注意事项

1. **Bucket 权限设置**
   - 建议设置为「公共读,私有写」
   - 或使用「私有」并在需要时生成签名 URL

2. **跨域配置**
   - 在 OSS Bucket 设置跨域规则(CORS)
   - 允许来源: `*` 或指定域名
   - 允许方法: `POST, GET`
   - 允许 Headers: `*`

3. **文件大小**
   - Post Policy 限制最大 10MB
   - 组件默认限制 5MB
   - 可根据业务需求调整

4. **文件格式**
   - 默认支持图片格式: JPG, PNG, GIF, WEBP
   - 可通过 `accept` 参数自定义

## 相关文档

- [阿里云 OSS Post Policy 文档](https://help.aliyun.com/document_detail/31989.html)
- [OSS JavaScript SDK](https://help.aliyun.com/document_detail/64041.html)