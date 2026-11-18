export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Thai OCR Service API',
    version: '0.1.0',
    description: 'REST API สำหรับ OCR เอกสารภาษาไทยด้วย PaddleOCR',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Health', description: 'สถานะ API และ OCR Engine' },
    { name: 'Documents', description: 'Upload และจัดการเอกสาร OCR' },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'ตรวจสอบ API และ OCR Engine',
        responses: {
          '200': { description: 'ระบบพร้อมใช้งาน' },
          '503': { description: 'OCR Engine ไม่พร้อมใช้งาน' },
        },
      },
    },
    '/api/v1/health/gpu': {
      get: {
        tags: ['Health'],
        summary: 'ตรวจสอบ GPU และ VRAM availability',
        responses: { '200': { description: 'GPU health response' }, '503': { description: 'GPU ไม่พร้อมใช้งาน' } },
      },
    },
    '/api/v1/documents': {
      post: {
        tags: ['Documents'],
        summary: 'Upload เอกสารเข้า OCR queue',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file', 'document_type'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'PDF หรือ image' },
                  document_type: { $ref: '#/components/schemas/DocumentType' },
                },
              },
            },
          },
        },
        responses: {
          '202': { description: 'รับเอกสารเข้า queue แล้ว', content: { 'application/json': { schema: { $ref: '#/components/schemas/DocumentAccepted' } } } },
          '400': { description: 'ไม่มีไฟล์' },
          '413': { description: 'ไฟล์ใหญ่เกินกำหนด' },
          '422': { description: 'document_type ไม่ถูกต้อง' },
        },
      },
    },
    '/api/v1/documents/{id}': {
      get: {
        tags: ['Documents'],
        summary: 'ดูข้อมูลเอกสาร',
        parameters: [{ $ref: '#/components/parameters/DocumentId' }],
        responses: { '200': { description: 'Document metadata' }, '404': { description: 'ไม่พบเอกสาร' } },
      },
    },
    '/api/v1/documents/{id}/status': {
      get: {
        tags: ['Documents'],
        summary: 'ตรวจสอบสถานะ OCR job',
        parameters: [{ $ref: '#/components/parameters/DocumentId' }],
        responses: { '200': { description: 'Job status' }, '404': { description: 'ไม่พบเอกสาร' } },
      },
    },
    '/api/v1/documents/{id}/result': {
      get: {
        tags: ['Documents'],
        summary: 'ดึงผล OCR',
        parameters: [{ $ref: '#/components/parameters/DocumentId' }],
        responses: { '200': { description: 'OCR result', content: { 'application/json': { schema: { $ref: '#/components/schemas/OcrResult' } } } }, '409': { description: 'ผลลัพธ์ยังไม่พร้อม' }, '404': { description: 'ไม่พบเอกสาร' } },
      },
    },
    '/api/v1/documents/{id}/reprocess': {
      post: {
        tags: ['Documents'],
        summary: 'ส่งเอกสารเข้า OCR ใหม่',
        parameters: [{ $ref: '#/components/parameters/DocumentId' }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } } } },
        responses: { '202': { description: 'ส่งเข้า queue แล้ว' }, '400': { description: 'ไม่มีไฟล์' }, '404': { description: 'ไม่พบเอกสาร' } },
      },
    },
  },
  components: {
    parameters: { DocumentId: { name: 'id', in: 'path', required: true, schema: { type: 'string' } } },
    schemas: {
      DocumentType: { type: 'string', enum: ['receipt', 'tax_invoice', 'invoice'] },
      DocumentAccepted: { type: 'object', required: ['document_id', 'status', 'document_type'], properties: { document_id: { type: 'string', example: 'doc_001' }, status: { type: 'string', example: 'queued' }, document_type: { $ref: '#/components/schemas/DocumentType' } } },
      OcrLine: { type: 'object', required: ['text', 'confidence', 'bbox'], properties: { text: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 }, bbox: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'integer' } } } } },
      OcrPage: { type: 'object', required: ['page_number', 'text', 'lines'], properties: { page_number: { type: 'integer' }, text: { type: 'string' }, lines: { type: 'array', items: { $ref: '#/components/schemas/OcrLine' } } } },
      OcrResult: { type: 'object', required: ['document_id', 'status', 'document_type', 'pages'], properties: { document_id: { type: 'string' }, status: { type: 'string', example: 'completed' }, document_type: { $ref: '#/components/schemas/DocumentType' }, pages: { type: 'array', items: { $ref: '#/components/schemas/OcrPage' } } } },
    },
  },
} as const;
